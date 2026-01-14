import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
    FileText, Zap, Plus, Search, Trash2, Edit2, 
    MessageSquare, Mail, Calendar, HelpCircle, ThumbsUp, X
} from 'lucide-react';
import { toast } from 'sonner';

const CATEGORY_CONFIG = {
    greeting: { label: 'Greetings', icon: MessageSquare, color: 'bg-blue-100 text-blue-700' },
    closing: { label: 'Closings', icon: Mail, color: 'bg-purple-100 text-purple-700' },
    follow_up: { label: 'Follow-up', icon: Calendar, color: 'bg-orange-100 text-orange-700' },
    request_info: { label: 'Request Info', icon: HelpCircle, color: 'bg-yellow-100 text-yellow-700' },
    scheduling: { label: 'Scheduling', icon: Calendar, color: 'bg-green-100 text-green-700' },
    thank_you: { label: 'Thank You', icon: ThumbsUp, color: 'bg-pink-100 text-pink-700' },
    rejection: { label: 'Rejection', icon: X, color: 'bg-red-100 text-red-700' },
    custom: { label: 'Custom', icon: FileText, color: 'bg-gray-100 text-gray-700' },
};

export default function TemplateSnippetPicker({ onInsertSnippet, onApplyTemplate, mode = 'both' }) {
    const [open, setOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [editingSnippet, setEditingSnippet] = useState(null);
    const [newSnippet, setNewSnippet] = useState({ title: '', content: '', category: 'custom', shortcut: '' });
    const queryClient = useQueryClient();

    const { data: templates = [] } = useQuery({
        queryKey: ['emailTemplates'],
        queryFn: () => base44.entities.EmailTemplate.filter({ is_active: true }),
    });

    const { data: snippets = [] } = useQuery({
        queryKey: ['emailSnippets'],
        queryFn: () => base44.entities.EmailSnippet.filter({ is_active: true }),
    });

    const createSnippetMutation = useMutation({
        mutationFn: (data) => base44.entities.EmailSnippet.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['emailSnippets'] });
            setCreateDialogOpen(false);
            setNewSnippet({ title: '', content: '', category: 'custom', shortcut: '' });
            toast.success('Snippet created!');
        },
    });

    const updateSnippetMutation = useMutation({
        mutationFn: ({ id, data }) => base44.entities.EmailSnippet.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['emailSnippets'] });
            setEditingSnippet(null);
            toast.success('Snippet updated!');
        },
    });

    const deleteSnippetMutation = useMutation({
        mutationFn: (id) => base44.entities.EmailSnippet.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['emailSnippets'] });
            toast.success('Snippet deleted');
        },
    });

    const filteredTemplates = templates.filter(t => 
        t.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredSnippets = snippets.filter(s => 
        s.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.content?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const groupedSnippets = filteredSnippets.reduce((acc, snippet) => {
        const cat = snippet.category || 'custom';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(snippet);
        return acc;
    }, {});

    const handleInsertSnippet = (snippet) => {
        onInsertSnippet?.(snippet.content);
        setOpen(false);
        toast.success(`Inserted: ${snippet.title}`);
    };

    const handleApplyTemplate = (template) => {
        onApplyTemplate?.(template);
        setOpen(false);
        toast.success(`Applied template: ${template.name}`);
    };

    return (
        <>
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                        <Zap className="w-4 h-4" />
                        Templates
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0" align="start">
                    <div className="p-3 border-b">
                        <div className="flex items-center gap-2">
                            <Search className="w-4 h-4 text-gray-400" />
                            <Input
                                placeholder="Search templates & snippets..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="border-0 h-8 focus-visible:ring-0 px-0"
                            />
                        </div>
                    </div>

                    <Tabs defaultValue="snippets" className="w-full">
                        <TabsList className="w-full rounded-none border-b h-10">
                            <TabsTrigger value="snippets" className="flex-1 gap-1">
                                <Zap className="w-3 h-3" />
                                Snippets
                            </TabsTrigger>
                            {mode !== 'snippets' && (
                                <TabsTrigger value="templates" className="flex-1 gap-1">
                                    <FileText className="w-3 h-3" />
                                    Templates
                                </TabsTrigger>
                            )}
                        </TabsList>

                        <TabsContent value="snippets" className="m-0">
                            <ScrollArea className="h-[300px]">
                                <div className="p-2 space-y-3">
                                    {Object.entries(groupedSnippets).map(([category, categorySnippets]) => {
                                        const config = CATEGORY_CONFIG[category];
                                        const Icon = config?.icon || FileText;
                                        return (
                                            <div key={category}>
                                                <div className="flex items-center gap-2 px-2 py-1">
                                                    <Icon className="w-3 h-3 text-gray-400" />
                                                    <span className="text-xs font-medium text-gray-500 uppercase">
                                                        {config?.label || category}
                                                    </span>
                                                </div>
                                                {categorySnippets.map((snippet) => (
                                                    <div
                                                        key={snippet.id}
                                                        className="group flex items-start gap-2 p-2 rounded-lg hover:bg-gray-50 cursor-pointer"
                                                        onClick={() => handleInsertSnippet(snippet)}
                                                    >
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-medium text-sm text-gray-900">
                                                                    {snippet.title}
                                                                </span>
                                                                {snippet.shortcut && (
                                                                    <Badge variant="outline" className="text-xs px-1 py-0">
                                                                        {snippet.shortcut}
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                            <p className="text-xs text-gray-500 truncate">
                                                                {snippet.content}
                                                            </p>
                                                        </div>
                                                        <div className="opacity-0 group-hover:opacity-100 flex gap-1">
                                                            <Button
                                                                size="icon"
                                                                variant="ghost"
                                                                className="h-6 w-6"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setEditingSnippet(snippet);
                                                                }}
                                                            >
                                                                <Edit2 className="w-3 h-3" />
                                                            </Button>
                                                            <Button
                                                                size="icon"
                                                                variant="ghost"
                                                                className="h-6 w-6 text-red-500 hover:text-red-600"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    deleteSnippetMutation.mutate(snippet.id);
                                                                }}
                                                            >
                                                                <Trash2 className="w-3 h-3" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        );
                                    })}

                                    {filteredSnippets.length === 0 && (
                                        <div className="text-center py-8 text-gray-500">
                                            <Zap className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                                            <p className="text-sm">No snippets yet</p>
                                        </div>
                                    )}
                                </div>
                            </ScrollArea>
                            <div className="p-2 border-t">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full gap-2"
                                    onClick={() => setCreateDialogOpen(true)}
                                >
                                    <Plus className="w-4 h-4" />
                                    Create New Snippet
                                </Button>
                            </div>
                        </TabsContent>

                        {mode !== 'snippets' && (
                            <TabsContent value="templates" className="m-0">
                                <ScrollArea className="h-[300px]">
                                    <div className="p-2 space-y-1">
                                        {filteredTemplates.map((template) => (
                                            <div
                                                key={template.id}
                                                className="p-3 rounded-lg hover:bg-gray-50 cursor-pointer"
                                                onClick={() => handleApplyTemplate(template)}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <span className="font-medium text-sm text-gray-900">
                                                        {template.name}
                                                    </span>
                                                    <Badge variant="secondary" className="text-xs">
                                                        {template.trigger_type || 'manual'}
                                                    </Badge>
                                                </div>
                                                {template.description && (
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        {template.description}
                                                    </p>
                                                )}
                                                <p className="text-xs text-gray-400 mt-1 truncate">
                                                    Subject: {template.subject}
                                                </p>
                                            </div>
                                        ))}

                                        {filteredTemplates.length === 0 && (
                                            <div className="text-center py-8 text-gray-500">
                                                <FileText className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                                                <p className="text-sm">No templates found</p>
                                            </div>
                                        )}
                                    </div>
                                </ScrollArea>
                            </TabsContent>
                        )}
                    </Tabs>
                </PopoverContent>
            </Popover>

            {/* Create/Edit Snippet Dialog */}
            <Dialog open={createDialogOpen || !!editingSnippet} onOpenChange={(open) => {
                if (!open) {
                    setCreateDialogOpen(false);
                    setEditingSnippet(null);
                }
            }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {editingSnippet ? 'Edit Snippet' : 'Create New Snippet'}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Title</Label>
                            <Input
                                placeholder="e.g., Thank you for applying"
                                value={editingSnippet?.title || newSnippet.title}
                                onChange={(e) => editingSnippet 
                                    ? setEditingSnippet({ ...editingSnippet, title: e.target.value })
                                    : setNewSnippet({ ...newSnippet, title: e.target.value })
                                }
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Category</Label>
                                <Select
                                    value={editingSnippet?.category || newSnippet.category}
                                    onValueChange={(v) => editingSnippet
                                        ? setEditingSnippet({ ...editingSnippet, category: v })
                                        : setNewSnippet({ ...newSnippet, category: v })
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
                                            <SelectItem key={key} value={key}>
                                                {config.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Shortcut (optional)</Label>
                                <Input
                                    placeholder="e.g., /ty"
                                    value={editingSnippet?.shortcut || newSnippet.shortcut}
                                    onChange={(e) => editingSnippet
                                        ? setEditingSnippet({ ...editingSnippet, shortcut: e.target.value })
                                        : setNewSnippet({ ...newSnippet, shortcut: e.target.value })
                                    }
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Content</Label>
                            <Textarea
                                placeholder="Enter the snippet content..."
                                className="min-h-[150px]"
                                value={editingSnippet?.content || newSnippet.content}
                                onChange={(e) => editingSnippet
                                    ? setEditingSnippet({ ...editingSnippet, content: e.target.value })
                                    : setNewSnippet({ ...newSnippet, content: e.target.value })
                                }
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => {
                            setCreateDialogOpen(false);
                            setEditingSnippet(null);
                        }}>
                            Cancel
                        </Button>
                        <Button
                            onClick={() => {
                                if (editingSnippet) {
                                    updateSnippetMutation.mutate({
                                        id: editingSnippet.id,
                                        data: {
                                            title: editingSnippet.title,
                                            content: editingSnippet.content,
                                            category: editingSnippet.category,
                                            shortcut: editingSnippet.shortcut,
                                        }
                                    });
                                } else {
                                    createSnippetMutation.mutate(newSnippet);
                                }
                            }}
                            disabled={createSnippetMutation.isPending || updateSnippetMutation.isPending}
                        >
                            {editingSnippet ? 'Save Changes' : 'Create Snippet'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}