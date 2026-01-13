import React, { useMemo } from 'react';
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Briefcase, Languages, Star, DollarSign, Calendar, AlertCircle } from "lucide-react";

export default function FreelancerJobOffers({ freelancer }) {
    const { data: jobs = [], isLoading } = useQuery({
        queryKey: ['jobOffers'],
        queryFn: () => base44.entities.Job.list(),
    });

    const filteredJobs = useMemo(() => {
        if (!freelancer || !jobs) return [];

        return jobs.filter(job => {
            if (job.required_languages?.length > 0) {
                const hasMatchingLanguage = job.required_languages.some(jobLang =>
                    freelancer.language_pairs?.some(pair =>
                        pair.source_language === jobLang.language || pair.target_language === jobLang.language
                    )
                );
                if (!hasMatchingLanguage) return false;
            }

            if (job.required_specializations?.length > 0) {
                const hasMatchingSpec = job.required_specializations.some(spec =>
                    freelancer.specializations?.includes(spec)
                );
                if (!hasMatchingSpec) return false;
            }

            if (job.required_service_types?.length > 0) {
                const hasMatchingService = job.required_service_types.some(service =>
                    freelancer.service_types?.includes(service)
                );
                if (!hasMatchingService) return false;
            }

            if (job.required_skills?.length > 0) {
                const hasMatchingSkill = job.required_skills.some(skill =>
                    freelancer.skills?.includes(skill)
                );
                if (!hasMatchingSkill) return false;
            }

            if (job.min_experience_years && freelancer.experience_years < job.min_experience_years) {
                return false;
            }

            return true;
        });
    }, [jobs, freelancer]);

    if (isLoading) {
        return <div className="text-center py-12 text-gray-500">Loading job offers...</div>;
    }

    if (filteredJobs.length === 0) {
        return (
            <Card className="border-0 shadow-sm">
                <CardContent className="pt-12 pb-8 text-center">
                    <div className="p-4 bg-blue-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                        <AlertCircle className="w-8 h-8 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Matching Job Offers</h3>
                    <p className="text-gray-600 mb-6">Update your profile to receive personalized job recommendations</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="grid gap-4">
            {filteredJobs.map(job => (
                <Card key={job.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader>
                        <div className="flex items-start justify-between">
                            <CardTitle className="text-lg">{job.title}</CardTitle>
                            <Badge variant="outline">{job.status}</Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-gray-700 text-sm">{job.description}</p>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                            {job.required_languages?.length > 0 && (
                                <div className="flex items-center gap-2 text-gray-700">
                                    <Languages className="w-4 h-4 text-blue-500" />
                                    <span>{job.required_languages.map(l => l.language).join(', ')}</span>
                                </div>
                            )}
                            {job.min_experience_years && (
                                <div className="flex items-center gap-2 text-gray-700">
                                    <Star className="w-4 h-4 text-yellow-500" />
                                    <span>{job.min_experience_years}+ years</span>
                                </div>
                            )}
                            {job.budget && (
                                <div className="flex items-center gap-2 text-gray-700">
                                    <DollarSign className="w-4 h-4 text-green-500" />
                                    <span>{job.budget}</span>
                                </div>
                            )}
                            {job.deadline && (
                                <div className="flex items-center gap-2 text-gray-700">
                                    <Calendar className="w-4 h-4 text-purple-500" />
                                    <span>{new Date(job.deadline).toLocaleDateString()}</span>
                                </div>
                            )}
                        </div>
                        <Button variant="outline" className="w-full" disabled>
                            Job Details (Coming Soon)
                        </Button>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}