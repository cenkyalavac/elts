import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CheckCircle, Zap, MessageSquare, Edit2, X } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

export default function EmailAnalysis({ analysis, emailId, emailData, onCorrectionSaved }) {
    if (!analysis) return null;

    const [isEditing, setIsEditing] = useState(false);
    const [correctedCategory, setCorrectedCategory] = useState(analysis.category);

    const categoryColors = {
        'New Application Inquiry': 'bg-blue-100 text-blue-800',
        'Urgent Support': 'bg-red-100 text-red-800',
        'Billing Issue': 'bg-orange-100 text-orange-800',
        'Feedback': 'bg-purple-100 text-purple-800',
        'Job Inquiry': 'bg-green-100 text-green-800',
        'Notification': 'bg-gray-100 text-gray-800',
        'Follow-up': 'bg-indigo-100 text-indigo-800',
        'Other': 'bg-slate-100 text-slate-800'
    };

    const categoryOptions = [
        'New Application Inquiry',
        'Urgent Support',
        'Billing Issue',
        'Feedback',
        'Job Inquiry',
        'Notification',
        'Follow-up',
        'Other'
    ];

    const saveCorrectionMutation = useMutation({
        mutationFn: async () => {
            const response = await base44.functions.invoke('saveEmailCorrection', {
                email_id: emailId,
                email_subject: emailData?.subject,
                email_from: emailData?.from,
                original_ai_category: analysis.category,
                corrected_category: correctedCategory,
                original_ai_tags: analysis.key_points || []
            });
            return response.data;
        },
        onSuccess: () => {
            toast.success('Category correction saved. AI will learn from this.');
            setIsEditing(false);
            onCorrectionSaved?.();
        },
        onError: (error) => {
            toast.error('Failed to save correction');
        }
    });

    const urgencyColors = {
        'high': 'bg-red-100 text-red-800 border-red-300',
        'medium': 'bg-yellow-100 text-yellow-800 border-yellow-300',
        'low': 'bg-green-100 text-green-800 border-green-300'
    };

    if (isEditing) {
        return (
            <div className="space-y-3 mt-3 bg-blue-50 p-3 rounded-lg border border-blue-200">
                <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-700">Correct Category</label>
                    <Select value={correctedCategory} onValueChange={setCorrectedCategory}>
                        <SelectTrigger className="w-full">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {categoryOptions.map(cat => (
                                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex gap-2 pt-2">
                    <Button
                        size="sm"
                        onClick={() => saveCorrectionMutation.mutate()}
                        disabled={saveCorrectionMutation.isPending || correctedCategory === analysis.category}
                    >
                        Save Correction
                    </Button>
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                            setIsEditing(false);
                            setCorrectedCategory(analysis.category);
                        }}
                    >
                        Cancel
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-3 mt-3">
            {/* Category & Spam Tags */}
            <div className="flex flex-wrap gap-2 items-center">
                <Badge className={categoryColors[analysis.category] || categoryColors['Other']}>
                    {analysis.category}
                </Badge>
                
                <Badge variant={`${analysis.urgency === 'high' ? 'destructive' : 'secondary'}`}>
                    {analysis.urgency === 'high' && <Zap className="w-3 h-3 mr-1" />}
                    {analysis.urgency.charAt(0).toUpperCase() + analysis.urgency.slice(1)} Priority
                </Badge>

                {analysis.is_spam && (
                    <Badge variant="destructive" className="bg-red-600">
                        ⚠ Possible Spam
                    </Badge>
                )}

                <span className="text-xs text-gray-500 ml-auto">
                    Confidence: {(analysis.confidence * 100).toFixed(0)}%
                </span>

                <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setIsEditing(true)}
                    className="h-6 px-2 text-xs"
                >
                    <Edit2 className="w-3 h-3 mr-1" />
                    Correct
                </Button>
            </div>

            {/* Key Points */}
            {analysis.key_points?.length > 0 && (
                <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="pt-3">
                        <h4 className="text-xs font-semibold text-blue-900 mb-2">Key Points</h4>
                        <ul className="space-y-1">
                            {analysis.key_points.map((point, idx) => (
                                <li key={idx} className="text-xs text-blue-800 flex gap-2">
                                    <span className="text-blue-600">•</span>
                                    <span>{point}</span>
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>
            )}

            {/* Action Needed */}
            {analysis.action_needed && (
                <Card className="bg-amber-50 border-amber-200">
                    <CardContent className="pt-3">
                        <div className="flex gap-2">
                            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                            <div className="text-xs text-amber-800">{analysis.action_needed}</div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Draft Reply */}
            {analysis.draft_reply && (
                <Card className="bg-green-50 border-green-200">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2 text-green-900">
                            <MessageSquare className="w-4 h-4" />
                            Draft Reply
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xs text-green-800 bg-white rounded p-2 border border-green-100 whitespace-pre-wrap">
                            {analysis.draft_reply}
                        </p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}