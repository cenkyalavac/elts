import React, { useState } from 'react';
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Send, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import AiEmailAssistant from "./AiEmailAssistant";

export default function EnhancedEmailComposer({ 
    open, 
    onOpenChange, 
    defaultTo = '', 
    defaultSubject = '', 
    defaultBody = '',
    threadId = null,
    email = null,
    freelancer = null,
    onSuccess 
}) {
    const [to, setTo] = useState(defaultTo);
    const [subject, setSubject] = useState(defaultSubject);
    const [body, setBody] = useState(defaultBody);
    const [activeTab, setActiveTab] = useState('compose');
    const queryClient = useQueryClient();

    const sendMutation = useMutation({
        mutationFn: async (emailData) => {
            const { data } = await base44.functions.invoke('sendGmailEmail', emailData);
            return data;
        },
        onSuccess: () => {
            toast.success('Email sent successfully');
            queryClient.invalidateQueries({ queryKey: ['gmailEmails'] });
            setTo('');
            setSubject('');
            setBody('');
            onOpenChange(false);
            if (onSuccess) onSuccess();
        },
        onError: (error) => {
            toast.error(error.message || 'Failed to send email');
        }
    });

    const handleSend = () => {
        if (!to || !subject || !body) {
            toast.error('Please fill in all fields');
            return;
        }

        sendMutation.mutate({
            to,
            subject,
            body,
            threadId
        });
    };

    const handleDraftSelect = (draftText) => {
        setBody(draftText);
        setActiveTab('compose');
        toast.success('Draft inserted into message body');
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Send className="w-5 h-5" />
                        {threadId ? 'Reply to Email' : 'New Email'}
                    </DialogTitle>
                </DialogHeader>

                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="compose">Compose</TabsTrigger>
                        {email && freelancer && (
                            <TabsTrigger value="ai" className="gap-2">
                                <Sparkles className="w-4 h-4" />
                                AI Assistant
                            </TabsTrigger>
                        )}
                    </TabsList>

                    {/* Compose Tab */}
                    <TabsContent value="compose" className="space-y-4 mt-4">
                        <div>
                            <label className="text-sm font-medium text-gray-700">To</label>
                            <Input
                                value={to}
                                onChange={(e) => setTo(e.target.value)}
                                placeholder="recipient@example.com"
                                className="mt-1"
                                disabled={!!defaultTo}
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-700">Subject</label>
                            <Input
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                placeholder="Email subject"
                                className="mt-1"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-700">Message</label>
                            <Textarea
                                value={body}
                                onChange={(e) => setBody(e.target.value)}
                                placeholder="Type your message..."
                                className="mt-1 h-64"
                            />
                        </div>
                        <div className="flex justify-end gap-2 pt-4 border-t">
                            <Button 
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                disabled={sendMutation.isPending}
                            >
                                Cancel
                            </Button>
                            <Button 
                                onClick={handleSend}
                                disabled={sendMutation.isPending}
                                className="gap-2"
                            >
                                {sendMutation.isPending ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Sending...
                                    </>
                                ) : (
                                    <>
                                        <Send className="w-4 h-4" />
                                        Send Email
                                    </>
                                )}
                            </Button>
                        </div>
                    </TabsContent>

                    {/* AI Assistant Tab */}
                    {email && freelancer && (
                        <TabsContent value="ai" className="space-y-4 mt-4">
                            <AiEmailAssistant 
                                email={email}
                                freelancer={freelancer}
                                onDraftSelect={handleDraftSelect}
                            />
                        </TabsContent>
                    )}
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}