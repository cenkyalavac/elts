import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
    Plus, Users, Calendar, GraduationCap, Target, 
    Settings, ChevronRight, Loader2, Clock, CheckCircle,
    BookOpen, Laptop, Award
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { toast } from "sonner";

const programTypeConfig = {
    bootcamp: { label: 'Bootcamp', color: 'bg-purple-100 text-purple-800', icon: GraduationCap },
    masterclass: { label: 'Masterclass', color: 'bg-blue-100 text-blue-800', icon: BookOpen },
    specialized_training: { label: 'Specialized', color: 'bg-green-100 text-green-800', icon: Target },
};

const statusConfig = {
    draft: { label: 'Draft', color: 'bg-gray-100 text-gray-800' },
    accepting_applications: { label: 'Accepting Applications', color: 'bg-green-100 text-green-800' },
    applications_closed: { label: 'Applications Closed', color: 'bg-yellow-100 text-yellow-800' },
    in_progress: { label: 'In Progress', color: 'bg-blue-100 text-blue-800' },
    completed: { label: 'Completed', color: 'bg-purple-100 text-purple-800' },
};

export default function NinjaProgramsPage() {
    const [showForm, setShowForm] = useState(false);
    const [editingProgram, setEditingProgram] = useState(null);
    const queryClient = useQueryClient();

    const { data: user } = useQuery({
        queryKey: ['currentUser'],
        queryFn: () => base44.auth.me(),
    });

    const { data: programs = [], isLoading } = useQuery({
        queryKey: ['ninjaPrograms'],
        queryFn: () => base44.entities.NinjaProgram.list('-created_date'),
    });

    const { data: applicants = [] } = useQuery({
        queryKey: ['ninjaApplicants'],
        queryFn: () => base44.entities.NinjaApplicant.list(),
    });

    const isAdmin = user?.role === 'admin';
    const isProjectManager = user?.role === 'project_manager';
    const canManage = isAdmin || isProjectManager;

    const activePrograms = programs.filter(p => p.status === 'accepting_applications');
    const upcomingPrograms = programs.filter(p => p.status === 'draft' || p.status === 'applications_closed');
    const pastPrograms = programs.filter(p => p.status === 'completed' || p.status === 'in_progress');

    const getApplicantCount = (programId) => applicants.filter(a => a.program_id === programId).length;
    const getGraduateCount = (programId) => applicants.filter(a => a.program_id === programId && a.status === 'graduated').length;

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-50 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-50 p-6">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-3">
                            <div className="p-2 bg-purple-100 rounded-lg">
                                <GraduationCap className="w-6 h-6 text-purple-600" />
                            </div>
                            Localization Ninja
                        </h1>
                        <p className="text-gray-600 mt-1 text-sm sm:text-base">
                            Training programs and bootcamps
                        </p>
                    </div>
                    {canManage && (
                        <Button onClick={() => { setEditingProgram(null); setShowForm(true); }} className="bg-purple-600 hover:bg-purple-700">
                            <Plus className="w-4 h-4 mr-2" />
                            New Program
                        </Button>
                    )}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <Card>
                        <CardContent className="pt-4">
                            <div className="text-2xl font-bold text-purple-600">{programs.length}</div>
                            <div className="text-sm text-gray-600">Total Programs</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-4">
                            <div className="text-2xl font-bold text-green-600">{activePrograms.length}</div>
                            <div className="text-sm text-gray-600">Active</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-4">
                            <div className="text-2xl font-bold text-blue-600">{applicants.length}</div>
                            <div className="text-sm text-gray-600">Total Applicants</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-4">
                            <div className="text-2xl font-bold text-amber-600">
                                {applicants.filter(a => a.status === 'graduated').length}
                            </div>
                            <div className="text-sm text-gray-600">Graduates</div>
                        </CardContent>
                    </Card>
                </div>

                <Tabs defaultValue="active" className="space-y-6">
                    <TabsList className="flex flex-wrap gap-1 h-auto p-1">
                        <TabsTrigger value="active">Active Programs</TabsTrigger>
                        <TabsTrigger value="all">All Programs</TabsTrigger>
                        {canManage && <TabsTrigger value="applicants">Applicants</TabsTrigger>}
                    </TabsList>

                    <TabsContent value="active">
                        {activePrograms.length === 0 ? (
                            <Card>
                                <CardContent className="py-12 text-center">
                                    <GraduationCap className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                    <p className="text-gray-600">No active programs at the moment</p>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="grid gap-4">
                                {activePrograms.map(program => (
                                    <ProgramCard 
                                        key={program.id} 
                                        program={program}
                                        applicantCount={getApplicantCount(program.id)}
                                        graduateCount={getGraduateCount(program.id)}
                                        canManage={canManage}
                                        onEdit={() => { setEditingProgram(program); setShowForm(true); }}
                                    />
                                ))}
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="all">
                        <div className="space-y-6">
                            {programs.length === 0 ? (
                                <Card>
                                    <CardContent className="py-12 text-center">
                                        <GraduationCap className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                        <p className="text-gray-600">No programs created yet</p>
                                    </CardContent>
                                </Card>
                            ) : (
                                <div className="grid gap-4">
                                    {programs.map(program => (
                                        <ProgramCard 
                                            key={program.id} 
                                            program={program}
                                            applicantCount={getApplicantCount(program.id)}
                                            graduateCount={getGraduateCount(program.id)}
                                            canManage={canManage}
                                            onEdit={() => { setEditingProgram(program); setShowForm(true); }}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    </TabsContent>

                    {canManage && (
                        <TabsContent value="applicants">
                            <NinjaApplicantsView programs={programs} />
                        </TabsContent>
                    )}
                </Tabs>

                <ProgramFormDialog
                    open={showForm}
                    onOpenChange={setShowForm}
                    program={editingProgram}
                />
            </div>
        </div>
    );
}

function ProgramCard({ program, applicantCount, graduateCount, canManage, onEdit }) {
    const typeConfig = programTypeConfig[program.program_type] || programTypeConfig.bootcamp;
    const TypeIcon = typeConfig.icon;
    const status = statusConfig[program.status] || statusConfig.draft;

    return (
        <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <Badge className={typeConfig.color}>
                                <TypeIcon className="w-3 h-3 mr-1" />
                                {typeConfig.label}
                            </Badge>
                            <Badge className={status.color}>{status.label}</Badge>
                            {program.location_type && (
                                <Badge variant="outline">
                                    <Laptop className="w-3 h-3 mr-1" />
                                    {program.location_type === 'online' ? 'Online' : program.location_type === 'in_person' ? 'In Person' : 'Hybrid'}
                                </Badge>
                            )}
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">{program.name}</h3>
                        {program.description && (
                            <p className="text-gray-600 text-sm mb-3 line-clamp-2">{program.description}</p>
                        )}
                        {program.focus_areas?.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-3">
                                {program.focus_areas.map((area, idx) => (
                                    <Badge key={idx} variant="secondary" className="text-xs">{area}</Badge>
                                ))}
                            </div>
                        )}
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                            {program.program_start_date && (
                                <span className="flex items-center gap-1">
                                    <Calendar className="w-4 h-4" />
                                    {new Date(program.program_start_date).toLocaleDateString()}
                                    {program.duration_days && ` (${program.duration_days} days)`}
                                </span>
                            )}
                            <span className="flex items-center gap-1">
                                <Users className="w-4 h-4" />
                                {applicantCount} applicants
                            </span>
                            <span className="flex items-center gap-1">
                                <Award className="w-4 h-4" />
                                {graduateCount} graduates
                            </span>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        {canManage && (
                            <Button variant="outline" size="sm" onClick={onEdit}>
                                <Settings className="w-4 h-4" />
                            </Button>
                        )}
                        <Link to={`${createPageUrl('NinjaApplicants')}?program=${program.id}`}>
                            <Button variant="outline" size="sm">
                                View <ChevronRight className="w-4 h-4 ml-1" />
                            </Button>
                        </Link>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

function NinjaApplicantsView({ programs }) {
    const { data: applicants = [], isLoading } = useQuery({
        queryKey: ['ninjaApplicants'],
        queryFn: () => base44.entities.NinjaApplicant.list('-created_date'),
    });

    const [statusFilter, setStatusFilter] = useState('all');
    const [programFilter, setProgramFilter] = useState('all');

    const filteredApplicants = applicants.filter(a => {
        if (statusFilter !== 'all' && a.status !== statusFilter) return false;
        if (programFilter !== 'all' && a.program_id !== programFilter) return false;
        return true;
    });

    const getProgramName = (programId) => programs.find(p => p.id === programId)?.name || 'Unknown';

    if (isLoading) {
        return <div className="text-center py-8"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>;
    }

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap gap-3">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-40">
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="applied">Applied</SelectItem>
                        <SelectItem value="under_review">Under Review</SelectItem>
                        <SelectItem value="quiz_assigned">Quiz Assigned</SelectItem>
                        <SelectItem value="accepted">Accepted</SelectItem>
                        <SelectItem value="graduated">Graduated</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                </Select>
                <Select value={programFilter} onValueChange={setProgramFilter}>
                    <SelectTrigger className="w-48">
                        <SelectValue placeholder="Program" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Programs</SelectItem>
                        {programs.map(p => (
                            <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {filteredApplicants.length === 0 ? (
                <Card>
                    <CardContent className="py-8 text-center text-gray-500">
                        No applicants found
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-2">
                    {filteredApplicants.map(applicant => (
                        <Card key={applicant.id} className="hover:shadow-sm transition-shadow">
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="font-medium">{applicant.full_name}</div>
                                        <div className="text-sm text-gray-500">{applicant.email}</div>
                                        <div className="text-xs text-gray-400 mt-1">
                                            {getProgramName(applicant.program_id)}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <ApplicantStatusBadge status={applicant.status} />
                                        <Link to={`${createPageUrl('NinjaApplicants')}?id=${applicant.id}`}>
                                            <Button variant="ghost" size="sm">
                                                <ChevronRight className="w-4 h-4" />
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}

function ApplicantStatusBadge({ status }) {
    const config = {
        applied: { color: 'bg-blue-100 text-blue-800', label: 'Applied' },
        under_review: { color: 'bg-yellow-100 text-yellow-800', label: 'Under Review' },
        quiz_assigned: { color: 'bg-purple-100 text-purple-800', label: 'Quiz Assigned' },
        quiz_completed: { color: 'bg-indigo-100 text-indigo-800', label: 'Quiz Done' },
        interview_scheduled: { color: 'bg-cyan-100 text-cyan-800', label: 'Interview' },
        accepted: { color: 'bg-green-100 text-green-800', label: 'Accepted' },
        rejected: { color: 'bg-red-100 text-red-800', label: 'Rejected' },
        graduated: { color: 'bg-amber-100 text-amber-800', label: 'Graduated' },
        withdrawn: { color: 'bg-gray-100 text-gray-800', label: 'Withdrawn' },
    };
    const c = config[status] || config.applied;
    return <Badge className={c.color}>{c.label}</Badge>;
}

function ProgramFormDialog({ open, onOpenChange, program }) {
    const queryClient = useQueryClient();
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        program_type: 'bootcamp',
        focus_areas: [],
        target_audience: 'all',
        application_start_date: '',
        application_end_date: '',
        program_start_date: '',
        program_end_date: '',
        duration_days: 5,
        capacity: 10,
        location_type: 'online',
        status: 'draft',
        curriculum: '',
        requirements: '',
    });

    const [focusInput, setFocusInput] = useState('');

    React.useEffect(() => {
        if (program) {
            setFormData({
                name: program.name || '',
                description: program.description || '',
                program_type: program.program_type || 'bootcamp',
                focus_areas: program.focus_areas || [],
                target_audience: program.target_audience || 'all',
                application_start_date: program.application_start_date || '',
                application_end_date: program.application_end_date || '',
                program_start_date: program.program_start_date || '',
                program_end_date: program.program_end_date || '',
                duration_days: program.duration_days || 5,
                capacity: program.capacity || 10,
                location_type: program.location_type || 'online',
                status: program.status || 'draft',
                curriculum: program.curriculum || '',
                requirements: program.requirements || '',
            });
        } else {
            setFormData({
                name: '',
                description: '',
                program_type: 'bootcamp',
                focus_areas: [],
                target_audience: 'all',
                application_start_date: '',
                application_end_date: '',
                program_start_date: '',
                program_end_date: '',
                duration_days: 5,
                capacity: 10,
                location_type: 'online',
                status: 'draft',
                curriculum: '',
                requirements: '',
            });
        }
    }, [program, open]);

    const saveMutation = useMutation({
        mutationFn: (data) => {
            if (program) {
                return base44.entities.NinjaProgram.update(program.id, data);
            }
            return base44.entities.NinjaProgram.create(data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['ninjaPrograms'] });
            onOpenChange(false);
            toast.success(program ? 'Program updated' : 'Program created');
        },
    });

    const addFocusArea = () => {
        if (focusInput.trim() && !formData.focus_areas.includes(focusInput.trim())) {
            setFormData({ ...formData, focus_areas: [...formData.focus_areas, focusInput.trim()] });
            setFocusInput('');
        }
    };

    const removeFocusArea = (area) => {
        setFormData({ ...formData, focus_areas: formData.focus_areas.filter(a => a !== area) });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{program ? 'Edit Program' : 'New Program'}</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    <div>
                        <label className="text-sm font-medium">Program Name</label>
                        <Input
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="e.g., Localization Ninja Bootcamp 2026"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium">Program Type</label>
                            <Select value={formData.program_type} onValueChange={(v) => setFormData({ ...formData, program_type: v })}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="bootcamp">Bootcamp</SelectItem>
                                    <SelectItem value="masterclass">Masterclass</SelectItem>
                                    <SelectItem value="specialized_training">Specialized Training</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <label className="text-sm font-medium">Status</label>
                            <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="draft">Draft</SelectItem>
                                    <SelectItem value="accepting_applications">Accepting Applications</SelectItem>
                                    <SelectItem value="applications_closed">Applications Closed</SelectItem>
                                    <SelectItem value="in_progress">In Progress</SelectItem>
                                    <SelectItem value="completed">Completed</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div>
                        <label className="text-sm font-medium">Description</label>
                        <Textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Program description..."
                            rows={3}
                        />
                    </div>

                    <div>
                        <label className="text-sm font-medium">Focus Areas</label>
                        <div className="flex gap-2 mb-2">
                            <Input
                                value={focusInput}
                                onChange={(e) => setFocusInput(e.target.value)}
                                placeholder="e.g., Translation, Project Management"
                                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addFocusArea())}
                            />
                            <Button type="button" variant="outline" onClick={addFocusArea}>Add</Button>
                        </div>
                        <div className="flex flex-wrap gap-1">
                            {formData.focus_areas.map((area, idx) => (
                                <Badge key={idx} variant="secondary" className="cursor-pointer" onClick={() => removeFocusArea(area)}>
                                    {area} ×
                                </Badge>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium">Target Audience</label>
                            <Select value={formData.target_audience} onValueChange={(v) => setFormData({ ...formData, target_audience: v })}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All</SelectItem>
                                    <SelectItem value="students">Students</SelectItem>
                                    <SelectItem value="new_graduates">New Graduates</SelectItem>
                                    <SelectItem value="junior_professionals">Junior Professionals</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <label className="text-sm font-medium">Location</label>
                            <Select value={formData.location_type} onValueChange={(v) => setFormData({ ...formData, location_type: v })}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="online">Online</SelectItem>
                                    <SelectItem value="in_person">In Person</SelectItem>
                                    <SelectItem value="hybrid">Hybrid</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium">Application Start</label>
                            <Input
                                type="date"
                                value={formData.application_start_date}
                                onChange={(e) => setFormData({ ...formData, application_start_date: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium">Application End</label>
                            <Input
                                type="date"
                                value={formData.application_end_date}
                                onChange={(e) => setFormData({ ...formData, application_end_date: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium">Program Start</label>
                            <Input
                                type="date"
                                value={formData.program_start_date}
                                onChange={(e) => setFormData({ ...formData, program_start_date: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium">Program End</label>
                            <Input
                                type="date"
                                value={formData.program_end_date}
                                onChange={(e) => setFormData({ ...formData, program_end_date: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium">Duration (days)</label>
                            <Input
                                type="number"
                                value={formData.duration_days}
                                onChange={(e) => setFormData({ ...formData, duration_days: parseInt(e.target.value) || 0 })}
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium">Capacity</label>
                            <Input
                                type="number"
                                value={formData.capacity}
                                onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 0 })}
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                        <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                        <Button 
                            onClick={() => saveMutation.mutate(formData)}
                            disabled={!formData.name || saveMutation.isPending}
                            className="bg-purple-600 hover:bg-purple-700"
                        >
                            {saveMutation.isPending ? 'Saving...' : (program ? 'Update' : 'Create')}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}