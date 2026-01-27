import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Mail, LinkIcon, CheckCircle } from 'lucide-react';

export function GmailNotConnectedCard({ onConnect, isConnecting }) {
    return (
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
                        onClick={onConnect}
                        disabled={isConnecting}
                        size="lg"
                        className="bg-white text-purple-700 hover:bg-purple-50 gap-2"
                    >
                        <LinkIcon className="w-5 h-5" />
                        {isConnecting ? 'Connecting...' : 'Connect Gmail'}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}

export function GmailConnectedCard({ userEmail, unreadCount, isSyncing }) {
    return (
        <Card className="mb-6 border-0 shadow-sm bg-green-50">
            <CardContent className="py-3 px-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <span className="font-medium text-green-800">Gmail Connected</span>
                        <span className="text-green-600 text-sm">{userEmail}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-green-600">
                            {unreadCount > 0 && (
                                <Badge className="bg-red-500 mr-2">{unreadCount} unread</Badge>
                            )}
                            Auto-sync every 30s
                        </span>
                        <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
                            {isSyncing ? 'Syncing...' : 'Active'}
                        </Badge>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}