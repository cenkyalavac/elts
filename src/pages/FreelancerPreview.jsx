import React, { useState } from 'react';
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, Mail, Phone, MapPin, Globe, FileText, Calendar as CalendarIcon, CheckCircle2, AlertCircle, Eye, ArrowLeft } from "lucide-react";
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
import { createPageUrl } from "../utils";

export default function FreelancerPreviewPage() {
    const urlParams = new URLSearchParams(window.location.search);
    const freelancerId = urlParams.get('id');

    const { data: user } = useQuery({
        queryKey: ['currentUser'],
        queryFn: () => base44.auth.me(),
    });

    const { data: freelancer, isLoading } = useQuery({
        queryKey: ['freelancerPreview', freelancerId],
        queryFn: async () => {
            const freelancers = await base44.entities.Freelancer.filter({ id: freelancerId });
            return freelancers[0];
        },
        enabled: !!freelancerId,
    });

    const { data: activities = [] } = useQuery({
        queryKey: ['previewActivities', freelancerId],
        queryFn: () => base44.entities.FreelancerActivity.filter({ 
            freelancer_id: freelancerId 
        }).then(data => data.sort((a, b) => 
            new Date(b.created_date) - new Date(a.created_date)
        )),
        enabled: !!freelancerId,
    });

    const statusColors = {
        'New Application': 'bg-blue-100 text-blue-800',
        'Form Sent': 'bg-purple-100 text-purple-800',
        'Price Negotiation': 'bg-yellow-100 text-yellow-800',
        'Test Sent': 'bg-indigo-100 text-indigo-800',
        'Approved': 'bg-green-100 text-green-800',
        'On Hold': 'bg-gray-100 text-gray-800',
        'Rejected': 'bg-red-100 text-red-800'
    };

    const canManage = user?.role === 'admin' || user?.role === 'project_manager';

    if (!canManage) {
        return (
            <div className="min-h-screen bg-gray-50 p-6">
                <div className="max-w-4xl mx-auto text-center mt-20">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
                    <p className="text-gray-600">You don't have permission to view this page.</p>
                </div>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
        );
    }

    if (!freelancer) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
                <Card className="max-w-md w-full border-0 shadow-lg">
                    <CardContent className="pt-12 pb-8 text-center">
                        <div className="p-4 bg-red-100 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                            <AlertCircle className="w-10 h-10 text-red-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-3">Freelancer Not Found</h2>
                        <p className="text-gray-600 mb-8">The freelancer you're looking for doesn't exist.</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-4 lg:p-8">
            <div className="max-w-5xl mx-auto">
                {/* Preview Banner */}
                <Card className="mb-6 border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50">
                    <CardContent className="py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-purple-100 rounded-lg">
                                    <Eye className="w-5 h-5 text-purple-600" />
                                </div>
                                <div>
                                    <div className="font-semibold text-purple-900">Freelancer View Preview</div>
                                    <div className="text-sm text-purple-700">
                                        This is how {freelancer.full_name} sees their portal
                                    </div>
                                </div>
                            </div>
                            <Button
                                variant="outline"
                                onClick={() => window.history.back()}
                                className="border-purple-300"
                            >
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Back
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <div className="mb-8">
                    <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">My Application</h1>
                    <p className="text-gray-600">Manage your freelancer profile and availability</p>
                </div>

                <Tabs defaultValue="dashboard" className="space-y-6">
                    <TabsList className="grid w-full grid-cols-3 lg:grid-cols-9 h-auto">
                        <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="profile">Profile</TabsTrigger>
                        <TabsTrigger value="preferences">Preferences</TabsTrigger>
                        <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
                        <TabsTrigger value="payment">Payment</TabsTrigger>
                        <TabsTrigger value="availability">Availability</TabsTrigger>
                        <TabsTrigger value="quizzes">Quizzes</TabsTrigger>
                        <TabsTrigger value="jobs">Jobs</TabsTrigger>
                    </TabsList>

                    <TabsContent value="dashboard" className="space-y-6">
                        <FreelancerDashboard freelancer={freelancer} />
                    </TabsContent>

                    <TabsContent value="overview" className="space-y-6">
                        <ProfessionalOverview freelancer={freelancer} />
                    </TabsContent>

                    <TabsContent value="profile" className="space-y-6">
                        <Card className="border-yellow-200 bg-yellow-50">
                            <CardContent className="pt-4">
                                <div className="flex items-center gap-2 text-yellow-800">
                                    <AlertCircle className="w-4 h-4" />
                                    <span className="text-sm font-medium">
                                        Read-only preview - Freelancer can edit this information
                                    </span>
                                </div>
                            </CardContent>
                        </Card>
                        <FreelancerProfileForm freelancer={freelancer} onSaveSuccess={() => {}} readOnly={true} />
                    </TabsContent>

                    <TabsContent value="preferences" className="space-y-6">
                        <Card className="border-yellow-200 bg-yellow-50">
                            <CardContent className="pt-4">
                                <div className="flex items-center gap-2 text-yellow-800">
                                    <AlertCircle className="w-4 h-4" />
                                    <span className="text-sm font-medium">
                                        Read-only preview - Freelancer can edit this information
                                    </span>
                                </div>
                            </CardContent>
                        </Card>
                        <WorkPreferencesForm freelancer={freelancer} readOnly={true} />
                    </TabsContent>

                    <TabsContent value="portfolio" className="space-y-6">
                        <PortfolioSection freelancer={freelancer} />
                    </TabsContent>

                    <TabsContent value="payment" className="space-y-6">
                        <Card className="border-yellow-200 bg-yellow-50">
                            <CardContent className="pt-4">
                                <div className="flex items-center gap-2 text-yellow-800">
                                    <AlertCircle className="w-4 h-4" />
                                    <span className="text-sm font-medium">
                                        Read-only preview - Freelancer can edit this information
                                    </span>
                                </div>
                            </CardContent>
                        </Card>
                        <PaymentInfoForm freelancer={freelancer} readOnly={true} />
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
                        <AvailabilityCalendar freelancerId={freelancer.id} readOnly={true} />
                    </TabsContent>

                    <TabsContent value="quizzes" className="space-y-6">
                        <div className="space-y-6">
                            <div>
                                <h2 className="text-2xl font-bold mb-4">Assigned Quizzes</h2>
                                <AssignedQuizzesSection freelancerId={freelancer.id} />
                            </div>
                            <div className="border-t pt-6">
                                <h2 className="text-2xl font-bold mb-4">Quiz Results</h2>
                                <QuizResultsView freelancerId={freelancer.id} />
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="jobs">
                        <FreelancerJobOffers freelancer={freelancer} />
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}