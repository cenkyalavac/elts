import React, { useMemo } from 'react';
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
    Users, FileText, Star, Plus, ArrowRight,
    Clock, AlertTriangle, CheckCircle2, TrendingUp, DollarSign,
    UserPlus, FileCheck, Award
} from "lucide-react";
import { formatDistanceToNow, isPast } from "date-fns";

import QualityOverviewStats from "../components/dashboard/QualityOverviewStats";
import QualityAlerts from "../components/dashboard/QualityAlerts";
import QualityTrendChart from "../components/dashboard/QualityTrendChart";
import TopPerformers from "../components/dashboard/TopPerformers";
import AnnouncementsBanner from "../components/dashboard/AnnouncementsBanner";

export default function Dashboard() {
    const { data: user, isLoading } = useQuery({
        queryKey: ['currentUser'],
        queryFn: async () => {
            const isAuth = await base44.auth.isAuthenticated();
            if (!isAuth) {
                base44.auth.redirectToLogin(createPageUrl('Dashboard'));
                return null;
            }
            return base44.auth.me();
        },
    });

    const { data: freelancers = [] } = useQuery({
        queryKey: ['freelancers'],
        queryFn: () => base44.entities.Freelancer.list('-created_date'),
    });

    const { data: qualityReports = [] } = useQuery({
        queryKey: ['qualityReports'],
        queryFn: () => base44.entities.QualityReport.list('-created_date'),
    });

    const { data: settings } = useQuery({
        queryKey: ['qualitySettings'],
        queryFn: async () => {
            const allSettings = await base44.entities.QualitySettings.list();
            return allSettings[0] || { lqa_weight: 4, qs_multiplier: 20, probation_threshold: 70 };
        },
    });

    const { data: quizAssignments = [] } = useQuery({
        queryKey: ['allQuizAssignments'],
        queryFn: () => base44.entities.QuizAssignment.list(),
    });

    const { data: documentSignatures = [] } = useQuery({
        queryKey: ['documentSignatures'],
        queryFn: () => base44.entities.DocumentSignature.list(),
    });

    // Pipeline stats
    const pipelineStats = useMemo(() => ({
        newApplications: freelancers.filter(f => f.status === 'New Application').length,
        inReview: freelancers.filter(f => ['Form Sent', 'Price Negotiation', 'Test Sent'].includes(f.status)).length,
        approved: freelancers.filter(f => f.status === 'Approved').length,
        total: freelancers.length
    }), [freelancers]);

    // Quality stats
    const qualityStats = useMemo(() => {
        const finalizedReports = qualityReports.filter(r => 
            r.status === 'finalized' || r.status === 'translator_accepted'
        );
        
        const lqaScores = finalizedReports.filter(r => r.lqa_score != null).map(r => r.lqa_score);
        const qsScores = finalizedReports.filter(r => r.qs_score != null).map(r => r.qs_score);
        
        const avgLqa = lqaScores.length > 0 
            ? lqaScores.reduce((a, b) => a + b, 0) / lqaScores.length 
            : null;
        const avgQs = qsScores.length > 0 
            ? qsScores.reduce((a, b) => a + b, 0) / qsScores.length 
            : null;

        const lqaWeight = settings?.lqa_weight || 4;
        const qsMultiplier = settings?.qs_multiplier || 20;
        let avgCombinedScore = null;
        
        if (avgLqa !== null && avgQs !== null) {
            avgCombinedScore = ((avgLqa * lqaWeight) + (avgQs * qsMultiplier)) / (lqaWeight + 1);
        }

        const pendingReviews = qualityReports.filter(r => 
            r.status === 'pending_translator_review' || r.status === 'pending_final_review'
        ).length;

        const disputedCount = qualityReports.filter(r => r.status === 'translator_disputed').length;

        return {
            totalReports: qualityReports.length,
            avgLqa,
            avgQs,
            avgCombinedScore,
            pendingReviews,
            disputedCount,
            approvedFreelancers: freelancers.filter(f => f.status === 'Approved').length,
            probationCount: 0
        };
    }, [qualityReports, freelancers, settings]);

    // Freelancer quality scores
    const freelancerScores = useMemo(() => {
        const lqaWeight = settings?.lqa_weight || 4;
        const qsMultiplier = settings?.qs_multiplier || 20;
        const probationThreshold = settings?.probation_threshold || 70;

        return freelancers.filter(f => f.status === 'Approved').map(f => {
            const freelancerReports = qualityReports.filter(r => 
                r.freelancer_id === f.id && 
                (r.status === 'finalized' || r.status === 'translator_accepted')
            );

            const lqaScores = freelancerReports.filter(r => r.lqa_score != null).map(r => r.lqa_score);
            const qsScores = freelancerReports.filter(r => r.qs_score != null).map(r => r.qs_score);

            const avgLqa = lqaScores.length > 0 
                ? lqaScores.reduce((a, b) => a + b, 0) / lqaScores.length 
                : null;
            const avgQs = qsScores.length > 0 
                ? qsScores.reduce((a, b) => a + b, 0) / qsScores.length 
                : null;

            let combinedScore = null;
            if (avgLqa !== null && avgQs !== null) {
                combinedScore = ((avgLqa * lqaWeight) + (avgQs * qsMultiplier)) / (lqaWeight + 1);
            } else if (avgLqa !== null) {
                combinedScore = avgLqa;
            } else if (avgQs !== null) {
                combinedScore = avgQs * qsMultiplier;
            }

            return {
                ...f,
                avgLqa,
                avgQs,
                combinedScore,
                totalReviews: freelancerReports.length,
                isProbation: combinedScore !== null && combinedScore < probationThreshold
            };
        });
    }, [freelancers, qualityReports, settings]);

    const probationFreelancers = freelancerScores.filter(f => f.isProbation);
    const lowScoreFreelancers = freelancerScores
        .filter(f => f.combinedScore !== null && f.combinedScore < 80 && !f.isProbation)
        .sort((a, b) => a.combinedScore - b.combinedScore);

    const disputedReports = qualityReports
        .filter(r => r.status === 'translator_disputed')
        .map(r => ({
            ...r,
            freelancerName: freelancers.find(f => f.id === r.freelancer_id)?.full_name || 'Unknown'
        }));

    const pendingReviews = qualityReports
        .filter(r => r.status === 'pending_translator_review' || r.status === 'pending_final_review')
        .map(r => ({
            ...r,
            freelancerName: freelancers.find(f => f.id === r.freelancer_id)?.full_name || 'Unknown'
        }));

    // Document stats
    const pendingDocuments = documentSignatures.filter(s => s.status === 'pending').length;

    // Quiz stats
    const pendingQuizzes = quizAssignments.filter(a => a.status === 'pending').length;
    const overdueQuizzes = quizAssignments.filter(a => 
        a.status !== 'completed' && a.deadline && isPast(new Date(a.deadline))
    ).length;

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    if (!user || (user.role !== 'admin' && user.role !== 'project_manager')) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
                <div className="max-w-4xl mx-auto text-center mt-20">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
                    <p className="text-gray-600">This page is only for administrators and project managers.</p>
                </div>
            </div>
        );
    }

    const updatedQualityStats = {
        ...qualityStats,
        probationCount: probationFreelancers.length
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-50 p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                        <p className="text-gray-600 mt-1">Welcome back, {user.full_name || user.email?.split('@')[0]}</p>
                    </div>
                    <div className="flex gap-2">
                        <Link to={createPageUrl('QualityManagement')}>
                            <Button className="bg-purple-600 hover:bg-purple-700">
                                <Plus className="w-4 h-4 mr-2" />
                                New Report
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Announcements Banner */}
                <AnnouncementsBanner />

                {/* Key Metrics Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-blue-100 text-sm">New Applications</p>
                                    <p className="text-3xl font-bold">{pipelineStats.newApplications}</p>
                                </div>
                                <UserPlus className="w-10 h-10 text-blue-200" />
                            </div>
                            <Link to={createPageUrl('Freelancers')} className="text-xs text-blue-100 hover:text-white mt-2 inline-flex items-center gap-1">
                                View all <ArrowRight className="w-3 h-3" />
                            </Link>
                        </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-amber-500 to-orange-500 text-white">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-amber-100 text-sm">In Review</p>
                                    <p className="text-3xl font-bold">{pipelineStats.inReview}</p>
                                </div>
                                <Clock className="w-10 h-10 text-amber-200" />
                            </div>
                            <Link to={createPageUrl('Freelancers')} className="text-xs text-amber-100 hover:text-white mt-2 inline-flex items-center gap-1">
                                Manage <ArrowRight className="w-3 h-3" />
                            </Link>
                        </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-green-500 to-emerald-500 text-white">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-green-100 text-sm">Approved</p>
                                    <p className="text-3xl font-bold">{pipelineStats.approved}</p>
                                </div>
                                <CheckCircle2 className="w-10 h-10 text-green-200" />
                            </div>
                            <p className="text-xs text-green-100 mt-2">Active freelancers</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-purple-100 text-sm">Avg Quality</p>
                                    <p className="text-3xl font-bold">
                                        {qualityStats.avgCombinedScore?.toFixed(0) || '--'}
                                    </p>
                                </div>
                                <Star className="w-10 h-10 text-purple-200" />
                            </div>
                            <Link to={createPageUrl('QualityManagement')} className="text-xs text-purple-100 hover:text-white mt-2 inline-flex items-center gap-1">
                                Details <ArrowRight className="w-3 h-3" />
                            </Link>
                        </CardContent>
                    </Card>
                </div>

                {/* Action Items */}
                {(pipelineStats.newApplications > 0 || qualityStats.disputedCount > 0 || pendingDocuments > 0 || overdueQuizzes > 0) && (
                    <Card className="border-l-4 border-l-amber-500 bg-amber-50">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg flex items-center gap-2 text-amber-800">
                                <AlertTriangle className="w-5 h-5" />
                                Action Required
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-wrap gap-3">
                                {pipelineStats.newApplications > 0 && (
                                    <Link to={createPageUrl('Freelancers')}>
                                        <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200 cursor-pointer px-3 py-1.5">
                                            <UserPlus className="w-3 h-3 mr-1" />
                                            {pipelineStats.newApplications} new applications to review
                                        </Badge>
                                    </Link>
                                )}
                                {qualityStats.disputedCount > 0 && (
                                    <Link to={createPageUrl('QualityManagement')}>
                                        <Badge className="bg-red-100 text-red-800 hover:bg-red-200 cursor-pointer px-3 py-1.5">
                                            <AlertTriangle className="w-3 h-3 mr-1" />
                                            {qualityStats.disputedCount} disputed reports
                                        </Badge>
                                    </Link>
                                )}
                                {pendingDocuments > 0 && (
                                    <Link to={createPageUrl('DocumentCompliance')}>
                                        <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-200 cursor-pointer px-3 py-1.5">
                                            <FileCheck className="w-3 h-3 mr-1" />
                                            {pendingDocuments} pending signatures
                                        </Badge>
                                    </Link>
                                )}
                                {overdueQuizzes > 0 && (
                                    <Link to={createPageUrl('QuizManagement')}>
                                        <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-200 cursor-pointer px-3 py-1.5">
                                            <Award className="w-3 h-3 mr-1" />
                                            {overdueQuizzes} overdue quizzes
                                        </Badge>
                                    </Link>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Main Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column - Charts & Stats */}
                    <div className="lg:col-span-2 space-y-6">
                        <QualityTrendChart reports={qualityReports} settings={settings} />
                        <QualityOverviewStats stats={updatedQualityStats} />
                    </div>

                    {/* Right Column - Alerts & Top Performers */}
                    <div className="space-y-6">
                        <QualityAlerts 
                            probationFreelancers={probationFreelancers}
                            disputedReports={disputedReports}
                            pendingReviews={pendingReviews}
                            lowScoreFreelancers={lowScoreFreelancers}
                        />
                        <TopPerformers freelancers={freelancerScores} />
                    </div>
                </div>

                {/* Quick Navigation */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg">Quick Access</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                            <Link to={createPageUrl('Freelancers')}>
                                <Button variant="outline" className="w-full justify-start h-auto py-4">
                                    <div className="flex flex-col items-start">
                                        <Users className="w-5 h-5 mb-1 text-blue-600" />
                                        <span className="font-medium">Freelancers</span>
                                        <span className="text-xs text-gray-500">Pipeline & profiles</span>
                                    </div>
                                </Button>
                            </Link>
                            <Link to={createPageUrl('QualityManagement')}>
                                <Button variant="outline" className="w-full justify-start h-auto py-4">
                                    <div className="flex flex-col items-start">
                                        <Star className="w-5 h-5 mb-1 text-purple-600" />
                                        <span className="font-medium">Quality</span>
                                        <span className="text-xs text-gray-500">Reports & scores</span>
                                    </div>
                                </Button>
                            </Link>
                            <Link to={createPageUrl('SmartcatIntegration')}>
                                <Button variant="outline" className="w-full justify-start h-auto py-4">
                                    <div className="flex flex-col items-start">
                                        <DollarSign className="w-5 h-5 mb-1 text-green-600" />
                                        <span className="font-medium">Payments</span>
                                        <span className="text-xs text-gray-500">Smartcat & TBMS</span>
                                    </div>
                                </Button>
                            </Link>
                            <Link to={createPageUrl('DocumentCompliance')}>
                                <Button variant="outline" className="w-full justify-start h-auto py-4">
                                    <div className="flex flex-col items-start">
                                        <FileText className="w-5 h-5 mb-1 text-orange-600" />
                                        <span className="font-medium">Documents</span>
                                        <span className="text-xs text-gray-500">NDAs & contracts</span>
                                    </div>
                                </Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}