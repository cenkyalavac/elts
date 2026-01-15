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
    ArrowRight, UserPlus, Info
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../../utils";

export default function SmartcatTeamSync() {
    const queryClient = useQueryClient();
    const [syncResult, setSyncResult] = useState(null);

    // Fetch Smartcat team from projects
    const { data: teamData, isLoading: teamLoading, refetch: refetchTeam, error: teamError } = useQuery({
        queryKey: ['smartcatTeamFromProjects'],
        queryFn: async () => {
            const response = await base44.functions.invoke('smartcatApi', {
                action: 'get_team_from_projects',
                params: { limit: 30 }
            });
            return response.data;
        },
        enabled: false,
        retry: false
    });

    // Fetch Base44 freelancers
    const { data: freelancers = [] } = useQuery({
        queryKey: ['freelancers'],
        queryFn: () => base44.entities.Freelancer.list(),
    });

    // Sync mutation
    const syncMutation = useMutation({
        mutationFn: async (members) => {
            const response = await base44.functions.invoke('smartcatApi', {
                action: 'sync_to_base44',
                params: { members }
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
        if (teamData?.team?.length) {
            syncMutation.mutate(teamData.team);
        }
    };

    // Compare teams
    const freelancerNames = new Set((freelancers || []).map(f => f.full_name?.toLowerCase()));
    const smartcatNames = new Set((teamData?.team || []).map(m => m.name?.toLowerCase()));
    
    const onlyInSmartcat = (teamData?.team || []).filter(m => 
        m.name && !freelancerNames.has(m.name.toLowerCase())
    );
    const onlyInBase44 = (freelancers || []).filter(f => 
        f.full_name && f.status === 'Approved' && !smartcatNames.has(f.full_name.toLowerCase())
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
                        Scan your Smartcat projects to find all assigned translators and sync them with your database.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-4 flex-wrap">
                        <Button onClick={handleFetchTeam} disabled={teamLoading}>
                            {teamLoading ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                                <RefreshCw className="w-4 h-4 mr-2" />
                            )}
                            Scan Smartcat Projects
                        </Button>
                        {teamData?.team?.length > 0 && (
                            <Button 
                                onClick={handleSync} 
                                disabled={syncMutation.isPending || onlyInSmartcat.length === 0}
                                variant="outline"
                            >
                                {syncMutation.isPending ? (
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                ) : (
                                    <ArrowRight className="w-4 h-4 mr-2" />
                                )}
                                Sync {onlyInSmartcat.length} New to Database
                            </Button>
                        )}
                    </div>
                    
                    {teamError && (
                        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                            <div className="flex items-start gap-3">
                                <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />
                                <div>
                                    <p className="font-medium text-red-800">Error scanning projects</p>
                                    <p className="text-sm text-red-600">{teamError.message}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Sync Result */}
            {syncResult && (
                <Card className="bg-green-50 border-green-200">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <CheckCircle2 className="w-8 h-8 text-green-600" />
                            <div>
                                <p className="font-medium text-green-800">Sync Complete</p>
                                <p className="text-sm text-green-600">
                                    {syncResult.created} created, {syncResult.updated} updated
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Stats */}
            {teamData && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                        <CardContent className="pt-6">
                            <p className="text-sm text-gray-500">Projects Scanned</p>
                            <p className="text-2xl font-bold">{teamData.projectsScanned || 0}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <p className="text-sm text-gray-500">Unique Assignees</p>
                            <p className="text-2xl font-bold">{teamData.total || 0}</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-yellow-50 border-yellow-200">
                        <CardContent className="pt-6">
                            <p className="text-sm text-yellow-600">Not in Database</p>
                            <p className="text-2xl font-bold text-yellow-700">{onlyInSmartcat.length}</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-orange-50 border-orange-200">
                        <CardContent className="pt-6">
                            <p className="text-sm text-orange-600">Only in Database</p>
                            <p className="text-2xl font-bold text-orange-700">{onlyInBase44.length}</p>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Comparison Cards */}
            {teamData && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Only in Smartcat */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <AlertTriangle className="w-5 h-5 text-yellow-500" />
                                In Smartcat, Not in Database ({onlyInSmartcat.length})
                            </CardTitle>
                            <CardDescription>
                                These people appear in your Smartcat projects but aren't in your freelancer database
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {onlyInSmartcat.length > 0 ? (
                                <div className="space-y-2 max-h-80 overflow-y-auto">
                                    {onlyInSmartcat.map((member, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                                            <div>
                                                <p className="font-medium">{member.name}</p>
                                                <p className="text-xs text-gray-500">
                                                    {member.projectCount} project(s) • {member.stageTypes?.join(', ')}
                                                </p>
                                            </div>
                                            <Badge variant="outline" className="text-yellow-600">Missing</Badge>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-gray-500">
                                    <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto mb-2" />
                                    <p>All Smartcat assignees are in your database</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Only in Base44 */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <AlertTriangle className="w-5 h-5 text-orange-500" />
                                Only in Database ({onlyInBase44.length})
                            </CardTitle>
                            <CardDescription>
                                These approved freelancers don't appear in your recent Smartcat projects
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {onlyInBase44.length > 0 ? (
                                <div className="space-y-2 max-h-80 overflow-y-auto">
                                    {onlyInBase44.slice(0, 20).map((freelancer, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                                            <div>
                                                <Link 
                                                    to={createPageUrl(`FreelancerDetail?id=${freelancer.id}`)}
                                                    className="font-medium hover:text-blue-600"
                                                >
                                                    {freelancer.full_name}
                                                </Link>
                                                <p className="text-xs text-gray-500">{freelancer.email}</p>
                                            </div>
                                            <Badge variant="outline" className="text-orange-600">No Projects</Badge>
                                        </div>
                                    ))}
                                    {onlyInBase44.length > 20 && (
                                        <p className="text-center text-sm text-gray-500 pt-2">
                                            +{onlyInBase44.length - 20} more
                                        </p>
                                    )}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-gray-500">
                                    <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto mb-2" />
                                    <p>All approved freelancers have Smartcat projects</p>
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
                        <CardTitle>All Smartcat Assignees ({teamData.total})</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Projects</TableHead>
                                    <TableHead>Work Types</TableHead>
                                    <TableHead>Languages</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {teamData.team.slice(0, 30).map((member, idx) => {
                                    const inDatabase = freelancerNames.has(member.name?.toLowerCase());
                                    return (
                                        <TableRow key={idx}>
                                            <TableCell className="font-medium">{member.name}</TableCell>
                                            <TableCell>
                                                <Badge variant="secondary">{member.projectCount}</Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-wrap gap-1">
                                                    {member.stageTypes?.slice(0, 2).map((type, i) => (
                                                        <Badge key={i} variant="outline" className="text-xs">{type}</Badge>
                                                    ))}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-sm text-gray-600">
                                                    {member.languages?.slice(0, 3).join(', ')}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                {inDatabase ? (
                                                    <Badge className="bg-green-100 text-green-700">
                                                        <CheckCircle2 className="w-3 h-3 mr-1" />
                                                        In Database
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="outline" className="text-yellow-600">
                                                        Missing
                                                    </Badge>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                        {teamData.team.length > 30 && (
                            <p className="text-center text-sm text-gray-500 mt-4">
                                Showing 30 of {teamData.team.length} assignees
                            </p>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Help Card */}
            <Card className="bg-blue-50 border-blue-200">
                <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                        <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                        <div>
                            <p className="font-medium text-blue-800">How Team Sync Works</p>
                            <p className="text-sm text-blue-600">
                                This tool scans your recent Smartcat projects to find everyone who has been assigned work.
                                It matches them against your freelancer database by name. Use the sync button to add any
                                missing translators to your database automatically.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}