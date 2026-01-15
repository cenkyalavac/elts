import React, { useState } from 'react';
import { useMutation } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import { 
    Search, Mail, Send, CheckCircle2, Info, ExternalLink, Loader2
} from "lucide-react";
import { toast } from "sonner";

export default function SmartcatMarketplaceSearch() {
    const [showInviteDialog, setShowInviteDialog] = useState(false);
    const [inviteData, setInviteData] = useState({ email: '', name: '', message: '' });
    const [inviteSent, setInviteSent] = useState(false);

    const inviteMutation = useMutation({
        mutationFn: async (data) => {
            const response = await base44.functions.invoke('smartcatApi', {
                action: 'invite_user',
                params: data
            });
            return response.data;
        },
        onSuccess: (data) => {
            setInviteSent(true);
            toast.success('Invitation sent to ' + inviteData.email);
        },
        onError: (error) => {
            toast.error('Failed to send invitation: ' + error.message);
        }
    });

    const handleSendInvite = () => {
        if (!inviteData.email || !inviteData.name) {
            toast.error('Please enter both email and name');
            return;
        }
        inviteMutation.mutate(inviteData);
    };

    const handleCloseDialog = () => {
        setShowInviteDialog(false);
        setInviteSent(false);
        setInviteData({ email: '', name: '', message: '' });
    };

    return (
        <div className="space-y-6">
            <Card className="bg-amber-50 border-amber-200">
                <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                        <Info className="w-5 h-5 text-amber-600 mt-0.5" />
                        <div className="flex-1">
                            <p className="font-medium text-amber-800 mb-2">About Smartcat Marketplace</p>
                            <p className="text-sm text-amber-700 mb-3">
                                Smartcat's Marketplace API is not publicly available. The marketplace is only accessible 
                                through the Smartcat web interface.
                            </p>
                            <p className="text-sm text-amber-700">
                                You can still invite freelancers manually through email and add them to your database.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Mail className="w-5 h-5" />
                        Invite Freelancer
                    </CardTitle>
                    <CardDescription>
                        Send an invitation email and add the freelancer to your database
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Button 
                        onClick={() => setShowInviteDialog(true)}
                        className="w-full md:w-auto bg-purple-600 hover:bg-purple-700"
                    >
                        <Send className="w-4 h-4 mr-2" />
                        Send Invitation
                    </Button>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 border-blue-200" 
                    onClick={() => window.open('https://smartcat.com/marketplace', '_blank')}>
                    <CardContent className="pt-6">
                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-blue-100 rounded-xl">
                                <Search className="w-6 h-6 text-blue-600" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-semibold text-lg mb-1">Browse Smartcat Marketplace</h3>
                                <p className="text-sm text-gray-600 mb-3">
                                    Search for translators, reviewers, and language experts on Smartcat's marketplace
                                </p>
                                <div className="flex items-center gap-2 text-blue-600 text-sm font-medium">
                                    Open Marketplace
                                    <ExternalLink className="w-4 h-4" />
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 border-green-200" 
                    onClick={() => setShowInviteDialog(true)}>
                    <CardContent className="pt-6">
                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-green-100 rounded-xl">
                                <Send className="w-6 h-6 text-green-600" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-semibold text-lg mb-1">Invite Directly</h3>
                                <p className="text-sm text-gray-600 mb-3">
                                    Send an email invitation to a freelancer and add them to your database
                                </p>
                                <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
                                    Send Invitation
                                    <Send className="w-4 h-4" />
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="bg-blue-50 border-blue-200">
                <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                        <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                        <div>
                            <p className="font-medium text-blue-800 mb-1">Recommended Workflow</p>
                            <ol className="text-sm text-blue-600 space-y-1 list-decimal list-inside">
                                <li>Search for freelancers on <a href="https://smartcat.com/marketplace" target="_blank" className="underline">Smartcat Marketplace</a></li>
                                <li>When you find someone suitable, copy their email address</li>
                                <li>Use the "Send Invitation" button above to invite them</li>
                                <li>Add them to your Smartcat team via the Smartcat dashboard</li>
                                <li>They'll appear in your database and be ready for projects</li>
                            </ol>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Dialog open={showInviteDialog} onOpenChange={handleCloseDialog}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>
                            {inviteSent ? 'Invitation Sent!' : 'Invite Freelancer'}
                        </DialogTitle>
                    </DialogHeader>

                    {inviteSent ? (
                        <div className="text-center py-6">
                            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
                            <p className="text-gray-700 mb-2">
                                Invitation email sent to <strong>{inviteData.email}</strong>
                            </p>
                            <p className="text-sm text-gray-500 mb-4">
                                The freelancer has been added to your database. 
                                Remember to also invite them through your Smartcat dashboard for full team access.
                            </p>
                            <Button onClick={handleCloseDialog} className="w-full">
                                Close
                            </Button>
                        </div>
                    ) : (
                        <>
                            <div className="space-y-4">
                                <div>
                                    <Label>Freelancer Email *</Label>
                                    <Input
                                        type="email"
                                        placeholder="translator@example.com"
                                        value={inviteData.email}
                                        onChange={(e) => setInviteData(prev => ({ ...prev, email: e.target.value }))}
                                        className="mt-1"
                                    />
                                </div>
                                <div>
                                    <Label>Full Name *</Label>
                                    <Input
                                        placeholder="John Doe"
                                        value={inviteData.name}
                                        onChange={(e) => setInviteData(prev => ({ ...prev, name: e.target.value }))}
                                        className="mt-1"
                                    />
                                </div>
                                <div>
                                    <Label>Personal Message (Optional)</Label>
                                    <Textarea
                                        placeholder="Add a personal note to the invitation..."
                                        value={inviteData.message}
                                        onChange={(e) => setInviteData(prev => ({ ...prev, message: e.target.value }))}
                                        rows={3}
                                        className="mt-1"
                                    />
                                </div>
                            </div>

                            <DialogFooter>
                                <Button variant="outline" onClick={handleCloseDialog}>
                                    Cancel
                                </Button>
                                <Button 
                                    onClick={handleSendInvite}
                                    disabled={inviteMutation.isPending || !inviteData.email || !inviteData.name}
                                    className="bg-purple-600 hover:bg-purple-700"
                                >
                                    {inviteMutation.isPending ? (
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    ) : (
                                        <Send className="w-4 h-4 mr-2" />
                                    )}
                                    Send Invitation
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}