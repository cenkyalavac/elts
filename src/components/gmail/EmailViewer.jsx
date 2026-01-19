import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Reply, ReplyAll, Forward, Mail, ChevronDown, ChevronUp } from "lucide-react";
import { format } from "date-fns";
import EnhancedEmailComposer from "./EnhancedEmailComposer";

export default function EmailViewer({ email, freelancerEmail }) {
    const [expanded, setExpanded] = useState(false);
    const [showReply, setShowReply] = useState(false);

    const isFromFreelancer = email.from.includes(freelancerEmail);

    return (
        <>
            <Card className={`${isFromFreelancer ? 'border-l-4 border-l-blue-500' : 'border-l-4 border-l-gray-300'}`}>
                <CardHeader className="pb-3 cursor-pointer" onClick={() => setExpanded(!expanded)}>
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <div className="p-1.5 bg-gray-100 rounded">
                                    <Mail className="w-4 h-4 text-gray-600" />
                                </div>
                                <div className="font-semibold text-sm">{email.subject}</div>
                                {email.labels?.includes('UNREAD') && (
                                    <Badge variant="default" className="bg-blue-600">New</Badge>
                                )}
                            </div>
                            <div className="text-xs text-gray-600">
                                <span className="font-medium">From:</span> {email.from}
                            </div>
                            <div className="text-xs text-gray-500 mt-0.5">
                                {format(new Date(email.date), 'MMMM d, yyyy \'at\' h:mm a')}
                            </div>
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </Button>
                    </div>
                </CardHeader>
                {expanded && (
                    <CardContent className="pt-0">
                        <div className="border-t pt-4 space-y-4">
                            {!email.body && (
                                <div className="text-sm text-gray-700 bg-gray-50 p-3 rounded">
                                    {email.snippet}
                                </div>
                            )}
                            {email.body && (
                                <div 
                                    className="text-sm text-gray-700 prose prose-sm max-w-none"
                                    dangerouslySetInnerHTML={{ __html: email.body }}
                                />
                            )}
                            <div className="flex gap-2 pt-2 border-t">
                                <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => setShowReply(true)}
                                    className="gap-2"
                                >
                                    <Reply className="w-4 h-4" />
                                    Reply
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                )}
            </Card>

            <EnhancedEmailComposer
                open={showReply}
                onOpenChange={setShowReply}
                defaultTo={isFromFreelancer ? freelancerEmail : email.to}
                defaultSubject={email.subject.startsWith('Re:') ? email.subject : `Re: ${email.subject}`}
                defaultBody={`\n\n---\nOn ${format(new Date(email.date), 'MMM d, yyyy \'at\' h:mm a')}, ${email.from} wrote:\n${email.snippet}`}
                threadId={email.threadId}
                email={email}
                freelancer={{ email: freelancerEmail }}
            />
        </>
    );
}