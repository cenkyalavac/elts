import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
    HelpCircle, Plus, MessageSquare, Clock, CheckCircle, 
    AlertCircle, Send, User, Filter
} from "lucide-react";
import { toast } from "sonner";

const statusConfig = {
    open: { label: 'Open', color: 'bg-blue-100 text-blue-800', icon: AlertCircle },
    in_progress: { label: 'In Progress', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
    waiting_response: { label: 'Waiting Response', color: 'bg-purple-100 text-purple-800', icon: MessageSquare },
    resolved: { label: 'Resolved', color: 'bg-green-100 text-green-800', icon: CheckCircle },
    closed: { label: 'Closed', color: 'bg-gray-100 text-gray-800', icon: CheckCircle },
};

const categoryConfig = {
    general_question: { label: 'General Question' },
    technical_issue: { label: 'Technical Issue' },
    payment_inquiry: { label: 'Payment Inquiry' },
    application_status: { label: 'Application Status' },
    other: { label: 'Other' },
};

const priorityConfig = {
    low: { label: 'Low', color: 'bg-gray-100 text-gray-800' },
    medium: { label: 'Medium', color: 'bg-blue-100 text-blue-800' },
    high: { label: 'High', color: 'bg-orange-100 text-orange-800' },
    urgent: { label: 'Urgent', color: 'bg-red-100 text-red-800' },
};

export default function SupportTicketsPage() {
    const [showNewTicket, setShowNewTicket] = useState(false);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [reply, setReply] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [newTicket, setNewTicket] = useState({
        subject: '',
        message: '',
        category: 'general_question',
        priority: 'medium',
    });

    const queryClient = useQueryClient();

    const { data: user } = useQuery({
        queryKey: ['currentUser'],
        queryFn: () => base44.auth.me(),
    });

    const { data: tickets = [], isLoading } = useQuery({
        queryKey: ['supportTickets'],
        queryFn: () => base44.entities.SupportTicket.list('-created_date'),
    });

    const createMutation = useMutation({
        mutationFn: (data) => base44.entities.SupportTicket.create({
            ...data,
            requester_email: user?.email,
            requester_name: user?.full_name || user?.email?.split('@')[0],
            requester_role: user?.role,
        }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['supportTickets'] });
            setShowNewTicket(false);
            setNewTicket({ subject: '', message: '', category: 'general_question', priority: 'medium' });
            toast.success('Ticket created successfully');
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }) => base44.entities.SupportTicket.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['supportTickets'] });
        },
    });

    const handleCreateTicket = () => {
        if (!newTicket.subject || !newTicket.message) {
            toast.error('Please fill in subject and message');
            return;
        }
        createMutation.mutate(newTicket);
    };

    const handleReply = () => {
        if (!reply.trim()) return;
        
        const newResponse = {
            responder_email: user?.email,
            responder_name: user?.full_name || user?.email?.split('@')[0],
            message: reply,
            timestamp: new Date().toISOString(),
        };

        const updatedResponses = [...(selectedTicket.responses || []), newResponse];
        
        updateMutation.mutate({
            id: selectedTicket.id,
            data: { 
                responses: updatedResponses,
                status: isAdmin ? 'waiting_response' : 'in_progress'
            }
        });

        setReply('');
        setSelectedTicket({ ...selectedTicket, responses: updatedResponses });
        toast.success('Reply sent');
    };

    const handleStatusChange = (ticketId, newStatus) => {
        updateMutation.mutate({
            id: ticketId,
            data: { 
                status: newStatus,
                ...(newStatus === 'resolved' ? { resolved_at: new Date().toISOString() } : {})
            }
        });
        if (selectedTicket?.id === ticketId) {
            setSelectedTicket({ ...selectedTicket, status: newStatus });
        }
        toast.success('Status updated');
    };

    const isAdmin = user?.role === 'admin';
    const isPM = user?.role === 'project_manager';

    // Filter tickets based on role
    const visibleTickets = tickets.filter(t => {
        if (isAdmin) return true;
        return t.requester_email === user?.email;
    });

    const filteredTickets = visibleTickets.filter(t => {
        if (statusFilter === 'all') return true;
        return t.status === statusFilter;
    });

    const myTickets = filteredTickets.filter(t => t.requester_email === user?.email);
    const otherTickets = filteredTickets.filter(t => t.requester_email !== user?.email);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
            <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                            <HelpCircle className="w-8 h-8 text-blue-600" />
                            Support & Questions
                        </h1>
                        <p className="text-gray-600 mt-1">
                            Get help or ask questions to administrators
                        </p>
                    </div>
                    <Button onClick={() => setShowNewTicket(true)} className="gap-2">
                        <Plus className="w-4 h-4" />
                        New Question
                    </Button>
                </div>

                <div className="flex items-center gap-4 mb-6">
                    <div className="flex items-center gap-2">
                        <Filter className="w-4 h-4 text-gray-500" />
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-40">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                {Object.entries(statusConfig).map(([key, config]) => (
                                    <SelectItem key={key} value={key}>{config.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="text-sm text-gray-500">
                        {filteredTickets.length} ticket(s)
                    </div>
                </div>

                {isAdmin ? (
                    <Tabs defaultValue="all" className="space-y-6">
                        <TabsList>
                            <TabsTrigger value="all">All Tickets ({otherTickets.length})</TabsTrigger>
                            <TabsTrigger value="mine">My Questions ({myTickets.length})</TabsTrigger>
                        </TabsList>

                        <TabsContent value="all">
                            <TicketList 
                                tickets={otherTickets} 
                                onSelect={setSelectedTicket}
                                isAdmin={isAdmin}
                            />
                        </TabsContent>

                        <TabsContent value="mine">
                            <TicketList 
                                tickets={myTickets} 
                                onSelect={setSelectedTicket}
                                isAdmin={isAdmin}
                            />
                        </TabsContent>
                    </Tabs>
                ) : (
                    <TicketList 
                        tickets={filteredTickets} 
                        onSelect={setSelectedTicket}
                        isAdmin={isAdmin}
                    />
                )}
            </div>

            {/* New Ticket Dialog */}
            <Dialog open={showNewTicket} onOpenChange={setShowNewTicket}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Ask a Question</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div>
                            <Label>Subject</Label>
                            <Input
                                value={newTicket.subject}
                                onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
                                placeholder="Brief description of your question"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Category</Label>
                                <Select
                                    value={newTicket.category}
                                    onValueChange={(v) => setNewTicket({ ...newTicket, category: v })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Object.entries(categoryConfig).map(([key, config]) => (
                                            <SelectItem key={key} value={key}>{config.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label>Priority</Label>
                                <Select
                                    value={newTicket.priority}
                                    onValueChange={(v) => setNewTicket({ ...newTicket, priority: v })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Object.entries(priorityConfig).map(([key, config]) => (
                                            <SelectItem key={key} value={key}>{config.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div>
                            <Label>Message</Label>
                            <Textarea
                                value={newTicket.message}
                                onChange={(e) => setNewTicket({ ...newTicket, message: e.target.value })}
                                placeholder="Describe your question or issue in detail..."
                                rows={5}
                            />
                        </div>

                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setShowNewTicket(false)}>Cancel</Button>
                            <Button onClick={handleCreateTicket} disabled={createMutation.isPending}>
                                Submit Question
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Ticket Detail Dialog */}
            <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    {selectedTicket && (
                        <>
                            <DialogHeader>
                                <div className="flex items-start justify-between">
                                    <DialogTitle>{selectedTicket.subject}</DialogTitle>
                                    {isAdmin && (
                                        <Select 
                                            value={selectedTicket.status} 
                                            onValueChange={(v) => handleStatusChange(selectedTicket.id, v)}
                                        >
                                            <SelectTrigger className="w-40">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {Object.entries(statusConfig).map(([key, config]) => (
                                                    <SelectItem key={key} value={key}>{config.label}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    )}
                                </div>
                                <div className="flex items-center gap-2 mt-2 flex-wrap">
                                    <Badge className={statusConfig[selectedTicket.status]?.color}>
                                        {statusConfig[selectedTicket.status]?.label}
                                    </Badge>
                                    <Badge variant="outline">
                                        {categoryConfig[selectedTicket.category]?.label}
                                    </Badge>
                                    <Badge className={priorityConfig[selectedTicket.priority]?.color}>
                                        {priorityConfig[selectedTicket.priority]?.label}
                                    </Badge>
                                </div>
                            </DialogHeader>

                            <div className="space-y-4 py-4">
                                {/* Original Message */}
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <User className="w-4 h-4 text-gray-500" />
                                        <span className="font-medium">{selectedTicket.requester_name}</span>
                                        <span className="text-xs text-gray-500">
                                            {new Date(selectedTicket.created_date).toLocaleString()}
                                        </span>
                                    </div>
                                    <p className="text-gray-700 whitespace-pre-wrap">{selectedTicket.message}</p>
                                </div>

                                {/* Responses */}
                                {selectedTicket.responses?.map((response, idx) => (
                                    <div 
                                        key={idx} 
                                        className={`rounded-lg p-4 ${
                                            response.responder_email === selectedTicket.requester_email 
                                                ? 'bg-gray-50' 
                                                : 'bg-blue-50'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2 mb-2">
                                            <User className="w-4 h-4 text-gray-500" />
                                            <span className="font-medium">{response.responder_name}</span>
                                            {response.responder_email !== selectedTicket.requester_email && (
                                                <Badge variant="outline" className="text-xs">Admin</Badge>
                                            )}
                                            <span className="text-xs text-gray-500">
                                                {new Date(response.timestamp).toLocaleString()}
                                            </span>
                                        </div>
                                        <p className="text-gray-700 whitespace-pre-wrap">{response.message}</p>
                                    </div>
                                ))}

                                {/* Reply Input */}
                                {selectedTicket.status !== 'closed' && (
                                    <div className="border-t pt-4">
                                        <Label>Your Reply</Label>
                                        <Textarea
                                            value={reply}
                                            onChange={(e) => setReply(e.target.value)}
                                            placeholder="Type your reply..."
                                            rows={3}
                                            className="mt-2"
                                        />
                                        <div className="flex justify-end mt-2">
                                            <Button onClick={handleReply} disabled={!reply.trim()} className="gap-2">
                                                <Send className="w-4 h-4" />
                                                Send Reply
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}

function TicketList({ tickets, onSelect, isAdmin }) {
    if (tickets.length === 0) {
        return (
            <Card>
                <CardContent className="text-center py-12">
                    <HelpCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600">No tickets found</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-3">
            {tickets.map(ticket => {
                const StatusIcon = statusConfig[ticket.status]?.icon || AlertCircle;
                return (
                    <Card 
                        key={ticket.id} 
                        className="cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => onSelect(ticket)}
                    >
                        <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <StatusIcon className={`w-4 h-4 ${
                                            ticket.status === 'open' ? 'text-blue-600' :
                                            ticket.status === 'resolved' ? 'text-green-600' :
                                            'text-gray-500'
                                        }`} />
                                        <h3 className="font-medium">{ticket.subject}</h3>
                                    </div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <Badge className={statusConfig[ticket.status]?.color}>
                                            {statusConfig[ticket.status]?.label}
                                        </Badge>
                                        <Badge variant="outline" className="text-xs">
                                            {categoryConfig[ticket.category]?.label}
                                        </Badge>
                                        <Badge className={priorityConfig[ticket.priority]?.color}>
                                            {priorityConfig[ticket.priority]?.label}
                                        </Badge>
                                        {isAdmin && (
                                            <span className="text-xs text-gray-500">
                                                from {ticket.requester_name} ({ticket.requester_role})
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-xs text-gray-500">
                                        {new Date(ticket.created_date).toLocaleDateString()}
                                    </div>
                                    {ticket.responses?.length > 0 && (
                                        <div className="text-xs text-blue-600 mt-1">
                                            {ticket.responses.length} replies
                                        </div>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}