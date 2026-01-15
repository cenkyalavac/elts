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
    ArrowRight, UserPlus
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../../utils";

export default function SmartcatTeamSync() {
    const queryClient = useQueryClient();
    const [syncResult, setSyncResult] = useState(null);

    const { data: teamData, isLoading: teamLoading, refetch: refetchTeam } = useQuery({
        queryKey: ['smartcatTeam'],
        queryFn: async () => {
            const response = await base44.functions.invoke('smartcatMarketplace', {
                action: 'get_my_team'
            });
            return response.data;
        },
        enabled: false
    });

    const { data: freelancers } = useQuery({
        queryKey: ['freelancers'],
        queryFn: () => base44.entities.Freelancer.list(),
    });

    const syncMutation = useMutation({
        mutationFn: async () => {
            const response = await base44.functions.invoke('smartcatMarketplace', {
                action: 'sync_team_to_base44'
            });
            return response.data;
        },
        onSuccess: (data) => {
            setSyncResult(data);
            queryClient.invalidateQueries({ queryKey: ['freelancers'] });
        }
    });

    const handleFetchTeam = () => {
        refetchTeam();
    };

    const handleSync = () => {
        syncMutation.mutate();
    };

    // Compare teams
    const freelancerEmails = new Set((freelancers || []).map(f => f.email?.toLowerCase()));
    const smartcatEmails = new Set((teamData?.team || []).map(m => m.email?.toLowerCase()));
    
    const onlyInSmartcat = (teamData?.team || []).filter(m => 
        m.email && !freelancerEmails.has(m.email.toLowerCase())
    );
    const onlyInBase44 = (freelancers || []).filter(f => 
        f.email && f.status === 'Approved' && !smartcatEmails.has(f.email.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {/* Info Card */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Users className="w-5 h-5" />
                        Team Synchronization
                    </CardTitle>
                    <CardDescription>
                        Compare and synchronize your Smartcat team with Base44 freelancer database.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-4">
                        <Button onClick={handleFetchTeam} disabled={teamLoading}>
                            {teamLoading ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                                <RefreshCw className="w-4 h-4 mr-2" />
                            )}
                            Fetch Smartcat Team
                        </Button>
                        <Button 
                            onClick={handleSync} 
                            disabled={syncMutation.isPending}
                            variant="outline"
                        >
                            {syncMutation.isPending ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                                <ArrowRight className="w-4 h-4 mr-2" />
                            )}
                            Auto Sync
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Sync Result */}
            {syncResult && (
                <Card className="bg-green-50 border-green-200">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <CheckCircle2 className="w-8 h-8 text-green-600" />
                            <div>
                                <p className="font-medium text-green-800">Synchronization Complete</p>
                                <p className="text-sm text-green-600">
                                    {syncResult.created} added, {syncResult.updated} updated
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Comparison */}
            {teamData && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Only in Smartcat */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <AlertTriangle className="w-5 h-5 text-yellow-500" />
                                    Only in Smartcat ({onlyInSmartcat.length})
                                </CardTitle>
                            </div>
                            <CardDescription>
                                These people are in your Smartcat team but not registered in Base44
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {onlyInSmartcat.length > 0 ? (
                                <div className="space-y-2 max-h-96 overflow-y-auto">
                                    {onlyInSmartcat.map((member, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                                            <div>
                                                <p className="font-medium">
                                                    {member.name || `${member.firstName} ${member.lastName}`}
                                                </p>
                                                <p className="text-sm text-gray-600">{member.email}</p>
                                            </div>
                                            <Badge variant="outline" className="text-yellow-600">
                                                Not in Base44
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-gray-500">
                                    <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto mb-2" />
                                    <p>All Smartcat members are in Base44</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Only in Base44 */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <AlertTriangle className="w-5 h-5 text-orange-500" />
                                    Only in Base44 ({onlyInBase44.length})
                                </CardTitle>
                            </div>
                            <CardDescription>
                                These approved freelancers are in Base44 but not in your Smartcat team
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {onlyInBase44.length > 0 ? (
                                <div className="space-y-2 max-h-96 overflow-y-auto">
                                    {onlyInBase44.map((freelancer, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                                            <div>
                                                <Link 
                                                    to={createPageUrl(`FreelancerDetail?id=${freelancer.id}`)}
                                                    className="font-medium hover:text-blue-600"
                                                >
                                                    {freelancer.full_name}
                                                </Link>
                                                <p className="text-sm text-gray-600">{freelancer.email}</p>
                                            </div>
                                            <Badge variant="outline" className="text-orange-600">
                                                Not in Smartcat
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-gray-500">
                                    <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto mb-2" />
                                    <p>All approved freelancers are in Smartcat</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Full Team List */}
            {teamData?.team && teamData.team.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Smartcat Team List ({teamData.total})</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {teamData.team.slice(0, 20).map((member, idx) => {
                                    const inBase44 = freelancerEmails.has(member.email?.toLowerCase());
                                    return (
                                        <TableRow key={idx}>
                                            <TableCell className="font-medium">
                                                {member.name || `${member.firstName || ''} ${member.lastName || ''}`}
                                            </TableCell>
                                            <TableCell>{member.email}</TableCell>
                                            <TableCell>
                                                {inBase44 ? (
                                                    <Badge className="bg-green-100 text-green-700">
                                                        <CheckCircle2 className="w-3 h-3 mr-1" />
                                                        Matched
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="outline" className="text-yellow-600">
                                                        Not in Base44
                                                    </Badge>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                        {teamData.team.length > 20 && (
                            <p className="text-center text-sm text-gray-500 mt-4">
                                +{teamData.team.length - 20} more members
                            </p>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    );
}