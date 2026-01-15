import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
    ArrowLeft, Mail, Phone, MapPin, Globe, Award, Star,
    Calendar, FileText, Edit, Eye, User, Briefcase, 
    DollarSign, Clock, CheckCircle, XCircle, AlertTriangle,
    Activity, MessageSquare, Send, Loader2
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import FreelancerEditForm from "../components/freelancers/FreelancerEditForm";
import FreelancerNotesSection from "../components/freelancers/FreelancerNotesSection";
import FreelancerFilesSection from "../components/freelancers/FreelancerFilesSection";
import FreelancerEmailHistory from "../components/gmail/FreelancerEmailHistory";
import QuizAttemptsView from "../components/quiz/QuizAttemptsView";
import SendEmailDialog from "../components/freelancers/SendEmailDialog";
import QuizAssignmentDialog from "../components/quiz/QuizAssignmentDialog";
import SmartcatProfileSection from "../components/smartcat/SmartcatProfileSection";
import FreelancerQualityTab from "../components/freelancers/FreelancerQualityTab";

const statusConfig = {
    'New Application': { color: 'bg-blue-100 text-blue-800 border-blue-200', icon: User },
    'Form Sent': { color: 'bg-purple-100 text-purple-800 border-purple-200', icon: Mail },
    'Price Negotiation': { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: DollarSign },
    'Test Sent': { color: 'bg-indigo-100 text-indigo-800 border-indigo-200', icon: FileText },
    'Approved': { color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle },
    'On Hold': { color: 'bg-gray-100 text-gray-800 border-gray-200', icon: Clock },
    'Rejected': { color: 'bg-red-100 text-red-800 border-red-200', icon: XCircle },
    'Red Flag': { color: 'bg-orange-100 text-orange-800 border-orange-200', icon: AlertTriangle }
};

export default function FreelancerDetailPage() {
    const urlParams = new URLSearchParams(window.location.search);
    const rawId = urlParams.get('id');
    const freelancerId = rawId ? decodeURIComponent(rawId) : null;

    const [isEditing, setIsEditing] = useState(false);
    const [showEmailDialog, setShowEmailDialog] = useState(false);
    const [showQuizDialog, setShowQuizDialog] = useState(false);

    const queryClient = useQueryClient();

    const { data: currentUser } = useQuery({
        queryKey: ['currentUser'],
        queryFn: () => base44.auth.me(),
    });

    const { data: freelancers, isLoading } = useQuery({
        queryKey: ['freelancer', freelancerId],
        queryFn: () => base44.entities.Freelancer.filter({ id: freelancerId }),
        enabled: !!freelancerId,
        staleTime: 60000,
        retry: 3,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    });

    const freelancer = freelancers?.[0];

    const { data: activities = [] } = useQuery({
        queryKey: ['activities', freelancerId],
        queryFn: () => base44.entities.FreelancerActivity.filter({ 
            freelancer_id: freelancerId 
        }, '-created_date', 50),
        enabled: !!freelancerId && !!freelancer,
        staleTime: 60000,
        retry: 2,
        retryDelay: 2000,
    });

    const { data: quizAttempts = [] } = useQuery({
        queryKey: ['quizAttempts', freelancerId],
        queryFn: () => base44.entities.QuizAttempt.filter({ freelancer_id: freelancerId }),
        enabled: !!freelancerId && !!freelancer,
        staleTime: 60000,
        retry: 2,
        retryDelay: 2000,
    });

    const updateMutation = useMutation({
        mutationFn: (data) => base44.entities.Freelancer.update(freelancerId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['freelancer', freelancerId] });
            queryClient.invalidateQueries({ queryKey: ['freelancers'] });
            setIsEditing(false);
        },
    });

    const createActivityMutation = useMutation({
        mutationFn: (data) => base44.entities.FreelancerActivity.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['activities', freelancerId] });
        },
    });

    const handleSave = (data) => {
        updateMutation.mutate(data);
    };

    const handleUpdate = (data) => {
        updateMutation.mutate(data);
    };

    const isAdmin = currentUser?.role === 'admin';
    const isProjectManager = currentUser?.role === 'project_manager';
    const canManage = isAdmin || isProjectManager;

    const passedQuizzes = quizAttempts.filter(a => a.passed === true);
    const avgQuizScore = quizAttempts.length > 0
        ? Math.round(quizAttempts.reduce((sum, a) => sum + a.percentage, 0) / quizAttempts.length)
        : null;

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
                <div className="max-w-6xl mx-auto">
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                    </div>
                </div>
            </div>
        );
    }

    if (!freelancer) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
                <div className="max-w-6xl mx-auto text-center py-20">
                    <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Freelancer not found</h2>
                    <p className="text-gray-600 mb-6">The freelancer you're looking for doesn't exist or has been removed.</p>
                    <Link to={createPageUrl('Freelancers')}>
                        <Button>
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Freelancers
                        </Button>
                    </Link>
                </div>
            </div>
        );
    }

    const status = statusConfig[freelancer.status] || statusConfig['New Application'];
    const StatusIcon = status.icon;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <Link to={createPageUrl('Freelancers')}>
                        <Button variant="ghost" className="mb-4">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Freelancers
                        </Button>
                    </Link>
                    
                    <div className="bg-white rounded-xl shadow-sm border p-6">
                        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                            <div className="flex items-start gap-4">
                            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-2xl font-bold">
                                {freelancer.full_name?.charAt(0)?.toUpperCase() || 'F'}
                            </div>
                            <div>
                                <div className="flex items-center gap-3">
                                    <h1 className="text-2xl font-bold text-gray-900">{freelancer.full_name}</h1>
                                    {freelancer.resource_type === 'Agency' && (
                                        <Badge className="bg-purple-100 text-purple-800 border-purple-200">Agency</Badge>
                                    )}
                                </div>
                                {freelancer.resource_type === 'Agency' && freelancer.company_name && (
                                    <div className="text-lg font-medium text-purple-600">{freelancer.company_name}</div>
                                )}
                                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                                        <Badge className={`${status.color} border`}>
                                            <StatusIcon className="w-3 h-3 mr-1" />
                                            {freelancer.status}
                                        </Badge>
                                        {freelancer.resource_rating && (
                                            <Badge variant="outline" className="bg-yellow-50">
                                                <Star className="w-3 h-3 mr-1 fill-yellow-400 text-yellow-400" />
                                                {freelancer.resource_rating}%
                                            </Badge>
                                        )}
                                        {avgQuizScore !== null && (
                                            <Badge className={passedQuizzes.length > 0 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                                                <Award className="w-3 h-3 mr-1" />
                                                Quiz: {avgQuizScore}%
                                            </Badge>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-4 mt-3 text-sm text-gray-600 flex-wrap">
                                        {freelancer.email && (
                                            <a href={`mailto:${freelancer.email}`} className="flex items-center gap-1 hover:text-blue-600">
                                                <Mail className="w-4 h-4" />
                                                {freelancer.email}
                                            </a>
                                        )}
                                        {freelancer.phone && (
                                            <a href={`tel:${freelancer.phone}`} className="flex items-center gap-1 hover:text-blue-600">
                                                <Phone className="w-4 h-4" />
                                                {freelancer.phone}
                                            </a>
                                        )}
                                        {freelancer.location && (
                                            <span className="flex items-center gap-1">
                                                <MapPin className="w-4 h-4" />
                                                {freelancer.location}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            
                            <div className="flex gap-2 flex-wrap">
                                <Button variant="outline" onClick={() => setShowEmailDialog(true)}>
                                    <Send className="w-4 h-4 mr-2" />
                                    Send Email
                                </Button>
                                <Button variant="outline" onClick={() => setShowQuizDialog(true)}>
                                    <Award className="w-4 h-4 mr-2" />
                                    Assign Quiz
                                </Button>
                                {canManage && (
                                    <Button
                                        variant={isEditing ? "default" : "outline"}
                                        onClick={() => setIsEditing(!isEditing)}
                                    >
                                        {isEditing ? (
                                            <>
                                                <Eye className="w-4 h-4 mr-2" />
                                                View Mode
                                            </>
                                        ) : (
                                            <>
                                                <Edit className="w-4 h-4 mr-2" />
                                                Edit Profile
                                            </>
                                        )}
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {isEditing ? (
                    <FreelancerEditForm
                        freelancer={freelancer}
                        onSave={handleSave}
                        onCancel={() => setIsEditing(false)}
                    />
                ) : (
                    <Tabs defaultValue="overview" className="space-y-6">
                        <TabsList className="bg-white border grid w-full md:w-auto md:inline-grid md:grid-cols-4 lg:grid-cols-7 gap-1">
                            <TabsTrigger value="overview">Overview</TabsTrigger>
                            <TabsTrigger value="quality">Quality</TabsTrigger>
                            <TabsTrigger value="documents">Documents</TabsTrigger>
                            <TabsTrigger value="notes">Notes & Feedback</TabsTrigger>
                            <TabsTrigger value="emails">Email History</TabsTrigger>
                            <TabsTrigger value="quizzes">Quizzes</TabsTrigger>
                            <TabsTrigger value="activity">Activity Log</TabsTrigger>
                        </TabsList>

                        {/* Overview Tab */}
                        <TabsContent value="overview">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                <div className="lg:col-span-2 space-y-6">
                                    {/* Language Pairs */}
                                    {freelancer.language_pairs?.length > 0 && (
                                        <Card>
                                            <CardHeader>
                                                <CardTitle className="flex items-center gap-2">
                                                    <Globe className="w-5 h-5" />
                                                    Language Pairs & Rates
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="grid gap-3">
                                                    {freelancer.language_pairs.map((pair, idx) => (
                                                        <div key={idx} className="border rounded-lg p-4 bg-gray-50">
                                                            <div className="flex items-center justify-between flex-wrap gap-2">
                                                                <div className="flex items-center gap-2">
                                                                    <Badge variant="outline" className="font-medium text-base">
                                                                        {pair.source_language} → {pair.target_language}
                                                                    </Badge>
                                                                    <Badge variant="secondary">
                                                                        {pair.proficiency}
                                                                    </Badge>
                                                                </div>
                                                            </div>
                                                            {pair.rates?.length > 0 && (
                                                                <div className="mt-3 space-y-2">
                                                                    {pair.rates.map((rate, rateIdx) => (
                                                                        <div key={rateIdx} className="flex items-center gap-2 text-sm">
                                                                            <DollarSign className="w-4 h-4 text-green-600" />
                                                                            <span className="font-semibold text-green-600">
                                                                                ${rate.rate_value} {rate.currency || 'USD'}
                                                                            </span>
                                                                            <span className="text-gray-600">
                                                                                / {rate.rate_type?.replace('per_', '')}
                                                                            </span>
                                                                            {rate.specialization && (
                                                                                <Badge variant="outline" className="text-xs">
                                                                                    {rate.specialization}
                                                                                </Badge>
                                                                            )}
                                                                            {rate.tool && (
                                                                                <Badge variant="outline" className="text-xs">
                                                                                    {rate.tool}
                                                                                </Badge>
                                                                            )}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    )}

                                    {/* Services & Specializations */}
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2">
                                                <Briefcase className="w-5 h-5" />
                                                Services & Specializations
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            {freelancer.service_types?.length > 0 && (
                                                <div>
                                                    <div className="text-sm font-medium mb-2 text-gray-600">Service Types</div>
                                                    <div className="flex flex-wrap gap-2">
                                                        {freelancer.service_types.map((service, idx) => (
                                                            <Badge key={idx} className="bg-indigo-100 text-indigo-800">
                                                                {service}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                            {freelancer.specializations?.length > 0 && (
                                                <div>
                                                    <div className="text-sm font-medium mb-2 text-gray-600">Specializations</div>
                                                    <div className="flex flex-wrap gap-2">
                                                        {freelancer.specializations.map((spec, idx) => (
                                                            <Badge key={idx} variant="outline">
                                                                {spec}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                            {freelancer.software?.length > 0 && (
                                                <div>
                                                    <div className="text-sm font-medium mb-2 text-gray-600">CAT Tools & Software</div>
                                                    <div className="flex flex-wrap gap-2">
                                                        {freelancer.software.map((sw, idx) => (
                                                            <Badge key={idx} variant="secondary">
                                                                {sw}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                            {freelancer.skills?.length > 0 && (
                                                <div>
                                                    <div className="text-sm font-medium mb-2 text-gray-600">Technical Skills</div>
                                                    <div className="flex flex-wrap gap-2">
                                                        {freelancer.skills.map((skill, idx) => (
                                                            <Badge key={idx} variant="secondary">
                                                                {skill}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>

                                    {/* Experience & Education */}
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2">
                                                <Award className="w-5 h-5" />
                                                Experience & Education
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            {freelancer.experience_years && (
                                                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                                                    <div className="text-3xl font-bold text-blue-600">
                                                        {freelancer.experience_years}
                                                    </div>
                                                    <div>
                                                        <div className="font-medium">Years of Experience</div>
                                                        <div className="text-sm text-gray-600">Professional translation experience</div>
                                                    </div>
                                                </div>
                                            )}
                                            {freelancer.education && (
                                                <div>
                                                    <div className="text-sm font-medium mb-1 text-gray-600">Education</div>
                                                    <p className="text-gray-700">{freelancer.education}</p>
                                                </div>
                                            )}
                                            {freelancer.certifications?.length > 0 && (
                                                <div>
                                                    <div className="text-sm font-medium mb-2 text-gray-600">Certifications</div>
                                                    <ul className="list-disc list-inside space-y-1">
                                                        {freelancer.certifications.map((cert, idx) => (
                                                            <li key={idx} className="text-gray-700">{cert}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* Sidebar */}
                                <div className="space-y-6">
                                    {/* Quick Info */}
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>Quick Info</CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <div className="text-xs text-gray-500 uppercase">Availability</div>
                                                    <Badge className={
                                                        freelancer.availability === 'Immediate' ? 'bg-green-100 text-green-800' :
                                                        freelancer.availability === 'Not available' ? 'bg-red-100 text-red-800' :
                                                        'bg-yellow-100 text-yellow-800'
                                                    }>
                                                        {freelancer.availability || 'Not set'}
                                                    </Badge>
                                                </div>
                                                <div>
                                                    <div className="text-xs text-gray-500 uppercase">Currency</div>
                                                    <div className="font-medium">{freelancer.currency || 'USD'}</div>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <div className="text-xs text-gray-500 uppercase">NDA Signed</div>
                                                    <Badge className={freelancer.nda ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                                                        {freelancer.nda ? 'Yes' : 'No'}
                                                    </Badge>
                                                </div>
                                                <div>
                                                    <div className="text-xs text-gray-500 uppercase">Tested</div>
                                                    <Badge className={freelancer.tested ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                                                        {freelancer.tested ? 'Yes' : 'No'}
                                                    </Badge>
                                                </div>
                                            </div>
                                            {freelancer.resource_code && (
                                                <div>
                                                    <div className="text-xs text-gray-500 uppercase">Resource Code</div>
                                                    <div className="font-mono text-sm">{freelancer.resource_code}</div>
                                                </div>
                                            )}
                                            <div>
                                                <div className="text-xs text-gray-500 uppercase">Applied</div>
                                                <div className="text-sm">{new Date(freelancer.created_date).toLocaleDateString()}</div>
                                            </div>
                                            {freelancer.assigned_to && (
                                                <div>
                                                    <div className="text-xs text-gray-500 uppercase">Assigned To</div>
                                                    <div className="text-sm">{freelancer.assigned_to}</div>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>

                                    {/* Tags */}
                                    {freelancer.tags?.length > 0 && (
                                        <Card>
                                            <CardHeader>
                                                <CardTitle>Tags</CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="flex flex-wrap gap-2">
                                                    {freelancer.tags.map((tag, idx) => (
                                                        <Badge key={idx} variant="outline">
                                                            {tag}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    )}

                                    {/* Smartcat Profile */}
                                    <SmartcatProfileSection freelancerEmail={freelancer.email} />

                                    {/* Internal Notes */}
                                    {freelancer.notes && canManage && (
                                        <Card className="border-yellow-200 bg-yellow-50/50">
                                            <CardHeader>
                                                <CardTitle className="text-yellow-800">Internal Notes</CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <p className="text-sm text-gray-700 whitespace-pre-wrap">{freelancer.notes}</p>
                                            </CardContent>
                                        </Card>
                                    )}
                                </div>
                            </div>
                        </TabsContent>

                        {/* Quality Tab */}
                        <TabsContent value="quality">
                            <FreelancerQualityTab freelancerId={freelancerId} />
                        </TabsContent>

                        {/* Documents Tab */}
                        <TabsContent value="documents">
                            <Card>
                                <CardContent className="pt-6">
                                    <FreelancerFilesSection 
                                        freelancer={freelancer} 
                                        onUpdate={handleUpdate}
                                    />
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Notes Tab */}
                        <TabsContent value="notes">
                            <Card>
                                <CardContent className="pt-6">
                                    <FreelancerNotesSection 
                                        freelancerId={freelancerId}
                                        currentUser={currentUser}
                                    />
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Emails Tab */}
                        <TabsContent value="emails">
                            <Card>
                                <CardContent className="pt-6">
                                    <FreelancerEmailHistory 
                                        freelancerEmail={freelancer.email}
                                        freelancerName={freelancer.full_name}
                                    />
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Quizzes Tab */}
                        <TabsContent value="quizzes">
                            <Card>
                                <CardContent className="pt-6">
                                    <QuizAttemptsView freelancerId={freelancerId} />
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Activity Tab */}
                        <TabsContent value="activity">
                            <Card>
                                <CardContent className="pt-6">
                                    <h3 className="font-semibold text-lg mb-4">Activity Log</h3>
                                    {activities.length === 0 ? (
                                        <div className="text-center py-8 text-gray-500">
                                            <Activity className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                                            <p>No activity recorded yet</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {activities.map(activity => (
                                                <div key={activity.id} className="border-l-2 border-blue-500 pl-4 pb-4">
                                                    <div className="flex items-start justify-between">
                                                        <div>
                                                            <div className="font-medium text-sm">{activity.activity_type}</div>
                                                            <div className="text-sm text-gray-600 mt-1">{activity.description}</div>
                                                            {activity.performed_by && (
                                                                <div className="text-xs text-gray-500 mt-1">
                                                                    by {activity.performed_by.split('@')[0]}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="text-xs text-gray-500">
                                                            {new Date(activity.created_date).toLocaleDateString()}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                )}

                {/* Dialogs */}
                <SendEmailDialog
                    open={showEmailDialog}
                    onOpenChange={setShowEmailDialog}
                    freelancer={freelancer}
                />
                <QuizAssignmentDialog
                    freelancerId={freelancerId}
                    freelancerEmail={freelancer?.email}
                    open={showQuizDialog}
                    onOpenChange={setShowQuizDialog}
                />
            </div>
        </div>
    );
}