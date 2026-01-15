import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, CheckCircle, RefreshCw, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export default function GoogleCalendarConnect({ freelancerId }) {
    const queryClient = useQueryClient();
    const [syncing, setSyncing] = useState(false);

    const { data: user } = useQuery({
        queryKey: ['currentUser'],
        queryFn: () => base44.auth.me(),
    });

    const isConnected = user?.googleCalendarConnected;

    const syncMutation = useMutation({
        mutationFn: async () => {
            setSyncing(true);
            const { data } = await base44.functions.invoke('syncGoogleCalendar', {
                freelancerId,
            });
            return data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['availability', freelancerId] });
            toast.success(`Synced ${data.eventsImported || 0} events from Google Calendar`);
            setSyncing(false);
        },
        onError: (error) => {
            toast.error('Failed to sync calendar: ' + error.message);
            setSyncing(false);
        },
    });

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    Google Calendar
                </CardTitle>
                <CardDescription>
                    Sync your availability from Google Calendar
                </CardDescription>
            </CardHeader>
            <CardContent>
                {isConnected ? (
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                            <div>
                                <div className="font-medium">Connected</div>
                                <div className="text-sm text-gray-600">
                                    Your Google Calendar is linked
                                </div>
                            </div>
                        </div>
                        <Button 
                            onClick={() => syncMutation.mutate()}
                            disabled={syncing}
                            variant="outline"
                            className="w-full"
                        >
                            <RefreshCw className={`w-4 h-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
                            {syncing ? 'Syncing...' : 'Sync Now'}
                        </Button>
                        <p className="text-xs text-gray-500">
                            Events marked as "Busy" will be imported as unavailable time slots.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="flex items-start gap-3 text-yellow-700 bg-yellow-50 p-3 rounded-lg">
                            <AlertCircle className="w-5 h-5 mt-0.5" />
                            <div className="text-sm">
                                <p className="font-medium">Calendar Not Connected</p>
                                <p>Connect your Google Calendar to automatically sync your availability.</p>
                            </div>
                        </div>
                        <Button 
                            onClick={() => {
                                toast.info('Google Calendar connection is managed by your administrator');
                            }}
                            className="w-full"
                        >
                            <Calendar className="w-4 h-4 mr-2" />
                            Connect Google Calendar
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}