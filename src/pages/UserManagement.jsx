import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import GmailConnect from "../components/gmail/GmailConnect";
import { Users, Shield, Eye, Plus } from "lucide-react";
import { toast } from "sonner";

export default function UserManagementPage() {
    const queryClient = useQueryClient();
    const [showInviteDialog, setShowInviteDialog] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState('project_manager');

    const { data: currentUser } = useQuery({
        queryKey: ['currentUser'],
        queryFn: () => base44.auth.me(),
    });

    const { data: users = [] } = useQuery({
        queryKey: ['users'],
        queryFn: () => base44.entities.User.list(),
    });

    const updateUserMutation = useMutation({
        mutationFn: ({ id, role }) => base44.entities.User.update(id, { role }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            toast.success('User role updated successfully');
        },
    });

    const inviteUserMutation = useMutation({
        mutationFn: async ({ email, role }) => {
            const response = await base44.functions.invoke('inviteUser', { email, role });
            return response.data;
        },
        onSuccess: () => {
            toast.success(`Invitation sent to ${inviteEmail}`);
            setInviteEmail('');
            setInviteRole('project_manager');
            setShowInviteDialog(false);
        },
        onError: (error) => {
            toast.error('Failed to send invitation: ' + (error.response?.data?.error || error.message));
        }
    });

    const isAdmin = currentUser?.role === 'admin';

    if (!isAdmin) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
                <div className="max-w-4xl mx-auto text-center mt-20">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
                    <p className="text-gray-600">Only administrators can manage user roles.</p>
                </div>
            </div>
        );
    }

    const roleColors = {
        'admin': 'bg-red-100 text-red-800',
        'project_manager': 'bg-blue-100 text-blue-800',
        'applicant': 'bg-gray-100 text-gray-800'
    };

    const roleIcons = {
        'admin': Shield,
        'project_manager': Eye,
        'applicant': Users
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
            <div className="max-w-6xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                        <Users className="w-8 h-8 text-blue-600" />
                        User Management
                    </h1>
                    <p className="text-gray-600 mt-1">Manage user roles and permissions</p>
                </div>

                {/* Gmail Integration */}
                <div className="mb-6">
                    <GmailConnect />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <Card>
                        <CardContent className="pt-6">
                            <div className="text-2xl font-bold text-red-600">
                                {users.filter(u => u.role === 'admin').length}
                            </div>
                            <div className="text-sm text-gray-600">Administrators</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="text-2xl font-bold text-blue-600">
                                {users.filter(u => u.role === 'project_manager').length}
                            </div>
                            <div className="text-sm text-gray-600">Project Managers</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="text-2xl font-bold text-gray-600">
                                {users.filter(u => u.role === 'applicant').length}
                            </div>
                            <div className="text-sm text-gray-600">Applicants</div>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <CardTitle>All Users</CardTitle>
                            <Button onClick={() => setShowInviteDialog(true)} className="gap-2 bg-blue-600 hover:bg-blue-700">
                                <Plus className="w-4 h-4" />
                                Invite User
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {users.map(user => {
                                const RoleIcon = roleIcons[user.role] || Users;
                                return (
                                    <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                                        <div className="flex items-center gap-4">
                                            <RoleIcon className="w-5 h-5 text-gray-400" />
                                            <div>
                                                <div className="font-medium">{user.full_name || user.email}</div>
                                                <div className="text-sm text-gray-500">{user.email}</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Badge className={roleColors[user.role]}>
                                                {user.role === 'project_manager' ? 'Project Manager' : 
                                                 user.role === 'admin' ? 'Admin' : 'Applicant'}
                                            </Badge>
                                            {currentUser.id !== user.id && (
                                                <Select
                                                    value={user.role}
                                                    onValueChange={(role) => updateUserMutation.mutate({ id: user.id, role })}
                                                >
                                                    <SelectTrigger className="w-40">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="applicant">Applicant</SelectItem>
                                                        <SelectItem value="project_manager">Project Manager</SelectItem>
                                                        <SelectItem value="admin">Admin</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>

                <Card className="mt-6">
                    <CardHeader>
                        <CardTitle>Role Permissions</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="border-l-4 border-red-500 pl-4">
                                <div className="font-semibold text-red-900">Administrator</div>
                                <ul className="text-sm text-gray-600 mt-2 space-y-1">
                                    <li>• Full access to all features</li>
                                    <li>• Manage open positions</li>
                                    <li>• Change freelancer statuses</li>
                                    <li>• Manage user roles</li>
                                    <li>• View and edit all applications</li>
                                </ul>
                            </div>
                            <div className="border-l-4 border-blue-500 pl-4">
                                <div className="font-semibold text-blue-900">Project Manager</div>
                                <ul className="text-sm text-gray-600 mt-2 space-y-1">
                                    <li>• View all freelancer applications</li>
                                    <li>• Add notes to applications</li>
                                    <li>• View activity logs</li>
                                    <li>• Connect and manage Gmail integration</li>
                                    <li>• Cannot change statuses</li>
                                    <li>• Cannot manage users</li>
                                </ul>
                            </div>
                            <div className="border-l-4 border-gray-500 pl-4">
                                <div className="font-semibold text-gray-900">Applicant</div>
                                <ul className="text-sm text-gray-600 mt-2 space-y-1">
                                    <li>• View own application only</li>
                                    <li>• See application status</li>
                                    <li>• View activity related to their application</li>
                                    <li>• No access to other applications</li>
                                </ul>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Invite User Dialog */}
                <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Invite New User</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="email">Email Address</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="user@example.com"
                                    value={inviteEmail}
                                    onChange={(e) => setInviteEmail(e.target.value)}
                                />
                            </div>
                            <div>
                                <Label htmlFor="role">Role</Label>
                                <Select value={inviteRole} onValueChange={setInviteRole}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="admin">Administrator</SelectItem>
                                        <SelectItem value="project_manager">Project Manager</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setShowInviteDialog(false)}>
                                Cancel
                            </Button>
                            <Button 
                                onClick={() => inviteUserMutation.mutate({ email: inviteEmail, role: inviteRole })}
                                disabled={!inviteEmail || inviteUserMutation.isPending}
                                className="bg-blue-600 hover:bg-blue-700"
                            >
                                {inviteUserMutation.isPending ? 'Sending...' : 'Send Invitation'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}