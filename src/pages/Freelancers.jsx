import React, { useState, useMemo } from 'react';
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Users, LayoutGrid, X, Sparkles, Calendar as CalendarIcon, TrendingUp, Table, List } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import FreelancerCard from "../components/freelancers/FreelancerCard";
import UploadCV from "../components/freelancers/UploadCV";
import AdvancedFilters from "../components/freelancers/AdvancedFilters";
import BulkStatusDialog from "../components/freelancers/BulkStatusDialog";
import SmartMatchDialog from "../components/freelancers/SmartMatchDialog";
import FreelancerPipelineCard from "../components/pipeline/FreelancerPipelineCard";
import FreelancerDetailDrawer from "../components/pipeline/FreelancerDetailDrawer";
import PipelineTableView from "../components/pipeline/PipelineTableView";
import TeamAvailabilityView from "../components/views/TeamAvailabilityView";
import AnalyticsView from "../components/views/AnalyticsView";
import BulkQuizAssignment from "../components/quiz/BulkQuizAssignment";
import { Skeleton } from "@/components/ui/skeleton";
import { normalizeLanguage } from "../components/utils/languageUtils";

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

export default function FreelancersPage() {
    const [viewMode, setViewMode] = useState('list'); // 'list', 'board', 'table'
    const [showUpload, setShowUpload] = useState(false);
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [showBulkDialog, setShowBulkDialog] = useState(false);
    const [showSmartMatch, setShowSmartMatch] = useState(false);
    const [selectedFreelancer, setSelectedFreelancer] = useState(null);
    const [filters, setFilters] = useState({
        search: '',
        status: 'all',
        selectedLanguagePairs: [],
        selectedSpecializations: [],
        selectedServices: [],
        minExperience: '',
        maxExperience: '',
        availability: 'all',
        maxRate: '',
        ndaSigned: false,
        tested: false,
        certified: false,
        minRating: '',
        quizPassed: 'all',
        minQuizScore: ''
    });

    const queryClient = useQueryClient();

    const { data: user, isLoading: userLoading } = useQuery({
        queryKey: ['currentUser'],
        queryFn: async () => {
            const isAuth = await base44.auth.isAuthenticated();
            if (!isAuth) {
                base44.auth.redirectToLogin(createPageUrl('Freelancers'));
                return null;
            }
            return base44.auth.me();
        },
    });

    const canManage = user?.role === 'admin' || user?.role === 'project_manager';

    const { data: freelancers = [], isLoading } = useQuery({
        queryKey: ['freelancers'],
        queryFn: () => base44.entities.Freelancer.list('-created_date'),
        staleTime: 30000, // Data stays fresh for 30 seconds
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

    const { data: allQuizAttempts = [] } = useQuery({
        queryKey: ['allQuizAttempts'],
        queryFn: () => base44.entities.QuizAttempt.list(),
        staleTime: 30000,
    });

    const handleDragEnd = async (result) => {
        if (!result.destination) return;

        const freelancerId = result.draggableId;
        const newStatus = result.destination.droppableId;
        const freelancer = freelancers.find(f => f.id === freelancerId);

        if (!freelancer || freelancer.status === newStatus) return;

        const oldStatus = freelancer.status;

        await updateFreelancerMutation.mutateAsync({
            id: freelancerId,
            data: {
                status: newStatus,
                stage_changed_date: new Date().toISOString()
            }
        });

        await createActivityMutation.mutateAsync({
            freelancer_id: freelancerId,
            activity_type: 'Stage Changed',
            description: `Stage changed from ${oldStatus} to ${newStatus}`,
            old_value: oldStatus,
            new_value: newStatus,
            performed_by: user?.email
        });
    };

    const getDaysInStage = (freelancer) => {
        if (!freelancer.stage_changed_date) return null;
        const stageDate = new Date(freelancer.stage_changed_date);
        const now = new Date();
        const diffTime = Math.abs(now - stageDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    const handleUploadSuccess = () => {
        setShowUpload(false);
        queryClient.invalidateQueries({ queryKey: ['freelancers'] });
    };

    const toggleSelectId = (id) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setSelectedIds(newSet);
    };

    const toggleSelectAll = () => {
        if (selectedIds.size === filteredFreelancers.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(filteredFreelancers.map(f => f.id)));
        }
    };

    const clearSelection = () => {
        setSelectedIds(new Set());
    };

    const filteredFreelancers = useMemo(() => freelancers.filter(freelancer => {
        // Quiz performance filters
        const freelancerAttempts = allQuizAttempts.filter(a => a.freelancer_id === freelancer.id);
        const hasPassed = freelancerAttempts.some(a => a.passed === true);
        const hasFailed = freelancerAttempts.some(a => a.passed === false);
        const avgScore = freelancerAttempts.length > 0
            ? freelancerAttempts.reduce((sum, a) => sum + a.percentage, 0) / freelancerAttempts.length
            : null;

        if (filters.quizPassed === 'passed' && !hasPassed) {
            return false;
        }
        if (filters.quizPassed === 'failed' && !hasFailed) {
            return false;
        }
        if (filters.quizPassed === 'not_taken' && freelancerAttempts.length > 0) {
            return false;
        }

        if (filters.minQuizScore) {
            const minScore = parseFloat(filters.minQuizScore);
            if (avgScore === null || avgScore < minScore) {
                return false;
            }
        }

        // Search filter
        if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            const matchesSearch = 
                freelancer.full_name?.toLowerCase().includes(searchLower) ||
                freelancer.email?.toLowerCase().includes(searchLower) ||
                freelancer.skills?.some(skill => skill.toLowerCase().includes(searchLower)) ||
                freelancer.specializations?.some(spec => spec.toLowerCase().includes(searchLower)) ||
                freelancer.language_pairs?.some(pair => 
                    pair.source_language?.toLowerCase().includes(searchLower) ||
                    pair.target_language?.toLowerCase().includes(searchLower)
                );
            
            if (!matchesSearch) return false;
        }

        // Status filter
        if (filters.status !== 'all' && freelancer.status !== filters.status) {
            return false;
        }

        // Language pairs filter (multi-select)
        if (filters.selectedLanguagePairs?.length > 0) {
            const freelancerPairs = freelancer.language_pairs?.map(p => 
                `${normalizeLanguage(p.source_language)} → ${normalizeLanguage(p.target_language)}`
            ) || [];
            const hasMatchingPair = filters.selectedLanguagePairs.some(filterPair => 
                freelancerPairs.includes(filterPair)
            );
            if (!hasMatchingPair) return false;
        }

        // Specializations filter (multi-select)
        if (filters.selectedSpecializations?.length > 0) {
            const hasMatchingSpec = filters.selectedSpecializations.some(spec =>
                freelancer.specializations?.includes(spec)
            );
            if (!hasMatchingSpec) return false;
        }

        // Service types filter (multi-select)
        if (filters.selectedServices?.length > 0) {
            const hasMatchingService = filters.selectedServices.some(service =>
                freelancer.service_types?.includes(service)
            );
            if (!hasMatchingService) return false;
        }

        // Experience range filter
        if (filters.minExperience) {
            const minExp = parseFloat(filters.minExperience);
            if (!freelancer.experience_years || freelancer.experience_years < minExp) {
                return false;
            }
        }
        if (filters.maxExperience) {
            const maxExp = parseFloat(filters.maxExperience);
            if (!freelancer.experience_years || freelancer.experience_years > maxExp) {
                return false;
            }
        }

        // Availability filter
        if (filters.availability !== 'all' && 
            freelancer.availability !== filters.availability) {
            return false;
        }

        // Max rate filter
        if (filters.maxRate) {
            const maxRateNum = parseFloat(filters.maxRate);
            const hasAffordableRate = freelancer.rates?.some(rate => 
                rate.rate_value && rate.rate_value <= maxRateNum
            );
            if (!hasAffordableRate && freelancer.rates?.length > 0) {
                return false;
            }
        }

        // NDA filter
        if (filters.ndaSigned && !freelancer.nda) {
            return false;
        }

        // Tested filter
        if (filters.tested && !freelancer.tested) {
            return false;
        }

        // Certified filter
        if (filters.certified && !freelancer.certified) {
            return false;
        }

        // Min rating filter
        if (filters.minRating) {
            const minRatingNum = parseFloat(filters.minRating);
            if (!freelancer.resource_rating || freelancer.resource_rating < minRatingNum) {
                return false;
            }
        }

        return true;
    }), [freelancers, filters, allQuizAttempts]);

    const freelancersByStage = useMemo(() => {
        const result = {};
        stages.forEach(stage => {
            result[stage.id] = filteredFreelancers.filter(f => f.status === stage.id);
        });
        return result;
    }, [filteredFreelancers]);

    if (userLoading || !user) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    if (!canManage) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
                <div className="max-w-4xl mx-auto text-center mt-20">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
                    <p className="text-gray-600">You don't have permission to view this page.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                            <Users className="w-8 h-8 text-blue-600" />
                            Freelancers
                        </h1>
                        <p className="text-gray-600 mt-1">
                            Manage applications, availability, and performance
                        </p>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                        <div className="flex gap-1 border rounded-lg p-1 bg-white">
                            <Button 
                                variant={viewMode === 'list' ? 'default' : 'ghost'}
                                size="sm"
                                onClick={() => setViewMode('list')}
                            >
                                <List className="w-4 h-4 mr-2" />
                                List
                            </Button>
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
                        <BulkQuizAssignment freelancers={filteredFreelancers} />
                        <Button
                            variant="outline"
                            onClick={() => setShowSmartMatch(true)}
                            className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200 hover:from-purple-100 hover:to-pink-100"
                        >
                            <Sparkles className="w-4 h-4 mr-2 text-purple-600" />
                            Smart Match
                        </Button>
                        <Button
                            onClick={() => window.location.href = createPageUrl('FreelancerOnboarding')}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            <Plus className="w-5 h-5 mr-2" />
                            Add Freelancer
                        </Button>
                    </div>
                </div>

                <Tabs defaultValue="applications" className="space-y-6">
                    <TabsList>
                        <TabsTrigger value="applications">Applications</TabsTrigger>
                        <TabsTrigger value="availability">Team Availability</TabsTrigger>
                        <TabsTrigger value="analytics">Analytics</TabsTrigger>
                    </TabsList>

                    <TabsContent value="applications" className="space-y-6">
                        {showUpload && (
                            <UploadCV onSuccess={handleUploadSuccess} />
                        )}
                        {!showUpload && (
                            <Button
                                onClick={() => setShowUpload(true)}
                                variant="outline"
                                size="sm"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Bulk Upload CVs
                            </Button>
                        )}

                <SmartMatchDialog 
                    open={showSmartMatch} 
                    onOpenChange={setShowSmartMatch}
                    freelancers={freelancers}
                />

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white rounded-lg shadow p-4">
                        <div className="text-sm text-gray-600">Total Applications</div>
                        <div className="text-2xl font-bold text-gray-900">{freelancers.length}</div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-4">
                        <div className="text-sm text-gray-600">New Applications</div>
                        <div className="text-2xl font-bold text-blue-600">
                            {freelancers.filter(f => f.status === 'New Application').length}
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-4">
                        <div className="text-sm text-gray-600">In Review</div>
                        <div className="text-2xl font-bold text-yellow-600">
                            {freelancers.filter(f => f.status === 'Reviewing').length}
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-4">
                        <div className="text-sm text-gray-600">Accepted</div>
                        <div className="text-2xl font-bold text-green-600">
                            {freelancers.filter(f => f.status === 'Accepted').length}
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                {viewMode === 'list' ? (
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                        {/* Filters */}
                        <div className="lg:col-span-1">
                            <AdvancedFilters 
                                filters={filters} 
                                onFilterChange={setFilters}
                                freelancers={freelancers}
                            />
                        </div>

                        {/* Freelancer List */}
                        <div className="lg:col-span-3">
                        {/* Bulk Actions Toolbar */}
                        {selectedIds.size > 0 && (
                            <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Checkbox 
                                        checked={selectedIds.size === filteredFreelancers.length && filteredFreelancers.length > 0}
                                        onCheckedChange={toggleSelectAll}
                                    />
                                    <span className="text-sm font-medium text-blue-900">
                                        {selectedIds.size} selected
                                    </span>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        size="sm"
                                        className="bg-blue-600 hover:bg-blue-700"
                                        onClick={() => setShowBulkDialog(true)}
                                    >
                                        Change Status
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={clearSelection}
                                    >
                                        <X className="w-4 h-4 mr-1" />
                                        Clear
                                    </Button>
                                </div>
                            </div>
                        )}

                        {isLoading ? (
                            <div className="grid gap-4">
                                {Array(6).fill(0).map((_, i) => (
                                    <Skeleton key={i} className="h-64 w-full" />
                                ))}
                            </div>
                        ) : filteredFreelancers.length === 0 ? (
                            <div className="bg-white rounded-lg shadow p-12 text-center">
                                <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                    No applications found
                                </h3>
                                <p className="text-gray-600 mb-4">
                                    {filters.search || filters.status !== 'all' 
                                        ? 'Try adjusting your filters' 
                                        : 'Upload a CV to get started'}
                                </p>
                            </div>
                        ) : (
                            <div className="grid gap-4">
                                {filteredFreelancers.map(freelancer => (
                                    <div key={freelancer.id} className="flex gap-3 items-start">
                                        <div className="pt-5">
                                            <Checkbox 
                                                checked={selectedIds.has(freelancer.id)}
                                                onCheckedChange={() => toggleSelectId(freelancer.id)}
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <FreelancerCard freelancer={freelancer} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        </div>
                    </div>
                ) : viewMode === 'board' ? (
                    <DragDropContext onDragEnd={handleDragEnd}>
                        <div className="flex gap-4 overflow-x-auto pb-4">
                            {stages.map(stage => {
                                const stageFreelancers = freelancersByStage[stage.id] || [];
                                
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
                                performed_by: user?.email
                            });
                        }}
                        onFreelancerClick={setSelectedFreelancer}
                        getDaysInStage={getDaysInStage}
                    />
                )}

                {/* Bulk Status Dialog */}
                <BulkStatusDialog 
                    open={showBulkDialog}
                    onOpenChange={setShowBulkDialog}
                    selectedIds={Array.from(selectedIds)}
                    freelancers={filteredFreelancers}
                />

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
                    </TabsContent>

                    <TabsContent value="availability">
                        <TeamAvailabilityView />
                    </TabsContent>

                    <TabsContent value="analytics">
                        <AnalyticsView />
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}