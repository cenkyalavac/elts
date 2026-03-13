import React from 'react';
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign } from "lucide-react";

export default function RateHistoryLog({ freelancerId }) {
    const { data: activities = [] } = useQuery({
        queryKey: ['rateActivities', freelancerId],
        queryFn: async () => {
            const all = await base44.entities.FreelancerActivity.filter({
                freelancer_id: freelancerId
            }, '-created_date', 100);
            return all.filter(a => 
                a.activity_type === 'Rate Negotiated' ||
                a.description?.toLowerCase().includes('rate') ||
                a.description?.toLowerCase().includes('price') ||
                a.description?.toLowerCase().includes('ücret')
            );
        },
        enabled: !!freelancerId,
        staleTime: 120000,
    });

    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-green-600" />
                    Rate History
                </CardTitle>
            </CardHeader>
            <CardContent>
                {activities.length === 0 ? (
                    <p className="text-sm text-gray-500">No rate change history recorded.</p>
                ) : (
                    <div className="space-y-3">
                        {activities.map(a => (
                            <div key={a.id} className="border-l-2 border-green-200 pl-3 py-1">
                                <div className="text-sm text-gray-800">{a.description}</div>
                                <div className="flex items-center gap-2 mt-1">
                                    {a.old_value && (
                                        <Badge variant="outline" className="text-xs line-through text-gray-400">{a.old_value}</Badge>
                                    )}
                                    {a.new_value && (
                                        <Badge className="text-xs bg-green-100 text-green-700">{a.new_value}</Badge>
                                    )}
                                </div>
                                <div className="text-xs text-gray-400 mt-1">
                                    {new Date(a.created_date).toLocaleDateString()} — {a.performed_by || 'System'}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}