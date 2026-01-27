import React, { useState, useEffect } from 'react';
import { Command } from 'cmdk';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '../../utils';
import { 
    Users, Settings, DollarSign, FileText, Plus, Upload, 
    LayoutDashboard, Briefcase, Star, MessageSquare, Megaphone,
    HelpCircle, Search, GraduationCap, Mail
} from 'lucide-react';

const pages = [
    { name: 'Dashboard', label: 'Go to Dashboard', icon: LayoutDashboard },
    { name: 'Freelancers', label: 'Go to Freelancers', icon: Users },
    { name: 'OpenPositions', label: 'Go to Positions', icon: Briefcase },
    { name: 'QualityManagement', label: 'Go to Quality Management', icon: Star },
    { name: 'SmartcatIntegration', label: 'Go to Payments', icon: DollarSign },
    { name: 'DocumentCompliance', label: 'Go to Documents', icon: FileText },
    { name: 'Messages', label: 'Go to Messages', icon: MessageSquare },
    { name: 'Announcements', label: 'Go to Announcements', icon: Megaphone },
    { name: 'Support', label: 'Go to Support', icon: HelpCircle },
    { name: 'NinjaPrograms', label: 'Go to Ninja Programs', icon: GraduationCap },
    { name: 'Settings', label: 'Go to Settings', icon: Settings },
    { name: 'Inbox', label: 'Go to Gmail Inbox', icon: Mail },
];

const actions = [
    { id: 'new-freelancer', label: 'Create New Freelancer', icon: Plus, page: 'FreelancerOnboarding' },
    { id: 'upload-document', label: 'Upload Document', icon: Upload, page: 'DocumentCompliance' },
    { id: 'import-freelancers', label: 'Import Freelancers', icon: Upload, page: 'ImportFreelancers' },
    { id: 'new-position', label: 'Create New Position', icon: Plus, page: 'OpenPositions' },
];

export default function CommandPalette({ open, onOpenChange }) {
    const [search, setSearch] = useState('');

    const { data: freelancers = [] } = useQuery({
        queryKey: ['freelancers-command'],
        queryFn: () => base44.entities.Freelancer.list('-created_date', 100),
        enabled: open,
        staleTime: 60000,
    });

    const filteredFreelancers = freelancers.filter(f => {
        if (!search) return true;
        const searchLower = search.toLowerCase();
        return (
            f.full_name?.toLowerCase().includes(searchLower) ||
            f.email?.toLowerCase().includes(searchLower)
        );
    }).slice(0, 8);

    const handleSelect = (value) => {
        onOpenChange(false);
        setSearch('');
        
        if (value.startsWith('page:')) {
            const pageName = value.replace('page:', '');
            window.location.href = createPageUrl(pageName);
        } else if (value.startsWith('action:')) {
            const action = actions.find(a => a.id === value.replace('action:', ''));
            if (action) {
                window.location.href = createPageUrl(action.page);
            }
        } else if (value.startsWith('freelancer:')) {
            const freelancerId = value.replace('freelancer:', '');
            window.location.href = createPageUrl('FreelancerDetail') + `?id=${freelancerId}`;
        }
    };

    useEffect(() => {
        if (!open) setSearch('');
    }, [open]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50">
            <div 
                className="fixed inset-0 bg-black/50 backdrop-blur-sm"
                onClick={() => onOpenChange(false)}
            />
            <div className="fixed left-1/2 top-[20%] -translate-x-1/2 w-full max-w-xl">
                <Command
                    className="bg-white rounded-xl shadow-2xl border overflow-hidden"
                    shouldFilter={false}
                >
                    <div className="flex items-center border-b px-4">
                        <Search className="w-5 h-5 text-gray-400 mr-3" />
                        <Command.Input
                            value={search}
                            onValueChange={setSearch}
                            placeholder="Search freelancers, pages, or actions..."
                            className="flex-1 h-14 text-base outline-none bg-transparent"
                            autoFocus
                        />
                        <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 text-xs text-gray-400 bg-gray-100 rounded">
                            ESC
                        </kbd>
                    </div>
                    <Command.List className="max-h-80 overflow-y-auto p-2">
                        <Command.Empty className="py-6 text-center text-gray-500">
                            No results found.
                        </Command.Empty>

                        {filteredFreelancers.length > 0 && (
                            <Command.Group heading="Freelancers" className="mb-2">
                                <p className="px-2 py-1.5 text-xs font-medium text-gray-500">Freelancers</p>
                                {filteredFreelancers.map(freelancer => (
                                    <Command.Item
                                        key={freelancer.id}
                                        value={`freelancer:${freelancer.id}`}
                                        onSelect={handleSelect}
                                        className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer hover:bg-gray-100 data-[selected=true]:bg-purple-50 data-[selected=true]:text-purple-900"
                                    >
                                        <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 text-sm font-medium">
                                            {freelancer.full_name?.charAt(0) || '?'}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-medium truncate">{freelancer.full_name}</div>
                                            <div className="text-xs text-gray-500 truncate">{freelancer.email}</div>
                                        </div>
                                        <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600">
                                            {freelancer.status}
                                        </span>
                                    </Command.Item>
                                ))}
                            </Command.Group>
                        )}

                        <Command.Group heading="Pages" className="mb-2">
                            <p className="px-2 py-1.5 text-xs font-medium text-gray-500">Pages</p>
                            {pages.map(page => (
                                <Command.Item
                                    key={page.name}
                                    value={`page:${page.name}`}
                                    onSelect={handleSelect}
                                    className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer hover:bg-gray-100 data-[selected=true]:bg-purple-50 data-[selected=true]:text-purple-900"
                                >
                                    <page.icon className="w-5 h-5 text-gray-400" />
                                    <span>{page.label}</span>
                                </Command.Item>
                            ))}
                        </Command.Group>

                        <Command.Group heading="Actions">
                            <p className="px-2 py-1.5 text-xs font-medium text-gray-500">Actions</p>
                            {actions.map(action => (
                                <Command.Item
                                    key={action.id}
                                    value={`action:${action.id}`}
                                    onSelect={handleSelect}
                                    className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer hover:bg-gray-100 data-[selected=true]:bg-purple-50 data-[selected=true]:text-purple-900"
                                >
                                    <action.icon className="w-5 h-5 text-gray-400" />
                                    <span>{action.label}</span>
                                </Command.Item>
                            ))}
                        </Command.Group>
                    </Command.List>
                </Command>
            </div>
        </div>
    );
}