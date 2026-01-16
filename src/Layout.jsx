import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "./utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
            const conversations = await base44.entities.Conversation.list();
            const userConvs = conversations.filter(c => 
                c.participant_emails?.includes(user.email) &&
                c.unread_by?.includes(user.email)
            );
            return userConvs.length;
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

    // Applicant navigation
    const applicantNavItems = [
        { name: 'GettingStarted', label: 'Getting Started', icon: Briefcase },
        { name: 'MyApplication', label: 'My Application', icon: FileText },
        { name: 'Messages', label: 'Messages', icon: MessageSquare, badge: unreadCount },
        { name: 'Announcements', label: 'Announcements', icon: Megaphone },
        { name: 'Support', label: 'Support', icon: HelpCircle },
    ];

    // Admin/PM navigation - main items
            const mainNavItems = [
                { name: 'OpenPositions', label: 'Positions', icon: Briefcase },
                { name: 'Freelancers', label: 'Freelancers', icon: Users },
                { name: 'NinjaPrograms', label: 'Ninja', icon: GraduationCap },
                { name: 'QualityManagement', label: 'Quality', icon: Star },
                { name: 'DocumentCompliance', label: 'Documents', icon: FileText },
                { name: 'Messages', label: 'Messages', icon: MessageSquare, badge: unreadCount },
                { name: 'Announcements', label: 'Announcements', icon: Megaphone },
                { name: 'Support', label: 'Support', icon: HelpCircle },
            ];

    // Payment dropdown items
    const paymentItems = [
        { name: 'SmartcatIntegration', label: 'Payment Dashboard', icon: DollarSign },
        { name: 'SmartcatIntegration', label: 'TBMS Import', icon: Upload, tab: 'tbms' },
    ];

    // Settings dropdown items (admin only)
    const settingsItems = isAdmin ? [
        { name: 'Inbox', label: 'Gmail Inbox', icon: Mail },
        { name: 'UserManagement', label: 'User Management', icon: Shield },
        { name: 'Settings', label: 'Settings', icon: Settings },
    ] : [];

    if (isPublicPage) {
        return <>{children}</>;
    }

    const navItems = isApplicant ? applicantNavItems : mainNavItems;

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
                                {navItems.map(item => {
                                    // Regular nav item
                                    return (
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
                                    );
                                })}

                                {/* Payments - Only for admin/PM */}
                                {!isApplicant && (
                                    <Link to={createPageUrl('SmartcatIntegration')}>
                                        <Button
                                            variant="ghost"
                                            className={`gap-2 text-white hover:bg-white/10 ${
                                                currentPageName === 'SmartcatIntegration' ? 'bg-white/20' : ''
                                            }`}
                                        >
                                            <DollarSign className="w-4 h-4" />
                                            Payments
                                        </Button>
                                    </Link>
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



                            {/* Mobile Payments section */}
                            {!isApplicant && (
                                <>
                                    <div className="border-t border-white/10 pt-3 mt-3">
                                        <p className="text-xs text-purple-300 px-3 mb-2">Payments</p>
                                        <Link to={createPageUrl('SmartcatIntegration')} onClick={() => setMobileMenuOpen(false)}>
                                            <Button variant="ghost" className="w-full justify-start gap-3 text-white hover:bg-white/10">
                                                <CreditCard className="w-5 h-5" />
                                                Invoices
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

            <main>{children}</main>
        </div>
    );
}