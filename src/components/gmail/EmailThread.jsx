import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Mail, Send, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import moment from "moment";

export default function EmailThread({ freelancerEmail }) {
    const [showCompose, setShowCompose] = useState(false);
    const [subject, setSubject] = useState('');
    const [body, setBody] = useState('');
    const queryClient = useQueryClient();

    const { data: emails = [], isLoading, refetch } = useQuery({
        queryKey: ['gmailEmails', freelancerEmail],
        queryFn: async () => {
            const { data } = await base44.functions.invoke('getGmailEmails', { 
                email: freelancerEmail,
                maxResults: 20
            });
            return data.emails || [];
        },
        enabled: !!freelancerEmail,
        staleTime: 60000, // Cache emails for 1 minute
    });

    const sendMutation = useMutation({
        mutationFn: async (emailData) => {
            return await base44.functions.invoke('sendGmailEmail', emailData);
        },
        onSuccess: () => {
            toast.success('Email sent successfully');
            setShowCompose(false);
            setSubject('');
            setBody('');
            refetch();
        },
        onError: () => {
            toast.error('Failed to send email');
        }
    });

    const handleSend = () => {
        if (!subject || !body) {
            toast.error('Please fill in subject and body');
            return;
        }
        sendMutation.mutate({
            to: freelancerEmail,
            subject,
            body
        });
    };

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                            <Mail className="w-5 h-5" />
                            Email Conversations
                        </CardTitle>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => refetch()}
                                disabled={isLoading}
                            >
                                <RefreshCw className="w-4 h-4" />
                            </Button>
                            <Button
                                size="sm"
                                onClick={() => setShowCompose(!showCompose)}
                            >
                                <Send className="w-4 h-4 mr-2" />
                                Compose
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {showCompose && (
                        <div className="mb-4 p-4 border rounded-lg space-y-3 bg-gray-50">
                            <div>
                                <label className="text-sm font-medium">To:</label>
                                <Input value={freelancerEmail} disabled className="mt-1" />
                            </div>
                            <div>
                                <label className="text-sm font-medium">Subject:</label>
                                <Input 
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                    placeholder="Email subject"
                                    className="mt-1"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium">Message:</label>
                                <Textarea
                                    value={body}
                                    onChange={(e) => setBody(e.target.value)}
                                    placeholder="Type your message..."
                                    className="mt-1 h-32"
                                />
                            </div>
                            <div className="flex gap-2">
                                <Button 
                                    onClick={handleSend}
                                    disabled={sendMutation.isPending}
                                >
                                    {sendMutation.isPending ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Sending...
                                        </>
                                    ) : (
                                        <>
                                            <Send className="w-4 h-4 mr-2" />
                                            Send
                                        </>
                                    )}
                                </Button>
                                <Button 
                                    variant="outline"
                                    onClick={() => setShowCompose(false)}
                                >
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    )}

                    {isLoading ? (
                        <div className="text-center py-8">
                            <Loader2 className="w-8 h-8 animate-spin mx-auto text-gray-400" />
                            <p className="text-sm text-gray-600 mt-2">Loading emails...</p>
                        </div>
                    ) : emails.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            No email conversations found with this freelancer.
                        </div>
                    ) : (
                        <div className="space-y-3 max-h-[600px] overflow-y-auto">
                            {emails.map((email) => (
                                <div key={email.id} className="border rounded-lg p-4 hover:bg-gray-50">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex-1">
                                            <div className="font-semibold">{email.subject}</div>
                                            <div className="text-sm text-gray-600">
                                                From: {email.from}
                                            </div>
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            {moment(email.date).format('MMM D, YYYY h:mm A')}
                                        </div>
                                    </div>
                                    <div className="text-sm text-gray-700 mt-2">
                                        {email.snippet}
                                    </div>
                                    {email.labels?.includes('UNREAD') && (
                                        <div className="mt-2">
                                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                                Unread
                                            </span>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}