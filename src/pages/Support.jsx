import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
    HelpCircle, Plus, MessageSquare, Clock, CheckCircle, 
    AlertCircle, User, Send, ChevronRight, TrendingUp, Sparkles
} from "lucide-react";
import { toast } from "sonner";
import FAQSuggestions from "../components/support/FAQSuggestions";
import AICategorizer, { getAIAnalysis } from "../components/support/AICategorizer";
import AIReplyDraft from "../components/support/AIReplyDraft";
import TicketTrends from "../components/support/TicketTrends";

const statusConfig = {
    open: { label: 'Open', color: 'bg-blue-100 text-blue-800', icon: AlertCircle },
    in_progress: { label: 'In Progress', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
    waiting_response: { label: 'Waiting Response', color: 'bg-purple-100 text-purple-800', icon: MessageSquare },
    resolved: { label: 'Resolved', color: 'bg-green-100 text-green-800', icon: CheckCircle },
    closed: { label: 'Closed', color: 'bg-gray-100 text-gray-800', icon: CheckCircle },
};

const categoryLabels = {
    general_question: 'General Question',
    technical_issue: 'Technical Issue',
    payment_inquiry: 'Payment Inquiry',
    application_status: 'Application Status',
    other: 'Other',
};

export default function SupportPage() {
    const [showNewTicket, setShowNewTicket] = useState(false);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [activeTab, setActiveTab] = useState('my_tickets');
    const queryClient = useQueryClient();

    const { data: user } = useQuery({
        queryKey: ['currentUser'],
        queryFn: () => base44.auth.me(),
    });

    const { data: tickets = [], isLoading } = useQuery({
        queryKey: ['supportTickets'],
        queryFn: () => base44.entities.SupportTicket.list('-created_date'),
    });

    const isAdmin = user?.role === 'admin';
    
    // Filter tickets based on role
    const myTickets = tickets.filter(t => t.requester_email === user?.email);
    const allTickets = isAdmin ? tickets : myTickets;
    const openTickets = allTickets.filter(t => ['open', 'in_progress', 'waiting_response'].includes(t.status));
    const closedTickets = allTickets.filter(t => ['resolved', 'closed'].includes(t.status));

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
            <div className="max-w-5xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                            <HelpCircle className="w-8 h-8 text-blue-600" />
                            Support Center
                        </h1>
                        <p className="text-gray-600 mt-1">
                            Get help and ask questions
                        </p>
                    </div>
                    <Button onClick={() => setShowNewTicket(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        New Ticket
                    </Button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <Card>
                        <CardContent className="pt-4">
                            <div className="text-2xl font-bold text-blue-600">{openTickets.length}</div>
                            <div className="text-sm text-gray-600">Open Tickets</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-4">
                            <div className="text-2xl font-bold text-green-600">{closedTickets.length}</div>
                            <div className="text-sm text-gray-600">Resolved</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-4">
                            <div className="text-2xl font-bold text-yellow-600">
                                {tickets.filter(t => t.status === 'waiting_response' && t.requester_email === user?.email).length}
                            </div>
                            <div className="text-sm text-gray-600">Awaiting Your Reply</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-4">
                            <div className="text-2xl font-bold text-gray-600">{allTickets.length}</div>
                            <div className="text-sm text-gray-600">Total Tickets</div>
                        </CardContent>
                    </Card>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList>
                        <TabsTrigger value="my_tickets">My Tickets</TabsTrigger>
                        {isAdmin && <TabsTrigger value="all_tickets">All Tickets</TabsTrigger>}
                        {isAdmin && <TabsTrigger value="trends">
                            <TrendingUp className="w-4 h-4 mr-1" />
                            Trends & Insights
                        </TabsTrigger>}
                    </TabsList>

                    <TabsContent value="my_tickets" className="mt-4">
                        <TicketList 
                            tickets={myTickets} 
                            isLoading={isLoading}
                            onSelect={setSelectedTicket}
                            isAdmin={isAdmin}
                        />
                    </TabsContent>

                    {isAdmin && (
                        <TabsContent value="all_tickets" className="mt-4">
                            <TicketList 
                                tickets={allTickets} 
                                isLoading={isLoading}
                                onSelect={setSelectedTicket}
                                isAdmin={isAdmin}
                            />
                        </TabsContent>
                    )}

                    {isAdmin && (
                        <TabsContent value="trends" className="mt-4">
                            <TicketTrends tickets={allTickets} />
                        </TabsContent>
                    )}
                </Tabs>

                <NewTicketDialog 
                    open={showNewTicket} 
                    onOpenChange={setShowNewTicket}
                    user={user}
                />

                <TicketDetailDialog
                    ticket={selectedTicket}
                    onClose={() => setSelectedTicket(null)}
                    user={user}
                    isAdmin={isAdmin}
                />
            </div>
        </div>
    );
}

function TicketList({ tickets, isLoading, onSelect, isAdmin }) {
    if (isLoading) {
        return (
            <div className="space-y-3">
                {[1,2,3].map(i => (
                    <div key={i} className="h-20 bg-white rounded-lg animate-pulse" />
                ))}
            </div>
        );
    }

    if (tickets.length === 0) {
        return (
            <Card>
                <CardContent className="py-12 text-center">
                    <HelpCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600">No tickets yet</p>
                    <p className="text-sm text-gray-500">Create a new ticket to get help</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-3">
            {tickets.map(ticket => {
                const status = statusConfig[ticket.status] || statusConfig.open;
                const StatusIcon = status.icon;
                
                return (
                    <Card 
                        key={ticket.id} 
                        className="cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => onSelect(ticket)}
                    >
                        <CardContent className="py-4">
                            <div className="flex items-center justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Badge className={status.color}>
                                            <StatusIcon className="w-3 h-3 mr-1" />
                                            {status.label}
                                        </Badge>
                                        <Badge variant="outline">
                                            {categoryLabels[ticket.category] || ticket.category}
                                        </Badge>
                                        {ticket.priority === 'urgent' && (
                                            <Badge className="bg-red-100 text-red-800">Urgent</Badge>
                                        )}
                                    </div>
                                    <h3 className="font-medium text-gray-900">{ticket.subject}</h3>
                                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                                        <span className="flex items-center gap-1">
                                            <User className="w-3 h-3" />
                                            {ticket.requester_name || ticket.requester_email}
                                        </span>
                                        <span>{new Date(ticket.created_date).toLocaleDateString()}</span>
                                        {ticket.responses?.length > 0 && (
                                            <span className="flex items-center gap-1">
                                                <MessageSquare className="w-3 h-3" />
                                                {ticket.responses.length} replies
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <ChevronRight className="w-5 h-5 text-gray-400" />
                            </div>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}

function NewTicketDialog({ open, onOpenChange, user }) {
    const queryClient = useQueryClient();
    const [formData, setFormData] = useState({
        subject: '',
        message: '',
        category: 'general_question',
        priority: 'medium',
    });
    const [faqResolved, setFaqResolved] = useState(false);

    const createMutation = useMutation({
        mutationFn: async (data) => {
            // Get AI analysis before creating
            let aiData = {};
            try {
                const analysis = await getAIAnalysis(data.subject, data.message);
                aiData = {
                    ai_suggested_category: analysis?.category,
                    ai_suggested_priority: analysis?.priority,
                    sentiment: analysis?.sentiment,
                    tags: analysis?.tags || [],
                };
            } catch (e) {
                console.error('AI analysis failed:', e);
            }

            return base44.entities.SupportTicket.create({
                ...data,
                ...aiData,
                requester_email: user?.email,
                requester_name: user?.full_name,
                requester_role: user?.role,
                status: 'open',
                responses: [],
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['supportTickets'] });
            onOpenChange(false);
            setFormData({ subject: '', message: '', category: 'general_question', priority: 'medium' });
            setFaqResolved(false);
            toast.success('Ticket created successfully');
        },
    });

    const handleFAQResolved = (faq) => {
        setFaqResolved(true);
        toast.success('Glad that helped! No need to submit a ticket.');
        setTimeout(() => {
            onOpenChange(false);
            setFaqResolved(false);
            setFormData({ subject: '', message: '', category: 'general_question', priority: 'medium' });
        }, 2000);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>Create New Ticket</DialogTitle>
                </DialogHeader>

                {faqResolved ? (
                    <div className="py-8 text-center">
                        <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                        <p className="text-lg font-medium text-gray-800">Great!</p>
                        <p className="text-gray-600">Glad we could help without needing a ticket.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium">Subject</label>
                            <Input
                                value={formData.subject}
                                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                placeholder="Brief description of your issue"
                            />
                        </div>

                        <div>
                            <label className="text-sm font-medium">Message</label>
                            <Textarea
                                value={formData.message}
                                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                placeholder="Describe your question or issue in detail..."
                                rows={4}
                            />
                        </div>

                        {/* FAQ Suggestions - before submitting */}
                        {(formData.subject || formData.message) && (
                            <FAQSuggestions
                                subject={formData.subject}
                                message={formData.message}
                                category={formData.category}
                                onSelectFAQ={handleFAQResolved}
                            />
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium">Category</label>
                                <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="general_question">General Question</SelectItem>
                                        <SelectItem value="technical_issue">Technical Issue</SelectItem>
                                        <SelectItem value="payment_inquiry">Payment Inquiry</SelectItem>
                                        <SelectItem value="application_status">Application Status</SelectItem>
                                        <SelectItem value="other">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <label className="text-sm font-medium">Priority</label>
                                <Select value={formData.priority} onValueChange={(v) => setFormData({ ...formData, priority: v })}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="low">Low</SelectItem>
                                        <SelectItem value="medium">Medium</SelectItem>
                                        <SelectItem value="high">High</SelectItem>
                                        <SelectItem value="urgent">Urgent</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* AI Category Suggestion */}
                        <AICategorizer
                            subject={formData.subject}
                            message={formData.message}
                            onCategoryChange={(cat) => setFormData({ ...formData, category: cat })}
                            onPriorityChange={(pri) => setFormData({ ...formData, priority: pri })}
                        />

                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => onOpenChange(false)}>
                                Cancel
                            </Button>
                            <Button 
                                onClick={() => createMutation.mutate(formData)}
                                disabled={!formData.subject || !formData.message || createMutation.isPending}
                            >
                                {createMutation.isPending ? 'Creating...' : 'Create Ticket'}
                            </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}

function TicketDetailDialog({ ticket, onClose, user, isAdmin }) {
    const queryClient = useQueryClient();
    const [reply, setReply] = useState('');
    const [newStatus, setNewStatus] = useState('');
    const [showAIDraft, setShowAIDraft] = useState(false);

    React.useEffect(() => {
        if (ticket) {
            setNewStatus(ticket.status);
            setReply('');
            setShowAIDraft(false);
        }
    }, [ticket]);

    const replyMutation = useMutation({
        mutationFn: async () => {
            const responses = [...(ticket.responses || []), {
                responder_email: user?.email,
                responder_name: user?.full_name,
                message: reply,
                timestamp: new Date().toISOString(),
            }];
            
            const updateData = { responses };
            if (isAdmin && newStatus !== ticket.status) {
                updateData.status = newStatus;
            }
            
            return base44.entities.SupportTicket.update(ticket.id, updateData);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['supportTickets'] });
            setReply('');
            toast.success('Reply sent');
        },
    });

    const updateStatusMutation = useMutation({
        mutationFn: (status) => base44.entities.SupportTicket.update(ticket.id, { 
            status,
            resolved_at: status === 'resolved' ? new Date().toISOString() : null,
        }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['supportTickets'] });
            toast.success('Status updated');
        },
    });

    if (!ticket) return null;

    const status = statusConfig[ticket.status] || statusConfig.open;

    return (
        <Dialog open={!!ticket} onOpenChange={() => onClose()}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-center gap-2">
                        <Badge className={status.color}>{status.label}</Badge>
                        <Badge variant="outline">{categoryLabels[ticket.category]}</Badge>
                    </div>
                    <DialogTitle className="text-xl">{ticket.subject}</DialogTitle>
                    <div className="text-sm text-gray-500">
                        By {ticket.requester_name || ticket.requester_email} • {new Date(ticket.created_date).toLocaleString()}
                    </div>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Original Message */}
                    <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-gray-700 whitespace-pre-wrap">{ticket.message}</p>
                    </div>

                    {/* Responses */}
                    {ticket.responses?.length > 0 && (
                        <div className="space-y-3">
                            <h4 className="font-medium text-sm text-gray-600">Responses</h4>
                            {ticket.responses.map((response, idx) => (
                                <div 
                                    key={idx} 
                                    className={`rounded-lg p-4 ${
                                        response.responder_email === ticket.requester_email 
                                            ? 'bg-blue-50 ml-4' 
                                            : 'bg-green-50 mr-4'
                                    }`}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="text-sm font-medium">{response.responder_name || response.responder_email}</span>
                                        <span className="text-xs text-gray-500">
                                            {new Date(response.timestamp).toLocaleString()}
                                        </span>
                                    </div>
                                    <p className="text-gray-700 whitespace-pre-wrap">{response.message}</p>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Reply Form */}
                    {!['resolved', 'closed'].includes(ticket.status) && (
                        <div className="border-t pt-4 space-y-4">
                            {/* AI Draft for Admins */}
                            {isAdmin && (
                                <div>
                                    {showAIDraft ? (
                                        <AIReplyDraft 
                                            ticket={ticket} 
                                            onUseDraft={(draft) => {
                                                setReply(draft);
                                                setShowAIDraft(false);
                                            }}
                                        />
                                    ) : (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setShowAIDraft(true)}
                                            className="text-purple-600 border-purple-200 hover:bg-purple-50"
                                        >
                                            <Sparkles className="w-4 h-4 mr-2" />
                                            Get AI Draft
                                        </Button>
                                    )}
                                </div>
                            )}

                            <Textarea
                                value={reply}
                                onChange={(e) => setReply(e.target.value)}
                                placeholder="Write your reply..."
                                rows={4}
                            />
                            <div className="flex justify-between items-center">
                                {isAdmin && (
                                    <Select value={newStatus} onValueChange={setNewStatus}>
                                        <SelectTrigger className="w-48">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="open">Open</SelectItem>
                                            <SelectItem value="in_progress">In Progress</SelectItem>
                                            <SelectItem value="waiting_response">Waiting Response</SelectItem>
                                            <SelectItem value="resolved">Resolved</SelectItem>
                                            <SelectItem value="closed">Closed</SelectItem>
                                        </SelectContent>
                                    </Select>
                                )}
                                <Button 
                                    onClick={() => replyMutation.mutate()}
                                    disabled={!reply || replyMutation.isPending}
                                    className="ml-auto"
                                >
                                    <Send className="w-4 h-4 mr-2" />
                                    Send Reply
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Admin Quick Actions */}
                    {isAdmin && ['resolved', 'closed'].includes(ticket.status) && (
                        <div className="border-t pt-4 flex gap-2">
                            <Button 
                                variant="outline" 
                                onClick={() => updateStatusMutation.mutate('open')}
                            >
                                Reopen Ticket
                            </Button>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}