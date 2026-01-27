import React, { useMemo } from 'react';
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "../../utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, FileText, Briefcase, Star, Languages, TrendingUp, Eye } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export default function FreelancerDashboard({ freelancer }) {
    const { data: quizAttempts = [] } = useQuery({
        queryKey: ['quizAttempts', freelancer.id],
        queryFn: () => base44.entities.QuizAttempt.filter({ freelancer_id: freelancer.id }),
    });

    const { data: jobs = [] } = useQuery({
        queryKey: ['jobOffers'],
        queryFn: () => base44.entities.Job.list(),
    });

    const { data: qualityReports = [] } = useQuery({
        queryKey: ['qualityReports', freelancer.id],
        queryFn: () => base44.entities.QualityReport.filter({ 
            freelancer_id: freelancer.id, 
            status: 'finalized' 
        }),
    });

    const performanceStats = useMemo(() => {
        const lqaScores = qualityReports.filter(r => r.lqa_score != null).map(r => r.lqa_score);
        const qsScores = qualityReports.filter(r => r.qs_score != null).map(r => r.qs_score);
        
        const avgLqa = lqaScores.length > 0 
            ? (lqaScores.reduce((a, b) => a + b, 0) / lqaScores.length).toFixed(1)
            : null;
        const avgQs = qsScores.length > 0 
            ? (qsScores.reduce((a, b) => a + b, 0) / qsScores.length).toFixed(1)
            : null;

        const trendData = qualityReports
            .sort((a, b) => new Date(a.created_date) - new Date(b.created_date))
            .slice(-5)
            .map((r, idx) => ({
                name: `Job ${idx + 1}`,
                lqa: r.lqa_score,
                qs: r.qs_score ? r.qs_score * 20 : null,
            }));

        return { avgLqa, avgQs, trendData, totalReports: qualityReports.length };
    }, [qualityReports]);

    const completionPercentage = Math.round(
        ((freelancer.cv_file_url ? 1 : 0) + 
         (freelancer.nda ? 1 : 0) + 
         (freelancer.language_pairs?.length > 0 ? 1 : 0) + 
         (freelancer.rates?.length > 0 ? 1 : 0)) / 4 * 100
    );

    const bestQuizScore = quizAttempts.length > 0 
        ? Math.max(...quizAttempts.map(q => q.percentage || 0))
        : null;

    const statusColors = {
        'Approved': 'bg-green-100 text-green-800',
        'Test Sent': 'bg-indigo-100 text-indigo-800',
        'Price Negotiation': 'bg-yellow-100 text-yellow-800',
        'Form Sent': 'bg-purple-100 text-purple-800',
        'New Application': 'bg-blue-100 text-blue-800',
        'On Hold': 'bg-gray-100 text-gray-800',
        'Rejected': 'bg-red-100 text-red-800',
    };

    return (
        <div className="space-y-6">
            {/* Key Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="border-0 shadow-sm">
                    <CardContent className="pt-6">
                        <div className="text-sm text-gray-600 mb-2">Status</div>
                        <Badge className={statusColors[freelancer.status]}>
                            {freelancer.status}
                        </Badge>
                    </CardContent>
                </Card>
                <Card className="border-0 shadow-sm">
                    <CardContent className="pt-6">
                        <div className="text-sm text-gray-600 mb-2">Languages</div>
                        <div className="text-2xl font-bold text-blue-600">{freelancer.language_pairs?.length || 0}</div>
                    </CardContent>
                </Card>
                <Card className="border-0 shadow-sm">
                    <CardContent className="pt-6">
                        <div className="text-sm text-gray-600 mb-2">Experience</div>
                        <div className="text-2xl font-bold text-purple-600">{freelancer.experience_years || 0}y</div>
                    </CardContent>
                </Card>
                <Card className="border-0 shadow-sm">
                    <CardContent className="pt-6">
                        <div className="text-sm text-gray-600 mb-2">Matching Jobs</div>
                        <div className="text-2xl font-bold text-green-600">{jobs.length}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Profile Completion */}
            <Card className="border-0 shadow-sm">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                        Profile Completion
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium">{completionPercentage}% Complete</span>
                            <span className="text-xs text-gray-500">{Math.round(completionPercentage / 25)} of 4 sections</span>
                        </div>
                        <Progress value={completionPercentage} className="h-2" />
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        <div className="flex items-center gap-2">
                            {freelancer.cv_file_url ? (
                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                            ) : (
                                <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
                            )}
                            <span>CV</span>
                        </div>
                        <div className="flex items-center gap-2">
                            {freelancer.nda ? (
                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                            ) : (
                                <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
                            )}
                            <span>NDA</span>
                        </div>
                        <div className="flex items-center gap-2">
                            {freelancer.language_pairs?.length > 0 ? (
                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                            ) : (
                                <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
                            )}
                            <span>Languages</span>
                        </div>
                        <div className="flex items-center gap-2">
                            {freelancer.rates?.length > 0 ? (
                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                            ) : (
                                <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
                            )}
                            <span>Rates</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* My Performance */}
            {performanceStats.totalReports > 0 && (
                <Card className="border-0 shadow-sm">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-green-600" />
                                My Performance
                            </CardTitle>
                            <Link to={createPageUrl('QualityManagement') + `?freelancer_id=${freelancer.id}`}>
                                <Button variant="outline" size="sm" className="gap-2">
                                    <Eye className="w-4 h-4" />
                                    View My Reports
                                </Button>
                            </Link>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="text-center p-4 bg-blue-50 rounded-lg">
                                <div className="text-sm text-gray-600 mb-1">Avg LQA Score</div>
                                <div className={`text-3xl font-bold ${
                                    performanceStats.avgLqa >= 90 ? 'text-green-600' :
                                    performanceStats.avgLqa >= 70 ? 'text-yellow-600' :
                                    'text-red-600'
                                }`}>
                                    {performanceStats.avgLqa || '-'}
                                </div>
                            </div>
                            <div className="text-center p-4 bg-yellow-50 rounded-lg">
                                <div className="text-sm text-gray-600 mb-1">Avg QS Score</div>
                                <div className="text-3xl font-bold text-yellow-600 flex items-center justify-center gap-1">
                                    <Star className="w-5 h-5 fill-yellow-500 text-yellow-500" />
                                    {performanceStats.avgQs || '-'}
                                </div>
                            </div>
                        </div>

                        {performanceStats.trendData.length >= 2 && (
                            <div>
                                <div className="text-sm font-medium text-gray-600 mb-2">Last {performanceStats.trendData.length} Jobs Trend</div>
                                <ResponsiveContainer width="100%" height={120}>
                                    <LineChart data={performanceStats.trendData}>
                                        <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                                        <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                                        <Tooltip />
                                        <Line 
                                            type="monotone" 
                                            dataKey="lqa" 
                                            stroke="#3b82f6" 
                                            strokeWidth={2}
                                            dot={{ fill: '#3b82f6' }}
                                            name="LQA"
                                        />
                                        <Line 
                                            type="monotone" 
                                            dataKey="qs" 
                                            stroke="#eab308" 
                                            strokeWidth={2}
                                            dot={{ fill: '#eab308' }}
                                            name="QS (scaled)"
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        )}

                        <div className="text-xs text-gray-500 text-center">
                            Based on {performanceStats.totalReports} finalized report{performanceStats.totalReports !== 1 ? 's' : ''}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Quiz Performance */}
            {quizAttempts.length > 0 && (
                <Card className="border-0 shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Star className="w-5 h-5 text-yellow-500" />
                            Quiz Performance
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium">Best Score</span>
                                <span className="text-2xl font-bold text-yellow-600">{bestQuizScore}%</span>
                            </div>
                            <div className="flex justify-between text-sm text-gray-600">
                                <span>Attempts</span>
                                <span>{quizAttempts.length}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Language & Service Summary */}
            {freelancer.language_pairs?.length > 0 && (
                <Card className="border-0 shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Languages className="w-5 h-5 text-blue-600" />
                            Language Pairs
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                            {freelancer.language_pairs.map((pair, idx) => (
                                <Badge key={idx} variant="outline" className="text-center py-1">
                                    {pair.source_language} → {pair.target_language}
                                </Badge>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Service Types */}
            {freelancer.service_types?.length > 0 && (
                <Card className="border-0 shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Briefcase className="w-5 h-5 text-purple-600" />
                            Service Types
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                            {freelancer.service_types.map((service, idx) => (
                                <Badge key={idx} variant="secondary" className="text-center">
                                    {service}
                                </Badge>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}