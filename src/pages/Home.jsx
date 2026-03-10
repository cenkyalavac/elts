import React from 'react';
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Briefcase, Shield, ArrowRight, CheckCircle, Zap } from "lucide-react";
import { createPageUrl } from "../utils";

const LOGO_LIGHT = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/694868412332f081649b2833/2d72cba1e_elturco_logo-03.png";
const LOGO_DARK = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/694868412332f081649b2833/0a1d593a6_elturco_logo-04.png";

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

    React.useEffect(() => {
        document.title = "elturco - Freelancer Portal";
        
        const setMeta = (property, content) => {
            let el = document.querySelector(`meta[property="${property}"]`);
            if (!el) {
                el = document.createElement('meta');
                el.setAttribute('property', property);
                document.head.appendChild(el);
            }
            el.setAttribute('content', content);
        };
        setMeta('og:title', 'elturco - Freelancer Portal');
        setMeta('og:description', 'Join our network of 700+ expert linguists');
        setMeta('og:image', 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/694868412332f081649b2833/5868dd4a9_0f83e6da-01b1-42b6-b8df-83eedb472954.png');

        let favicon = document.querySelector("link[rel='icon']");
        if (favicon) {
            favicon.href = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/694868412332f081649b2833/5868dd4a9_0f83e6da-01b1-42b6-b8df-83eedb472954.png";
        }
    }, []);

    React.useEffect(() => {
        if (user) {
            if (user.role === 'applicant') {
                window.location.href = createPageUrl('MyApplication');
            } else {
                window.location.href = createPageUrl('Dashboard');
            }
        }
    }, [user]);

    if (user) {
        return (
            <div className="min-h-screen bg-[#0f1629] flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
                    <p className="mt-4 text-gray-400">Redirecting...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0f1629]">
            {/* Navigation */}
            <nav className="bg-[#0f1629]/80 backdrop-blur-md border-b border-white/5 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
                    <img src={LOGO_LIGHT} alt="elturco" className="h-9" />
                    <Button 
                        variant="outline" 
                        className="text-gray-300 border-white/20 hover:bg-white/10 hover:text-white bg-transparent"
                        onClick={() => base44.auth.redirectToLogin()}
                    >
                        Staff Login
                    </Button>
                </div>
            </nav>

            {/* Hero Section */}
            <div className="relative overflow-hidden">
                {/* Subtle grid background */}
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSA2MCAwIEwgMCAwIDAgNjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-50"></div>
                {/* Gradient orbs */}
                <div className="absolute top-20 left-10 w-72 h-72 bg-purple-600/20 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-10 right-20 w-96 h-96 bg-cyan-500/10 rounded-full blur-[150px]"></div>

                <div className="relative max-w-7xl mx-auto px-6 py-24 lg:py-36">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        <div>
                            <div className="inline-block px-4 py-1.5 bg-purple-500/10 border border-purple-500/20 rounded-full text-sm text-purple-300 mb-6">
                                Freelancer Portal
                            </div>
                            <h1 className="text-4xl lg:text-6xl font-bold mb-6 leading-tight text-white">
                                Join Our Network of{' '}
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">
                                    Expert Linguists
                                </span>
                            </h1>
                            <p className="text-lg text-gray-400 mb-4 leading-relaxed">
                                Central & Eastern Europe · Middle East · Central Asia
                            </p>
                            <p className="text-gray-500 mb-8 leading-relaxed">
                                Work with a leading language service provider. Be part of our growing network of 700+ vetted professionals specializing in strategic regional markets.
                            </p>

                            <div className="flex flex-col sm:flex-row gap-4 mb-8">
                                <Button
                                    size="lg"
                                    className="bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-white border-0 px-8 shadow-lg shadow-purple-500/25"
                                    onClick={() => window.location.href = createPageUrl('Apply')}
                                >
                                    Apply Now
                                    <ArrowRight className="w-5 h-5 ml-2" />
                                </Button>
                                <Button
                                    size="lg"
                                    variant="outline"
                                    className="border-white/20 text-gray-300 hover:bg-white/5 hover:text-white bg-transparent px-8"
                                    onClick={() => base44.auth.redirectToLogin(createPageUrl('MyApplication'))}
                                >
                                    Check Application Status
                                </Button>
                            </div>

                            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-gray-500">
                                <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-purple-400" /> ISO 17100 Compliant</span>
                                <span className="flex items-center gap-1.5"><Zap className="w-4 h-4 text-cyan-400" /> AI-Enhanced Workflows</span>
                                <span className="flex items-center gap-1.5"><Users className="w-4 h-4 text-purple-400" /> 700+ Vetted Experts</span>
                            </div>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 gap-4">
                            {[
                                { value: '700+', label: 'Vetted Linguists' },
                                { value: '20+', label: 'Language Pairs' },
                                { value: '10+', label: 'Years Avg. Experience' },
                                { value: '100K', label: 'Tasks Completed/Year' },
                            ].map((stat, i) => (
                                <Card key={i} className="bg-white/5 border-white/10 backdrop-blur-sm">
                                    <CardContent className="pt-6 pb-5">
                                        <div className="text-3xl lg:text-4xl font-bold text-purple-400 mb-1">{stat.value}</div>
                                        <div className="text-sm text-gray-500">{stat.label}</div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Benefits Section */}
            <div className="py-20 bg-[#111a2e]">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
                            Why Work With Us?
                        </h2>
                        <p className="text-lg text-gray-500 max-w-2xl mx-auto">
                            Join a team that values quality, expertise, and cultural understanding
                        </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[
                            { icon: Users, title: 'Expert Network', desc: 'Work alongside 700+ vetted professionals with 10+ years average experience' },
                            { icon: Briefcase, title: 'Diverse Projects', desc: 'Gaming, e-commerce, fintech, and life sciences across regional markets' },
                            { icon: Shield, title: 'Reliable Payment', desc: 'Timely and reliable payment processing for all completed projects' },
                        ].map((item, i) => (
                            <Card key={i} className="bg-white/5 border-white/10 hover:border-purple-500/30 transition-all group">
                                <CardContent className="pt-6">
                                    <item.icon className="w-10 h-10 text-purple-400 mb-4 group-hover:text-purple-300 transition-colors" />
                                    <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
                                    <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </div>

            {/* Ninja Program Section */}
            <div className="py-20 bg-[#0f1629]">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="bg-gradient-to-br from-purple-900/40 to-cyan-900/20 border border-purple-500/20 rounded-2xl p-8 lg:p-12 flex flex-col lg:flex-row items-center gap-10">
                        <div className="flex-1">
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-purple-500/10 border border-purple-500/20 rounded-full text-sm text-purple-300 mb-4">
                                <span className="text-base">🥷</span>
                                Coming Soon
                            </div>
                            <h2 className="text-2xl lg:text-3xl font-bold text-white mb-4">
                                Localization Ninja Program
                            </h2>
                            <p className="text-gray-400 leading-relaxed mb-6">
                                An intensive training program for aspiring linguists. Get hands-on experience, learn industry tools, and launch your career in localization.
                            </p>
                            <Button
                                size="lg"
                                className="bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-white px-8 shadow-lg shadow-purple-500/25"
                                onClick={() => window.location.href = createPageUrl('NinjaInterest')}
                            >
                                Register Your Interest
                                <ArrowRight className="w-5 h-5 ml-2" />
                            </Button>
                        </div>
                        <div className="grid grid-cols-2 gap-4 w-full lg:w-auto">
                            {[
                                { val: 'Free', sub: 'Training' },
                                { val: 'Online', sub: 'Format' },
                                { val: 'Expert', sub: 'Mentors' },
                                { val: 'Job', sub: 'Placement' },
                            ].map((item, i) => (
                                <Card key={i} className="bg-white/5 border-white/10">
                                    <CardContent className="pt-5 pb-4 text-center">
                                        <div className="text-xl font-bold text-purple-400">{item.val}</div>
                                        <div className="text-xs text-gray-500">{item.sub}</div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* CTA Section */}
            <div className="bg-gradient-to-r from-purple-900/60 to-[#0f1629] py-20 border-t border-white/5">
                <div className="max-w-4xl mx-auto px-6 text-center">
                    <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
                        Ready to Join Our Team?
                    </h2>
                    <p className="text-lg text-gray-400 mb-8">
                        Apply now and become part of a network that values expertise and cultural understanding
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Button
                            size="lg"
                            className="bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-white px-8 shadow-lg shadow-purple-500/25"
                            onClick={() => window.location.href = createPageUrl('Apply')}
                        >
                            Start Your Application
                            <ArrowRight className="w-5 h-5 ml-2" />
                        </Button>
                        <button
                            onClick={() => window.location.href = createPageUrl('NinjaInterest')}
                            className="group inline-flex items-center justify-center gap-2 px-6 py-3 rounded-md border border-white/20 text-gray-300 hover:bg-white/5 hover:text-white transition-all text-sm font-medium"
                        >
                            <span>🥷</span> Ninja Program
                            <ArrowRight className="w-4 h-4 opacity-50 group-hover:translate-x-0.5 transition-transform" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="bg-[#0a0f1e] border-t border-white/5 py-8">
                <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <img src={LOGO_LIGHT} alt="elturco" className="h-7 opacity-60" />
                    <p className="text-gray-600 text-sm">© {new Date().getFullYear()} elturco. All rights reserved.</p>
                </div>
            </div>
        </div>
    );
}