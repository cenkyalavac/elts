import React, { useState } from 'react';
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Mail, Send, RefreshCw, Loader2, Inbox, SendHorizontal, Search } from "lucide-react";
import { toast } from "sonner";
import EmailViewer from "./EmailViewer";
import EmailComposer from "./EmailComposer";
import GmailConnect from "./GmailConnect";

export default function GmailIntegration({ freelancerEmail }) {
    const [showCompose, setShowCompose] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('all');

    const { data: user } = useQuery({
        queryKey: ['currentUser'],
        queryFn: () => base44.auth.me(),
    });

    const { data: emails = [], isLoading, refetch, isFetching } = useQuery({
        queryKey: ['gmailEmails', freelancerEmail],
        queryFn: async () => {
            const { data } = await base44.functions.invoke('getGmailEmails', { 
                email: freelancerEmail,
                maxResults: 50
            });
            return data.emails || [];
        },
        enabled: !!freelancerEmail && !!user?.gmailRefreshToken,
        staleTime: 30000,
    });

    const isConnected = user?.gmailRefreshToken;

    if (!isConnected) {
        return <GmailConnect />;
    }

    const filteredEmails = emails.filter(email => {
        const matchesSearch = !searchTerm || 
            email.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            email.from?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            email.snippet?.toLowerCase().includes(searchTerm.toLowerCase());

        if (activeTab === 'received') {
            return matchesSearch && email.from.includes(freelancerEmail);
        }
        if (activeTab === 'sent') {
            return matchesSearch && !email.from.includes(freelancerEmail);
        }
        return matchesSearch;
    });

    const sentCount = emails.filter(e => !e.from.includes(freelancerEmail)).length;
    const receivedCount = emails.filter(e => e.from.includes(freelancerEmail)).length;

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                            <Mail className="w-5 h-5 text-blue-600" />
                            Email History
                            <span className="text-sm font-normal text-gray-500">
                                ({emails.length} {emails.length === 1 ? 'email' : 'emails'})
                            </span>
                        </CardTitle>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => refetch()}
                                disabled={isFetching}
                                className="gap-2"
                            >
                                <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
                                Refresh
                            </Button>
                            <Button
                                size="sm"
                                onClick={() => setShowCompose(true)}
                                className="gap-2"
                            >
                                <Send className="w-4 h-4" />
                                New Email
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="mb-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <Input
                                placeholder="Search emails..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                    </div>

                    <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-4">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="all" className="gap-2">
                                <Inbox className="w-4 h-4" />
                                All ({emails.length})
                            </TabsTrigger>
                            <TabsTrigger value="received" className="gap-2">
                                <Mail className="w-4 h-4" />
                                Received ({receivedCount})
                            </TabsTrigger>
                            <TabsTrigger value="sent" className="gap-2">
                                <SendHorizontal className="w-4 h-4" />
                                Sent ({sentCount})
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>

                    {isLoading ? (
                        <div className="text-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin mx-auto text-gray-400 mb-2" />
                            <p className="text-sm text-gray-600">Loading emails...</p>
                        </div>
                    ) : filteredEmails.length === 0 ? (
                        <div className="text-center py-12 bg-gray-50 rounded-lg">
                            <Mail className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                            <p className="text-gray-600 font-medium">No emails found</p>
                            <p className="text-sm text-gray-500 mt-1">
                                {searchTerm ? 'Try a different search term' : 'Start a conversation by sending an email'}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3 max-h-[700px] overflow-y-auto">
                            {filteredEmails.map((email) => (
                                <EmailViewer 
                                    key={email.id} 
                                    email={email}
                                    freelancerEmail={freelancerEmail}
                                />
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            <EmailComposer
                open={showCompose}
                onOpenChange={setShowCompose}
                defaultTo={freelancerEmail}
                onSuccess={() => refetch()}
            />
        </div>
    );
}