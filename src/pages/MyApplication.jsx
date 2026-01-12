import React from 'react';
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Mail, Phone, MapPin, Globe, FileText, Calendar, MessageSquare, ArrowRight } from "lucide-react";

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
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
                <Card className="max-w-md w-full border-0 shadow-lg">
                    <CardContent className="pt-12 pb-8 text-center">
                        <div className="p-4 bg-purple-100 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                            <FileText className="w-10 h-10 text-purple-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-3">No Application Found</h2>
                        <p className="text-gray-600 mb-8">You haven't submitted an application yet. Start your journey with us today.</p>
                        <Button 
                            size="lg"
                            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                            onClick={() => window.location.href = '/apply'}
                        >
                            Submit Application
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-4 lg:p-8">
            <div className="max-w-5xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">My Application</h1>
                    <p className="text-gray-600">Track the status of your freelancer application</p>
                </div>

                {/* Status Card */}
                <Card className="mb-8 border-0 shadow-sm bg-gradient-to-br from-purple-50 to-white">
                    <CardContent className="pt-8 pb-8">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <div className="text-sm font-medium text-purple-700 mb-2">Current Status</div>
                                <Badge className={`${statusColors[application.status]} text-base px-5 py-2`}>
                                    {application.status}
                                </Badge>
                            </div>
                            <div className="flex flex-col gap-3">
                                <div className="flex items-center gap-3 text-sm text-gray-700">
                                    <div className="p-2 bg-purple-100 rounded-lg">
                                        <Clock className="w-4 h-4 text-purple-600" />
                                    </div>
                                    <div>
                                        <div className="font-medium">Applied on</div>
                                        <div className="text-gray-600">{new Date(application.created_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
                                    </div>
                                </div>
                                {application.stage_changed_date && (
                                    <div className="flex items-center gap-3 text-sm text-gray-700">
                                        <div className="p-2 bg-purple-100 rounded-lg">
                                            <Calendar className="w-4 h-4 text-purple-600" />
                                        </div>
                                        <div>
                                            <div className="font-medium">Last updated</div>
                                            <div className="text-gray-600">{new Date(application.stage_changed_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Application Details */}
                <Card className="mb-8 border-0 shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <Globe className="w-5 h-5 text-blue-600" />
                            </div>
                            Your Information
                        </CardTitle>
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
                    <Card className="border-0 shadow-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-3">
                                <div className="p-2 bg-purple-100 rounded-lg">
                                    <MessageSquare className="w-5 h-5 text-purple-600" />
                                </div>
                                Activity & Updates
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {activities.map(activity => (
                                    <div key={activity.id} className="relative pl-8 pb-6 border-l-2 border-purple-200 last:pb-0">
                                        <div className="absolute left-0 top-0 -translate-x-1/2 w-4 h-4 bg-purple-500 rounded-full border-4 border-white"></div>
                                        <div className="font-semibold text-sm text-gray-900">{activity.activity_type}</div>
                                        <div className="text-sm text-gray-600 mt-1">{activity.description}</div>
                                        <div className="text-xs text-gray-500 mt-2">
                                            {new Date(activity.created_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
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