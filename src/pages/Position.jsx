import React, { useState } from 'react';
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
    Globe, Briefcase, Clock, Award, Users, TrendingUp, 
    MapPin, CheckCircle, ArrowRight, Building2, Calendar,
    Languages, Star, Zap
} from "lucide-react";
import ApplicationForm from "../components/apply/ApplicationForm";
import { createPageUrl } from "../utils";

export default function PositionPage() {
    const [showForm, setShowForm] = useState(false);
    
    const urlParams = new URLSearchParams(window.location.search);
    const positionId = urlParams.get('id');

    const { data: existingUser } = useQuery({
        queryKey: ['checkUser'],
        queryFn: async () => {
            try {
                return await base44.auth.me();
            } catch {
                return null;
            }
        },
    });

    const { data: position, isLoading } = useQuery({
        queryKey: ['position', positionId],
        queryFn: () => base44.entities.OpenPosition.filter({ id: positionId }),
        enabled: !!positionId,
        select: (data) => data[0],
    });

    const benefits = [
        { icon: Globe, title: "Remote Work", description: "Work from anywhere in the world" },
        { icon: TrendingUp, title: "Competitive Rates", description: "Fair compensation for your expertise" },
        { icon: Clock, title: "Flexible Hours", description: "Choose your own schedule" },
        { icon: Users, title: "Great Team", description: "Join a supportive community" },
    ];

    if (isLoading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="animate-pulse text-purple-600">Loading...</div>
            </div>
        );
    }

    if (!position) {
        return (
            <div className="min-h-screen bg-white">
                <nav className="bg-gradient-to-r from-purple-900 via-purple-800 to-pink-700 text-white">
                    <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
                        <a href={createPageUrl('Home')} className="flex items-center gap-2">
                            <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center font-bold">
                                et
                            </div>
                            <span className="text-xl font-bold">el turco</span>
                        </a>
                    </div>
                </nav>
                <div className="max-w-4xl mx-auto px-6 py-20 text-center">
                    <h1 className="text-3xl font-bold text-gray-900 mb-4">Position Not Found</h1>
                    <p className="text-gray-600 mb-8">This position may have been filled or is no longer available.</p>
                    <Button onClick={() => window.location.href = createPageUrl('Apply')}>
                        View All Open Positions
                    </Button>
                </div>
            </div>
        );
    }

    if (!position.is_active) {
        return (
            <div className="min-h-screen bg-white">
                <nav className="bg-gradient-to-r from-purple-900 via-purple-800 to-pink-700 text-white">
                    <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
                        <a href={createPageUrl('Home')} className="flex items-center gap-2">
                            <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center font-bold">
                                et
                            </div>
                            <span className="text-xl font-bold">el turco</span>
                        </a>
                    </div>
                </nav>
                <div className="max-w-4xl mx-auto px-6 py-20 text-center">
                    <h1 className="text-3xl font-bold text-gray-900 mb-4">Position Closed</h1>
                    <p className="text-gray-600 mb-8">This position is no longer accepting applications.</p>
                    <Button onClick={() => window.location.href = createPageUrl('Apply')}>
                        View Other Opportunities
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white">
            {/* Header */}
            <nav className="bg-gradient-to-r from-purple-900 via-purple-800 to-pink-700 text-white sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
                    <a href={createPageUrl('Home')} className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center font-bold">
                            et
                        </div>
                        <span className="text-xl font-bold">el turco</span>
                    </a>
                    <div className="flex gap-3">
                        {existingUser ? (
                            <Button 
                                variant="ghost" 
                                className="text-white hover:bg-white/10"
                                onClick={() => window.location.href = createPageUrl('MyApplication')}
                            >
                                My Application
                            </Button>
                        ) : (
                            <Button 
                                variant="ghost" 
                                className="text-white hover:bg-white/10"
                                onClick={() => base44.auth.redirectToLogin()}
                            >
                                Login
                            </Button>
                        )}
                    </div>
                </div>
            </nav>

            {!showForm ? (
                <>
                    {/* Hero Section */}
                    <div className="bg-gradient-to-br from-purple-900 via-purple-800 to-pink-700 text-white py-16 lg:py-24">
                        <div className="max-w-5xl mx-auto px-6">
                            <div className="flex flex-col lg:flex-row gap-8 items-start">
                                <div className="flex-1">
                                    {position.priority === 'high' && (
                                        <Badge className="bg-orange-500 text-white mb-4">
                                            <Zap className="w-3 h-3 mr-1" />
                                            Urgent Hiring
                                        </Badge>
                                    )}
                                    <h1 className="text-3xl lg:text-5xl font-bold mb-4 leading-tight">
                                        {position.title}
                                    </h1>
                                    <div className="flex flex-wrap items-center gap-4 text-purple-200 mb-6">
                                        <span className="flex items-center gap-1">
                                            <Building2 className="w-4 h-4" />
                                            el turco
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <MapPin className="w-4 h-4" />
                                            {position.location_type === 'remote' ? 'Remote' : 
                                             position.location_type === 'hybrid' ? 'Hybrid' : 'On-site'}
                                        </span>
                                        {position.rate_range && (
                                            <span className="flex items-center gap-1">
                                                <TrendingUp className="w-4 h-4" />
                                                {position.rate_range}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-lg text-purple-100 leading-relaxed mb-8">
                                        {position.short_description || position.description?.substring(0, 200)}
                                    </p>
                                    <Button
                                        size="lg"
                                        className="bg-white text-purple-900 hover:bg-gray-100 px-8 text-lg"
                                        onClick={() => setShowForm(true)}
                                    >
                                        Apply Now
                                        <ArrowRight className="w-5 h-5 ml-2" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="max-w-5xl mx-auto px-6 py-16">
                        <div className="grid lg:grid-cols-3 gap-8">
                            {/* Left Column - Details */}
                            <div className="lg:col-span-2 space-y-8">
                                {/* Description */}
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900 mb-4">About This Role</h2>
                                    <div className="prose prose-lg text-gray-700 whitespace-pre-wrap">
                                        {position.description}
                                    </div>
                                </div>

                                {/* Requirements */}
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Requirements</h2>
                                    <div className="space-y-4">
                                        {position.language_pairs && position.language_pairs.length > 0 && (
                                            <div className="flex items-start gap-3">
                                                <Languages className="w-5 h-5 text-purple-600 mt-1" />
                                                <div>
                                                    <div className="font-medium text-gray-900">Language Pairs</div>
                                                    <div className="flex flex-wrap gap-2 mt-2">
                                                        {position.language_pairs.map((pair, idx) => (
                                                            <Badge key={idx} variant="outline" className="text-sm">
                                                                {pair.source_language} → {pair.target_language}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {position.required_service_types && position.required_service_types.length > 0 && (
                                            <div className="flex items-start gap-3">
                                                <Briefcase className="w-5 h-5 text-purple-600 mt-1" />
                                                <div>
                                                    <div className="font-medium text-gray-900">Services Required</div>
                                                    <div className="flex flex-wrap gap-2 mt-2">
                                                        {position.required_service_types.map((service, idx) => (
                                                            <Badge key={idx} className="bg-purple-100 text-purple-800">
                                                                {service}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {position.min_experience_years && (
                                            <div className="flex items-start gap-3">
                                                <Award className="w-5 h-5 text-purple-600 mt-1" />
                                                <div>
                                                    <div className="font-medium text-gray-900">Experience</div>
                                                    <p className="text-gray-600">
                                                        Minimum {position.min_experience_years} years of professional experience
                                                    </p>
                                                </div>
                                            </div>
                                        )}

                                        {position.required_specializations && position.required_specializations.length > 0 && (
                                            <div className="flex items-start gap-3">
                                                <Star className="w-5 h-5 text-purple-600 mt-1" />
                                                <div>
                                                    <div className="font-medium text-gray-900">Specializations</div>
                                                    <div className="flex flex-wrap gap-2 mt-2">
                                                        {position.required_specializations.map((spec, idx) => (
                                                            <Badge key={idx} variant="secondary">
                                                                {spec}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {position.required_skills && position.required_skills.length > 0 && (
                                            <div className="flex items-start gap-3">
                                                <CheckCircle className="w-5 h-5 text-purple-600 mt-1" />
                                                <div>
                                                    <div className="font-medium text-gray-900">Required Skills</div>
                                                    <ul className="mt-2 space-y-1">
                                                        {position.required_skills.map((skill, idx) => (
                                                            <li key={idx} className="text-gray-600 flex items-center gap-2">
                                                                <div className="w-1.5 h-1.5 bg-purple-600 rounded-full" />
                                                                {skill}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Right Column - Sidebar */}
                            <div className="space-y-6">
                                {/* Apply Card */}
                                <Card className="sticky top-24 border-2 border-purple-200 shadow-lg">
                                    <CardContent className="p-6">
                                        <h3 className="text-lg font-bold text-gray-900 mb-4">
                                            Ready to Apply?
                                        </h3>
                                        <p className="text-gray-600 mb-6">
                                            Join our team of professional linguists and start working on exciting projects.
                                        </p>
                                        <Button
                                            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                                            size="lg"
                                            onClick={() => setShowForm(true)}
                                        >
                                            Apply Now
                                            <ArrowRight className="w-4 h-4 ml-2" />
                                        </Button>
                                        <p className="text-xs text-gray-500 mt-4 text-center">
                                            Application takes about 5 minutes
                                        </p>
                                    </CardContent>
                                </Card>

                                {/* Benefits */}
                                <Card>
                                    <CardContent className="p-6">
                                        <h3 className="text-lg font-bold text-gray-900 mb-4">
                                            Why Join Us?
                                        </h3>
                                        <div className="space-y-4">
                                            {(position.benefits || benefits.map(b => b.title)).slice(0, 4).map((benefit, idx) => (
                                                <div key={idx} className="flex items-center gap-3">
                                                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                                                    <span className="text-gray-700">{typeof benefit === 'string' ? benefit : benefit.title}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </div>

                    {/* Bottom CTA */}
                    <div className="bg-gradient-to-r from-purple-900 to-pink-700 text-white py-16">
                        <div className="max-w-4xl mx-auto px-6 text-center">
                            <h2 className="text-3xl font-bold mb-4">
                                Don't Miss This Opportunity
                            </h2>
                            <p className="text-xl text-purple-100 mb-8">
                                Join our growing network of language professionals
                            </p>
                            <Button
                                size="lg"
                                className="bg-white text-purple-900 hover:bg-gray-100 px-8"
                                onClick={() => setShowForm(true)}
                            >
                                Apply Now
                                <ArrowRight className="w-5 h-5 ml-2" />
                            </Button>
                        </div>
                    </div>
                </>
            ) : (
                <div className="max-w-4xl mx-auto px-6 py-12">
                    <ApplicationForm
                        position={position}
                        onCancel={() => setShowForm(false)}
                        onSuccess={() => setShowForm(false)}
                    />
                </div>
            )}
        </div>
    );
}