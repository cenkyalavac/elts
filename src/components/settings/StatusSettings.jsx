import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, GripVertical, Check, X } from "lucide-react";
import { toast } from "sonner";

const DEFAULT_STATUSES = [
    "New Application",
    "Form Sent",
    "Price Negotiation",
    "Test Sent",
    "Approved",
    "On Hold",
    "Rejected",
    "Red Flag"
];

export default function StatusSettings() {
    const [editingId, setEditingId] = useState(null);
    const [editValue, setEditValue] = useState('');
    const [newStatus, setNewStatus] = useState('');
    const queryClient = useQueryClient();

    const { data: settings = [] } = useQuery({
        queryKey: ['statusSettings'],
        queryFn: async () => {
            const all = await base44.entities.AppSetting.list();
            return all.filter(s => s.category === 'pipeline');
        }
    });

    const statusesSetting = settings.find(s => s.key === 'pipeline_statuses');
    const statuses = statusesSetting?.value 
        ? JSON.parse(statusesSetting.value) 
        : DEFAULT_STATUSES;

    const saveStatusesMutation = useMutation({
        mutationFn: async (newStatuses) => {
            if (statusesSetting) {
                await base44.entities.AppSetting.update(statusesSetting.id, {
                    value: JSON.stringify(newStatuses)
                });
            } else {
                await base44.entities.AppSetting.create({
                    key: 'pipeline_statuses',
                    value: JSON.stringify(newStatuses),
                    category: 'pipeline',
                    description: 'Custom pipeline status names'
                });
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['statusSettings'] });
            toast.success('Status updated');
        }
    });

    const handleEdit = (index, currentValue) => {
        setEditingId(index);
        setEditValue(currentValue);
    };

    const handleSaveEdit = (index) => {
        if (!editValue.trim()) return;
        const newStatuses = [...statuses];
        newStatuses[index] = editValue.trim();
        saveStatusesMutation.mutate(newStatuses);
        setEditingId(null);
        setEditValue('');
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setEditValue('');
    };

    const handleDelete = (index) => {
        if (confirm('Are you sure you want to delete this status? Existing freelancers with this status will need to be updated.')) {
            const newStatuses = statuses.filter((_, i) => i !== index);
            saveStatusesMutation.mutate(newStatuses);
        }
    };

    const handleAddNew = () => {
        if (!newStatus.trim()) return;
        const newStatuses = [...statuses, newStatus.trim()];
        saveStatusesMutation.mutate(newStatuses);
        setNewStatus('');
    };

    const handleResetDefaults = () => {
        if (confirm('Reset to default statuses? This will not affect existing freelancer statuses.')) {
            saveStatusesMutation.mutate(DEFAULT_STATUSES);
        }
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>Pipeline Statuses</CardTitle>
                        <CardDescription>
                            Customize the status names for your freelancer pipeline
                        </CardDescription>
                    </div>
                    <Button variant="outline" size="sm" onClick={handleResetDefaults}>
                        Reset to Defaults
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    {statuses.map((status, index) => (
                        <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border">
                            <GripVertical className="w-4 h-4 text-gray-400" />
                            {editingId === index ? (
                                <>
                                    <Input
                                        value={editValue}
                                        onChange={(e) => setEditValue(e.target.value)}
                                        className="flex-1"
                                        autoFocus
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') handleSaveEdit(index);
                                            if (e.key === 'Escape') handleCancelEdit();
                                        }}
                                    />
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-8 w-8 text-green-600"
                                        onClick={() => handleSaveEdit(index)}
                                    >
                                        <Check className="w-4 h-4" />
                                    </Button>
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-8 w-8"
                                        onClick={handleCancelEdit}
                                    >
                                        <X className="w-4 h-4" />
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <div className="flex-1">
                                        <Badge variant="outline" className="text-sm">
                                            {status}
                                        </Badge>
                                    </div>
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-8 w-8"
                                        onClick={() => handleEdit(index, status)}
                                    >
                                        <Pencil className="w-4 h-4" />
                                    </Button>
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-8 w-8 text-red-600"
                                        onClick={() => handleDelete(index)}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </>
                            )}
                        </div>
                    ))}
                </div>

                <div className="flex gap-2 pt-4 border-t">
                    <Input
                        placeholder="Add new status..."
                        value={newStatus}
                        onChange={(e) => setNewStatus(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleAddNew();
                        }}
                    />
                    <Button onClick={handleAddNew} disabled={!newStatus.trim()}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Status
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}