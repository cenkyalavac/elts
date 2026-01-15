import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { AlertTriangle, FileText } from "lucide-react";

const ERROR_TYPES = [
    "Accuracy", "Fluency", "Terminology", "Style", "Locale", "Verity", 
    "Grammar", "Punctuation", "Spelling", "Consistency", "Formatting", 
    "Omission", "Addition", "Mistranslation"
];

const SEVERITY_COLORS = {
    Critical: '#ef4444',
    Major: '#f97316',
    Minor: '#eab308',
    Preferential: '#9ca3af'
};

export default function ErrorTypeAnalysis({ reports, freelancerStats }) {
    // Aggregate all errors
    const errorSummary = useMemo(() => {
        const summary = {
            byType: {},
            bySeverity: { Critical: 0, Major: 0, Minor: 0, Preferential: 0 },
            byFreelancer: []
        };

        reports.forEach(report => {
            if (!report.lqa_errors?.length) return;
            
            report.lqa_errors.forEach(err => {
                // By type
                if (!summary.byType[err.error_type]) {
                    summary.byType[err.error_type] = { total: 0, Critical: 0, Major: 0, Minor: 0, Preferential: 0 };
                }
                summary.byType[err.error_type].total += err.count || 1;
                summary.byType[err.error_type][err.severity] += err.count || 1;
                
                // By severity
                summary.bySeverity[err.severity] = (summary.bySeverity[err.severity] || 0) + (err.count || 1);
            });
        });

        return summary;
    }, [reports]);

    // Error type chart data
    const errorTypeData = useMemo(() => {
        return Object.entries(errorSummary.byType)
            .map(([type, data]) => ({
                type,
                total: data.total,
                Critical: data.Critical,
                Major: data.Major,
                Minor: data.Minor,
                Preferential: data.Preferential
            }))
            .sort((a, b) => b.total - a.total)
            .slice(0, 10);
    }, [errorSummary]);

    // Severity pie chart data
    const severityData = useMemo(() => {
        return Object.entries(errorSummary.bySeverity)
            .filter(([_, count]) => count > 0)
            .map(([severity, count]) => ({
                name: severity,
                value: count,
                color: SEVERITY_COLORS[severity]
            }));
    }, [errorSummary]);

    // Freelancers with most errors
    const freelancerErrorRanking = useMemo(() => {
        return freelancerStats
            .map(stat => {
                const totalErrors = Object.values(stat.error_counts).reduce((sum, count) => sum + count, 0);
                const criticalErrors = Object.entries(stat.error_counts)
                    .filter(([key]) => key.includes('Critical'))
                    .reduce((sum, [_, count]) => sum + count, 0);
                
                return {
                    ...stat,
                    totalErrors,
                    criticalErrors
                };
            })
            .filter(s => s.totalErrors > 0)
            .sort((a, b) => b.totalErrors - a.totalErrors)
            .slice(0, 10);
    }, [freelancerStats]);

    const totalErrors = Object.values(errorSummary.bySeverity).reduce((a, b) => a + b, 0);

    return (
        <div className="space-y-6">
            {/* Error Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {Object.entries(errorSummary.bySeverity).map(([severity, count]) => (
                    <Card key={severity} className={
                        severity === 'Critical' ? 'border-red-200 bg-red-50' :
                        severity === 'Major' ? 'border-orange-200 bg-orange-50' :
                        severity === 'Minor' ? 'border-yellow-200 bg-yellow-50' :
                        'border-gray-200 bg-gray-50'
                    }>
                        <CardContent className="pt-6">
                            <p className={`text-sm ${
                                severity === 'Critical' ? 'text-red-600' :
                                severity === 'Major' ? 'text-orange-600' :
                                severity === 'Minor' ? 'text-yellow-600' :
                                'text-gray-600'
                            }`}>{severity} Errors</p>
                            <p className="text-2xl font-bold">{count}</p>
                            <p className="text-xs text-gray-500">
                                {totalErrors > 0 ? ((count / totalErrors) * 100).toFixed(1) : 0}% of total
                            </p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Error by Type Chart */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5" />
                            Errors by Type
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {errorTypeData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={errorTypeData} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis type="number" />
                                    <YAxis dataKey="type" type="category" width={100} />
                                    <Tooltip />
                                    <Bar dataKey="Critical" stackId="a" fill={SEVERITY_COLORS.Critical} />
                                    <Bar dataKey="Major" stackId="a" fill={SEVERITY_COLORS.Major} />
                                    <Bar dataKey="Minor" stackId="a" fill={SEVERITY_COLORS.Minor} />
                                    <Bar dataKey="Preferential" stackId="a" fill={SEVERITY_COLORS.Preferential} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="text-center py-12 text-gray-500">
                                <AlertTriangle className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                                <p>No error data available</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Severity Distribution */}
                <Card>
                    <CardHeader>
                        <CardTitle>Severity Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {severityData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={severityData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={100}
                                        paddingAngle={2}
                                        dataKey="value"
                                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                    >
                                        {severityData.map((entry, index) => (
                                            <Cell key={index} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="text-center py-12 text-gray-500">No data</div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Freelancers with Most Errors */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileText className="w-5 h-5" />
                        Freelancers by Error Count
                    </CardTitle>
                    <CardDescription>
                        Freelancers ranked by total number of errors in their LQA reports
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {freelancerErrorRanking.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Freelancer</TableHead>
                                    <TableHead className="text-center">Reports</TableHead>
                                    <TableHead className="text-center">Total Errors</TableHead>
                                    <TableHead className="text-center">Critical</TableHead>
                                    <TableHead className="text-center">Avg LQA</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {freelancerErrorRanking.map((stat, idx) => (
                                    <TableRow key={stat.freelancer_id}>
                                        <TableCell className="font-medium">{stat.freelancer_name}</TableCell>
                                        <TableCell className="text-center">{stat.total_reports}</TableCell>
                                        <TableCell className="text-center">
                                            <Badge variant="secondary">{stat.totalErrors}</Badge>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {stat.criticalErrors > 0 ? (
                                                <Badge className="bg-red-100 text-red-700">{stat.criticalErrors}</Badge>
                                            ) : '-'}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <span className={
                                                stat.avg_lqa >= 85 ? 'text-green-600 font-medium' :
                                                stat.avg_lqa >= 70 ? 'text-yellow-600 font-medium' :
                                                'text-red-600 font-medium'
                                            }>
                                                {stat.avg_lqa?.toFixed(1) || '-'}
                                            </span>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <div className="text-center py-8 text-gray-500">
                            No error data available
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}