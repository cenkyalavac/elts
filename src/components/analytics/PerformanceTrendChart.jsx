import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { TrendingUp } from "lucide-react";

export default function PerformanceTrendChart({ reports, freelancers, timeRange, selectedFreelancer }) {
    // Group reports by month
    const monthlyData = useMemo(() => {
        const grouped = {};
        
        reports.forEach(report => {
            const date = new Date(report.report_date || report.created_date);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            
            if (!grouped[monthKey]) {
                grouped[monthKey] = {
                    month: monthKey,
                    lqa_scores: [],
                    qs_scores: [],
                    report_count: 0
                };
            }
            
            grouped[monthKey].report_count++;
            if (report.lqa_score != null) grouped[monthKey].lqa_scores.push(report.lqa_score);
            if (report.qs_score != null) grouped[monthKey].qs_scores.push(report.qs_score);
        });

        return Object.values(grouped)
            .map(g => ({
                month: g.month,
                monthLabel: new Date(g.month + '-01').toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
                avgLqa: g.lqa_scores.length > 0 
                    ? Math.round(g.lqa_scores.reduce((a, b) => a + b, 0) / g.lqa_scores.length * 10) / 10
                    : null,
                avgQs: g.qs_scores.length > 0
                    ? Math.round(g.qs_scores.reduce((a, b) => a + b, 0) / g.qs_scores.length * 10) / 10
                    : null,
                qsScaled: g.qs_scores.length > 0
                    ? Math.round(g.qs_scores.reduce((a, b) => a + b, 0) / g.qs_scores.length * 20 * 10) / 10
                    : null,
                reportCount: g.report_count
            }))
            .sort((a, b) => a.month.localeCompare(b.month));
    }, [reports]);

    // Individual freelancer performance over time
    const freelancerTrend = useMemo(() => {
        if (selectedFreelancer === 'all') return null;
        
        const freelancerReports = reports
            .filter(r => r.freelancer_id === selectedFreelancer)
            .sort((a, b) => new Date(a.report_date || a.created_date) - new Date(b.report_date || b.created_date));

        return freelancerReports.map((r, idx) => ({
            index: idx + 1,
            date: new Date(r.report_date || r.created_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            lqa: r.lqa_score,
            qs: r.qs_score,
            qsScaled: r.qs_score ? r.qs_score * 20 : null,
            project: r.project_name || 'Unknown'
        }));
    }, [reports, selectedFreelancer]);

    const freelancer = freelancers.find(f => f.id === selectedFreelancer);

    return (
        <div className="space-y-6">
            {/* Monthly Trend */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5" />
                        {selectedFreelancer === 'all' ? 'Overall Quality Trend' : `${freelancer?.full_name}'s Performance`}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {monthlyData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={350}>
                            <LineChart data={monthlyData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="monthLabel" />
                                <YAxis domain={[0, 100]} />
                                <Tooltip 
                                    formatter={(value, name) => {
                                        if (name === 'avgLqa') return [value, 'Avg LQA'];
                                        if (name === 'qsScaled') return [value, 'Avg QS (scaled)'];
                                        return [value, name];
                                    }}
                                />
                                <Legend />
                                <Line 
                                    type="monotone" 
                                    dataKey="avgLqa" 
                                    stroke="#3b82f6" 
                                    strokeWidth={2}
                                    name="Avg LQA"
                                    dot={{ r: 4 }}
                                    connectNulls
                                />
                                <Line 
                                    type="monotone" 
                                    dataKey="qsScaled" 
                                    stroke="#f59e0b" 
                                    strokeWidth={2}
                                    name="Avg QS (×20)"
                                    dot={{ r: 4 }}
                                    connectNulls
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="text-center py-12 text-gray-500">
                            No data available for the selected period
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Individual Freelancer Trend */}
            {freelancerTrend && freelancerTrend.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Individual Report Scores</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={freelancerTrend}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" />
                                <YAxis domain={[0, 100]} />
                                <Tooltip 
                                    content={({ active, payload }) => {
                                        if (active && payload?.length) {
                                            const data = payload[0].payload;
                                            return (
                                                <div className="bg-white p-3 border rounded shadow-lg">
                                                    <p className="font-medium">{data.project}</p>
                                                    <p className="text-sm text-gray-600">{data.date}</p>
                                                    {data.lqa && <p className="text-blue-600">LQA: {data.lqa}</p>}
                                                    {data.qs && <p className="text-amber-600">QS: {data.qs}/5</p>}
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <Bar dataKey="lqa" fill="#3b82f6" name="LQA" />
                                <Bar dataKey="qsScaled" fill="#f59e0b" name="QS (×20)" />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            )}

            {/* Report Volume */}
            <Card>
                <CardHeader>
                    <CardTitle>Report Volume by Month</CardTitle>
                </CardHeader>
                <CardContent>
                    {monthlyData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={monthlyData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="monthLabel" />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="reportCount" fill="#8b5cf6" name="Reports" />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="text-center py-8 text-gray-500">No data</div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}