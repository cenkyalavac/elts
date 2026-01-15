import React, { useState, useMemo } from 'react';
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { 
    BarChart3, TrendingUp, TrendingDown, Users, AlertTriangle,
    Award, Star, FileText, Mail, Download, Calendar
} from "lucide-react";

import PerformanceTrendChart from "@/components/analytics/PerformanceTrendChart";
import ErrorTypeAnalysis from "@/components/analytics/ErrorTypeAnalysis";
import TopPerformersReport from "@/components/analytics/TopPerformersReport";
import PerformanceSummaryCards from "@/components/analytics/PerformanceSummaryCards";
import BulkNotificationDialog from "@/components/analytics/BulkNotificationDialog";

export default function PerformanceAnalyticsPage() {
    const [timeRange, setTimeRange] = useState('3months');
    const [selectedFreelancer, setSelectedFreelancer] = useState('all');
    const [showNotificationDialog, setShowNotificationDialog] = useState(false);
    const [notificationType, setNotificationType] = useState(null);

    const { data: reports = [] } = useQuery({
        queryKey: ['qualityReports'],
        queryFn: () => base44.entities.QualityReport.list('-created_date'),
    });

    const { data: freelancers = [] } = useQuery({
        queryKey: ['freelancers'],
        queryFn: () => base44.entities.Freelancer.list(),
    });

    const { data: settings } = useQuery({
        queryKey: ['qualitySettings'],
        queryFn: async () => {
            const allSettings = await base44.entities.QualitySettings.list();
            return allSettings[0] || { lqa_weight: 4, qs_multiplier: 20 };
        },
    });

    // Filter reports by time range
    const filteredReports = useMemo(() => {
        const now = new Date();
        let cutoffDate = new Date();
        
        switch (timeRange) {
            case '1month':
                cutoffDate.setMonth(now.getMonth() - 1);
                break;
            case '3months':
                cutoffDate.setMonth(now.getMonth() - 3);
                break;
            case '6months':
                cutoffDate.setMonth(now.getMonth() - 6);
                break;
            case '1year':
                cutoffDate.setFullYear(now.getFullYear() - 1);
                break;
            default:
                cutoffDate = new Date(0);
        }

        return reports.filter(r => {
            const reportDate = new Date(r.report_date || r.created_date);
            const inTimeRange = reportDate >= cutoffDate;
            const freelancerMatch = selectedFreelancer === 'all' || r.freelancer_id === selectedFreelancer;
            const isFinalized = r.status === 'finalized' || r.status === 'translator_accepted';
            return inTimeRange && freelancerMatch && isFinalized;
        });
    }, [reports, timeRange, selectedFreelancer]);

    // Calculate freelancer performance stats
    const freelancerStats = useMemo(() => {
        const stats = new Map();
        const lqaWeight = settings?.lqa_weight || 4;
        const qsMultiplier = settings?.qs_multiplier || 20;

        filteredReports.forEach(report => {
            if (!report.freelancer_id) return;
            
            if (!stats.has(report.freelancer_id)) {
                const freelancer = freelancers.find(f => f.id === report.freelancer_id);
                stats.set(report.freelancer_id, {
                    freelancer_id: report.freelancer_id,
                    freelancer_name: freelancer?.full_name || 'Unknown',
                    freelancer_email: freelancer?.email,
                    lqa_scores: [],
                    qs_scores: [],
                    error_counts: {},
                    content_types: {},
                    job_types: {},
                    total_reports: 0
                });
            }

            const stat = stats.get(report.freelancer_id);
            stat.total_reports++;
            
            if (report.lqa_score != null) stat.lqa_scores.push(report.lqa_score);
            if (report.qs_score != null) stat.qs_scores.push(report.qs_score);
            
            // Count errors by type and severity
            if (report.lqa_errors?.length) {
                report.lqa_errors.forEach(err => {
                    const key = `${err.error_type}_${err.severity}`;
                    stat.error_counts[key] = (stat.error_counts[key] || 0) + (err.count || 1);
                });
            }

            // Track content and job types
            if (report.content_type) {
                stat.content_types[report.content_type] = (stat.content_types[report.content_type] || 0) + 1;
            }
            if (report.job_type) {
                stat.job_types[report.job_type] = (stat.job_types[report.job_type] || 0) + 1;
            }
        });

        // Calculate averages and combined scores
        stats.forEach(stat => {
            stat.avg_lqa = stat.lqa_scores.length > 0 
                ? stat.lqa_scores.reduce((a, b) => a + b, 0) / stat.lqa_scores.length 
                : null;
            stat.avg_qs = stat.qs_scores.length > 0 
                ? stat.qs_scores.reduce((a, b) => a + b, 0) / stat.qs_scores.length 
                : null;
            
            // Combined score
            if (stat.avg_lqa != null && stat.avg_qs != null) {
                stat.combined_score = ((stat.avg_lqa * lqaWeight) + (stat.avg_qs * qsMultiplier)) / (lqaWeight + 1);
            } else if (stat.avg_lqa != null) {
                stat.combined_score = stat.avg_lqa;
            } else if (stat.avg_qs != null) {
                stat.combined_score = stat.avg_qs * qsMultiplier;
            } else {
                stat.combined_score = null;
            }
        });

        return Array.from(stats.values());
    }, [filteredReports, freelancers, settings]);

    // Top and bottom performers
    const topPerformers = useMemo(() => {
        return [...freelancerStats]
            .filter(s => s.combined_score != null && s.total_reports >= 2)
            .sort((a, b) => b.combined_score - a.combined_score)
            .slice(0, 10);
    }, [freelancerStats]);

    const lowPerformers = useMemo(() => {
        return [...freelancerStats]
            .filter(s => s.combined_score != null && s.total_reports >= 2)
            .sort((a, b) => a.combined_score - b.combined_score)
            .slice(0, 10);
    }, [freelancerStats]);

    const handleSendNotifications = (type) => {
        setNotificationType(type);
        setShowNotificationDialog(true);
    };

    const exportReport = () => {
        const rows = [['Name', 'Email', 'Reports', 'Avg LQA', 'Avg QS', 'Combined Score']];
        freelancerStats.forEach(s => {
            rows.push([
                s.freelancer_name,
                s.freelancer_email || '',
                s.total_reports,
                s.avg_lqa?.toFixed(1) || '-',
                s.avg_qs?.toFixed(1) || '-',
                s.combined_score?.toFixed(1) || '-'
            ]);
        });
        
        const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `performance_report_${timeRange}_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold">Performance Analytics</h1>
                    <p className="text-gray-500">Analyze freelancer quality metrics and trends</p>
                </div>
                <div className="flex flex-wrap gap-3">
                    <Select value={timeRange} onValueChange={setTimeRange}>
                        <SelectTrigger className="w-40">
                            <Calendar className="w-4 h-4 mr-2" />
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="1month">Last Month</SelectItem>
                            <SelectItem value="3months">Last 3 Months</SelectItem>
                            <SelectItem value="6months">Last 6 Months</SelectItem>
                            <SelectItem value="1year">Last Year</SelectItem>
                            <SelectItem value="all">All Time</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select value={selectedFreelancer} onValueChange={setSelectedFreelancer}>
                        <SelectTrigger className="w-48">
                            <Users className="w-4 h-4 mr-2" />
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Freelancers</SelectItem>
                            {freelancers.filter(f => f.status === 'Approved').map(f => (
                                <SelectItem key={f.id} value={f.id}>{f.full_name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Button variant="outline" onClick={exportReport}>
                        <Download className="w-4 h-4 mr-2" />
                        Export CSV
                    </Button>
                </div>
            </div>

            {/* Summary Cards */}
            <PerformanceSummaryCards 
                reports={filteredReports} 
                freelancerStats={freelancerStats}
                settings={settings}
            />

            <Tabs defaultValue="trends" className="mt-6">
                <TabsList>
                    <TabsTrigger value="trends">Performance Trends</TabsTrigger>
                    <TabsTrigger value="errors">Error Analysis</TabsTrigger>
                    <TabsTrigger value="rankings">Rankings</TabsTrigger>
                </TabsList>

                <TabsContent value="trends" className="mt-6">
                    <PerformanceTrendChart 
                        reports={filteredReports}
                        freelancers={freelancers}
                        timeRange={timeRange}
                        selectedFreelancer={selectedFreelancer}
                    />
                </TabsContent>

                <TabsContent value="errors" className="mt-6">
                    <ErrorTypeAnalysis 
                        reports={filteredReports}
                        freelancerStats={freelancerStats}
                    />
                </TabsContent>

                <TabsContent value="rankings" className="mt-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <TopPerformersReport 
                            performers={topPerformers}
                            title="Top Performers"
                            icon={<Award className="w-5 h-5 text-green-600" />}
                            badgeColor="bg-green-100 text-green-700"
                            onSendNotification={() => handleSendNotifications('top')}
                        />
                        <TopPerformersReport 
                            performers={lowPerformers}
                            title="Needs Improvement"
                            icon={<AlertTriangle className="w-5 h-5 text-orange-600" />}
                            badgeColor="bg-orange-100 text-orange-700"
                            onSendNotification={() => handleSendNotifications('low')}
                            isLowPerformer
                        />
                    </div>
                </TabsContent>
            </Tabs>

            <BulkNotificationDialog
                open={showNotificationDialog}
                onOpenChange={setShowNotificationDialog}
                performers={notificationType === 'top' ? topPerformers : lowPerformers}
                notificationType={notificationType}
            />
        </div>
    );
}