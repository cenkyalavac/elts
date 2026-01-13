import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mail, FileText, Clock, ChevronDown, ChevronUp, Loader2, RefreshCw, LinkIcon } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { toast } from 'sonner';
import ProcessApplicationDialog from '@/components/inbox/ProcessApplicationDialog';

export default function InboxPage() {
    const [expandedEmail, setExpandedEmail] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [maxResults, setMaxResults] = useState(30);
    const [selectedEmail, setSelectedEmail] = useState(null);
    const [dialogOpen, setDialogOpen] = useState(false);

    // Check if user is admin
    const { data: user } = useQuery({
        queryKey: ['currentUser'],
        queryFn: async () => {
            try {
                return await base44.auth.me();
            } catch {
                return null;
            }
        },
    });

    // Fetch all emails
    const { data: emailData = { emails: [] }, isLoading, error, refetch } = useQuery({
        queryKey: ['allEmails', maxResults],
        queryFn: async () => {
            try {
                const response = await base44.functions.invoke('getGmailEmails', {
                    maxResults: maxResults
                });
                console.log('Email response:', response);
                if (!response.data) {
                    throw new Error('No data returned from Gmail function');
                }
                return response.data?.emails ? response.data : { emails: response.data };
            } catch (err) {
                console.error('Error fetching emails:', err);
                throw err;
            }
        },
        enabled: !!user && user.role === 'admin' && !!user.gmailRefreshToken,
        retry: 1,
    });

    const handleProcessEmail = (email) => {
        setSelectedEmail(email);
        setDialogOpen(true);
    };

    if (!user) {
        return (
            <div className="min-h-screen bg-gray-50 p-6">
                <div className="max-w-4xl mx-auto">
                    <Card className="p-8 text-center">
                        <h2 className="text-xl font-semibold text-gray-900">Loading...</h2>
                    </Card>
                </div>
            </div>
        );
    }

    if (user.role !== 'admin') {
        return (
            <div className="min-h-screen bg-gray-50 p-6">
                <div className="max-w-4xl mx-auto">
                    <Card className="p-8 text-center">
                        <h2 className="text-xl font-semibold text-gray-900">Access Denied</h2>
                        <p className="text-gray-600 mt-2">Only administrators can access the inbox.</p>
                    </Card>
                </div>
            </div>
        );
    }

    const connectMutation = useMutation({
        mutationFn: async () => {
            const response = await base44.functions.invoke('connectGmail', {});
            return response.data;
        },
        onSuccess: (data) => {
            if (data.authUrl) {
                window.location.href = data.authUrl;
            }
        },
        onError: (error) => {
            toast.error('Failed to initiate Gmail connection');
        }
    });

    if (!user.gmailRefreshToken) {
        return (
            <div className="min-h-screen bg-gray-50 p-6">
                <div className="max-w-4xl mx-auto">
                    <Card className="p-8 text-center">
                        <Mail className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <h2 className="text-xl font-semibold text-gray-900">Gmail Not Connected</h2>
                        <p className="text-gray-600 mt-2">Please connect your Gmail account to use the inbox feature.</p>
                        <Button 
                            onClick={() => connectMutation.mutate()} 
                            disabled={connectMutation.isPending}
                            className="mt-4 gap-2"
                        >
                            <LinkIcon className="w-4 h-4" />
                            {connectMutation.isPending ? 'Connecting...' : 'Connect Gmail'}
                        </Button>
                    </Card>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 p-6">
                <div className="max-w-4xl mx-auto">
                    <Card className="p-8 text-center border-red-200 bg-red-50">
                        <h2 className="text-xl font-semibold text-red-900">Error Loading Emails</h2>
                        <p className="text-red-700 mt-2">{error?.message || 'Failed to fetch emails from Gmail'}</p>
                        <Button onClick={() => refetch()} className="mt-4">Retry</Button>
                    </Card>
                </div>
            </div>
        );
    }

    const filteredEmails = emailData.emails.filter(email => {
        const searchTerm = searchQuery.toLowerCase();
        return (
            email.subject.toLowerCase().includes(searchTerm) ||
            email.from.toLowerCase().includes(searchTerm)
        );
    });

    const formatEmailDate = (dateStr) => {
        try {
            return format(parseISO(dateStr), 'MMM d, yyyy HH:mm');
        } catch {
            return dateStr;
        }
    };

    const extractEmailAddress = (fromString) => {
        const match = fromString.match(/<(.+?)>/);
        return match ? match[1] : fromString;
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Inbox</h1>
                        <p className="text-gray-600 mt-1">View and manage your Gmail emails</p>
                    </div>
                    <Button
                        onClick={() => refetch()}
                        disabled={isLoading}
                        className="gap-2"
                    >
                        <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                </div>

                {/* Search Bar */}
                <div className="mb-6 flex gap-2">
                    <Input
                        placeholder="Search by subject or sender..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="flex-1"
                    />
                </div>

                {/* Loading State */}
                {isLoading ? (
                    <Card className="p-8 text-center">
                        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                        <p className="text-gray-600">Loading emails...</p>
                    </Card>
                ) : emailData.emails?.length === 0 ? (
                    <Card className="p-8 text-center">
                        <Mail className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                        <p className="text-gray-600">No emails in inbox</p>
                    </Card>
                ) : filteredEmails.length === 0 ? (
                    <Card className="p-8 text-center">
                        <Mail className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                        <p className="text-gray-600">No emails match your search</p>
                    </Card>
                ) : (
                    <div className="space-y-2">
                        {/* Email Count */}
                        <div className="text-sm text-gray-600 mb-4">
                            Showing {filteredEmails.length} of {emailData.emails.length} emails
                        </div>

                        {/* Email List */}
                        {filteredEmails.map((email) => (
                            <Card
                                key={email.id}
                                className="hover:shadow-md transition-shadow cursor-pointer"
                                onClick={() => setExpandedEmail(expandedEmail === email.id ? null : email.id)}
                            >
                                <div className="p-4">
                                    {/* Email Header */}
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                                <h3 className="font-semibold text-gray-900 truncate">
                                                    {email.subject || '(No subject)'}
                                                </h3>
                                            </div>
                                            <p className="text-sm text-gray-600 truncate">
                                                From: {extractEmailAddress(email.from)}
                                            </p>
                                            <div className="flex items-center gap-4 mt-1">
                                                <span className="text-xs text-gray-500 flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    {formatEmailDate(email.date)}
                                                </span>
                                                {email.attachments?.length > 0 && (
                                                    <span className="text-xs text-blue-600 flex items-center gap-1">
                                                        <FileText className="w-3 h-3" />
                                                        {email.attachments.length} attachment(s)
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="ml-4 flex-shrink-0">
                                            {expandedEmail === email.id ? (
                                                <ChevronUp className="w-5 h-5 text-gray-400" />
                                            ) : (
                                                <ChevronDown className="w-5 h-5 text-gray-400" />
                                            )}
                                        </div>
                                    </div>

                                    {/* Email Preview */}
                                    {expandedEmail !== email.id && (
                                        <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                                            {email.snippet}
                                        </p>
                                    )}

                                    {/* Expanded Content */}
                                    {expandedEmail === email.id && (
                                        <div className="mt-4 pt-4 border-t border-gray-200 space-y-3">
                                            {/* Full Body */}
                                            <div className="bg-gray-50 p-3 rounded text-sm text-gray-700 max-h-64 overflow-y-auto whitespace-pre-wrap break-words">
                                                {email.body || email.snippet}
                                            </div>

                                            {/* Attachments */}
                                            {email.attachments?.length > 0 && (
                                                <div className="bg-blue-50 p-3 rounded">
                                                    <h4 className="text-sm font-semibold text-blue-900 mb-2">
                                                        Attachments ({email.attachments.length})
                                                    </h4>
                                                    <div className="space-y-1">
                                                        {email.attachments.map((attachment, idx) => (
                                                            <div key={idx} className="flex items-center gap-2 text-sm text-blue-700">
                                                                <FileText className="w-4 h-4" />
                                                                <span>{attachment.filename}</span>
                                                                <span className="text-xs text-blue-600">
                                                                    ({Math.round(attachment.size / 1024)}KB)
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Action Buttons */}
                                            <div className="flex gap-2 pt-2">
                                                <Button
                                                    size="sm"
                                                    className="flex-1"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleProcessEmail(email);
                                                    }}
                                                >
                                                    Process as Application
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </Card>
                        ))}

                        {/* Load More Button */}
                        {filteredEmails.length >= maxResults && (
                            <div className="text-center mt-6">
                                <Button
                                    variant="outline"
                                    onClick={() => setMaxResults(prev => prev + 20)}
                                >
                                    Load More Emails
                                </Button>
                            </div>
                        )}
                    </div>
                )}

                {/* Process Application Dialog */}
                <ProcessApplicationDialog
                    email={selectedEmail}
                    open={dialogOpen}
                    onOpenChange={setDialogOpen}
                    onSuccess={() => refetch()}
                />
            </div>
        </div>
    );
}