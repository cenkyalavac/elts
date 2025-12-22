import React, { useState } from 'react';
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Plus, Users, LayoutGrid } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import FreelancerCard from "../components/freelancers/FreelancerCard";
import UploadCV from "../components/freelancers/UploadCV";
import AdvancedFilters from "../components/freelancers/AdvancedFilters";
import { Skeleton } from "@/components/ui/skeleton";

export default function FreelancersPage() {
    const [showUpload, setShowUpload] = useState(false);
    const [filters, setFilters] = useState({
        search: '',
        status: 'all',
        selectedLanguages: [],
        selectedSpecializations: [],
        selectedServices: [],
        minExperience: '',
        maxExperience: '',
        availability: 'all'
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
    });

    const handleUploadSuccess = () => {
        setShowUpload(false);
        queryClient.invalidateQueries({ queryKey: ['freelancers'] });
    };

    const filteredFreelancers = freelancers.filter(freelancer => {
        // Search filter
        if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            const matchesSearch = 
                freelancer.full_name?.toLowerCase().includes(searchLower) ||
                freelancer.email?.toLowerCase().includes(searchLower) ||
                freelancer.skills?.some(skill => skill.toLowerCase().includes(searchLower)) ||
                freelancer.specializations?.some(spec => spec.toLowerCase().includes(searchLower)) ||
                freelancer.languages?.some(lang => lang.language?.toLowerCase().includes(searchLower));
            
            if (!matchesSearch) return false;
        }

        // Status filter
        if (filters.status !== 'all' && freelancer.status !== filters.status) {
            return false;
        }

        // Languages filter (multi-select)
        if (filters.selectedLanguages?.length > 0) {
            const freelancerLanguages = freelancer.language_pairs?.flatMap(p => [p.source_language, p.target_language]) || [];
            const hasMatchingLanguage = filters.selectedLanguages.some(lang => 
                freelancerLanguages.includes(lang)
            );
            if (!hasMatchingLanguage) return false;
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

        return true;
    });

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
                                    <FreelancerCard key={freelancer.id} freelancer={freelancer} />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}