import React, { useState } from 'react';
import { useMutation, useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Sparkles, Copy, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export default function AiEmailAssistant({ email, freelancer, onDraftSelect }) {
    const [activeTab, setActiveTab] = useState('draft');
    const [selectedDraft, setSelectedDraft] = useState(null);

    const { data: user } = useQuery({
        queryKey: ['currentUser'],
        queryFn: () => base44.auth.me(),
    });

    const { data: emailTemplates = [] } = useQuery({
        queryKey: ['emailTemplates'],
        queryFn: () => base44.entities.EmailTemplate.list(),
    });

    const draftMutation = useMutation({
        mutationFn: async () => {
            const { data } = await base44.functions.invoke('aiDraftEmail', {
                emailContent: email.snippet || email.body,
                subject: email.subject,
                freelancerProfile: {
                    name: freelancer?.full_name,
                    email: freelancer?.email,
                    status: freelancer?.status,
                    languages: freelancer?.language_pairs,
                    specializations: freelancer?.specializations
                },
                userEmail: user?.email
            });
            return data;
        },
        onError: () => {
            toast.error('Failed to generate draft');
        }
    });

    const summarizeMutation = useMutation({
        mutationFn: async () => {
            const { data } = await base44.functions.invoke('aiSummarizeThread', {
                emailThread: email.snippet || email.body,
                subject: email.subject
            });
            return data;
        },
        onError: () => {
            toast.error('Failed to summarize thread');
        }
    });

    const suggestMutation = useMutation({
        mutationFn: async () => {
            const { data } = await base44.functions.invoke('aiSuggestTemplates', {
                emailContent: email.snippet || email.body,
                subject: email.subject,
                availableTemplates: emailTemplates,
                freelancerStatus: freelancer?.status
            });
            return data;
        },
        onError: () => {
            toast.error('Failed to suggest templates');
        }
    });

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        toast.success('Copied to clipboard');
    };

    return (
        <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-white">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                    <Sparkles className="w-5 h-5 text-blue-600" />
                    AI Assistant
                </CardTitle>
            </CardHeader>
            <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="draft" className="gap-2">
                            <Sparkles className="w-4 h-4" />
                            Draft
                        </TabsTrigger>
                        <TabsTrigger value="summary" className="gap-2">
                            <Sparkles className="w-4 h-4" />
                            Summary
                        </TabsTrigger>
                        <TabsTrigger value="templates" className="gap-2">
                            <Sparkles className="w-4 h-4" />
                            Templates
                        </TabsTrigger>
                    </TabsList>

                    {/* Draft Tab */}
                    <TabsContent value="draft" className="space-y-3">
                        <Button
                            onClick={() => draftMutation.mutate()}
                            disabled={draftMutation.isPending}
                            className="w-full gap-2"
                        >
                            {draftMutation.isPending ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-4 h-4" />
                                    Generate Response Draft
                                </>
                            )}
                        </Button>
                        {draftMutation.data && (
                            <div className="space-y-2">
                                {draftMutation.data.drafts?.map((draft, idx) => (
                                    <div key={idx} className="border rounded-lg p-3 bg-white space-y-2">
                                        <div className="text-sm font-medium text-gray-700">
                                            Option {idx + 1}
                                            {draft.tone && <Badge className="ml-2 text-xs">{draft.tone}</Badge>}
                                        </div>
                                        <p className="text-sm text-gray-600 whitespace-pre-wrap">{draft.content}</p>
                                        <div className="flex gap-2">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => copyToClipboard(draft.content)}
                                                className="gap-1"
                                            >
                                                <Copy className="w-3 h-3" />
                                                Copy
                                            </Button>
                                            <Button
                                                size="sm"
                                                onClick={() => {
                                                    setSelectedDraft(draft.content);
                                                    onDraftSelect?.(draft.content);
                                                }}
                                            >
                                                Use Draft
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </TabsContent>

                    {/* Summary Tab */}
                    <TabsContent value="summary" className="space-y-3">
                        <Button
                            onClick={() => summarizeMutation.mutate()}
                            disabled={summarizeMutation.isPending}
                            className="w-full gap-2"
                        >
                            {summarizeMutation.isPending ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Summarizing...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-4 h-4" />
                                    Summarize Thread
                                </>
                            )}
                        </Button>
                        {summarizeMutation.data && (
                            <div className="border rounded-lg p-4 bg-white space-y-3">
                                <div>
                                    <div className="text-sm font-medium text-gray-700 mb-2">Summary</div>
                                    <p className="text-sm text-gray-600 whitespace-pre-wrap">
                                        {summarizeMutation.data.summary}
                                    </p>
                                </div>
                                {summarizeMutation.data.keyPoints && (
                                    <div>
                                        <div className="text-sm font-medium text-gray-700 mb-2">Key Points</div>
                                        <ul className="text-sm text-gray-600 space-y-1">
                                            {summarizeMutation.data.keyPoints.map((point, idx) => (
                                                <li key={idx} className="flex gap-2">
                                                    <span className="text-blue-600">•</span> {point}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                                {summarizeMutation.data.actionItems && (
                                    <div>
                                        <div className="text-sm font-medium text-gray-700 mb-2">Action Items</div>
                                        <ul className="text-sm text-gray-600 space-y-1">
                                            {summarizeMutation.data.actionItems.map((item, idx) => (
                                                <li key={idx} className="flex gap-2">
                                                    <span className="text-green-600">→</span> {item}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => copyToClipboard(summarizeMutation.data.summary)}
                                    className="gap-1"
                                >
                                    <Copy className="w-3 h-3" />
                                    Copy Summary
                                </Button>
                            </div>
                        )}
                    </TabsContent>

                    {/* Templates Tab */}
                    <TabsContent value="templates" className="space-y-3">
                        <Button
                            onClick={() => suggestMutation.mutate()}
                            disabled={suggestMutation.isPending}
                            className="w-full gap-2"
                        >
                            {suggestMutation.isPending ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Finding matches...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-4 h-4" />
                                    Find Matching Templates
                                </>
                            )}
                        </Button>
                        {suggestMutation.data?.suggestions && suggestMutation.data.suggestions.length > 0 ? (
                            <div className="space-y-2">
                                {suggestMutation.data.suggestions.map((suggestion, idx) => (
                                    <div key={idx} className="border rounded-lg p-3 bg-white space-y-2">
                                        <div className="flex items-center justify-between">
                                            <div className="font-medium text-sm">{suggestion.templateName}</div>
                                            <Badge variant="outline" className="text-xs">
                                                {Math.round(suggestion.matchScore * 100)}% match
                                            </Badge>
                                        </div>
                                        {suggestion.reason && (
                                            <p className="text-xs text-gray-600">{suggestion.reason}</p>
                                        )}
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => {
                                                setSelectedDraft(suggestion.templatePreview);
                                                onDraftSelect?.(suggestion.templatePreview);
                                            }}
                                        >
                                            Use Template
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        ) : suggestMutation.data ? (
                            <div className="text-center py-6 text-gray-500 text-sm">
                                No matching templates found
                            </div>
                        ) : null}
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );
}