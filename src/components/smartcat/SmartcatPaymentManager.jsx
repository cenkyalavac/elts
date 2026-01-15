import React, { useState } from 'react';
import { useQuery, useMutation } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { 
    DollarSign, RefreshCw, Download, CheckCircle2, AlertTriangle,
    Calendar, Loader2, ChevronDown, ChevronUp, FileText, Users,
    ExternalLink
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../../utils";

export default function SmartcatPaymentManager() {
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [expandedAssignee, setExpandedAssignee] = useState(null);

    const { data: jobsData, isLoading, refetch, isRefetching, error } = useQuery({
        queryKey: ['smartcatJobs', dateFrom, dateTo],
        queryFn: async () => {
            const response = await base44.functions.invoke('smartcatApi', {
                action: 'get_jobs_for_payment',
                params: {
                    dateFrom: dateFrom || undefined,
                    dateTo: dateTo || undefined
                }
            });
            return response.data;
        },
        enabled: false,
        retry: false
    });

    const handleFetch = () => {
        refetch();
    };

    const assignees = jobsData?.assignees || [];
    const totalWords = jobsData?.totalWords || 0;
    const matchedCount = assignees.filter(a => a.matched).length;

    const exportToCSV = () => {
        if (!assignees.length) return;
        
        const rows = [['Name', 'Email', 'Jobs', 'Total Words', 'Projects']];
        assignees.forEach(a => {
            const projects = [...new Set(a.jobs.map(j => j.projectName))].join('; ');
            rows.push([a.name, a.freelancer_email || '', a.jobs.length, a.totalWords, projects]);
        });
        
        const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `smartcat_payments_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="space-y-6">
            {/* Fetch Controls */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <DollarSign className="w-5 h-5" />
                        Payment Data from Smartcat
                    </CardTitle>
                    <CardDescription>
                        Fetch completed jobs from your Smartcat projects to prepare payments
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap gap-4 items-end">
                        <div className="space-y-2">
                            <Label>From Date</Label>
                            <Input
                                type="date"
                                value={dateFrom}
                                onChange={(e) => setDateFrom(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>To Date</Label>
                            <Input
                                type="date"
                                value={dateTo}
                                onChange={(e) => setDateTo(e.target.value)}
                            />
                        </div>
                        <Button onClick={handleFetch} disabled={isLoading || isRefetching}>
                            {(isLoading || isRefetching) ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                                <RefreshCw className="w-4 h-4 mr-2" />
                            )}
                            Fetch from Smartcat
                        </Button>
                    </div>
                    
                    {error && (
                        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                            <div className="flex items-start gap-3">
                                <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />
                                <div>
                                    <p className="font-medium text-red-800">Error fetching data</p>
                                    <p className="text-sm text-red-600">{error.message}</p>
                                    <p className="text-xs text-red-500 mt-1">Check your Smartcat API credentials in Settings</p>
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Summary Stats */}
            {jobsData && !error && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card className="bg-blue-50 border-blue-200">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <Users className="w-8 h-8 text-blue-600" />
                                <div>
                                    <p className="text-sm text-blue-600">Assignees</p>
                                    <p className="text-2xl font-bold text-blue-700">{assignees.length}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-green-50 border-green-200">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <CheckCircle2 className="w-8 h-8 text-green-600" />
                                <div>
                                    <p className="text-sm text-green-600">Matched in DB</p>
                                    <p className="text-2xl font-bold text-green-700">{matchedCount}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-purple-50 border-purple-200">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <FileText className="w-8 h-8 text-purple-600" />
                                <div>
                                    <p className="text-sm text-purple-600">Total Words</p>
                                    <p className="text-2xl font-bold text-purple-700">{totalWords.toLocaleString()}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <Calendar className="w-8 h-8 text-gray-600" />
                                <div>
                                    <p className="text-sm text-gray-600">Projects Scanned</p>
                                    <p className="text-2xl font-bold">{jobsData.projectsProcessed || 0}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Assignees Table */}
            {assignees.length > 0 && (
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle>Completed Work by Assignee</CardTitle>
                            <Button variant="outline" size="sm" onClick={exportToCSV}>
                                <Download className="w-4 h-4 mr-2" />
                                Export CSV
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-center">Jobs</TableHead>
                                    <TableHead className="text-right">Words</TableHead>
                                    <TableHead></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {assignees.map((assignee, idx) => (
                                    <React.Fragment key={assignee.smartcat_id || idx}>
                                        <TableRow 
                                            className="cursor-pointer hover:bg-gray-50"
                                            onClick={() => setExpandedAssignee(
                                                expandedAssignee === idx ? null : idx
                                            )}
                                        >
                                            <TableCell className="font-medium">
                                                {assignee.matched && assignee.freelancer_id ? (
                                                    <Link 
                                                        to={createPageUrl(`FreelancerDetail?id=${assignee.freelancer_id}`)}
                                                        className="hover:text-blue-600"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        {assignee.name}
                                                    </Link>
                                                ) : (
                                                    assignee.name
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {assignee.matched ? (
                                                    <Badge className="bg-green-100 text-green-700">
                                                        <CheckCircle2 className="w-3 h-3 mr-1" />
                                                        In Database
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="outline" className="text-yellow-600">
                                                        <AlertTriangle className="w-3 h-3 mr-1" />
                                                        Unknown
                                                    </Badge>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Badge variant="secondary">{assignee.jobs.length}</Badge>
                                            </TableCell>
                                            <TableCell className="text-right font-semibold">
                                                {assignee.totalWords.toLocaleString()}
                                            </TableCell>
                                            <TableCell>
                                                {expandedAssignee === idx ? (
                                                    <ChevronUp className="w-4 h-4 text-gray-400" />
                                                ) : (
                                                    <ChevronDown className="w-4 h-4 text-gray-400" />
                                                )}
                                            </TableCell>
                                        </TableRow>
                                        {expandedAssignee === idx && (
                                            <TableRow>
                                                <TableCell colSpan={5} className="bg-gray-50 p-4">
                                                    <div className="space-y-2">
                                                        <p className="text-sm font-medium text-gray-700 mb-3">Job Details:</p>
                                                        {assignee.jobs.map((job, jobIdx) => (
                                                            <div key={jobIdx} className="flex items-center justify-between p-3 bg-white rounded border">
                                                                <div>
                                                                    <p className="font-medium text-sm">{job.projectName}</p>
                                                                    <p className="text-xs text-gray-500">
                                                                        {job.documentName} • {job.stageType}
                                                                        {job.sourceLanguage && job.targetLanguage && 
                                                                            ` • ${job.sourceLanguage} → ${job.targetLanguage}`
                                                                        }
                                                                    </p>
                                                                </div>
                                                                <Badge variant="outline">{job.wordsCount.toLocaleString()} words</Badge>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </React.Fragment>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}

            {/* Empty State */}
            {!isLoading && !error && jobsData && assignees.length === 0 && (
                <Card>
                    <CardContent className="py-12 text-center">
                        <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-600">No completed jobs found</p>
                        <p className="text-sm text-gray-500">Try adjusting the date range or check your Smartcat projects</p>
                    </CardContent>
                </Card>
            )}

            {/* Tip */}
            <Card className="bg-blue-50 border-blue-200">
                <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                        <ExternalLink className="w-5 h-5 text-blue-600 mt-0.5" />
                        <div>
                            <p className="font-medium text-blue-800">Using Smartcat Payments</p>
                            <p className="text-sm text-blue-600">
                                This tool shows completed work from your Smartcat projects. 
                                For actual payment processing, use the Smartcat dashboard directly.
                                The data here helps you verify and reconcile payments.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}