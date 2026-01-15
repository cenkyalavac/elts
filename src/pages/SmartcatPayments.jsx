import React, { useState } from 'react';
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "../utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { 
    DollarSign, Users, FileSpreadsheet, RefreshCw, 
    CheckCircle2, Clock, AlertCircle, ExternalLink
} from "lucide-react";
import BulkSmartcatPayment from "../components/smartcat/BulkSmartcatPayment";
import SmartcatPaymentDialog from "../components/smartcat/SmartcatPaymentDialog";

export default function SmartcatPaymentsPage() {
    const [selectedLinguist, setSelectedLinguist] = useState(null);
    const [showPaymentDialog, setShowPaymentDialog] = useState(false);

    // Check user permissions
    const { data: user } = useQuery({
        queryKey: ['currentUser'],
        queryFn: () => base44.auth.me(),
    });

    // Fetch Smartcat account info
    const { data: accountInfo, isLoading: accountLoading, error: accountError } = useQuery({
        queryKey: ['smartcatAccount'],
        queryFn: async () => {
            const response = await base44.functions.invoke('smartcat', {
                action: 'getAccount'
            });
            if (!response.data?.success) {
                throw new Error(response.data?.error || 'Failed to connect');
            }
            return response.data?.data;
        },
        staleTime: 300000,
        retry: 1,
    });

    // Fetch Smartcat projects (to get linguist info)
    const { data: projects = [], isLoading: projectsLoading, refetch: refetchProjects } = useQuery({
        queryKey: ['smartcatProjects'],
        queryFn: async () => {
            const response = await base44.functions.invoke('smartcat', {
                action: 'getProjects'
            });
            return response.data?.data || [];
        },
        staleTime: 300000,
        enabled: !!accountInfo,
        retry: 1,
    });

    const isAdmin = user?.role === 'admin';

    if (!isAdmin) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
                <Card className="max-w-md">
                    <CardContent className="pt-8 text-center">
                        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                        <h2 className="text-xl font-bold mb-2">Access Denied</h2>
                        <p className="text-gray-600">Only administrators can access Smartcat payments.</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                                <span className="text-orange-600 font-bold">SC</span>
                            </div>
                            Smartcat Payments
                        </h1>
                        <p className="text-gray-600 mt-1">
                            Manage payments to Smartcat translators
                        </p>
                    </div>
                    {accountInfo ? (
                        <Badge variant="outline" className="text-base px-4 py-2">
                            <CheckCircle2 className="w-4 h-4 mr-2 text-green-500" />
                            Connected: {accountInfo.name}
                        </Badge>
                    ) : accountError ? (
                        <Badge variant="outline" className="text-base px-4 py-2 border-red-300 text-red-600">
                            <AlertCircle className="w-4 h-4 mr-2" />
                            Connection Error
                        </Badge>
                    ) : null}
                </div>

                <Tabs defaultValue="bulk" className="space-y-6">
                    <TabsList>
                        <TabsTrigger value="bulk" className="gap-2">
                            <FileSpreadsheet className="w-4 h-4" />
                            Bulk Payment
                        </TabsTrigger>
                        <TabsTrigger value="linguists" className="gap-2">
                            <Users className="w-4 h-4" />
                            Smartcat Projects
                        </TabsTrigger>
                    </TabsList>

                    {/* Bulk Payment Tab */}
                    <TabsContent value="bulk">
                        <BulkSmartcatPayment />
                    </TabsContent>

                    {/* Projects Tab */}
                    <TabsContent value="linguists">
                        <Card className="border-0 shadow-sm">
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle className="flex items-center gap-2">
                                        <Users className="w-5 h-5 text-orange-600" />
                                        Smartcat Projects ({projects.length})
                                    </CardTitle>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => refetchProjects()}
                                    >
                                        <RefreshCw className="w-4 h-4 mr-2" />
                                        Refresh
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {projectsLoading ? (
                                    <div className="space-y-4">
                                        {Array(5).fill(0).map((_, i) => (
                                            <Skeleton key={i} className="h-16 w-full" />
                                        ))}
                                    </div>
                                ) : !accountInfo ? (
                                    <div className="text-center py-12 text-gray-500">
                                        <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-300" />
                                        <p className="font-medium text-red-600 mb-2">Connection Error</p>
                                        <p className="text-sm">Please verify your SMARTCAT_ACCOUNT_ID and SMARTCAT_API_KEY are correctly configured.</p>
                                        {accountError && (
                                            <p className="text-xs text-gray-400 mt-2">{accountError.message}</p>
                                        )}
                                    </div>
                                ) : projects.length === 0 ? (
                                    <div className="text-center py-12 text-gray-500">
                                        <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                                        <p>No projects found in your Smartcat account</p>
                                        <p className="text-sm mt-2">Projects with assigned linguists will appear here</p>
                                    </div>
                                ) : (
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Project Name</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead>Created</TableHead>
                                                <TableHead>Languages</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {projects.map((project) => (
                                                <TableRow key={project.id}>
                                                    <TableCell>
                                                        <div className="font-medium">{project.name}</div>
                                                        <div className="text-xs text-gray-400">ID: {project.id}</div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline">{project.status}</Badge>
                                                    </TableCell>
                                                    <TableCell className="text-gray-600 text-sm">
                                                        {project.creationDate ? new Date(project.creationDate).toLocaleDateString() : '-'}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex flex-wrap gap-1">
                                                            {project.targetLanguages?.slice(0, 3).map((lang, idx) => (
                                                                <Badge key={idx} variant="outline" className="text-xs">
                                                                    {project.sourceLanguage} → {lang}
                                                                </Badge>
                                                            ))}
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>


            </div>
        </div>
    );
}