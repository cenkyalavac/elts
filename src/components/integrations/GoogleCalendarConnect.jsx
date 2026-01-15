import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, CheckCircle, RefreshCw, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function GoogleCalendarConnect({ freelancerId }) {
    const [syncing, setSyncing] = useState(false);
    const queryClient = useQueryClient();

    const { data: user } = useQuery({
        queryKey: ['currentUser'],
        queryFn: () => base44.auth.me(),
    });

    const isCalendarConnected = user?.googleCalendarConnected;

    const syncMutation = useMutation({
        mutationFn: async () => {
            setSyncing(true);
            const { data } = await base44.functions.invoke('syncGoogleCalendar', {
                freelancerId,
                daysAhead: 30
            });
            return data;
        },
        onSuccess: (data) => {
            setSyncing(false);
            queryClient.invalidateQueries({ queryKey: ['availability', freelancerId] });
            toast.success(`Synced ${data.eventsProcessed || 0} calendar events`);
        },
        onError: (error) => {
            setSyncing(false);
            toast.error('Failed to sync calendar: ' + error.message);
        }
    });

    const connectMutation = useMutation({
        mutationFn: async () => {
            // The OAuth is already authorized via app connector
            // Just mark user as connected and trigger initial sync
            await base44.auth.updateMe({ googleCalendarConnected: true });
            return syncMutation.mutateAsync();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['currentUser'] });
            toast.success('Google Calendar connected!');
        },
        onError: (error) => {
            toast.error('Failed to connect: ' + error.message);
        }
    });

    const disconnectMutation = useMutation({
        mutationFn: async () => {
            await base44.auth.updateMe({ googleCalendarConnected: false });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['currentUser'] });
            toast.success('Google Calendar disconnected');
        }
    });

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    Google Calendar Sync
                </CardTitle>
                <CardDescription>
                    Automatically sync your unavailable times from Google Calendar
                </CardDescription>
            </CardHeader>
            <CardContent>
                {isCalendarConnected ? (
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                            <div>
                                <div className="font-medium text-green-700">Connected</div>
                                <div className="text-sm text-gray-600">
                                    Your calendar events will be synced to show unavailable times
                                </div>
                            </div>
                        </div>
                        
                        <div className="flex gap-2">
                            <Button 
                                variant="outline" 
                                onClick={() => syncMutation.mutate()}
                                disabled={syncing}
                                className="gap-2"
                            >
                                {syncing ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <RefreshCw className="w-4 h-4" />
                                )}
                                Sync Now
                            </Button>
                            <Button 
                                variant="ghost" 
                                onClick={() => disconnectMutation.mutate()}
                                className="text-red-600 hover:text-red-700"
                            >
                                Disconnect
                            </Button>
                        </div>

                        <div className="bg-blue-50 rounded-lg p-3 text-sm">
                            <p className="text-blue-800">
                                <strong>Tip:</strong> Events marked as "Busy" in your calendar will automatically 
                                show as unavailable times. Free/tentative events are ignored.
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-gray-400 mt-0.5" />
                            <div>
                                <div className="font-medium">Not Connected</div>
                                <div className="text-sm text-gray-600">
                                    Connect your Google Calendar to automatically sync your availability
                                </div>
                            </div>
                        </div>

                        <Button 
                            onClick={() => connectMutation.mutate()}
                            disabled={connectMutation.isPending}
                            className="gap-2"
                        >
                            {connectMutation.isPending ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Calendar className="w-4 h-4" />
                            )}
                            Connect Google Calendar
                        </Button>

                        <div className="text-xs text-gray-500">
                            We'll only read your calendar to check for busy times. 
                            We won't modify or access your event details.
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}