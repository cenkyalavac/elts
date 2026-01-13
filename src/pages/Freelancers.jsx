import React, { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Plus, Users, LayoutGrid, X, Sparkles } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import FreelancerCard from "../components/freelancers/FreelancerCard";
import UploadCV from "../components/freelancers/UploadCV";
import AdvancedFilters from "../components/freelancers/AdvancedFilters";
import BulkStatusDialog from "../components/freelancers/BulkStatusDialog";
import SmartMatchDialog from "../components/freelancers/SmartMatchDialog";
import { Skeleton } from "@/components/ui/skeleton";

export default function FreelancersPage() {
    const [showUpload, setShowUpload] = useState(false);
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [showBulkDialog, setShowBulkDialog] = useState(false);
    const [showSmartMatch, setShowSmartMatch] = useState(false);
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
        minRating: ''
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
                `${p.source_language} → ${p.target_language}`
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
    }), [freelancers, filters]);

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
                            Freelancer Applications
                        </h1>
                        <p className="text-gray-600 mt-1">
                            Manage and review freelance translator applications
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setShowSmartMatch(true)}
                            className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200 hover:from-purple-100 hover:to-pink-100"
                        >
                            <Sparkles className="w-4 h-4 mr-2 text-purple-600" />
                            Smart Match
                        </Button>
                        <Link to={createPageUrl('Pipeline')}>
                            <Button variant="outline">
                                <LayoutGrid className="w-5 h-5 mr-2" />
                                Pipeline View
                            </Button>
                        </Link>
                        <Button
                            onClick={() => window.location.href = createPageUrl('FreelancerOnboarding')}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            <Plus className="w-5 h-5 mr-2" />
                            New Freelancer
                        </Button>
                        <Button
                            onClick={() => setShowUpload(!showUpload)}
                            variant="outline"
                        >
                            <Plus className="w-5 h-5 mr-2" />
                            Bulk Upload CVs
                        </Button>
                    </div>
                </div>

                <SmartMatchDialog 
                    open={showSmartMatch} 
                    onOpenChange={setShowSmartMatch}
                    freelancers={freelancers}
                />

                {/* Upload Section */}
                {showUpload && (
                    <div className="mb-6">
                        <UploadCV onSuccess={handleUploadSuccess} />
                    </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white rounded-lg shadow p-4">
                        <div className="text-sm text-gray-600">Total Applications</div>
                        <div className="text-2xl font-bold text-gray-900">{freelancers.length}</div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-4">
                        <div className="text-sm text-gray-600">New</div>
                        <div className="text-2xl font-bold text-blue-600">
                            {freelancers.filter(f => f.status === 'New').length}
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

                {/* Bulk Status Dialog */}
                <BulkStatusDialog 
                    open={showBulkDialog}
                    onOpenChange={setShowBulkDialog}
                    selectedIds={Array.from(selectedIds)}
                    freelancers={filteredFreelancers}
                />
            </div>
        </div>
    );
}