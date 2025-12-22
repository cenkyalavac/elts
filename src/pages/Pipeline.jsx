import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
    Search, Filter, Users, Calendar, AlertCircle,
    ChevronRight, LayoutGrid, Table
} from "lucide-react";
import FreelancerPipelineCard from "../components/pipeline/FreelancerPipelineCard";
import FreelancerDetailDrawer from "../components/pipeline/FreelancerDetailDrawer";
import PipelineTableView from "../components/pipeline/PipelineTableView";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";

const stages = [
    { id: 'New Application', label: 'New Application', color: 'bg-blue-50 border-blue-200' },
    { id: 'Form Sent', label: 'Form Sent', color: 'bg-purple-50 border-purple-200' },
    { id: 'Price Negotiation', label: 'Price Negotiation', color: 'bg-yellow-50 border-yellow-200' },
    { id: 'Test Sent', label: 'Test Sent', color: 'bg-indigo-50 border-indigo-200' },
    { id: 'Approved', label: 'Approved', color: 'bg-green-50 border-green-200' },
    { id: 'On Hold', label: 'On Hold', color: 'bg-gray-50 border-gray-200' },
    { id: 'Rejected', label: 'Rejected', color: 'bg-red-50 border-red-200' },
    { id: 'Red Flag', label: 'Red Flag', color: 'bg-orange-50 border-orange-200' }
];

export default function PipelinePage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedFreelancer, setSelectedFreelancer] = useState(null);
    const [showFilters, setShowFilters] = useState(false);
    const [viewMode, setViewMode] = useState('board'); // 'board' or 'table'

    const queryClient = useQueryClient();

    const { data: freelancers = [], isLoading } = useQuery({
        queryKey: ['freelancers'],
        queryFn: () => base44.entities.Freelancer.list('-updated_date'),
    });

    const updateFreelancerMutation = useMutation({
        mutationFn: ({ id, data }) => base44.entities.Freelancer.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['freelancers'] });
        },
    });

    const createActivityMutation = useMutation({
        mutationFn: (data) => base44.entities.FreelancerActivity.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['activities'] });
        },
    });

    const handleDragEnd = async (result) => {
        if (!result.destination) return;

        const freelancerId = result.draggableId;
        const newStatus = result.destination.droppableId;
        const freelancer = freelancers.find(f => f.id === freelancerId);

        if (!freelancer || freelancer.status === newStatus) return;

        const oldStatus = freelancer.status;

        // Update freelancer status
        await updateFreelancerMutation.mutateAsync({
            id: freelancerId,
            data: {
                status: newStatus,
                stage_changed_date: new Date().toISOString()
            }
        });

        // Log activity
        await createActivityMutation.mutateAsync({
            freelancer_id: freelancerId,
            activity_type: 'Stage Changed',
            description: `Stage changed from ${oldStatus} to ${newStatus}`,
            old_value: oldStatus,
            new_value: newStatus,
            performed_by: (await base44.auth.me()).email
        });
    };

    const filteredFreelancers = freelancers.filter(f => {
        if (!searchTerm) return true;
        const search = searchTerm.toLowerCase();
        return (
            f.full_name?.toLowerCase().includes(search) ||
            f.email?.toLowerCase().includes(search) ||
            f.languages?.some(l => l.language?.toLowerCase().includes(search))
        );
    });

    const getStageFreelancers = (stageId) => {
        return filteredFreelancers.filter(f => f.status === stageId);
    };

    const getDaysInStage = (freelancer) => {
        if (!freelancer.stage_changed_date) return null;
        const stageDate = new Date(freelancer.stage_changed_date);
        const now = new Date();
        const diffTime = Math.abs(now - stageDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
                <div className="max-w-7xl mx-auto">
                    <div className="animate-pulse space-y-4">
                        <div className="h-12 bg-gray-200 rounded w-1/3"></div>
                        <div className="h-96 bg-gray-200 rounded"></div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
            <div className="max-w-[1800px] mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <div className="flex justify-between items-center mb-4">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                                <Users className="w-8 h-8 text-blue-600" />
                                Application Pipeline
                            </h1>
                            <p className="text-gray-600 mt-1">
                                Manage freelancer applications stage by stage
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <Link to={createPageUrl('Freelancers')}>
                                <Button variant="outline">
                                    List View
                                    <ChevronRight className="w-4 h-4 ml-2" />
                                </Button>
                            </Link>
                            <Link to={createPageUrl('FreelancerOnboarding')}>
                                <Button className="bg-blue-600 hover:bg-blue-700">
                                    New Application
                                </Button>
                            </Link>
                        </div>
                    </div>

                    {/* Search & View Toggle */}
                    <div className="flex gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <Input
                                placeholder="Search by name, email or language..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <div className="flex gap-2 border rounded-lg p-1 bg-white">
                            <Button 
                                variant={viewMode === 'board' ? 'default' : 'ghost'}
                                size="sm"
                                onClick={() => setViewMode('board')}
                            >
                                <LayoutGrid className="w-4 h-4 mr-2" />
                                Board
                            </Button>
                            <Button 
                                variant={viewMode === 'table' ? 'default' : 'ghost'}
                                size="sm"
                                onClick={() => setViewMode('table')}
                            >
                                <Table className="w-4 h-4 mr-2" />
                                Table
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-4 gap-4 mb-6">
                    <Card>
                        <CardContent className="pt-6">
                            <div className="text-2xl font-bold text-blue-600">
                                {getStageFreelancers('New Application').length}
                            </div>
                            <div className="text-sm text-gray-600">New Application</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="text-2xl font-bold text-yellow-600">
                                {getStageFreelancers('Price Negotiation').length}
                            </div>
                            <div className="text-sm text-gray-600">Price Negotiation</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="text-2xl font-bold text-green-600">
                                {getStageFreelancers('Approved').length}
                            </div>
                            <div className="text-sm text-gray-600">Approved</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="text-2xl font-bold text-orange-600">
                                {getStageFreelancers('Red Flag').length}
                            </div>
                            <div className="text-sm text-gray-600">Red Flag</div>
                        </CardContent>
                    </Card>
                </div>

                {/* Pipeline Views */}
                {viewMode === 'board' ? (
                    <DragDropContext onDragEnd={handleDragEnd}>
                        <div className="flex gap-4 overflow-x-auto pb-4">
                            {stages.map(stage => {
                                const stageFreelancers = getStageFreelancers(stage.id);
                                
                                return (
                                    <div key={stage.id} className="flex-shrink-0 w-80">
                                        <Card className={`${stage.color} border-2`}>
                                            <CardHeader className="pb-3">
                                                <CardTitle className="text-base flex items-center justify-between">
                                                    <span>{stage.label}</span>
                                                    <Badge variant="secondary">
                                                        {stageFreelancers.length}
                                                    </Badge>
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <Droppable droppableId={stage.id}>
                                                    {(provided, snapshot) => (
                                                        <div
                                                            ref={provided.innerRef}
                                                            {...provided.droppableProps}
                                                            className={`space-y-3 min-h-[500px] ${
                                                                snapshot.isDraggingOver ? 'bg-blue-50 rounded-lg' : ''
                                                            }`}
                                                        >
                                                            {stageFreelancers.map((freelancer, index) => (
                                                                <Draggable
                                                                    key={freelancer.id}
                                                                    draggableId={freelancer.id}
                                                                    index={index}
                                                                >
                                                                    {(provided, snapshot) => (
                                                                        <div
                                                                            ref={provided.innerRef}
                                                                            {...provided.draggableProps}
                                                                            {...provided.dragHandleProps}
                                                                            onClick={() => setSelectedFreelancer(freelancer)}
                                                                        >
                                                                            <FreelancerPipelineCard
                                                                                freelancer={freelancer}
                                                                                daysInStage={getDaysInStage(freelancer)}
                                                                                isDragging={snapshot.isDragging}
                                                                            />
                                                                        </div>
                                                                    )}
                                                                </Draggable>
                                                            ))}
                                                            {provided.placeholder}
                                                        </div>
                                                    )}
                                                </Droppable>
                                            </CardContent>
                                        </Card>
                                    </div>
                                );
                            })}
                        </div>
                    </DragDropContext>
                ) : (
                    <PipelineTableView
                        freelancers={filteredFreelancers}
                        stages={stages}
                        onStageChange={async (freelancerId, newStage, oldStage) => {
                            await updateFreelancerMutation.mutateAsync({
                                id: freelancerId,
                                data: {
                                    status: newStage,
                                    stage_changed_date: new Date().toISOString()
                                }
                            });
                            await createActivityMutation.mutateAsync({
                                freelancer_id: freelancerId,
                                activity_type: 'Stage Changed',
                                description: `Stage changed from ${oldStage} to ${newStage}`,
                                old_value: oldStage,
                                new_value: newStage,
                                performed_by: (await base44.auth.me()).email
                            });
                        }}
                        onFreelancerClick={setSelectedFreelancer}
                        getDaysInStage={getDaysInStage}
                    />
                )}
            </div>

            {/* Detail Drawer */}
            {selectedFreelancer && (
                <FreelancerDetailDrawer
                    freelancer={selectedFreelancer}
                    onClose={() => setSelectedFreelancer(null)}
                    onUpdate={(data) => {
                        updateFreelancerMutation.mutate({
                            id: selectedFreelancer.id,
                            data
                        });
                    }}
                />
            )}
        </div>
    );
}