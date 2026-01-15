import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { 
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { Calendar, CheckCircle, RefreshCw, AlertCircle, Settings, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function GoogleCalendarConnect({ freelancerId }) {
    const queryClient = useQueryClient();
    const [syncing, setSyncing] = useState(false);
    const [loadingCalendars, setLoadingCalendars] = useState(false);
    const [calendars, setCalendars] = useState([]);
    const [selectedCalendarId, setSelectedCalendarId] = useState('');

    const { data: user } = useQuery({
        queryKey: ['currentUser'],
        queryFn: () => base44.auth.me(),
    });

    const { data: freelancer } = useQuery({
        queryKey: ['freelancer', freelancerId],
        queryFn: async () => {
            if (!freelancerId) return null;
            const freelancers = await base44.entities.Freelancer.filter({ id: freelancerId });
            return freelancers[0];
        },
        enabled: !!freelancerId,
    });

    // Load saved calendar preference
    useEffect(() => {
        if (freelancer?.google_calendar_id) {
            setSelectedCalendarId(freelancer.google_calendar_id);
        }
    }, [freelancer]);

    const loadCalendars = async () => {
        setLoadingCalendars(true);
        try {
            const { data } = await base44.functions.invoke('syncGoogleCalendar', {
                action: 'listCalendars',
            });
            if (data.calendars) {
                setCalendars(data.calendars);
            }
        } catch (error) {
            toast.error('Failed to load calendars: ' + error.message);
        } finally {
            setLoadingCalendars(false);
        }
    };

    const saveCalendarPreference = useMutation({
        mutationFn: async (calendarId) => {
            if (!freelancerId) return;
            await base44.entities.Freelancer.update(freelancerId, {
                google_calendar_id: calendarId
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['freelancer', freelancerId] });
            toast.success('Calendar preference saved');
        },
        onError: (error) => {
            toast.error('Failed to save preference: ' + error.message);
        },
    });

    const syncMutation = useMutation({
        mutationFn: async () => {
            setSyncing(true);
            const { data } = await base44.functions.invoke('syncGoogleCalendar', {
                freelancerId,
                calendarId: selectedCalendarId || 'primary',
                action: 'sync',
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

    const handleCalendarChange = (calendarId) => {
        setSelectedCalendarId(calendarId);
        if (freelancerId) {
            saveCalendarPreference.mutate(calendarId);
        }
    };

    const isConnected = true; // App connector is authorized

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
                                    Google Calendar is linked to this app
                                </div>
                            </div>
                        </div>

                        {/* Calendar Selection */}
                        <div className="space-y-2 p-4 bg-gray-50 rounded-lg">
                            <div className="flex items-center justify-between">
                                <Label className="text-sm font-medium">Select Calendar</Label>
                                <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={loadCalendars}
                                    disabled={loadingCalendars}
                                >
                                    {loadingCalendars ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Settings className="w-4 h-4" />
                                    )}
                                </Button>
                            </div>
                            
                            {calendars.length > 0 ? (
                                <Select 
                                    value={selectedCalendarId || 'primary'} 
                                    onValueChange={handleCalendarChange}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a calendar" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="primary">Primary Calendar</SelectItem>
                                        {calendars.map((cal) => (
                                            <SelectItem key={cal.id} value={cal.id}>
                                                <div className="flex items-center gap-2">
                                                    <div 
                                                        className="w-3 h-3 rounded-full" 
                                                        style={{ backgroundColor: cal.backgroundColor || '#4285F4' }}
                                                    />
                                                    {cal.summary}
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            ) : (
                                <div className="text-sm text-gray-500">
                                    Click the settings icon to load your calendars
                                </div>
                            )}
                            
                            {selectedCalendarId && selectedCalendarId !== 'primary' && (
                                <div className="text-xs text-gray-500">
                                    Events will be synced from: {calendars.find(c => c.id === selectedCalendarId)?.summary || selectedCalendarId}
                                </div>
                            )}
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