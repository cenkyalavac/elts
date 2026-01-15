import React, { useMemo } from 'react';
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
    Users, Briefcase, FileText, Star, Plus, ArrowRight,
    Clock, AlertTriangle, CheckCircle2, TrendingUp, Zap
} from "lucide-react";
import { formatDistanceToNow, isPast } from "date-fns";

import QualityOverviewStats from "../components/dashboard/QualityOverviewStats";
import QualityAlerts from "../components/dashboard/QualityAlerts";
import QualityTrendChart from "../components/dashboard/QualityTrendChart";
import TopPerformers from "../components/dashboard/TopPerformers";

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

    const { data: quizAttempts = [] } = useQuery({
        queryKey: ['allQuizAttempts'],
        queryFn: () => base44.entities.QuizAttempt.list(),
    });

    // Calculate quality stats
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

        // Calculate combined score
        const lqaWeight = settings?.lqa_weight || 4;
        const qsMultiplier = settings?.qs_multiplier || 20;
        let avgCombinedScore = null;
        
        if (avgLqa !== null && avgQs !== null) {
            avgCombinedScore = ((avgLqa * lqaWeight) + (avgQs * qsMultiplier)) / (lqaWeight + 1);
        } else if (avgLqa !== null) {
            avgCombinedScore = avgLqa;
        } else if (avgQs !== null) {
            avgCombinedScore = avgQs * qsMultiplier;
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
            probationCount: 0 // Will be calculated below
        };
    }, [qualityReports, freelancers, settings]);

    // Calculate freelancer quality scores
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
            freelancerName: freelancers.find(f => f.id === r.freelancer_id)?.full_name || 'Bilinmiyor'
        }));

    const pendingReviews = qualityReports
        .filter(r => r.status === 'pending_translator_review' || r.status === 'pending_final_review')
        .map(r => ({
            ...r,
            freelancerName: freelancers.find(f => f.id === r.freelancer_id)?.full_name || 'Bilinmiyor'
        }));

    // Quiz stats
    const quizStats = {
        pending: quizAssignments.filter(a => a.status === 'pending').length,
        overdue: quizAssignments.filter(a => 
            a.status !== 'completed' && a.deadline && isPast(new Date(a.deadline))
        ).length,
        avgScore: quizAttempts.length > 0 
            ? Math.round(quizAttempts.reduce((sum, a) => sum + a.percentage, 0) / quizAttempts.length)
            : 0
    };

    // Loading state
    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Yükleniyor...</p>
                </div>
            </div>
        );
    }

    if (!user || (user.role !== 'admin' && user.role !== 'project_manager')) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
                <div className="max-w-4xl mx-auto text-center mt-20">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Erişim Engellendi</h2>
                    <p className="text-gray-600">Bu sayfa yalnızca yöneticiler ve proje yöneticileri içindir.</p>
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
                        <h1 className="text-3xl font-bold text-gray-900">Yönetici Paneli</h1>
                        <p className="text-gray-600 mt-1">Kalite ve performans istatistikleri</p>
                    </div>
                    <div className="flex gap-2">
                        <Link to={createPageUrl('QualityManagement')}>
                            <Button className="bg-purple-600 hover:bg-purple-700">
                                <Plus className="w-4 h-4 mr-2" />
                                Yeni Rapor
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Quality Stats Overview */}
                <QualityOverviewStats stats={updatedQualityStats} />

                {/* Main Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Alerts & Trend Chart */}
                    <div className="lg:col-span-2 space-y-6">
                        <QualityTrendChart reports={qualityReports} settings={settings} />
                        
                        {/* Quick Stats Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Card>
                                <CardContent className="pt-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-gray-500">Yeni Başvuru</p>
                                            <p className="text-2xl font-bold text-purple-600">
                                                {freelancers.filter(f => f.status === 'New Application').length}
                                            </p>
                                        </div>
                                        <Users className="w-8 h-8 text-purple-200" />
                                    </div>
                                    <Link to={createPageUrl('Freelancers')} className="text-xs text-purple-600 hover:underline mt-2 inline-block">
                                        Görüntüle →
                                    </Link>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardContent className="pt-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-gray-500">Bekleyen Quiz</p>
                                            <p className={`text-2xl font-bold ${quizStats.overdue > 0 ? 'text-red-600' : 'text-blue-600'}`}>
                                                {quizStats.pending}
                                            </p>
                                        </div>
                                        <Clock className="w-8 h-8 text-blue-200" />
                                    </div>
                                    {quizStats.overdue > 0 && (
                                        <Badge className="bg-red-100 text-red-700 mt-2">{quizStats.overdue} gecikmiş</Badge>
                                    )}
                                </CardContent>
                            </Card>
                            <Card>
                                <CardContent className="pt-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-gray-500">Ort. Quiz Skoru</p>
                                            <p className="text-2xl font-bold text-green-600">{quizStats.avgScore}%</p>
                                        </div>
                                        <TrendingUp className="w-8 h-8 text-green-200" />
                                    </div>
                                    <p className="text-xs text-gray-500 mt-2">{quizAttempts.length} deneme</p>
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                    {/* Sidebar */}
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

                {/* Quick Actions */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Zap className="w-5 h-5" />
                            Hızlı Erişim
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                            <Link to={createPageUrl('Freelancers')}>
                                <Button variant="outline" className="w-full justify-start">
                                    <Users className="w-4 h-4 mr-2" />
                                    Freelancerlar
                                </Button>
                            </Link>
                            <Link to={createPageUrl('QualityManagement')}>
                                <Button variant="outline" className="w-full justify-start">
                                    <Star className="w-4 h-4 mr-2" />
                                    Kalite Yönetimi
                                </Button>
                            </Link>
                            <Link to={createPageUrl('QuizManagement')}>
                                <Button variant="outline" className="w-full justify-start">
                                    <FileText className="w-4 h-4 mr-2" />
                                    Quiz Yönetimi
                                </Button>
                            </Link>
                            <Link to={createPageUrl('DocumentCompliance')}>
                                <Button variant="outline" className="w-full justify-start">
                                    <FileText className="w-4 h-4 mr-2" />
                                    Dokümanlar
                                </Button>
                            </Link>
                            <Link to={createPageUrl('SmartcatPayments')}>
                                <Button variant="outline" className="w-full justify-start">
                                    <Briefcase className="w-4 h-4 mr-2" />
                                    Smartcat
                                </Button>
                            </Link>
                            <Link to={createPageUrl('Settings')}>
                                <Button variant="outline" className="w-full justify-start">
                                    <Zap className="w-4 h-4 mr-2" />
                                    Ayarlar
                                </Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}