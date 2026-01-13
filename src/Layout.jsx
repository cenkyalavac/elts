import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "./utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
    LayoutGrid, Users, Briefcase, FileText, 
    UserCircle, LogOut, Settings, Shield, Menu, X, Upload, MessageSquare 
} from "lucide-react";

export default function Layout({ children, currentPageName }) {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

    const isAdmin = user?.role === 'admin';
    const isProjectManager = user?.role === 'project_manager';
    const isApplicant = user?.role === 'applicant';

    const handleLogout = () => {
        base44.auth.logout(createPageUrl('Home'));
    };

    // Public pages that don't need authentication
    const publicPages = ['Home', 'Apply'];
    const isPublicPage = publicPages.includes(currentPageName);

    // If not a public page and no user, don't show layout
    if (!isPublicPage && !user) {
        return <>{children}</>;
    }

    // Fetch unread message count
    const { data: unreadCount = 0 } = useQuery({
        queryKey: ['unreadMessages', user?.email],
        queryFn: async () => {
            if (!user) return 0;
            const conversations = await base44.entities.Conversation.list();
            const userConvs = conversations.filter(c => 
                c.participant_emails?.includes(user.email) &&
                c.unread_by?.includes(user.email)
            );
            return userConvs.length;
        },
        enabled: !!user,
        refetchInterval: 30000, // Refetch every 30 seconds
    });

    const navItems = isApplicant ? [
        { name: 'MyApplication', label: 'My Application', icon: FileText },
        { name: 'Messages', label: 'Messages', icon: MessageSquare, badge: unreadCount },
    ] : [
        { name: 'Pipeline', label: 'Pipeline', icon: LayoutGrid },
        { name: 'Freelancers', label: 'Freelancers', icon: Users },
        { name: 'Jobs', label: 'Jobs', icon: Briefcase },
        { name: 'Analytics', label: 'Analytics', icon: LayoutGrid },
        { name: 'Messages', label: 'Messages', icon: MessageSquare, badge: unreadCount },
    ];

    const adminItems = isAdmin ? [
        { name: 'OpenPositions', label: 'Open Positions', icon: Briefcase },
        { name: 'UserManagement', label: 'User Management', icon: Shield },
        { name: 'ImportFreelancers', label: 'Import Freelancers', icon: Upload },
    ] : [];

    // Don't show navigation on public pages
    if (isPublicPage) {
        return <>{children}</>;
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Navigation */}
            <nav className="bg-gradient-to-r from-purple-900 via-purple-800 to-pink-700 text-white shadow-lg sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center gap-8">
                            <Link to={createPageUrl(isApplicant ? 'MyApplication' : 'Pipeline')} className="flex items-center gap-2">
                                <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center font-bold text-sm">
                                    et
                                </div>
                                <span className="text-xl font-bold hidden sm:inline">el turco</span>
                            </Link>
                            <div className="hidden md:flex items-center gap-1">
                                {navItems.map(item => (
                                    <Link key={item.name} to={createPageUrl(item.name)}>
                                        <Button
                                            variant="ghost"
                                            className={`gap-2 text-white hover:bg-white/10 ${
                                                currentPageName === item.name ? 'bg-white/20' : ''
                                            }`}
                                        >
                                            <item.icon className="w-4 h-4" />
                                            {item.label}
                                            {item.badge > 0 && (
                                                <Badge className="bg-red-500 ml-1">{item.badge}</Badge>
                                            )}
                                        </Button>
                                    </Link>
                                ))}
                                {adminItems.map(item => (
                                    <Link key={item.name} to={createPageUrl(item.name)}>
                                        <Button
                                            variant="ghost"
                                            className={`gap-2 text-white hover:bg-white/10 ${
                                                currentPageName === item.name ? 'bg-white/20' : ''
                                            }`}
                                        >
                                            <item.icon className="w-4 h-4" />
                                            {item.label}
                                        </Button>
                                    </Link>
                                ))}
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            {user && (
                                <>
                                    <div className="hidden md:flex items-center gap-3">
                                        <div className="text-right">
                                            <div className="text-sm font-medium text-white">{user.full_name || user.email}</div>
                                            <div className="text-xs text-purple-200">
                                                {user.role === 'admin' ? 'Administrator' : 
                                                 user.role === 'project_manager' ? 'Project Manager' : 
                                                 'Applicant'}
                                            </div>
                                        </div>
                                        <Button variant="ghost" size="icon" className="text-white hover:bg-white/10" onClick={handleLogout}>
                                            <LogOut className="w-4 h-4" />
                                        </Button>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="md:hidden"
                                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                    >
                                        {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Mobile Menu */}
                {mobileMenuOpen && (
                    <div className="md:hidden border-t border-white/10 bg-purple-900">
                        <div className="px-4 py-3 space-y-1">
                            {navItems.map(item => (
                                <Link key={item.name} to={createPageUrl(item.name)} onClick={() => setMobileMenuOpen(false)}>
                                    <Button
                                        variant="ghost"
                                        className={`w-full justify-start gap-3 text-white hover:bg-white/10 ${
                                            currentPageName === item.name ? 'bg-white/20' : ''
                                        }`}
                                    >
                                        <item.icon className="w-5 h-5" />
                                        {item.label}
                                        {item.badge > 0 && (
                                            <Badge className="bg-red-500 ml-auto">{item.badge}</Badge>
                                        )}
                                    </Button>
                                </Link>
                            ))}
                            {adminItems.map(item => (
                                <Link key={item.name} to={createPageUrl(item.name)} onClick={() => setMobileMenuOpen(false)}>
                                    <Button
                                        variant="ghost"
                                        className={`w-full justify-start gap-3 text-white hover:bg-white/10 ${
                                            currentPageName === item.name ? 'bg-white/20' : ''
                                        }`}
                                    >
                                        <item.icon className="w-5 h-5" />
                                        {item.label}
                                    </Button>
                                </Link>
                            ))}
                            <div className="border-t border-white/10 pt-3 mt-3">
                                <div className="px-3 py-2">
                                    <div className="text-sm font-medium text-white">{user.full_name || user.email}</div>
                                    <div className="text-xs text-purple-200">
                                        {user.role === 'admin' ? 'Administrator' : 
                                         user.role === 'project_manager' ? 'Project Manager' : 
                                         'Applicant'}
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    className="w-full justify-start gap-3 text-white hover:bg-red-500/20"
                                    onClick={() => {
                                        setMobileMenuOpen(false);
                                        handleLogout();
                                    }}
                                >
                                    <LogOut className="w-5 h-5" />
                                    Logout
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </nav>

            {/* Page Content */}
            <main>{children}</main>
        </div>
    );
}