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
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Send, CheckCircle2, Users } from "lucide-react";
import { toast } from "sonner";

export default function BulkNotificationDialog({ open, onOpenChange, performers, notificationType }) {
    const [subject, setSubject] = useState(
        notificationType === 'top' 
            ? 'Congratulations on Your Outstanding Performance!' 
            : 'Quality Performance Feedback'
    );
    const [message, setMessage] = useState(
        notificationType === 'top'
            ? `Dear {{name}},

We wanted to take a moment to recognize your exceptional work quality. Your recent performance metrics show:

- Combined Score: {{combined_score}}
- Average LQA: {{avg_lqa}}
- Total Reports: {{total_reports}}

Your dedication to quality is greatly appreciated. Keep up the excellent work!

Best regards,
el turco Team`
            : `Dear {{name}},

We're reaching out regarding your recent quality performance. Based on our analysis:

- Combined Score: {{combined_score}}
- Average LQA: {{avg_lqa}}
- Total Reports: {{total_reports}}

We'd like to discuss how we can support you in improving these metrics. Please don't hesitate to reach out if you have any questions or need additional training resources.

Best regards,
el turco Team`
    );
    const [selectedIds, setSelectedIds] = useState(new Set(performers.map(p => p.freelancer_id)));
    const [sendingProgress, setSendingProgress] = useState({ sent: 0, total: 0, done: false });

    const sendMutation = useMutation({
        mutationFn: async () => {
            const selected = performers.filter(p => selectedIds.has(p.freelancer_id));
            setSendingProgress({ sent: 0, total: selected.length, done: false });

            for (let i = 0; i < selected.length; i++) {
                const performer = selected[i];
                if (!performer.freelancer_email) continue;

                // Replace placeholders
                const personalizedMessage = message
                    .replace(/{{name}}/g, performer.freelancer_name)
                    .replace(/{{combined_score}}/g, performer.combined_score?.toFixed(1) || 'N/A')
                    .replace(/{{avg_lqa}}/g, performer.avg_lqa?.toFixed(1) || 'N/A')
                    .replace(/{{avg_qs}}/g, performer.avg_qs?.toFixed(1) || 'N/A')
                    .replace(/{{total_reports}}/g, performer.total_reports);

                await base44.integrations.Core.SendEmail({
                    to: performer.freelancer_email,
                    subject: subject,
                    body: personalizedMessage
                });

                setSendingProgress(prev => ({ ...prev, sent: i + 1 }));
            }

            setSendingProgress(prev => ({ ...prev, done: true }));
            return selected.length;
        },
        onSuccess: (count) => {
            toast.success(`Sent ${count} emails successfully`);
        },
        onError: (error) => {
            toast.error(`Error sending emails: ${error.message}`);
        }
    });

    const toggleAll = () => {
        if (selectedIds.size === performers.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(performers.map(p => p.freelancer_id)));
        }
    };

    const toggleOne = (id) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setSelectedIds(newSet);
    };

    const selectedWithEmail = performers.filter(p => selectedIds.has(p.freelancer_id) && p.freelancer_email);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Users className="w-5 h-5" />
                        Send Bulk Notification
                    </DialogTitle>
                </DialogHeader>

                {sendingProgress.done ? (
                    <div className="text-center py-8">
                        <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-green-700">Emails Sent Successfully!</h3>
                        <p className="text-gray-600">{sendingProgress.sent} emails were sent.</p>
                        <Button className="mt-4" onClick={() => onOpenChange(false)}>
                            Close
                        </Button>
                    </div>
                ) : (
                    <>
                        <div className="space-y-4">
                            {/* Recipients */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <Label>Recipients ({selectedWithEmail.length})</Label>
                                    <Button variant="ghost" size="sm" onClick={toggleAll}>
                                        {selectedIds.size === performers.length ? 'Deselect All' : 'Select All'}
                                    </Button>
                                </div>
                                <div className="max-h-40 overflow-y-auto border rounded-lg p-2 space-y-1">
                                    {performers.map(p => (
                                        <div 
                                            key={p.freelancer_id} 
                                            className="flex items-center gap-2 p-2 rounded hover:bg-gray-50"
                                        >
                                            <Checkbox
                                                checked={selectedIds.has(p.freelancer_id)}
                                                onCheckedChange={() => toggleOne(p.freelancer_id)}
                                                disabled={!p.freelancer_email}
                                            />
                                            <div className="flex-1">
                                                <span className="text-sm font-medium">{p.freelancer_name}</span>
                                                {!p.freelancer_email && (
                                                    <Badge variant="outline" className="ml-2 text-xs text-red-500">No email</Badge>
                                                )}
                                            </div>
                                            <Badge className={
                                                p.combined_score >= 80 ? 'bg-green-100 text-green-700' :
                                                p.combined_score >= 60 ? 'bg-yellow-100 text-yellow-700' :
                                                'bg-red-100 text-red-700'
                                            }>
                                                {p.combined_score?.toFixed(1)}
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Subject */}
                            <div>
                                <Label>Subject</Label>
                                <Input
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                />
                            </div>

                            {/* Message */}
                            <div>
                                <Label>Message</Label>
                                <Textarea
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    rows={10}
                                    className="font-mono text-sm"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Available placeholders: {'{{name}}'}, {'{{combined_score}}'}, {'{{avg_lqa}}'}, {'{{avg_qs}}'}, {'{{total_reports}}'}
                                </p>
                            </div>

                            {/* Progress */}
                            {sendMutation.isPending && (
                                <div className="p-4 bg-blue-50 rounded-lg">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                                        <span className="text-blue-700">Sending emails...</span>
                                    </div>
                                    <div className="w-full bg-blue-200 rounded-full h-2">
                                        <div 
                                            className="bg-blue-600 h-2 rounded-full transition-all"
                                            style={{ width: `${(sendingProgress.sent / sendingProgress.total) * 100}%` }}
                                        />
                                    </div>
                                    <p className="text-xs text-blue-600 mt-1">
                                        {sendingProgress.sent} / {sendingProgress.total}
                                    </p>
                                </div>
                            )}
                        </div>

                        <DialogFooter>
                            <Button variant="outline" onClick={() => onOpenChange(false)}>
                                Cancel
                            </Button>
                            <Button 
                                onClick={() => sendMutation.mutate()}
                                disabled={sendMutation.isPending || selectedWithEmail.length === 0}
                            >
                                {sendMutation.isPending ? (
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                ) : (
                                    <Send className="w-4 h-4 mr-2" />
                                )}
                                Send to {selectedWithEmail.length} Recipients
                            </Button>
                        </DialogFooter>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}