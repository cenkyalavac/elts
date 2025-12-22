import React, { useState } from 'react';
import { useQuery, useMutation } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Globe, Briefcase, Clock, Award, Users, TrendingUp } from "lucide-react";
import ApplicationForm from "../components/apply/ApplicationForm";
import { createPageUrl } from "../utils";

export default function ApplyPage() {
    const [showForm, setShowForm] = useState(false);
    const [selectedPosition, setSelectedPosition] = useState(null);
    
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

    const { data: openPositions = [] } = useQuery({
        queryKey: ['openPositions'],
        queryFn: () => base44.entities.OpenPosition.filter({ is_active: true }),
    });

    const benefits = [
        { icon: Globe, title: "Global Opportunities", description: "Work with clients from around the world on diverse projects" },
        { icon: Briefcase, title: "Flexible Schedule", description: "Choose projects that fit your schedule and lifestyle" },
        { icon: TrendingUp, title: "Competitive Rates", description: "Fair compensation based on your expertise and specialization" },
        { icon: Users, title: "Professional Network", description: "Join a community of skilled linguists and professionals" },
        { icon: Clock, title: "Quick Payments", description: "Reliable and timely payment processing" },
        { icon: Award, title: "Career Growth", description: "Access to training, certification support, and career development" }
    ];

    const handleApply = (position = null) => {
        setSelectedPosition(position);
        setShowForm(true);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
            {/* Header */}
            <nav className="bg-white border-b shadow-sm">
                <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
                    <a href={createPageUrl('Home')} className="text-2xl font-bold text-blue-600">
                        LSP Portal
                    </a>
                    <div className="flex gap-3">
                        {existingUser ? (
                            <Button variant="outline" onClick={() => window.location.href = createPageUrl('MyApplication')}>
                                My Application
                            </Button>
                        ) : (
                            <Button variant="outline" onClick={() => base44.auth.redirectToLogin()}>
                                Login
                            </Button>
                        )}
                    </div>
                </div>
            </nav>

            {!showForm ? (
                <>
                    {/* Hero Section */}
                    <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-20">
                        <div className="max-w-6xl mx-auto px-6 text-center">
                            <h1 className="text-5xl font-bold mb-6">Join Our Team of Expert Linguists</h1>
                            <p className="text-xl mb-8 text-blue-100">
                                Be part of a leading language service provider and work on exciting international projects
                            </p>
                            <Button
                                size="lg"
                                className="bg-white text-blue-600 hover:bg-blue-50 text-lg px-8"
                                onClick={() => handleApply(null)}
                            >
                                Apply Now
                            </Button>
                        </div>
                    </div>

                    {/* Benefits Section */}
                    <div className="max-w-6xl mx-auto px-6 py-16">
                        <h2 className="text-3xl font-bold text-center mb-12">Why Work With Us?</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {benefits.map((benefit, index) => (
                                <Card key={index} className="hover:shadow-lg transition-shadow">
                                    <CardContent className="pt-6">
                                        <benefit.icon className="w-12 h-12 text-blue-600 mb-4" />
                                        <h3 className="text-xl font-semibold mb-2">{benefit.title}</h3>
                                        <p className="text-gray-600">{benefit.description}</p>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>

                    {/* Open Positions Section */}
                    {openPositions.length > 0 && (
                        <div className="bg-gray-50 py-16">
                            <div className="max-w-6xl mx-auto px-6">
                                <h2 className="text-3xl font-bold text-center mb-12">Current Open Positions</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {openPositions.map(position => (
                                        <Card key={position.id} className="hover:shadow-lg transition-shadow">
                                            <CardHeader>
                                                <div className="flex justify-between items-start">
                                                    <CardTitle className="text-xl">{position.title}</CardTitle>
                                                    {position.priority === 'high' && (
                                                        <Badge variant="destructive">Urgent</Badge>
                                                    )}
                                                </div>
                                            </CardHeader>
                                            <CardContent className="space-y-4">
                                                <p className="text-gray-700">{position.description}</p>
                                                
                                                {position.language_pairs && position.language_pairs.length > 0 && (
                                                    <div>
                                                        <div className="text-sm font-medium mb-2">Language Pairs:</div>
                                                        <div className="flex flex-wrap gap-2">
                                                            {position.language_pairs.map((pair, idx) => (
                                                                <Badge key={idx} variant="outline">
                                                                    {pair.source_language} → {pair.target_language}
                                                                </Badge>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {position.required_service_types && position.required_service_types.length > 0 && (
                                                    <div>
                                                        <div className="text-sm font-medium mb-2">Services:</div>
                                                        <div className="flex flex-wrap gap-2">
                                                            {position.required_service_types.map((service, idx) => (
                                                                <Badge key={idx} className="bg-blue-100 text-blue-800">
                                                                    {service}
                                                                </Badge>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {position.min_experience_years && (
                                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                                        <Award className="w-4 h-4" />
                                                        Min. {position.min_experience_years} years experience
                                                    </div>
                                                )}

                                                <Button
                                                    className="w-full"
                                                    onClick={() => handleApply(position)}
                                                >
                                                    Apply for This Position
                                                </Button>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* General Application CTA */}
                    <div className="max-w-6xl mx-auto px-6 py-16 text-center">
                        <h2 className="text-3xl font-bold mb-4">Don't see a perfect match?</h2>
                        <p className="text-xl text-gray-600 mb-8">
                            Submit a general application and we'll keep you in mind for future opportunities
                        </p>
                        <Button
                            size="lg"
                            variant="outline"
                            className="text-lg px-8"
                            onClick={() => handleApply(null)}
                        >
                            Submit General Application
                        </Button>
                    </div>
                </>
            ) : (
                <div className="max-w-4xl mx-auto px-6 py-12">
                    <ApplicationForm
                        position={selectedPosition}
                        onCancel={() => {
                            setShowForm(false);
                            setSelectedPosition(null);
                        }}
                        onSuccess={() => {
                            setShowForm(false);
                            setSelectedPosition(null);
                        }}
                    />
                </div>
            )}
        </div>
    );
}