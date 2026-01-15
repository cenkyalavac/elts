import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { 
    RefreshCw, Users, CheckCircle2, AlertTriangle, Loader2,
    ArrowRight, Info, Download
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../../utils";
import { toast } from "sonner";

export default function SmartcatTeamSync() {
    const queryClient = useQueryClient();

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

    const freelancerNames = new Set((freelancers || []).map(f => f.full_name?.toLowerCase()));
    const freelancerEmails = new Set((freelancers || []).map(f => f.email?.toLowerCase()).filter(Boolean));
    
    const smartcatTeam = teamData?.team || [];
    const onlyInSmartcat = smartcatTeam.filter(m => !m.matched);
    const matched = smartcatTeam.filter(m => m.matched);
    
    const onlyInBase44 = (freelancers || []).filter(f => {
        if (f.status !== 'Approved') return false;
        const inSmartcat = smartcatTeam.some(m => 
            m.name?.toLowerCase() === f.full_name?.toLowerCase() ||
            m.email?.toLowerCase() === f.email?.toLowerCase()
        );
        return !inSmartcat;
    });

    const exportTeamCSV = () => {
        const rows = [['Name', 'Email', 'Role', 'In Database']];
        smartcatTeam.forEach(m => {
            rows.push([m.name, m.email || '', m.role || '', m.matched ? 'Yes' : 'No']);
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
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Users className="w-5 h-5" />
                        Your Smartcat Team
                    </CardTitle>
                    <CardDescription>
                        View your Smartcat team members and sync them with your freelancer database
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
                                Add {onlyInSmartcat.length} to Database
                            </Button>
                        )}
                        {smartcatTeam.length > 0 && (
                            <Button variant="outline" onClick={exportTeamCSV}>
                                <Download className="w-4 h-4 mr-2" />
                                Export CSV
                            </Button>
                        )}
                    </div>
                    
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
                                <CardTitle>Team Members ({smartcatTeam.length})</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Name</TableHead>
                                            <TableHead>Email</TableHead>
                                            <TableHead>Role</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {smartcatTeam.map((member, idx) => (
                                            <TableRow key={idx} className={!member.matched ? 'bg-yellow-50' : ''}>
                                                <TableCell className="font-medium">
                                                    {member.name || 'Unknown'}
                                                    {member._debug && (
                                                        <details className="text-xs text-gray-400 mt-1">
                                                            <summary>Debug</summary>
                                                            <pre className="text-xs overflow-auto max-w-xs">
                                                                {JSON.stringify(member._debug, null, 2)}
                                                            </pre>
                                                        </details>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-sm text-gray-600">
                                                    {member.email || '-'}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className="text-xs">
                                                        {member.role || 'Member'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    {member.matched ? (
                                                        <Badge className="bg-green-100 text-green-700">
                                                            <CheckCircle2 className="w-3 h-3 mr-1" />
                                                            In Database
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="outline" className="text-yellow-600">
                                                            <AlertTriangle className="w-3 h-3 mr-1" />
                                                            Not in DB
                                                        </Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {member.matched && member.freelancer_id && (
                                                        <Link to={createPageUrl(`FreelancerDetail?id=${member.freelancer_id}`)}>
                                                            <Button variant="ghost" size="sm">View</Button>
                                                        </Link>
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
                                <li>• Click "Load Team from Smartcat" to fetch your team members</li>
                                <li>• System matches them against your database by name and email</li>
                                <li>• Use "Add to Database" button to import missing members</li>
                                <li>• Members are added with "Approved" status and tagged "Smartcat Team"</li>
                            </ul>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}