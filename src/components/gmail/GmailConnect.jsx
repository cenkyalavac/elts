import React from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, CheckCircle, Link as LinkIcon } from "lucide-react";
import { toast } from "sonner";

export default function GmailConnect() {
    const queryClient = useQueryClient();

    const { data: user } = useQuery({
        queryKey: ['currentUser'],
        queryFn: () => base44.auth.me(),
    });

    const connectMutation = useMutation({
        mutationFn: async () => {
            const { data } = await base44.functions.invoke('connectGmail');
            window.location.href = data.authUrl;
        },
        onError: () => {
            toast.error('Failed to connect Gmail');
        }
    });

    const isConnected = user?.gmailRefreshToken;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Mail className="w-5 h-5" />
                    Gmail Integration
                </CardTitle>
            </CardHeader>
            <CardContent>
                {isConnected ? (
                    <div className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <div>
                            <div className="font-medium">Connected</div>
                            <div className="text-sm text-gray-600">{user.gmailEmail}</div>
                        </div>
                    </div>
                ) : (
                    <div>
                        <p className="text-sm text-gray-600 mb-4">
                            Connect your Gmail account to view and manage email conversations with freelancers.
                        </p>
                        <Button 
                            onClick={() => connectMutation.mutate()}
                            disabled={connectMutation.isPending}
                            className="gap-2"
                        >
                            <LinkIcon className="w-4 h-4" />
                            Connect Gmail Account
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}