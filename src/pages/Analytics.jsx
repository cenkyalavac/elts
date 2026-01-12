import React, { useMemo } from 'react';
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
    LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { 
    TrendingUp, Clock, Users, CheckCircle, 
    AlertTriangle, Award, Target, Globe
} from "lucide-react";

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const STAGES = [
    'New Application',
    'Form Sent',
    'Price Negotiation',
    'Test Sent',
    'Approved',
    'On Hold',
    'Rejected',
    'Red Flag'
];

export default function AnalyticsPage() {
    const { data: user, isLoading: isLoadingUser } = useQuery({
        queryKey: ['currentUser'],
        queryFn: () => base44.auth.me(),
    });

    const { data: freelancers = [], isLoading: isLoadingFreelancers } = useQuery({
        queryKey: ['freelancers'],
        queryFn: () => base44.entities.Freelancer.list(),
    });

    const { data: activities = [], isLoading: isLoadingActivities } = useQuery({
        queryKey: ['allActivities'],
        queryFn: () => base44.entities.FreelancerActivity.list('-created_date'),
    });

    const canView = user?.role === 'admin' || user?.role === 'project_manager';

    const analytics = useMemo(() => {
        if (!freelancers || !activities) return null;
        
        // Application volume over time (last 6 months)
        const volumeData = [];
        for (let i = 5; i >= 0; i--) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            const monthName = date.toLocaleDateString('en-US', { month: 'short' });
            const count = freelancers.filter(f => {
                const createdDate = new Date(f.created_date);
                return createdDate.getMonth() === date.getMonth() && 
                       createdDate.getFullYear() === date.getFullYear();
            }).length;
            volumeData.push({ month: monthName, applications: count });
        }

        // Stage distribution
        const stageDistribution = STAGES.map(stage => ({
            stage: stage.replace(' ', '\n'),
            count: freelancers.filter(f => f.status === stage).length
        }));

        // Average time in each stage
        const stageTimeData = STAGES.map(stage => {
            const inStage = freelancers.filter(f => f.status === stage);
            const avgDays = inStage.length > 0 
                ? inStage.reduce((sum, f) => {
                    if (!f.stage_changed_date) return sum;
                    const days = Math.floor((Date.now() - new Date(f.stage_changed_date)) / (1000 * 60 * 60 * 24));
                    return sum + days;
                }, 0) / inStage.length
                : 0;
            return { stage: stage.replace(' ', '\n'), days: Math.round(avgDays) };
        });

        // Conversion rates
        const total = freelancers.length;
        const approved = freelancers.filter(f => f.status === 'Approved').length;
        const rejected = freelancers.filter(f => f.status === 'Rejected').length;
        const inProgress = total - approved - rejected;
        
        const conversionRate = total > 0 ? ((approved / total) * 100).toFixed(1) : 0;
        const rejectionRate = total > 0 ? ((rejected / total) * 100).toFixed(1) : 0;
        const activeRate = total > 0 ? ((inProgress / total) * 100).toFixed(1) : 0;

        // Language pair distribution (top 10)
        const languagePairs = {};
        freelancers.forEach(f => {
            f.language_pairs?.forEach(pair => {
                const key = `${pair.source_language} → ${pair.target_language}`;
                languagePairs[key] = (languagePairs[key] || 0) + 1;
            });
        });
        const topLanguagePairs = Object.entries(languagePairs)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([pair, count]) => ({ pair, count }));

        // Specialization distribution
        const specializations = {};
        freelancers.forEach(f => {
            f.specializations?.forEach(spec => {
                specializations[spec] = (specializations[spec] || 0) + 1;
            });
        });
        const topSpecializations = Object.entries(specializations)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 8)
            .map(([name, value]) => ({ name, value }));

        // Rate type distribution
        const rateTypes = { per_word: 0, per_hour: 0, per_page: 0 };
        freelancers.forEach(f => {
            f.language_pairs?.forEach(pair => {
                pair.rates?.forEach(rate => {
                    rateTypes[rate.rate_type] = (rateTypes[rate.rate_type] || 0) + 1;
                });
            });
        });
        const rateTypeData = Object.entries(rateTypes).map(([name, value]) => ({
            name: name.replace('per_', ''),
            value
        }));

        // Team performance
        const teamPerformance = {};
        activities.forEach(activity => {
            if (activity.performed_by) {
                const email = activity.performed_by;
                if (!teamPerformance[email]) {
                    teamPerformance[email] = { email, actions: 0, stageChanges: 0, notes: 0 };
                }
                teamPerformance[email].actions++;
                if (activity.activity_type === 'Stage Changed') teamPerformance[email].stageChanges++;
                if (activity.activity_type === 'Note Added') teamPerformance[email].notes++;
            }
        });
        const topPerformers = Object.values(teamPerformance)
            .sort((a, b) => b.actions - a.actions)
            .slice(0, 5);

        // Bottleneck detection (stages with longest avg time and most applications)
        const bottlenecks = stageTimeData
            .map(s => ({
                ...s,
                count: stageDistribution.find(d => d.stage === s.stage)?.count || 0
            }))
            .filter(s => s.count > 0 && s.days > 7)
            .sort((a, b) => (b.days * b.count) - (a.days * a.count))
            .slice(0, 3);

        return {
            volumeData,
            stageDistribution,
            stageTimeData,
            conversionRate,
            rejectionRate,
            activeRate,
            topLanguagePairs,
            topSpecializations,
            rateTypeData,
            topPerformers,
            bottlenecks,
            total,
            approved,
            rejected,
            inProgress
        };
    }, [freelancers, activities]);

    const isLoading = isLoadingUser || isLoadingFreelancers || isLoadingActivities;

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                    <p className="text-lg text-gray-700">Loading analytics...</p>
                </div>
            </div>
        );
    }

    if (!canView) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
                <div className="max-w-md mx-auto text-center">
                    <div className="p-4 bg-red-100 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                        <AlertTriangle className="w-10 h-10 text-red-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
                    <p className="text-gray-600">You don't have permission to view analytics.</p>
                </div>
            </div>
        );
    }

    if (!analytics) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                    <p className="text-lg text-gray-700">Preparing analytics...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-4 lg:p-8">
            <div className="max-w-[1600px] mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">Analytics Dashboard</h1>
                    <p className="text-gray-600">Track recruitment performance and key metrics</p>
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <Card className="border-0 shadow-sm bg-gradient-to-br from-purple-50 to-white">
                        <CardContent className="pt-6">
                            <div className="flex items-start justify-between">
                                <div>
                                    <div className="text-3xl font-bold text-purple-900 mb-1">{analytics.total}</div>
                                    <div className="text-sm font-medium text-purple-700">Total Applications</div>
                                </div>
                                <div className="p-3 bg-purple-100 rounded-xl">
                                    <Users className="w-6 h-6 text-purple-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-0 shadow-sm bg-gradient-to-br from-green-50 to-white">
                        <CardContent className="pt-6">
                            <div className="flex items-start justify-between">
                                <div>
                                    <div className="text-3xl font-bold text-green-900 mb-1">{analytics.conversionRate}%</div>
                                    <div className="text-sm font-medium text-green-700">Approval Rate</div>
                                </div>
                                <div className="p-3 bg-green-100 rounded-xl">
                                    <CheckCircle className="w-6 h-6 text-green-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-0 shadow-sm bg-gradient-to-br from-yellow-50 to-white">
                        <CardContent className="pt-6">
                            <div className="flex items-start justify-between">
                                <div>
                                    <div className="text-3xl font-bold text-yellow-900 mb-1">{analytics.activeRate}%</div>
                                    <div className="text-sm font-medium text-yellow-700">In Progress</div>
                                </div>
                                <div className="p-3 bg-yellow-100 rounded-xl">
                                    <Clock className="w-6 h-6 text-yellow-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-0 shadow-sm bg-gradient-to-br from-red-50 to-white">
                        <CardContent className="pt-6">
                            <div className="flex items-start justify-between">
                                <div>
                                    <div className="text-3xl font-bold text-red-900 mb-1">{analytics.rejectionRate}%</div>
                                    <div className="text-sm font-medium text-red-700">Rejection Rate</div>
                                </div>
                                <div className="p-3 bg-red-100 rounded-xl">
                                    <Target className="w-6 h-6 text-red-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Bottlenecks Alert */}
                {analytics.bottlenecks.length > 0 && (
                    <Card className="mb-8 border-0 shadow-sm bg-gradient-to-r from-orange-50 to-red-50">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-orange-900">
                                <div className="p-2 bg-orange-100 rounded-lg">
                                    <AlertTriangle className="w-5 h-5 text-orange-600" />
                                </div>
                                Identified Bottlenecks
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {analytics.bottlenecks.map((b, idx) => (
                                    <div key={idx} className="flex items-center justify-between bg-white p-3 rounded-lg">
                                        <div>
                                            <span className="font-medium">{b.stage.replace('\n', ' ')}</span>
                                            <span className="text-sm text-gray-600 ml-2">
                                                {b.count} applications
                                            </span>
                                        </div>
                                        <Badge variant="destructive">
                                            Avg {b.days} days
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Charts Row 1 */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
                    {/* Application Volume Over Time */}
                    <Card className="border-0 shadow-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-3">
                                <div className="p-2 bg-purple-100 rounded-lg">
                                    <TrendingUp className="w-5 h-5 text-purple-600" />
                                </div>
                                Application Volume
                                <span className="text-sm font-normal text-gray-500">(Last 6 Months)</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={250}>
                                <LineChart data={analytics.volumeData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="month" />
                                    <YAxis />
                                    <Tooltip />
                                    <Line type="monotone" dataKey="applications" stroke="#3b82f6" strokeWidth={2} />
                                </LineChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    {/* Stage Distribution */}
                    <Card className="border-0 shadow-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-3">
                                <div className="p-2 bg-blue-100 rounded-lg">
                                    <Users className="w-5 h-5 text-blue-600" />
                                </div>
                                Applications by Stage
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={250}>
                                <BarChart data={analytics.stageDistribution}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="stage" fontSize={11} />
                                    <YAxis />
                                    <Tooltip />
                                    <Bar dataKey="count" fill="#3b82f6" />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </div>

                {/* Charts Row 2 */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
                    {/* Average Time in Stage */}
                    <Card className="border-0 shadow-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-3">
                                <div className="p-2 bg-yellow-100 rounded-lg">
                                    <Clock className="w-5 h-5 text-yellow-600" />
                                </div>
                                Average Days in Each Stage
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={250}>
                                <BarChart data={analytics.stageTimeData} layout="horizontal">
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis type="number" />
                                    <YAxis dataKey="stage" type="category" fontSize={11} width={80} />
                                    <Tooltip />
                                    <Bar dataKey="days" fill="#f59e0b" />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    {/* Top Language Pairs */}
                    <Card className="border-0 shadow-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-3">
                                <div className="p-2 bg-green-100 rounded-lg">
                                    <Globe className="w-5 h-5 text-green-600" />
                                </div>
                                Top Language Pairs
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={250}>
                                <BarChart data={analytics.topLanguagePairs}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="pair" fontSize={10} angle={-45} textAnchor="end" height={80} />
                                    <YAxis />
                                    <Tooltip />
                                    <Bar dataKey="count" fill="#10b981" />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </div>

                {/* Charts Row 3 */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
                    {/* Specialization Distribution */}
                    <Card className="border-0 shadow-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-3">
                                <div className="p-2 bg-purple-100 rounded-lg">
                                    <Award className="w-5 h-5 text-purple-600" />
                                </div>
                                Top Specializations
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={250}>
                                <PieChart>
                                    <Pie
                                        data={analytics.topSpecializations}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        {analytics.topSpecializations.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    {/* Rate Type Distribution */}
                    <Card className="border-0 shadow-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-3">
                                <div className="p-2 bg-pink-100 rounded-lg">
                                    <TrendingUp className="w-5 h-5 text-pink-600" />
                                </div>
                                Rate Types Distribution
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={250}>
                                <PieChart>
                                    <Pie
                                        data={analytics.rateTypeData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        {analytics.rateTypeData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </div>

                {/* Team Performance */}
                <Card className="border-0 shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-100 rounded-lg">
                                <Award className="w-5 h-5 text-indigo-600" />
                            </div>
                            Team Performance
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {analytics.topPerformers.map((performer, idx) => (
                                <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                                    <div>
                                        <div className="font-medium">{performer.email.split('@')[0]}</div>
                                        <div className="text-sm text-gray-600">{performer.email}</div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="text-center">
                                            <div className="text-lg font-bold text-blue-600">{performer.actions}</div>
                                            <div className="text-xs text-gray-600">Total Actions</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-lg font-bold text-green-600">{performer.stageChanges}</div>
                                            <div className="text-xs text-gray-600">Stage Changes</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-lg font-bold text-purple-600">{performer.notes}</div>
                                            <div className="text-xs text-gray-600">Notes</div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}