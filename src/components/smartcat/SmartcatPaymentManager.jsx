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
    Calendar, Filter, Loader2, ChevronDown, ChevronUp
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../../utils";

export default function SmartcatPaymentManager() {
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [expandedFreelancer, setExpandedFreelancer] = useState(null);

    const { data: paymentsData, isLoading, refetch, isRefetching } = useQuery({
        queryKey: ['smartcatPayments', dateFrom, dateTo],
        queryFn: async () => {
            const response = await base44.functions.invoke('smartcatPayments', {
                action: 'get_pending_payments',
                filters: {
                    date_from: dateFrom || undefined,
                    date_to: dateTo || undefined
                }
            });
            return response.data;
        },
        enabled: false
    });

    const handleFetchPayments = () => {
        refetch();
    };

    const payments = paymentsData?.payments || [];
    const totalAmount = paymentsData?.total_amount || 0;

    return (
        <div className="space-y-6">
            {/* Filters */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Filter className="w-5 h-5" />
                        Payment Filter
                    </CardTitle>
                    <CardDescription>
                        Fetch completed jobs from Smartcat and prepare payments
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap gap-4 items-end">
                        <div className="space-y-2">
                            <Label>Start Date</Label>
                            <Input
                                type="date"
                                value={dateFrom}
                                onChange={(e) => setDateFrom(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>End Date</Label>
                            <Input
                                type="date"
                                value={dateTo}
                                onChange={(e) => setDateTo(e.target.value)}
                            />
                        </div>
                        <Button onClick={handleFetchPayments} disabled={isLoading || isRefetching}>
                            {(isLoading || isRefetching) ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                                <RefreshCw className="w-4 h-4 mr-2" />
                            )}
                            Fetch Payments
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Summary */}
            {payments.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="bg-green-50 border-green-200">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                                    <DollarSign className="w-6 h-6 text-green-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-green-600">Total Payment</p>
                                    <p className="text-2xl font-bold text-green-700">
                                        ${totalAmount.toFixed(2)}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                                    <CheckCircle2 className="w-6 h-6 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Freelancer Count</p>
                                    <p className="text-2xl font-bold">{payments.length}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                                    <Calendar className="w-6 h-6 text-purple-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Total Jobs</p>
                                    <p className="text-2xl font-bold">
                                        {payments.reduce((sum, p) => sum + p.jobs.length, 0)}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Payments Table */}
            {payments.length > 0 && (
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle>Payment List</CardTitle>
                            <Button variant="outline" size="sm">
                                <Download className="w-4 h-4 mr-2" />
                                Export Excel
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Freelancer</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead className="text-center">Jobs</TableHead>
                                    <TableHead className="text-right">Total</TableHead>
                                    <TableHead></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {payments.map((payment, idx) => (
                                    <React.Fragment key={idx}>
                                        <TableRow 
                                            className="cursor-pointer hover:bg-gray-50"
                                            onClick={() => setExpandedFreelancer(
                                                expandedFreelancer === idx ? null : idx
                                            )}
                                        >
                                            <TableCell>
                                                <Link 
                                                    to={createPageUrl(`FreelancerDetail?id=${payment.freelancer_id}`)}
                                                    className="font-medium hover:text-blue-600"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    {payment.freelancer_name}
                                                </Link>
                                            </TableCell>
                                            <TableCell className="text-gray-600">
                                                {payment.email}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Badge variant="secondary">{payment.jobs.length}</Badge>
                                            </TableCell>
                                            <TableCell className="text-right font-semibold text-green-600">
                                                ${payment.total_amount.toFixed(2)}
                                            </TableCell>
                                            <TableCell>
                                                {expandedFreelancer === idx ? (
                                                    <ChevronUp className="w-4 h-4 text-gray-400" />
                                                ) : (
                                                    <ChevronDown className="w-4 h-4 text-gray-400" />
                                                )}
                                            </TableCell>
                                        </TableRow>
                                        {expandedFreelancer === idx && (
                                            <TableRow>
                                                <TableCell colSpan={5} className="bg-gray-50 p-4">
                                                    <div className="space-y-2">
                                                        <p className="text-sm font-medium text-gray-700 mb-3">Job Details:</p>
                                                        {payment.jobs.map((job, jobIdx) => (
                                                            <div key={jobIdx} className="flex items-center justify-between p-2 bg-white rounded border">
                                                                <div>
                                                                    <p className="font-medium text-sm">{job.project_name || 'Project'}</p>
                                                                    <p className="text-xs text-gray-500">
                                                                        {job.source_language} → {job.target_language}
                                                                        {job.word_count && ` • ${job.word_count} words`}
                                                                    </p>
                                                                </div>
                                                                <p className="font-semibold text-green-600">${job.amount?.toFixed(2)}</p>
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

            {!isLoading && payments.length === 0 && paymentsData && (
                <Card>
                    <CardContent className="py-12 text-center">
                        <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-600">No pending payments found</p>
                        <p className="text-sm text-gray-500">Try changing the date range</p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}