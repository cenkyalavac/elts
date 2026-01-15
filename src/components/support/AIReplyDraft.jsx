import React, { useState } from 'react';
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Loader2, Copy, Check, RefreshCw, ThumbsUp, ThumbsDown } from "lucide-react";
import { toast } from "sonner";

export default function AIReplyDraft({ ticket, onUseDraft }) {
    const [draft, setDraft] = useState('');
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);
    const [tone, setTone] = useState('professional');

    const generateDraft = async () => {
        setLoading(true);
        try {
            const conversationHistory = ticket.responses?.map(r => 
                `${r.responder_name}: ${r.message}`
            ).join('\n\n') || '';

            const response = await base44.integrations.Core.InvokeLLM({
                prompt: `You are a helpful support agent for "el turco", a translation freelancer management platform. Generate a ${tone} reply to this support ticket.

TICKET DETAILS:
Subject: ${ticket.subject}
Category: ${ticket.category}
Priority: ${ticket.priority}
Requester: ${ticket.requester_name} (${ticket.requester_role})

ORIGINAL MESSAGE:
${ticket.message}

${conversationHistory ? `CONVERSATION HISTORY:\n${conversationHistory}\n` : ''}

GUIDELINES:
- Be helpful and empathetic
- Address the specific concern
- Provide actionable next steps if applicable
- Keep the response concise (2-4 paragraphs max)
- Sign off professionally
- If you need more information, ask specific questions
- Reference relevant platform features when appropriate

Generate a reply that the admin can review and send.`,
                response_json_schema: {
                    type: 'object',
                    properties: {
                        reply: { type: 'string' },
                        suggested_status: { type: 'string' },
                        internal_notes: { type: 'string' }
                    }
                }
            });

            if (response?.reply) {
                setDraft(response.reply);
            }
        } catch (error) {
            console.error('Failed to generate draft:', error);
            toast.error('Failed to generate AI draft');
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(draft);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const useDraft = () => {
        if (onUseDraft) {
            onUseDraft(draft);
        }
    };

    return (
        <Card className="bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200">
            <CardContent className="pt-4">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-purple-600" />
                        <span className="text-sm font-medium text-purple-800">AI Reply Assistant</span>
                    </div>
                    <div className="flex gap-1">
                        {['professional', 'friendly', 'concise'].map(t => (
                            <Button
                                key={t}
                                variant={tone === t ? 'default' : 'ghost'}
                                size="sm"
                                className={`text-xs h-7 ${tone === t ? 'bg-purple-600' : ''}`}
                                onClick={() => setTone(t)}
                            >
                                {t.charAt(0).toUpperCase() + t.slice(1)}
                            </Button>
                        ))}
                    </div>
                </div>

                {!draft ? (
                    <Button
                        onClick={generateDraft}
                        disabled={loading}
                        className="w-full bg-purple-600 hover:bg-purple-700"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Generating...
                            </>
                        ) : (
                            <>
                                <Sparkles className="w-4 h-4 mr-2" />
                                Generate AI Draft
                            </>
                        )}
                    </Button>
                ) : (
                    <div className="space-y-3">
                        <Textarea
                            value={draft}
                            onChange={(e) => setDraft(e.target.value)}
                            rows={6}
                            className="bg-white"
                        />
                        <div className="flex items-center justify-between">
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={generateDraft}
                                    disabled={loading}
                                >
                                    <RefreshCw className={`w-3 h-3 mr-1 ${loading ? 'animate-spin' : ''}`} />
                                    Regenerate
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={copyToClipboard}
                                >
                                    {copied ? <Check className="w-3 h-3 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}
                                    {copied ? 'Copied' : 'Copy'}
                                </Button>
                            </div>
                            <Button
                                size="sm"
                                onClick={useDraft}
                                className="bg-purple-600 hover:bg-purple-700"
                            >
                                Use This Draft
                            </Button>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}