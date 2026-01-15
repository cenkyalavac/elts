import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { 
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { Calendar, CheckCircle, RefreshCw, Loader2, Settings } from "lucide-react";
import { toast } from "sonner";

export default function CalendarSettingsCard() {
    const queryClient = useQueryClient();
    const [loadingCalendars, setLoadingCalendars] = useState(false);
    const [calendars, setCalendars] = useState([]);
    const [selectedCalendarId, setSelectedCalendarId] = useState('');

    const { data: settings } = useQuery({
        queryKey: ['appSettings', 'calendar'],
        queryFn: async () => {
            const allSettings = await base44.entities.AppSetting.filter({ key: 'freelancer_calendar_id' });
            return allSettings[0];
        },
    });

    useEffect(() => {
        if (settings?.value) {
            setSelectedCalendarId(settings.value);
        }
    }, [settings]);

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

    const saveSettingMutation = useMutation({
        mutationFn: async (calendarId) => {
            const existing = await base44.entities.AppSetting.filter({ key: 'freelancer_calendar_id' });
            if (existing.length > 0) {
                await base44.entities.AppSetting.update(existing[0].id, {
                    value: calendarId,
                    description: 'Google Calendar ID for freelancer availability sync'
                });
            } else {
                await base44.entities.AppSetting.create({
                    key: 'freelancer_calendar_id',
                    value: calendarId,
                    category: 'general',
                    description: 'Google Calendar ID for freelancer availability sync'
                });
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['appSettings'] });
            toast.success('Calendar setting saved');
        },
        onError: (error) => {
            toast.error('Failed to save: ' + error.message);
        },
    });

    const handleCalendarChange = (calendarId) => {
        setSelectedCalendarId(calendarId);
        saveSettingMutation.mutate(calendarId);
    };

    const selectedCalendar = calendars.find(c => c.id === selectedCalendarId);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Freelancer Availability Calendar
                </CardTitle>
                <CardDescription>
                    Select which Google Calendar to use for freelancer availability sync
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <div>
                        <div className="font-medium">Google Calendar Connected</div>
                        <div className="text-sm text-gray-600">
                            Calendar integration is authorized
                        </div>
                    </div>
                </div>

                <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium">Select Calendar for Freelancers</Label>
                        <Button 
                            variant="outline" 
                            size="sm"
                            onClick={loadCalendars}
                            disabled={loadingCalendars}
                        >
                            {loadingCalendars ? (
                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            ) : (
                                <RefreshCw className="w-4 h-4 mr-2" />
                            )}
                            Load Calendars
                        </Button>
                    </div>
                    
                    {calendars.length > 0 ? (
                        <>
                            <Select 
                                value={selectedCalendarId} 
                                onValueChange={handleCalendarChange}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a calendar" />
                                </SelectTrigger>
                                <SelectContent>
                                    {calendars.map((cal) => (
                                        <SelectItem key={cal.id} value={cal.id}>
                                            <div className="flex items-center gap-2">
                                                <div 
                                                    className="w-3 h-3 rounded-full" 
                                                    style={{ backgroundColor: cal.backgroundColor || '#4285F4' }}
                                                />
                                                {cal.summary}
                                                {cal.primary && <span className="text-xs text-gray-500">(Primary)</span>}
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            {selectedCalendar && (
                                <div className="p-3 bg-purple-50 rounded-lg">
                                    <div className="flex items-center gap-2">
                                        <div 
                                            className="w-4 h-4 rounded-full" 
                                            style={{ backgroundColor: selectedCalendar.backgroundColor || '#4285F4' }}
                                        />
                                        <span className="font-medium text-purple-900">{selectedCalendar.summary}</span>
                                    </div>
                                    <p className="text-xs text-purple-700 mt-1">
                                        Freelancer availability will sync to/from this calendar
                                    </p>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="text-sm text-gray-500 text-center py-4">
                            Click "Load Calendars" to see available calendars
                        </div>
                    )}
                </div>

                <div className="text-sm text-gray-500 space-y-1">
                    <p>• Events marked as "Busy" in this calendar will show freelancers as unavailable</p>
                    <p>• Freelancers will see availability from this shared calendar</p>
                    <p>• Create a dedicated calendar like "FL Availability" for better organization</p>
                </div>
            </CardContent>
        </Card>
    );
}