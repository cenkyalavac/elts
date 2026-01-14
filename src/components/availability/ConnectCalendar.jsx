import React from 'react';
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, ExternalLink } from "lucide-react";

export default function ConnectCalendar({ onConnected }) {
    const handleConnect = () => {
        // Redirect to Google Calendar OAuth
        window.location.href = '/api/connectors/googlecalendar/authorize';
    };

    return (
        <Card className="border-yellow-200 bg-yellow-50">
            <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-yellow-700" />
                    Connect Your Google Calendar
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                <p className="text-sm text-yellow-800">
                    Connect your Google Calendar to sync freelancer availability automatically.
                </p>
                <Button 
                    onClick={handleConnect}
                    className="w-full bg-yellow-600 hover:bg-yellow-700"
                >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Connect Google Calendar
                </Button>
            </CardContent>
        </Card>
    );
}