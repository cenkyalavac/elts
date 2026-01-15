import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog";
import { 
    Search, Plus, Star, AlertTriangle, 
    CheckCircle2, Clock, Eye, BarChart3, Users, Award, Upload, FileText, Share2
} from "lucide-react";
import ShareReportDialog from "@/components/quality/ShareReportDialog";
import QualityReportForm from "@/components/quality/QualityReportForm";
import QualityScoreCard from "@/components/quality/QualityScoreCard";
import QualityFilters from "@/components/quality/QualityFilters";
import BulkQualityImport from "@/components/quality/BulkQualityImport";

export default function QualityManagementPage() {
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState("reports");
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [createReportType, setCreateReportType] = useState("LQA");
    const [showImportDialog, setShowImportDialog] = useState(false);
    const [shareDialogReport, setShareDialogReport] = useState(null);
    const [filters, setFilters] = useState({
        freelancer_id: "",
        content_type: "",
        job_type: "",
        client_account: "",
        source_language: "",
        target_language: "",
        status: "",
        report_type: "",
        search: ""
    });

    const { data: reports = [], isLoading: reportsLoading } = useQuery({
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
            return allSettings[0] || { lqa_weight: 4, qs_multiplier: 20, dispute_period_days: 7 };
        },
    });

    const clientAccounts = useMemo(() => {
        const accounts = new Set(reports.map(r => r.client_account).filter(Boolean));
        return Array.from(accounts);
    }, [reports]);

    const languages = useMemo(() => {
        const sourceLangs = new Set(reports.map(r => r.source_language).filter(Boolean));
        const targetLangs = new Set(reports.map(r => r.target_language).filter(Boolean));
        return {
            source: Array.from(sourceLangs),
            target: Array.from(targetLangs)
        };
    }, [reports]);

    const filteredReports = useMemo(() => {
        return reports.filter(report => {
            if (filters.freelancer_id && report.freelancer_id !== filters.freelancer_id) return false;
            if (filters.content_type && report.content_type !== filters.content_type) return false;
            if (filters.job_type && report.job_type !== filters.job_type) return false;
            if (filters.client_account && report.client_account !== filters.client_account) return false;
            if (filters.source_language && report.source_language !== filters.source_language) return false;
            if (filters.target_language && report.target_language !== filters.target_language) return false;
            if (filters.status && report.status !== filters.status) return false;
            if (filters.report_type && report.report_type !== filters.report_type) return false;
            if (filters.search) {
                const freelancer = freelancers.find(f => f.id === report.freelancer_id);
                const searchLower = filters.search.toLowerCase();
                if (!freelancer?.full_name?.toLowerCase().includes(searchLower) &&
                    !report.project_name?.toLowerCase().includes(searchLower)) {
                    return false;
                }
            }
            return true;
        });
    }, [reports, filters, freelancers]);

    const calculateCombinedScore = (lqaScores, qsScores) => {
        const lqaWeight = settings?.lqa_weight || 4;
        const qsMultiplier = settings?.qs_multiplier || 20;
        
        const avgLqa = lqaScores.length > 0 
            ? lqaScores.reduce((a, b) => a + b, 0) / lqaScores.length 
            : 0;
        const avgQs = qsScores.length > 0 
            ? qsScores.reduce((a, b) => a + b, 0) / qsScores.length 
            : 0;
        
        if (lqaScores.length > 0 && qsScores.length > 0) {
            return ((avgLqa * lqaWeight) + (avgQs * qsMultiplier)) / (lqaWeight + 1);
        } else if (lqaScores.length > 0) {
            return avgLqa;
        } else if (qsScores.length > 0) {
            return avgQs * qsMultiplier;
        }
        return 0;
    };

    const getFreelancerQualityStats = (freelancerId) => {
        const freelancerReports = filteredReports.filter(r => 
            r.freelancer_id === freelancerId && 
            (r.status === 'finalized' || r.status === 'translator_accepted')
        );
        
        const lqaScores = freelancerReports.filter(r => r.lqa_score != null).map(r => r.lqa_score);
        const qsScores = freelancerReports.filter(r => r.qs_score != null).map(r => r.qs_score);
        
        return {
            totalReviews: freelancerReports.length,
            avgLqa: lqaScores.length > 0 
                ? (lqaScores.reduce((a, b) => a + b, 0) / lqaScores.length).toFixed(1) 
                : "-",
            avgQs: qsScores.length > 0 
                ? (qsScores.reduce((a, b) => a + b, 0) / qsScores.length).toFixed(1) 
                : "-",
            combinedScore: calculateCombinedScore(lqaScores, qsScores).toFixed(1)
        };
    };

    const lqaQualifiedFreelancers = useMemo(() => {
        return freelancers.filter(f => f.can_do_lqa || f.service_types?.includes('LQA'));
    }, [freelancers]);

    const stats = useMemo(() => {
        const pending = reports.filter(r => 
            r.status === 'pending_translator_review' || 
            r.status === 'pending_final_review'
        ).length;
        const disputed = reports.filter(r => r.status === 'translator_disputed').length;
        const finalized = reports.filter(r => r.status === 'finalized' || r.status === 'translator_accepted').length;
        
        return { pending, disputed, finalized, total: reports.length };
    }, [reports]);

    const createMutation = useMutation({
        mutationFn: (data) => base44.entities.QualityReport.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['qualityReports'] });
            setShowCreateDialog(false);
        },
    });

    const getStatusBadge = (status) => {
        const config = {
            draft: { color: "bg-gray-100 text-gray-700", label: "Draft" },
            submitted: { color: "bg-blue-100 text-blue-700", label: "Submitted" },
            pending_translator_review: { color: "bg-yellow-100 text-yellow-700", label: "Pending Review" },
            translator_accepted: { color: "bg-green-100 text-green-700", label: "Accepted" },
            translator_disputed: { color: "bg-red-100 text-red-700", label: "Disputed" },
            pending_final_review: { color: "bg-orange-100 text-orange-700", label: "Final Review" },
            finalized: { color: "bg-emerald-100 text-emerald-700", label: "Finalized" }
        };
        return config[status] || { color: "bg-gray-100", label: status };
    };

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold">Quality Management</h1>
                    <p className="text-gray-500">LQA and QS reports</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Link to={createPageUrl('QuizManagement')}>
                        <Button variant="outline" size="sm">
                            <Award className="w-4 h-4" />
                            <span className="hidden sm:inline ml-2">Quizzes</span>
                        </Button>
                    </Link>
                    <Link to={createPageUrl('PerformanceAnalytics')}>
                        <Button variant="outline" size="sm">
                            <BarChart3 className="w-4 h-4" />
                            <span className="hidden sm:inline ml-2">Analytics</span>
                        </Button>
                    </Link>
                    <Button variant="outline" size="sm" onClick={() => setShowImportDialog(true)}>
                        <Upload className="w-4 h-4" />
                        <span className="hidden sm:inline ml-2">Import</span>
                    </Button>
                    <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                        <DialogTrigger asChild>
                            <Button className="bg-purple-600 hover:bg-purple-700">
                                <Plus className="w-4 h-4 mr-2" />
                                New Report
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>Create Quality Report</DialogTitle>
                            </DialogHeader>
                            <div className="flex gap-2 mb-4">
                                <Button 
                                    variant={createReportType === 'LQA' ? 'default' : 'outline'}
                                    onClick={() => setCreateReportType('LQA')}
                                    className={createReportType === 'LQA' ? 'bg-blue-600' : ''}
                                >
                                    <FileText className="w-4 h-4 mr-2" />
                                    LQA Report
                                </Button>
                                <Button 
                                    variant={createReportType === 'QS' ? 'default' : 'outline'}
                                    onClick={() => setCreateReportType('QS')}
                                    className={createReportType === 'QS' ? 'bg-yellow-600' : ''}
                                >
                                    <Star className="w-4 h-4 mr-2" />
                                    QS Report
                                </Button>
                            </div>
                            <QualityReportForm 
                                freelancers={freelancers}
                                onSubmit={(data) => createMutation.mutate(data)}
                                onCancel={() => setShowCreateDialog(false)}
                                settings={settings}
                                defaultReportType={createReportType}
                            />
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Total Reports</p>
                                <p className="text-2xl font-bold">{stats.total}</p>
                            </div>
                            <BarChart3 className="w-8 h-8 text-purple-500" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Pending</p>
                                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                            </div>
                            <Clock className="w-8 h-8 text-yellow-500" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Disputed</p>
                                <p className="text-2xl font-bold text-red-600">{stats.disputed}</p>
                            </div>
                            <AlertTriangle className="w-8 h-8 text-red-500" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Finalized</p>
                                <p className="text-2xl font-bold text-green-600">{stats.finalized}</p>
                            </div>
                            <CheckCircle2 className="w-8 h-8 text-green-500" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="mb-4 flex flex-wrap gap-1 h-auto p-1 w-full md:w-auto">
                    <TabsTrigger value="reports" className="flex-1 md:flex-none">Reports</TabsTrigger>
                    <TabsTrigger value="scores" className="flex-1 md:flex-none">Scores</TabsTrigger>
                    <TabsTrigger value="lqa-reviewers" className="flex-1 md:flex-none">LQA Reviewers</TabsTrigger>
                </TabsList>

                <TabsContent value="reports">
                    <QualityFilters 
                        filters={filters}
                        setFilters={setFilters}
                        freelancers={freelancers}
                        clientAccounts={clientAccounts}
                        languages={languages}
                    />

                    <Card>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Freelancer</TableHead>
                                        <TableHead>Project</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Languages</TableHead>
                                        <TableHead>Content</TableHead>
                                        <TableHead>Job Type</TableHead>
                                        <TableHead>LQA</TableHead>
                                        <TableHead>QS</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredReports.map(report => {
                                        const freelancer = freelancers.find(f => f.id === report.freelancer_id);
                                        const statusConfig = getStatusBadge(report.status);
                                        return (
                                            <TableRow key={report.id}>
                                                <TableCell className="font-medium">
                                                    {freelancer?.full_name || "Unknown"}
                                                </TableCell>
                                                <TableCell>{report.project_name || "-"}</TableCell>
                                                <TableCell>
                                                    <Badge variant="outline">
                                                        {report.report_type}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    {report.source_language && report.target_language 
                                                        ? `${report.source_language} → ${report.target_language}`
                                                        : "-"
                                                    }
                                                </TableCell>
                                                <TableCell>
                                                    {report.content_type || report.translation_type || "-"}
                                                </TableCell>
                                                <TableCell>{report.job_type || "-"}</TableCell>
                                                <TableCell>
                                                    {report.lqa_score != null ? (
                                                        <span className={`font-medium ${
                                                            report.lqa_score >= 90 ? 'text-green-600' :
                                                            report.lqa_score >= 70 ? 'text-yellow-600' :
                                                            'text-red-600'
                                                        }`}>
                                                            {report.lqa_score}
                                                        </span>
                                                    ) : "-"}
                                                </TableCell>
                                                <TableCell>
                                                    {report.qs_score != null ? (
                                                        <div className="flex items-center gap-1">
                                                            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                                            <span>{report.qs_score}</span>
                                                        </div>
                                                    ) : "-"}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge className={statusConfig.color}>
                                                        {statusConfig.label}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-gray-500 text-sm">
                                                    {new Date(report.report_date || report.created_date).toLocaleDateString()}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex gap-1">
                                                        {(report.status === 'finalized' || report.status === 'translator_accepted') && (
                                                            <Button 
                                                                variant="ghost" 
                                                                size="sm"
                                                                onClick={() => setShareDialogReport(report)}
                                                                title="Share with freelancer"
                                                            >
                                                                <Share2 className="w-4 h-4" />
                                                            </Button>
                                                        )}
                                                        <Link to={createPageUrl(`QualityReportDetail?id=${report.id}`)}>
                                                            <Button variant="ghost" size="sm">
                                                                <Eye className="w-4 h-4" />
                                                            </Button>
                                                        </Link>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                    {filteredReports.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={11} className="text-center py-8 text-gray-500">
                                                {reportsLoading ? "Loading..." : "No reports found"}
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="scores">
                    <QualityFilters 
                        filters={filters}
                        setFilters={setFilters}
                        freelancers={freelancers}
                        clientAccounts={clientAccounts}
                        languages={languages}
                        showFreelancerFilter={false}
                    />

                    <div className="grid gap-4">
                        {freelancers
                            .filter(f => f.status === 'Approved')
                            .map(freelancer => {
                                const stats = getFreelancerQualityStats(freelancer.id);
                                if (stats.totalReviews === 0 && !filters.freelancer_id) return null;
                                
                                return (
                                    <QualityScoreCard 
                                        key={freelancer.id}
                                        freelancer={freelancer}
                                        stats={stats}
                                        filters={filters}
                                    />
                                );
                            })
                            .filter(Boolean)
                        }
                    </div>
                </TabsContent>

                <TabsContent value="lqa-reviewers">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Users className="w-5 h-5" />
                                LQA Qualified Freelancers
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>LQA Language Pairs</TableHead>
                                        <TableHead>LQA Specializations</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {lqaQualifiedFreelancers.map(freelancer => (
                                        <TableRow key={freelancer.id}>
                                            <TableCell className="font-medium">
                                                {freelancer.full_name}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-wrap gap-1">
                                                    {freelancer.lqa_languages?.map((lp, i) => (
                                                        <Badge key={i} variant="outline" className="text-xs">
                                                            {lp.source_language} → {lp.target_language}
                                                        </Badge>
                                                    )) || freelancer.language_pairs?.slice(0, 3).map((lp, i) => (
                                                        <Badge key={i} variant="outline" className="text-xs">
                                                            {lp.source_language} → {lp.target_language}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-wrap gap-1">
                                                    {(freelancer.lqa_specializations || freelancer.specializations)?.slice(0, 3).map((spec, i) => (
                                                        <Badge key={i} className="bg-purple-100 text-purple-700 text-xs">
                                                            {spec}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={freelancer.status === 'Approved' ? 'bg-green-100 text-green-700' : 'bg-gray-100'}>
                                                    {freelancer.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Link to={createPageUrl(`FreelancerDetail?id=${freelancer.id}`)}>
                                                    <Button variant="ghost" size="sm">
                                                        <Eye className="w-4 h-4" />
                                                    </Button>
                                                </Link>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {lqaQualifiedFreelancers.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                                                No LQA qualified freelancers found
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>


            </Tabs>

            {/* Import Dialog */}
            <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Import Historical Quality Data</DialogTitle>
                    </DialogHeader>
                    <BulkQualityImport 
                        freelancers={freelancers}
                        onComplete={() => {
                            queryClient.invalidateQueries({ queryKey: ['qualityReports'] });
                            setShowImportDialog(false);
                        }}
                    />
                </DialogContent>
            </Dialog>

            {/* Share Report Dialog */}
            {shareDialogReport && (
                <ShareReportDialog
                    open={!!shareDialogReport}
                    onOpenChange={(open) => !open && setShareDialogReport(null)}
                    report={shareDialogReport}
                    freelancer={freelancers.find(f => f.id === shareDialogReport.freelancer_id)}
                />
            )}
        </div>
    );
}