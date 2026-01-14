import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
    Plus, Pin, Trash2, Star, MessageSquare, AlertTriangle, 
    Users, Lock, Edit2, X, Check
} from "lucide-react";

const noteTypeConfig = {
    internal: { label: 'Internal Note', icon: MessageSquare, color: 'bg-gray-100 text-gray-700' },
    feedback: { label: 'Feedback', icon: Star, color: 'bg-yellow-100 text-yellow-700' },
    warning: { label: 'Warning', icon: AlertTriangle, color: 'bg-red-100 text-red-700' },
    interview: { label: 'Interview Note', icon: Users, color: 'bg-blue-100 text-blue-700' },
    performance: { label: 'Performance', icon: Star, color: 'bg-green-100 text-green-700' }
};

export default function FreelancerNotesSection({ freelancerId, currentUser }) {
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingNote, setEditingNote] = useState(null);
    const [newNote, setNewNote] = useState({
        title: '',
        content: '',
        note_type: 'internal',
        rating: null,
        visibility: 'team'
    });

    const queryClient = useQueryClient();
    const isAdmin = currentUser?.role === 'admin';

    const { data: notes = [], isLoading } = useQuery({
        queryKey: ['freelancerNotes', freelancerId],
        queryFn: () => base44.entities.FreelancerNote.filter({ freelancer_id: freelancerId }, '-created_date'),
        enabled: !!freelancerId,
    });

    const createNoteMutation = useMutation({
        mutationFn: (data) => base44.entities.FreelancerNote.create({
            ...data,
            freelancer_id: freelancerId
        }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['freelancerNotes', freelancerId] });
            setShowAddForm(false);
            setNewNote({ title: '', content: '', note_type: 'internal', rating: null, visibility: 'team' });
        },
    });

    const updateNoteMutation = useMutation({
        mutationFn: ({ id, data }) => base44.entities.FreelancerNote.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['freelancerNotes', freelancerId] });
            setEditingNote(null);
        },
    });

    const deleteNoteMutation = useMutation({
        mutationFn: (id) => base44.entities.FreelancerNote.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['freelancerNotes', freelancerId] });
        },
    });

    const togglePin = (note) => {
        updateNoteMutation.mutate({ id: note.id, data: { is_pinned: !note.is_pinned } });
    };

    // Filter notes based on visibility
    const visibleNotes = notes.filter(note => {
        if (note.visibility === 'admin_only' && !isAdmin) return false;
        return true;
    });

    // Sort: pinned first, then by date
    const sortedNotes = [...visibleNotes].sort((a, b) => {
        if (a.is_pinned && !b.is_pinned) return -1;
        if (!a.is_pinned && b.is_pinned) return 1;
        return new Date(b.created_date) - new Date(a.created_date);
    });

    const handleSubmit = () => {
        if (!newNote.content.trim()) return;
        createNoteMutation.mutate(newNote);
    };

    const renderStars = (rating, onChange) => {
        return (
            <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map(star => (
                    <button
                        key={star}
                        type="button"
                        onClick={() => onChange && onChange(star === rating ? null : star)}
                        className={`${onChange ? 'cursor-pointer hover:scale-110' : ''} transition-transform`}
                    >
                        <Star 
                            className={`w-4 h-4 ${star <= (rating || 0) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} 
                        />
                    </button>
                ))}
            </div>
        );
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="font-semibold text-lg">Notes & Feedback</h3>
                <Button size="sm" onClick={() => setShowAddForm(!showAddForm)}>
                    <Plus className="w-4 h-4 mr-1" />
                    Add Note
                </Button>
            </div>

            {/* Add Note Form */}
            {showAddForm && (
                <Card className="border-2 border-dashed border-blue-200 bg-blue-50/50">
                    <CardContent className="pt-4 space-y-3">
                        <Input
                            placeholder="Note title (optional)"
                            value={newNote.title}
                            onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                        />
                        <Textarea
                            placeholder="Write your note here..."
                            value={newNote.content}
                            onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                            className="min-h-[100px]"
                        />
                        <div className="flex flex-wrap gap-3 items-center">
                            <Select
                                value={newNote.note_type}
                                onValueChange={(value) => setNewNote({ ...newNote, note_type: value })}
                            >
                                <SelectTrigger className="w-40">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.entries(noteTypeConfig).map(([key, config]) => (
                                        <SelectItem key={key} value={key}>
                                            <div className="flex items-center gap-2">
                                                <config.icon className="w-4 h-4" />
                                                {config.label}
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            {(newNote.note_type === 'feedback' || newNote.note_type === 'performance') && (
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-gray-600">Rating:</span>
                                    {renderStars(newNote.rating, (r) => setNewNote({ ...newNote, rating: r }))}
                                </div>
                            )}

                            {isAdmin && (
                                <Select
                                    value={newNote.visibility}
                                    onValueChange={(value) => setNewNote({ ...newNote, visibility: value })}
                                >
                                    <SelectTrigger className="w-36">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="team">
                                            <div className="flex items-center gap-2">
                                                <Users className="w-4 h-4" />
                                                Team visible
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="admin_only">
                                            <div className="flex items-center gap-2">
                                                <Lock className="w-4 h-4" />
                                                Admin only
                                            </div>
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            )}
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="sm" onClick={() => setShowAddForm(false)}>
                                Cancel
                            </Button>
                            <Button size="sm" onClick={handleSubmit} disabled={!newNote.content.trim()}>
                                Save Note
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Notes List */}
            {isLoading ? (
                <div className="text-center py-8 text-gray-500">Loading notes...</div>
            ) : sortedNotes.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                    <MessageSquare className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p>No notes yet</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {sortedNotes.map(note => {
                        const config = noteTypeConfig[note.note_type] || noteTypeConfig.internal;
                        const Icon = config.icon;
                        const isOwner = note.created_by === currentUser?.email;

                        return (
                            <Card key={note.id} className={`${note.is_pinned ? 'border-yellow-300 bg-yellow-50/30' : ''}`}>
                                <CardContent className="pt-4">
                                    <div className="flex justify-between items-start gap-3">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap mb-2">
                                                <Badge className={config.color}>
                                                    <Icon className="w-3 h-3 mr-1" />
                                                    {config.label}
                                                </Badge>
                                                {note.is_pinned && (
                                                    <Pin className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                                )}
                                                {note.visibility === 'admin_only' && (
                                                    <Badge variant="outline" className="text-xs">
                                                        <Lock className="w-3 h-3 mr-1" />
                                                        Admin only
                                                    </Badge>
                                                )}
                                                {note.rating && renderStars(note.rating)}
                                            </div>
                                            {note.title && (
                                                <h4 className="font-medium mb-1">{note.title}</h4>
                                            )}
                                            <p className="text-sm text-gray-700 whitespace-pre-wrap">{note.content}</p>
                                            <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                                                <span>{note.created_by?.split('@')[0]}</span>
                                                <span>•</span>
                                                <span>{new Date(note.created_date).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                        <div className="flex gap-1">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8"
                                                onClick={() => togglePin(note)}
                                            >
                                                <Pin className={`w-4 h-4 ${note.is_pinned ? 'text-yellow-500 fill-yellow-500' : 'text-gray-400'}`} />
                                            </Button>
                                            {(isOwner || isAdmin) && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                                                    onClick={() => deleteNoteMutation.mutate(note.id)}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}