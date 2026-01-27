import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { MessageSquare, Plus, Search } from "lucide-react";
import ConversationList from "../components/messaging/ConversationList";
import MessageThread from "../components/messaging/MessageThread";
import { toast } from "sonner";

export default function MessagesPage() {
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [showNewConversation, setShowNewConversation] = useState(false);
    const [newConversation, setNewConversation] = useState({ recipientEmail: '', subject: '' });
    const [searchQuery, setSearchQuery] = useState('');
    const queryClient = useQueryClient();

    const { data: user, isLoading: userLoading } = useQuery({
        queryKey: ['currentUser'],
        queryFn: () => base44.auth.me(),
        staleTime: 300000,
    });

    const { data: conversations = [], isLoading: conversationsLoading } = useQuery({
        queryKey: ['conversations'],
        queryFn: async () => {
            const allConversations = await base44.entities.Conversation.list('-last_message_date');
            return allConversations.filter(c => 
                c.participant_emails?.includes(user?.email)
            );
        },
        enabled: !!user,
        staleTime: 60000,
        refetchOnMount: false,
    });

    const { data: freelancers = [] } = useQuery({
        queryKey: ['freelancers-for-messaging'],
        queryFn: () => base44.entities.Freelancer.list(),
        enabled: user?.role === 'admin' || user?.role === 'project_manager',
        staleTime: 300000,
        refetchOnMount: false,
    });

    // Real-time subscription for conversations
    useEffect(() => {
        const unsubscribe = base44.entities.Conversation.subscribe((event) => {
            queryClient.invalidateQueries(['conversations']);
        });
        return unsubscribe;
    }, [queryClient]);

    const createConversationMutation = useMutation({
        mutationFn: async (data) => {
            // Check if conversation already exists
            const existing = conversations.find(c => 
                c.participant_emails?.includes(data.recipientEmail) &&
                c.participant_emails?.includes(user.email) &&
                c.participant_emails?.length === 2
            );
            
            if (existing) return existing;

            return await base44.entities.Conversation.create({
                participant_ids: [user.id],
                participant_emails: [user.email, data.recipientEmail],
                subject: data.subject || `Conversation with ${data.recipientEmail}`,
                unread_by: [data.recipientEmail]
            });
        },
        onSuccess: (conversation) => {
            queryClient.invalidateQueries(['conversations']);
            setSelectedConversation(conversation);
            setShowNewConversation(false);
            setNewConversation({ recipientEmail: '', subject: '' });
        },
        onError: () => {
            toast.error("Failed to create conversation");
        }
    });

    const handleCreateConversation = () => {
        if (!newConversation.recipientEmail) {
            toast.error("Please enter a recipient email");
            return;
        }
        createConversationMutation.mutate(newConversation);
    };

    const filteredConversations = conversations.filter(c => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
            c.subject?.toLowerCase().includes(query) ||
            c.participant_emails?.some(email => email.toLowerCase().includes(query)) ||
            c.last_message_preview?.toLowerCase().includes(query)
        );
    });

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                <div className="mb-6">
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-3">
                        <MessageSquare className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
                        Messages
                    </h1>
                    <p className="text-gray-600 mt-1 text-sm sm:text-base">Direct communication with team members and freelancers</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
                    {/* Conversations List */}
                    <div className="lg:col-span-1">
                        <Card className="h-full flex flex-col">
                            <CardContent className="p-4 flex flex-col h-full">
                                <div className="flex gap-2 mb-4">
                                    <div className="relative flex-1">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <Input
                                            placeholder="Search conversations..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="pl-9"
                                        />
                                    </div>
                                    <Button
                                        onClick={() => setShowNewConversation(true)}
                                        className="bg-blue-600 hover:bg-blue-700"
                                        size="icon"
                                    >
                                        <Plus className="w-4 h-4" />
                                    </Button>
                                </div>
                                <div className="flex-1 overflow-y-auto">
                                    {(userLoading || conversationsLoading) ? (
                                        <div className="space-y-3 p-2">
                                            {[1,2,3].map(i => (
                                                <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
                                            ))}
                                        </div>
                                    ) : (
                                        <ConversationList
                                            conversations={filteredConversations}
                                            currentUser={user}
                                            onSelectConversation={setSelectedConversation}
                                            selectedConversationId={selectedConversation?.id}
                                        />
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Message Thread */}
                    <div className="lg:col-span-2">
                        {selectedConversation ? (
                            <MessageThread
                                conversation={selectedConversation}
                                currentUser={user}
                            />
                        ) : (
                            <Card className="h-full">
                                <CardContent className="flex items-center justify-center h-full">
                                    <div className="text-center">
                                        <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                            Select a conversation
                                        </h3>
                                        <p className="text-gray-600">
                                            Choose a conversation from the list or start a new one
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </div>

            {/* New Conversation Dialog */}
            <Dialog open={showNewConversation} onOpenChange={setShowNewConversation}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Start New Conversation</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                        <div>
                            <Label>Recipient Email</Label>
                            {freelancers.length > 0 ? (
                                <select
                                    className="w-full mt-2 px-3 py-2 border rounded-md"
                                    value={newConversation.recipientEmail}
                                    onChange={(e) => setNewConversation(prev => ({ ...prev, recipientEmail: e.target.value }))}
                                >
                                    <option value="">Select a freelancer...</option>
                                    {freelancers.map(f => (
                                        <option key={f.id} value={f.email}>
                                            {f.full_name} ({f.email})
                                        </option>
                                    ))}
                                </select>
                            ) : (
                                <Input
                                    placeholder="Enter email address"
                                    value={newConversation.recipientEmail}
                                    onChange={(e) => setNewConversation(prev => ({ ...prev, recipientEmail: e.target.value }))}
                                    className="mt-2"
                                />
                            )}
                        </div>
                        <div>
                            <Label>Subject (optional)</Label>
                            <Input
                                placeholder="What's this about?"
                                value={newConversation.subject}
                                onChange={(e) => setNewConversation(prev => ({ ...prev, subject: e.target.value }))}
                                className="mt-2"
                            />
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setShowNewConversation(false)}>
                                Cancel
                            </Button>
                            <Button 
                                onClick={handleCreateConversation}
                                disabled={createConversationMutation.isPending}
                                className="bg-blue-600 hover:bg-blue-700"
                            >
                                Start Conversation
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}