import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Briefcase, Users, Target } from "lucide-react";
import JobForm from "../components/jobs/JobForm";
import JobFilters from "../components/jobs/JobFilters";
import FreelancerMatch, { calculateMatchScore } from "../components/jobs/FreelancerMatch";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";

export default function JobsPage() {
    const [showForm, setShowForm] = useState(false);
    const [selectedJob, setSelectedJob] = useState(null);
    const [filters, setFilters] = useState({
        search: '',
        status: 'all',
        selectedLanguages: [],
        selectedSpecializations: [],
        selectedServices: [],
        minExperience: '',
        hasDeadline: false
    });

    const queryClient = useQueryClient();

    const { data: jobs = [] } = useQuery({
        queryKey: ['jobs'],
        queryFn: () => base44.entities.Job.list('-created_date'),
    });

    const { data: freelancers = [] } = useQuery({
        queryKey: ['freelancers'],
        queryFn: () => base44.entities.Freelancer.list(),
    });

    const createJobMutation = useMutation({
        mutationFn: (jobData) => base44.entities.Job.create(jobData),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['jobs'] });
            setShowForm(false);
            setSelectedJob(data);
        },
    });

    const handleCreateJob = (jobData) => {
        createJobMutation.mutate(jobData);
    };

    const getMatchedFreelancers = (job) => {
        return freelancers
            .map(freelancer => ({
                freelancer,
                matchData: calculateMatchScore(freelancer, job)
            }))
            .sort((a, b) => b.matchData.score - a.matchData.score);
    };

    const filteredJobs = jobs.filter(job => {
        // Search filter
        if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            const matchesSearch = 
                job.title?.toLowerCase().includes(searchLower) ||
                job.description?.toLowerCase().includes(searchLower) ||
                job.required_skills?.some(skill => skill.toLowerCase().includes(searchLower)) ||
                job.required_specializations?.some(spec => spec.toLowerCase().includes(searchLower)) ||
                job.required_languages?.some(lang => lang.language?.toLowerCase().includes(searchLower));
            
            if (!matchesSearch) return false;
        }

        // Status filter
        if (filters.status !== 'all' && job.status !== filters.status) {
            return false;
        }

        // Languages filter
        if (filters.selectedLanguages?.length > 0) {
            const jobLanguages = job.required_languages?.map(l => l.language) || [];
            const hasMatchingLanguage = filters.selectedLanguages.some(lang => 
                jobLanguages.includes(lang)
            );
            if (!hasMatchingLanguage) return false;
        }

        // Specializations filter
        if (filters.selectedSpecializations?.length > 0) {
            const hasMatchingSpec = filters.selectedSpecializations.some(spec =>
                job.required_specializations?.includes(spec)
            );
            if (!hasMatchingSpec) return false;
        }

        // Service types filter
        if (filters.selectedServices?.length > 0) {
            const hasMatchingService = filters.selectedServices.some(service =>
                job.required_service_types?.includes(service)
            );
            if (!hasMatchingService) return false;
        }

        // Min experience filter
        if (filters.minExperience) {
            const minExp = parseFloat(filters.minExperience);
            if (!job.min_experience_years || job.min_experience_years < minExp) {
                return false;
            }
        }

        // Has deadline filter
        if (filters.hasDeadline && !job.deadline) {
            return false;
        }

        return true;
    });

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                            <Briefcase className="w-8 h-8 text-blue-600" />
                            Job Matching
                        </h1>
                        <p className="text-gray-600 mt-1">
                            Create jobs and automatically match with qualified freelancers
                        </p>
                    </div>
                    <Button
                        onClick={() => setShowForm(!showForm)}
                        className="bg-blue-600 hover:bg-blue-700"
                    >
                        <Plus className="w-5 h-5 mr-2" />
                        Create Job
                    </Button>
                </div>

                {showForm && (
                    <div className="mb-6">
                        <JobForm
                            onSubmit={handleCreateJob}
                            onCancel={() => setShowForm(false)}
                            freelancers={freelancers}
                        />
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Filters */}
                    <div className="lg:col-span-1">
                        <JobFilters 
                            filters={filters} 
                            onFilterChange={setFilters}
                            jobs={jobs}
                        />
                    </div>

                    {/* Jobs List */}
                    <div className="lg:col-span-1">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center justify-between">
                                    <span>Jobs ({filteredJobs.length})</span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {filteredJobs.length === 0 ? (
                                    <div className="text-center py-8 text-gray-500">
                                        <Briefcase className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                                        <p>No jobs found</p>
                                        <p className="text-sm">
                                            {filters.search || filters.status !== 'all' 
                                                ? 'Try adjusting your filters' 
                                                : 'Create your first job'}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {filteredJobs.map(job => {
                                            const matches = getMatchedFreelancers(job);
                                            const topMatches = matches.filter(m => m.matchData.score >= 60).length;
                                            
                                            return (
                                                <button
                                                    key={job.id}
                                                    onClick={() => setSelectedJob(job)}
                                                    className={`w-full text-left p-4 rounded-lg border transition-all ${
                                                        selectedJob?.id === job.id
                                                            ? 'border-blue-500 bg-blue-50'
                                                            : 'border-gray-200 hover:border-blue-300 bg-white'
                                                    }`}
                                                >
                                                    <div className="font-semibold mb-1">{job.title}</div>
                                                    <div className="flex items-center gap-2 text-xs text-gray-500">
                                                        <Badge variant="secondary" className="text-xs">
                                                            {job.status}
                                                        </Badge>
                                                        <span className="flex items-center gap-1">
                                                            <Target className="w-3 h-3" />
                                                            {topMatches} good matches
                                                        </span>
                                                    </div>
                                                    {job.deadline && (
                                                        <div className="text-xs text-gray-500 mt-1">
                                                            Due: {new Date(job.deadline).toLocaleDateString()}
                                                        </div>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Matched Freelancers */}
                    <div className="lg:col-span-2">
                        {selectedJob ? (
                            <div>
                                <Card className="mb-6">
                                    <CardHeader>
                                        <CardTitle>{selectedJob.title}</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        {selectedJob.description && (
                                            <p className="text-gray-600 mb-4">{selectedJob.description}</p>
                                        )}
                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            {selectedJob.budget && (
                                                <div>
                                                    <span className="font-medium">Budget:</span> {selectedJob.budget}
                                                </div>
                                            )}
                                            {selectedJob.deadline && (
                                                <div>
                                                    <span className="font-medium">Deadline:</span>{' '}
                                                    {new Date(selectedJob.deadline).toLocaleDateString()}
                                                </div>
                                            )}
                                            {selectedJob.min_experience_years && (
                                                <div>
                                                    <span className="font-medium">Min Experience:</span>{' '}
                                                    {selectedJob.min_experience_years} years
                                                </div>
                                            )}
                                        </div>
                                        <div className="mt-4 space-y-2">
                                            {selectedJob.required_languages?.length > 0 && (
                                                <div>
                                                    <span className="font-medium text-sm">Languages:</span>
                                                    <div className="flex flex-wrap gap-1 mt-1">
                                                        {selectedJob.required_languages.map((lang, idx) => (
                                                            <Badge key={idx} variant="outline" className="text-xs">
                                                                {lang.language} (min: {lang.min_proficiency})
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                            {selectedJob.required_service_types?.length > 0 && (
                                                <div>
                                                    <span className="font-medium text-sm">Services:</span>
                                                    <div className="flex flex-wrap gap-1 mt-1">
                                                        {selectedJob.required_service_types.map((service, idx) => (
                                                            <Badge key={idx} className="text-xs bg-indigo-100 text-indigo-800">
                                                                {service}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>

                                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                                    <Users className="w-5 h-5" />
                                    Matched Freelancers ({getMatchedFreelancers(selectedJob).length})
                                </h2>

                                <div className="grid gap-4">
                                    {getMatchedFreelancers(selectedJob).map(({ freelancer, matchData }) => (
                                        <FreelancerMatch
                                            key={freelancer.id}
                                            freelancer={freelancer}
                                            job={selectedJob}
                                        />
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <Card>
                                <CardContent className="py-16 text-center">
                                    <Target className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                        Select a job to see matches
                                    </h3>
                                    <p className="text-gray-600">
                                        Choose a job from the list to view matched freelancers with scores
                                    </p>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}