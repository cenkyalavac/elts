import React from 'react';
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { createPageUrl } from "../../utils";
import { 
    Megaphone, Pin, ExternalLink, ChevronRight,
    Sparkles, Share2, Settings, AlertTriangle
} from "lucide-react";

const typeConfig = {
    general: { color: 'bg-gray-100 text-gray-800', icon: Megaphone },
    new_resource: { color: 'bg-green-100 text-green-800', icon: Sparkles },
    linkedin_post: { color: 'bg-blue-100 text-blue-800', icon: Share2 },
    system_update: { color: 'bg-purple-100 text-purple-800', icon: Settings },
    urgent: { color: 'bg-red-100 text-red-800', icon: AlertTriangle },
};

export default function AnnouncementsBanner() {
    const { data: user } = useQuery({
        queryKey: ['currentUser'],
        queryFn: () => base44.auth.me(),
    });

    const { data: announcements = [] } = useQuery({
        queryKey: ['announcements'],
        queryFn: () => base44.entities.Announcement.list('-created_date', 5),
        staleTime: 60000,
    });

    // Filter visible announcements
    const visibleAnnouncements = announcements.filter(a => {
        if (!a.is_active) return false;
        if (a.expires_at && new Date(a.expires_at) < new Date()) return false;
        if (a.target_roles?.includes('all')) return true;
        return a.target_roles?.includes(user?.role);
    });

    const pinnedAnnouncements = visibleAnnouncements.filter(a => a.is_pinned);
    const recentAnnouncements = visibleAnnouncements.filter(a => !a.is_pinned).slice(0, 2);

    if (visibleAnnouncements.length === 0) {
        return null;
    }

    return (
        <div className="space-y-3 mb-6">
            {/* Urgent/Pinned Announcements */}
            {pinnedAnnouncements.map(announcement => {
                const typeInfo = typeConfig[announcement.type] || typeConfig.general;
                const TypeIcon = typeInfo.icon;
                
                return (
                    <div 
                        key={announcement.id}
                        className={`rounded-lg p-4 border ${
                            announcement.type === 'urgent' 
                                ? 'bg-red-50 border-red-200' 
                                : 'bg-blue-50 border-blue-200'
                        }`}
                    >
                        <div className="flex items-start gap-3">
                            <div className={`p-2 rounded-full ${
                                announcement.type === 'urgent' ? 'bg-red-100' : 'bg-blue-100'
                            }`}>
                                <TypeIcon className={`w-4 h-4 ${
                                    announcement.type === 'urgent' ? 'text-red-600' : 'text-blue-600'
                                }`} />
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <Pin className="w-3 h-3 text-blue-600" />
                                    <span className="text-xs font-medium text-gray-600">Pinned</span>
                                </div>
                                <h4 className="font-semibold text-gray-900">{announcement.title}</h4>
                                <p className="text-sm text-gray-700 mt-1 line-clamp-2">
                                    {announcement.content}
                                </p>
                                {announcement.link_url && (
                                    <a 
                                        href={announcement.link_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline mt-2"
                                    >
                                        <ExternalLink className="w-3 h-3" />
                                        View Link
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })}

            {/* Recent Announcements Summary */}
            {recentAnnouncements.length > 0 && (
                <div className="bg-white rounded-lg border p-4">
                    <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-gray-900 flex items-center gap-2">
                            <Megaphone className="w-4 h-4 text-blue-600" />
                            Recent Announcements
                        </h4>
                        <Link 
                            to={createPageUrl('Announcements')}
                            className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                        >
                            View All
                            <ChevronRight className="w-4 h-4" />
                        </Link>
                    </div>
                    <div className="space-y-2">
                        {recentAnnouncements.map(announcement => {
                            const typeInfo = typeConfig[announcement.type] || typeConfig.general;
                            
                            return (
                                <div key={announcement.id} className="flex items-center gap-3 py-2 border-b last:border-0">
                                    <Badge className={`${typeInfo.color} text-xs`}>
                                        {announcement.type.replace('_', ' ')}
                                    </Badge>
                                    <span className="text-sm text-gray-900 flex-1 truncate">
                                        {announcement.title}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                        {new Date(announcement.created_date).toLocaleDateString()}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}