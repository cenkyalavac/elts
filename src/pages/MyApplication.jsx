import React from 'react';
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Mail, Phone, MapPin, Globe, FileText, Calendar, MessageSquare } from "lucide-react";

export default function MyApplicationPage() {
    const { data: user } = useQuery({
        queryKey: ['currentUser'],
        queryFn: () => base44.auth.me(),
    });

    const { data: applications = [] } = useQuery({
        queryKey: ['myApplication', user?.email],
        queryFn: () => base44.entities.Freelancer.filter({ email: user?.email }),
        enabled: !!user?.email,
    });

    const { data: activities = [] } = useQuery({
        queryKey: ['myActivities', applications[0]?.id],
        queryFn: () => base44.entities.FreelancerActivity.filter({ 
            freelancer_id: applications[0]?.id 
        }).then(data => data.sort((a, b) => 
            new Date(b.created_date) - new Date(a.created_date)
        )),
        enabled: !!applications[0]?.id,
    });

    const application = applications[0];

    const statusColors = {
        'New Application': 'bg-blue-100 text-blue-800',
        'Form Sent': 'bg-purple-100 text-purple-800',
        'Price Negotiation': 'bg-yellow-100 text-yellow-800',
        'Test Sent': 'bg-indigo-100 text-indigo-800',
        'Approved': 'bg-green-100 text-green-800',
        'On Hold': 'bg-gray-100 text-gray-800',
        'Rejected': 'bg-red-100 text-red-800'
    };

    if (!application) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
                <div className="max-w-4xl mx-auto text-center mt-20">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">No Application Found</h2>
                    <p className="text-gray-600 mb-6">You haven't submitted an application yet.</p>
                    <Button onClick={() => window.location.href = '/apply'}>
                        Submit Application
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-900 mb-8">My Application</h1>

                {/* Status Card */}
                <Card className="mb-6">
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <CardTitle>Application Status</CardTitle>
                            <Badge className={`${statusColors[application.status]} text-lg px-4 py-2`}>
                                {application.status}
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Clock className="w-4 h-4" />
                            Applied on {new Date(application.created_date).toLocaleDateString()}
                        </div>
                        {application.stage_changed_date && (
                            <div className="flex items-center gap-2 text-sm text-gray-600 mt-2">
                                <Calendar className="w-4 h-4" />
                                Last updated {new Date(application.stage_changed_date).toLocaleDateString()}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Application Details */}
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle>Your Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <div className="text-sm text-gray-600 mb-1">Email</div>
                                <div className="flex items-center gap-2">
                                    <Mail className="w-4 h-4 text-gray-400" />
                                    <span>{application.email}</span>
                                </div>
                            </div>
                            {application.phone && (
                                <div>
                                    <div className="text-sm text-gray-600 mb-1">Phone</div>
                                    <div className="flex items-center gap-2">
                                        <Phone className="w-4 h-4 text-gray-400" />
                                        <span>{application.phone}</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {application.location && (
                            <div>
                                <div className="text-sm text-gray-600 mb-1">Location</div>
                                <div className="flex items-center gap-2">
                                    <MapPin className="w-4 h-4 text-gray-400" />
                                    <span>{application.location}</span>
                                </div>
                            </div>
                        )}

                        {application.language_pairs && application.language_pairs.length > 0 && (
                            <div>
                                <div className="text-sm text-gray-600 mb-2">Language Pairs</div>
                                <div className="space-y-2">
                                    {application.language_pairs.map((pair, idx) => (
                                        <div key={idx} className="border rounded-lg p-3 bg-gray-50">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Badge variant="outline">
                                                    {pair.source_language} → {pair.target_language}
                                                </Badge>
                                                <Badge variant="secondary" className="text-xs">
                                                    {pair.proficiency}
                                                </Badge>
                                            </div>
                                            {pair.rates && pair.rates.length > 0 && (
                                                <div className="text-sm pl-3 border-l-2 border-blue-200">
                                                    {pair.rates.map((rate, rateIdx) => (
                                                        <div key={rateIdx}>
                                                            <span className="font-semibold text-green-600">
                                                                ${rate.rate_value} {rate.currency}
                                                            </span>
                                                            <span className="text-gray-600 ml-1">
                                                                {rate.rate_type.replace('_', ' ')}
                                                            </span>
                                                            {rate.specialization && (
                                                                <Badge variant="outline" className="ml-2 text-xs">
                                                                    {rate.specialization}
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {application.cv_file_url && (
                            <div>
                                <a href={application.cv_file_url} target="_blank" rel="noopener noreferrer">
                                    <Button variant="outline" className="w-full">
                                        <FileText className="w-4 h-4 mr-2" />
                                        View My CV
                                    </Button>
                                </a>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Activity Timeline */}
                {activities.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <MessageSquare className="w-5 h-5" />
                                Activity & Updates
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {activities.map(activity => (
                                    <div key={activity.id} className="border-l-2 border-blue-500 pl-4 pb-4">
                                        <div className="font-medium text-sm">{activity.activity_type}</div>
                                        <div className="text-sm text-gray-600 mt-1">{activity.description}</div>
                                        <div className="text-xs text-gray-500 mt-1">
                                            {new Date(activity.created_date).toLocaleDateString()}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}