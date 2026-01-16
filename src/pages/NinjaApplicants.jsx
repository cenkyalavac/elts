import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
    Users, Search, Filter, ChevronRight, Mail, Phone, MapPin,
    GraduationCap, Star, FileText, Calendar, Loader2, Award,
    CheckCircle, XCircle, ClipboardList, ArrowLeft
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { toast } from "sonner";

const statusConfig = {
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

export default function NinjaApplicantsPage() {
    const urlParams = new URLSearchParams(window.location.search);
    const programIdFilter = urlParams.get('program');
    const applicantIdParam = urlParams.get('id');

    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [programFilter, setProgramFilter] = useState(programIdFilter || 'all');
    const [selectedApplicant, setSelectedApplicant] = useState(null);

    const queryClient = useQueryClient();

    const { data: user } = useQuery({
        queryKey: ['currentUser'],
        queryFn: () => base44.auth.me(),
    });

    const { data: programs = [] } = useQuery({
        queryKey: ['ninjaPrograms'],
        queryFn: () => base44.entities.NinjaProgram.list(),
    });

    const { data: applicants = [], isLoading } = useQuery({
        queryKey: ['ninjaApplicants'],
        queryFn: () => base44.entities.NinjaApplicant.list('-created_date'),
    });

    const { data: quizzes = [] } = useQuery({
        queryKey: ['quizzes'],
        queryFn: () => base44.entities.Quiz.list(),
    });

    // Auto-select applicant if ID in URL
    React.useEffect(() => {
        if (applicantIdParam && applicants.length > 0) {
            const found = applicants.find(a => a.id === applicantIdParam);
            if (found) setSelectedApplicant(found);
        }
    }, [applicantIdParam, applicants]);

    const isAdmin = user?.role === 'admin';
    const isProjectManager = user?.role === 'project_manager';
    const canManage = isAdmin || isProjectManager;

    const filteredApplicants = applicants.filter(a => {
        if (statusFilter !== 'all' && a.status !== statusFilter) return false;
        if (programFilter !== 'all' && a.program_id !== programFilter) return false;
        if (search) {
            const s = search.toLowerCase();
            if (!a.full_name?.toLowerCase().includes(s) && !a.email?.toLowerCase().includes(s)) return false;
        }
        return true;
    });

    const getProgramName = (programId) => programs.find(p => p.id === programId)?.name || 'Unknown Program';

    const currentProgram = programFilter !== 'all' ? programs.find(p => p.id === programFilter) : null;

    if (!canManage) {
        return (
            <div className="min-h-screen bg-gray-50 p-6">
                <Card className="max-w-md mx-auto p-8 text-center">
                    <h2 className="text-xl font-semibold">Access Denied</h2>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-50 p-6">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <Link to={createPageUrl('NinjaPrograms')}>
                        <Button variant="ghost" size="sm" className="mb-2">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Programs
                        </Button>
                    </Link>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-3">
                        <Users className="w-6 h-6 text-purple-600" />
                        {currentProgram ? currentProgram.name : 'All Applicants'}
                    </h1>
                    <p className="text-gray-600 mt-1">
                        {filteredApplicants.length} applicants
                    </p>
                </div>

                {/* Filters */}
                <Card className="mb-6">
                    <CardContent className="pt-4">
                        <div className="flex flex-wrap gap-3">
                            <div className="flex-1 min-w-[200px]">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <Input
                                        placeholder="Search by name or email..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>
                            </div>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-40">
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Status</SelectItem>
                                    {Object.entries(statusConfig).map(([key, val]) => (
                                        <SelectItem key={key} value={key}>{val.label}</SelectItem>
                                    ))}
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
                    </CardContent>
                </Card>

                {/* Stats Row */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
                    {['applied', 'under_review', 'accepted', 'graduated', 'rejected'].map(status => {
                        const count = filteredApplicants.filter(a => a.status === status).length;
                        const config = statusConfig[status];
                        return (
                            <Card 
                                key={status} 
                                className={`cursor-pointer hover:shadow-md transition-shadow ${statusFilter === status ? 'ring-2 ring-purple-500' : ''}`}
                                onClick={() => setStatusFilter(statusFilter === status ? 'all' : status)}
                            >
                                <CardContent className="pt-4 text-center">
                                    <div className="text-2xl font-bold">{count}</div>
                                    <div className="text-xs text-gray-600">{config.label}</div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>

                {/* Applicants List */}
                {isLoading ? (
                    <div className="text-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin mx-auto text-purple-600" />
                    </div>
                ) : filteredApplicants.length === 0 ? (
                    <Card>
                        <CardContent className="py-12 text-center">
                            <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-600">No applicants found</p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-3">
                        {filteredApplicants.map(applicant => (
                            <ApplicantCard
                                key={applicant.id}
                                applicant={applicant}
                                programName={getProgramName(applicant.program_id)}
                                onClick={() => setSelectedApplicant(applicant)}
                            />
                        ))}
                    </div>
                )}

                {/* Detail Dialog */}
                <ApplicantDetailDialog
                    applicant={selectedApplicant}
                    onClose={() => setSelectedApplicant(null)}
                    programs={programs}
                    quizzes={quizzes}
                />
            </div>
        </div>
    );
}

function ApplicantCard({ applicant, programName, onClick }) {
    const status = statusConfig[applicant.status] || statusConfig.applied;

    return (
        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={onClick}>
            <CardContent className="p-4">
                <div className="flex items-center justify-between">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-gray-900">{applicant.full_name}</span>
                            <Badge className={status.color}>{status.label}</Badge>
                            {applicant.rating && (
                                <Badge variant="outline" className="text-amber-600">
                                    <Star className="w-3 h-3 mr-1 fill-amber-400" />
                                    {applicant.rating}
                                </Badge>
                            )}
                        </div>
                        <div className="text-sm text-gray-600">{applicant.email}</div>
                        <div className="text-xs text-gray-400 mt-1">{programName}</div>
                    </div>
                    <div className="flex items-center gap-2">
                        {applicant.cv_url && (
                            <Badge variant="outline" className="text-xs">
                                <FileText className="w-3 h-3 mr-1" />
                                CV
                            </Badge>
                        )}
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

function ApplicantDetailDialog({ applicant, onClose, programs, quizzes }) {
    const queryClient = useQueryClient();
    const [notes, setNotes] = useState('');
    const [newStatus, setNewStatus] = useState('');

    React.useEffect(() => {
        if (applicant) {
            setNotes(applicant.admin_notes || '');
            setNewStatus(applicant.status);
        }
    }, [applicant]);

    const updateMutation = useMutation({
        mutationFn: async (data) => {
            await base44.entities.NinjaApplicant.update(applicant.id, data);
            
            // If status changed to quiz_assigned, auto-assign quizzes
            if (data.status === 'quiz_assigned' && applicant.status !== 'quiz_assigned') {
                try {
                    await base44.functions.invoke('assignNinjaQuizzes', { applicant_id: applicant.id });
                    toast.success('Quizzes auto-assigned!');
                } catch (e) {
                    console.error('Failed to auto-assign quizzes:', e);
                }
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['ninjaApplicants'] });
            toast.success('Applicant updated');
        },
    });

    const graduateMutation = useMutation({
        mutationFn: async () => {
            // Update applicant status
            await base44.entities.NinjaApplicant.update(applicant.id, {
                status: 'graduated',
                graduation_date: new Date().toISOString().split('T')[0],
            });

            // Check if freelancer exists
            const existingFreelancers = await base44.entities.Freelancer.filter({ email: applicant.email });
            const program = programs.find(p => p.id === applicant.program_id);

            if (existingFreelancers.length > 0) {
                // Update existing freelancer
                await base44.entities.Freelancer.update(existingFreelancers[0].id, {
                    is_ninja: true,
                    ninja_program_id: applicant.program_id,
                    ninja_program_type: program?.program_type,
                    ninja_graduation_date: new Date().toISOString().split('T')[0],
                });
            } else {
                // Create new freelancer
                await base44.entities.Freelancer.create({
                    full_name: applicant.full_name,
                    email: applicant.email,
                    phone: applicant.phone,
                    location: applicant.location,
                    education: applicant.education,
                    language_pairs: applicant.language_pairs,
                    cv_file_url: applicant.cv_url,
                    status: 'Approved',
                    is_ninja: true,
                    ninja_program_id: applicant.program_id,
                    ninja_program_type: program?.program_type,
                    ninja_graduation_date: new Date().toISOString().split('T')[0],
                });
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['ninjaApplicants'] });
            queryClient.invalidateQueries({ queryKey: ['freelancers'] });
            toast.success('Applicant graduated and added to freelancers!');
            onClose();
        },
    });

    if (!applicant) return null;

    const status = statusConfig[applicant.status] || statusConfig.applied;
    const program = programs.find(p => p.id === applicant.program_id);

    return (
        <Dialog open={!!applicant} onOpenChange={() => onClose()}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-center gap-2">
                        <Badge className={status.color}>{status.label}</Badge>
                        {applicant.rating && (
                            <Badge variant="outline" className="text-amber-600">
                                <Star className="w-3 h-3 mr-1 fill-amber-400" />
                                {applicant.rating}/5
                            </Badge>
                        )}
                    </div>
                    <DialogTitle className="text-xl">{applicant.full_name}</DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Contact Info */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center gap-2 text-sm">
                            <Mail className="w-4 h-4 text-gray-400" />
                            <a href={`mailto:${applicant.email}`} className="text-blue-600 hover:underline">
                                {applicant.email}
                            </a>
                        </div>
                        {applicant.phone && (
                            <div className="flex items-center gap-2 text-sm">
                                <Phone className="w-4 h-4 text-gray-400" />
                                {applicant.phone}
                            </div>
                        )}
                        {applicant.location && (
                            <div className="flex items-center gap-2 text-sm">
                                <MapPin className="w-4 h-4 text-gray-400" />
                                {applicant.location}
                            </div>
                        )}
                        <div className="flex items-center gap-2 text-sm">
                            <GraduationCap className="w-4 h-4 text-gray-400" />
                            {program?.name || 'Unknown Program'}
                        </div>
                    </div>

                    {/* Education & Experience */}
                    {(applicant.education || applicant.experience_level) && (
                        <div className="p-4 bg-gray-50 rounded-lg">
                            <h4 className="font-medium mb-2">Background</h4>
                            {applicant.education && <p className="text-sm text-gray-600">{applicant.education}</p>}
                            {applicant.experience_level && (
                                <Badge variant="outline" className="mt-2">
                                    {applicant.experience_level.replace('_', ' ')}
                                </Badge>
                            )}
                        </div>
                    )}

                    {/* Language Pairs */}
                    {applicant.language_pairs?.length > 0 && (
                        <div>
                            <h4 className="font-medium mb-2">Language Pairs</h4>
                            <div className="flex flex-wrap gap-2">
                                {applicant.language_pairs.map((pair, idx) => (
                                    <Badge key={idx} variant="secondary">
                                        {pair.source_language} → {pair.target_language}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Motivation */}
                    {applicant.motivation && (
                        <div>
                            <h4 className="font-medium mb-2">Motivation</h4>
                            <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                                {applicant.motivation}
                            </p>
                        </div>
                    )}

                    {/* CV */}
                    {applicant.cv_url && (
                        <div>
                            <a href={applicant.cv_url} target="_blank" rel="noopener noreferrer">
                                <Button variant="outline" size="sm">
                                    <FileText className="w-4 h-4 mr-2" />
                                    View CV
                                </Button>
                            </a>
                        </div>
                    )}

                    {/* Quiz Scores */}
                    {applicant.quiz_scores?.length > 0 && (
                        <div>
                            <h4 className="font-medium mb-2">Quiz Results</h4>
                            <div className="space-y-2">
                                {applicant.quiz_scores.map((score, idx) => {
                                    const quiz = quizzes.find(q => q.id === score.quiz_id);
                                    return (
                                        <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                            <span className="text-sm">{quiz?.title || 'Quiz'}</span>
                                            <div className="flex items-center gap-2">
                                                <span className={`font-semibold ${score.passed ? 'text-green-600' : 'text-red-600'}`}>
                                                    {score.score}%
                                                </span>
                                                {score.passed ? (
                                                    <CheckCircle className="w-4 h-4 text-green-600" />
                                                ) : (
                                                    <XCircle className="w-4 h-4 text-red-600" />
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Admin Notes */}
                    <div>
                        <h4 className="font-medium mb-2">Admin Notes</h4>
                        <Textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Internal notes about this applicant..."
                            rows={3}
                        />
                    </div>

                    {/* Status Change */}
                    <div className="flex items-center gap-4">
                        <div className="flex-1">
                            <label className="text-sm font-medium">Change Status</label>
                            <Select value={newStatus} onValueChange={setNewStatus}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.entries(statusConfig).map(([key, val]) => (
                                        <SelectItem key={key} value={key}>{val.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-between pt-4 border-t">
                        <div className="flex gap-2">
                            {applicant.status === 'accepted' && (
                                <Button
                                    onClick={() => graduateMutation.mutate()}
                                    disabled={graduateMutation.isPending}
                                    className="bg-amber-600 hover:bg-amber-700"
                                >
                                    <Award className="w-4 h-4 mr-2" />
                                    Graduate & Add to Freelancers
                                </Button>
                            )}
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={onClose}>Close</Button>
                            <Button
                                onClick={() => updateMutation.mutate({ 
                                    admin_notes: notes,
                                    status: newStatus 
                                })}
                                disabled={updateMutation.isPending}
                                className="bg-purple-600 hover:bg-purple-700"
                            >
                                Save Changes
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}