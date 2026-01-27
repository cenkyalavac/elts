import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
    ChevronDown, ChevronUp, Star, Paperclip, Tag, Sparkles, Zap,
    Reply, Forward, UserPlus, MoreHorizontal, Archive, Bell,
    Copy, Eye, EyeOff, Trash2, MailOpen, FileText, Download
} from 'lucide-react';
import { toast } from 'sonner';
import EmailAnalysis from './EmailAnalysis';

export default function EmailListItem({
    email,
    isExpanded,
    isSelected,
    isStarred,
    isUnread,
    category,
    hasAnalysis,
    analysis,
    formatEmailDate,
    extractSenderName,
    extractEmailAddress,
    onToggleExpand,
    onToggleSelect,
    onToggleStar,
    onReply,
    onForward,
    onAnalyze,
    onProcessApplication,
    onArchive,
    onSnooze,
    onGmailStar,
    onCopyEmail,
    onToggleRead,
    onTrash,
    isAnalyzing,
}) {
    return (
        <Card
            className={`border-0 shadow-sm hover:shadow-md transition-all cursor-pointer ${
                isExpanded ? 'ring-2 ring-purple-200' : ''
            } ${isSelected ? 'bg-purple-50' : ''} ${isUnread ? 'border-l-4 border-l-purple-500 bg-purple-50/30' : ''}`}
            onClick={onToggleExpand}
        >
            <div className="p-4">
                {/* Email Header */}
                <div className="flex items-start gap-3">
                    {/* Checkbox */}
                    <Checkbox
                        checked={isSelected}
                        onCheckedChange={onToggleSelect}
                        onClick={(e) => e.stopPropagation()}
                        className="mt-1"
                    />
                    
                    {/* Star Button */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onToggleStar();
                        }}
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
                            {analysis?.urgency === 'high' && (
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

                {/* AI Analysis Display (Compact) */}
                {hasAnalysis && !isExpanded && (
                    <div className="mt-3 ml-14 pl-3 border-l-2 border-purple-200">
                        <EmailAnalysis 
                            analysis={analysis}
                            emailId={email.id}
                            emailData={email}
                            onCorrectionSaved={() => {}}
                            compact={true}
                        />
                    </div>
                )}

                {/* Expanded Content */}
                {isExpanded && (
                    <EmailExpandedContent
                        email={email}
                        hasAnalysis={hasAnalysis}
                        analysis={analysis}
                        isStarred={isStarred}
                        isUnread={isUnread}
                        onReply={onReply}
                        onForward={onForward}
                        onAnalyze={onAnalyze}
                        onProcessApplication={onProcessApplication}
                        onArchive={onArchive}
                        onSnooze={onSnooze}
                        onGmailStar={onGmailStar}
                        onCopyEmail={onCopyEmail}
                        onToggleRead={onToggleRead}
                        onTrash={onTrash}
                        isAnalyzing={isAnalyzing}
                    />
                )}
            </div>
        </Card>
    );
}

function EmailExpandedContent({
    email,
    hasAnalysis,
    analysis,
    isStarred,
    isUnread,
    onReply,
    onForward,
    onAnalyze,
    onProcessApplication,
    onArchive,
    onSnooze,
    onGmailStar,
    onCopyEmail,
    onToggleRead,
    onTrash,
    isAnalyzing,
}) {
    return (
        <div className="mt-4 ml-14 space-y-4">
            {/* Quick Action Buttons */}
            <div className="flex flex-wrap gap-2">
                <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                        e.stopPropagation();
                        onReply();
                    }}
                    className="gap-2"
                >
                    <Reply className="w-4 h-4" />
                    Reply
                </Button>
                <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                        e.stopPropagation();
                        onForward();
                    }}
                    className="gap-2"
                >
                    <Forward className="w-4 h-4" />
                    Forward
                </Button>
                {!hasAnalysis && (
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                            e.stopPropagation();
                            onAnalyze();
                        }}
                        disabled={isAnalyzing}
                        className="gap-2"
                    >
                        <Sparkles className={`w-4 h-4 ${isAnalyzing ? 'animate-pulse' : ''}`} />
                        {isAnalyzing ? 'Analyzing...' : 'AI Analyze'}
                    </Button>
                )}
                <Button
                    size="sm"
                    onClick={(e) => {
                        e.stopPropagation();
                        onProcessApplication();
                    }}
                    className="gap-2 bg-green-600 hover:bg-green-700"
                >
                    <UserPlus className="w-4 h-4" />
                    Process as Application
                </Button>
                
                <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button size="sm" variant="outline">
                            <MoreHorizontal className="w-4 h-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            onArchive();
                        }}>
                            <Archive className="w-4 h-4 mr-2" />
                            Archive
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            onSnooze();
                        }}>
                            <Bell className="w-4 h-4 mr-2" />
                            Snooze
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            onGmailStar();
                        }}>
                            <Star className="w-4 h-4 mr-2" />
                            {isStarred ? 'Remove star' : 'Star in Gmail'}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            onCopyEmail();
                        }}>
                            <Copy className="w-4 h-4 mr-2" />
                            Copy sender email
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            onToggleRead();
                        }}>
                            {!isUnread ? (
                                <>
                                    <EyeOff className="w-4 h-4 mr-2" />
                                    Mark as unread
                                </>
                            ) : (
                                <>
                                    <Eye className="w-4 h-4 mr-2" />
                                    Mark as read
                                </>
                            )}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                            onClick={(e) => {
                                e.stopPropagation();
                                onTrash();
                            }}
                            className="text-red-600 focus:text-red-600"
                        >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Move to trash
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* AI Analysis */}
            {hasAnalysis && (
                <EmailAnalysis 
                    analysis={analysis}
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
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        toast.info('Attachment download coming soon');
                                    }}
                                    className="gap-1"
                                >
                                    <Download className="w-4 h-4" />
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}