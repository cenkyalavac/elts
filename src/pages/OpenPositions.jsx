import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Eye, EyeOff } from "lucide-react";
import OpenPositionForm from "../components/positions/OpenPositionForm";
import { toast } from "sonner";

export default function OpenPositionsPage() {
    const [showForm, setShowForm] = useState(false);
    const [editingPosition, setEditingPosition] = useState(null);
    const queryClient = useQueryClient();

    const { data: user } = useQuery({
        queryKey: ['currentUser'],
        queryFn: () => base44.auth.me(),
    });

    const { data: positions = [] } = useQuery({
        queryKey: ['openPositions'],
        queryFn: () => base44.entities.OpenPosition.list('-created_date'),
    });

    const createMutation = useMutation({
        mutationFn: (data) => base44.entities.OpenPosition.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['openPositions'] });
            setShowForm(false);
            toast.success('Position created successfully');
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }) => base44.entities.OpenPosition.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['openPositions'] });
            setShowForm(false);
            setEditingPosition(null);
            toast.success('Position updated successfully');
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id) => base44.entities.OpenPosition.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['openPositions'] });
            toast.success('Position deleted successfully');
        },
    });

    const toggleActiveMutation = useMutation({
        mutationFn: ({ id, is_active }) => base44.entities.OpenPosition.update(id, { is_active }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['openPositions'] });
        },
    });

    const handleSubmit = (data) => {
        if (editingPosition) {
            updateMutation.mutate({ id: editingPosition.id, data });
        } else {
            createMutation.mutate(data);
        }
    };

    const isAdmin = user?.role === 'admin';

    if (!isAdmin) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
                <div className="max-w-4xl mx-auto text-center mt-20">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
                    <p className="text-gray-600">Only administrators can manage open positions.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Open Positions</h1>
                        <p className="text-gray-600 mt-1">Manage your open freelancer positions</p>
                    </div>
                    <Button
                        onClick={() => {
                            setEditingPosition(null);
                            setShowForm(!showForm);
                        }}
                        className="bg-blue-600 hover:bg-blue-700"
                    >
                        <Plus className="w-5 h-5 mr-2" />
                        Add Position
                    </Button>
                </div>

                {showForm && (
                    <div className="mb-6">
                        <OpenPositionForm
                            position={editingPosition}
                            onSubmit={handleSubmit}
                            onCancel={() => {
                                setShowForm(false);
                                setEditingPosition(null);
                            }}
                        />
                    </div>
                )}

                <div className="grid gap-6">
                    {positions.map(position => (
                        <Card key={position.id} className={position.is_active ? '' : 'opacity-60'}>
                            <CardHeader>
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3">
                                            <CardTitle>{position.title}</CardTitle>
                                            {!position.is_active && (
                                                <Badge variant="secondary">Inactive</Badge>
                                            )}
                                            {position.priority === 'high' && (
                                                <Badge variant="destructive">High Priority</Badge>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => toggleActiveMutation.mutate({
                                                id: position.id,
                                                is_active: !position.is_active
                                            })}
                                        >
                                            {position.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => {
                                                setEditingPosition(position);
                                                setShowForm(true);
                                            }}
                                        >
                                            <Edit className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => {
                                                if (confirm('Are you sure you want to delete this position?')) {
                                                    deleteMutation.mutate(position.id);
                                                }
                                            }}
                                        >
                                            <Trash2 className="w-4 h-4 text-red-600" />
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <p className="text-gray-700">{position.description}</p>

                                {position.language_pairs && position.language_pairs.length > 0 && (
                                    <div>
                                        <div className="text-sm font-medium mb-2">Language Pairs:</div>
                                        <div className="flex flex-wrap gap-2">
                                            {position.language_pairs.map((pair, idx) => (
                                                <Badge key={idx} variant="outline">
                                                    {pair.source_language} → {pair.target_language}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="flex gap-4 text-sm text-gray-600">
                                    {position.min_experience_years && (
                                        <span>Min. {position.min_experience_years} years experience</span>
                                    )}
                                    {position.rate_range && (
                                        <span>Rate: {position.rate_range}</span>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}

                    {positions.length === 0 && (
                        <div className="text-center py-12 text-gray-500">
                            <p>No positions created yet</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}