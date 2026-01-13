import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Workflow, Plus, GripVertical, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function PipelineSettings() {
    const defaultStages = [
        'New Application',
        'Form Sent',
        'Price Negotiation',
        'Test Sent',
        'Approved',
        'On Hold',
        'Rejected',
        'Red Flag'
    ];

    const [stages, setStages] = useState(defaultStages);
    const [newStage, setNewStage] = useState('');

    const handleAddStage = () => {
        if (!newStage.trim()) {
            toast.error('Please enter a stage name');
            return;
        }
        if (stages.includes(newStage)) {
            toast.error('Stage already exists');
            return;
        }
        setStages([...stages, newStage]);
        setNewStage('');
        toast.success('Stage added successfully');
    };

    const handleRemoveStage = (stage) => {
        if (stages.length <= 3) {
            toast.error('Must have at least 3 stages');
            return;
        }
        setStages(stages.filter(s => s !== stage));
        toast.success('Stage removed');
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Workflow className="w-5 h-5" />
                    Pipeline Stages
                </CardTitle>
                <CardDescription>
                    Customize the stages for your freelancer recruitment pipeline
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    {stages.map((stage, index) => (
                        <div
                            key={stage}
                            className="bg-white border rounded-lg p-3 flex items-center justify-between group hover:shadow-sm transition-shadow"
                        >
                            <div className="flex items-center gap-3">
                                <GripVertical className="w-4 h-4 text-gray-400 cursor-move" />
                                <Badge variant="outline" className="font-normal">
                                    {index + 1}
                                </Badge>
                                <span className="font-medium">{stage}</span>
                            </div>
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleRemoveStage(stage)}
                                className="opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <Trash2 className="w-4 h-4 text-red-600" />
                            </Button>
                        </div>
                    ))}
                </div>

                <div className="flex gap-2 pt-2">
                    <Input
                        placeholder="New stage name..."
                        value={newStage}
                        onChange={(e) => setNewStage(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddStage()}
                    />
                    <Button onClick={handleAddStage}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add
                    </Button>
                </div>

                <p className="text-xs text-gray-500 mt-4">
                    Note: Changes are saved automatically. Existing freelancers will keep their current stage.
                </p>
            </CardContent>
        </Card>
    );
}