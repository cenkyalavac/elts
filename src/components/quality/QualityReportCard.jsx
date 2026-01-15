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

export default function QualityReportCard({ report, freelancer }) {
    const statusConfig = STATUS_CONFIG[report.status] || STATUS_CONFIG.draft;

    return (
        <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
                <div className="flex items-center justify-between">
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                            <span className="font-medium">{freelancer?.full_name || "Bilinmiyor"}</span>
                            <Badge className={statusConfig.color}>{statusConfig.label}</Badge>
                            <Badge variant="outline">{report.report_type}</Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                            {report.project_name && <span>{report.project_name}</span>}
                            {report.translation_type && <span>• {report.translation_type}</span>}
                            {report.source_language && report.target_language && (
                                <span>• {report.source_language} → {report.target_language}</span>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        {report.qs_score != null && (
                            <div className="flex items-center gap-1">
                                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                <span className="font-medium">{report.qs_score}</span>
                            </div>
                        )}
                        {report.lqa_score != null && (
                            <div className={`font-medium ${
                                report.lqa_score >= 90 ? 'text-green-600' :
                                report.lqa_score >= 70 ? 'text-yellow-600' : 'text-red-600'
                            }`}>
                                LQA: {report.lqa_score}
                            </div>
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