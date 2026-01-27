import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle, Inbox, Search } from 'lucide-react';

export function InboxLoading() {
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

export function InboxLoginRequired() {
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

export function InboxAccessDenied() {
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

export function InboxError({ error, onRetry }) {
    return (
        <Card className="p-8 text-center border-red-200 bg-red-50 mb-6">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-red-900">Failed to Load Emails</h2>
            <p className="text-red-700 mt-2">{error?.message || 'Could not fetch emails from Gmail'}</p>
            <Button onClick={onRetry} className="mt-4">Try Again</Button>
        </Card>
    );
}

export function InboxEmailsLoading() {
    return (
        <Card className="p-12 text-center border-0 shadow-lg">
            <Loader2 className="w-10 h-10 animate-spin mx-auto mb-3 text-purple-600" />
            <p className="text-gray-600 font-medium">Loading emails...</p>
        </Card>
    );
}

export function InboxEmpty({ onRefresh }) {
    return (
        <Card className="p-12 text-center border-0 shadow-lg">
            <div className="p-4 bg-gray-100 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <Inbox className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900">No emails found</h3>
            <p className="text-gray-500 mt-2">Your inbox is empty</p>
            <Button onClick={onRefresh} variant="outline" className="mt-4">
                Refresh Inbox
            </Button>
        </Card>
    );
}

export function InboxNoResults({ onClear }) {
    return (
        <Card className="p-12 text-center border-0 shadow-lg">
            <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900">No matches found</h3>
            <p className="text-gray-500 mt-2">Try adjusting your search or filter</p>
            <Button variant="outline" onClick={onClear} className="mt-4">
                Clear Search
            </Button>
        </Card>
    );
}