import React, { useState } from 'react';
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import AvailabilityCalendar from "../components/availability/AvailabilityCalendar";
import { createPageUrl } from "../utils";
import { Users, Search, Calendar, Clock } from "lucide-react";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, addWeeks, subWeeks } from "date-fns";

export default function TeamAvailabilityPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedFreelancer, setSelectedFreelancer] = useState(null);
    const [currentWeek, setCurrentWeek] = useState(new Date());

    const { data: user, isLoading: userLoading } = useQuery({
        queryKey: ['currentUser'],
        queryFn: async () => {
            const isAuth = await base44.auth.isAuthenticated();
            if (!isAuth) {
                base44.auth.redirectToLogin(createPageUrl('TeamAvailability'));
                return null;
            }
            return base44.auth.me();
        }
    });

    const isAdmin = user?.role === 'admin';
    const isProjectManager = user?.role === 'project_manager';

    const { data: freelancers = [], isLoading: freelancersLoading } = useQuery({
        queryKey: ['freelancers'],
        queryFn: () => base44.entities.Freelancer.list('-created_date'),
        enabled: !userLoading && (isAdmin || isProjectManager),
        staleTime: 30000,
    });

    const { data: allAvailabilities = [] } = useQuery({
        queryKey: ['allAvailabilities', format(currentWeek, 'yyyy-MM-dd')],
        queryFn: async () => {
            const weekStart = format(startOfWeek(currentWeek), 'yyyy-MM-dd');
            const weekEnd = format(endOfWeek(currentWeek), 'yyyy-MM-dd');
            const all = await base44.entities.Availability.list();
            return all.filter(a => a.date >= weekStart && a.date <= weekEnd);
        },
        enabled: !userLoading && (isAdmin || isProjectManager),
    });

    if (userLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    if (!isAdmin && !isProjectManager) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
                <div className="max-w-4xl mx-auto text-center mt-20">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
                    <p className="text-gray-600">Only administrators and project managers can view team availability.</p>
                </div>
            </div>
        );
    }

    const filteredFreelancers = freelancers.filter(f => {
        const search = searchTerm.toLowerCase();
        return (
            f.full_name?.toLowerCase().includes(search) ||
            f.email?.toLowerCase().includes(search) ||
            f.language_pairs?.some(lp => 
                lp.source_language?.toLowerCase().includes(search) ||
                lp.target_language?.toLowerCase().includes(search)
            )
        );
    });

    const weekDays = eachDayOfInterval({
        start: startOfWeek(currentWeek),
        end: endOfWeek(currentWeek)
    });

    const getAvailabilityForFreelancerAndDate = (freelancerId, date) => {
        return allAvailabilities.find(a => 
            a.freelancer_id === freelancerId && 
            a.date === format(date, 'yyyy-MM-dd')
        );
    };

    const statusColors = {
        available: 'bg-green-100 text-green-800',
        partially_available: 'bg-yellow-100 text-yellow-800',
        unavailable: 'bg-red-100 text-red-800'
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                        <Users className="w-8 h-8 text-blue-600" />
                        Team Availability
                    </h1>
                    <p className="text-gray-600 mt-1">
                        View and manage freelancer availability
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Freelancer List */}
                    <Card className="lg:col-span-1">
                        <CardHeader>
                            <CardTitle>Freelancers</CardTitle>
                            <div className="relative mt-2">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <Input
                                    placeholder="Search freelancers..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-9"
                                />
                            </div>
                        </CardHeader>
                        <CardContent className="max-h-[600px] overflow-y-auto">
                            {freelancersLoading ? (
                                <div className="text-center py-8 text-gray-500">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                                    <p>Loading freelancers...</p>
                                </div>
                            ) : filteredFreelancers.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    <Users className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                                    <p>No freelancers found</p>
                                </div>
                            ) : (
                            <div className="space-y-2">
                                {filteredFreelancers.map(freelancer => {
                                    const weekAvailability = weekDays.map(day => 
                                        getAvailabilityForFreelancerAndDate(freelancer.id, day)
                                    ).filter(Boolean);

                                    return (
                                        <button
                                            key={freelancer.id}
                                            onClick={() => setSelectedFreelancer(freelancer)}
                                            className="w-full text-left p-3 rounded-lg border bg-white hover:bg-gray-50 transition-colors"
                                        >
                                            <div className="font-semibold text-gray-900">{freelancer.full_name}</div>
                                            <div className="text-xs text-gray-500 mt-1">{freelancer.email}</div>
                                            {weekAvailability.length > 0 && (
                                                <div className="flex gap-1 mt-2">
                                                    {weekAvailability.slice(0, 3).map((avail, idx) => (
                                                        <Badge key={idx} className={`text-xs ${statusColors[avail.status]}`}>
                                                            {avail.hours_available}h
                                                        </Badge>
                                                    ))}
                                                    {weekAvailability.length > 3 && (
                                                        <Badge variant="outline" className="text-xs">
                                                            +{weekAvailability.length - 3}
                                                        </Badge>
                                                    )}
                                                </div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Weekly Overview */}
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="flex items-center gap-2">
                                    <Calendar className="w-5 h-5" />
                                    Week Overview
                                </CardTitle>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setCurrentWeek(subWeeks(currentWeek, 1))}
                                    >
                                        Previous
                                    </Button>
                                    <div className="text-sm font-medium min-w-[200px] text-center">
                                        {format(startOfWeek(currentWeek), 'MMM d')} - {format(endOfWeek(currentWeek), 'MMM d, yyyy')}
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}
                                    >
                                        Next
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr>
                                            <th className="text-left p-2 text-sm font-semibold text-gray-700">Freelancer</th>
                                            {weekDays.map(day => (
                                                <th key={day.toString()} className="p-2 text-center text-sm font-semibold text-gray-700">
                                                    <div>{format(day, 'EEE')}</div>
                                                    <div className="text-xs text-gray-500">{format(day, 'd')}</div>
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredFreelancers.slice(0, 10).map(freelancer => (
                                            <tr key={freelancer.id} className="border-t">
                                                <td className="p-2 text-sm">
                                                    <div className="font-medium">{freelancer.full_name}</div>
                                                </td>
                                                {weekDays.map(day => {
                                                    const availability = getAvailabilityForFreelancerAndDate(freelancer.id, day);
                                                    return (
                                                        <td key={day.toString()} className="p-2 text-center">
                                                            {availability ? (
                                                                <div className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${statusColors[availability.status]}`}>
                                                                    <Clock className="w-3 h-3" />
                                                                    {availability.hours_available}h
                                                                </div>
                                                            ) : (
                                                                <span className="text-gray-300">-</span>
                                                            )}
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Freelancer Detail Dialog */}
            <Dialog open={!!selectedFreelancer} onOpenChange={() => setSelectedFreelancer(null)}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            {selectedFreelancer?.full_name} - Availability
                        </DialogTitle>
                    </DialogHeader>
                    {selectedFreelancer && (
                        <AvailabilityCalendar 
                            freelancerId={selectedFreelancer.id} 
                            readOnly={true} 
                        />
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}