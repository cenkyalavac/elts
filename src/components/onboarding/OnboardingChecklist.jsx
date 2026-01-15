import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from "../../utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
    CheckCircle2, Circle, ChevronRight, User, Calendar, 
    FileText, Mail, Star, Award, Rocket, X
} from "lucide-react";

const CHECKLIST_ITEMS = {
    applicant: [
        {
            id: 'profile_complete',
            title: 'Complete Your Profile',
            description: 'Add your skills, languages, and experience',
            link: 'MyApplication',
            icon: User,
            check: (data) => {
                const f = data.freelancer;
                return f && f.full_name && f.language_pairs?.length > 0 && f.service_types?.length > 0;
            }
        },
        {
            id: 'cv_uploaded',
            title: 'Upload Your CV',
            description: 'Share your resume for review',
            link: 'MyApplication',
            icon: FileText,
            check: (data) => !!data.freelancer?.cv_file_url
        },
        {
            id: 'rates_set',
            title: 'Set Your Rates',
            description: 'Define your pricing for different services',
            link: 'MyApplication',
            icon: Star,
            check: (data) => data.freelancer?.rates?.length > 0
        },
        {
            id: 'availability_set',
            title: 'Set Your Availability',
            description: 'Let us know when you can work',
            link: 'MyAvailability',
            icon: Calendar,
            check: (data) => data.availabilityCount > 0
        },
    ],
    freelancer: [
        {
            id: 'profile_complete',
            title: 'Complete Your Profile',
            description: 'Ensure all your details are up to date',
            link: 'MyApplication',
            icon: User,
            check: (data) => {
                const f = data.freelancer;
                return f && f.full_name && f.language_pairs?.length > 0;
            }
        },
        {
            id: 'calendar_connected',
            title: 'Connect Google Calendar',
            description: 'Sync your availability automatically',
            link: 'MyAvailability',
            icon: Calendar,
            check: (data) => data.calendarConnected
        },
        {
            id: 'documents_signed',
            title: 'Sign Required Documents',
            description: 'Complete NDA and other agreements',
            link: 'MyApplication',
            icon: FileText,
            check: (data) => data.allDocumentsSigned
        },
        {
            id: 'quiz_completed',
            title: 'Complete Assigned Quizzes',
            description: 'Demonstrate your expertise',
            link: 'MyApplication',
            icon: Award,
            check: (data) => data.pendingQuizzes === 0
        },
    ],
    admin: [
        {
            id: 'gmail_connected',
            title: 'Connect Gmail',
            description: 'Enable email integration for applications',
            link: 'Settings',
            icon: Mail,
            check: (data) => data.gmailConnected
        },
        {
            id: 'documents_setup',
            title: 'Set Up Documents',
            description: 'Upload NDA and contract templates',
            link: 'DocumentCompliance',
            icon: FileText,
            check: (data) => data.documentsCount > 0
        },
        {
            id: 'quiz_created',
            title: 'Create Assessment Quizzes',
            description: 'Build tests for applicant evaluation',
            link: 'QuizManagement',
            icon: Award,
            check: (data) => data.quizzesCount > 0
        },
        {
            id: 'positions_created',
            title: 'Post Open Positions',
            description: 'Attract new freelancers',
            link: 'OpenPositions',
            icon: Star,
            check: (data) => data.positionsCount > 0
        },
    ],
    project_manager: [
        {
            id: 'explore_freelancers',
            title: 'Explore Freelancer Pool',
            description: 'Browse available translators',
            link: 'Freelancers',
            icon: User,
            check: () => true // Always marked as introductory
        },
        {
            id: 'quality_reports',
            title: 'Learn Quality Management',
            description: 'Understand how to create quality reports',
            link: 'QualityManagement',
            icon: Star,
            check: (data) => data.qualityReportsCreated > 0
        },
        {
            id: 'smartcat_overview',
            title: 'Review Payment Tools',
            description: 'Explore Smartcat integration',
            link: 'SmartcatIntegration',
            icon: FileText,
            check: () => true
        },
    ]
};

export default function OnboardingChecklist({ user, data, onDismiss, compact = false }) {
    const role = user?.role || 'applicant';
    const items = CHECKLIST_ITEMS[role] || CHECKLIST_ITEMS.applicant;

    const progress = useMemo(() => {
        const completed = items.filter(item => item.check(data)).length;
        return {
            completed,
            total: items.length,
            percentage: Math.round((completed / items.length) * 100)
        };
    }, [items, data]);

    // Don't show if all complete
    if (progress.completed === progress.total && compact) {
        return null;
    }

    if (compact) {
        return (
            <Card className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Rocket className="w-6 h-6" />
                            <div>
                                <div className="font-medium">Getting Started</div>
                                <div className="text-sm text-purple-100">
                                    {progress.completed}/{progress.total} tasks complete
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Progress value={progress.percentage} className="w-24 h-2 bg-white/30" />
                            <Link to={createPageUrl('GettingStarted')}>
                                <Button size="sm" variant="secondary">
                                    Continue
                                    <ChevronRight className="w-4 h-4 ml-1" />
                                </Button>
                            </Link>
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <Rocket className="w-5 h-5 text-purple-600" />
                        Getting Started
                    </CardTitle>
                    {onDismiss && (
                        <Button variant="ghost" size="sm" onClick={onDismiss}>
                            <X className="w-4 h-4" />
                        </Button>
                    )}
                </div>
                <div className="flex items-center gap-3 mt-2">
                    <Progress value={progress.percentage} className="flex-1 h-2" />
                    <span className="text-sm text-gray-600">
                        {progress.completed}/{progress.total} complete
                    </span>
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {items.map((item) => {
                        const isComplete = item.check(data);
                        const Icon = item.icon;
                        
                        return (
                            <Link 
                                key={item.id} 
                                to={createPageUrl(item.link)}
                                className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                                    isComplete 
                                        ? 'bg-green-50 hover:bg-green-100' 
                                        : 'bg-gray-50 hover:bg-gray-100'
                                }`}
                            >
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                    isComplete ? 'bg-green-100' : 'bg-white border'
                                }`}>
                                    {isComplete ? (
                                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                                    ) : (
                                        <Icon className="w-5 h-5 text-gray-400" />
                                    )}
                                </div>
                                <div className="flex-1">
                                    <div className={`font-medium ${isComplete ? 'text-green-800' : 'text-gray-900'}`}>
                                        {item.title}
                                    </div>
                                    <div className={`text-sm ${isComplete ? 'text-green-600' : 'text-gray-500'}`}>
                                        {isComplete ? 'Completed' : item.description}
                                    </div>
                                </div>
                                {!isComplete && (
                                    <ChevronRight className="w-5 h-5 text-gray-400" />
                                )}
                            </Link>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}