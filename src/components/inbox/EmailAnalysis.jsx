import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, CheckCircle, Zap, MessageSquare } from 'lucide-react';

export default function EmailAnalysis({ analysis }) {
    if (!analysis) return null;

    const categoryColors = {
        'Application': 'bg-blue-100 text-blue-800',
        'Support Request': 'bg-purple-100 text-purple-800',
        'Notification': 'bg-gray-100 text-gray-800',
        'Job Inquiry': 'bg-green-100 text-green-800',
        'Follow-up': 'bg-orange-100 text-orange-800',
        'Other': 'bg-slate-100 text-slate-800'
    };

    const urgencyColors = {
        'high': 'bg-red-100 text-red-800 border-red-300',
        'medium': 'bg-yellow-100 text-yellow-800 border-yellow-300',
        'low': 'bg-green-100 text-green-800 border-green-300'
    };

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