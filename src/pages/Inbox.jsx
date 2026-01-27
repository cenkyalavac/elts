import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Inbox, RefreshCw, PenSquare } from 'lucide-react';
import { toast } from 'sonner';

import { useInboxState } from '@/components/inbox/useInboxState';
import { GmailNotConnectedCard, GmailConnectedCard } from '@/components/inbox/GmailConnectionCard';
import InboxStatsCards from '@/components/inbox/InboxStatsCards';
import InboxToolbar from '@/components/inbox/InboxToolbar';
import EmailListItem from '@/components/inbox/EmailListItem';
import {
    InboxLoading,
    InboxLoginRequired,
    InboxAccessDenied,
    InboxError,
    InboxEmailsLoading,
    InboxEmpty,
    InboxNoResults,
} from '@/components/inbox/InboxEmptyStates';

import ProcessApplicationDialog from '@/components/inbox/ProcessApplicationDialog';
import QuickReplyDialog from '@/components/inbox/QuickReplyDialog';
import ComposeEmailDialog from '@/components/inbox/ComposeEmailDialog';
import SnoozeDialog from '@/components/inbox/SnoozeDialog';

export default function InboxPage() {
    const state = useInboxState();
    const {
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
        filteredEmails,
        stats,
        isConnected,
        connectMutation,
        analyzeEmailMutation,
        gmailActionMutation,
        refetch,
        isEmailUnread,
        isEmailStarred,
        getEmailCategory,
        formatEmailDate,
        extractSenderName,
        extractEmailAddress,
    } = state;

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
            
            switch(e.key) {
                case 'j':
                    if (filteredEmails.length > 0) {
                        const currentIdx = filteredEmails.findIndex(em => em.id === expandedEmail);
                        const nextIdx = currentIdx < filteredEmails.length - 1 ? currentIdx + 1 : 0;
                        setExpandedEmail(filteredEmails[nextIdx]?.id);
                    }
                    break;
                case 'k':
                    if (filteredEmails.length > 0) {
                        const currentIdx = filteredEmails.findIndex(em => em.id === expandedEmail);
                        const prevIdx = currentIdx > 0 ? currentIdx - 1 : filteredEmails.length - 1;
                        setExpandedEmail(filteredEmails[prevIdx]?.id);
                    }
                    break;
                case 's':
                    if (expandedEmail) {
                        handleToggleStar(expandedEmail);
                    }
                    break;
                case 'r':
                    if (expandedEmail) {
                        const email = filteredEmails.find(em => em.id === expandedEmail);
                        if (email) handleReply(email);
                    }
                    break;
                case 'e':
                    if (expandedEmail) {
                        handleArchive(expandedEmail);
                    }
                    break;
                case '#':
                    if (expandedEmail) {
                        handleTrash(expandedEmail);
                    }
                    break;
                case 'c':
                    setComposeOpen(true);
                    break;
                case 'f':
                    if (expandedEmail) {
                        const email = filteredEmails.find(em => em.id === expandedEmail);
                        if (email) handleForward(email);
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
    }, [expandedEmail, filteredEmails]);

    // Handlers
    const handleProcessEmail = (email) => {
        setSelectedEmail(email);
        setDialogOpen(true);
    };

    const handleReply = (email) => {
        setReplyEmail(email);
        setReplyDialogOpen(true);
    };

    const handleForward = (email) => {
        setForwardEmail(email);
        setComposeOpen(true);
    };

    const handleArchive = (emailId) => {
        gmailActionMutation.mutate({ action: 'archive', messageId: emailId });
    };

    const handleTrash = (emailId) => {
        gmailActionMutation.mutate({ action: 'trash', messageId: emailId });
    };

    const handleToggleStar = (emailId) => {
        const email = emailData.emails?.find(em => em.id === emailId);
        const currentlyStarred = isEmailStarred(email);
        
        setLocalStarOverrides(prev => ({
            ...prev,
            [emailId]: !currentlyStarred
        }));
        
        gmailActionMutation.mutate({ 
            action: currentlyStarred ? 'unstar' : 'star', 
            messageId: emailId 
        });
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
        const emailIds = Array.from(selectedEmails);
        emailIds.forEach(id => {
            setLocalStarOverrides(prev => ({ ...prev, [id]: true }));
            gmailActionMutation.mutate({ action: 'star', messageId: id });
        });
        toast.success(`Starred ${selectedEmails.size} emails`);
        setSelectedEmails(new Set());
    };

    const bulkMarkAsRead = () => {
        const emailIds = Array.from(selectedEmails);
        emailIds.forEach(id => {
            setLocalReadOverrides(prev => ({ ...prev, [id]: true }));
        });
        gmailActionMutation.mutate({ action: 'markRead', messageIds: emailIds });
        toast.success(`Marked ${selectedEmails.size} emails as read`);
        setSelectedEmails(new Set());
    };

    const bulkArchive = () => {
        gmailActionMutation.mutate({ action: 'archive', messageIds: Array.from(selectedEmails) });
        setSelectedEmails(new Set());
    };

    const bulkTrash = () => {
        gmailActionMutation.mutate({ action: 'trash', messageIds: Array.from(selectedEmails) });
        setSelectedEmails(new Set());
    };

    const bulkAnalyze = () => {
        const emailsToAnalyze = filteredEmails.filter(e => selectedEmails.has(e.id));
        emailsToAnalyze.forEach(email => {
            analyzeEmailMutation.mutate({ ...email, id: email.id });
        });
        setSelectedEmails(new Set());
    };

    // Loading/Auth states
    if (userLoading) return <InboxLoading />;
    if (!user) return <InboxLoginRequired />;
    if (user.role !== 'admin') return <InboxAccessDenied />;

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
                                onClick={() => setComposeOpen(true)}
                                className="gap-2 bg-purple-600 hover:bg-purple-700"
                            >
                                <PenSquare className="w-4 h-4" />
                                Compose
                            </Button>
                            <div className="flex items-center gap-2">
                                {emailsFetching && !emailsLoading && (
                                    <span className="text-xs text-gray-500 flex items-center gap-1">
                                        <RefreshCw className="w-3 h-3 animate-spin" />
                                        Syncing...
                                    </span>
                                )}
                                <Button
                                    variant="outline"
                                    onClick={() => refetch()}
                                    disabled={emailsLoading || emailsFetching}
                                    className="gap-2"
                                >
                                    <RefreshCw className={`w-4 h-4 ${emailsLoading || emailsFetching ? 'animate-spin' : ''}`} />
                                    Refresh
                                </Button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Gmail Connection Card */}
                {!isConnected ? (
                    <GmailNotConnectedCard 
                        onConnect={() => connectMutation.mutate()}
                        isConnecting={connectMutation.isPending}
                    />
                ) : (
                    <GmailConnectedCard 
                        userEmail={user.email}
                        unreadCount={stats.unread}
                        isSyncing={emailsFetching}
                    />
                )}

                {/* Email Content - Only show if connected */}
                {isConnected && (
                    <>
                        <InboxStatsCards 
                            stats={stats}
                            activeFilter={activeFilter}
                            onFilterChange={setActiveFilter}
                        />

                        <InboxToolbar
                            searchQuery={searchQuery}
                            onSearchChange={setSearchQuery}
                            dateFilter={dateFilter}
                            onDateFilterChange={setDateFilter}
                            sortBy={sortBy}
                            onSortChange={setSortBy}
                            activeFilter={activeFilter}
                            onClearFilters={() => { setActiveFilter('all'); setDateFilter('all'); }}
                            showKeyboardShortcuts={showKeyboardShortcuts}
                            onToggleKeyboardShortcuts={() => setShowKeyboardShortcuts(prev => !prev)}
                            selectedCount={selectedEmails.size}
                            totalCount={filteredEmails.length}
                            onSelectAll={toggleSelectAll}
                            onBulkStar={bulkStarEmails}
                            onBulkMarkRead={bulkMarkAsRead}
                            onBulkArchive={bulkArchive}
                            onBulkTrash={bulkTrash}
                            onBulkAnalyze={bulkAnalyze}
                            onCancelSelection={() => setSelectedEmails(new Set())}
                        />

                        {emailsError && <InboxError error={emailsError} onRetry={refetch} />}

                        {emailsLoading && <InboxEmailsLoading />}

                        {!emailsLoading && !emailsError && emailData.emails.length === 0 && (
                            <InboxEmpty onRefresh={refetch} />
                        )}

                        {!emailsLoading && !emailsError && emailData.emails.length > 0 && filteredEmails.length === 0 && (
                            <InboxNoResults onClear={() => { setSearchQuery(''); setActiveFilter('all'); }} />
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

                                {filteredEmails.map((email) => (
                                    <EmailListItem
                                        key={email.id}
                                        email={email}
                                        isExpanded={expandedEmail === email.id}
                                        isSelected={selectedEmails.has(email.id)}
                                        isStarred={isEmailStarred(email)}
                                        isUnread={isEmailUnread(email)}
                                        category={getEmailCategory(email)}
                                        hasAnalysis={!!emailAnalysis[email.id]}
                                        analysis={emailAnalysis[email.id]}
                                        formatEmailDate={formatEmailDate}
                                        extractSenderName={extractSenderName}
                                        extractEmailAddress={extractEmailAddress}
                                        onToggleExpand={() => {
                                            const isUnread = isEmailUnread(email);
                                            setExpandedEmail(expandedEmail === email.id ? null : email.id);
                                            if (isUnread) {
                                                setLocalReadOverrides(prev => ({ ...prev, [email.id]: true }));
                                                gmailActionMutation.mutate({ action: 'markRead', messageId: email.id });
                                            }
                                        }}
                                        onToggleSelect={() => toggleEmailSelection(email.id)}
                                        onToggleStar={() => handleToggleStar(email.id)}
                                        onReply={() => handleReply(email)}
                                        onForward={() => handleForward(email)}
                                        onAnalyze={() => analyzeEmailMutation.mutate({ ...email, id: email.id })}
                                        onProcessApplication={() => handleProcessEmail(email)}
                                        onArchive={() => handleArchive(email.id)}
                                        onSnooze={() => {
                                            setSnoozeEmail(email);
                                            setSnoozeDialogOpen(true);
                                        }}
                                        onGmailStar={() => handleToggleStar(email.id)}
                                        onCopyEmail={() => {
                                            navigator.clipboard.writeText(extractEmailAddress(email.from));
                                            toast.success('Email address copied');
                                        }}
                                        onToggleRead={() => {
                                            const isUnread = isEmailUnread(email);
                                            setLocalReadOverrides(prev => ({ ...prev, [email.id]: isUnread }));
                                            gmailActionMutation.mutate({ 
                                                action: isUnread ? 'markRead' : 'markUnread', 
                                                messageId: email.id 
                                            });
                                        }}
                                        onTrash={() => handleTrash(email.id)}
                                        isAnalyzing={analyzeEmailMutation.isPending}
                                    />
                                ))}

                                {emailData.emails.length >= maxResults && (
                                    <div className="text-center pt-4">
                                        <p className="text-sm text-gray-500 mb-2">
                                            Showing {emailData.emails.length} most recent emails
                                        </p>
                                        <Button
                                            variant="outline"
                                            onClick={() => setMaxResults(prev => prev + 30)}
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

                {/* Dialogs */}
                <ProcessApplicationDialog
                    email={selectedEmail}
                    open={dialogOpen}
                    onOpenChange={setDialogOpen}
                    onSuccess={() => refetch()}
                />

                <QuickReplyDialog
                    email={replyEmail}
                    open={replyDialogOpen}
                    onOpenChange={setReplyDialogOpen}
                    draftReply={replyEmail ? emailAnalysis[replyEmail.id]?.draft_reply : null}
                />

                <ComposeEmailDialog
                    open={composeOpen}
                    onOpenChange={(open) => {
                        setComposeOpen(open);
                        if (!open) setForwardEmail(null);
                    }}
                    initialTo={forwardEmail ? '' : ''}
                    initialSubject={forwardEmail ? `Fwd: ${forwardEmail.subject}` : ''}
                    initialBody={forwardEmail ? `\n\n---------- Forwarded message ----------\nFrom: ${forwardEmail.from}\nDate: ${forwardEmail.date}\nSubject: ${forwardEmail.subject}\n\n${forwardEmail.body || forwardEmail.snippet}` : ''}
                    mode={forwardEmail ? 'forward' : 'compose'}
                />

                <SnoozeDialog
                    email={snoozeEmail}
                    open={snoozeDialogOpen}
                    onOpenChange={setSnoozeDialogOpen}
                    onSnooze={(email, snoozeUntil) => {
                        // Handle snooze
                    }}
                />
            </div>
        </div>
    );
}