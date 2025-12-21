import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter } from "lucide-react";

export default function FilterPanel({ filters, onFilterChange }) {
    return (
        <Card>
            <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-4">
                    <Filter className="w-4 h-4 text-gray-500" />
                    <h3 className="font-semibold">Filters</h3>
                </div>
                
                <div className="space-y-4">
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

                    <div>
                        <Label htmlFor="status" className="text-sm">Status</Label>
                        <Select
                            value={filters.status || 'all'}
                            onValueChange={(value) => onFilterChange({ ...filters, status: value })}
                        >
                            <SelectTrigger id="status">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="New">New</SelectItem>
                                <SelectItem value="Reviewing">Reviewing</SelectItem>
                                <SelectItem value="Interview Scheduled">Interview Scheduled</SelectItem>
                                <SelectItem value="Accepted">Accepted</SelectItem>
                                <SelectItem value="Rejected">Rejected</SelectItem>
                                <SelectItem value="On Hold">On Hold</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <Label htmlFor="serviceType" className="text-sm">Service Type</Label>
                        <Select
                            value={filters.serviceType || 'all'}
                            onValueChange={(value) => onFilterChange({ ...filters, serviceType: value })}
                        >
                            <SelectTrigger id="serviceType">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Services</SelectItem>
                                <SelectItem value="Translation">Translation</SelectItem>
                                <SelectItem value="Interpretation">Interpretation</SelectItem>
                                <SelectItem value="Proofreading">Proofreading</SelectItem>
                                <SelectItem value="Localization">Localization</SelectItem>
                                <SelectItem value="Transcription">Transcription</SelectItem>
                                <SelectItem value="Subtitling">Subtitling</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <Label htmlFor="availability" className="text-sm">Availability</Label>
                        <Select
                            value={filters.availability || 'all'}
                            onValueChange={(value) => onFilterChange({ ...filters, availability: value })}
                        >
                            <SelectTrigger id="availability">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All</SelectItem>
                                <SelectItem value="Immediate">Immediate</SelectItem>
                                <SelectItem value="Within 1 week">Within 1 week</SelectItem>
                                <SelectItem value="Within 2 weeks">Within 2 weeks</SelectItem>
                                <SelectItem value="Within 1 month">Within 1 month</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}