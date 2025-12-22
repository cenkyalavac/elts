import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "./utils";
import { Button } from "@/components/ui/button";
import { 
    LayoutGrid, Users, Briefcase, FileText, 
    UserCircle, LogOut, Settings, Shield, Menu, X 
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

    const navItems = isApplicant ? [
        { name: 'MyApplication', label: 'My Application', icon: FileText },
    ] : [
        { name: 'Pipeline', label: 'Pipeline', icon: LayoutGrid },
        { name: 'Freelancers', label: 'Freelancers', icon: Users },
        { name: 'Jobs', label: 'Jobs', icon: Briefcase },
        { name: 'Analytics', label: 'Analytics', icon: LayoutGrid },
    ];

    const adminItems = isAdmin ? [
        { name: 'OpenPositions', label: 'Open Positions', icon: Briefcase },
        { name: 'UserManagement', label: 'User Management', icon: Shield },
    ] : [];

    // Don't show navigation on public pages
    if (isPublicPage) {
        return <>{children}</>;
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Navigation */}
            <nav className="bg-white border-b shadow-sm sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center gap-8">
                            <Link to={createPageUrl(isApplicant ? 'MyApplication' : 'Pipeline')} className="flex items-center gap-2">
                                <div className="text-xl md:text-2xl font-bold text-blue-600">LSP Portal</div>
                            </Link>
                            <div className="hidden md:flex items-center gap-1">
                                {navItems.map(item => (
                                    <Link key={item.name} to={createPageUrl(item.name)}>
                                        <Button
                                            variant={currentPageName === item.name ? 'default' : 'ghost'}
                                            className="gap-2"
                                        >
                                            <item.icon className="w-4 h-4" />
                                            {item.label}
                                        </Button>
                                    </Link>
                                ))}
                                {adminItems.map(item => (
                                    <Link key={item.name} to={createPageUrl(item.name)}>
                                        <Button
                                            variant={currentPageName === item.name ? 'default' : 'ghost'}
                                            className="gap-2"
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
                                            <div className="text-sm font-medium">{user.full_name || user.email}</div>
                                            <div className="text-xs text-gray-500">
                                                {user.role === 'admin' ? 'Administrator' : 
                                                 user.role === 'project_manager' ? 'Project Manager' : 
                                                 'Applicant'}
                                            </div>
                                        </div>
                                        <Button variant="ghost" size="icon" onClick={handleLogout}>
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
                    <div className="md:hidden border-t bg-white">
                        <div className="px-4 py-3 space-y-1">
                            {navItems.map(item => (
                                <Link key={item.name} to={createPageUrl(item.name)} onClick={() => setMobileMenuOpen(false)}>
                                    <Button
                                        variant={currentPageName === item.name ? 'default' : 'ghost'}
                                        className="w-full justify-start gap-3"
                                    >
                                        <item.icon className="w-5 h-5" />
                                        {item.label}
                                    </Button>
                                </Link>
                            ))}
                            {adminItems.map(item => (
                                <Link key={item.name} to={createPageUrl(item.name)} onClick={() => setMobileMenuOpen(false)}>
                                    <Button
                                        variant={currentPageName === item.name ? 'default' : 'ghost'}
                                        className="w-full justify-start gap-3"
                                    >
                                        <item.icon className="w-5 h-5" />
                                        {item.label}
                                    </Button>
                                </Link>
                            ))}
                            <div className="border-t pt-3 mt-3">
                                <div className="px-3 py-2">
                                    <div className="text-sm font-medium">{user.full_name || user.email}</div>
                                    <div className="text-xs text-gray-500">
                                        {user.role === 'admin' ? 'Administrator' : 
                                         user.role === 'project_manager' ? 'Project Manager' : 
                                         'Applicant'}
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    className="w-full justify-start gap-3 text-red-600"
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