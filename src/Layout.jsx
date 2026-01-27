import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "./utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import GlobalSearch from "@/components/ui/GlobalSearch";
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import CommandPalette from "@/components/ui/CommandPalette";
import {
          DropdownMenu,
          DropdownMenuContent,
          DropdownMenuItem,
          DropdownMenuSeparator,
          DropdownMenuTrigger,
      } from "@/components/ui/dropdown-menu";
      import { 
                  Users, FileText, LogOut, Settings, Menu, X, 
                  MessageSquare, Star, ChevronDown, Mail, Shield, Award, 
                  User, DollarSign, CreditCard, Upload, Briefcase, BarChart3,
                  Megaphone, HelpCircle, GraduationCap
              } from "lucide-react";

export default function Layout({ children, currentPageName }) {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

    // Global keyboard shortcut for command palette
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setCommandPaletteOpen(prev => !prev);
            }
            if (e.key === 'Escape') {
                setCommandPaletteOpen(false);
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, []);

    const { data: user } = useQuery({
        queryKey: ['currentUser'],
        queryFn: async () => {
            try {
                const currentUser = await base44.auth.me();
                
                if (currentUser) {
                    try {
                        const roleResult = await base44.functions.invoke('applyPendingRole', {});
                        if (roleResult.data?.applied) {
                            return await base44.auth.me();
                        }
                    } catch (e) {
                        console.log('Role check skipped:', e.message);
                    }
                }
                
                return currentUser;
            } catch {
                return null;
            }
        },
    });

    const { data: unreadCount = 0 } = useQuery({
        queryKey: ['unreadMessages', user?.email],
        queryFn: async () => {
            if (!user) return 0;
            const response = await base44.functions.invoke('getUnreadConversationCount');
            return response.data?.count || 0;
        },
        enabled: !!user,
        staleTime: 120000,
        refetchInterval: false,
        refetchOnMount: false,
        refetchOnWindowFocus: false,
    });

    const isAdmin = user?.role === 'admin';
    const isProjectManager = user?.role === 'project_manager';
    const isApplicant = user?.role === 'applicant';

    const handleLogout = () => {
        base44.auth.logout(createPageUrl('Home'));
    };

    const publicPages = ['Home', 'Apply'];
    const isPublicPage = publicPages.includes(currentPageName);

    if (!isPublicPage && !user) {
        return <>{children}</>;
    }

    // All navigation items with role-based access
    const allNavItems = [
        // Applicant-only items
        { name: 'GettingStarted', label: 'Getting Started', icon: Briefcase, roles: ['applicant'] },
        { name: 'MyApplication', label: 'My Application', icon: FileText, roles: ['applicant'] },

        // Admin/PM items
        { name: 'OpenPositions', label: 'Positions', icon: Briefcase, roles: ['admin', 'project_manager'] },
        { name: 'Freelancers', label: 'Freelancers', icon: Users, roles: ['admin', 'project_manager'] },
        { name: 'QualityManagement', label: 'Quality', icon: Star, roles: ['admin', 'project_manager'] },
        { name: 'SmartcatIntegration', label: 'Payments', icon: DollarSign, roles: ['admin'] },
        { name: 'DocumentCompliance', label: 'Documents', icon: FileText, roles: ['admin', 'project_manager'] },

        // Shared items
        { name: 'Messages', label: 'Messages', icon: MessageSquare, badge: unreadCount, roles: ['admin', 'project_manager', 'applicant'] },
        { name: 'Announcements', label: 'Announcements', icon: Megaphone, roles: ['admin', 'project_manager', 'applicant'] },
        { name: 'Support', label: 'Support', icon: HelpCircle, roles: ['admin', 'project_manager', 'applicant'] },
    ];

    // Filter nav items based on user role
    const navItems = allNavItems.filter(item => item.roles.includes(user?.role));

    // Ninja menu item (admin/PM only)
    const ninjaNavItem = { name: 'NinjaPrograms', label: 'Ninja', icon: GraduationCap, roles: ['admin', 'project_manager'] };
    const showNinja = ninjaNavItem.roles.includes(user?.role);

    // Settings dropdown items (admin only)
    const settingsItems = [
        { name: 'Inbox', label: 'Gmail Inbox', icon: Mail, roles: ['admin'] },
        { name: 'UserManagement', label: 'User Management', icon: Shield, roles: ['admin'] },
        { name: 'Settings', label: 'Settings', icon: Settings, roles: ['admin'] },
    ].filter(item => item.roles.includes(user?.role));

    if (isPublicPage) {
        return <>{children}</>;
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <nav className="bg-gradient-to-r from-purple-900 via-purple-800 to-pink-700 text-white shadow-lg sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center gap-8">
                            {/* Logo - links to Dashboard */}
                            <Link to={createPageUrl(isApplicant ? 'MyApplication' : 'Dashboard')} className="flex items-center gap-2">
                                <div className="w-10 h-10 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center font-bold text-lg border border-white/30">
                                    et
                                </div>
                                <span className="text-xl font-bold hidden sm:inline tracking-wide">el turco</span>
                            </Link>
                            
                            {/* Main navigation */}
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

                                {/* Ninja - Separated with divider */}
                                {showNinja && (
                                    <>
                                        <div className="w-px h-6 bg-white/20 mx-2" />
                                        <Link to={createPageUrl(ninjaNavItem.name)}>
                                            <Button
                                                variant="ghost"
                                                className={`gap-2 text-white hover:bg-white/10 ${
                                                    currentPageName === ninjaNavItem.name || currentPageName === 'NinjaApplicants' ? 'bg-white/20' : ''
                                                }`}
                                            >
                                                <span className="text-base">🥷</span>
                                                {ninjaNavItem.label}
                                            </Button>
                                        </Link>
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            {user && (
                                <>
                                    <div className="hidden md:flex items-center gap-3">
                                        {/* User dropdown with settings */}
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="gap-2 text-white hover:bg-white/10">
                                                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                                                        <User className="w-4 h-4" />
                                                    </div>
                                                    <div className="text-left hidden lg:block">
                                                        <div className="text-sm font-medium">{user.full_name || user.email?.split('@')[0]}</div>
                                                        <div className="text-xs text-purple-200">
                                                            {user.role === 'admin' ? 'Admin' : 
                                                             user.role === 'project_manager' ? 'Project Manager' : 
                                                             'Applicant'}
                                                        </div>
                                                    </div>
                                                    <ChevronDown className="w-4 h-4 text-purple-200" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-56">
                                                <div className="px-2 py-2 border-b">
                                                    <p className="text-sm font-medium">{user.full_name || user.email}</p>
                                                    <p className="text-xs text-gray-500">{user.email}</p>
                                                </div>
                                                
                                                {settingsItems.length > 0 && (
                                                    <>
                                                        <DropdownMenuSeparator />
                                                        {settingsItems.map(item => (
                                                            <DropdownMenuItem key={item.name} asChild>
                                                                <Link to={createPageUrl(item.name)} className="flex items-center gap-2 cursor-pointer">
                                                                    <item.icon className="w-4 h-4" />
                                                                    {item.label}
                                                                </Link>
                                                            </DropdownMenuItem>
                                                        ))}
                                                    </>
                                                )}
                                                
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem onClick={handleLogout} className="text-red-600 cursor-pointer">
                                                    <LogOut className="w-4 h-4 mr-2" />
                                                    Logout
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                    
                                    {/* Mobile menu button */}
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="md:hidden text-white"
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



                            {/* Mobile Ninja section */}
                            {showNinja && (
                                <>
                                    <div className="border-t border-white/10 pt-3 mt-3">
                                        <p className="text-xs text-purple-300 px-3 mb-2">Training</p>
                                        <Link to={createPageUrl('NinjaPrograms')} onClick={() => setMobileMenuOpen(false)}>
                                            <Button variant="ghost" className="w-full justify-start gap-3 text-white hover:bg-white/10">
                                                <span className="text-lg">🥷</span>
                                                Localization Ninja
                                            </Button>
                                        </Link>
                                    </div>
                                </>
                            )}
                            
                            {/* Settings items in mobile */}
                            {settingsItems.length > 0 && (
                                <>
                                    <div className="border-t border-white/10 pt-3 mt-3">
                                        <p className="text-xs text-purple-300 px-3 mb-2">Admin</p>
                                        {settingsItems.map(item => (
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
                                    </div>
                                </>
                            )}
                            
                            <div className="border-t border-white/10 pt-3 mt-3">
                                <div className="px-3 py-2">
                                    <div className="text-sm font-medium text-white">{user.full_name || user.email}</div>
                                    <div className="text-xs text-purple-200">
                                        {user.role === 'admin' ? 'Admin' : 
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

            <main>
                <ErrorBoundary fallbackMessage="Something went wrong loading this page. Please try refreshing.">
                    {children}
                </ErrorBoundary>
            </main>
            {user && <GlobalSearch />}
            {user && <CommandPalette open={commandPaletteOpen} onOpenChange={setCommandPaletteOpen} />}
        </div>
    );
}