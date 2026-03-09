import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { 
    Search, Loader2, ChevronRight, Mail, Phone, MapPin, 
    GraduationCap, Briefcase, Globe, Calendar, MessageSquare
} from "lucide-react";
import { toast } from "sonner";

const STATUS_CONFIG = {
    new: { label: 'New', color: 'bg-blue-100 text-blue-800' },
    contacted: { label: 'Contacted', color: 'bg-yellow-100 text-yellow-800' },
    converted: { label: 'Converted', color: 'bg-green-100 text-green-800' },
    not_interested: { label: 'Not Interested', color: 'bg-gray-100 text-gray-800' },
};

const CAREER_LABELS = {
    linguist: 'Linguist',
    project_management: 'Project Management',
    vendor_management: 'Vendor Management',
    undecided: 'Undecided',
};

const EDUCATION_LABELS = {
    "1st_year": "1st Year",
    "2nd_year": "2nd Year",
    "3rd_year": "3rd Year",
    "4th_year": "4th Year",
    masters: "Master's",
    phd: "PhD",
    graduated: "Graduated",
    other: "Other",
};

export default function NinjaInterestList() {
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [careerFilter, setCareerFilter] = useState('all');
    const [selectedInterest, setSelectedInterest] = useState(null);

    const { data: interests = [], isLoading } = useQuery({
        queryKey: ['ninjaInterests'],
        queryFn: () => base44.entities.NinjaInterest.list('-created_date'),
    });

    const filtered = interests.filter(item => {
        if (statusFilter !== 'all' && item.status !== statusFilter) return false;
        if (careerFilter !== 'all' && item.career_path !== careerFilter) return false;
        if (search) {
            const q = search.toLowerCase();
            return (
                item.full_name?.toLowerCase().includes(q) ||
                item.email?.toLowerCase().includes(q) ||
                item.university?.toLowerCase().includes(q)
            );
        }
        return true;
    });

    const statusCounts = interests.reduce((acc, i) => {
        acc[i.status || 'new'] = (acc[i.status || 'new'] || 0) + 1;
        return acc;
    }, {});

    if (isLoading) {
        return <div className="text-center py-8"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>;
    }

    return (
        <div className="space-y-4">
            {/* Summary */}
            <div className="flex flex-wrap gap-3 mb-2">
                {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                    <Badge 
                        key={key} 
                        className={`${config.color} cursor-pointer`}
                        onClick={() => setStatusFilter(statusFilter === key ? 'all' : key)}
                    >
                        {config.label}: {statusCounts[key] || 0}
                    </Badge>
                ))}
                <Badge variant="outline">Total: {interests.length}</Badge>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder="Search name, email, university..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9"
                    />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-40">
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                            <SelectItem key={key} value={key}>{config.label}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Select value={careerFilter} onValueChange={setCareerFilter}>
                    <SelectTrigger className="w-48">
                        <SelectValue placeholder="Career Path" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Paths</SelectItem>
                        {Object.entries(CAREER_LABELS).map(([key, label]) => (
                            <SelectItem key={key} value={key}>{label}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* List */}
            {filtered.length === 0 ? (
                <Card>
                    <CardContent className="py-8 text-center text-gray-500">
                        No interest registrations found
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-2">
                    {filtered.map(item => (
                        <Card key={item.id} className="hover:shadow-sm transition-shadow cursor-pointer" onClick={() => setSelectedInterest(item)}>
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="font-medium">{item.full_name}</span>
                                            <Badge className={STATUS_CONFIG[item.status || 'new']?.color}>
                                                {STATUS_CONFIG[item.status || 'new']?.label}
                                            </Badge>
                                            {item.career_path && (
                                                <Badge variant="outline" className="text-xs">
                                                    {CAREER_LABELS[item.career_path] || item.career_path}
                                                </Badge>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-500 flex-wrap">
                                            <span className="flex items-center gap-1">
                                                <Mail className="w-3 h-3" /> {item.email}
                                            </span>
                                            {item.university && (
                                                <span className="flex items-center gap-1">
                                                    <GraduationCap className="w-3 h-3" /> {item.university}
                                                    {item.education_status && ` (${EDUCATION_LABELS[item.education_status] || item.education_status})`}
                                                </span>
                                            )}
                                            {item.location && (
                                                <span className="flex items-center gap-1">
                                                    <MapPin className="w-3 h-3" /> {item.location}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {selectedInterest && (
                <InterestDetailDialog 
                    interest={selectedInterest} 
                    onClose={() => setSelectedInterest(null)} 
                />
            )}
        </div>
    );
}

function InterestDetailDialog({ interest, onClose }) {
    const queryClient = useQueryClient();
    const [status, setStatus] = useState(interest.status || 'new');
    const [adminNotes, setAdminNotes] = useState('');

    const updateMutation = useMutation({
        mutationFn: (data) => base44.entities.NinjaInterest.update(interest.id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['ninjaInterests'] });
            toast.success('Status updated');
            onClose();
        },
    });

    return (
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{interest.full_name}</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Contact */}
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                            <Mail className="w-4 h-4 text-gray-400" />
                            <a href={`mailto:${interest.email}`} className="text-blue-600 hover:underline">{interest.email}</a>
                        </div>
                        {interest.phone && (
                            <div className="flex items-center gap-2 text-sm">
                                <Phone className="w-4 h-4 text-gray-400" />
                                {interest.phone}
                            </div>
                        )}
                        {interest.location && (
                            <div className="flex items-center gap-2 text-sm">
                                <MapPin className="w-4 h-4 text-gray-400" />
                                {interest.location}
                            </div>
                        )}
                    </div>

                    {/* Education */}
                    {(interest.university || interest.department) && (
                        <div className="bg-purple-50 rounded-lg p-3 space-y-1">
                            <div className="text-xs font-medium text-purple-700 uppercase">Education</div>
                            {interest.university && <div className="text-sm font-medium">{interest.university}</div>}
                            {interest.department && <div className="text-sm text-gray-600">{interest.department}</div>}
                            <div className="flex gap-3 text-xs text-gray-500">
                                {interest.education_status && (
                                    <span>{EDUCATION_LABELS[interest.education_status] || interest.education_status}</span>
                                )}
                                {interest.graduation_date && (
                                    <span className="flex items-center gap-1">
                                        <Calendar className="w-3 h-3" /> Grad: {interest.graduation_date}
                                    </span>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Career & Experience */}
                    <div className="flex flex-wrap gap-2">
                        {interest.career_path && (
                            <Badge className="bg-indigo-100 text-indigo-800">
                                <Briefcase className="w-3 h-3 mr-1" />
                                {CAREER_LABELS[interest.career_path] || interest.career_path}
                            </Badge>
                        )}
                        {interest.experience_level && (
                            <Badge variant="outline">{interest.experience_level.replace(/_/g, ' ')}</Badge>
                        )}
                    </div>

                    {/* Language Pairs */}
                    {interest.language_pairs?.length > 0 && (
                        <div>
                            <div className="text-xs font-medium text-gray-500 uppercase mb-1">Languages</div>
                            <div className="flex flex-wrap gap-1">
                                {interest.language_pairs.map((pair, idx) => (
                                    <Badge key={idx} variant="secondary">
                                        {pair.source_language} → {pair.target_language}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Interests */}
                    {interest.interests?.length > 0 && (
                        <div>
                            <div className="text-xs font-medium text-gray-500 uppercase mb-1">Areas of Interest</div>
                            <div className="flex flex-wrap gap-1">
                                {interest.interests.map((area, idx) => (
                                    <Badge key={idx} variant="secondary" className="text-xs">{area}</Badge>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* How heard & Notes */}
                    {interest.how_heard && (
                        <div className="text-sm">
                            <span className="text-gray-500">Heard about us: </span>
                            {interest.how_heard}
                        </div>
                    )}
                    {interest.notes && (
                        <div className="bg-gray-50 rounded-lg p-3">
                            <div className="text-xs font-medium text-gray-500 mb-1">Their Notes</div>
                            <p className="text-sm text-gray-700">{interest.notes}</p>
                        </div>
                    )}

                    {/* Date */}
                    <div className="text-xs text-gray-400">
                        Registered: {new Date(interest.created_date).toLocaleString()}
                    </div>

                    {/* Admin Actions */}
                    <div className="border-t pt-4 space-y-3">
                        <div>
                            <label className="text-sm font-medium">Update Status</label>
                            <Select value={status} onValueChange={setStatus}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                                        <SelectItem key={key} value={key}>{config.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                className="flex-1 bg-purple-600 hover:bg-purple-700"
                                onClick={() => updateMutation.mutate({ status })}
                                disabled={updateMutation.isPending}
                            >
                                {updateMutation.isPending ? 'Saving...' : 'Update Status'}
                            </Button>
                            <Button variant="outline" onClick={onClose}>Close</Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}