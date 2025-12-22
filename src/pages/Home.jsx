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
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
            {/* Hero Section */}
            <div className="container mx-auto px-6 py-20">
                <div className="text-center mb-16">
                    <h1 className="text-5xl font-bold text-gray-900 mb-4">
                        LSP Freelancer Portal
                    </h1>
                    <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                        Connect with language service providers and manage your freelance career
                    </p>
                </div>

                {/* Options */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                    {/* Apply as Freelancer */}
                    <Card className="hover:shadow-xl transition-shadow cursor-pointer" onClick={() => window.location.href = createPageUrl('Apply')}>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-3 text-2xl">
                                <FileText className="w-8 h-8 text-blue-600" />
                                Join as Freelancer
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-gray-600">
                                Submit your application to work with leading language service providers
                            </p>
                            <ul className="space-y-2 text-sm text-gray-600">
                                <li>• Flexible work opportunities</li>
                                <li>• Competitive rates</li>
                                <li>• Work with global clients</li>
                                <li>• Professional development</li>
                            </ul>
                            <Button className="w-full bg-blue-600 hover:bg-blue-700">
                                Apply Now
                                <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Staff Login */}
                    <Card className="hover:shadow-xl transition-shadow cursor-pointer" onClick={() => base44.auth.redirectToLogin()}>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-3 text-2xl">
                                <Shield className="w-8 h-8 text-green-600" />
                                Staff Login
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-gray-600">
                                Access the management portal for administrators and project managers
                            </p>
                            <ul className="space-y-2 text-sm text-gray-600">
                                <li>• Manage applications</li>
                                <li>• Track recruitment pipeline</li>
                                <li>• View analytics</li>
                                <li>• Team collaboration</li>
                            </ul>
                            <Button className="w-full bg-green-600 hover:bg-green-700">
                                Login
                                <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                {/* Check Application Status */}
                <div className="text-center mt-12">
                    <p className="text-gray-600 mb-4">
                        Already applied? Check your application status
                    </p>
                    <Button 
                        variant="outline" 
                        onClick={() => base44.auth.redirectToLogin(createPageUrl('MyApplication'))}
                    >
                        View My Application
                    </Button>
                </div>
            </div>

            {/* Features Section */}
            <div className="bg-white py-16">
                <div className="container mx-auto px-6">
                    <h2 className="text-3xl font-bold text-center mb-12">Why Join Our Network?</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="text-center">
                            <Users className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold mb-2">Growing Network</h3>
                            <p className="text-gray-600">
                                Join hundreds of professional translators and interpreters
                            </p>
                        </div>
                        <div className="text-center">
                            <Briefcase className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold mb-2">Diverse Projects</h3>
                            <p className="text-gray-600">
                                Work on various projects across multiple industries
                            </p>
                        </div>
                        <div className="text-center">
                            <Shield className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold mb-2">Reliable Payment</h3>
                            <p className="text-gray-600">
                                Secure and timely payment for your services
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}