import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Command } from 'cmdk';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '../../utils';
import { Search, User, Briefcase, GraduationCap, Loader2 } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';

export default function GlobalSearch() {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const navigate = useNavigate();

    // Listen for Cmd+K / Ctrl+K
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setOpen((prev) => !prev);
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Fetch data
    const { data: freelancers = [], isLoading: loadingFreelancers } = useQuery({
        queryKey: ['globalSearch', 'freelancers'],
        queryFn: () => base44.entities.Freelancer.list('-created_date', 100),
        enabled: open,
        staleTime: 60000,
    });

    const { data: positions = [], isLoading: loadingPositions } = useQuery({
        queryKey: ['globalSearch', 'positions'],
        queryFn: () => base44.entities.OpenPosition.filter({ is_active: true }),
        enabled: open,
        staleTime: 60000,
    });

    const { data: ninjaPrograms = [], isLoading: loadingNinja } = useQuery({
        queryKey: ['globalSearch', 'ninjaPrograms'],
        queryFn: () => base44.entities.NinjaProgram.list(),
        enabled: open,
        staleTime: 60000,
    });

    const isLoading = loadingFreelancers || loadingPositions || loadingNinja;

    // Filter results
    const searchLower = search.toLowerCase();
    
    const filteredFreelancers = freelancers.filter(f =>
        f.full_name?.toLowerCase().includes(searchLower) ||
        f.email?.toLowerCase().includes(searchLower)
    ).slice(0, 5);

    const filteredPositions = positions.filter(p =>
        p.title?.toLowerCase().includes(searchLower)
    ).slice(0, 5);

    const filteredNinja = ninjaPrograms.filter(n =>
        n.name?.toLowerCase().includes(searchLower)
    ).slice(0, 5);

    const handleSelect = useCallback((type, id) => {
        setOpen(false);
        setSearch('');
        
        if (type === 'freelancer') {
            navigate(createPageUrl(`FreelancerDetail?id=${id}`));
        } else if (type === 'position') {
            navigate(createPageUrl(`Position?id=${id}`));
        } else if (type === 'ninja') {
            navigate(createPageUrl(`NinjaPrograms?id=${id}`));
        }
    }, [navigate]);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="p-0 overflow-hidden max-w-lg">
                <Command className="rounded-lg border-none" shouldFilter={false}>
                    <div className="flex items-center border-b px-3">
                        <Search className="w-4 h-4 text-gray-400 mr-2 shrink-0" />
                        <Command.Input
                            value={search}
                            onValueChange={setSearch}
                            placeholder="Search freelancers, positions, programs..."
                            className="flex h-11 w-full bg-transparent py-3 text-sm outline-none placeholder:text-gray-400"
                        />
                        {isLoading && <Loader2 className="w-4 h-4 animate-spin text-gray-400" />}
                    </div>
                    <Command.List className="max-h-80 overflow-y-auto p-2">
                        <Command.Empty className="py-6 text-center text-sm text-gray-500">
                            {search ? 'No results found.' : 'Start typing to search...'}
                        </Command.Empty>

                        {filteredFreelancers.length > 0 && (
                            <Command.Group heading="Freelancers" className="text-xs text-gray-500 px-2 py-1.5">
                                {filteredFreelancers.map((f) => (
                                    <Command.Item
                                        key={f.id}
                                        value={`freelancer-${f.id}`}
                                        onSelect={() => handleSelect('freelancer', f.id)}
                                        className="flex items-center gap-2 px-2 py-2 rounded-md cursor-pointer hover:bg-gray-100 aria-selected:bg-gray-100"
                                    >
                                        <User className="w-4 h-4 text-purple-600" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">{f.full_name}</p>
                                            <p className="text-xs text-gray-500 truncate">{f.email}</p>
                                        </div>
                                    </Command.Item>
                                ))}
                            </Command.Group>
                        )}

                        {filteredPositions.length > 0 && (
                            <Command.Group heading="Open Positions" className="text-xs text-gray-500 px-2 py-1.5">
                                {filteredPositions.map((p) => (
                                    <Command.Item
                                        key={p.id}
                                        value={`position-${p.id}`}
                                        onSelect={() => handleSelect('position', p.id)}
                                        className="flex items-center gap-2 px-2 py-2 rounded-md cursor-pointer hover:bg-gray-100 aria-selected:bg-gray-100"
                                    >
                                        <Briefcase className="w-4 h-4 text-blue-600" />
                                        <p className="text-sm font-medium truncate">{p.title}</p>
                                    </Command.Item>
                                ))}
                            </Command.Group>
                        )}

                        {filteredNinja.length > 0 && (
                            <Command.Group heading="Ninja Programs" className="text-xs text-gray-500 px-2 py-1.5">
                                {filteredNinja.map((n) => (
                                    <Command.Item
                                        key={n.id}
                                        value={`ninja-${n.id}`}
                                        onSelect={() => handleSelect('ninja', n.id)}
                                        className="flex items-center gap-2 px-2 py-2 rounded-md cursor-pointer hover:bg-gray-100 aria-selected:bg-gray-100"
                                    >
                                        <GraduationCap className="w-4 h-4 text-orange-600" />
                                        <p className="text-sm font-medium truncate">{n.name}</p>
                                    </Command.Item>
                                ))}
                            </Command.Group>
                        )}
                    </Command.List>
                    <div className="border-t px-3 py-2 text-xs text-gray-400 flex items-center gap-4">
                        <span><kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-500">↑↓</kbd> Navigate</span>
                        <span><kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-500">Enter</kbd> Select</span>
                        <span><kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-500">Esc</kbd> Close</span>
                    </div>
                </Command>
            </DialogContent>
        </Dialog>
    );
}