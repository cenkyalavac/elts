import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Filter, X } from "lucide-react";

export default function AvailabilityFilters({ filters, onFilterChange, freelancers }) {
    const handleReset = () => {
        onFilterChange({
            search: '',
            status: 'all',
            availability: 'all',
            minHours: '',
            maxHours: '',
            languagePair: 'all'
        });
    };

    const activeFiltersCount = [
        filters.search,
        filters.status !== 'all',
        filters.availability !== 'all',
        filters.minHours,
        filters.maxHours,
        filters.languagePair !== 'all'
    ].filter(Boolean).length;

    // Extract unique language pairs
    const languagePairs = new Set();
    freelancers?.forEach(f => {
        f.language_pairs?.forEach(pair => {
            languagePairs.add(`${pair.source_language} → ${pair.target_language}`);
        });
    });

    return (
        <Card className="border-gray-200">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Filter className="w-5 h-5" />
                        Filters
                    </CardTitle>
                    {activeFiltersCount > 0 && (
                        <div className="flex items-center gap-2">
                            <Badge variant="secondary">{activeFiltersCount}</Badge>
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={handleReset}
                                className="h-6 gap-1 text-xs"
                            >
                                <X className="w-3 h-3" />
                                Reset
                            </Button>
                        </div>
                    )}
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Search */}
                <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                        Search
                    </label>
                    <Input
                        placeholder="Name, email, language..."
                        value={filters.search || ''}
                        onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
                    />
                </div>

                {/* Status */}
                <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                        Status
                    </label>
                    <Select value={filters.status || 'all'} onValueChange={(value) => onFilterChange({ ...filters, status: value })}>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="New Application">New Application</SelectItem>
                            <SelectItem value="Form Sent">Form Sent</SelectItem>
                            <SelectItem value="Price Negotiation">Price Negotiation</SelectItem>
                            <SelectItem value="Test Sent">Test Sent</SelectItem>
                            <SelectItem value="Approved">Approved</SelectItem>
                            <SelectItem value="On Hold">On Hold</SelectItem>
                            <SelectItem value="Rejected">Rejected</SelectItem>
                            <SelectItem value="Red Flag">Red Flag</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Availability Status */}
                <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                        Availability Status
                    </label>
                    <Select value={filters.availability || 'all'} onValueChange={(value) => onFilterChange({ ...filters, availability: value })}>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Availability</SelectItem>
                            <SelectItem value="available">Available</SelectItem>
                            <SelectItem value="partially_available">Partially Available</SelectItem>
                            <SelectItem value="unavailable">Unavailable</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Hours Range */}
                <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                        Hours Available
                    </label>
                    <div className="flex gap-2">
                        <Input
                            type="number"
                            placeholder="Min"
                            value={filters.minHours || ''}
                            onChange={(e) => onFilterChange({ ...filters, minHours: e.target.value })}
                            className="flex-1"
                        />
                        <Input
                            type="number"
                            placeholder="Max"
                            value={filters.maxHours || ''}
                            onChange={(e) => onFilterChange({ ...filters, maxHours: e.target.value })}
                            className="flex-1"
                        />
                    </div>
                </div>

                {/* Language Pair */}
                {languagePairs.size > 0 && (
                    <div>
                        <label className="text-sm font-medium text-gray-700 mb-1 block">
                            Language Pair
                        </label>
                        <Select value={filters.languagePair || 'all'} onValueChange={(value) => onFilterChange({ ...filters, languagePair: value })}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Languages</SelectItem>
                                {Array.from(languagePairs).map(pair => (
                                    <SelectItem key={pair} value={pair}>
                                        {pair}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}