import React, { useState, useMemo } from 'react';
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import AvailabilityCalendar from "../availability/AvailabilityCalendar";
import { 
    Users, Calendar, Clock, Search, Filter, X, ChevronLeft, ChevronRight,
    Globe, CheckCircle, AlertCircle, XCircle, BarChart3, TrendingUp
} from "lucide-react";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, addWeeks, subWeeks, addMonths, subMonths, startOfMonth, endOfMonth, isToday, isSameDay } from "date-fns";

const PIPELINE_STAGES = [
    { id: 'New Application', label: 'New Application', color: 'bg-blue-100 text-blue-800' },
    { id: 'Form Sent', label: 'Form Sent', color: 'bg-purple-100 text-purple-800' },
    { id: 'Price Negotiation', label: 'Price Negotiation', color: 'bg-yellow-100 text-yellow-800' },
    { id: 'Test Sent', label: 'Test Sent', color: 'bg-indigo-100 text-indigo-800' },
    { id: 'Approved', label: 'Approved', color: 'bg-green-100 text-green-800' },
    { id: 'On Hold', label: 'On Hold', color: 'bg-gray-100 text-gray-800' },
    { id: 'Rejected', label: 'Rejected', color: 'bg-red-100 text-red-800' },
    { id: 'Red Flag', label: 'Red Flag', color: 'bg-orange-100 text-orange-800' }
];

export default function TeamAvailabilityView() {
    const [selectedFreelancer, setSelectedFreelancer] = useState(null);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [viewMode, setViewMode] = useState('week'); // 'week' or 'month'
    const [showFilters, setShowFilters] = useState(true);
    
    const [filters, setFilters] = useState({
        search: '',
        selectedStatuses: ['Approved'],
        availabilityStatus: 'all',
        minHours: '',
        maxHours: '',
        selectedLanguagePairs: [],
        selectedServices: [],
        onlyWithAvailability: false
    });

    const { data: freelancers = [], isLoading: loadingFreelancers } = useQuery({
        queryKey: ['freelancers'],
        queryFn: () => base44.entities.Freelancer.list('-created_date')
    });

    // Get date range based on view mode
    const dateRange = useMemo(() => {
        if (viewMode === 'week') {
            return {
                start: startOfWeek(currentDate),
                end: endOfWeek(currentDate)
            };
        } else {
            return {
                start: startOfMonth(currentDate),
                end: endOfMonth(currentDate)
            };
        }
    }, [currentDate, viewMode]);

    const days = useMemo(() => 
        eachDayOfInterval({ start: dateRange.start, end: dateRange.end }),
        [dateRange]
    );

    const { data: allAvailabilities = [], isLoading: loadingAvailabilities } = useQuery({
        queryKey: ['allAvailabilities', format(dateRange.start, 'yyyy-MM-dd'), format(dateRange.end, 'yyyy-MM-dd')],
        queryFn: async () => {
            const start = format(dateRange.start, 'yyyy-MM-dd');
            const end = format(dateRange.end, 'yyyy-MM-dd');
            const all = await base44.entities.Availability.list();
            return all.filter(a => a.date >= start && a.date <= end);
        }
    });

    // Extract unique values for filters
    const allLanguagePairs = useMemo(() => {
        const pairs = new Set();
        freelancers.forEach(f => {
            f.language_pairs?.forEach(pair => {
                pairs.add(`${pair.source_language} → ${pair.target_language}`);
            });
        });
        return Array.from(pairs).sort();
    }, [freelancers]);

    const allServices = useMemo(() => {
        const services = new Set();
        freelancers.forEach(f => {
            f.service_types?.forEach(s => services.add(s));
        });
        return Array.from(services).sort();
    }, [freelancers]);

    // Filter freelancers
    const filteredFreelancers = useMemo(() => {
        return freelancers.filter(f => {
            // Search filter
            if (filters.search) {
                const search = filters.search.toLowerCase();
                const matchesSearch = 
                    f.full_name?.toLowerCase().includes(search) ||
                    f.email?.toLowerCase().includes(search) ||
                    f.language_pairs?.some(lp => 
                        lp.source_language?.toLowerCase().includes(search) ||
                        lp.target_language?.toLowerCase().includes(search)
                    );
                if (!matchesSearch) return false;
            }

            // Status filter
            if (filters.selectedStatuses.length > 0 && !filters.selectedStatuses.includes(f.status)) {
                return false;
            }

            // Language pair filter
            if (filters.selectedLanguagePairs.length > 0) {
                const hasPair = f.language_pairs?.some(pair =>
                    filters.selectedLanguagePairs.includes(`${pair.source_language} → ${pair.target_language}`)
                );
                if (!hasPair) return false;
            }

            // Service filter
            if (filters.selectedServices.length > 0) {
                const hasService = f.service_types?.some(s => filters.selectedServices.includes(s));
                if (!hasService) return false;
            }

            // Only with availability filter
            if (filters.onlyWithAvailability) {
                const hasAvailability = allAvailabilities.some(a => a.freelancer_id === f.id);
                if (!hasAvailability) return false;
            }

            // Availability status filter
            if (filters.availabilityStatus !== 'all') {
                const freelancerAvailabilities = allAvailabilities.filter(a => a.freelancer_id === f.id);
                if (filters.availabilityStatus === 'available') {
                    const hasAvailable = freelancerAvailabilities.some(a => a.status === 'available');
                    if (!hasAvailable) return false;
                } else if (filters.availabilityStatus === 'unavailable') {
                    const hasUnavailable = freelancerAvailabilities.some(a => a.status === 'unavailable');
                    if (!hasUnavailable) return false;
                } else if (filters.availabilityStatus === 'partially_available') {
                    const hasPartial = freelancerAvailabilities.some(a => a.status === 'partially_available');
                    if (!hasPartial) return false;
                }
            }

            // Hours filter
            if (filters.minHours || filters.maxHours) {
                const freelancerAvailabilities = allAvailabilities.filter(a => a.freelancer_id === f.id);
                const totalHours = freelancerAvailabilities.reduce((sum, a) => sum + (a.hours_available || 0), 0);
                if (filters.minHours && totalHours < parseFloat(filters.minHours)) return false;
                if (filters.maxHours && totalHours > parseFloat(filters.maxHours)) return false;
            }

            return true;
        });
    }, [freelancers, filters, allAvailabilities]);

    // Calculate stats
    const stats = useMemo(() => {
        const totalFreelancers = filteredFreelancers.length;
        const withAvailability = new Set(allAvailabilities.map(a => a.freelancer_id)).size;
        const totalHours = allAvailabilities
            .filter(a => filteredFreelancers.some(f => f.id === a.freelancer_id))
            .reduce((sum, a) => sum + (a.hours_available || 0), 0);
        
        const availableCount = allAvailabilities.filter(a => 
            a.status === 'available' && filteredFreelancers.some(f => f.id === a.freelancer_id)
        ).length;
        
        const unavailableCount = allAvailabilities.filter(a => 
            a.status === 'unavailable' && filteredFreelancers.some(f => f.id === a.freelancer_id)
        ).length;

        return { totalFreelancers, withAvailability, totalHours, availableCount, unavailableCount };
    }, [filteredFreelancers, allAvailabilities]);

    const getAvailabilityForFreelancerAndDate = (freelancerId, date) => {
        return allAvailabilities.find(a => 
            a.freelancer_id === freelancerId && 
            a.date === format(date, 'yyyy-MM-dd')
        );
    };

    const getFreelancerTotalHours = (freelancerId) => {
        return allAvailabilities
            .filter(a => a.freelancer_id === freelancerId)
            .reduce((sum, a) => sum + (a.hours_available || 0), 0);
    };

    const statusColors = {
        available: 'bg-green-500',
        partially_available: 'bg-yellow-500',
        unavailable: 'bg-red-500'
    };

    const statusBgColors = {
        available: 'bg-green-100 text-green-800',
        partially_available: 'bg-yellow-100 text-yellow-800',
        unavailable: 'bg-red-100 text-red-800'
    };

    const clearFilters = () => {
        setFilters({
            search: '',
            selectedStatuses: ['Approved'],
            availabilityStatus: 'all',
            minHours: '',
            maxHours: '',
            selectedLanguagePairs: [],
            selectedServices: [],
            onlyWithAvailability: false
        });
    };

    const activeFilterCount = [
        filters.search,
        filters.selectedStatuses.length > 0 && filters.selectedStatuses.length !== 1,
        filters.availabilityStatus !== 'all',
        filters.minHours,
        filters.maxHours,
        filters.selectedLanguagePairs.length > 0,
        filters.selectedServices.length > 0,
        filters.onlyWithAvailability
    ].filter(Boolean).length;

    const navigatePrevious = () => {
        if (viewMode === 'week') {
            setCurrentDate(subWeeks(currentDate, 1));
        } else {
            setCurrentDate(subMonths(currentDate, 1));
        }
    };

    const navigateNext = () => {
        if (viewMode === 'week') {
            setCurrentDate(addWeeks(currentDate, 1));
        } else {
            setCurrentDate(addMonths(currentDate, 1));
        }
    };

    const toggleArrayFilter = (filterKey, value) => {
        const current = filters[filterKey] || [];
        const updated = current.includes(value)
            ? current.filter(v => v !== value)
            : [...current, value];
        setFilters({ ...filters, [filterKey]: updated });
    };

    const isLoading = loadingFreelancers || loadingAvailabilities;

    return (
        <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <Card className="border-0 shadow-sm">
                    <CardContent className="pt-4 pb-3">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-100 rounded-lg">
                                <Users className="w-5 h-5 text-purple-600" />
                            </div>
                            <div>
                                <div className="text-2xl font-bold">{stats.totalFreelancers}</div>
                                <div className="text-xs text-gray-500">Freelancers</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-0 shadow-sm">
                    <CardContent className="pt-4 pb-3">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <Calendar className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <div className="text-2xl font-bold">{stats.withAvailability}</div>
                                <div className="text-xs text-gray-500">With Schedule</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-0 shadow-sm">
                    <CardContent className="pt-4 pb-3">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-100 rounded-lg">
                                <Clock className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                                <div className="text-2xl font-bold">{stats.totalHours}h</div>
                                <div className="text-xs text-gray-500">Total Hours</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-0 shadow-sm">
                    <CardContent className="pt-4 pb-3">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-100 rounded-lg">
                                <CheckCircle className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                                <div className="text-2xl font-bold">{stats.availableCount}</div>
                                <div className="text-xs text-gray-500">Available Days</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-0 shadow-sm">
                    <CardContent className="pt-4 pb-3">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-red-100 rounded-lg">
                                <XCircle className="w-5 h-5 text-red-600" />
                            </div>
                            <div>
                                <div className="text-2xl font-bold">{stats.unavailableCount}</div>
                                <div className="text-xs text-gray-500">Unavailable Days</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Filters Panel */}
                <Card className={`lg:col-span-1 border-0 shadow-sm ${showFilters ? '' : 'hidden lg:block'}`}>
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-base flex items-center gap-2">
                                <Filter className="w-4 h-4" />
                                Filters
                                {activeFilterCount > 0 && (
                                    <Badge variant="secondary" className="ml-1">{activeFilterCount}</Badge>
                                )}
                            </CardTitle>
                            {activeFilterCount > 0 && (
                                <Button size="sm" variant="ghost" onClick={clearFilters} className="h-7 text-xs">
                                    <X className="w-3 h-3 mr-1" /> Clear
                                </Button>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Search */}
                        <div>
                            <label className="text-sm font-medium mb-1.5 block">Search</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <Input
                                    placeholder="Name, email, language..."
                                    value={filters.search}
                                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                                    className="pl-9"
                                />
                            </div>
                        </div>

                        {/* Pipeline Status */}
                        <div>
                            <label className="text-sm font-medium mb-1.5 block">Pipeline Status</label>
                            <div className="space-y-1.5 max-h-40 overflow-y-auto">
                                {PIPELINE_STAGES.map(stage => (
                                    <div key={stage.id} className="flex items-center gap-2">
                                        <Checkbox
                                            id={`status-${stage.id}`}
                                            checked={filters.selectedStatuses.includes(stage.id)}
                                            onCheckedChange={() => toggleArrayFilter('selectedStatuses', stage.id)}
                                        />
                                        <label htmlFor={`status-${stage.id}`} className="text-sm cursor-pointer">
                                            <span className={`px-1.5 py-0.5 rounded text-xs ${stage.color}`}>
                                                {stage.label}
                                            </span>
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Availability Status */}
                        <div>
                            <label className="text-sm font-medium mb-1.5 block">Availability Status</label>
                            <Select 
                                value={filters.availabilityStatus} 
                                onValueChange={(value) => setFilters({ ...filters, availabilityStatus: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All</SelectItem>
                                    <SelectItem value="available">Available</SelectItem>
                                    <SelectItem value="partially_available">Partially Available</SelectItem>
                                    <SelectItem value="unavailable">Unavailable</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Hours Range */}
                        <div>
                            <label className="text-sm font-medium mb-1.5 block">Total Hours (this period)</label>
                            <div className="flex gap-2">
                                <Input
                                    type="number"
                                    placeholder="Min"
                                    value={filters.minHours}
                                    onChange={(e) => setFilters({ ...filters, minHours: e.target.value })}
                                    className="flex-1"
                                />
                                <Input
                                    type="number"
                                    placeholder="Max"
                                    value={filters.maxHours}
                                    onChange={(e) => setFilters({ ...filters, maxHours: e.target.value })}
                                    className="flex-1"
                                />
                            </div>
                        </div>

                        {/* Language Pairs */}
                        {allLanguagePairs.length > 0 && (
                            <div>
                                <label className="text-sm font-medium mb-1.5 block">Language Pairs</label>
                                <div className="space-y-1.5 max-h-32 overflow-y-auto">
                                    {allLanguagePairs.slice(0, 10).map(pair => (
                                        <div key={pair} className="flex items-center gap-2">
                                            <Checkbox
                                                id={`pair-${pair}`}
                                                checked={filters.selectedLanguagePairs.includes(pair)}
                                                onCheckedChange={() => toggleArrayFilter('selectedLanguagePairs', pair)}
                                            />
                                            <label htmlFor={`pair-${pair}`} className="text-xs cursor-pointer truncate">
                                                {pair}
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Services */}
                        {allServices.length > 0 && (
                            <div>
                                <label className="text-sm font-medium mb-1.5 block">Services</label>
                                <div className="flex flex-wrap gap-1.5">
                                    {allServices.map(service => (
                                        <Badge
                                            key={service}
                                            variant={filters.selectedServices.includes(service) ? "default" : "outline"}
                                            className="cursor-pointer text-xs"
                                            onClick={() => toggleArrayFilter('selectedServices', service)}
                                        >
                                            {service}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Only with availability */}
                        <div className="flex items-center gap-2 pt-2 border-t">
                            <Checkbox
                                id="only-availability"
                                checked={filters.onlyWithAvailability}
                                onCheckedChange={(checked) => setFilters({ ...filters, onlyWithAvailability: checked })}
                            />
                            <label htmlFor="only-availability" className="text-sm cursor-pointer">
                                Only show with availability data
                            </label>
                        </div>
                    </CardContent>
                </Card>

                {/* Main Content */}
                <div className="lg:col-span-3 space-y-4">
                    {/* Navigation & View Toggle */}
                    <Card className="border-0 shadow-sm">
                        <CardContent className="py-3">
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                                <div className="flex items-center gap-2">
                                    <Button variant="outline" size="sm" onClick={() => setViewMode('week')}
                                        className={viewMode === 'week' ? 'bg-purple-100' : ''}>
                                        Week
                                    </Button>
                                    <Button variant="outline" size="sm" onClick={() => setViewMode('month')}
                                        className={viewMode === 'month' ? 'bg-purple-100' : ''}>
                                        Month
                                    </Button>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button variant="outline" size="icon" onClick={navigatePrevious}>
                                        <ChevronLeft className="w-4 h-4" />
                                    </Button>
                                    <div className="text-sm font-semibold min-w-[180px] text-center">
                                        {viewMode === 'week' 
                                            ? `${format(dateRange.start, 'MMM d')} - ${format(dateRange.end, 'MMM d, yyyy')}`
                                            : format(currentDate, 'MMMM yyyy')
                                        }
                                    </div>
                                    <Button variant="outline" size="icon" onClick={navigateNext}>
                                        <ChevronRight className="w-4 h-4" />
                                    </Button>
                                    <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>
                                        Today
                                    </Button>
                                </div>
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="lg:hidden"
                                    onClick={() => setShowFilters(!showFilters)}
                                >
                                    <Filter className="w-4 h-4 mr-1" />
                                    Filters
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Availability Table */}
                    <Card className="border-0 shadow-sm overflow-hidden">
                        <CardContent className="p-0">
                            {isLoading ? (
                                <div className="flex items-center justify-center py-20">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                                </div>
                            ) : filteredFreelancers.length === 0 ? (
                                <div className="text-center py-16 text-gray-500">
                                    <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                    <p className="font-medium">No freelancers found</p>
                                    <p className="text-sm">Try adjusting your filters</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-gray-50 border-b">
                                            <tr>
                                                <th className="text-left p-3 text-sm font-semibold text-gray-700 sticky left-0 bg-gray-50 min-w-[200px]">
                                                    Freelancer
                                                </th>
                                                <th className="p-3 text-center text-sm font-semibold text-gray-700 min-w-[60px]">
                                                    Hours
                                                </th>
                                                {days.map(day => (
                                                    <th 
                                                        key={day.toString()} 
                                                        className={`p-2 text-center text-xs font-medium min-w-[50px] ${
                                                            isToday(day) ? 'bg-purple-100' : ''
                                                        }`}
                                                    >
                                                        <div className={isToday(day) ? 'text-purple-700' : 'text-gray-600'}>
                                                            {format(day, 'EEE')}
                                                        </div>
                                                        <div className={`text-sm font-bold ${isToday(day) ? 'text-purple-700' : 'text-gray-900'}`}>
                                                            {format(day, 'd')}
                                                        </div>
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredFreelancers.slice(0, 50).map(freelancer => {
                                                const totalHours = getFreelancerTotalHours(freelancer.id);
                                                return (
                                                    <tr key={freelancer.id} className="border-b hover:bg-gray-50 transition-colors">
                                                        <td className="p-3 sticky left-0 bg-white">
                                                            <button
                                                                onClick={() => setSelectedFreelancer(freelancer)}
                                                                className="text-left hover:text-purple-600 transition-colors"
                                                            >
                                                                <div className="font-medium text-sm">{freelancer.full_name}</div>
                                                                <div className="text-xs text-gray-500 truncate max-w-[180px]">
                                                                    {freelancer.language_pairs?.slice(0, 2).map(lp => 
                                                                        `${lp.source_language}→${lp.target_language}`
                                                                    ).join(', ')}
                                                                </div>
                                                            </button>
                                                        </td>
                                                        <td className="p-3 text-center">
                                                            {totalHours > 0 ? (
                                                                <Badge variant="outline" className="text-xs font-semibold">
                                                                    {totalHours}h
                                                                </Badge>
                                                            ) : (
                                                                <span className="text-gray-300">-</span>
                                                            )}
                                                        </td>
                                                        {days.map(day => {
                                                            const availability = getAvailabilityForFreelancerAndDate(freelancer.id, day);
                                                            return (
                                                                <td 
                                                                    key={day.toString()} 
                                                                    className={`p-1 text-center ${isToday(day) ? 'bg-purple-50' : ''}`}
                                                                >
                                                                    {availability ? (
                                                                        <div 
                                                                            className={`
                                                                                inline-flex items-center justify-center 
                                                                                w-8 h-8 rounded-md text-xs font-medium
                                                                                ${statusBgColors[availability.status]}
                                                                            `}
                                                                            title={`${availability.status}: ${availability.hours_available || 0}h`}
                                                                        >
                                                                            {availability.hours_available || '-'}
                                                                        </div>
                                                                    ) : (
                                                                        <div className="w-8 h-8 inline-flex items-center justify-center text-gray-300">
                                                                            -
                                                                        </div>
                                                                    )}
                                                                </td>
                                                            );
                                                        })}
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                    {filteredFreelancers.length > 50 && (
                                        <div className="p-3 text-center text-sm text-gray-500 bg-gray-50">
                                            Showing first 50 of {filteredFreelancers.length} freelancers
                                        </div>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Legend */}
                    <div className="flex flex-wrap gap-4 text-sm justify-center">
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded bg-green-100 border border-green-300 flex items-center justify-center text-xs text-green-800">8</div>
                            <span className="text-gray-600">Available</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded bg-yellow-100 border border-yellow-300 flex items-center justify-center text-xs text-yellow-800">4</div>
                            <span className="text-gray-600">Partially Available</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded bg-red-100 border border-red-300 flex items-center justify-center text-xs text-red-800">0</div>
                            <span className="text-gray-600">Unavailable</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Freelancer Detail Dialog */}
            <Dialog open={!!selectedFreelancer} onOpenChange={() => setSelectedFreelancer(null)}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-3">
                            <div className="p-2 bg-purple-100 rounded-lg">
                                <Calendar className="w-5 h-5 text-purple-600" />
                            </div>
                            {selectedFreelancer?.full_name} - Availability Calendar
                        </DialogTitle>
                    </DialogHeader>
                    {selectedFreelancer && (
                        <div className="space-y-4">
                            <div className="flex flex-wrap gap-2">
                                <Badge variant="outline">{selectedFreelancer.email}</Badge>
                                <Badge className={PIPELINE_STAGES.find(s => s.id === selectedFreelancer.status)?.color}>
                                    {selectedFreelancer.status}
                                </Badge>
                                {selectedFreelancer.language_pairs?.map((lp, idx) => (
                                    <Badge key={idx} variant="secondary" className="text-xs">
                                        {lp.source_language} → {lp.target_language}
                                    </Badge>
                                ))}
                            </div>
                            <AvailabilityCalendar 
                                freelancerId={selectedFreelancer.id} 
                                readOnly={true} 
                            />
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}