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
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter
} from "@/components/ui/dialog";
import { 
    Search, Plus, Filter, Star, FileCheck, AlertTriangle, 
    CheckCircle2, Clock, Eye, TrendingUp, BarChart3, Users
} from "lucide-react";
import QualityReportForm from "@/components/quality/QualityReportForm";
import QualityReportCard from "@/components/quality/QualityReportCard";
import QualityScoreCard from "@/components/quality/QualityScoreCard";
import QualityFilters from "@/components/quality/QualityFilters";

const TRANSLATION_TYPES = ["Technical", "Marketing", "Legal", "Medical", "General", "UI/UX", "Support", "Creative"];
const REPORT_STATUSES = ["draft", "submitted", "pending_translator_review", "translator_accepted", "translator_disputed", "pending_final_review", "finalized"];

export default function QualityManagementPage() {
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState("reports");
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [selectedReport, setSelectedReport] = useState(null);
    const [filters, setFilters] = useState({
        freelancer_id: "",
        translation_type: "",
        client_account: "",
        source_language: "",
        target_language: "",
        status: "",
        report_type: "",
        search: ""
    });

    // Fetch data
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

    // Get unique client accounts from reports
    const clientAccounts = useMemo(() => {
        const accounts = new Set(reports.map(r => r.client_account).filter(Boolean));
        return Array.from(accounts);
    }, [reports]);

    // Get unique languages from reports
    const languages = useMemo(() => {
        const sourceLangs = new Set(reports.map(r => r.source_language).filter(Boolean));
        const targetLangs = new Set(reports.map(r => r.target_language).filter(Boolean));
        return {
            source: Array.from(sourceLangs),
            target: Array.from(targetLangs)
        };
    }, [reports]);

    // Filter reports
    const filteredReports = useMemo(() => {
        return reports.filter(report => {
            if (filters.freelancer_id && report.freelancer_id !== filters.freelancer_id) return false;
            if (filters.translation_type && report.translation_type !== filters.translation_type) return false;
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

    // Calculate combined score
    const calculateCombinedScore = (lqaScores, qsScores) => {
        const lqaWeight = settings?.lqa_weight || 4;
        const qsMultiplier = settings?.qs_multiplier || 20;
        
        const avgLqa = lqaScores.length > 0 
            ? lqaScores.reduce((a, b) => a + b, 0) / lqaScores.length 
            : 0;
        const avgQs = qsScores.length > 0 
            ? qsScores.reduce((a, b) => a + b, 0) / qsScores.length 
            : 0;
        
        // Combined = (LQA avg * weight + QS avg * multiplier) / (weight + 1)
        // This normalizes to 100
        if (lqaScores.length > 0 && qsScores.length > 0) {
            return ((avgLqa * lqaWeight) + (avgQs * qsMultiplier)) / (lqaWeight + 1);
        } else if (lqaScores.length > 0) {
            return avgLqa;
        } else if (qsScores.length > 0) {
            return avgQs * qsMultiplier;
        }
        return 0;
    };

    // Get freelancer quality stats with filters
    const getFreelancerQualityStats = (freelancerId) => {
        const freelancerReports = filteredReports.filter(r => 
            r.freelancer_id === freelancerId && 
            (r.status === 'finalized' || r.status === 'translator_accepted')
        );
        
        const lqaScores = freelancerReports
            .filter(r => r.lqa_score != null)
            .map(r => r.lqa_score);
        
        const qsScores = freelancerReports
            .filter(r => r.qs_score != null)
            .map(r => r.qs_score);
        
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

    // LQA qualified freelancers
    const lqaQualifiedFreelancers = useMemo(() => {
        return freelancers.filter(f => f.can_do_lqa || f.service_types?.includes('LQA'));
    }, [freelancers]);

    // Stats
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
            draft: { color: "bg-gray-100 text-gray-700", label: "Taslak" },
            submitted: { color: "bg-blue-100 text-blue-700", label: "Gönderildi" },
            pending_translator_review: { color: "bg-yellow-100 text-yellow-700", label: "Çevirmen İncelemesinde" },
            translator_accepted: { color: "bg-green-100 text-green-700", label: "Kabul Edildi" },
            translator_disputed: { color: "bg-red-100 text-red-700", label: "İtiraz Edildi" },
            pending_final_review: { color: "bg-orange-100 text-orange-700", label: "Final İncelemede" },
            finalized: { color: "bg-emerald-100 text-emerald-700", label: "Tamamlandı" }
        };
        return config[status] || { color: "bg-gray-100", label: status };
    };

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold">Kalite Yönetimi</h1>
                    <p className="text-gray-500">LQA ve QS raporlarını yönetin</p>
                </div>
                <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                    <DialogTrigger asChild>
                        <Button className="bg-purple-600 hover:bg-purple-700">
                            <Plus className="w-4 h-4 mr-2" />
                            Yeni Rapor
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Yeni Kalite Raporu Oluştur</DialogTitle>
                        </DialogHeader>
                        <QualityReportForm 
                            freelancers={freelancers}
                            onSubmit={(data) => createMutation.mutate(data)}
                            onCancel={() => setShowCreateDialog(false)}
                            settings={settings}
                        />
                    </DialogContent>
                </Dialog>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Toplam Rapor</p>
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
                                <p className="text-sm text-gray-500">Bekleyen</p>
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
                                <p className="text-sm text-gray-500">İtiraz Edilen</p>
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
                                <p className="text-sm text-gray-500">Tamamlanan</p>
                                <p className="text-2xl font-bold text-green-600">{stats.finalized}</p>
                            </div>
                            <CheckCircle2 className="w-8 h-8 text-green-500" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="mb-4">
                    <TabsTrigger value="reports">Kalite Raporları</TabsTrigger>
                    <TabsTrigger value="scores">Freelancer Skorları</TabsTrigger>
                    <TabsTrigger value="lqa-reviewers">LQA Reviewerlar</TabsTrigger>
                </TabsList>

                <TabsContent value="reports">
                    {/* Filters */}
                    <QualityFilters 
                        filters={filters}
                        setFilters={setFilters}
                        freelancers={freelancers}
                        clientAccounts={clientAccounts}
                        languages={languages}
                    />

                    {/* Reports Table */}
                    <Card>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Çevirmen</TableHead>
                                        <TableHead>Proje</TableHead>
                                        <TableHead>Tip</TableHead>
                                        <TableHead>Dil Çifti</TableHead>
                                        <TableHead>Alan</TableHead>
                                        <TableHead>LQA</TableHead>
                                        <TableHead>QS</TableHead>
                                        <TableHead>Durum</TableHead>
                                        <TableHead>Tarih</TableHead>
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
                                                    {freelancer?.full_name || "Bilinmiyor"}
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
                                                <TableCell>{report.translation_type || "-"}</TableCell>
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
                                                    {new Date(report.created_date).toLocaleDateString('tr-TR')}
                                                </TableCell>
                                                <TableCell>
                                                    <Link to={createPageUrl(`QualityReportDetail?id=${report.id}`)}>
                                                        <Button variant="ghost" size="sm">
                                                            <Eye className="w-4 h-4" />
                                                        </Button>
                                                    </Link>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                    {filteredReports.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={10} className="text-center py-8 text-gray-500">
                                                {reportsLoading ? "Yükleniyor..." : "Rapor bulunamadı"}
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="scores">
                    {/* Filters for scores view */}
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
                                LQA Yapabilecek Freelancerlar
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>İsim</TableHead>
                                        <TableHead>LQA Dil Çiftleri</TableHead>
                                        <TableHead>LQA Uzmanlıklar</TableHead>
                                        <TableHead>Durum</TableHead>
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
                                                LQA yapabilecek freelancer bulunamadı
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}