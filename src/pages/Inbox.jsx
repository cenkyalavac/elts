import React, { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
    Mail, FileText, Clock, ChevronDown, ChevronUp, 
    Loader2, RefreshCw, LinkIcon, CheckCircle, AlertCircle,
    Search, Inbox, Star, Archive, Trash2, Reply, Forward,
    Paperclip, Sparkles, UserPlus, ExternalLink, Filter,
    MailOpen, Tag, Zap, MoreHorizontal, CheckSquare, Square,
    Calendar, ArrowUp, ArrowDown, Eye, EyeOff, Send, Copy,
    MailCheck, Keyboard
} from 'lucide-react';
import { format, parseISO, formatDistanceToNow, isAfter, isBefore, subDays } from 'date-fns';
import { toast } from 'sonner';
import ProcessApplicationDialog from '@/components/inbox/ProcessApplicationDialog';
import EmailAnalysis from '@/components/inbox/EmailAnalysis';
import QuickReplyDialog from '@/components/inbox/QuickReplyDialog';

export default function InboxPage() {
    const [expandedEmail, setExpandedEmail] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [maxResults, setMaxResults] = useState(30);
    const [selectedEmail, setSelectedEmail] = useState(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [emailAnalysis, setEmailAnalysis] = useState({});
    const [activeFilter, setActiveFilter] = useState('all');
    const [starredEmails, setStarredEmails] = useState(new Set());
    const [selectedEmails, setSelectedEmails] = useState(new Set());
    const [sortBy, setSortBy] = useState('date_desc');
    const [dateFilter, setDateFilter] = useState('all');
    const [readEmails, setReadEmails] = useState(new Set());
    const [replyDialogOpen, setReplyDialogOpen] = useState(false);
    const [replyEmail, setReplyEmail] = useState(null);
    const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);
    const queryClient = useQueryClient();

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
            
            switch(e.key) {
                case 'j':
                    // Next email
                    if (filteredEmails.length > 0) {
                        const currentIdx = filteredEmails.findIndex(em => em.id === expandedEmail);
                        const nextIdx = currentIdx < filteredEmails.length - 1 ? currentIdx + 1 : 0;
                        setExpandedEmail(filteredEmails[nextIdx]?.id);
                    }
                    break;
                case 'k':
                    // Previous email
                    if (filteredEmails.length > 0) {
                        const currentIdx = filteredEmails.findIndex(em => em.id === expandedEmail);
                        const prevIdx = currentIdx > 0 ? currentIdx - 1 : filteredEmails.length - 1;
                        setExpandedEmail(filteredEmails[prevIdx]?.id);
                    }
                    break;
                case 's':
                    // Star current email
                    if (expandedEmail) {
                        toggleStar({ stopPropagation: () => {} }, expandedEmail);
                    }
                    break;
                case 'r':
                    // Reply to current email
                    if (expandedEmail) {
                        const email = filteredEmails.find(em => em.id === expandedEmail);
                        if (email) handleReply(email);
                    }
                    break;
                case 'Escape':
                    setExpandedEmail(null);
                    break;
                case '?':
                    setShowKeyboardShortcuts(prev => !prev);
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [expandedEmail]);

    // Fetch current user
    const { data: user, isLoading: userLoading } = useQuery({
        queryKey: ['currentUser'],
        queryFn: async () => {
            try {
                return await base44.auth.me();
            } catch (e) {
                console.error('Auth error:', e);
                return null;
            }
        },
    });

    // Gmail connect mutation
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
            toast.error('Failed to connect Gmail');
            console.error('Connect error:', error);
        }
    });

    // Fetch emails - only when connected
    const { 
        data: emailData = { emails: [] }, 
        isLoading: emailsLoading, 
        error: emailsError, 
        refetch 
    } = useQuery({
        queryKey: ['allEmails', maxResults],
        queryFn: async () => {
            const response = await base44.functions.invoke('getGmailEmails', {
                maxResults: maxResults
            });
            return { emails: response.data?.emails || [] };
        },
        enabled: !!user && user.role === 'admin' && !!user.gmailRefreshToken,
        retry: 1,
    });

    // Analyze email mutation
    const analyzeEmailMutation = useMutation({
        mutationFn: async (email) => {
            const response = await base44.functions.invoke('analyzeEmailWithAI', {
                email: {
                    subject: email.subject,
                    from: email.from,
                    body: email.body || email.snippet,
                    attachments: email.attachments
                }
            });
            return response.data.analysis;
        },
        onSuccess: (data, variables) => {
            setEmailAnalysis(prev => ({
                ...prev,
                [variables.id]: data
            }));
            toast.success('Email analyzed successfully');
        },
        onError: () => {
            toast.error('Failed to analyze email');
        }
    });

    const handleProcessEmail = (email) => {
        setSelectedEmail(email);
        setDialogOpen(true);
    };

    const handleReply = (email) => {
        setReplyEmail(email);
        setReplyDialogOpen(true);
    };

    const toggleEmailSelection = (emailId) => {
        setSelectedEmails(prev => {
            const newSet = new Set(prev);
            if (newSet.has(emailId)) {
                newSet.delete(emailId);
            } else {
                newSet.add(emailId);
            }
            return newSet;
        });
    };

    const toggleSelectAll = () => {
        if (selectedEmails.size === filteredEmails.length) {
            setSelectedEmails(new Set());
        } else {
            setSelectedEmails(new Set(filteredEmails.map(e => e.id)));
        }
    };

    const bulkStarEmails = () => {
        setStarredEmails(prev => {
            const newSet = new Set(prev);
            selectedEmails.forEach(id => newSet.add(id));
            return newSet;
        });
        toast.success(`Starred ${selectedEmails.size} emails`);
        setSelectedEmails(new Set());
    };

    const bulkMarkAsRead = () => {
        setReadEmails(prev => {
            const newSet = new Set(prev);
            selectedEmails.forEach(id => newSet.add(id));
            return newSet;
        });
        toast.success(`Marked ${selectedEmails.size} emails as read`);
        setSelectedEmails(new Set());
    };

    const bulkAnalyze = () => {
        const emailsToAnalyze = filteredEmails.filter(e => selectedEmails.has(e.id));
        emailsToAnalyze.forEach(email => {
            analyzeEmailMutation.mutate({ ...email, id: email.id });
        });
        setSelectedEmails(new Set());
    };

    const formatEmailDate = (dateStr) => {
        try {
            const date = parseISO(dateStr);
            const now = new Date();
            const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
            
            if (diffDays === 0) {
                return format(date, 'h:mm a');
            } else if (diffDays < 7) {
                return formatDistanceToNow(date, { addSuffix: true });
            }
            return format(date, 'MMM d, yyyy');
        } catch {
            return dateStr;
        }
    };

    const extractSenderName = (fromString) => {
        if (!fromString) return 'Unknown';
        const match = fromString.match(/^([^<]+)/);
        return match ? match[1].trim().replace(/"/g, '') : fromString;
    };

    const extractEmailAddress = (fromString) => {
        const match = fromString?.match(/<(.+?)>/);
        return match ? match[1] : fromString;
    };

    const toggleStar = (e, emailId) => {
        e.stopPropagation();
        setStarredEmails(prev => {
            const newSet = new Set(prev);
            if (newSet.has(emailId)) {
                newSet.delete(emailId);
            } else {
                newSet.add(emailId);
            }
            return newSet;
        });
    };

    const getEmailCategory = (email) => {
        const analysis = emailAnalysis[email.id];
        if (analysis) return analysis.category;
        
        // Quick detection based on subject/content
        const subject = (email.subject || '').toLowerCase();
        const body = (email.body || email.snippet || '').toLowerCase();
        
        if (subject.includes('application') || subject.includes('cv') || subject.includes('resume') || 
            body.includes('apply') || body.includes('position')) {
            return 'Application';
        }
        if (subject.includes('urgent') || subject.includes('asap')) {
            return 'Urgent';
        }
        if (email.attachments?.length > 0) {
            return 'Has Attachments';
        }
        return null;
    };

    const filteredEmails = (emailData?.emails || []).filter(email => {
        if (!email) return false;
        const searchTerm = searchQuery.toLowerCase();
        const matchesSearch = (
            (email.subject || '').toLowerCase().includes(searchTerm) ||
            (email.from || '').toLowerCase().includes(searchTerm) ||
            (email.snippet || '').toLowerCase().includes(searchTerm)
        );
        
        if (!matchesSearch) return false;
        
        if (activeFilter === 'starred') return starredEmails.has(email.id);
        if (activeFilter === 'attachments') return email.attachments?.length > 0;
        if (activeFilter === 'unread') return !readEmails.has(email.id);
        if (activeFilter === 'applications') {
            const category = getEmailCategory(email);
            return category === 'Application' || category === 'New Application Inquiry';
        }
        
        // Date filter
        if (dateFilter !== 'all') {
            try {
                const emailDate = parseISO(email.date);
                const now = new Date();
                if (dateFilter === 'today' && !isAfter(emailDate, subDays(now, 1))) return false;
                if (dateFilter === 'week' && !isAfter(emailDate, subDays(now, 7))) return false;
                if (dateFilter === 'month' && !isAfter(emailDate, subDays(now, 30))) return false;
            } catch {}
        }
        
        return true;
    }).sort((a, b) => {
        // Sort logic
        try {
            const dateA = parseISO(a.date);
            const dateB = parseISO(b.date);
            if (sortBy === 'date_desc') return dateB - dateA;
            if (sortBy === 'date_asc') return dateA - dateB;
        } catch {}
        if (sortBy === 'sender') return (a.from || '').localeCompare(b.from || '');
        if (sortBy === 'subject') return (a.subject || '').localeCompare(b.subject || '');
        return 0;
    });

    // Stats for quick view
    const stats = {
        total: emailData?.emails?.length || 0,
        starred: starredEmails.size,
        withAttachments: (emailData?.emails || []).filter(e => e?.attachments?.length > 0).length,
        unread: (emailData?.emails || []).filter(e => !readEmails.has(e?.id)).length,
        applications: (emailData?.emails || []).filter(e => {
            const cat = getEmailCategory(e);
            return cat === 'Application' || cat === 'New Application Inquiry';
        }).length
    };

    // Loading state
    if (userLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
                <div className="max-w-7xl mx-auto">
                    <Card className="p-12 text-center border-0 shadow-lg">
                        <Loader2 className="w-10 h-10 animate-spin mx-auto mb-3 text-purple-600" />
                        <p className="text-gray-600 font-medium">Loading...</p>
                    </Card>
                </div>
            </div>
        );
    }

    // Not logged in
    if (!user) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
                <div className="max-w-7xl mx-auto">
                    <Card className="p-12 text-center border-0 shadow-lg">
                        <AlertCircle className="w-16 h-16 text-amber-400 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-gray-900">Login Required</h2>
                        <p className="text-gray-600 mt-2">Please log in to access your inbox.</p>
                    </Card>
                </div>
            </div>
        );
    }

    // Access denied for non-admins
    if (user.role !== 'admin') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
                <div className="max-w-7xl mx-auto">
                    <Card className="p-12 text-center border-0 shadow-lg">
                        <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-gray-900">Access Denied</h2>
                        <p className="text-gray-600 mt-2">Only administrators can access the inbox.</p>
                    </Card>
                </div>
            </div>
        );
    }

    const isConnected = !!user?.gmailRefreshToken;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
            <div className="max-w-7xl mx-auto p-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                            <div className="p-2 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl">
                                <Inbox className="w-7 h-7 text-white" />
                            </div>
                            Inbox
                        </h1>
                        <p className="text-gray-500 mt-1 ml-14">Manage and process incoming emails</p>
                    </div>
                    {isConnected && (
                        <div className="flex items-center gap-3">
                            <Button
                                variant="outline"
                                onClick={() => refetch()}
                                disabled={emailsLoading}
                                className="gap-2"
                            >
                                <RefreshCw className={`w-4 h-4 ${emailsLoading ? 'animate-spin' : ''}`} />
                                Refresh
                            </Button>
                        </div>
                    )}
                </div>

                {/* Gmail Connection Card - Compact when connected */}
                {!isConnected ? (
                    <Card className="mb-6 border-0 shadow-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white">
                        <CardContent className="p-8">
                            <div className="flex flex-col md:flex-row items-center gap-6">
                                <div className="p-4 bg-white/20 rounded-2xl">
                                    <Mail className="w-12 h-12" />
                                </div>
                                <div className="flex-1 text-center md:text-left">
                                    <h2 className="text-2xl font-bold mb-2">Connect Your Gmail</h2>
                                    <p className="text-purple-100">
                                        Connect your Gmail account to view and process emails directly from this dashboard.
                                        You can analyze applications, manage communications, and more.
                                    </p>
                                </div>
                                <Button 
                                    onClick={() => connectMutation.mutate()}
                                    disabled={connectMutation.isPending}
                                    size="lg"
                                    className="bg-white text-purple-700 hover:bg-purple-50 gap-2"
                                >
                                    <LinkIcon className="w-5 h-5" />
                                    {connectMutation.isPending ? 'Connecting...' : 'Connect Gmail'}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <Card className="mb-6 border-0 shadow-sm bg-green-50">
                        <CardContent className="py-3 px-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <CheckCircle className="w-5 h-5 text-green-600" />
                                    <span className="font-medium text-green-800">Gmail Connected</span>
                                    <span className="text-green-600 text-sm">{user.email}</span>
                                </div>
                                <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
                                    Active
                                </Badge>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Email Content - Only show if connected */}
                {isConnected && (
                    <>
                        {/* Stats Cards */}
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                            <Card 
                                className={`border-0 shadow-sm cursor-pointer transition-all hover:shadow-md ${activeFilter === 'all' ? 'ring-2 ring-purple-500' : ''}`}
                                onClick={() => setActiveFilter('all')}
                            >
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-gray-500">All Emails</p>
                                            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                                        </div>
                                        <div className="p-2 bg-purple-100 rounded-lg">
                                            <Mail className="w-5 h-5 text-purple-600" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                            <Card 
                                className={`border-0 shadow-sm cursor-pointer transition-all hover:shadow-md ${activeFilter === 'unread' ? 'ring-2 ring-indigo-500' : ''}`}
                                onClick={() => setActiveFilter('unread')}
                            >
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-gray-500">Unread</p>
                                            <p className="text-2xl font-bold text-gray-900">{stats.unread}</p>
                                        </div>
                                        <div className="p-2 bg-indigo-100 rounded-lg">
                                            <MailCheck className="w-5 h-5 text-indigo-600" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                            <Card 
                                className={`border-0 shadow-sm cursor-pointer transition-all hover:shadow-md ${activeFilter === 'starred' ? 'ring-2 ring-yellow-500' : ''}`}
                                onClick={() => setActiveFilter('starred')}
                            >
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-gray-500">Starred</p>
                                            <p className="text-2xl font-bold text-gray-900">{stats.starred}</p>
                                        </div>
                                        <div className="p-2 bg-yellow-100 rounded-lg">
                                            <Star className="w-5 h-5 text-yellow-600" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                            <Card 
                                className={`border-0 shadow-sm cursor-pointer transition-all hover:shadow-md ${activeFilter === 'attachments' ? 'ring-2 ring-blue-500' : ''}`}
                                onClick={() => setActiveFilter('attachments')}
                            >
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-gray-500">With Files</p>
                                            <p className="text-2xl font-bold text-gray-900">{stats.withAttachments}</p>
                                        </div>
                                        <div className="p-2 bg-blue-100 rounded-lg">
                                            <Paperclip className="w-5 h-5 text-blue-600" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                            <Card 
                                className={`border-0 shadow-sm cursor-pointer transition-all hover:shadow-md ${activeFilter === 'applications' ? 'ring-2 ring-green-500' : ''}`}
                                onClick={() => setActiveFilter('applications')}
                            >
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-gray-500">Applications</p>
                                            <p className="text-2xl font-bold text-gray-900">{stats.applications}</p>
                                        </div>
                                        <div className="p-2 bg-green-100 rounded-lg">
                                            <UserPlus className="w-5 h-5 text-green-600" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Search Bar & Filters */}
                        <Card className="mb-6 border-0 shadow-sm">
                            <CardContent className="p-4">
                                <div className="flex flex-col gap-4">
                                    <div className="flex flex-col md:flex-row gap-4">
                                        <div className="relative flex-1">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                            <Input
                                                placeholder="Search by subject, sender, or content..."
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                className="pl-10 h-11 border-gray-200"
                                            />
                                        </div>
                                        <Select value={dateFilter} onValueChange={setDateFilter}>
                                            <SelectTrigger className="w-[150px]">
                                                <Calendar className="w-4 h-4 mr-2" />
                                                <SelectValue placeholder="Date range" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Time</SelectItem>
                                                <SelectItem value="today">Today</SelectItem>
                                                <SelectItem value="week">Past Week</SelectItem>
                                                <SelectItem value="month">Past Month</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <Select value={sortBy} onValueChange={setSortBy}>
                                            <SelectTrigger className="w-[150px]">
                                                <ArrowDown className="w-4 h-4 mr-2" />
                                                <SelectValue placeholder="Sort by" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="date_desc">Newest First</SelectItem>
                                                <SelectItem value="date_asc">Oldest First</SelectItem>
                                                <SelectItem value="sender">Sender</SelectItem>
                                                <SelectItem value="subject">Subject</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <Button 
                                            variant="ghost" 
                                            size="icon"
                                            onClick={() => setShowKeyboardShortcuts(prev => !prev)}
                                            className="hidden md:flex"
                                            title="Keyboard shortcuts (?)"
                                        >
                                            <Keyboard className="w-4 h-4" />
                                        </Button>
                                        {(activeFilter !== 'all' || dateFilter !== 'all') && (
                                            <Button 
                                                variant="outline" 
                                                onClick={() => { setActiveFilter('all'); setDateFilter('all'); }}
                                                className="gap-2"
                                            >
                                                <Filter className="w-4 h-4" />
                                                Clear Filters
                                            </Button>
                                        )}
                                    </div>
                                    
                                    {/* Bulk Actions Bar */}
                                    {selectedEmails.size > 0 && (
                                        <div className="flex items-center gap-3 bg-purple-50 rounded-lg p-3">
                                            <Checkbox 
                                                checked={selectedEmails.size === filteredEmails.length}
                                                onCheckedChange={toggleSelectAll}
                                            />
                                            <span className="text-sm font-medium text-purple-900">
                                                {selectedEmails.size} selected
                                            </span>
                                            <div className="flex gap-2 ml-auto">
                                                <Button size="sm" variant="outline" onClick={bulkStarEmails} className="gap-2">
                                                    <Star className="w-4 h-4" />
                                                    Star
                                                </Button>
                                                <Button size="sm" variant="outline" onClick={bulkMarkAsRead} className="gap-2">
                                                    <Eye className="w-4 h-4" />
                                                    Mark Read
                                                </Button>
                                                <Button size="sm" variant="outline" onClick={bulkAnalyze} className="gap-2">
                                                    <Sparkles className="w-4 h-4" />
                                                    AI Analyze
                                                </Button>
                                                <Button size="sm" variant="ghost" onClick={() => setSelectedEmails(new Set())}>
                                                    Cancel
                                                </Button>
                                            </div>
                                        </div>
                                    )}

                                    {/* Keyboard Shortcuts */}
                                    {showKeyboardShortcuts && (
                                        <div className="bg-gray-50 rounded-lg p-4">
                                            <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                                <Keyboard className="w-4 h-4" />
                                                Keyboard Shortcuts
                                            </h4>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                                                <div className="flex items-center gap-2">
                                                    <kbd className="px-2 py-1 bg-white rounded border text-xs">j</kbd>
                                                    <span className="text-gray-600">Next email</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <kbd className="px-2 py-1 bg-white rounded border text-xs">k</kbd>
                                                    <span className="text-gray-600">Previous email</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <kbd className="px-2 py-1 bg-white rounded border text-xs">s</kbd>
                                                    <span className="text-gray-600">Star email</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <kbd className="px-2 py-1 bg-white rounded border text-xs">r</kbd>
                                                    <span className="text-gray-600">Reply</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <kbd className="px-2 py-1 bg-white rounded border text-xs">Esc</kbd>
                                                    <span className="text-gray-600">Close email</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <kbd className="px-2 py-1 bg-white rounded border text-xs">?</kbd>
                                                    <span className="text-gray-600">Toggle shortcuts</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Error State */}
                        {emailsError && (
                            <Card className="p-8 text-center border-red-200 bg-red-50 mb-6">
                                <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                                <h2 className="text-xl font-semibold text-red-900">Failed to Load Emails</h2>
                                <p className="text-red-700 mt-2">{emailsError?.message || 'Could not fetch emails from Gmail'}</p>
                                <Button onClick={() => refetch()} className="mt-4">Try Again</Button>
                            </Card>
                        )}

                        {/* Loading Emails */}
                        {emailsLoading && (
                            <Card className="p-12 text-center border-0 shadow-lg">
                                <Loader2 className="w-10 h-10 animate-spin mx-auto mb-3 text-purple-600" />
                                <p className="text-gray-600 font-medium">Loading emails...</p>
                            </Card>
                        )}

                        {/* Empty State */}
                        {!emailsLoading && !emailsError && emailData.emails.length === 0 && (
                            <Card className="p-12 text-center border-0 shadow-lg">
                                <div className="p-4 bg-gray-100 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                                    <Inbox className="w-10 h-10 text-gray-400" />
                                </div>
                                <h3 className="text-xl font-semibold text-gray-900">No emails found</h3>
                                <p className="text-gray-500 mt-2">Your inbox is empty</p>
                                <Button onClick={() => refetch()} variant="outline" className="mt-4">
                                    Refresh Inbox
                                </Button>
                            </Card>
                        )}

                        {/* No Search Results */}
                        {!emailsLoading && !emailsError && emailData.emails.length > 0 && filteredEmails.length === 0 && (
                            <Card className="p-12 text-center border-0 shadow-lg">
                                <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                <h3 className="text-xl font-semibold text-gray-900">No matches found</h3>
                                <p className="text-gray-500 mt-2">Try adjusting your search or filter</p>
                                <Button variant="outline" onClick={() => { setSearchQuery(''); setActiveFilter('all'); }} className="mt-4">
                                    Clear Search
                                </Button>
                            </Card>
                        )}

                        {/* Email List */}
                        {!emailsLoading && !emailsError && filteredEmails.length > 0 && (
                            <div className="space-y-3">
                                <div className="flex items-center justify-between px-1">
                                    <p className="text-sm text-gray-500">
                                        Showing {filteredEmails.length} of {emailData.emails.length} emails
                                        {activeFilter !== 'all' && (
                                            <Badge variant="secondary" className="ml-2">{activeFilter}</Badge>
                                        )}
                                    </p>
                                </div>

                                {filteredEmails.map((email) => {
                                    const category = getEmailCategory(email);
                                    const isStarred = starredEmails.has(email.id);
                                    const isExpanded = expandedEmail === email.id;
                                    const hasAnalysis = !!emailAnalysis[email.id];
                                    
                                    return (
                                        <Card
                                            key={email.id}
                                            className={`border-0 shadow-sm hover:shadow-md transition-all cursor-pointer ${
                                                isExpanded ? 'ring-2 ring-purple-200' : ''
                                            }`}
                                            onClick={() => setExpandedEmail(isExpanded ? null : email.id)}
                                        >
                                            <div className="p-4">
                                                {/* Email Header */}
                                                <div className="flex items-start gap-3">
                                                    {/* Star Button */}
                                                    <button
                                                        onClick={(e) => toggleStar(e, email.id)}
                                                        className={`mt-1 p-1 rounded hover:bg-gray-100 transition-colors ${
                                                            isStarred ? 'text-yellow-500' : 'text-gray-300 hover:text-yellow-500'
                                                        }`}
                                                    >
                                                        <Star className={`w-5 h-5 ${isStarred ? 'fill-current' : ''}`} />
                                                    </button>

                                                    {/* Sender Avatar */}
                                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                                                        {extractSenderName(email.from).charAt(0).toUpperCase()}
                                                    </div>

                                                    {/* Email Content */}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-start justify-between gap-2">
                                                            <div className="min-w-0">
                                                                <h3 className="font-semibold text-gray-900 truncate">
                                                                    {extractSenderName(email.from)}
                                                                </h3>
                                                                <p className="text-xs text-gray-500 truncate">
                                                                    {extractEmailAddress(email.from)}
                                                                </p>
                                                            </div>
                                                            <div className="flex items-center gap-2 flex-shrink-0">
                                                                <span className="text-xs text-gray-500">
                                                                    {formatEmailDate(email.date)}
                                                                </span>
                                                                {isExpanded ? (
                                                                    <ChevronUp className="w-5 h-5 text-gray-400" />
                                                                ) : (
                                                                    <ChevronDown className="w-5 h-5 text-gray-400" />
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Subject */}
                                                        <p className="font-medium text-gray-800 mt-1 truncate">
                                                            {email.subject || '(No Subject)'}
                                                        </p>

                                                        {/* Labels & Badges */}
                                                        <div className="flex flex-wrap items-center gap-2 mt-2">
                                                            {category && (
                                                                <Badge variant="secondary" className="text-xs">
                                                                    <Tag className="w-3 h-3 mr-1" />
                                                                    {category}
                                                                </Badge>
                                                            )}
                                                            {email.attachments?.length > 0 && (
                                                                <Badge variant="outline" className="text-xs text-blue-600 border-blue-200 bg-blue-50">
                                                                    <Paperclip className="w-3 h-3 mr-1" />
                                                                    {email.attachments.length} attachment{email.attachments.length > 1 ? 's' : ''}
                                                                </Badge>
                                                            )}
                                                            {hasAnalysis && (
                                                                <Badge variant="outline" className="text-xs text-purple-600 border-purple-200 bg-purple-50">
                                                                    <Sparkles className="w-3 h-3 mr-1" />
                                                                    AI Analyzed
                                                                </Badge>
                                                            )}
                                                            {emailAnalysis[email.id]?.urgency === 'high' && (
                                                                <Badge variant="destructive" className="text-xs">
                                                                    <Zap className="w-3 h-3 mr-1" />
                                                                    Urgent
                                                                </Badge>
                                                            )}
                                                        </div>

                                                        {/* Preview */}
                                                        {!isExpanded && (
                                                            <p className="text-sm text-gray-500 mt-2 line-clamp-1">
                                                                {email.snippet}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* AI Analysis Display */}
                                                {hasAnalysis && !isExpanded && (
                                                    <div className="mt-3 ml-14 pl-3 border-l-2 border-purple-200">
                                                        <EmailAnalysis 
                                                            analysis={emailAnalysis[email.id]}
                                                            emailId={email.id}
                                                            emailData={email}
                                                            onCorrectionSaved={() => {}}
                                                            compact={true}
                                                        />
                                                    </div>
                                                )}

                                                {/* Expanded Content */}
                                                {isExpanded && (
                                                    <div className="mt-4 ml-14 space-y-4">
                                                        {/* Quick Action Buttons */}
                                                        <div className="flex flex-wrap gap-2">
                                                            {!hasAnalysis && (
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        analyzeEmailMutation.mutate({ ...email, id: email.id });
                                                                    }}
                                                                    disabled={analyzeEmailMutation.isPending}
                                                                    className="gap-2"
                                                                >
                                                                    <Sparkles className={`w-4 h-4 ${analyzeEmailMutation.isPending ? 'animate-pulse' : ''}`} />
                                                                    {analyzeEmailMutation.isPending ? 'Analyzing...' : 'AI Analyze'}
                                                                </Button>
                                                            )}
                                                            <Button
                                                                size="sm"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleProcessEmail(email);
                                                                }}
                                                                className="gap-2 bg-green-600 hover:bg-green-700"
                                                            >
                                                                <UserPlus className="w-4 h-4" />
                                                                Process as Application
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    window.open(`https://mail.google.com/mail/u/0/#inbox/${email.id}`, '_blank');
                                                                }}
                                                                className="gap-2"
                                                            >
                                                                <ExternalLink className="w-4 h-4" />
                                                                Open in Gmail
                                                            </Button>
                                                        </div>

                                                        {/* AI Analysis */}
                                                        {hasAnalysis && (
                                                            <EmailAnalysis 
                                                                analysis={emailAnalysis[email.id]}
                                                                emailId={email.id}
                                                                emailData={email}
                                                                onCorrectionSaved={() => {}}
                                                            />
                                                        )}

                                                        {/* Email Body */}
                                                        <div className="bg-gray-50 rounded-lg p-4">
                                                            <div className="flex items-center gap-2 mb-3 pb-3 border-b border-gray-200">
                                                                <MailOpen className="w-4 h-4 text-gray-400" />
                                                                <span className="text-sm font-medium text-gray-700">Email Content</span>
                                                            </div>
                                                            <div className="text-sm text-gray-700 max-h-80 overflow-y-auto whitespace-pre-wrap break-words leading-relaxed">
                                                                {email.body || email.snippet}
                                                            </div>
                                                        </div>

                                                        {/* Attachments */}
                                                        {email.attachments?.length > 0 && (
                                                            <div className="bg-blue-50 rounded-lg p-4">
                                                                <div className="flex items-center gap-2 mb-3">
                                                                    <Paperclip className="w-4 h-4 text-blue-600" />
                                                                    <span className="text-sm font-medium text-blue-900">
                                                                        Attachments ({email.attachments.length})
                                                                    </span>
                                                                </div>
                                                                <div className="grid gap-2">
                                                                    {email.attachments.map((attachment, idx) => (
                                                                        <div key={idx} className="flex items-center gap-3 bg-white rounded-lg p-3 border border-blue-100">
                                                                            <div className="p-2 bg-blue-100 rounded-lg">
                                                                                <FileText className="w-4 h-4 text-blue-600" />
                                                                            </div>
                                                                            <div className="flex-1 min-w-0">
                                                                                <p className="font-medium text-gray-900 truncate text-sm">
                                                                                    {attachment.filename}
                                                                                </p>
                                                                                <p className="text-xs text-gray-500">
                                                                                    {attachment.mimeType} • {Math.round(attachment.size / 1024)}KB
                                                                                </p>
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </Card>
                                    );
                                })}

                                {/* Load More Button */}
                                {filteredEmails.length >= maxResults && (
                                    <div className="text-center pt-4">
                                        <Button
                                            variant="outline"
                                            onClick={() => setMaxResults(prev => prev + 20)}
                                            className="gap-2"
                                        >
                                            Load More Emails
                                        </Button>
                                    </div>
                                )}
                            </div>
                        )}
                    </>
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