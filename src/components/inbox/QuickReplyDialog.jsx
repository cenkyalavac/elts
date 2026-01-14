import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { Send, Loader2, Sparkles, RefreshCw } from 'lucide-react';
import TemplateSnippetPicker from './TemplateSnippetPicker';

export default function QuickReplyDialog({ email, open, onOpenChange, draftReply }) {
    const [to, setTo] = useState('');
    const [subject, setSubject] = useState('');
    const [body, setBody] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    useEffect(() => {
        if (email && open) {
            // Extract email address from the "from" field
            const emailMatch = email.from?.match(/<(.+?)>/) || [null, email.from];
            setTo(emailMatch[1] || email.from || '');
            setSubject(email.subject?.startsWith('Re:') ? email.subject : `Re: ${email.subject || ''}`);
            setBody(draftReply || '');
        }
    }, [email, open, draftReply]);

    const sendEmailMutation = useMutation({
        mutationFn: async () => {
            const response = await base44.functions.invoke('sendGmailEmail', {
                to,
                subject,
                body,
                threadId: email?.threadId
            });
            return response.data;
        },
        onSuccess: () => {
            toast.success('Email sent successfully!');
            onOpenChange(false);
            setBody('');
        },
        onError: (error) => {
            toast.error('Failed to send email: ' + (error.message || 'Unknown error'));
        }
    });

    const generateReplyMutation = useMutation({
        mutationFn: async () => {
            const response = await base44.integrations.Core.InvokeLLM({
                prompt: `Generate a professional reply to this email:
                
From: ${email?.from}
Subject: ${email?.subject}
Body: ${email?.body || email?.snippet}

Write a concise, professional reply that:
1. Acknowledges their message
2. Addresses any questions or concerns
3. Maintains a friendly but professional tone
4. Is ready to send (no placeholders)

Reply:`,
            });
            return response;
        },
        onSuccess: (data) => {
            setBody(data);
            toast.success('Reply generated!');
        },
        onError: () => {
            toast.error('Failed to generate reply');
        }
    });

    if (!email) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Send className="w-5 h-5 text-purple-600" />
                        Quick Reply
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="bg-gray-50 rounded-lg p-3 text-sm">
                        <p className="text-gray-500">Replying to:</p>
                        <p className="font-medium text-gray-900 truncate">{email.from}</p>
                    </div>

                    <div className="space-y-2">
                        <Label>To</Label>
                        <Input 
                            value={to} 
                            onChange={(e) => setTo(e.target.value)}
                            placeholder="recipient@email.com"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Subject</Label>
                        <Input 
                            value={subject} 
                            onChange={(e) => setSubject(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label>Message</Label>
                            <div className="flex items-center gap-2">
                                <TemplateSnippetPicker
                                    mode="snippets"
                                    onInsertSnippet={(content) => setBody(prev => prev + content)}
                                />
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => generateReplyMutation.mutate()}
                                    disabled={generateReplyMutation.isPending}
                                    className="gap-2 text-purple-600 hover:text-purple-700"
                                >
                                    {generateReplyMutation.isPending ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Sparkles className="w-4 h-4" />
                                    )}
                                    {generateReplyMutation.isPending ? 'Generating...' : 'AI Generate Reply'}
                                </Button>
                            </div>
                        </div>
                        <Textarea 
                            value={body} 
                            onChange={(e) => setBody(e.target.value)}
                            placeholder="Type your reply..."
                            className="min-h-[200px]"
                        />
                    </div>
                </div>

                <DialogFooter className="gap-2">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button 
                        onClick={() => sendEmailMutation.mutate()}
                        disabled={sendEmailMutation.isPending || !to || !body}
                        className="gap-2 bg-purple-600 hover:bg-purple-700"
                    >
                        {sendEmailMutation.isPending ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Send className="w-4 h-4" />
                        )}
                        {sendEmailMutation.isPending ? 'Sending...' : 'Send Reply'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}