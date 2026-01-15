import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../../utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, Eye, Clock, CheckCircle2, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

const STATUS_CONFIG = {
    draft: { color: "bg-gray-100 text-gray-700", label: "Taslak" },
    submitted: { color: "bg-blue-100 text-blue-700", label: "Gönderildi" },
    pending_translator_review: { color: "bg-yellow-100 text-yellow-700", label: "Bekliyor" },
    translator_accepted: { color: "bg-green-100 text-green-700", label: "Kabul" },
    translator_disputed: { color: "bg-red-100 text-red-700", label: "İtiraz" },
    pending_final_review: { color: "bg-orange-100 text-orange-700", label: "Final" },
    finalized: { color: "bg-emerald-100 text-emerald-700", label: "Tamamlandı" }
};

export default function QualityReportCard({ report, freelancer, onShare }) {
    const statusConfig = STATUS_CONFIG[report.status] || STATUS_CONFIG.draft;
    const isFinalized = report.status === 'finalized' || report.status === 'translator_accepted';

    return (
        <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <span className="font-medium">{freelancer?.full_name || "Bilinmiyor"}</span>
                            <Badge className={statusConfig.color}>{statusConfig.label}</Badge>
                            <Badge variant="outline">{report.report_type}</Badge>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500 flex-wrap">
                            {report.project_name && <span className="truncate">{report.project_name}</span>}
                            {report.translation_type && <span>• {report.translation_type}</span>}
                            {report.source_language && report.target_language && (
                                <span className="whitespace-nowrap">• {report.source_language} → {report.target_language}</span>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                        {report.qs_score != null && (
                            <div className="flex items-center gap-1 bg-yellow-50 px-3 py-1.5 rounded-lg">
                                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                <span className="font-medium">{report.qs_score}</span>
                            </div>
                        )}
                        {report.lqa_score != null && (
                            <div className={`font-medium px-3 py-1.5 rounded-lg ${
                                report.lqa_score >= 90 ? 'bg-green-50 text-green-700' :
                                report.lqa_score >= 70 ? 'bg-yellow-50 text-yellow-700' : 'bg-red-50 text-red-700'
                            }`}>
                                LQA: {report.lqa_score}
                            </div>
                        )}
                        {isFinalized && onShare && (
                            <Button variant="ghost" size="sm" onClick={() => onShare(report)} title="Share with freelancer">
                                <Share2 className="w-4 h-4" />
                            </Button>
                        )}
                        <Link to={createPageUrl(`QualityReportDetail?id=${report.id}`)}>
                            <Button variant="ghost" size="sm">
                                <Eye className="w-4 h-4" />
                            </Button>
                        </Link>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}