import React, { useState } from 'react';
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Link } from 'react-router-dom';
import { createPageUrl } from "../utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
    Rocket, CheckCircle2, Circle, ChevronRight, User, Calendar, 
    FileText, Mail, Star, Award, Play, BookOpen, HelpCircle,
    Users, DollarSign, MessageSquare, Settings, Video, ExternalLink
} from "lucide-react";
import OnboardingChecklist from "../components/onboarding/OnboardingChecklist";
import { FeatureTour } from "../components/onboarding/FeatureTooltip";

const TOUR_STEPS = {
    applicant: [
        { 
            id: 'welcome', 
            title: 'Welcome to el turco!', 
            description: 'We\'re excited to have you here. This quick tour will show you around the platform and help you get started.',
            icon: Rocket 
        },
        { 
            id: 'profile', 
            title: 'Complete Your Profile', 
            description: 'Your profile is your first impression. Add your language pairs, skills, and experience to stand out.',
            icon: User 
        },
        { 
            id: 'availability', 
            title: 'Set Your Availability', 
            description: 'Let us know when you\'re available. You can also connect your Google Calendar for automatic sync.',
            icon: Calendar 
        },
        { 
            id: 'messages', 
            title: 'Stay Connected', 
            description: 'Check your messages regularly. Our team may reach out about opportunities or your application status.',
            icon: MessageSquare 
        },
        { 
            id: 'support', 
            title: 'Need Help?', 
            description: 'Visit the Support Center anytime you have questions. Our AI assistant can help you find answers quickly.',
            icon: HelpCircle 
        },
    ],
    admin: [
        { 
            id: 'welcome', 
            title: 'Welcome, Admin!', 
            description: 'Let\'s set up your workspace. This tour covers the essential tools for managing your freelancer network.',
            icon: Rocket 
        },
        { 
            id: 'freelancers', 
            title: 'Manage Freelancers', 
            description: 'View, filter, and manage all freelancers from the Freelancers page. Track their progress through your pipeline.',
            icon: Users 
        },
        { 
            id: 'quality', 
            title: 'Quality Management', 
            description: 'Create LQA and QS reports to track translator performance. Set up automated scoring and alerts.',
            icon: Star 
        },
        { 
            id: 'payments', 
            title: 'Payment Integration', 
            description: 'Connect with Smartcat to manage payments, import TBMS data, and sync your team.',
            icon: DollarSign 
        },
        { 
            id: 'settings', 
            title: 'Configure Settings', 
            description: 'Set up email templates, pipeline stages, and integrations in the Settings page.',
            icon: Settings 
        },
    ],
    project_manager: [
        { 
            id: 'welcome', 
            title: 'Welcome, Project Manager!', 
            description: 'Here\'s a quick overview of the tools available to help you manage translation projects.',
            icon: Rocket 
        },
        { 
            id: 'freelancers', 
            title: 'Find the Right Translator', 
            description: 'Browse the freelancer pool, filter by language pair, specialization, and availability.',
            icon: Users 
        },
        { 
            id: 'quality', 
            title: 'Track Quality', 
            description: 'Create quality reports and view performance analytics for your team members.',
            icon: Star 
        },
        { 
            id: 'messages', 
            title: 'Communicate', 
            description: 'Use the messaging system to coordinate with freelancers and team members.',
            icon: MessageSquare 
        },
    ]
};

const RESOURCES = [
    {
        title: 'Platform Overview',
        description: 'Learn about all the features available to you',
        icon: BookOpen,
        type: 'guide',
    },
    {
        title: 'Profile Best Practices',
        description: 'Tips for creating a standout profile',
        icon: User,
        type: 'guide',
    },
    {
        title: 'Quality Standards',
        description: 'Understanding LQA and quality scoring',
        icon: Star,
        type: 'guide',
    },
    {
        title: 'Payment Process',
        description: 'How and when you get paid',
        icon: DollarSign,
        type: 'guide',
    },
];

export default function GettingStartedPage() {
    const [showTour, setShowTour] = useState(false);
    const [tourCompleted, setTourCompleted] = useState(false);

    const staleTime = 300000; // 5 minutes for all queries

    const { data: user, isLoading: userLoading } = useQuery({
        queryKey: ['currentUser'],
        queryFn: () => base44.auth.me(),
        staleTime,
    });

    const { data: freelancers = [] } = useQuery({
        queryKey: ['myFreelancerProfile'],
        queryFn: () => base44.entities.Freelancer.list(),
        enabled: !!user,
        staleTime,
        refetchOnMount: false,
    });

    const { data: availability = [] } = useQuery({
        queryKey: ['myAvailability'],
        queryFn: () => base44.entities.Availability.list(),
        enabled: !!user,
        staleTime,
        refetchOnMount: false,
    });

    const { data: documents = [] } = useQuery({
        queryKey: ['documents'],
        queryFn: () => base44.entities.Document.list(),
        enabled: !!user && user.role === 'admin',
        staleTime,
        refetchOnMount: false,
    });

    const { data: quizzes = [] } = useQuery({
        queryKey: ['quizzes'],
        queryFn: () => base44.entities.Quiz.list(),
        enabled: !!user,
        staleTime,
        refetchOnMount: false,
    });

    const { data: positions = [] } = useQuery({
        queryKey: ['positions'],
        queryFn: () => base44.entities.OpenPosition.list(),
        enabled: !!user && user.role === 'admin',
        staleTime,
        refetchOnMount: false,
    });

    const { data: quizAssignments = [] } = useQuery({
        queryKey: ['myQuizAssignments'],
        queryFn: () => base44.entities.QuizAssignment.list(),
        enabled: !!user,
        staleTime,
        refetchOnMount: false,
    });

    const { data: qualityReports = [] } = useQuery({
        queryKey: ['qualityReports'],
        queryFn: () => base44.entities.QualityReport.list(),
        enabled: !!user && (user.role === 'admin' || user.role === 'project_manager'),
        staleTime,
        refetchOnMount: false,
    });

    if (userLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600" />
            </div>
        );
    }

    const role = user?.role || 'applicant';
    const myFreelancer = freelancers.find(f => f.user_id === user?.id || f.email === user?.email);
    const myAvailability = availability.filter(a => a.freelancer_id === myFreelancer?.id);
    const myAssignments = quizAssignments.filter(a => a.freelancer_id === myFreelancer?.id);
    const myReportsCreated = qualityReports.filter(r => r.reviewer_id === user?.id || r.created_by === user?.email);

    const checklistData = {
        freelancer: myFreelancer,
        availabilityCount: myAvailability.length,
        calendarConnected: false, // Would need to check user settings
        allDocumentsSigned: true, // Simplified
        pendingQuizzes: myAssignments.filter(a => a.status === 'pending').length,
        gmailConnected: true, // Would need to check
        documentsCount: documents.length,
        quizzesCount: quizzes.length,
        positionsCount: positions.length,
        qualityReportsCreated: myReportsCreated.length,
    };

    const tourSteps = TOUR_STEPS[role] || TOUR_STEPS.applicant;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-50 p-6">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                            <Rocket className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Getting Started</h1>
                            <p className="text-gray-600">
                                Welcome, {user?.full_name || user?.email?.split('@')[0]}! Let's get you set up.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Quick Tour Button */}
                {!tourCompleted && (
                    <Card className="mb-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0">
                        <CardContent className="py-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <Play className="w-10 h-10" />
                                    <div>
                                        <h3 className="text-xl font-semibold">Take a Quick Tour</h3>
                                        <p className="text-purple-100">
                                            New here? Let us show you around in 2 minutes.
                                        </p>
                                    </div>
                                </div>
                                <Button 
                                    onClick={() => setShowTour(true)}
                                    variant="secondary"
                                    size="lg"
                                >
                                    <Play className="w-4 h-4 mr-2" />
                                    Start Tour
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Checklist */}
                        <OnboardingChecklist 
                            user={user} 
                            data={checklistData}
                        />

                        {/* Quick Links */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Quick Actions</CardTitle>
                                <CardDescription>Jump to common tasks</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 gap-3">
                                    {role === 'applicant' || role === 'freelancer' ? (
                                        <>
                                            <Link to={createPageUrl('MyApplication')}>
                                                <Button variant="outline" className="w-full justify-start h-auto py-3">
                                                    <User className="w-5 h-5 mr-3 text-purple-600" />
                                                    <span>Edit Profile</span>
                                                </Button>
                                            </Link>
                                            <Link to={createPageUrl('MyAvailability')}>
                                                <Button variant="outline" className="w-full justify-start h-auto py-3">
                                                    <Calendar className="w-5 h-5 mr-3 text-blue-600" />
                                                    <span>Set Availability</span>
                                                </Button>
                                            </Link>
                                            <Link to={createPageUrl('Messages')}>
                                                <Button variant="outline" className="w-full justify-start h-auto py-3">
                                                    <MessageSquare className="w-5 h-5 mr-3 text-green-600" />
                                                    <span>Messages</span>
                                                </Button>
                                            </Link>
                                            <Link to={createPageUrl('Support')}>
                                                <Button variant="outline" className="w-full justify-start h-auto py-3">
                                                    <HelpCircle className="w-5 h-5 mr-3 text-amber-600" />
                                                    <span>Get Help</span>
                                                </Button>
                                            </Link>
                                        </>
                                    ) : (
                                        <>
                                            <Link to={createPageUrl('Freelancers')}>
                                                <Button variant="outline" className="w-full justify-start h-auto py-3">
                                                    <Users className="w-5 h-5 mr-3 text-purple-600" />
                                                    <span>Manage Freelancers</span>
                                                </Button>
                                            </Link>
                                            <Link to={createPageUrl('QualityManagement')}>
                                                <Button variant="outline" className="w-full justify-start h-auto py-3">
                                                    <Star className="w-5 h-5 mr-3 text-amber-600" />
                                                    <span>Quality Reports</span>
                                                </Button>
                                            </Link>
                                            <Link to={createPageUrl('SmartcatIntegration')}>
                                                <Button variant="outline" className="w-full justify-start h-auto py-3">
                                                    <DollarSign className="w-5 h-5 mr-3 text-green-600" />
                                                    <span>Payments</span>
                                                </Button>
                                            </Link>
                                            <Link to={createPageUrl('Settings')}>
                                                <Button variant="outline" className="w-full justify-start h-auto py-3">
                                                    <Settings className="w-5 h-5 mr-3 text-gray-600" />
                                                    <span>Settings</span>
                                                </Button>
                                            </Link>
                                        </>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Resources */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <BookOpen className="w-5 h-5" />
                                    Resources
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {RESOURCES.map((resource, idx) => (
                                    <div 
                                        key={idx}
                                        className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors"
                                    >
                                        <resource.icon className="w-5 h-5 text-purple-600 mt-0.5" />
                                        <div>
                                            <div className="font-medium text-sm">{resource.title}</div>
                                            <div className="text-xs text-gray-500">{resource.description}</div>
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>

                        {/* Support Card */}
                        <Card className="bg-blue-50 border-blue-200">
                            <CardContent className="pt-6">
                                <div className="text-center">
                                    <HelpCircle className="w-10 h-10 text-blue-600 mx-auto mb-3" />
                                    <h3 className="font-semibold text-gray-900 mb-2">Need Help?</h3>
                                    <p className="text-sm text-gray-600 mb-4">
                                        Our support team is here to assist you with any questions.
                                    </p>
                                    <Link to={createPageUrl('Support')}>
                                        <Button className="w-full bg-blue-600 hover:bg-blue-700">
                                            Contact Support
                                        </Button>
                                    </Link>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Feature Tour */}
                {showTour && (
                    <FeatureTour 
                        steps={tourSteps}
                        onComplete={() => {
                            setShowTour(false);
                            setTourCompleted(true);
                        }}
                    />
                )}
            </div>
        </div>
    );
}