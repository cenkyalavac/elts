import React, { useState } from 'react';
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import ConnectCalendar from "./ConnectCalendar";

export default function GoogleCalendarSync({ freelancerId, freelancerName }) {
    const [syncing, setSyncing] = useState(false);
    const [result, setResult] = useState(null);
    const [isConnected, setIsConnected] = useState(true); // Will be checked on mount

    const handleSync = async () => {
        setSyncing(true);
        setResult(null);
        
        try {
            const response = await base44.functions.invoke('syncGoogleCalendar', {
                freelancer_id: freelancerId,
                action: 'fetch'
            });

            setResult({
                success: true,
                data: response.data
            });
        } catch (error) {
            // Check if error is due to missing OAuth connection
            if (error.message?.includes('not connected') || error.message?.includes('Unauthorized')) {
                setIsConnected(false);
            }
            setResult({
                success: false,
                error: error.message
            });
        } finally {
            setSyncing(false);
        }
    };

    if (!isConnected) {
        return <ConnectCalendar onConnected={() => setIsConnected(true)} />;
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Google Calendar Sync
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <p className="text-sm text-gray-600">
                    Sync unavailability from {freelancerName}'s Google Calendar
                </p>

                <Button 
                    onClick={handleSync}
                    disabled={syncing}
                    className="w-full"
                >
                    {syncing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    {syncing ? 'Syncing...' : 'Sync Calendar'}
                </Button>

                {result && (
                    <div className={`rounded-lg p-4 flex items-start gap-3 ${
                        result.success 
                            ? 'bg-green-50 border border-green-200' 
                            : 'bg-red-50 border border-red-200'
                    }`}>
                        {result.success ? (
                            <>
                                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                                <div>
                                    <div className="font-semibold text-green-900">Synced Successfully</div>
                                    <div className="text-sm text-green-700 mt-1">
                                        Found {result.data.events} calendar events<br />
                                        Created {result.data.unavailabilityRecords} unavailability records
                                    </div>
                                </div>
                            </>
                        ) : (
                            <>
                                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                                <div>
                                    <div className="font-semibold text-red-900">Sync Failed</div>
                                    <div className="text-sm text-red-700 mt-1">{result.error}</div>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}