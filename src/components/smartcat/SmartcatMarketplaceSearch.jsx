import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { 
    Search, UserPlus, Send, Loader2, Globe, Star, Mail,
    CheckCircle2, AlertCircle, Info, ExternalLink, Users
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../../utils";

const LANGUAGES = [
    "English", "Turkish", "German", "French", "Spanish", "Italian", 
    "Portuguese", "Russian", "Chinese", "Japanese", "Korean", "Arabic",
    "Dutch", "Polish", "Swedish", "Norwegian", "Danish", "Finnish"
];

const SPECIALIZATIONS = [
    "General", "Legal", "Medical", "Technical", "Marketing", 
    "Financial", "IT/Software", "Gaming", "E-commerce", "Automotive",
    "Life Sciences", "Engineering", "Energy"
];

export default function SmartcatMarketplaceSearch() {
    const queryClient = useQueryClient();
    const [manualEmail, setManualEmail] = useState('');
    const [manualName, setManualName] = useState('');
    const [inviteMessage, setInviteMessage] = useState('');
    const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
    const [selectedPerson, setSelectedPerson] = useState(null);

    // Get existing freelancers
    const { data: freelancers = [] } = useQuery({
        queryKey: ['freelancers'],
        queryFn: () => base44.entities.Freelancer.list(),
    });

    // Invite mutation
    const inviteMutation = useMutation({
        mutationFn: async ({ email, name, message }) => {
            const response = await base44.functions.invoke('smartcatApi', {
                action: 'invite_user',
                params: { email, name, message }
            });
            return response.data;
        },
        onSuccess: () => {
            setInviteDialogOpen(false);
            setSelectedPerson(null);
            setInviteMessage('');
            setManualEmail('');
            setManualName('');
            queryClient.invalidateQueries({ queryKey: ['freelancers'] });
        }
    });

    const handleManualInvite = () => {
        if (!manualEmail) return;
        setSelectedPerson({ email: manualEmail, name: manualName || manualEmail.split('@')[0] });
        setInviteDialogOpen(true);
    };

    const confirmInvite = () => {
        if (selectedPerson) {
            inviteMutation.mutate({
                email: selectedPerson.email,
                name: selectedPerson.name,
                message: inviteMessage
            });
        }
    };

    // Check if email already exists
    const emailExists = freelancers.some(f => 
        f.email?.toLowerCase() === manualEmail.toLowerCase()
    );

    return (
        <div className="space-y-6">
            {/* Info Banner */}
            <Card className="bg-amber-50 border-amber-200">
                <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                        <Info className="w-5 h-5 text-amber-600 mt-0.5" />
                        <div>
                            <p className="font-medium text-amber-800">About Smartcat Marketplace</p>
                            <p className="text-sm text-amber-700">
                                Smartcat's marketplace API is not publicly available. To find freelancers, 
                                use the <a href="https://www.smartcat.com/marketplace/" target="_blank" rel="noopener noreferrer" className="underline">Smartcat Marketplace website</a> directly,
                                then invite them using their email address below.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Manual Invite */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <UserPlus className="w-5 h-5" />
                        Invite Freelancer
                    </CardTitle>
                    <CardDescription>
                        Add a new freelancer to your team by entering their email address
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div className="space-y-2">
                            <Label>Email Address *</Label>
                            <Input
                                type="email"
                                placeholder="translator@example.com"
                                value={manualEmail}
                                onChange={(e) => setManualEmail(e.target.value)}
                            />
                            {emailExists && (
                                <p className="text-xs text-yellow-600">This email already exists in your database</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label>Full Name</Label>
                            <Input
                                placeholder="John Doe"
                                value={manualName}
                                onChange={(e) => setManualName(e.target.value)}
                            />
                        </div>
                        <div className="flex items-end">
                            <Button 
                                onClick={handleManualInvite} 
                                disabled={!manualEmail || emailExists}
                                className="w-full"
                            >
                                <Mail className="w-4 h-4 mr-2" />
                                Send Invitation
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <ExternalLink className="w-5 h-5" />
                            Find on Smartcat
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-gray-600 mb-4">
                            Search for translators on Smartcat's marketplace, then come back here to invite them.
                        </p>
                        <Button variant="outline" asChild>
                            <a href="https://www.smartcat.com/marketplace/" target="_blank" rel="noopener noreferrer">
                                <Globe className="w-4 h-4 mr-2" />
                                Open Smartcat Marketplace
                            </a>
                        </Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Users className="w-5 h-5" />
                            Recent Additions
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {freelancers
                                .filter(f => f.tags?.includes('Invited') || f.tags?.includes('Smartcat Invite'))
                                .slice(0, 5)
                                .map(f => (
                                    <div key={f.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                        <Link 
                                            to={createPageUrl(`FreelancerDetail?id=${f.id}`)}
                                            className="text-sm font-medium hover:text-blue-600"
                                        >
                                            {f.full_name}
                                        </Link>
                                        <Badge variant="outline" className="text-xs">
                                            {f.status}
                                        </Badge>
                                    </div>
                                ))
                            }
                            {freelancers.filter(f => f.tags?.includes('Invited')).length === 0 && (
                                <p className="text-sm text-gray-500 text-center py-4">
                                    No recent invitations
                                </p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Workflow Tips */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Recommended Workflow</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="text-center p-4 bg-blue-50 rounded-lg">
                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-3">
                                <span className="text-blue-600 font-bold">1</span>
                            </div>
                            <p className="font-medium text-blue-800">Search Marketplace</p>
                            <p className="text-sm text-blue-600">Find translators on Smartcat marketplace by language pair and specialization</p>
                        </div>
                        <div className="text-center p-4 bg-green-50 rounded-lg">
                            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                                <span className="text-green-600 font-bold">2</span>
                            </div>
                            <p className="font-medium text-green-800">Invite Here</p>
                            <p className="text-sm text-green-600">Enter their email above to add them to your database and send an invitation</p>
                        </div>
                        <div className="text-center p-4 bg-purple-50 rounded-lg">
                            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-3">
                                <span className="text-purple-600 font-bold">3</span>
                            </div>
                            <p className="font-medium text-purple-800">Add to Smartcat Team</p>
                            <p className="text-sm text-purple-600">Invite them to your Smartcat team from the Smartcat dashboard for lower rates</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Invite Dialog */}
            <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Send Invitation</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="p-4 bg-gray-50 rounded-lg">
                            <p className="font-medium">{selectedPerson?.name}</p>
                            <p className="text-sm text-gray-600">{selectedPerson?.email}</p>
                        </div>
                        <div className="space-y-2">
                            <Label>Personal Message (Optional)</Label>
                            <Textarea
                                value={inviteMessage}
                                onChange={(e) => setInviteMessage(e.target.value)}
                                placeholder="Add a personalized message to your invitation..."
                                rows={4}
                            />
                        </div>
                        <div className="p-4 bg-blue-50 rounded-lg">
                            <p className="text-sm text-blue-800">
                                <strong>What happens:</strong>
                            </p>
                            <ul className="text-sm text-blue-700 mt-2 space-y-1">
                                <li>• A freelancer record will be created in your database</li>
                                <li>• An invitation email will be sent to this address</li>
                                <li>• You should also invite them via Smartcat dashboard</li>
                            </ul>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setInviteDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={confirmInvite} disabled={inviteMutation.isPending}>
                            {inviteMutation.isPending ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                                <Send className="w-4 h-4 mr-2" />
                            )}
                            Send Invitation
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Success Message */}
            {inviteMutation.isSuccess && (
                <Card className="bg-green-50 border-green-200">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <CheckCircle2 className="w-6 h-6 text-green-600" />
                            <div>
                                <p className="font-medium text-green-800">Invitation Sent!</p>
                                <p className="text-sm text-green-600">
                                    The freelancer has been added to your database and an invitation email was sent.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}