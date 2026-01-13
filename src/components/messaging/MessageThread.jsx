import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Send, Paperclip, X, FileText, Download } from "lucide-react";
import { formatDistanceToNow } from 'date-fns';
import { toast } from "sonner";

export default function MessageThread({ conversation, currentUser }) {
    const [message, setMessage] = useState('');
    const [attachments, setAttachments] = useState([]);
    const [uploading, setUploading] = useState(false);
    const messagesEndRef = useRef(null);
    const queryClient = useQueryClient();

    const { data: messages = [] } = useQuery({
        queryKey: ['messages', conversation.id],
        queryFn: () => base44.entities.Message.filter({ conversation_id: conversation.id }, 'created_date'),
        enabled: !!conversation.id,
    });

    // Real-time subscription for new messages
    useEffect(() => {
        if (!conversation.id) return;

        const unsubscribe = base44.entities.Message.subscribe((event) => {
            if (event.data.conversation_id === conversation.id) {
                queryClient.invalidateQueries(['messages', conversation.id]);
                queryClient.invalidateQueries(['conversations']);
            }
        });

        return unsubscribe;
    }, [conversation.id, queryClient]);

    // Mark messages as read
    useEffect(() => {
        if (messages.length > 0 && currentUser) {
            messages.forEach(msg => {
                if (!msg.read_by?.includes(currentUser.email) && msg.sender_email !== currentUser.email) {
                    base44.entities.Message.update(msg.id, {
                        read_by: [...(msg.read_by || []), currentUser.email]
                    });
                }
            });
            // Update conversation unread status
            if (conversation.unread_by?.includes(currentUser.email)) {
                base44.entities.Conversation.update(conversation.id, {
                    unread_by: conversation.unread_by.filter(email => email !== currentUser.email)
                });
            }
        }
    }, [messages, currentUser, conversation]);

    // Scroll to bottom on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const sendMessageMutation = useMutation({
        mutationFn: async (data) => {
            const msg = await base44.entities.Message.create(data);
            // Update conversation
            const otherParticipants = conversation.participant_emails.filter(e => e !== currentUser.email);
            await base44.entities.Conversation.update(conversation.id, {
                last_message_date: new Date().toISOString(),
                last_message_preview: data.content.substring(0, 100),
                unread_by: otherParticipants
            });
            return msg;
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['messages', conversation.id]);
            queryClient.invalidateQueries(['conversations']);
            setMessage('');
            setAttachments([]);
        },
        onError: () => {
            toast.error("Failed to send message");
        }
    });

    const handleFileUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        setUploading(true);
        try {
            const uploads = await Promise.all(
                files.map(async (file) => {
                    const { file_url } = await base44.integrations.Core.UploadFile({ file });
                    return {
                        url: file_url,
                        name: file.name,
                        size: file.size
                    };
                })
            );
            setAttachments(prev => [...prev, ...uploads]);
            toast.success("Files uploaded");
        } catch (error) {
            toast.error("Upload failed");
        } finally {
            setUploading(false);
        }
    };

    const handleSend = () => {
        if (!message.trim() && attachments.length === 0) return;

        sendMessageMutation.mutate({
            conversation_id: conversation.id,
            sender_email: currentUser.email,
            sender_name: currentUser.full_name || currentUser.email,
            content: message.trim() || '(File attachment)',
            file_attachments: attachments
        });
    };

    const formatFileSize = (bytes) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    return (
        <Card className="flex flex-col h-full">
            <CardHeader className="border-b">
                <CardTitle className="flex items-center justify-between">
                    <span>{conversation.subject || 'Conversation'}</span>
                    <div className="text-sm font-normal text-gray-600">
                        {conversation.participant_emails?.filter(e => e !== currentUser?.email).join(', ')}
                    </div>
                </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col p-0">
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {messages.map(msg => {
                        const isOwn = msg.sender_email === currentUser?.email;
                        return (
                            <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[70%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                                    <div className="text-xs text-gray-500 px-1">
                                        {isOwn ? 'You' : msg.sender_name}
                                    </div>
                                    <div className={`rounded-2xl px-4 py-2 ${
                                        isOwn 
                                            ? 'bg-blue-600 text-white' 
                                            : 'bg-gray-100 text-gray-900'
                                    }`}>
                                        <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                                        {msg.file_attachments?.length > 0 && (
                                            <div className="mt-2 space-y-2">
                                                {msg.file_attachments.map((file, idx) => (
                                                    <a
                                                        key={idx}
                                                        href={file.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className={`flex items-center gap-2 p-2 rounded ${
                                                            isOwn ? 'bg-blue-700' : 'bg-gray-200'
                                                        }`}
                                                    >
                                                        <FileText className="w-4 h-4" />
                                                        <div className="flex-1 min-w-0">
                                                            <div className="text-xs font-medium truncate">{file.name}</div>
                                                            <div className="text-xs opacity-75">{formatFileSize(file.size)}</div>
                                                        </div>
                                                        <Download className="w-4 h-4" />
                                                    </a>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <div className="text-xs text-gray-400 px-1">
                                        {formatDistanceToNow(new Date(msg.created_date), { addSuffix: true })}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="border-t p-4">
                    {attachments.length > 0 && (
                        <div className="mb-3 flex flex-wrap gap-2">
                            {attachments.map((file, idx) => (
                                <div key={idx} className="flex items-center gap-2 bg-gray-100 rounded px-3 py-2 text-sm">
                                    <FileText className="w-4 h-4" />
                                    <span className="truncate max-w-[150px]">{file.name}</span>
                                    <button onClick={() => setAttachments(prev => prev.filter((_, i) => i !== idx))}>
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                    <div className="flex gap-2">
                        <div className="relative">
                            <input
                                type="file"
                                multiple
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                onChange={handleFileUpload}
                                disabled={uploading}
                            />
                            <Button variant="outline" size="icon" disabled={uploading}>
                                <Paperclip className="w-4 h-4" />
                            </Button>
                        </div>
                        <Input
                            placeholder="Type a message..."
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSend();
                                }
                            }}
                            className="flex-1"
                        />
                        <Button 
                            onClick={handleSend} 
                            disabled={(!message.trim() && attachments.length === 0) || sendMessageMutation.isPending}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            <Send className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}