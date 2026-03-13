import React, { useState } from 'react';
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, Mail, Phone, MapPin, Globe, FileText, Calendar as CalendarIcon, MessageSquare, ArrowRight, CheckCircle2, AlertCircle, Upload } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import AvailabilityCalendar from "../components/availability/AvailabilityCalendar";
import FreelancerProfileForm from "../components/freelancers/FreelancerProfileForm";
import FreelancerJobOffers from "../components/jobs/FreelancerJobOffers";
import FreelancerDashboard from "../components/freelancers/FreelancerDashboard";
import PaymentInfoForm from "../components/freelancers/PaymentInfoForm";
import QuizResultsView from "../components/quiz/QuizResultsView";
import AssignedQuizzesSection from "../components/quiz/AssignedQuizzesSection";
import ProfessionalOverview from "../components/freelancers/ProfessionalOverview";
import WorkPreferencesForm from "../components/freelancers/WorkPreferencesForm";
import PortfolioSection from "../components/freelancers/PortfolioSection";
import QuickAvailabilityToggle from "../components/availability/QuickAvailabilityToggle";
import OnboardingWarning from "../components/freelancers/OnboardingWarning";

export default function MyApplicationPage() {
    const queryClient = useQueryClient();
    const { data: user } = useQuery({
        queryKey: ['currentUser'],
        queryFn: () => base44.auth.me(),
        staleTime: 300000,
    });

    const { data: applications = [] } = useQuery({
        queryKey: ['myApplication', user?.email],
        queryFn: () => base44.entities.Freelancer.filter({ email: user?.email }),
        enabled: !!user?.email,
        staleTime: 60000,
    });

    const { data: activities = [] } = useQuery({
        queryKey: ['myActivities', applications[0]?.id],
        queryFn: () => base44.entities.FreelancerActivity.filter({ 
            freelancer_id: applications[0]?.id 
        }).then(data => data.sort((a, b) => 
            new Date(b.created_date) - new Date(a.created_date)
        )),
        enabled: !!applications[0]?.id,
        staleTime: 60000,
    });

    const application = applications[0];

    const updateFreelancerMutation = useMutation({
        mutationFn: async ({ id, data, updateType }) => {
            await base44.entities.Freelancer.update(id, data);
            await base44.functions.invoke('onboarding', { 
                action: 'notifyAdminOfUpdate', 
                freelancerId: id,
                updateType
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['myApplication'] });
            toast.dismiss();
            toast.success("Document uploaded successfully");
        },
        onError: () => {
            toast.dismiss();
            toast.error("Failed to upload document");
        }
    });

    const handleFileUpload = async (e, type) => {
        const file = e.target.files[0];
        if (!file || !application) return;

        toast.loading("Uploading...");
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        
        let updateData = {};
        let updateType = "";

        if (type === 'nda') {
            updateData = { nda_file_url: file_url, nda: true };
            updateType = "NDA Uploaded";
        } else if (type === 'portfolio') {
            updateData = { portfolio_file_url: file_url };
            updateType = "Portfolio Uploaded";
        } else if (type === 'certification') {
            const currentFiles = application.certification_files || [];
            updateData = { certification_files: [...currentFiles, file_url] };
            updateType = "Certification Uploaded";
        }

        updateFreelancerMutation.mutate({ 
            id: application.id, 
            data: updateData,
            updateType
        });
    };

    const statusColors = {
        'New Application': 'bg-blue-100 text-blue-800',
        'Form Sent': 'bg-purple-100 text-purple-800',
        'Price Negotiation': 'bg-yellow-100 text-yellow-800',
        'Test Sent': 'bg-indigo-100 text-indigo-800',
        'Approved': 'bg-green-100 text-green-800',
        'On Hold': 'bg-gray-100 text-gray-800',
        'Rejected': 'bg-red-100 text-red-800'
    };

    if (!application) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
                <Card className="max-w-md w-full border-0 shadow-lg">
                    <CardContent className="pt-12 pb-8 text-center">
                        <div className="p-4 bg-purple-100 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                            <FileText className="w-10 h-10 text-purple-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-3">No Application Found</h2>
                        <p className="text-gray-600 mb-8">You haven't submitted an application yet. Start your journey with us today.</p>
                        <Button 
                            size="lg"
                            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                            onClick={() => window.location.href = '/apply'}
                        >
                            Submit Application
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-4 lg:p-8">
            <div className="max-w-5xl mx-auto">
                {/* Quick Availability Toggle - Hero Position */}
                <div className="mb-8">
                    <QuickAvailabilityToggle freelancerId={application.id} />
                </div>

                <div className="mb-4">
                    <OnboardingWarning freelancer={application} isApplicantView />
                </div>

                <div className="mb-8">
                    <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">My Application</h1>
                    <p className="text-gray-600">Manage your freelancer profile and availability</p>
                </div>

                <Tabs defaultValue="dashboard" className="space-y-6">
                    <TabsList className="flex flex-wrap gap-1 h-auto p-1 w-full">
                        <TabsTrigger value="dashboard" className="text-xs sm:text-sm">Dashboard</TabsTrigger>
                        <TabsTrigger value="overview" className="text-xs sm:text-sm">Overview</TabsTrigger>
                        <TabsTrigger value="profile" className="text-xs sm:text-sm">Profile</TabsTrigger>
                        <TabsTrigger value="preferences" className="text-xs sm:text-sm">Prefs</TabsTrigger>
                        <TabsTrigger value="portfolio" className="text-xs sm:text-sm">Portfolio</TabsTrigger>
                        <TabsTrigger value="payment" className="text-xs sm:text-sm">Payment</TabsTrigger>
                        <TabsTrigger value="availability" className="text-xs sm:text-sm">Availability</TabsTrigger>
                        <TabsTrigger value="quizzes" className="text-xs sm:text-sm">Quizzes</TabsTrigger>
                        <TabsTrigger value="jobs" className="text-xs sm:text-sm">Jobs</TabsTrigger>
                    </TabsList>

                    <TabsContent value="dashboard" className="space-y-6">
                        <FreelancerDashboard freelancer={application} />
                    </TabsContent>

                    <TabsContent value="overview" className="space-y-6">
                        <ProfessionalOverview freelancer={application} />
                    </TabsContent>

                    {/* Dead "application" tab removed - content moved to Dashboard/Overview */}

                   {/* Legacy application tab content removed */}

                   <TabsContent value="profile" className="space-y-6">
                       <FreelancerProfileForm freelancer={application} onSaveSuccess={() => {}} />
                   </TabsContent>

                   <TabsContent value="preferences" className="space-y-6">
                       <WorkPreferencesForm freelancer={application} />
                   </TabsContent>

                   <TabsContent value="portfolio" className="space-y-6">
                       <PortfolioSection freelancer={application} />
                   </TabsContent>

                   <TabsContent value="payment" className="space-y-6">
                       <PaymentInfoForm freelancer={application} />
                   </TabsContent>

                   <TabsContent value="availability" className="space-y-6">
                        <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-white">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-3">
                                    <div className="p-3 bg-purple-100 rounded-lg">
                                        <CalendarIcon className="w-6 h-6 text-purple-600" />
                                    </div>
                                    My Availability
                                </CardTitle>
                                <p className="text-gray-600 mt-2">
                                    Set your availability to help us match you with the right projects. Click on any date to update your status.
                                </p>
                            </CardHeader>
                        </Card>
                        <AvailabilityCalendar freelancerId={application.id} readOnly={false} />
                    </TabsContent>

                   <TabsContent value="quizzes" className="space-y-6">
                        <div className="space-y-6">
                            <div>
                                <h2 className="text-2xl font-bold mb-4">Assigned Quizzes</h2>
                                <AssignedQuizzesSection freelancerId={application.id} />
                            </div>
                            <div className="border-t pt-6">
                                <h2 className="text-2xl font-bold mb-4">Quiz Results</h2>
                                <QuizResultsView freelancerId={application.id} />
                            </div>
                        </div>
                    </TabsContent>

                   <TabsContent value="jobs">
                        <FreelancerJobOffers freelancer={application} />
                    </TabsContent>
                   </Tabs>
                </div>
                </div>
                );
                }