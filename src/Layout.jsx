import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "./utils";
import { Button } from "@/components/ui/button";
import { 
    LayoutGrid, Users, Briefcase, FileText, 
    UserCircle, LogOut, Settings, Shield 
} from "lucide-react";

export default function Layout({ children, currentPageName }) {
    const { data: user } = useQuery({
        queryKey: ['currentUser'],
        queryFn: () => base44.auth.me(),
    });

    const isAdmin = user?.role === 'admin';
    const isProjectManager = user?.role === 'project_manager';
    const isApplicant = user?.role === 'applicant';

    const handleLogout = () => {
        base44.auth.logout();
    };

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

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Navigation */}
            <nav className="bg-white border-b shadow-sm sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center gap-8">
                            <Link to={createPageUrl(isApplicant ? 'MyApplication' : 'Pipeline')} className="flex items-center gap-2">
                                <div className="text-2xl font-bold text-blue-600">LSP Portal</div>
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

                        <div className="flex items-center gap-4">
                            {user && (
                                <div className="flex items-center gap-3">
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
                            )}
                        </div>
                    </div>
                </div>
            </nav>

            {/* Page Content */}
            <main>{children}</main>
        </div>
    );
}