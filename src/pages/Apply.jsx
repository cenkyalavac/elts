import React, { useState } from 'react';
import { useQuery, useMutation } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Globe, Briefcase, Clock, Award, Users, TrendingUp, ArrowRight } from "lucide-react";
import ApplicationForm from "../components/apply/ApplicationForm";
import ApplicationSuccess from "../components/apply/ApplicationSuccess";
import { createPageUrl } from "../utils";

const LOGO_FULL = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/694868412332f081649b2833/6654b10be_elturco_logo-01.png";

export default function ApplyPage() {
    const [showForm, setShowForm] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [submittedName, setSubmittedName] = useState('');
    const [selectedPosition, setSelectedPosition] = useState(null);
    
    const { data: existingUser } = useQuery({
        queryKey: ['checkUser'],
        queryFn: async () => {
            const isAuth = await base44.auth.isAuthenticated();
            if (!isAuth) return null;
            return base44.auth.me();
        },
        staleTime: 300000,
        retry: false,
    });

    const urlParams = new URLSearchParams(window.location.search);
    const positionParam = urlParams.get('position');

    const { data: openPositions = [] } = useQuery({
        queryKey: ['openPositions'],
        queryFn: () => base44.entities.OpenPosition.filter({ is_active: true }),
    });

    React.useEffect(() => {
        if (positionParam) {
            const position = openPositions.find(p => p.id === positionParam);
            if (position) {
                setSelectedPosition(position);
                setShowForm(true);
            }
        }
    }, [positionParam, openPositions]);

    const benefits = [
        { icon: Globe, title: "Global Opportunities", description: "Work with clients from around the world on diverse projects" },
        { icon: Briefcase, title: "Flexible Schedule", description: "Choose projects that fit your schedule and lifestyle" },
        { icon: TrendingUp, title: "Professional Growth", description: "Continuous opportunities to develop your skills and expand your expertise" },
        { icon: Users, title: "Professional Network", description: "Join a community of skilled linguists and professionals" },
        { icon: Clock, title: "Quick Payments", description: "Reliable and timely payment processing" },
        { icon: Award, title: "Career Growth", description: "Access to training, certification support, and career development" }
    ];

    const handleApply = (position = null) => {
        setSelectedPosition(position);
        setShowForm(true);
    };

    return (
        <div className="min-h-screen bg-[#0f1629]">
            {/* Header */}
            <nav className="bg-[#0f1629]/80 backdrop-blur-md border-b border-white/5 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
                    <a href={createPageUrl('Home')}>
                        <img src={LOGO_FULL} alt="elturco" className="h-14 object-contain" />
                    </a>
                    <div className="flex gap-3">
                        {existingUser ? (
                            <Button 
                                variant="outline" 
                                className="text-gray-300 border-white/20 hover:bg-white/10 hover:text-white bg-transparent"
                                onClick={() => window.location.href = createPageUrl('MyApplication')}
                            >
                                My Application
                            </Button>
                        ) : (
                            <Button 
                                variant="outline" 
                                className="text-gray-300 border-white/20 hover:bg-white/10 hover:text-white bg-transparent"
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
                    <div className="relative overflow-hidden py-20 lg:py-28">
                        <div className="absolute top-10 left-10 w-72 h-72 bg-purple-600/20 rounded-full blur-[120px]"></div>
                        <div className="absolute bottom-0 right-10 w-64 h-64 bg-cyan-500/10 rounded-full blur-[100px]"></div>
                        <div className="relative max-w-6xl mx-auto px-6 text-center">
                            <div className="inline-block px-4 py-1.5 bg-purple-500/10 border border-purple-500/20 rounded-full text-sm text-purple-300 mb-6">
                                Join Our Network
                            </div>
                            <h1 className="text-4xl lg:text-6xl font-bold mb-6 leading-tight text-white">
                                Become a Regional<br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">Language Expert</span>
                            </h1>
                            <p className="text-lg lg:text-xl text-gray-400 mb-8 max-w-3xl mx-auto leading-relaxed">
                                Work with a leading LSP specializing in Central & Eastern Europe, Middle East, and Central Asia
                            </p>
                            <Button
                                size="lg"
                                className="bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-white border-0 px-8 text-lg shadow-lg shadow-purple-500/25"
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
                            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
                                Why Join Our Network?
                            </h2>
                            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
                                Work with a team that values expertise and cultural understanding
                            </p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {benefits.map((benefit, index) => (
                                <Card key={index} className="bg-white/5 border-white/10 hover:border-purple-500/30 transition-all group">
                                    <CardContent className="pt-6">
                                        <benefit.icon className="w-10 h-10 text-purple-400 mb-4 group-hover:text-purple-300 transition-colors" />
                                        <h3 className="text-lg font-semibold text-white mb-2">{benefit.title}</h3>
                                        <p className="text-gray-500 text-sm leading-relaxed">{benefit.description}</p>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>

                    {/* Open Positions Section */}
                    {openPositions.length > 0 && (
                        <div className="py-20 bg-[#111a2e]">
                            <div className="max-w-7xl mx-auto px-6">
                                <div className="text-center mb-16">
                                    <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
                                        Current Open Positions
                                    </h2>
                                    <p className="text-lg text-gray-500 max-w-2xl mx-auto">
                                        Apply for specific roles that match your expertise
                                    </p>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {openPositions.map(position => (
                                        <Card key={position.id} className="bg-white/5 border-white/10 hover:border-purple-500/30 transition-all">
                                            <CardHeader>
                                                <div className="flex justify-between items-start">
                                                    <CardTitle className="text-lg text-white">{position.title}</CardTitle>
                                                    {position.priority === 'high' && (
                                                        <Badge className="bg-red-500/20 text-red-300 border-red-500/30">Urgent</Badge>
                                                    )}
                                                </div>
                                            </CardHeader>
                                            <CardContent className="space-y-4">
                                                <p className="text-gray-400 text-sm">{position.description}</p>
                                                
                                                {position.language_pairs && position.language_pairs.length > 0 && (
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-300 mb-2">Language Pairs:</div>
                                                        <div className="flex flex-wrap gap-2">
                                                            {position.language_pairs.map((pair, idx) => (
                                                                <Badge key={idx} className="bg-white/5 border-white/10 text-gray-300">
                                                                    {pair.source_language} → {pair.target_language}
                                                                </Badge>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {position.required_service_types && position.required_service_types.length > 0 && (
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-300 mb-2">Services:</div>
                                                        <div className="flex flex-wrap gap-2">
                                                            {position.required_service_types.map((service, idx) => (
                                                                <Badge key={idx} className="bg-purple-500/10 text-purple-300 border-purple-500/20">
                                                                    {service}
                                                                </Badge>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {position.min_experience_years && (
                                                    <div className="flex items-center gap-2 text-sm text-gray-500">
                                                        <Award className="w-4 h-4" />
                                                        Min. {position.min_experience_years} years experience
                                                    </div>
                                                )}

                                                <Button
                                                    className="w-full bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 shadow-lg shadow-purple-500/25"
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
                    <div className="py-20 border-t border-white/5">
                        <div className="max-w-4xl mx-auto px-6 text-center">
                            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
                                Don't See a Perfect Match?
                            </h2>
                            <p className="text-lg text-gray-400 mb-8">
                                Submit a general application and we'll keep you in mind for future opportunities
                            </p>
                            <Button
                                size="lg"
                                className="bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-white px-8 shadow-lg shadow-purple-500/25"
                                onClick={() => handleApply(null)}
                            >
                                Submit General Application
                                <ArrowRight className="w-5 h-5 ml-2" />
                            </Button>
                        </div>
                    </div>
                </>
            ) : submitted ? (
                <div className="max-w-4xl mx-auto px-6 py-12">
                    <ApplicationSuccess applicantName={submittedName} />
                </div>
            ) : (
                <div className="max-w-4xl mx-auto px-6 py-12">
                    <ApplicationForm
                        position={selectedPosition}
                        onCancel={() => {
                            setShowForm(false);
                            setSelectedPosition(null);
                        }}
                        onSuccess={(name) => {
                            setSubmittedName(name || '');
                            setSubmitted(true);
                        }}
                    />
                </div>
            )}
        </div>
    );
}