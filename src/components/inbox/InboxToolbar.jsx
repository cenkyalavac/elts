import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { 
    Search, Calendar, ArrowDown, Keyboard, Filter,
    Star, Eye, Archive, Trash2, Sparkles
} from 'lucide-react';

export default function InboxToolbar({
    searchQuery,
    onSearchChange,
    dateFilter,
    onDateFilterChange,
    sortBy,
    onSortChange,
    activeFilter,
    onClearFilters,
    showKeyboardShortcuts,
    onToggleKeyboardShortcuts,
    selectedCount,
    totalCount,
    onSelectAll,
    onBulkStar,
    onBulkMarkRead,
    onBulkArchive,
    onBulkTrash,
    onBulkAnalyze,
    onCancelSelection,
}) {
    return (
        <Card className="mb-6 border-0 shadow-sm">
            <CardContent className="p-4">
                <div className="flex flex-col gap-4">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <Input
                                placeholder="Search by subject, sender, or content..."
                                value={searchQuery}
                                onChange={(e) => onSearchChange(e.target.value)}
                                className="pl-10 h-11 border-gray-200"
                            />
                        </div>
                        <Select value={dateFilter} onValueChange={onDateFilterChange}>
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
                        <Select value={sortBy} onValueChange={onSortChange}>
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
                            onClick={onToggleKeyboardShortcuts}
                            className="hidden md:flex"
                            title="Keyboard shortcuts (?)"
                        >
                            <Keyboard className="w-4 h-4" />
                        </Button>
                        {(activeFilter !== 'all' || dateFilter !== 'all') && (
                            <Button 
                                variant="outline" 
                                onClick={onClearFilters}
                                className="gap-2"
                            >
                                <Filter className="w-4 h-4" />
                                Clear Filters
                            </Button>
                        )}
                    </div>
                    
                    {/* Bulk Actions Bar */}
                    {selectedCount > 0 && (
                        <div className="flex items-center gap-3 bg-purple-50 rounded-lg p-3">
                            <Checkbox 
                                checked={selectedCount === totalCount}
                                onCheckedChange={onSelectAll}
                            />
                            <span className="text-sm font-medium text-purple-900">
                                {selectedCount} selected
                            </span>
                            <div className="flex gap-2 ml-auto flex-wrap">
                                <Button size="sm" variant="outline" onClick={onBulkStar} className="gap-2">
                                    <Star className="w-4 h-4" />
                                    Star
                                </Button>
                                <Button size="sm" variant="outline" onClick={onBulkMarkRead} className="gap-2">
                                    <Eye className="w-4 h-4" />
                                    Mark Read
                                </Button>
                                <Button size="sm" variant="outline" onClick={onBulkArchive} className="gap-2">
                                    <Archive className="w-4 h-4" />
                                    Archive
                                </Button>
                                <Button size="sm" variant="outline" onClick={onBulkTrash} className="gap-2 text-red-600 hover:text-red-700">
                                    <Trash2 className="w-4 h-4" />
                                    Delete
                                </Button>
                                <Button size="sm" variant="outline" onClick={onBulkAnalyze} className="gap-2">
                                    <Sparkles className="w-4 h-4" />
                                    AI Analyze
                                </Button>
                                <Button size="sm" variant="ghost" onClick={onCancelSelection}>
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Keyboard Shortcuts */}
                    {showKeyboardShortcuts && (
                        <KeyboardShortcutsPanel />
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

function KeyboardShortcutsPanel() {
    const shortcuts = [
        { key: 'j', label: 'Next email' },
        { key: 'k', label: 'Previous email' },
        { key: 's', label: 'Star email' },
        { key: 'r', label: 'Reply' },
        { key: 'e', label: 'Archive' },
        { key: '#', label: 'Delete' },
        { key: 'c', label: 'Compose' },
        { key: 'Esc', label: 'Close email' },
        { key: '?', label: 'Toggle shortcuts' },
    ];

    return (
        <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <Keyboard className="w-4 h-4" />
                Keyboard Shortcuts
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
                {shortcuts.map((shortcut) => (
                    <div key={shortcut.key} className="flex items-center gap-2">
                        <kbd className="px-2 py-1 bg-white rounded border text-xs">{shortcut.key}</kbd>
                        <span className="text-gray-600">{shortcut.label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}