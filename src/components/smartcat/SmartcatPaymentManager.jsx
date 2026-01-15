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
    Loader2, ChevronDown, ChevronUp, FileText, Users, ExternalLink, Calendar
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../../utils";
import { toast } from "sonner";

export default function SmartcatPaymentManager() {
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [expandedAssignee, setExpandedAssignee] = useState(null);

    const { data: jobsData, isLoading, refetch, isRefetching, error } = useQuery({
        queryKey: ['smartcatJobs', dateFrom, dateTo],
        queryFn: async () => {
            const response = await base44.functions.invoke('smartcatApi', {
                action: 'get_jobs_for_payment',
                params: { dateFrom, dateTo }
            });
            return response.data;
        },
        enabled: false,
        retry: 1
    });

    const handleFetch = () => {
        if (!dateFrom || !dateTo) {
            toast.error('Please select both from and to dates');
            return;
        }
        refetch();
    };

    const assignees = jobsData?.assignees || [];
    const totalWords = jobsData?.totalWords || 0;
    const matchedCount = assignees.filter(a => a.matched).length;

    const exportToCSV = () => {
        if (!assignees.length) return;
        
        const rows = [['Name', 'Email', 'Matched in DB', 'Total Jobs', 'Total Words', 'Project Names']];
        assignees.forEach(a => {
            const projects = [...new Set(a.jobs.map(j => j.projectName))].join('; ');
            rows.push([
                a.name, 
                a.freelancer_email || '', 
                a.matched ? 'Yes' : 'No',
                a.jobs.length, 
                a.totalWords, 
                projects
            ]);
        });
        
        const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `smartcat_payment_data_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success('CSV exported');
    };

    const exportDetailedCSV = () => {
        if (!assignees.length) return;
        
        const rows = [['Assignee Name', 'Email', 'Project', 'Document', 'Stage Type', 'Source Lang', 'Target Lang', 'Words', 'Deadline']];
        assignees.forEach(a => {
            a.jobs.forEach(job => {
                rows.push([
                    a.name,
                    a.freelancer_email || '',
                    job.projectName,
                    job.documentName,
                    job.stageType,
                    job.sourceLanguage || '',
                    job.targetLanguage || '',
                    job.wordsCount,
                    job.deadline || ''
                ]);
            });
        });
        
        const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `smartcat_detailed_jobs_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success('Detailed CSV exported');
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <DollarSign className="w-5 h-5" />
                        Smartcat Completed Work
                    </CardTitle>
                    <CardDescription>
                        View completed work by your team members from Smartcat projects for the selected date range
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col md:flex-row gap-4 items-end">
                        <div className="flex-1 space-y-2">
                            <Label>From Date</Label>
                            <Input
                                type="date"
                                value={dateFrom}
                                onChange={(e) => setDateFrom(e.target.value)}
                            />
                        </div>
                        <div className="flex-1 space-y-2">
                            <Label>To Date</Label>
                            <Input
                                type="date"
                                value={dateTo}
                                onChange={(e) => setDateTo(e.target.value)}
                            />
                        </div>
                        <Button onClick={handleFetch} disabled={isLoading || isRefetching} className="bg-purple-600 hover:bg-purple-700">
                            {(isLoading || isRefetching) ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                                <RefreshCw className="w-4 h-4 mr-2" />
                            )}
                            Fetch Data
                        </Button>
                    </div>
                    
                    {error && (
                        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                            <div className="flex items-start gap-3">
                                <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />
                                <div>
                                    <p className="font-medium text-red-800">Error fetching data</p>
                                    <p className="text-sm text-red-600">{error.message}</p>
                                    <p className="text-xs text-red-500 mt-1">Check Smartcat API credentials in Settings</p>
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {jobsData && !error && (
                <>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                                        <p className="text-sm text-green-600">Matched</p>
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
                                        <p className="text-sm text-gray-600">Projects</p>
                                        <p className="text-2xl font-bold">{jobsData.projectsProcessed || 0}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle>Work by Assignee</CardTitle>
                                <div className="flex gap-2">
                                    <Button variant="outline" size="sm" onClick={exportToCSV}>
                                        <Download className="w-4 h-4 mr-2" />
                                        Summary CSV
                                    </Button>
                                    <Button variant="outline" size="sm" onClick={exportDetailedCSV}>
                                        <Download className="w-4 h-4 mr-2" />
                                        Detailed CSV
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {assignees.length > 0 ? (
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
                                                    onClick={() => setExpandedAssignee(expandedAssignee === idx ? null : idx)}
                                                >
                                                    <TableCell className="font-medium">
                                                        {assignee.matched && assignee.freelancer_id ? (
                                                            <Link 
                                                                to={createPageUrl(`FreelancerDetail?id=${assignee.freelancer_id}`)}
                                                                className="hover:text-blue-600 flex items-center gap-2"
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
                                                                Not Found
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
                                                                <div className="flex items-center justify-between mb-3">
                                                                    <p className="text-sm font-medium text-gray-700">
                                                                        {assignee.jobs.length} completed jobs
                                                                    </p>
                                                                </div>
                                                                {assignee.jobs.map((job, jobIdx) => (
                                                                    <div key={jobIdx} className="flex flex-col md:flex-row md:items-center justify-between p-3 bg-white rounded border gap-2">
                                                                        <div className="flex-1 min-w-0">
                                                                            <p className="font-medium text-sm truncate">{job.projectName}</p>
                                                                            <p className="text-xs text-gray-500">
                                                                                {job.documentName} • {job.stageType}
                                                                            </p>
                                                                            {job.sourceLanguage && job.targetLanguage && (
                                                                                <p className="text-xs text-gray-500">
                                                                                    {job.sourceLanguage} → {job.targetLanguage}
                                                                                </p>
                                                                            )}
                                                                        </div>
                                                                        <div className="flex items-center gap-3 flex-shrink-0">
                                                                            <Badge variant="outline">{job.wordsCount.toLocaleString()} words</Badge>
                                                                            {job.completedDate && (
                                                                                <span className="text-xs text-gray-500">
                                                                                    {new Date(job.completedDate).toLocaleDateString()}
                                                                                </span>
                                                                            )}
                                                                        </div>
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
                            ) : (
                                <div className="text-center py-12 text-gray-500">
                                    <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                    <p>No data - click "Fetch Data" to load from Smartcat</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </>
            )}

            {!isLoading && !error && jobsData && assignees.length === 0 && (
                <Card>
                    <CardContent className="py-12 text-center">
                        <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-600 font-medium">No completed jobs found</p>
                        <p className="text-sm text-gray-500 mt-1">
                            No completed work found in the selected date range. Try adjusting the dates.
                        </p>
                    </CardContent>
                </Card>
            )}

            <Card className="bg-blue-50 border-blue-200">
                <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                        <ExternalLink className="w-5 h-5 text-blue-600 mt-0.5" />
                        <div className="flex-1">
                            <p className="font-medium text-blue-800 mb-1">Using This Tool</p>
                            <ul className="text-sm text-blue-600 space-y-1">
                                <li>• Select a date range and click "Fetch Data" to load completed work from Smartcat</li>
                                <li>• Green badges show freelancers matched in your database</li>
                                <li>• Yellow badges show assignees not found in your database (use Team Sync to add them)</li>
                                <li>• Export to CSV for payment processing or reconciliation</li>
                                <li>• For actual Smartcat payments, use the Smartcat dashboard</li>
                            </ul>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}