import React, { useState } from 'react';
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Plus, Users } from "lucide-react";
import FreelancerCard from "../components/freelancers/FreelancerCard";
import UploadCV from "../components/freelancers/UploadCV";
import FilterPanel from "../components/freelancers/FilterPanel";
import { Skeleton } from "@/components/ui/skeleton";

export default function FreelancersPage() {
    const [showUpload, setShowUpload] = useState(false);
    const [filters, setFilters] = useState({
        search: '',
        status: 'all',
        serviceType: 'all',
        availability: 'all'
    });

    const queryClient = useQueryClient();

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
                freelancer.specializations?.some(spec => spec.toLowerCase().includes(searchLower));
            
            if (!matchesSearch) return false;
        }

        // Status filter
        if (filters.status !== 'all' && freelancer.status !== filters.status) {
            return false;
        }

        // Service type filter
        if (filters.serviceType !== 'all' && 
            !freelancer.service_types?.includes(filters.serviceType)) {
            return false;
        }

        // Availability filter
        if (filters.availability !== 'all' && 
            freelancer.availability !== filters.availability) {
            return false;
        }

        return true;
    });

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
                    <Button
                        onClick={() => setShowUpload(!showUpload)}
                        className="bg-blue-600 hover:bg-blue-700"
                    >
                        <Plus className="w-5 h-5 mr-2" />
                        Add Application
                    </Button>
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
                        <FilterPanel filters={filters} onFilterChange={setFilters} />
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