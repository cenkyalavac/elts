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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useMutation, useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { Send, Loader2, Sparkles, FileText, X, Paperclip } from 'lucide-react';

export default function ComposeEmailDialog({ open, onOpenChange, initialTo = '', initialSubject = '', initialBody = '', mode = 'compose' }) {
    const [to, setTo] = useState('');
    const [cc, setCc] = useState('');
    const [bcc, setBcc] = useState('');
    const [subject, setSubject] = useState('');
    const [body, setBody] = useState('');
    const [showCcBcc, setShowCcBcc] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState('');

    // Fetch email templates
    const { data: templates = [] } = useQuery({
        queryKey: ['emailTemplates'],
        queryFn: () => base44.entities.EmailTemplate.filter({ is_active: true }),
    });

    useEffect(() => {
        if (open) {
            setTo(initialTo);
            setSubject(initialSubject);
            setBody(initialBody);
            setCc('');
            setBcc('');
            setSelectedTemplate('');
        }
    }, [open, initialTo, initialSubject, initialBody]);

    const applyTemplate = (templateId) => {
        const template = templates.find(t => t.id === templateId);
        if (template) {
            setSubject(template.subject);
            setBody(template.body);
            setSelectedTemplate(templateId);
            toast.success('Template applied');
        }
    };

    const sendEmailMutation = useMutation({
        mutationFn: async () => {
            const response = await base44.functions.invoke('sendGmailEmail', {
                to,
                cc: cc || undefined,
                bcc: bcc || undefined,
                subject,
                body
            });
            return response.data;
        },
        onSuccess: () => {
            toast.success('Email sent successfully!');
            onOpenChange(false);
            setTo('');
            setCc('');
            setBcc('');
            setSubject('');
            setBody('');
        },
        onError: (error) => {
            toast.error('Failed to send email: ' + (error.message || 'Unknown error'));
        }
    });

    const generateEmailMutation = useMutation({
        mutationFn: async () => {
            const response = await base44.integrations.Core.InvokeLLM({
                prompt: `Generate a professional email with the following details:
                
To: ${to}
Subject hint: ${subject || 'General communication'}
Context: ${body || 'Professional communication'}

Write a well-structured, professional email that:
1. Has a proper greeting
2. Is clear and concise
3. Has a professional closing
4. Is ready to send

Email body:`,
            });
            return response;
        },
        onSuccess: (data) => {
            setBody(data);
            toast.success('Email generated!');
        },
        onError: () => {
            toast.error('Failed to generate email');
        }
    });

    const title = mode === 'forward' ? 'Forward Email' : mode === 'reply' ? 'Reply' : 'Compose New Email';

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Send className="w-5 h-5 text-purple-600" />
                        {title}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Template Selector */}
                    {templates.length > 0 && mode === 'compose' && (
                        <div className="flex items-center gap-2">
                            <Label className="text-sm text-gray-500">Use template:</Label>
                            <Select value={selectedTemplate} onValueChange={applyTemplate}>
                                <SelectTrigger className="w-[200px]">
                                    <SelectValue placeholder="Select template" />
                                </SelectTrigger>
                                <SelectContent>
                                    {templates.map(template => (
                                        <SelectItem key={template.id} value={template.id}>
                                            {template.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label>To</Label>
                            {!showCcBcc && (
                                <Button 
                                    variant="link" 
                                    size="sm" 
                                    onClick={() => setShowCcBcc(true)}
                                    className="text-xs text-gray-500"
                                >
                                    Add Cc/Bcc
                                </Button>
                            )}
                        </div>
                        <Input 
                            value={to} 
                            onChange={(e) => setTo(e.target.value)}
                            placeholder="recipient@email.com"
                        />
                    </div>

                    {showCcBcc && (
                        <>
                            <div className="space-y-2">
                                <Label>Cc</Label>
                                <Input 
                                    value={cc} 
                                    onChange={(e) => setCc(e.target.value)}
                                    placeholder="cc@email.com"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Bcc</Label>
                                <Input 
                                    value={bcc} 
                                    onChange={(e) => setBcc(e.target.value)}
                                    placeholder="bcc@email.com"
                                />
                            </div>
                        </>
                    )}

                    <div className="space-y-2">
                        <Label>Subject</Label>
                        <Input 
                            value={subject} 
                            onChange={(e) => setSubject(e.target.value)}
                            placeholder="Email subject"
                        />
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label>Message</Label>
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => generateEmailMutation.mutate()}
                                disabled={generateEmailMutation.isPending}
                                className="gap-2 text-purple-600 hover:text-purple-700"
                            >
                                {generateEmailMutation.isPending ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Sparkles className="w-4 h-4" />
                                )}
                                {generateEmailMutation.isPending ? 'Generating...' : 'AI Generate'}
                            </Button>
                        </div>
                        <Textarea 
                            value={body} 
                            onChange={(e) => setBody(e.target.value)}
                            placeholder="Type your message..."
                            className="min-h-[250px]"
                        />
                    </div>
                </div>

                <DialogFooter className="gap-2">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button 
                        onClick={() => sendEmailMutation.mutate()}
                        disabled={sendEmailMutation.isPending || !to || !subject || !body}
                        className="gap-2 bg-purple-600 hover:bg-purple-700"
                    >
                        {sendEmailMutation.isPending ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Send className="w-4 h-4" />
                        )}
                        {sendEmailMutation.isPending ? 'Sending...' : 'Send Email'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}