import { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format, parseISO, formatDistanceToNow, isAfter, subDays } from 'date-fns';
import { toast } from 'sonner';

export function useInboxState() {
    const [expandedEmail, setExpandedEmail] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [maxResults, setMaxResults] = useState(50);
    const [selectedEmail, setSelectedEmail] = useState(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [emailAnalysis, setEmailAnalysis] = useState({});
    const [activeFilter, setActiveFilter] = useState('all');
    const [selectedEmails, setSelectedEmails] = useState(new Set());
    const [sortBy, setSortBy] = useState('date_desc');
    const [dateFilter, setDateFilter] = useState('all');
    const [localReadOverrides, setLocalReadOverrides] = useState({});
    const [localStarOverrides, setLocalStarOverrides] = useState({});
    const [replyDialogOpen, setReplyDialogOpen] = useState(false);
    const [replyEmail, setReplyEmail] = useState(null);
    const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);
    const [composeOpen, setComposeOpen] = useState(false);
    const [forwardEmail, setForwardEmail] = useState(null);
    const [snoozeDialogOpen, setSnoozeDialogOpen] = useState(false);
    const [snoozeEmail, setSnoozeEmail] = useState(null);
    const [snoozedEmails, setSnoozedEmails] = useState({});

    const queryClient = useQueryClient();

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

    // Fetch emails
    const { 
        data: emailData = { emails: [] }, 
        isLoading: emailsLoading, 
        isFetching: emailsFetching,
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
        refetchInterval: 30000,
        refetchIntervalInBackground: false,
        staleTime: 15000,
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

    // Gmail actions mutation
    const gmailActionMutation = useMutation({
        mutationFn: async ({ action, messageId, messageIds }) => {
            const response = await base44.functions.invoke('gmailActions', {
                action,
                messageId,
                messageIds
            });
            return response.data;
        },
        onSuccess: (data, variables) => {
            const { action } = variables;
            const messages = {
                archive: 'Email archived',
                trash: 'Email moved to trash',
                markRead: 'Marked as read',
                markUnread: 'Marked as unread',
                star: 'Email starred',
                unstar: 'Star removed'
            };
            toast.success(messages[action] || 'Action completed');
            refetch();
        },
        onError: (error) => {
            toast.error('Action failed: ' + (error.message || 'Unknown error'));
        }
    });

    // Helper functions
    const isEmailUnread = useCallback((email) => {
        if (!email) return false;
        if (localReadOverrides[email.id] !== undefined) {
            return !localReadOverrides[email.id];
        }
        if (email.isUnread !== undefined) return email.isUnread;
        if (email.labels && Array.isArray(email.labels)) {
            return email.labels.includes('UNREAD');
        }
        return false;
    }, [localReadOverrides]);

    const isEmailStarred = useCallback((email) => {
        if (!email) return false;
        if (localStarOverrides[email.id] !== undefined) {
            return localStarOverrides[email.id];
        }
        if (email.isStarred !== undefined) return email.isStarred;
        if (email.labels && Array.isArray(email.labels)) {
            return email.labels.includes('STARRED');
        }
        return false;
    }, [localStarOverrides]);

    const getEmailCategory = useCallback((email) => {
        const analysis = emailAnalysis[email.id];
        if (analysis) return analysis.category;
        
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
    }, [emailAnalysis]);

    const formatEmailDate = useCallback((dateStr) => {
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
    }, []);

    const extractSenderName = useCallback((fromString) => {
        if (!fromString) return 'Unknown';
        const match = fromString.match(/^([^<]+)/);
        return match ? match[1].trim().replace(/"/g, '') : fromString;
    }, []);

    const extractEmailAddress = useCallback((fromString) => {
        const match = fromString?.match(/<(.+?)>/);
        return match ? match[1] : fromString;
    }, []);

    // Filtered and sorted emails
    const filteredEmails = useMemo(() => {
        return (emailData?.emails || []).filter(email => {
            if (!email) return false;
            const searchTerm = searchQuery.toLowerCase();
            const matchesSearch = (
                (email.subject || '').toLowerCase().includes(searchTerm) ||
                (email.from || '').toLowerCase().includes(searchTerm) ||
                (email.snippet || '').toLowerCase().includes(searchTerm)
            );
            
            if (!matchesSearch) return false;
            
            if (activeFilter === 'starred') return isEmailStarred(email);
            if (activeFilter === 'attachments') return email.attachments?.length > 0;
            if (activeFilter === 'unread') return isEmailUnread(email);
            if (activeFilter === 'applications') {
                const category = getEmailCategory(email);
                return category === 'Application' || category === 'New Application Inquiry';
            }
            
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
    }, [emailData?.emails, searchQuery, activeFilter, dateFilter, sortBy, isEmailStarred, isEmailUnread, getEmailCategory]);

    // Stats
    const stats = useMemo(() => ({
        total: emailData?.emails?.length || 0,
        starred: (emailData?.emails || []).filter(e => isEmailStarred(e)).length,
        withAttachments: (emailData?.emails || []).filter(e => e?.attachments?.length > 0).length,
        unread: (emailData?.emails || []).filter(e => isEmailUnread(e)).length,
        applications: (emailData?.emails || []).filter(e => {
            const cat = getEmailCategory(e);
            return cat === 'Application' || cat === 'New Application Inquiry';
        }).length
    }), [emailData?.emails, isEmailStarred, isEmailUnread, getEmailCategory]);

    const isConnected = !!user?.gmailRefreshToken;

    return {
        // State
        user,
        userLoading,
        emailData,
        emailsLoading,
        emailsFetching,
        emailsError,
        expandedEmail,
        setExpandedEmail,
        searchQuery,
        setSearchQuery,
        maxResults,
        setMaxResults,
        selectedEmail,
        setSelectedEmail,
        dialogOpen,
        setDialogOpen,
        emailAnalysis,
        activeFilter,
        setActiveFilter,
        selectedEmails,
        setSelectedEmails,
        sortBy,
        setSortBy,
        dateFilter,
        setDateFilter,
        localReadOverrides,
        setLocalReadOverrides,
        localStarOverrides,
        setLocalStarOverrides,
        replyDialogOpen,
        setReplyDialogOpen,
        replyEmail,
        setReplyEmail,
        showKeyboardShortcuts,
        setShowKeyboardShortcuts,
        composeOpen,
        setComposeOpen,
        forwardEmail,
        setForwardEmail,
        snoozeDialogOpen,
        setSnoozeDialogOpen,
        snoozeEmail,
        setSnoozeEmail,
        snoozedEmails,
        setSnoozedEmails,
        
        // Computed
        filteredEmails,
        stats,
        isConnected,
        
        // Mutations
        connectMutation,
        analyzeEmailMutation,
        gmailActionMutation,
        refetch,
        
        // Helpers
        isEmailUnread,
        isEmailStarred,
        getEmailCategory,
        formatEmailDate,
        extractSenderName,
        extractEmailAddress,
    };
}