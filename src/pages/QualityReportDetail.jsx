import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
    ArrowLeft, Star, AlertTriangle, CheckCircle2, Clock, 
    Send, MessageSquare, FileCheck, User, Calendar, Share2
} from "lucide-react";
import ShareReportDialog from "@/components/quality/ShareReportDialog";
import { format, addDays } from "date-fns";
import { tr } from "date-fns/locale";

const STATUS_CONFIG = {
    draft: { color: "bg-gray-100 text-gray-700", label: "Taslak", icon: Clock },
    submitted: { color: "bg-blue-100 text-blue-700", label: "Gönderildi", icon: Send },
    pending_translator_review: { color: "bg-yellow-100 text-yellow-700", label: "Çevirmen İncelemesinde", icon: Clock },
    translator_accepted: { color: "bg-green-100 text-green-700", label: "Kabul Edildi", icon: CheckCircle2 },
    translator_disputed: { color: "bg-red-100 text-red-700", label: "İtiraz Edildi", icon: AlertTriangle },
    pending_final_review: { color: "bg-orange-100 text-orange-700", label: "Final İncelemede", icon: Clock },
    finalized: { color: "bg-emerald-100 text-emerald-700", label: "Tamamlandı", icon: CheckCircle2 }
};

export default function QualityReportDetailPage() {
    const queryClient = useQueryClient();
    const urlParams = new URLSearchParams(window.location.search);
    const reportId = urlParams.get('id');

    const [translatorComment, setTranslatorComment] = useState("");
    const [finalComment, setFinalComment] = useState("");
    const [showShareDialog, setShowShareDialog] = useState(false);

    const { data: user } = useQuery({
        queryKey: ['currentUser'],
        queryFn: () => base44.auth.me(),
        staleTime: 300000,
    });

    const { data: report, isLoading } = useQuery({
        queryKey: ['qualityReport', reportId],
        queryFn: () => base44.entities.QualityReport.filter({ id: reportId }).then(r => r[0]),
        enabled: !!reportId,
        staleTime: 60000,
        refetchOnMount: false,
    });

    const { data: freelancer } = useQuery({
        queryKey: ['freelancer', report?.freelancer_id],
        queryFn: () => base44.entities.Freelancer.filter({ id: report.freelancer_id }).then(r => r[0]),
        enabled: !!report?.freelancer_id,
        staleTime: 120000,
        refetchOnMount: false,
    });

    const { data: settings } = useQuery({
        queryKey: ['qualitySettings'],
        queryFn: async () => {
            const allSettings = await base44.entities.QualitySettings.list();
            return allSettings[0] || { lqa_weight: 4, qs_multiplier: 20, dispute_period_days: 7 };
        },
        staleTime: 600000,
        refetchOnMount: false,
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }) => base44.entities.QualityReport.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['qualityReport', reportId] });
        },
    });

    const isAdmin = user?.role === 'admin' || user?.role === 'project_manager';
    const isTranslator = freelancer?.email === user?.email;

    const calculateCombinedScore = () => {
        if (!report) return null;
        const lqaWeight = settings?.lqa_weight || 4;
        const qsMultiplier = settings?.qs_multiplier || 20;
        
        if (report.lqa_score != null && report.qs_score != null) {
            return ((report.lqa_score * lqaWeight) + (report.qs_score * qsMultiplier)) / (lqaWeight + 1);
        } else if (report.lqa_score != null) {
            return report.lqa_score;
        } else if (report.qs_score != null) {
            return report.qs_score * qsMultiplier;
        }
        return null;
    };

    const handleSubmitToTranslator = async () => {
        try {
            await base44.functions.invoke('handleDisputedReport', {
                report_id: reportId,
                action: 'submit_for_review'
            });
            queryClient.invalidateQueries({ queryKey: ['qualityReport', reportId] });
        } catch (error) {
            console.error('Submit error:', error);
            // Fallback to direct update
            const deadline = addDays(new Date(), settings?.dispute_period_days || 7);
            updateMutation.mutate({
                id: reportId,
                data: {
                    status: 'pending_translator_review',
                    submission_date: new Date().toISOString(),
                    review_deadline: deadline.toISOString()
                }
            });
        }
    };

    const handleTranslatorAccept = () => {
        updateMutation.mutate({
            id: reportId,
            data: {
                status: 'translator_accepted',
                finalization_date: new Date().toISOString()
            }
        });
    };

    const handleTranslatorDispute = async () => {
        if (!translatorComment.trim()) return;
        try {
            await base44.functions.invoke('handleDisputedReport', {
                report_id: reportId,
                action: 'dispute',
                comments: translatorComment
            });
            queryClient.invalidateQueries({ queryKey: ['qualityReport', reportId] });
            setTranslatorComment("");
        } catch (error) {
            console.error('Dispute error:', error);
            // Fallback to direct update
            updateMutation.mutate({
                id: reportId,
                data: {
                    status: 'translator_disputed',
                    translator_comments: translatorComment
                }
            });
        }
    };

    const handleFinalize = async () => {
        try {
            await base44.functions.invoke('handleDisputedReport', {
                report_id: reportId,
                action: 'finalize',
                comments: finalComment
            });
            queryClient.invalidateQueries({ queryKey: ['qualityReport', reportId] });
            setFinalComment("");
        } catch (error) {
            console.error('Finalize error:', error);
            // Fallback to direct update
            updateMutation.mutate({
                id: reportId,
                data: {
                    status: 'finalized',
                    final_reviewer_comments: finalComment,
                    finalization_date: new Date().toISOString()
                }
            });
        }
    };

    if (isLoading) {
        return (
            <div className="p-6 max-w-4xl mx-auto">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                    <div className="h-64 bg-gray-200 rounded"></div>
                </div>
            </div>
        );
    }

    if (!report) {
        return (
            <div className="p-6 max-w-4xl mx-auto text-center">
                <p className="text-gray-500">Rapor bulunamadı</p>
            </div>
        );
    }

    const statusConfig = STATUS_CONFIG[report.status] || STATUS_CONFIG.draft;
    const StatusIcon = statusConfig.icon;
    const combinedScore = calculateCombinedScore();

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <div className="mb-6">
                <Link to={createPageUrl('QualityManagement')}>
                    <Button variant="ghost" size="sm">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Kalite Yönetimine Dön
                    </Button>
                </Link>
            </div>

            {/* Header */}
            <div className="flex items-start justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-3">
                        Kalite Raporu
                        <Badge className={statusConfig.color}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {statusConfig.label}
                        </Badge>
                    </h1>
                    <p className="text-gray-500 mt-1">
                        {report.project_name || "Proje adı belirtilmemiş"}
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    {/* Share Button */}
                    {isAdmin && (report.status === 'finalized' || report.status === 'translator_accepted') && (
                        <Button 
                            variant="outline" 
                            onClick={() => setShowShareDialog(true)}
                            className="gap-2"
                        >
                            <Share2 className="w-4 h-4" />
                            Share Report
                        </Button>
                    )}

                    {/* Combined Score */}
                    {combinedScore != null && (
                        <div className={`px-6 py-4 rounded-xl text-center ${
                            combinedScore >= 80 ? 'bg-green-100' :
                            combinedScore >= 60 ? 'bg-yellow-100' : 'bg-red-100'
                        }`}>
                            <p className="text-xs text-gray-500">Combined Score</p>
                            <p className={`text-3xl font-bold ${
                                combinedScore >= 80 ? 'text-green-600' :
                                combinedScore >= 60 ? 'text-yellow-600' : 'text-red-600'
                            }`}>
                                {combinedScore.toFixed(1)}
                            </p>
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="md:col-span-2 space-y-6">
                    {/* Scores */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Puanlar</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 gap-6">
                                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                                    <p className="text-sm text-gray-500 mb-2">QS (Quality Score)</p>
                                    {report.qs_score != null ? (
                                        <div className="flex items-center justify-center gap-2">
                                            <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />
                                            <span className="text-3xl font-bold">{report.qs_score}</span>
                                            <span className="text-gray-400">/ 5</span>
                                        </div>
                                    ) : (
                                        <p className="text-gray-400">-</p>
                                    )}
                                </div>
                                <div className="text-center p-4 bg-blue-50 rounded-lg">
                                    <p className="text-sm text-gray-500 mb-2">LQA Score</p>
                                    {report.lqa_score != null ? (
                                        <p className={`text-3xl font-bold ${
                                            report.lqa_score >= 90 ? 'text-green-600' :
                                            report.lqa_score >= 70 ? 'text-yellow-600' : 'text-red-600'
                                        }`}>
                                            {report.lqa_score}
                                        </p>
                                    ) : (
                                        <p className="text-gray-400">-</p>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* LQA Errors */}
                    {report.lqa_errors && report.lqa_errors.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Hata Detayları</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {report.lqa_errors.map((error, i) => (
                                        <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                            <div className="flex items-center gap-3">
                                                <Badge className={
                                                    error.severity === 'Critical' ? 'bg-red-100 text-red-700' :
                                                    error.severity === 'Major' ? 'bg-orange-100 text-orange-700' :
                                                    error.severity === 'Minor' ? 'bg-yellow-100 text-yellow-700' :
                                                    'bg-gray-100 text-gray-700'
                                                }>
                                                    {error.severity}
                                                </Badge>
                                                <span className="font-medium">{error.error_type}</span>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <span className="text-sm text-gray-500">x{error.count}</span>
                                                {error.examples && (
                                                    <span className="text-sm text-gray-400 italic">
                                                        "{error.examples}"
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Comments Section */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <MessageSquare className="w-5 h-5" />
                                Yorumlar
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {report.reviewer_comments && (
                                <div className="p-4 bg-blue-50 rounded-lg">
                                    <p className="text-xs text-blue-600 font-medium mb-1">Reviewer Yorumu</p>
                                    <p className="text-gray-700">{report.reviewer_comments}</p>
                                </div>
                            )}

                            {report.translator_comments && (
                                <div className="p-4 bg-yellow-50 rounded-lg">
                                    <p className="text-xs text-yellow-600 font-medium mb-1">Çevirmen İtirazı</p>
                                    <p className="text-gray-700">{report.translator_comments}</p>
                                </div>
                            )}

                            {report.final_reviewer_comments && (
                                <div className="p-4 bg-green-50 rounded-lg">
                                    <p className="text-xs text-green-600 font-medium mb-1">Final Değerlendirme</p>
                                    <p className="text-gray-700">{report.final_reviewer_comments}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Action Section */}
                    {report.status === 'draft' && isAdmin && (
                        <Card>
                            <CardContent className="pt-6">
                                <Button 
                                    onClick={handleSubmitToTranslator}
                                    className="w-full bg-blue-600 hover:bg-blue-700"
                                >
                                    <Send className="w-4 h-4 mr-2" />
                                    Çevirmene Gönder
                                </Button>
                            </CardContent>
                        </Card>
                    )}

                    {report.status === 'pending_translator_review' && isTranslator && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Değerlendirmeniz</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <Textarea
                                    value={translatorComment}
                                    onChange={(e) => setTranslatorComment(e.target.value)}
                                    placeholder="İtirazınız varsa buraya yazın..."
                                    rows={4}
                                />
                                <div className="flex gap-3">
                                    <Button 
                                        onClick={handleTranslatorAccept}
                                        className="flex-1 bg-green-600 hover:bg-green-700"
                                    >
                                        <CheckCircle2 className="w-4 h-4 mr-2" />
                                        Kabul Et
                                    </Button>
                                    <Button 
                                        onClick={handleTranslatorDispute}
                                        variant="outline"
                                        className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
                                        disabled={!translatorComment.trim()}
                                    >
                                        <AlertTriangle className="w-4 h-4 mr-2" />
                                        İtiraz Et
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {report.status === 'translator_disputed' && isAdmin && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Final Değerlendirme</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <Textarea
                                    value={finalComment}
                                    onChange={(e) => setFinalComment(e.target.value)}
                                    placeholder="Final değerlendirmenizi yazın..."
                                    rows={4}
                                />
                                <Button 
                                    onClick={handleFinalize}
                                    className="w-full bg-purple-600 hover:bg-purple-700"
                                >
                                    <FileCheck className="w-4 h-4 mr-2" />
                                    Raporu Sonlandır
                                </Button>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Freelancer Info */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <User className="w-4 h-4" />
                                Çevirmen
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {freelancer ? (
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold">
                                            {freelancer.full_name?.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="font-medium">{freelancer.full_name}</p>
                                            <p className="text-sm text-gray-500">{freelancer.email}</p>
                                        </div>
                                    </div>
                                    <Link to={createPageUrl(`FreelancerDetail?id=${freelancer.id}`)}>
                                        <Button variant="outline" size="sm" className="w-full">
                                            Profili Görüntüle
                                        </Button>
                                    </Link>
                                </div>
                            ) : (
                                <p className="text-gray-500">Yükleniyor...</p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Report Details */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Detaylar</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div>
                                <p className="text-xs text-gray-500">Rapor Tipi</p>
                                <Badge variant="outline">{report.report_type}</Badge>
                            </div>
                            {report.translation_type && (
                                <div>
                                    <p className="text-xs text-gray-500">Çeviri Alanı</p>
                                    <p className="font-medium">{report.translation_type}</p>
                                </div>
                            )}
                            {report.client_account && (
                                <div>
                                    <p className="text-xs text-gray-500">Müşteri</p>
                                    <p className="font-medium">{report.client_account}</p>
                                </div>
                            )}
                            {report.source_language && report.target_language && (
                                <div>
                                    <p className="text-xs text-gray-500">Dil Çifti</p>
                                    <p className="font-medium">{report.source_language} → {report.target_language}</p>
                                </div>
                            )}
                            {report.lqa_words_reviewed && (
                                <div>
                                    <p className="text-xs text-gray-500">İncelenen Kelime</p>
                                    <p className="font-medium">{report.lqa_words_reviewed.toLocaleString()}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Timeline */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                Zaman Çizelgesi
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div>
                                <p className="text-xs text-gray-500">Oluşturulma</p>
                                <p className="text-sm">
                                    {format(new Date(report.created_date), 'dd MMM yyyy HH:mm', { locale: tr })}
                                </p>
                            </div>
                            {report.submission_date && (
                                <div>
                                    <p className="text-xs text-gray-500">Gönderilme</p>
                                    <p className="text-sm">
                                        {format(new Date(report.submission_date), 'dd MMM yyyy HH:mm', { locale: tr })}
                                    </p>
                                </div>
                            )}
                            {report.review_deadline && (
                                <div>
                                    <p className="text-xs text-gray-500">İtiraz Son Tarihi</p>
                                    <p className="text-sm text-orange-600 font-medium">
                                        {format(new Date(report.review_deadline), 'dd MMM yyyy', { locale: tr })}
                                    </p>
                                </div>
                            )}
                            {report.finalization_date && (
                                <div>
                                    <p className="text-xs text-gray-500">Sonlandırma</p>
                                    <p className="text-sm text-green-600">
                                        {format(new Date(report.finalization_date), 'dd MMM yyyy HH:mm', { locale: tr })}
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Share Report Dialog */}
            <ShareReportDialog
                open={showShareDialog}
                onOpenChange={setShowShareDialog}
                report={report}
                freelancer={freelancer}
            />
        </div>
    );
}