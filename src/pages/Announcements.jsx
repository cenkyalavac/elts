import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { 
    Megaphone, Plus, Pin, ExternalLink, Pencil, Trash2, 
    Calendar, User, AlertTriangle, Sparkles, Share2, Settings
} from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from 'react-markdown';

const typeConfig = {
    general: { label: 'General', color: 'bg-gray-100 text-gray-800', icon: Megaphone },
    new_resource: { label: 'New Resource', color: 'bg-green-100 text-green-800', icon: Sparkles },
    linkedin_post: { label: 'LinkedIn Post', color: 'bg-blue-100 text-blue-800', icon: Share2 },
    system_update: { label: 'System Update', color: 'bg-purple-100 text-purple-800', icon: Settings },
    urgent: { label: 'Urgent', color: 'bg-red-100 text-red-800', icon: AlertTriangle },
};

export default function AnnouncementsPage() {
    const [showForm, setShowForm] = useState(false);
    const [editingAnnouncement, setEditingAnnouncement] = useState(null);
    const queryClient = useQueryClient();

    const { data: user } = useQuery({
        queryKey: ['currentUser'],
        queryFn: () => base44.auth.me(),
    });

    const { data: announcements = [], isLoading } = useQuery({
        queryKey: ['announcements'],
        queryFn: () => base44.entities.Announcement.list('-created_date'),
    });

    const isAdmin = user?.role === 'admin';
    const isProjectManager = user?.role === 'project_manager';
    const canManage = isAdmin || isProjectManager;

    // Filter announcements based on user role
    const visibleAnnouncements = announcements.filter(a => {
        if (!a.is_active) return canManage; // Only admins/PMs see inactive
        if (a.expires_at && new Date(a.expires_at) < new Date()) return canManage;
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
                        <Button onClick={() => { setEditingAnnouncement(null); setShowForm(true); }}>
                            <Plus className="w-4 h-4 mr-2" />
                            New Announcement
                        </Button>
                    )}
                </div>

                {isLoading ? (
                    <div className="space-y-4">
                        {[1,2,3].map(i => (
                            <div key={i} className="h-32 bg-white rounded-lg animate-pulse" />
                        ))}
                    </div>
                ) : visibleAnnouncements.length === 0 ? (
                    <Card>
                        <CardContent className="py-12 text-center">
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
                                        onEdit={() => { setEditingAnnouncement(announcement); setShowForm(true); }}
                                    />
                                ))}
                            </div>
                        )}

                        {/* Regular Announcements */}
                        {regularAnnouncements.length > 0 && (
                            <div className="space-y-4">
                                {pinnedAnnouncements.length > 0 && (
                                    <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                                        Earlier Announcements
                                    </h2>
                                )}
                                {regularAnnouncements.map(announcement => (
                                    <AnnouncementCard 
                                        key={announcement.id} 
                                        announcement={announcement}
                                        canManage={canManage}
                                        onEdit={() => { setEditingAnnouncement(announcement); setShowForm(true); }}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                )}

                <AnnouncementFormDialog
                    open={showForm}
                    onOpenChange={setShowForm}
                    announcement={editingAnnouncement}
                    userName={user?.full_name}
                />
            </div>
        </div>
    );
}

function AnnouncementCard({ announcement, canManage, onEdit }) {
    const queryClient = useQueryClient();
    const typeInfo = typeConfig[announcement.type] || typeConfig.general;
    const TypeIcon = typeInfo.icon;

    const deleteMutation = useMutation({
        mutationFn: () => base44.entities.Announcement.delete(announcement.id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['announcements'] });
            toast.success('Announcement deleted');
        },
    });

    const isExpired = announcement.expires_at && new Date(announcement.expires_at) < new Date();

    return (
        <Card className={`${announcement.is_pinned ? 'border-blue-300 bg-blue-50/30' : ''} ${!announcement.is_active || isExpired ? 'opacity-60' : ''}`}>
            <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                            {announcement.is_pinned && (
                                <Pin className="w-4 h-4 text-blue-600" />
                            )}
                            <Badge className={typeInfo.color}>
                                <TypeIcon className="w-3 h-3 mr-1" />
                                {typeInfo.label}
                            </Badge>
                            {!announcement.is_active && (
                                <Badge variant="secondary">Inactive</Badge>
                            )}
                            {isExpired && (
                                <Badge variant="secondary">Expired</Badge>
                            )}
                            <span className="text-xs text-gray-500">
                                {announcement.target_roles?.includes('all') ? 'Everyone' : announcement.target_roles?.join(', ')}
                            </span>
                        </div>
                        
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            {announcement.title}
                        </h3>
                        
                        <div className="prose prose-sm max-w-none text-gray-700">
                            <ReactMarkdown>{announcement.content}</ReactMarkdown>
                        </div>

                        {announcement.link_url && (
                            <a 
                                href={announcement.link_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 mt-3 text-blue-600 hover:underline text-sm"
                            >
                                <ExternalLink className="w-4 h-4" />
                                View Link
                            </a>
                        )}

                        <div className="flex items-center gap-4 mt-4 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                                <User className="w-3 h-3" />
                                {announcement.author_name || 'System'}
                            </span>
                            <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {new Date(announcement.created_date).toLocaleDateString()}
                            </span>
                        </div>
                    </div>

                    {canManage && (
                        <div className="flex gap-1">
                            <Button size="sm" variant="ghost" onClick={onEdit}>
                                <Pencil className="w-4 h-4" />
                            </Button>
                            <Button 
                                size="sm" 
                                variant="ghost" 
                                onClick={() => {
                                    if (confirm('Delete this announcement?')) {
                                        deleteMutation.mutate();
                                    }
                                }}
                            >
                                <Trash2 className="w-4 h-4 text-red-600" />
                            </Button>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

function AnnouncementFormDialog({ open, onOpenChange, announcement, userName }) {
    const queryClient = useQueryClient();
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        type: 'general',
        target_roles: ['all'],
        is_pinned: false,
        is_active: true,
        link_url: '',
        expires_at: '',
    });

    React.useEffect(() => {
        if (announcement) {
            setFormData({
                title: announcement.title || '',
                content: announcement.content || '',
                type: announcement.type || 'general',
                target_roles: announcement.target_roles || ['all'],
                is_pinned: announcement.is_pinned || false,
                is_active: announcement.is_active !== false,
                link_url: announcement.link_url || '',
                expires_at: announcement.expires_at ? announcement.expires_at.split('T')[0] : '',
            });
        } else {
            setFormData({
                title: '',
                content: '',
                type: 'general',
                target_roles: ['all'],
                is_pinned: false,
                is_active: true,
                link_url: '',
                expires_at: '',
            });
        }
    }, [announcement, open]);

    const saveMutation = useMutation({
        mutationFn: (data) => {
            const payload = {
                ...data,
                author_name: userName,
                expires_at: data.expires_at ? new Date(data.expires_at).toISOString() : null,
            };
            if (announcement) {
                return base44.entities.Announcement.update(announcement.id, payload);
            }
            return base44.entities.Announcement.create(payload);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['announcements'] });
            onOpenChange(false);
            toast.success(announcement ? 'Announcement updated' : 'Announcement created');
        },
    });

    const toggleRole = (role) => {
        if (role === 'all') {
            setFormData({ ...formData, target_roles: ['all'] });
        } else {
            let newRoles = formData.target_roles.filter(r => r !== 'all');
            if (newRoles.includes(role)) {
                newRoles = newRoles.filter(r => r !== role);
            } else {
                newRoles.push(role);
            }
            setFormData({ ...formData, target_roles: newRoles.length ? newRoles : ['all'] });
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>
                        {announcement ? 'Edit Announcement' : 'New Announcement'}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    <div>
                        <label className="text-sm font-medium">Title</label>
                        <Input
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            placeholder="Announcement title"
                        />
                    </div>

                    <div>
                        <label className="text-sm font-medium">Content (Markdown supported)</label>
                        <Textarea
                            value={formData.content}
                            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                            placeholder="Write your announcement..."
                            rows={6}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium">Type</label>
                            <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v })}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="general">General</SelectItem>
                                    <SelectItem value="new_resource">New Resource</SelectItem>
                                    <SelectItem value="linkedin_post">LinkedIn Post</SelectItem>
                                    <SelectItem value="system_update">System Update</SelectItem>
                                    <SelectItem value="urgent">Urgent</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <label className="text-sm font-medium">Link URL (optional)</label>
                            <Input
                                value={formData.link_url}
                                onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
                                placeholder="https://..."
                            />
                        </div>
                    </div>

                    <div>
                        <label className="text-sm font-medium mb-2 block">Target Audience</label>
                        <div className="flex flex-wrap gap-4">
                            {['all', 'admin', 'project_manager', 'applicant'].map(role => (
                                <label key={role} className="flex items-center gap-2">
                                    <Checkbox
                                        checked={formData.target_roles.includes(role)}
                                        onCheckedChange={() => toggleRole(role)}
                                    />
                                    <span className="text-sm capitalize">{role === 'all' ? 'Everyone' : role.replace('_', ' ')}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium">Expires (optional)</label>
                            <Input
                                type="date"
                                value={formData.expires_at}
                                onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                            />
                        </div>
                        <div className="flex items-end gap-6">
                            <label className="flex items-center gap-2">
                                <Checkbox
                                    checked={formData.is_pinned}
                                    onCheckedChange={(c) => setFormData({ ...formData, is_pinned: c })}
                                />
                                <span className="text-sm">Pin to top</span>
                            </label>
                            <label className="flex items-center gap-2">
                                <Checkbox
                                    checked={formData.is_active}
                                    onCheckedChange={(c) => setFormData({ ...formData, is_active: c })}
                                />
                                <span className="text-sm">Active</span>
                            </label>
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                        <Button variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button 
                            onClick={() => saveMutation.mutate(formData)}
                            disabled={!formData.title || !formData.content || saveMutation.isPending}
                        >
                            {announcement ? 'Update' : 'Create'}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}