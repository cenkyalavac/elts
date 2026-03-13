import React, { useState, useRef } from 'react';
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Globe, Briefcase, Clock, Award, Users, TrendingUp, ArrowRight, ArrowDown, ChevronDown } from "lucide-react";
import ApplicationFormFull from "../components/apply/ApplicationFormFull";
import ApplicationSuccess from "../components/apply/ApplicationSuccess";
import PositionCard from "../components/apply/PositionCard";
import { createPageUrl } from "../utils";

const LOGO_FULL = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/694868412332f081649b2833/6654b10be_elturco_logo-01.png";

export default function ApplyPage() {
    const [showForm, setShowForm] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [submittedName, setSubmittedName] = useState('');
    const [selectedPosition, setSelectedPosition] = useState(null);
    const positionsRef = useRef(null);

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

    const scrollToPositions = () => {
        positionsRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleApply = (position = null) => {
        setSelectedPosition(position);
        setShowForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const benefits = [
        { icon: Globe, title: "Global Opportunities", description: "Work with clients worldwide on diverse localization projects" },
        { icon: Briefcase, title: "Flexible Schedule", description: "Choose projects that fit your schedule and lifestyle" },
        { icon: TrendingUp, title: "Professional Growth", description: "Continuous learning, training programs, and skill development" },
        { icon: Users, title: "Community", description: "Join a network of skilled linguists and localization experts" },
        { icon: Clock, title: "Reliable Payments", description: "Transparent and timely payment processing" },
        { icon: Award, title: "Career Development", description: "Access to our Localization Ninja training and certifications" }
    ];

    return (
        <div className="min-h-screen bg-[#0f1629]">
            {/* Header */}
            <nav className="bg-[#0f1629]/80 backdrop-blur-md border-b border-white/5 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
                    <a href={createPageUrl('Home')}>
                        <img src={LOGO_FULL} alt="elturco" className="h-14 object-contain" />
                    </a>
                    <div className="flex gap-3">
                        {!showForm && (
                            <Button
                                variant="outline"
                                className="text-gray-300 border-white/20 hover:bg-white/10 hover:text-white bg-transparent hidden sm:flex"
                                onClick={scrollToPositions}
                            >
                                Open Positions
                                <ChevronDown className="w-4 h-4 ml-1" />
                            </Button>
                        )}
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

            {showForm && !submitted ? (
                <div className="px-6 py-12">
                    <ApplicationFormFull
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
            ) : submitted ? (
                <div className="max-w-4xl mx-auto px-6 py-12">
                    <ApplicationSuccess applicantName={submittedName} />
                </div>
            ) : (
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
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <Button
                                    size="lg"
                                    className="bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-white border-0 px-8 text-lg shadow-lg shadow-purple-500/25"
                                    onClick={scrollToPositions}
                                >
                                    View Open Positions
                                    <ArrowDown className="w-5 h-5 ml-2" />
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Benefits Section */}
                    <div className="max-w-7xl mx-auto px-6 py-16">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
                                Why Join Our Network?
                            </h2>
                            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
                                Work with a team that values expertise and cultural understanding
                            </p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                            {benefits.map((benefit, index) => (
                                <div key={index} className="bg-white/5 border border-white/10 rounded-xl p-5 hover:border-purple-500/30 transition-all group">
                                    <benefit.icon className="w-9 h-9 text-purple-400 mb-3 group-hover:text-purple-300 transition-colors" />
                                    <h3 className="text-base font-semibold text-white mb-1">{benefit.title}</h3>
                                    <p className="text-gray-500 text-sm leading-relaxed">{benefit.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Open Positions Section */}
                    <div ref={positionsRef} className="py-20 bg-[#111a2e]" id="positions">
                        <div className="max-w-7xl mx-auto px-6">
                            <div className="text-center mb-12">
                                <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
                                    Open Positions
                                </h2>
                                <p className="text-lg text-gray-500 max-w-2xl mx-auto">
                                    Browse current opportunities and apply for roles that match your expertise
                                </p>
                            </div>

                            {openPositions.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-12">
                                    {openPositions.map(position => (
                                        <PositionCard
                                            key={position.id}
                                            position={position}
                                            onApply={handleApply}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12 mb-8">
                                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Briefcase className="w-8 h-8 text-gray-600" />
                                    </div>
                                    <p className="text-gray-400 text-lg mb-2">No specific positions open right now</p>
                                    <p className="text-gray-500 text-sm">But we're always looking for talent — submit a general application below!</p>
                                </div>
                            )}

                            {/* General Application CTA */}
                            <div className="bg-gradient-to-r from-purple-900/40 to-cyan-900/20 border border-purple-500/20 rounded-2xl p-8 md:p-12 text-center">
                                <h3 className="text-2xl lg:text-3xl font-bold text-white mb-3">
                                    Don't See a Perfect Match?
                                </h3>
                                <p className="text-gray-400 mb-6 max-w-xl mx-auto">
                                    Submit a general application and we'll keep you in mind for future opportunities that match your skills and language pairs.
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
                    </div>
                </>
            )}
        </div>
    );
}