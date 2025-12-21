import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { 
    Search, Filter, X, ChevronDown, ChevronUp, 
    Globe, Briefcase, Award, Calendar 
} from "lucide-react";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

export default function AdvancedFilters({ filters, onFilterChange, freelancers }) {
    const [expandedSections, setExpandedSections] = useState({
        languages: true,
        specializations: true,
        services: true,
        experience: true
    });

    // Extract unique values from freelancers
    const allLanguages = [...new Set(
        freelancers.flatMap(f => f.languages?.map(l => l.language) || [])
    )].sort();

    const allSpecializations = [...new Set(
        freelancers.flatMap(f => f.specializations || [])
    )].sort();

    const allServices = [
        "Translation", "Interpretation", "Proofreading", 
        "Localization", "Transcription", "Subtitling"
    ];

    const toggleSection = (section) => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    const toggleArrayFilter = (filterKey, value) => {
        const current = filters[filterKey] || [];
        const updated = current.includes(value)
            ? current.filter(v => v !== value)
            : [...current, value];
        onFilterChange({ ...filters, [filterKey]: updated });
    };

    const clearAllFilters = () => {
        onFilterChange({
            search: '',
            status: 'all',
            selectedLanguages: [],
            selectedSpecializations: [],
            selectedServices: [],
            minExperience: '',
            maxExperience: '',
            availability: 'all'
        });
    };

    const activeFilterCount = 
        (filters.selectedLanguages?.length || 0) +
        (filters.selectedSpecializations?.length || 0) +
        (filters.selectedServices?.length || 0) +
        (filters.status !== 'all' ? 1 : 0) +
        (filters.availability !== 'all' ? 1 : 0) +
        (filters.minExperience ? 1 : 0) +
        (filters.maxExperience ? 1 : 0);

    return (
        <Card>
            <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <Filter className="w-4 h-4 text-gray-500" />
                        <h3 className="font-semibold">Advanced Filters</h3>
                        {activeFilterCount > 0 && (
                            <Badge variant="secondary" className="ml-2">
                                {activeFilterCount}
                            </Badge>
                        )}
                    </div>
                    {activeFilterCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={clearAllFilters}
                            className="h-8 text-xs"
                        >
                            Clear All
                        </Button>
                    )}
                </div>
                
                <div className="space-y-4">
                    {/* Search */}
                    <div>
                        <Label htmlFor="search" className="text-sm">Search</Label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <Input
                                id="search"
                                placeholder="Name, email, skills..."
                                value={filters.search || ''}
                                onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
                                className="pl-9"
                            />
                        </div>
                    </div>

                    {/* Status Pills */}
                    <div>
                        <Label className="text-sm mb-2 block">Status</Label>
                        <div className="flex flex-wrap gap-2">
                            {['all', 'New', 'Reviewing', 'Interview Scheduled', 'Accepted', 'Rejected'].map(status => (
                                <Badge
                                    key={status}
                                    variant={filters.status === status ? "default" : "outline"}
                                    className="cursor-pointer"
                                    onClick={() => onFilterChange({ ...filters, status })}
                                >
                                    {status === 'all' ? 'All' : status}
                                </Badge>
                            ))}
                        </div>
                    </div>

                    {/* Languages */}
                    <div className="border-t pt-4">
                        <button
                            onClick={() => toggleSection('languages')}
                            className="flex items-center justify-between w-full mb-2"
                        >
                            <div className="flex items-center gap-2">
                                <Globe className="w-4 h-4 text-gray-500" />
                                <Label className="text-sm cursor-pointer">Languages</Label>
                                {filters.selectedLanguages?.length > 0 && (
                                    <Badge variant="secondary" className="text-xs">
                                        {filters.selectedLanguages.length}
                                    </Badge>
                                )}
                            </div>
                            {expandedSections.languages ? 
                                <ChevronUp className="w-4 h-4" /> : 
                                <ChevronDown className="w-4 h-4" />
                            }
                        </button>
                        {expandedSections.languages && (
                            <div className="space-y-2 max-h-48 overflow-y-auto pl-6">
                                {allLanguages.map(lang => (
                                    <div key={lang} className="flex items-center gap-2">
                                        <Checkbox
                                            id={`lang-${lang}`}
                                            checked={filters.selectedLanguages?.includes(lang)}
                                            onCheckedChange={() => toggleArrayFilter('selectedLanguages', lang)}
                                        />
                                        <label
                                            htmlFor={`lang-${lang}`}
                                            className="text-sm cursor-pointer"
                                        >
                                            {lang}
                                        </label>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Specializations */}
                    {allSpecializations.length > 0 && (
                        <div className="border-t pt-4">
                            <button
                                onClick={() => toggleSection('specializations')}
                                className="flex items-center justify-between w-full mb-2"
                            >
                                <div className="flex items-center gap-2">
                                    <Briefcase className="w-4 h-4 text-gray-500" />
                                    <Label className="text-sm cursor-pointer">Specializations</Label>
                                    {filters.selectedSpecializations?.length > 0 && (
                                        <Badge variant="secondary" className="text-xs">
                                            {filters.selectedSpecializations.length}
                                        </Badge>
                                    )}
                                </div>
                                {expandedSections.specializations ? 
                                    <ChevronUp className="w-4 h-4" /> : 
                                    <ChevronDown className="w-4 h-4" />
                                }
                            </button>
                            {expandedSections.specializations && (
                                <div className="space-y-2 max-h-48 overflow-y-auto pl-6">
                                    {allSpecializations.map(spec => (
                                        <div key={spec} className="flex items-center gap-2">
                                            <Checkbox
                                                id={`spec-${spec}`}
                                                checked={filters.selectedSpecializations?.includes(spec)}
                                                onCheckedChange={() => toggleArrayFilter('selectedSpecializations', spec)}
                                            />
                                            <label
                                                htmlFor={`spec-${spec}`}
                                                className="text-sm cursor-pointer"
                                            >
                                                {spec}
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Service Types */}
                    <div className="border-t pt-4">
                        <button
                            onClick={() => toggleSection('services')}
                            className="flex items-center justify-between w-full mb-2"
                        >
                            <div className="flex items-center gap-2">
                                <Award className="w-4 h-4 text-gray-500" />
                                <Label className="text-sm cursor-pointer">Service Types</Label>
                                {filters.selectedServices?.length > 0 && (
                                    <Badge variant="secondary" className="text-xs">
                                        {filters.selectedServices.length}
                                    </Badge>
                                )}
                            </div>
                            {expandedSections.services ? 
                                <ChevronUp className="w-4 h-4" /> : 
                                <ChevronDown className="w-4 h-4" />
                            }
                        </button>
                        {expandedSections.services && (
                            <div className="space-y-2 pl-6">
                                {allServices.map(service => (
                                    <div key={service} className="flex items-center gap-2">
                                        <Checkbox
                                            id={`service-${service}`}
                                            checked={filters.selectedServices?.includes(service)}
                                            onCheckedChange={() => toggleArrayFilter('selectedServices', service)}
                                        />
                                        <label
                                            htmlFor={`service-${service}`}
                                            className="text-sm cursor-pointer"
                                        >
                                            {service}
                                        </label>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Experience Range */}
                    <div className="border-t pt-4">
                        <button
                            onClick={() => toggleSection('experience')}
                            className="flex items-center justify-between w-full mb-2"
                        >
                            <div className="flex items-center gap-2">
                                <Award className="w-4 h-4 text-gray-500" />
                                <Label className="text-sm cursor-pointer">Experience (years)</Label>
                            </div>
                            {expandedSections.experience ? 
                                <ChevronUp className="w-4 h-4" /> : 
                                <ChevronDown className="w-4 h-4" />
                            }
                        </button>
                        {expandedSections.experience && (
                            <div className="grid grid-cols-2 gap-2 pl-6">
                                <div>
                                    <Label htmlFor="minExp" className="text-xs text-gray-500">Min</Label>
                                    <Input
                                        id="minExp"
                                        type="number"
                                        min="0"
                                        placeholder="0"
                                        value={filters.minExperience || ''}
                                        onChange={(e) => onFilterChange({ ...filters, minExperience: e.target.value })}
                                        className="h-8"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="maxExp" className="text-xs text-gray-500">Max</Label>
                                    <Input
                                        id="maxExp"
                                        type="number"
                                        min="0"
                                        placeholder="Any"
                                        value={filters.maxExperience || ''}
                                        onChange={(e) => onFilterChange({ ...filters, maxExperience: e.target.value })}
                                        className="h-8"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Availability */}
                    <div className="border-t pt-4">
                        <Label className="text-sm mb-2 block flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-500" />
                            Availability
                        </Label>
                        <div className="flex flex-wrap gap-2">
                            {['all', 'Immediate', 'Within 1 week', 'Within 2 weeks', 'Within 1 month'].map(avail => (
                                <Badge
                                    key={avail}
                                    variant={filters.availability === avail ? "default" : "outline"}
                                    className="cursor-pointer text-xs"
                                    onClick={() => onFilterChange({ ...filters, availability: avail })}
                                >
                                    {avail === 'all' ? 'All' : avail}
                                </Badge>
                            ))}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}