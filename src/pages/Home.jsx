import React from 'react';
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Briefcase, Shield, FileText, ArrowRight } from "lucide-react";
import { createPageUrl } from "../utils";

export default function HomePage() {
    const { data: user } = useQuery({
        queryKey: ['currentUser'],
        queryFn: async () => {
            try {
                return await base44.auth.me();
            } catch {
                return null;
            }
        },
    });

    // If logged in, redirect based on role
    React.useEffect(() => {
        if (user) {
            if (user.role === 'applicant') {
                window.location.href = createPageUrl('MyApplication');
            } else {
                window.location.href = createPageUrl('Pipeline');
            }
        }
    }, [user]);

    if (user) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Redirecting...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white">
            {/* Navigation */}
            <nav className="bg-gradient-to-r from-purple-900 via-purple-800 to-pink-700 text-white">
                <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center font-bold">
                            et
                        </div>
                        <span className="text-xl font-bold">el turco</span>
                    </div>
                    <Button 
                        variant="ghost" 
                        className="text-white hover:bg-white/10"
                        onClick={() => base44.auth.redirectToLogin()}
                    >
                        Staff Login
                    </Button>
                </div>
            </nav>

            {/* Hero Section */}
            <div className="bg-gradient-to-br from-purple-900 via-purple-800 to-pink-700 text-white py-24 lg:py-32">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        <div>
                            <div className="inline-block px-4 py-1.5 bg-white/10 rounded-full text-sm mb-6">
                                Freelancer Portal
                            </div>
                            <h1 className="text-4xl lg:text-6xl font-bold mb-6 leading-tight">
                                Join Our Network of Expert Linguists
                            </h1>
                            <p className="text-lg lg:text-xl text-purple-100 mb-8 leading-relaxed">
                                Work with a leading language service provider specializing in regional markets.
                                Be part of our growing network of 700+ vetted professionals.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4">
                                <Button
                                    size="lg"
                                    className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white border-0 px-8"
                                    onClick={() => window.location.href = createPageUrl('Apply')}
                                >
                                    Apply Now
                                    <ArrowRight className="w-5 h-5 ml-2" />
                                </Button>
                                <Button
                                    size="lg"
                                    className="bg-white text-purple-900 hover:bg-gray-100 border-0 px-8"
                                    onClick={() => base44.auth.redirectToLogin(createPageUrl('MyApplication'))}
                                >
                                    Check Application Status
                                </Button>
                            </div>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 gap-6">
                            <Card className="bg-white/10 border-white/20 backdrop-blur-sm text-white">
                                <CardContent className="pt-6">
                                    <div className="text-4xl font-bold mb-2">700+</div>
                                    <div className="text-sm text-purple-100">Vetted Linguists</div>
                                </CardContent>
                            </Card>
                            <Card className="bg-white/10 border-white/20 backdrop-blur-sm text-white">
                                <CardContent className="pt-6">
                                    <div className="text-4xl font-bold mb-2">40+</div>
                                    <div className="text-sm text-purple-100">Language Pairs</div>
                                </CardContent>
                            </Card>
                            <Card className="bg-white/10 border-white/20 backdrop-blur-sm text-white">
                                <CardContent className="pt-6">
                                    <div className="text-4xl font-bold mb-2">10+</div>
                                    <div className="text-sm text-purple-100">Years Avg. Experience</div>
                                </CardContent>
                            </Card>
                            <Card className="bg-white/10 border-white/20 backdrop-blur-sm text-white">
                                <CardContent className="pt-6">
                                    <div className="text-4xl font-bold mb-2">ISO</div>
                                    <div className="text-sm text-purple-100">17100 Compliant</div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>

            {/* Benefits Section */}
            <div className="py-20 bg-gray-50">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                            Why Work With Us?
                        </h2>
                        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                            Join a team that values quality, expertise, and cultural understanding
                        </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <Card className="border-0 shadow-sm hover:shadow-lg transition-all">
                            <CardContent className="pt-6">
                                <Users className="w-12 h-12 text-purple-600 mb-4" />
                                <h3 className="text-xl font-semibold mb-3">Expert Network</h3>
                                <p className="text-gray-600 leading-relaxed">
                                    Work alongside 700+ vetted professionals with 10+ years average experience
                                </p>
                            </CardContent>
                        </Card>
                        <Card className="border-0 shadow-sm hover:shadow-lg transition-all">
                            <CardContent className="pt-6">
                                <Briefcase className="w-12 h-12 text-purple-600 mb-4" />
                                <h3 className="text-xl font-semibold mb-3">Diverse Projects</h3>
                                <p className="text-gray-600 leading-relaxed">
                                    Gaming, e-commerce, fintech, and life sciences across regional markets
                                </p>
                            </CardContent>
                        </Card>
                        <Card className="border-0 shadow-sm hover:shadow-lg transition-all">
                            <CardContent className="pt-6">
                                <Shield className="w-12 h-12 text-purple-600 mb-4" />
                                <h3 className="text-xl font-semibold mb-3">Reliable Payment</h3>
                                <p className="text-gray-600 leading-relaxed">
                                    Timely payments and transparent rates for all completed projects
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            {/* CTA Section */}
            <div className="bg-gradient-to-r from-purple-900 to-pink-700 text-white py-20">
                <div className="max-w-4xl mx-auto px-6 text-center">
                    <h2 className="text-3xl lg:text-4xl font-bold mb-6">
                        Ready to Join Our Team?
                    </h2>
                    <p className="text-xl text-purple-100 mb-8">
                        Apply now and become part of a network that values expertise and cultural understanding
                    </p>
                    <Button
                        size="lg"
                        className="bg-white text-purple-900 hover:bg-gray-100 px-8"
                        onClick={() => window.location.href = createPageUrl('Apply')}
                    >
                        Start Your Application
                        <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                </div>
            </div>
        </div>
    );
}