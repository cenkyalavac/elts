import React, { useState } from 'react';
import { useMutation } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, Send, CheckCircle2, Mail, FileText } from "lucide-react";
import { toast } from "sonner";

export default function ShareReportDialog({ open, onOpenChange, report, freelancer }) {
    const [accountName, setAccountName] = useState(report?.client_account || '');
    const [jobType, setJobType] = useState(report?.job_type || '');
    const [notes, setNotes] = useState('');
    const [sent, setSent] = useState(false);

    const sendMutation = useMutation({
        mutationFn: async () => {
            if (!freelancer?.email) {
                throw new Error('Freelancer email not found');
            }

            const scoreInfo = [];
            if (report?.lqa_score != null) {
                scoreInfo.push(`LQA Score: ${report.lqa_score}/100`);
            }
            if (report?.qs_score != null) {
                scoreInfo.push(`QS Score: ${report.qs_score}/5`);
            }

            const errorSummary = report?.lqa_errors?.length > 0
                ? report.lqa_errors.map(e => `- ${e.error_type} (${e.severity}): ${e.count || 1}`).join('\n')
                : 'No specific errors noted.';

            const body = `Dear ${freelancer.full_name},

We are sharing a quality change report for your information. This is for your records only - no action is required.

Project: ${report?.project_name || 'N/A'}
Account: ${accountName || 'N/A'}
Job Type: ${jobType || 'N/A'}
Languages: ${report?.source_language || ''} → ${report?.target_language || ''}
Report Date: ${new Date(report?.report_date || report?.created_date).toLocaleDateString()}

${scoreInfo.join('\n')}

${report?.lqa_errors?.length > 0 ? `Error Summary:\n${errorSummary}` : ''}

${report?.reviewer_comments ? `Reviewer Comments:\n${report.reviewer_comments}` : ''}

${notes ? `Additional Notes:\n${notes}` : ''}

This report is shared for your information only. If you have any questions, feel free to reach out.

Best regards,
el turco Team`;

            await base44.integrations.Core.SendEmail({
                to: freelancer.email,
                subject: `Quality Change Report - ${report?.project_name || accountName || 'Project Update'}`,
                body: body
            });

            return true;
        },
        onSuccess: () => {
            setSent(true);
            toast.success('Change report sent successfully');
        },
        onError: (error) => {
            toast.error(`Failed to send: ${error.message}`);
        }
    });

    const handleClose = () => {
        setSent(false);
        setNotes('');
        onOpenChange(false);
    };

    if (!report || !freelancer) return null;

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Mail className="w-5 h-5" />
                        Share Change Report
                    </DialogTitle>
                </DialogHeader>

                {sent ? (
                    <div className="text-center py-8">
                        <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-green-700">Report Sent!</h3>
                        <p className="text-gray-600 mt-2">
                            The change report has been sent to {freelancer.email}
                        </p>
                        <Button className="mt-4" onClick={handleClose}>
                            Close
                        </Button>
                    </div>
                ) : (
                    <>
                        <div className="space-y-4">
                            {/* Report Info */}
                            <div className="p-4 bg-gray-50 rounded-lg space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600">Freelancer</span>
                                    <span className="font-medium">{freelancer.full_name}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600">Email</span>
                                    <span className="text-sm">{freelancer.email}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600">Project</span>
                                    <span className="font-medium">{report.project_name || 'N/A'}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    {report.lqa_score != null && (
                                        <Badge className={
                                            report.lqa_score >= 85 ? 'bg-green-100 text-green-700' :
                                            report.lqa_score >= 70 ? 'bg-yellow-100 text-yellow-700' :
                                            'bg-red-100 text-red-700'
                                        }>
                                            LQA: {report.lqa_score}
                                        </Badge>
                                    )}
                                    {report.qs_score != null && (
                                        <Badge className="bg-blue-100 text-blue-700">
                                            QS: {report.qs_score}/5
                                        </Badge>
                                    )}
                                </div>
                            </div>

                            {/* Editable Fields */}
                            <div>
                                <Label>Account Name</Label>
                                <Input
                                    value={accountName}
                                    onChange={(e) => setAccountName(e.target.value)}
                                    placeholder="e.g., Amazon CCM, AppleCare"
                                    className="mt-1"
                                />
                            </div>

                            <div>
                                <Label>Job Type</Label>
                                <Input
                                    value={jobType}
                                    onChange={(e) => setJobType(e.target.value)}
                                    placeholder="e.g., Translation, MTPE, Review"
                                    className="mt-1"
                                />
                            </div>

                            <div>
                                <Label>Additional Notes (Optional)</Label>
                                <Textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="Add any additional notes or context for the freelancer..."
                                    rows={4}
                                    className="mt-1"
                                />
                            </div>
                        </div>

                        <DialogFooter>
                            <Button variant="outline" onClick={handleClose}>
                                Cancel
                            </Button>
                            <Button 
                                onClick={() => sendMutation.mutate()}
                                disabled={sendMutation.isPending || !freelancer.email}
                                className="bg-purple-600 hover:bg-purple-700"
                            >
                                {sendMutation.isPending ? (
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                ) : (
                                    <Send className="w-4 h-4 mr-2" />
                                )}
                                Send Report
                            </Button>
                        </DialogFooter>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}