import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
    ResponsiveContainer, Legend 
} from "recharts";
import { 
    TrendingUp, Calendar, FileText, AlertTriangle, 
    Star, BarChart3, Loader2 
} from "lucide-react";
import { format } from "date-fns";

export default function QualityScorecard({ freelancerId }) {
    const { data: reports = [], isLoading } = useQuery({
        queryKey: ['qualityReportsScorecard', freelancerId],
        queryFn: () => base44.entities.QualityReport.filter(
            { freelancer_id: freelancerId },
            '-report_date',
            10
        ),
        enabled: !!freelancerId,
    });

    // Prepare chart data (reverse to show oldest first for trend)
    const chartData = useMemo(() => {
        const finalizedReports = reports
            .filter(r => r.status === 'finalized' || r.status === 'translator_accepted')
            .reverse();

        return finalizedReports.map(r => ({
            date: r.report_date ? format(new Date(r.report_date), 'MMM dd') : 'N/A',
            lqa_score: r.lqa_score,
            qs_score: r.qs_score ? r.qs_score * 20 : null, // Scale QS to 100 for comparison
            project: r.project_name || 'Unknown'
        }));
    }, [reports]);

    // Calculate key metrics
    const metrics = useMemo(() => {
        const finalizedReports = reports.filter(r => 
            r.status === 'finalized' || r.status === 'translator_accepted'
        );

        // Average LQA Score
        const lqaScores = finalizedReports.filter(r => r.lqa_score != null).map(r => r.lqa_score);
        const avgLqa = lqaScores.length > 0 
            ? lqaScores.reduce((a, b) => a + b, 0) / lqaScores.length 
            : null;

        // Total Projects
        const totalProjects = finalizedReports.length;

        // Last Assessment Date
        const lastReport = finalizedReports.sort((a, b) => 
            new Date(b.report_date || b.created_date) - new Date(a.report_date || a.created_date)
        )[0];
        const lastAssessmentDate = lastReport?.report_date || lastReport?.created_date;

        // Top Error Category
        const errorCounts = {};
        finalizedReports.forEach(r => {
            r.lqa_errors?.forEach(err => {
                if (err.error_type) {
                    errorCounts[err.error_type] = (errorCounts[err.error_type] || 0) + (err.count || 1);
                }
            });
        });
        const topErrorCategory = Object.entries(errorCounts)
            .sort((a, b) => b[1] - a[1])[0];

        return {
            avgLqa,
            totalProjects,
            lastAssessmentDate,
            topErrorCategory: topErrorCategory ? { name: topErrorCategory[0], count: topErrorCategory[1] } : null
        };
    }, [reports]);

    const getScoreColor = (score) => {
        if (score == null) return "text-gray-400";
        if (score >= 80) return "text-green-600";
        if (score >= 60) return "text-yellow-600";
        return "text-red-600";
    };

    if (isLoading) {
        return (
            <Card>
                <CardContent className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <TrendingUp className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 uppercase">Avg LQA Score</p>
                                <p className={`text-2xl font-bold ${getScoreColor(metrics.avgLqa)}`}>
                                    {metrics.avgLqa != null ? metrics.avgLqa.toFixed(1) : "-"}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-100 rounded-lg">
                                <FileText className="w-5 h-5 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 uppercase">Total Projects</p>
                                <p className="text-2xl font-bold text-purple-600">
                                    {metrics.totalProjects}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-100 rounded-lg">
                                <Calendar className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 uppercase">Last Assessment</p>
                                <p className="text-lg font-semibold text-gray-700">
                                    {metrics.lastAssessmentDate 
                                        ? format(new Date(metrics.lastAssessmentDate), 'MMM dd, yyyy')
                                        : "-"
                                    }
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-orange-100 rounded-lg">
                                <AlertTriangle className="w-5 h-5 text-orange-600" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 uppercase">Top Error Type</p>
                                {metrics.topErrorCategory ? (
                                    <div className="flex items-center gap-2">
                                        <p className="text-lg font-semibold text-gray-700">
                                            {metrics.topErrorCategory.name}
                                        </p>
                                        <Badge variant="secondary" className="text-xs">
                                            {metrics.topErrorCategory.count}
                                        </Badge>
                                    </div>
                                ) : (
                                    <p className="text-lg font-semibold text-gray-400">-</p>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Score Trend Chart */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-blue-600" />
                        Quality Score Trend (Last 10 Reports)
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {chartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                <XAxis 
                                    dataKey="date" 
                                    tick={{ fontSize: 12 }}
                                    stroke="#9ca3af"
                                />
                                <YAxis 
                                    domain={[0, 100]} 
                                    tick={{ fontSize: 12 }}
                                    stroke="#9ca3af"
                                />
                                <Tooltip 
                                    contentStyle={{ 
                                        backgroundColor: 'white', 
                                        border: '1px solid #e5e7eb',
                                        borderRadius: '8px',
                                        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
                                    }}
                                    formatter={(value, name) => {
                                        if (value == null) return ['-', name];
                                        if (name === 'qs_score') {
                                            return [(value / 20).toFixed(1) + ' / 5', 'QS Score'];
                                        }
                                        return [value.toFixed(1), 'LQA Score'];
                                    }}
                                />
                                <Legend />
                                <Line 
                                    type="monotone" 
                                    dataKey="lqa_score" 
                                    stroke="#3b82f6" 
                                    strokeWidth={2}
                                    dot={{ fill: '#3b82f6', strokeWidth: 2 }}
                                    name="LQA Score"
                                    connectNulls
                                />
                                <Line 
                                    type="monotone" 
                                    dataKey="qs_score" 
                                    stroke="#f59e0b" 
                                    strokeWidth={2}
                                    dot={{ fill: '#f59e0b', strokeWidth: 2 }}
                                    name="QS Score (×20)"
                                    connectNulls
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                            <BarChart3 className="w-12 h-12 text-gray-300 mb-3" />
                            <p>No quality reports available</p>
                            <p className="text-sm text-gray-400">Reports will appear here once assessments are completed</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}