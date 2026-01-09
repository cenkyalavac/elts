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
        <div className="min-h-screen bg-white">
            {/* Header */}
            <nav className="bg-gradient-to-r from-purple-900 via-purple-800 to-pink-700 text-white">
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
                    <div className="bg-gradient-to-br from-purple-900 via-purple-800 to-pink-700 text-white py-20 lg:py-28">
                        <div className="max-w-6xl mx-auto px-6 text-center">
                            <div className="inline-block px-4 py-1.5 bg-white/10 rounded-full text-sm mb-6">
                                Join Our Network
                            </div>
                            <h1 className="text-4xl lg:text-6xl font-bold mb-6 leading-tight">
                                Become a Regional<br />Language Expert
                            </h1>
                            <p className="text-lg lg:text-xl text-purple-100 mb-8 max-w-3xl mx-auto leading-relaxed">
                                Work with a leading LSP specializing in Central & Eastern Europe, Middle East, and Central Asia
                            </p>
                            <Button
                                size="lg"
                                className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white border-0 px-8 text-lg"
                                onClick={() => handleApply(null)}
                            >
                                Submit Application
                                <ArrowRight className="w-5 h-5 ml-2" />
                            </Button>
                        </div>
                    </div>

                    {/* Benefits Section */}
                    <div className="max-w-7xl mx-auto px-6 py-20">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                                Why Join Our Network?
                            </h2>
                            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                                Work with a team that values expertise and cultural understanding
                            </p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {benefits.map((benefit, index) => (
                                <Card key={index} className="border-0 shadow-sm hover:shadow-lg transition-all">
                                    <CardContent className="pt-6">
                                        <benefit.icon className="w-12 h-12 text-purple-600 mb-4" />
                                        <h3 className="text-xl font-semibold mb-3">{benefit.title}</h3>
                                        <p className="text-gray-600 leading-relaxed">{benefit.description}</p>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>

                    {/* Open Positions Section */}
                    {openPositions.length > 0 && (
                        <div className="bg-gray-50 py-20">
                            <div className="max-w-7xl mx-auto px-6">
                                <div className="text-center mb-16">
                                    <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                                        Current Open Positions
                                    </h2>
                                    <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                                        Apply for specific roles that match your expertise
                                    </p>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {openPositions.map(position => (
                                        <Card key={position.id} className="border-0 shadow-sm hover:shadow-xl transition-all">
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
                                                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                                                    onClick={() => handleApply(position)}
                                                >
                                                    Apply for This Position
                                                    <ArrowRight className="w-4 h-4 ml-2" />
                                                </Button>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* General Application CTA */}
                    <div className="bg-gradient-to-r from-purple-900 to-pink-700 text-white py-20">
                        <div className="max-w-4xl mx-auto px-6 text-center">
                            <h2 className="text-3xl lg:text-4xl font-bold mb-6">
                                Don't See a Perfect Match?
                            </h2>
                            <p className="text-xl text-purple-100 mb-8">
                                Submit a general application and we'll keep you in mind for future opportunities
                            </p>
                            <Button
                                size="lg"
                                className="bg-white text-purple-900 hover:bg-gray-100 px-8"
                                onClick={() => handleApply(null)}
                            >
                                Submit General Application
                                <ArrowRight className="w-5 h-5 ml-2" />
                            </Button>
                        </div>
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