import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "../../utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { Star, TrendingUp, TrendingDown, Eye, Filter, BarChart3 } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

const TRANSLATION_TYPES = ["Technical", "Marketing", "Legal", "Medical", "General", "UI/UX", "Support", "Creative"];

export default function FreelancerQualityTab({ freelancerId }) {
    const [filters, setFilters] = useState({
        translation_type: "",
        client_account: "",
        source_language: "",
        target_language: ""
    });

    const { data: reports = [], isLoading } = useQuery({
        queryKey: ['freelancerQualityReports', freelancerId],
        queryFn: () => base44.entities.QualityReport.filter({ freelancer_id: freelancerId }),
    });

    const { data: settings } = useQuery({
        queryKey: ['qualitySettings'],
        queryFn: async () => {
            const allSettings = await base44.entities.QualitySettings.list();
            return allSettings[0] || { lqa_weight: 4, qs_multiplier: 20 };
        },
    });

    const lqaWeight = settings?.lqa_weight || 4;
    const qsMultiplier = settings?.qs_multiplier || 20;

    // Get unique values for filters
    const filterOptions = useMemo(() => ({
        clientAccounts: [...new Set(reports.map(r => r.client_account).filter(Boolean))],
        sourceLanguages: [...new Set(reports.map(r => r.source_language).filter(Boolean))],
        targetLanguages: [...new Set(reports.map(r => r.target_language).filter(Boolean))]
    }), [reports]);

    // Filter reports
    const filteredReports = useMemo(() => {
        return reports.filter(r => {
            if (filters.translation_type && r.translation_type !== filters.translation_type) return false;
            if (filters.client_account && r.client_account !== filters.client_account) return false;
            if (filters.source_language && r.source_language !== filters.source_language) return false;
            if (filters.target_language && r.target_language !== filters.target_language) return false;
            return true;
        });
    }, [reports, filters]);

    // Calculate stats
    const stats = useMemo(() => {
        const finalizedReports = filteredReports.filter(r => 
            r.status === 'finalized' || r.status === 'translator_accepted'
        );

        const lqaScores = finalizedReports.filter(r => r.lqa_score != null).map(r => r.lqa_score);
        const qsScores = finalizedReports.filter(r => r.qs_score != null).map(r => r.qs_score);

        const avgLqa = lqaScores.length > 0 
            ? lqaScores.reduce((a, b) => a + b, 0) / lqaScores.length 
            : null;
        const avgQs = qsScores.length > 0 
            ? qsScores.reduce((a, b) => a + b, 0) / qsScores.length 
            : null;

        let combined = null;
        if (avgLqa != null && avgQs != null) {
            combined = ((avgLqa * lqaWeight) + (avgQs * qsMultiplier)) / (lqaWeight + 1);
        } else if (avgLqa != null) {
            combined = avgLqa;
        } else if (avgQs != null) {
            combined = avgQs * qsMultiplier;
        }

        return {
            totalReviews: finalizedReports.length,
            avgLqa,
            avgQs,
            combined,
            lqaCount: lqaScores.length,
            qsCount: qsScores.length
        };
    }, [filteredReports, lqaWeight, qsMultiplier]);

    const hasFilters = filters.translation_type || filters.client_account || 
                       filters.source_language || filters.target_language;

    const getScoreColor = (score, type = 'lqa') => {
        if (score == null) return "text-gray-400";
        if (type === 'qs') {
            if (score >= 4) return "text-green-600";
            if (score >= 3) return "text-yellow-600";
            return "text-red-600";
        }
        if (score >= 80) return "text-green-600";
        if (score >= 60) return "text-yellow-600";
        return "text-red-600";
    };

    return (
        <div className="space-y-6">
            {/* Combined Score Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className={`${
                    stats.combined != null && stats.combined >= 80 ? 'bg-green-50 border-green-200' :
                    stats.combined != null && stats.combined >= 60 ? 'bg-yellow-50 border-yellow-200' :
                    stats.combined != null ? 'bg-red-50 border-red-200' : ''
                }`}>
                    <CardContent className="pt-6 text-center">
                        <p className="text-sm text-gray-500 mb-1">Combined Score</p>
                        <p className={`text-4xl font-bold ${getScoreColor(stats.combined)}`}>
                            {stats.combined != null ? stats.combined.toFixed(1) : "-"}
                        </p>
                        {hasFilters && (
                            <Badge className="mt-2 bg-purple-100 text-purple-700">Filtrelenmiş</Badge>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6 text-center">
                        <p className="text-sm text-gray-500 mb-1">LQA Ortalaması</p>
                        <p className={`text-3xl font-bold ${getScoreColor(stats.avgLqa)}`}>
                            {stats.avgLqa != null ? stats.avgLqa.toFixed(1) : "-"}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">{stats.lqaCount} değerlendirme</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6 text-center">
                        <p className="text-sm text-gray-500 mb-1">QS Ortalaması</p>
                        <div className="flex items-center justify-center gap-1">
                            <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                            <span className={`text-3xl font-bold ${getScoreColor(stats.avgQs, 'qs')}`}>
                                {stats.avgQs != null ? stats.avgQs.toFixed(1) : "-"}
                            </span>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">{stats.qsCount} değerlendirme</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6 text-center">
                        <p className="text-sm text-gray-500 mb-1">Toplam</p>
                        <p className="text-3xl font-bold text-purple-600">{stats.totalReviews}</p>
                        <p className="text-xs text-gray-400 mt-1">değerlendirme</p>
                    </CardContent>
                </Card>
            </div>

            {/* Formula Info */}
            <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-600">
                <BarChart3 className="w-4 h-4 inline-block mr-2" />
                Combined Score Formülü: (LQA Ort. × {lqaWeight} + QS Ort. × {qsMultiplier}) / {lqaWeight + 1}
            </div>

            {/* Filters */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                        <Filter className="w-4 h-4" />
                        Filtreler
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <Select
                            value={filters.translation_type}
                            onValueChange={(v) => setFilters(prev => ({ ...prev, translation_type: v === "all" ? "" : v }))}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Çeviri Alanı" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tüm Alanlar</SelectItem>
                                {TRANSLATION_TYPES.map(type => (
                                    <SelectItem key={type} value={type}>{type}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select
                            value={filters.client_account}
                            onValueChange={(v) => setFilters(prev => ({ ...prev, client_account: v === "all" ? "" : v }))}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Müşteri" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tüm Müşteriler</SelectItem>
                                {filterOptions.clientAccounts.map(acc => (
                                    <SelectItem key={acc} value={acc}>{acc}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select
                            value={filters.source_language}
                            onValueChange={(v) => setFilters(prev => ({ ...prev, source_language: v === "all" ? "" : v }))}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Kaynak Dil" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tüm Diller</SelectItem>
                                {filterOptions.sourceLanguages.map(lang => (
                                    <SelectItem key={lang} value={lang}>{lang}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select
                            value={filters.target_language}
                            onValueChange={(v) => setFilters(prev => ({ ...prev, target_language: v === "all" ? "" : v }))}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Hedef Dil" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tüm Diller</SelectItem>
                                {filterOptions.targetLanguages.map(lang => (
                                    <SelectItem key={lang} value={lang}>{lang}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Reports Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Kalite Raporları</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Tarih</TableHead>
                                <TableHead>Proje</TableHead>
                                <TableHead>Tip</TableHead>
                                <TableHead>Alan</TableHead>
                                <TableHead>Dil</TableHead>
                                <TableHead>LQA</TableHead>
                                <TableHead>QS</TableHead>
                                <TableHead>Durum</TableHead>
                                <TableHead></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredReports.map(report => (
                                <TableRow key={report.id}>
                                    <TableCell className="text-sm text-gray-500">
                                        {format(new Date(report.created_date), 'dd MMM yy', { locale: tr })}
                                    </TableCell>
                                    <TableCell>{report.project_name || "-"}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{report.report_type}</Badge>
                                    </TableCell>
                                    <TableCell>{report.translation_type || "-"}</TableCell>
                                    <TableCell>
                                        {report.source_language && report.target_language 
                                            ? `${report.source_language}→${report.target_language}`
                                            : "-"
                                        }
                                    </TableCell>
                                    <TableCell>
                                        <span className={getScoreColor(report.lqa_score)}>
                                            {report.lqa_score ?? "-"}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        {report.qs_score != null ? (
                                            <div className="flex items-center gap-1">
                                                <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                                                {report.qs_score}
                                            </div>
                                        ) : "-"}
                                    </TableCell>
                                    <TableCell>
                                        <Badge className={
                                            report.status === 'finalized' || report.status === 'translator_accepted'
                                                ? 'bg-green-100 text-green-700'
                                                : report.status === 'translator_disputed'
                                                    ? 'bg-red-100 text-red-700'
                                                    : 'bg-gray-100 text-gray-700'
                                        }>
                                            {report.status === 'finalized' || report.status === 'translator_accepted' ? 'Tamamlandı' :
                                             report.status === 'translator_disputed' ? 'İtiraz' : 'Bekliyor'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Link to={createPageUrl(`QualityReportDetail?id=${report.id}`)}>
                                            <Button variant="ghost" size="sm">
                                                <Eye className="w-4 h-4" />
                                            </Button>
                                        </Link>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {filteredReports.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                                        {isLoading ? "Yükleniyor..." : "Kalite raporu bulunamadı"}
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}