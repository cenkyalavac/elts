import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { formatDistanceToNow } from 'date-fns';
import { User, Users } from "lucide-react";

export default function ConversationList({ conversations, currentUser, onSelectConversation, selectedConversationId }) {
    const getOtherParticipants = (conversation) => {
        return conversation.participant_emails?.filter(email => email !== currentUser?.email) || [];
    };

    const isUnread = (conversation) => {
        return conversation.unread_by?.includes(currentUser?.email);
    };

    return (
        <div className="space-y-2">
            {conversations.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                    <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>No conversations yet</p>
                </div>
            ) : (
                conversations.map(conversation => {
                    const otherParticipants = getOtherParticipants(conversation);
                    const unread = isUnread(conversation);
                    
                    return (
                        <button
                            key={conversation.id}
                            onClick={() => onSelectConversation(conversation)}
                            className={`w-full text-left p-4 rounded-lg border transition-all ${
                                selectedConversationId === conversation.id
                                    ? 'border-blue-500 bg-blue-50'
                                    : unread
                                    ? 'border-blue-200 bg-blue-50/50 hover:bg-blue-50'
                                    : 'border-gray-200 bg-white hover:border-blue-300'
                            }`}
                        >
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full">
                                    <User className="w-5 h-5 text-purple-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-1">
                                        <div className="font-semibold truncate">
                                            {conversation.subject || otherParticipants.join(', ')}
                                        </div>
                                        {unread && (
                                            <Badge className="bg-blue-600 ml-2">New</Badge>
                                        )}
                                    </div>
                                    <div className="text-sm text-gray-600 truncate mb-1">
                                        {conversation.last_message_preview || 'No messages yet'}
                                    </div>
                                    {conversation.last_message_date && (
                                        <div className="text-xs text-gray-500">
                                            {formatDistanceToNow(new Date(conversation.last_message_date), { addSuffix: true })}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </button>
                    );
                })
            )}
        </div>
    );
}