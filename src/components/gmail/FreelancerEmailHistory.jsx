import React, { useState } from 'react';
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
    Mail, Send, RefreshCw, Loader2, Inbox, SendHorizontal, 
    ChevronDown, ChevronUp, Paperclip, Clock, ExternalLink,
    MessageSquare, MailOpen, ArrowDownLeft, ArrowUpRight
} from "lucide-react";
import { format, parseISO, formatDistanceToNow } from "date-fns";
import EmailComposer from "./EmailComposer";
import GmailConnect from "./GmailConnect";

export default function FreelancerEmailHistory({ freelancerEmail, freelancerName }) {
    const [showCompose, setShowCompose] = useState(false);
    const [expandedEmail, setExpandedEmail] = useState(null);
    const [filter, setFilter] = useState('all'); // all, received, sent

    const { data: user } = useQuery({
        queryKey: ['currentUser'],
        queryFn: () => base44.auth.me(),
    });

    const { data: emailData, isLoading, refetch, isFetching } = useQuery({
        queryKey: ['freelancerEmails', freelancerEmail],
        queryFn: async () => {
            const { data } = await base44.functions.invoke('getGmailEmails', { 
                email: freelancerEmail,
                maxResults: 30
            });
            return data.emails || [];
        },
        enabled: !!freelancerEmail && !!user?.gmailRefreshToken,
        staleTime: 60000,
    });

    const emails = emailData || [];
    const isConnected = user?.gmailRefreshToken;

    if (!isConnected) {
        return <GmailConnect />;
    }

    const isFromFreelancer = (email) => {
        const from = email.from?.toLowerCase() || '';
        return from.includes(freelancerEmail.toLowerCase());
    };

    const filteredEmails = emails.filter(email => {
        if (filter === 'received') return isFromFreelancer(email);
        if (filter === 'sent') return !isFromFreelancer(email);
        return true;
    });

    const receivedCount = emails.filter(e => isFromFreelancer(e)).length;
    const sentCount = emails.filter(e => !isFromFreelancer(e)).length;

    const formatDate = (dateStr) => {
        try {
            const date = parseISO(dateStr);
            const now = new Date();
            const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
            
            if (diffDays === 0) return format(date, 'h:mm a');
            if (diffDays < 7) return formatDistanceToNow(date, { addSuffix: true });
            return format(date, 'MMM d, yyyy');
        } catch {
            return dateStr;
        }
    };

    const extractName = (fromString) => {
        if (!fromString) return 'Unknown';
        const match = fromString.match(/^([^<]+)/);
        return match ? match[1].trim().replace(/"/g, '') : fromString;
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-purple-600" />
                    <h3 className="font-semibold">Email Correspondence</h3>
                    {emails.length > 0 && (
                        <Badge variant="secondary" className="text-xs">
                            {emails.length} conversation{emails.length !== 1 ? 's' : ''}
                        </Badge>
                    )}
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => refetch()}
                        disabled={isFetching}
                    >
                        <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
                    </Button>
                    <Button
                        size="sm"
                        onClick={() => setShowCompose(true)}
                        className="gap-2 bg-purple-600 hover:bg-purple-700"
                    >
                        <Send className="w-4 h-4" />
                        Compose
                    </Button>
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-1 p-1 bg-gray-100 rounded-lg">
                <button
                    onClick={() => setFilter('all')}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                        filter === 'all' ? 'bg-white shadow text-purple-700' : 'text-gray-600 hover:text-gray-900'
                    }`}
                >
                    <Inbox className="w-4 h-4" />
                    All ({emails.length})
                </button>
                <button
                    onClick={() => setFilter('received')}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                        filter === 'received' ? 'bg-white shadow text-blue-700' : 'text-gray-600 hover:text-gray-900'
                    }`}
                >
                    <ArrowDownLeft className="w-4 h-4" />
                    Received ({receivedCount})
                </button>
                <button
                    onClick={() => setFilter('sent')}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                        filter === 'sent' ? 'bg-white shadow text-green-700' : 'text-gray-600 hover:text-gray-900'
                    }`}
                >
                    <ArrowUpRight className="w-4 h-4" />
                    Sent ({sentCount})
                </button>
            </div>

            {/* Email List */}
            {isLoading ? (
                <div className="text-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-purple-600 mb-2" />
                    <p className="text-sm text-gray-500">Loading emails...</p>
                </div>
            ) : filteredEmails.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed">
                    <Mail className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                    <p className="text-gray-600 font-medium">
                        {emails.length === 0 
                            ? 'No email history found' 
                            : `No ${filter === 'received' ? 'received' : 'sent'} emails`}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                        {emails.length === 0 
                            ? `Start a conversation with ${freelancerName || freelancerEmail}`
                            : 'Try a different filter'}
                    </p>
                    {emails.length === 0 && (
                        <Button 
                            size="sm" 
                            className="mt-3" 
                            onClick={() => setShowCompose(true)}
                        >
                            <Send className="w-4 h-4 mr-2" />
                            Send First Email
                        </Button>
                    )}
                </div>
            ) : (
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    {filteredEmails.map((email) => {
                        const isReceived = isFromFreelancer(email);
                        const isExpanded = expandedEmail === email.id;
                        
                        return (
                            <div
                                key={email.id}
                                className={`border rounded-lg transition-all cursor-pointer hover:shadow-sm ${
                                    isExpanded ? 'bg-white shadow-md' : 'bg-gray-50 hover:bg-white'
                                } ${email.isUnread ? 'border-l-4 border-l-purple-500' : ''}`}
                                onClick={() => setExpandedEmail(isExpanded ? null : email.id)}
                            >
                                <div className="p-3">
                                    <div className="flex items-start gap-3">
                                        {/* Direction Indicator */}
                                        <div className={`p-2 rounded-full ${
                                            isReceived 
                                                ? 'bg-blue-100 text-blue-600' 
                                                : 'bg-green-100 text-green-600'
                                        }`}>
                                            {isReceived 
                                                ? <ArrowDownLeft className="w-4 h-4" /> 
                                                : <ArrowUpRight className="w-4 h-4" />
                                            }
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <span className={`text-sm font-medium ${
                                                            email.isUnread ? 'text-gray-900' : 'text-gray-700'
                                                        }`}>
                                                            {isReceived ? extractName(email.from) : 'You'}
                                                        </span>
                                                        <Badge variant="outline" className={`text-xs ${
                                                            isReceived ? 'text-blue-600 border-blue-200' : 'text-green-600 border-green-200'
                                                        }`}>
                                                            {isReceived ? 'Received' : 'Sent'}
                                                        </Badge>
                                                    </div>
                                                    <p className={`text-sm truncate mt-0.5 ${
                                                        email.isUnread ? 'font-medium text-gray-900' : 'text-gray-600'
                                                    }`}>
                                                        {email.subject || '(No Subject)'}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-2 flex-shrink-0">
                                                    <span className="text-xs text-gray-500 flex items-center gap-1">
                                                        <Clock className="w-3 h-3" />
                                                        {formatDate(email.date)}
                                                    </span>
                                                    {isExpanded 
                                                        ? <ChevronUp className="w-4 h-4 text-gray-400" /> 
                                                        : <ChevronDown className="w-4 h-4 text-gray-400" />
                                                    }
                                                </div>
                                            </div>

                                            {/* Snippet */}
                                            {!isExpanded && (
                                                <p className="text-xs text-gray-500 line-clamp-1 mt-1">
                                                    {email.snippet}
                                                </p>
                                            )}

                                            {/* Attachments indicator */}
                                            {email.attachments?.length > 0 && !isExpanded && (
                                                <div className="flex items-center gap-1 mt-1">
                                                    <Paperclip className="w-3 h-3 text-gray-400" />
                                                    <span className="text-xs text-gray-500">
                                                        {email.attachments.length} attachment{email.attachments.length > 1 ? 's' : ''}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Expanded Content */}
                                    {isExpanded && (
                                        <div className="mt-4 pt-4 border-t">
                                            {/* Email Body */}
                                            <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700 whitespace-pre-wrap max-h-60 overflow-y-auto">
                                                {email.body || email.snippet}
                                            </div>

                                            {/* Attachments */}
                                            {email.attachments?.length > 0 && (
                                                <div className="mt-3 space-y-2">
                                                    <p className="text-xs font-medium text-gray-500 flex items-center gap-1">
                                                        <Paperclip className="w-3 h-3" />
                                                        Attachments
                                                    </p>
                                                    <div className="flex flex-wrap gap-2">
                                                        {email.attachments.map((att, idx) => (
                                                            <Badge key={idx} variant="outline" className="text-xs">
                                                                {att.filename}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Actions */}
                                            <div className="mt-3 flex gap-2">
                                                <Button 
                                                    size="sm" 
                                                    variant="outline"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setShowCompose(true);
                                                    }}
                                                    className="gap-2"
                                                >
                                                    <Send className="w-3 h-3" />
                                                    Reply
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Compose Dialog */}
            <EmailComposer
                open={showCompose}
                onOpenChange={setShowCompose}
                defaultTo={freelancerEmail}
                onSuccess={() => refetch()}
            />
        </div>
    );
}