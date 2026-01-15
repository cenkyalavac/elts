import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { 
    RefreshCw, Users, CheckCircle2, AlertTriangle, Loader2,
    ArrowRight, Info, Download, Link2, Unlink, Zap
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../../utils";
import { toast } from "sonner";

export default function SmartcatTeamSync() {
    const queryClient = useQueryClient();
    const [showLinkDialog, setShowLinkDialog] = useState(false);
    const [selectedSmartcatId, setSelectedSmartcatId] = useState('');
    const [selectedFreelancerId, setSelectedFreelancerId] = useState('');

    // Test connection first
    const { data: connectionTest, isLoading: testingConnection, refetch: testConnection } = useQuery({
        queryKey: ['smartcatConnection'],
        queryFn: async () => {
            const response = await base44.functions.invoke('smartcatApi', {
                action: 'test_connection',
                params: {}
            });
            return response.data;
        },
        enabled: false,
        retry: 1
    });

    const { data: teamData, isLoading: teamLoading, refetch: refetchTeam, error: teamError } = useQuery({
        queryKey: ['smartcatMyTeam'],
        queryFn: async () => {
            const response = await base44.functions.invoke('smartcatApi', {
                action: 'get_my_team',
                params: {}
            });
            return response.data;
        },
        enabled: false,
        retry: 1
    });

    const { data: freelancers = [] } = useQuery({
        queryKey: ['freelancers'],
        queryFn: () => base44.entities.Freelancer.list(),
    });

    const syncMutation = useMutation({
        mutationFn: async (members) => {
            const response = await base44.functions.invoke('smartcatApi', {
                action: 'sync_to_base44',
                params: { members }
            });
            return response.data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['freelancers'] });
            toast.success(`Synced: ${data.created} created, ${data.updated} updated`);
            refetchTeam();
        },
        onError: (error) => {
            toast.error(`Sync failed: ${error.message}`);
        }
    });

    const linkMutation = useMutation({
        mutationFn: async ({ freelancer_id, smartcat_id }) => {
            const response = await base44.functions.invoke('smartcatApi', {
                action: 'link_freelancer',
                params: { freelancer_id, smartcat_id }
            });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['freelancers'] });
            toast.success('Freelancer linked to Smartcat ID');
            setShowLinkDialog(false);
            refetchTeam();
        },
        onError: (error) => {
            toast.error(`Link failed: ${error.message}`);
        }
    });

    const handleTestConnection = () => {
        testConnection();
    };

    const handleFetchTeam = () => {
        refetchTeam();
    };

    const handleSync = () => {
        if (!teamData?.team?.length) return;
        
        const membersToSync = teamData.team.filter(m => !m.matched);
        if (membersToSync.length === 0) {
            toast.info('All team members are already in the database');
            return;
        }
        
        syncMutation.mutate(membersToSync);
    };

    const handleLinkFreelancer = (smartcatId) => {
        setSelectedSmartcatId(smartcatId);
        setSelectedFreelancerId('');
        setShowLinkDialog(true);
    };

    const handleConfirmLink = () => {
        if (!selectedFreelancerId || !selectedSmartcatId) return;
        linkMutation.mutate({ freelancer_id: selectedFreelancerId, smartcat_id: selectedSmartcatId });
    };
    
    const smartcatTeam = teamData?.team || [];
    const onlyInSmartcat = smartcatTeam.filter(m => !m.matched);
    const matched = smartcatTeam.filter(m => m.matched);
    
    // Freelancers without Smartcat link
    const unlinkedFreelancers = (freelancers || []).filter(f => {
        const hasSmartcatTag = f.tags?.some(t => t.startsWith('smartcat:'));
        return f.status === 'Approved' && !hasSmartcatTag;
    });

    const exportTeamCSV = () => {
        const rows = [['Smartcat ID', 'Type', 'Languages', 'Assigned Words', 'Completed Words', 'Linked Freelancer', 'Projects']];
        smartcatTeam.forEach(m => {
            rows.push([
                m.smartcat_id, 
                m.supplierType || '', 
                m.languages?.join('; ') || '',
                m.assignedWordsCount || 0,
                m.completedWordsCount || 0,
                m.freelancer_name || (m.matched ? 'Yes' : 'No'),
                m.projectCount || 0
            ]);
        });
        
        const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `smartcat_team_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success('Team list exported');
    };

    return (
        <div className="space-y-6">
            {/* Connection Test Card */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Zap className="w-5 h-5" />
                        Smartcat Connection
                    </CardTitle>
                    <CardDescription>
                        Test your Smartcat API connection before syncing
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-4">
                        <Button onClick={handleTestConnection} disabled={testingConnection} variant="outline">
                            {testingConnection ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                                <Zap className="w-4 h-4 mr-2" />
                            )}
                            Test Connection
                        </Button>
                        
                        {connectionTest?.success && (
                            <div className="flex items-center gap-2 text-green-600">
                                <CheckCircle2 className="w-5 h-5" />
                                <span>Connected to: <strong>{connectionTest.account?.name}</strong></span>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Users className="w-5 h-5" />
                        Your Smartcat Team
                    </CardTitle>
                    <CardDescription>
                        Smartcat identifies linguists by User ID, not name/email. You need to manually link them to your freelancers.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-3 flex-wrap">
                        <Button onClick={handleFetchTeam} disabled={teamLoading}>
                            {teamLoading ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                                <RefreshCw className="w-4 h-4 mr-2" />
                            )}
                            Load Team from Smartcat
                        </Button>
                        {onlyInSmartcat.length > 0 && (
                            <Button 
                                onClick={handleSync} 
                                disabled={syncMutation.isPending}
                                className="bg-green-600 hover:bg-green-700"
                            >
                                {syncMutation.isPending ? (
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                ) : (
                                    <ArrowRight className="w-4 h-4 mr-2" />
                                )}
                                Create Placeholders ({onlyInSmartcat.length})
                            </Button>
                        )}
                        {smartcatTeam.length > 0 && (
                            <Button variant="outline" onClick={exportTeamCSV}>
                                <Download className="w-4 h-4 mr-2" />
                                Export CSV
                            </Button>
                        )}
                    </div>
                    
                    {teamData?.note && (
                        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                            <p className="text-sm text-amber-700">{teamData.note}</p>
                        </div>
                    )}
                    
                    {teamError && (
                        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                            <div className="flex items-start gap-3">
                                <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />
                                <div>
                                    <p className="font-medium text-red-800">Error loading team</p>
                                    <p className="text-sm text-red-600">{teamError.message}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {teamData && (
                <>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <Card className="bg-blue-50 border-blue-200">
                            <CardContent className="pt-6">
                                <p className="text-sm text-blue-600">Smartcat Team</p>
                                <p className="text-2xl font-bold text-blue-700">{smartcatTeam.length}</p>
                            </CardContent>
                        </Card>
                        <Card className="bg-green-50 border-green-200">
                            <CardContent className="pt-6">
                                <p className="text-sm text-green-600">Already in DB</p>
                                <p className="text-2xl font-bold text-green-700">{matched.length}</p>
                            </CardContent>
                        </Card>
                        <Card className="bg-yellow-50 border-yellow-200">
                            <CardContent className="pt-6">
                                <p className="text-sm text-yellow-600">Need to Add</p>
                                <p className="text-2xl font-bold text-yellow-700">{onlyInSmartcat.length}</p>
                            </CardContent>
                        </Card>
                        <Card className="bg-orange-50 border-orange-200">
                            <CardContent className="pt-6">
                                <p className="text-sm text-orange-600">Only in DB</p>
                                <p className="text-2xl font-bold text-orange-700">{onlyInBase44.length}</p>
                            </CardContent>
                        </Card>
                    </div>

                    {smartcatTeam.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Smartcat Assignees ({smartcatTeam.length})</CardTitle>
                                <CardDescription>
                                    These are linguists found in your Smartcat projects. Link them to your freelancers by clicking "Link".
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Smartcat User ID</TableHead>
                                            <TableHead>Type</TableHead>
                                            <TableHead>Languages</TableHead>
                                            <TableHead>Words</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {smartcatTeam.map((member, idx) => (
                                            <TableRow key={idx} className={!member.matched ? 'bg-yellow-50' : ''}>
                                                <TableCell className="font-mono text-sm">
                                                    {member.smartcat_id?.substring(0, 12)}...
                                                    {member._debug && (
                                                        <details className="text-xs text-gray-400 mt-1">
                                                            <summary>Debug</summary>
                                                            <pre className="text-xs overflow-auto max-w-xs">
                                                                {JSON.stringify(member._debug, null, 2)}
                                                            </pre>
                                                        </details>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className="text-xs">
                                                        {member.supplierType || 'Unknown'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-sm">
                                                    {member.languages?.slice(0, 3).join(', ')}
                                                    {member.languages?.length > 3 && ` +${member.languages.length - 3}`}
                                                </TableCell>
                                                <TableCell className="text-sm">
                                                    {member.completedWordsCount?.toLocaleString() || member.assignedWordsCount?.toLocaleString() || '-'}
                                                </TableCell>
                                                <TableCell>
                                                    {member.matched ? (
                                                        <Badge className="bg-green-100 text-green-700">
                                                            <CheckCircle2 className="w-3 h-3 mr-1" />
                                                            {member.freelancer_name || 'Linked'}
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="outline" className="text-yellow-600">
                                                            <Unlink className="w-3 h-3 mr-1" />
                                                            Not Linked
                                                        </Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {member.matched && member.freelancer_id ? (
                                                        <Link to={createPageUrl(`FreelancerDetail?id=${member.freelancer_id}`)}>
                                                            <Button variant="ghost" size="sm">View</Button>
                                                        </Link>
                                                    ) : (
                                                        <Button 
                                                            variant="outline" 
                                                            size="sm"
                                                            onClick={() => handleLinkFreelancer(member.smartcat_id)}
                                                        >
                                                            <Link2 className="w-3 h-3 mr-1" />
                                                            Link
                                                        </Button>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    )}
                </>
            )}

            <Card className="bg-blue-50 border-blue-200">
                <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                        <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                        <div>
                            <p className="font-medium text-blue-800 mb-1">How This Works</p>
                            <ul className="text-sm text-blue-600 space-y-1">
                                <li>• <strong>Test Connection</strong> first to verify your API credentials</li>
                                <li>• <strong>Load Team</strong> scans your projects and extracts all assigned linguists</li>
                                <li>• Smartcat identifies linguists by <strong>User ID</strong>, not name or email</li>
                                <li>• Use the <strong>Link</strong> button to connect a Smartcat User ID to your freelancer</li>
                                <li>• Once linked, the system will recognize them in future syncs</li>
                            </ul>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Link Freelancer Dialog */}
            <Dialog open={showLinkDialog} onOpenChange={setShowLinkDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Link Smartcat User to Freelancer</DialogTitle>
                    </DialogHeader>
                    
                    <div className="space-y-4 py-4">
                        <div>
                            <label className="text-sm font-medium">Smartcat User ID</label>
                            <Input 
                                value={selectedSmartcatId} 
                                readOnly 
                                className="mt-1 font-mono text-sm bg-gray-50"
                            />
                        </div>
                        
                        <div>
                            <label className="text-sm font-medium">Select Freelancer</label>
                            <Select value={selectedFreelancerId} onValueChange={setSelectedFreelancerId}>
                                <SelectTrigger className="mt-1">
                                    <SelectValue placeholder="Choose a freelancer..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {unlinkedFreelancers.map(f => (
                                        <SelectItem key={f.id} value={f.id}>
                                            {f.full_name} ({f.email || 'No email'})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-gray-500 mt-1">
                                Showing {unlinkedFreelancers.length} approved freelancers without Smartcat links
                            </p>
                        </div>
                    </div>
                    
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowLinkDialog(false)}>
                            Cancel
                        </Button>
                        <Button 
                            onClick={handleConfirmLink}
                            disabled={!selectedFreelancerId || linkMutation.isPending}
                        >
                            {linkMutation.isPending ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                                <Link2 className="w-4 h-4 mr-2" />
                            )}
                            Link Freelancer
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}