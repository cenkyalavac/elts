import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { 
    Megaphone, Plus, Pin, ExternalLink, Pencil, Trash2, 
    Calendar, User, AlertTriangle, Linkedin, FileText, Settings
} from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from 'react-markdown';

const typeConfig = {
    general: { label: 'General', color: 'bg-blue-100 text-blue-800', icon: Megaphone },
    new_resource: { label: 'New Resource', color: 'bg-green-100 text-green-800', icon: User },
    linkedin_post: { label: 'LinkedIn Post', color: 'bg-indigo-100 text-indigo-800', icon: Linkedin },
    system_update: { label: 'System Update', color: 'bg-purple-100 text-purple-800', icon: Settings },
    urgent: { label: 'Urgent', color: 'bg-red-100 text-red-800', icon: AlertTriangle },
};

export default function AnnouncementsPage() {
    const [showForm, setShowForm] = useState(false);
    const [editingAnnouncement, setEditingAnnouncement] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        type: 'general',
        target_roles: ['all'],
        is_pinned: false,
        link_url: '',
    });

    const queryClient = useQueryClient();

    const { data: user } = useQuery({
        queryKey: ['currentUser'],
        queryFn: () => base44.auth.me(),
    });

    const { data: announcements = [], isLoading } = useQuery({
        queryKey: ['announcements'],
        queryFn: () => base44.entities.Announcement.list('-created_date'),
    });

    const createMutation = useMutation({
        mutationFn: (data) => base44.entities.Announcement.create({
            ...data,
            author_name: user?.full_name || user?.email
        }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['announcements'] });
            resetForm();
            toast.success('Announcement created');
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }) => base44.entities.Announcement.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['announcements'] });
            resetForm();
            toast.success('Announcement updated');
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id) => base44.entities.Announcement.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['announcements'] });
            toast.success('Announcement deleted');
        },
    });

    const resetForm = () => {
        setShowForm(false);
        setEditingAnnouncement(null);
        setFormData({
            title: '',
            content: '',
            type: 'general',
            target_roles: ['all'],
            is_pinned: false,
            link_url: '',
        });
    };

    const handleEdit = (announcement) => {
        setEditingAnnouncement(announcement);
        setFormData({
            title: announcement.title,
            content: announcement.content,
            type: announcement.type || 'general',
            target_roles: announcement.target_roles || ['all'],
            is_pinned: announcement.is_pinned || false,
            link_url: announcement.link_url || '',
        });
        setShowForm(true);
    };

    const handleSubmit = () => {
        if (!formData.title || !formData.content) {
            toast.error('Please fill in title and content');
            return;
        }
        if (editingAnnouncement) {
            updateMutation.mutate({ id: editingAnnouncement.id, data: formData });
        } else {
            createMutation.mutate(formData);
        }
    };

    const handleRoleToggle = (role) => {
        setFormData(prev => {
            let newRoles = [...prev.target_roles];
            if (role === 'all') {
                newRoles = ['all'];
            } else {
                newRoles = newRoles.filter(r => r !== 'all');
                if (newRoles.includes(role)) {
                    newRoles = newRoles.filter(r => r !== role);
                } else {
                    newRoles.push(role);
                }
                if (newRoles.length === 0) newRoles = ['all'];
            }
            return { ...prev, target_roles: newRoles };
        });
    };

    const isAdmin = user?.role === 'admin';
    const isPM = user?.role === 'project_manager';
    const canManage = isAdmin || isPM;

    // Filter announcements based on user role
    const visibleAnnouncements = announcements.filter(a => {
        if (!a.is_active) return canManage; // Only admins see inactive
        if (a.target_roles?.includes('all')) return true;
        return a.target_roles?.includes(user?.role);
    });

    const pinnedAnnouncements = visibleAnnouncements.filter(a => a.is_pinned && a.is_active);
    const regularAnnouncements = visibleAnnouncements.filter(a => !a.is_pinned || !a.is_active);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
            <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                            <Megaphone className="w-8 h-8 text-blue-600" />
                            Announcements
                        </h1>
                        <p className="text-gray-600 mt-1">
                            Stay updated with the latest news and updates
                        </p>
                    </div>
                    {canManage && (
                        <Button onClick={() => setShowForm(true)} className="gap-2">
                            <Plus className="w-4 h-4" />
                            New Announcement
                        </Button>
                    )}
                </div>

                {isLoading ? (
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    </div>
                ) : visibleAnnouncements.length === 0 ? (
                    <Card>
                        <CardContent className="text-center py-12">
                            <Megaphone className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-600">No announcements yet</p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-6">
                        {/* Pinned Announcements */}
                        {pinnedAnnouncements.length > 0 && (
                            <div className="space-y-4">
                                {pinnedAnnouncements.map(announcement => (
                                    <AnnouncementCard
                                        key={announcement.id}
                                        announcement={announcement}
                                        canManage={canManage}
                                        onEdit={handleEdit}
                                        onDelete={(id) => deleteMutation.mutate(id)}
                                        onToggleActive={(id, active) => updateMutation.mutate({ id, data: { is_active: active } })}
                                    />
                                ))}
                            </div>
                        )}

                        {/* Regular Announcements */}
                        {regularAnnouncements.length > 0 && (
                            <div className="space-y-4">
                                {regularAnnouncements.map(announcement => (
                                    <AnnouncementCard
                                        key={announcement.id}
                                        announcement={announcement}
                                        canManage={canManage}
                                        onEdit={handleEdit}
                                        onDelete={(id) => deleteMutation.mutate(id)}
                                        onToggleActive={(id, active) => updateMutation.mutate({ id, data: { is_active: active } })}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Create/Edit Dialog */}
            <Dialog open={showForm} onOpenChange={(open) => !open && resetForm()}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            {editingAnnouncement ? 'Edit Announcement' : 'New Announcement'}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div>
                            <Label>Title</Label>
                            <Input
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                placeholder="Announcement title"
                            />
                        </div>

                        <div>
                            <Label>Content (Markdown supported)</Label>
                            <Textarea
                                value={formData.content}
                                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                placeholder="Write your announcement..."
                                rows={6}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Type</Label>
                                <Select
                                    value={formData.type}
                                    onValueChange={(v) => setFormData({ ...formData, type: v })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Object.entries(typeConfig).map(([key, config]) => (
                                            <SelectItem key={key} value={key}>
                                                {config.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label>Link URL (optional)</Label>
                                <Input
                                    value={formData.link_url}
                                    onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
                                    placeholder="https://..."
                                />
                            </div>
                        </div>

                        <div>
                            <Label className="mb-2 block">Visible to</Label>
                            <div className="flex flex-wrap gap-4">
                                {[
                                    { value: 'all', label: 'Everyone' },
                                    { value: 'admin', label: 'Admins' },
                                    { value: 'project_manager', label: 'Project Managers' },
                                    { value: 'applicant', label: 'Applicants' },
                                ].map(role => (
                                    <div key={role.value} className="flex items-center gap-2">
                                        <Checkbox
                                            checked={formData.target_roles.includes(role.value)}
                                            onCheckedChange={() => handleRoleToggle(role.value)}
                                        />
                                        <span className="text-sm">{role.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Checkbox
                                checked={formData.is_pinned}
                                onCheckedChange={(checked) => setFormData({ ...formData, is_pinned: checked })}
                            />
                            <Label className="cursor-pointer">Pin this announcement</Label>
                        </div>

                        <div className="flex justify-end gap-2 pt-4">
                            <Button variant="outline" onClick={resetForm}>Cancel</Button>
                            <Button onClick={handleSubmit}>
                                {editingAnnouncement ? 'Update' : 'Publish'}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

function AnnouncementCard({ announcement, canManage, onEdit, onDelete, onToggleActive }) {
    const config = typeConfig[announcement.type] || typeConfig.general;
    const Icon = config.icon;

    return (
        <Card className={`${announcement.is_pinned ? 'border-yellow-300 bg-yellow-50/50' : ''} ${!announcement.is_active ? 'opacity-60' : ''}`}>
            <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                        {announcement.is_pinned && (
                            <Pin className="w-4 h-4 text-yellow-600 mt-1" />
                        )}
                        <div>
                            <CardTitle className="text-lg">{announcement.title}</CardTitle>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                                <Badge className={config.color}>
                                    <Icon className="w-3 h-3 mr-1" />
                                    {config.label}
                                </Badge>
                                {!announcement.is_active && (
                                    <Badge variant="secondary">Inactive</Badge>
                                )}
                                <span className="text-xs text-gray-500 flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {new Date(announcement.created_date).toLocaleDateString()}
                                </span>
                                {announcement.author_name && (
                                    <span className="text-xs text-gray-500">
                                        by {announcement.author_name}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                    {canManage && (
                        <div className="flex items-center gap-1">
                            <Button size="sm" variant="ghost" onClick={() => onEdit(announcement)}>
                                <Pencil className="w-4 h-4" />
                            </Button>
                            <Button 
                                size="sm" 
                                variant="ghost"
                                onClick={() => onToggleActive(announcement.id, !announcement.is_active)}
                            >
                                {announcement.is_active ? 'Hide' : 'Show'}
                            </Button>
                            <Button 
                                size="sm" 
                                variant="ghost"
                                onClick={() => {
                                    if (confirm('Delete this announcement?')) {
                                        onDelete(announcement.id);
                                    }
                                }}
                            >
                                <Trash2 className="w-4 h-4 text-red-600" />
                            </Button>
                        </div>
                    )}
                </div>
            </CardHeader>
            <CardContent>
                <div className="prose prose-sm max-w-none">
                    <ReactMarkdown>{announcement.content}</ReactMarkdown>
                </div>
                {announcement.link_url && (
                    <a 
                        href={announcement.link_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-blue-600 hover:underline mt-3 text-sm"
                    >
                        <ExternalLink className="w-4 h-4" />
                        View Link
                    </a>
                )}
            </CardContent>
        </Card>
    );
}