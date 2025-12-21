import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
    ArrowLeft, Mail, Phone, MapPin, Globe, Award, 
    Calendar, FileText, Edit, Eye
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import FreelancerEditForm from "../components/freelancers/FreelancerEditForm";

export default function FreelancerDetailPage() {
    const urlParams = new URLSearchParams(window.location.search);
    const freelancerId = urlParams.get('id');

    const [isEditing, setIsEditing] = useState(false);

    const queryClient = useQueryClient();

    const { data: freelancer, isLoading } = useQuery({
        queryKey: ['freelancer', freelancerId],
        queryFn: async () => {
            const freelancers = await base44.entities.Freelancer.filter({ id: freelancerId });
            return freelancers[0];
        },
        enabled: !!freelancerId,
    });

    const updateMutation = useMutation({
        mutationFn: (data) => base44.entities.Freelancer.update(freelancerId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['freelancer', freelancerId] });
            queryClient.invalidateQueries({ queryKey: ['freelancers'] });
            setIsEditing(false);
        },
    });

    const handleSave = (data) => {
        updateMutation.mutate(data);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
                <div className="max-w-5xl mx-auto">
                    <div className="animate-pulse space-y-4">
                        <div className="h-8 bg-gray-200 rounded w-1/4"></div>
                        <div className="h-64 bg-gray-200 rounded"></div>
                    </div>
                </div>
            </div>
        );
    }

    if (!freelancer) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
                <div className="max-w-5xl mx-auto text-center">
                    <h2 className="text-2xl font-bold text-gray-900">Freelancer not found</h2>
                </div>
            </div>
        );
    }

    const statusColors = {
        'New': 'bg-blue-100 text-blue-800',
        'Reviewing': 'bg-yellow-100 text-yellow-800',
        'Interview Scheduled': 'bg-purple-100 text-purple-800',
        'Accepted': 'bg-green-100 text-green-800',
        'Rejected': 'bg-red-100 text-red-800',
        'On Hold': 'bg-gray-100 text-gray-800'
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <Link to={createPageUrl('Freelancers')}>
                        <Button variant="ghost" className="mb-4">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Applications
                        </Button>
                    </Link>
                    
                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">{freelancer.full_name}</h1>
                            {freelancer.location && (
                                <div className="flex items-center gap-2 text-gray-600 mt-2">
                                    <MapPin className="w-4 h-4" />
                                    {freelancer.location}
                                </div>
                            )}
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant={isEditing ? "default" : "outline"}
                                onClick={() => setIsEditing(!isEditing)}
                            >
                                {isEditing ? (
                                    <>
                                        <Eye className="w-4 h-4 mr-2" />
                                        View Mode
                                    </>
                                ) : (
                                    <>
                                        <Edit className="w-4 h-4 mr-2" />
                                        Edit Profile
                                    </>
                                )}
                            </Button>
                            {freelancer.cv_file_url && (
                                <a href={freelancer.cv_file_url} target="_blank" rel="noopener noreferrer">
                                    <Button variant="outline">
                                        <FileText className="w-4 h-4 mr-2" />
                                        View CV
                                    </Button>
                                </a>
                            )}
                        </div>
                    </div>
                </div>

                {isEditing ? (
                    <FreelancerEditForm
                        freelancer={freelancer}
                        onSave={handleSave}
                        onCancel={() => setIsEditing(false)}
                    />
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Info */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Contact Info */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Contact Information</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {freelancer.email && (
                                    <div className="flex items-center gap-3">
                                        <Mail className="w-5 h-5 text-gray-400" />
                                        <a href={`mailto:${freelancer.email}`} className="text-blue-600 hover:underline">
                                            {freelancer.email}
                                        </a>
                                    </div>
                                )}
                                {freelancer.phone && (
                                    <div className="flex items-center gap-3">
                                        <Phone className="w-5 h-5 text-gray-400" />
                                        <a href={`tel:${freelancer.phone}`} className="text-blue-600 hover:underline">
                                            {freelancer.phone}
                                        </a>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Languages */}
                        {freelancer.languages && freelancer.languages.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Globe className="w-5 h-5" />
                                        Languages
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-2 gap-3">
                                        {freelancer.languages.map((lang, idx) => (
                                            <div key={idx} className="border rounded-lg p-3">
                                                <div className="font-semibold">{lang.language}</div>
                                                <Badge variant="outline" className="mt-1">
                                                    {lang.proficiency}
                                                </Badge>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Services & Specializations */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Services & Specializations</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {freelancer.service_types && freelancer.service_types.length > 0 && (
                                    <div>
                                        <div className="text-sm font-medium mb-2">Service Types</div>
                                        <div className="flex flex-wrap gap-2">
                                            {freelancer.service_types.map((service, idx) => (
                                                <Badge key={idx} className="bg-indigo-100 text-indigo-800">
                                                    {service}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {freelancer.specializations && freelancer.specializations.length > 0 && (
                                    <div>
                                        <div className="text-sm font-medium mb-2">Specializations</div>
                                        <div className="flex flex-wrap gap-2">
                                            {freelancer.specializations.map((spec, idx) => (
                                                <Badge key={idx} variant="outline">
                                                    {spec}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Experience & Education */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Experience & Education</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {freelancer.experience_years && (
                                    <div className="flex items-center gap-2">
                                        <Award className="w-5 h-5 text-gray-400" />
                                        <span className="font-semibold">{freelancer.experience_years} years</span>
                                        <span className="text-gray-600">of professional experience</span>
                                    </div>
                                )}
                                {freelancer.education && (
                                    <div>
                                        <div className="text-sm font-medium mb-1">Education</div>
                                        <p className="text-gray-700">{freelancer.education}</p>
                                    </div>
                                )}
                                {freelancer.certifications && freelancer.certifications.length > 0 && (
                                    <div>
                                        <div className="text-sm font-medium mb-2">Certifications</div>
                                        <ul className="list-disc list-inside space-y-1">
                                            {freelancer.certifications.map((cert, idx) => (
                                                <li key={idx} className="text-gray-700">{cert}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Skills */}
                        {freelancer.skills && freelancer.skills.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Technical Skills & Tools</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex flex-wrap gap-2">
                                        {freelancer.skills.map((skill, idx) => (
                                            <Badge key={idx} variant="secondary">
                                                {skill}
                                            </Badge>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Status Badge */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Application Status</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Badge className={`${statusColors[freelancer.status]} text-lg px-4 py-2`}>
                                    {freelancer.status}
                                </Badge>
                            </CardContent>
                        </Card>

                        {/* Quick Info */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Quick Info</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {freelancer.availability && (
                                    <div>
                                        <div className="text-sm text-gray-600">Availability</div>
                                        <Badge className="mt-1 bg-green-100 text-green-800">
                                            {freelancer.availability}
                                        </Badge>
                                    </div>
                                )}
                                {freelancer.rate && (
                                    <div>
                                        <div className="text-sm text-gray-600">Rate</div>
                                        <div className="font-semibold mt-1">{freelancer.rate}</div>
                                    </div>
                                )}
                                <div>
                                    <div className="text-sm text-gray-600">Applied</div>
                                    <div className="font-medium mt-1">
                                        {new Date(freelancer.created_date).toLocaleDateString()}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                    </div>
                    )}
                    </div>
                    </div>
                    );
                    }