import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
    CheckCircle, AlertTriangle, FileText, Star, Calendar, 
    User, Globe, Loader2, MessageSquare
} from "lucide-react";
import { toast } from "sonner";

const SEVERITY_COLORS = {
    Critical: "bg-red-100 text-red-700 border-red-200",
    Major: "bg-orange-100 text-orange-700 border-orange-200",
    Minor: "bg-yellow-100 text-yellow-700 border-yellow-200",
    Preferential: "bg-gray-100 text-gray-700 border-gray-200"
};

export default function FreelancerReportReview({ report, onUpdate }) {
    const [showDisputeForm, setShowDisputeForm] = useState(false);
    const [disputeComments, setDisputeComments] = useState("");
    const queryClient = useQueryClient();

    const handleActionMutation = useMutation({
        mutationFn: async ({ action, comments }) => {
            return base44.functions.invoke('handleDisputedReport', {
                report_id: report.id,
                action,
                comments
            });
        },
        onSuccess: (_, variables) => {
            const actionLabel = variables.action === 'accept' ? 'accepted' : 'disputed';
            toast.success(`Report ${actionLabel} successfully`);
            queryClient.invalidateQueries({ queryKey: ['qualityReports'] });
            queryClient.invalidateQueries({ queryKey: ['qualityReport', report.id] });
            setShowDisputeForm(false);
            setDisputeComments("");
            onUpdate?.();
        },
        onError: (error) => {
            toast.error(error.message || "Failed to process request");
        }
    });

    const handleAccept = () => {
        handleActionMutation.mutate({ action: 'accept' });
    };

    const handleDispute = () => {
        if (!disputeComments.trim()) {
            toast.error("Please provide comments for your dispute");
            return;
        }
        handleActionMutation.mutate({ action: 'dispute', comments: disputeComments });
    };

    const isPendingReview = report.status === 'pending_translator_review';
    const isProcessing = handleActionMutation.isPending;

    return (
        <div className="space-y-6">
            {/* Report Summary */}
            <Card>
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <FileText className="w-5 h-5 text-blue-600" />
                            Report Summary
                        </CardTitle>
                        <Badge variant={
                            report.status === 'finalized' ? 'default' :
                            report.status === 'pending_translator_review' ? 'secondary' :
                            report.status === 'disputed' ? 'destructive' : 'outline'
                        }>
                            {report.status?.replace(/_/g, ' ')}
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                            <p className="text-xs text-gray-500">Report Type</p>
                            <p className="font-medium">{report.report_type}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500">Project</p>
                            <p className="font-medium">{report.project_name || '-'}</p>
                        </div>
                        <div className="flex items-center gap-1">
                            <Globe className="w-3 h-3 text-gray-400" />
                            <p className="text-sm">{report.source_language} → {report.target_language}</p>
                        </div>
                        <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-gray-400" />
                            <p className="text-sm">{report.report_date}</p>
                        </div>
                    </div>

                    {report.client_account && (
                        <div>
                            <p className="text-xs text-gray-500">Client Account</p>
                            <p className="font-medium">{report.client_account}</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Scores */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Star className="w-5 h-5 text-yellow-500" />
                        Scores
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {report.lqa_score != null && (
                            <div className="bg-blue-50 rounded-lg p-4 text-center">
                                <p className="text-xs text-blue-600 font-medium">LQA Score</p>
                                <p className={`text-3xl font-bold ${
                                    report.lqa_score >= 90 ? 'text-green-600' :
                                    report.lqa_score >= 70 ? 'text-yellow-600' : 'text-red-600'
                                }`}>
                                    {report.lqa_score.toFixed(1)}
                                </p>
                                {report.lqa_words_reviewed && (
                                    <p className="text-xs text-gray-500 mt-1">
                                        {report.lqa_words_reviewed} words reviewed
                                    </p>
                                )}
                            </div>
                        )}
                        {report.qs_score != null && (
                            <div className="bg-yellow-50 rounded-lg p-4 text-center">
                                <p className="text-xs text-yellow-600 font-medium">QS Score</p>
                                <p className="text-3xl font-bold text-yellow-600">
                                    {report.qs_score}
                                    <span className="text-lg">/5</span>
                                </p>
                            </div>
                        )}
                        {(report.lqa_score != null || report.qs_score != null) && (
                            <div className="bg-purple-50 rounded-lg p-4 text-center">
                                <p className="text-xs text-purple-600 font-medium">Combined</p>
                                <p className={`text-3xl font-bold ${
                                    (report.combined_quality_score || 0) >= 80 ? 'text-green-600' :
                                    (report.combined_quality_score || 0) >= 60 ? 'text-yellow-600' : 'text-red-600'
                                }`}>
                                    {report.combined_quality_score?.toFixed(1) || '-'}
                                </p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Error Details */}
            {report.lqa_errors?.length > 0 && (
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-orange-500" />
                            Error Details ({report.lqa_errors.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {report.lqa_errors.map((error, index) => (
                                <div 
                                    key={index} 
                                    className={`p-3 rounded-lg border ${SEVERITY_COLORS[error.severity] || 'bg-gray-50'}`}
                                >
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="font-medium">{error.error_type}</span>
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline">{error.severity}</Badge>
                                            <Badge variant="secondary">×{error.count}</Badge>
                                        </div>
                                    </div>
                                    {error.examples && (
                                        <p className="text-sm text-gray-600 mt-1">{error.examples}</p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Reviewer Comments */}
            {report.reviewer_comments && (
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <MessageSquare className="w-5 h-5 text-gray-500" />
                            Reviewer Comments
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-gray-700 whitespace-pre-wrap">{report.reviewer_comments}</p>
                    </CardContent>
                </Card>
            )}

            {/* Action Buttons */}
            {isPendingReview && (
                <Card className="border-blue-200 bg-blue-50">
                    <CardContent className="pt-6">
                        {!showDisputeForm ? (
                            <div className="space-y-4">
                                <p className="text-sm text-gray-600 text-center">
                                    Please review this report and accept or dispute it within the allowed period.
                                </p>
                                <div className="flex justify-center gap-4">
                                    <Button
                                        onClick={handleAccept}
                                        disabled={isProcessing}
                                        className="bg-green-600 hover:bg-green-700"
                                    >
                                        {isProcessing ? (
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        ) : (
                                            <CheckCircle className="w-4 h-4 mr-2" />
                                        )}
                                        Accept Report
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        onClick={() => setShowDisputeForm(true)}
                                        disabled={isProcessing}
                                    >
                                        <AlertTriangle className="w-4 h-4 mr-2" />
                                        Dispute Report
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <Label>Dispute Comments *</Label>
                                <Textarea
                                    value={disputeComments}
                                    onChange={(e) => setDisputeComments(e.target.value)}
                                    placeholder="Please explain your concerns with this report..."
                                    rows={4}
                                />
                                <div className="flex justify-end gap-3">
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            setShowDisputeForm(false);
                                            setDisputeComments("");
                                        }}
                                        disabled={isProcessing}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        onClick={handleDispute}
                                        disabled={isProcessing || !disputeComments.trim()}
                                    >
                                        {isProcessing ? (
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        ) : (
                                            <AlertTriangle className="w-4 h-4 mr-2" />
                                        )}
                                        Submit Dispute
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    );
}