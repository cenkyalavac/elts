import React, { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "../../utils";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { CheckCircle2, FileText, Briefcase, Star, Languages, TrendingUp, Eye, AlertTriangle, PenLine, ClipboardList, UserCog, CalendarIcon, Loader2 } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

// Constants to avoid magic strings
const AVAILABILITY_STATUS = {
    AVAILABLE: 'available',
    UNAVAILABLE: 'unavailable',
    PARTIALLY_AVAILABLE: 'partially_available'
};

const SIGNATURE_STATUS = {
    PENDING: 'pending',
    ESIGN_PENDING: 'esign_pending',
    SIGNED: 'signed'
};

const QUIZ_ASSIGNMENT_STATUS = {
    PENDING: 'pending',
    IN_PROGRESS: 'in_progress',
    COMPLETED: 'completed'
};

const FREELANCER_STATUS_COLORS = {
    'Approved': 'bg-green-100 text-green-800',
    'Test Sent': 'bg-indigo-100 text-indigo-800',
    'Price Negotiation': 'bg-yellow-100 text-yellow-800',
    'Form Sent': 'bg-purple-100 text-purple-800',
    'New Application': 'bg-blue-100 text-blue-800',
    'On Hold': 'bg-gray-100 text-gray-800',
    'Rejected': 'bg-red-100 text-red-800',
};

export default function FreelancerDashboard({ freelancer }) {
    const queryClient = useQueryClient();
    const [busyDialogOpen, setBusyDialogOpen] = useState(false);
    const [busyUntilDate, setBusyUntilDate] = useState(null);

    const { data: quizAttempts = [] } = useQuery({
        queryKey: ['quizAttempts', freelancer.id],
        queryFn: () => base44.entities.QuizAttempt.filter({ freelancer_id: freelancer.id }),
    });

    const { data: jobs = [] } = useQuery({
        queryKey: ['jobOffers'],
        queryFn: () => base44.entities.Job.list(),
    });

    const { data: qualityReports = [] } = useQuery({
        queryKey: ['qualityReports', freelancer.id],
        queryFn: () => base44.entities.QualityReport.filter({ 
            freelancer_id: freelancer.id, 
            status: 'finalized' 
        }),
    });

    const { data: documentSignatures = [] } = useQuery({
        queryKey: ['documentSignatures', freelancer.id],
        queryFn: () => base44.entities.DocumentSignature.filter({ freelancer_id: freelancer.id }),
    });

    const { data: quizAssignments = [] } = useQuery({
        queryKey: ['quizAssignments', freelancer.id],
        queryFn: () => base44.entities.QuizAssignment.filter({ freelancer_id: freelancer.id }),
    });

    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const { data: todayAvailability } = useQuery({
        queryKey: ['availability', freelancer.id, todayStr],
        queryFn: async () => {
            const records = await base44.entities.Availability.filter({ 
                freelancer_id: freelancer.id, 
                date: todayStr 
            });
            return records[0] || null;
        },
    });

    const isCurrentlyAvailable = !todayAvailability || todayAvailability.status === AVAILABILITY_STATUS.AVAILABLE;

    const availabilityMutation = useMutation({
        mutationFn: async ({ status, untilDate, todayOnly }) => {
            const today = new Date();
            const datesToUpdate = [];
            
            if (todayOnly) {
                // Only update today's date (used when switching back to available)
                datesToUpdate.push(todayStr);
            } else {
                // Update from today to untilDate (used when setting busy)
                const endDate = untilDate || today;
                for (let d = new Date(today); d <= endDate; d.setDate(d.getDate() + 1)) {
                    datesToUpdate.push(format(new Date(d), 'yyyy-MM-dd'));
                }
            }

            for (const dateStr of datesToUpdate) {
                const existing = await base44.entities.Availability.filter({
                    freelancer_id: freelancer.id,
                    date: dateStr
                });
                
                if (existing.length > 0) {
                    await base44.entities.Availability.update(existing[0].id, { status });
                } else {
                    await base44.entities.Availability.create({
                        freelancer_id: freelancer.id,
                        date: dateStr,
                        status
                    });
                }
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['availability', freelancer.id] });
            setBusyDialogOpen(false);
            setBusyUntilDate(null);
        }
    });

    const handleAvailabilityToggle = (checked) => {
        if (!checked) {
            setBusyDialogOpen(true);
        } else {
            // Only update today when switching back to available
            availabilityMutation.mutate({ status: AVAILABILITY_STATUS.AVAILABLE, todayOnly: true });
        }
    };

    const handleConfirmBusy = () => {
        availabilityMutation.mutate({ status: AVAILABILITY_STATUS.UNAVAILABLE, untilDate: busyUntilDate });
    };

    const actionItems = useMemo(() => {
        const items = [];
        
        // Check for pending documents
        const pendingDocs = documentSignatures.filter(d => 
            d.status === SIGNATURE_STATUS.PENDING || d.status === SIGNATURE_STATUS.ESIGN_PENDING
        );
        if (pendingDocs.length > 0) {
            items.push({
                type: 'documents',
                icon: PenLine,
                title: 'Documents Awaiting Signature',
                description: `${pendingDocs.length} document${pendingDocs.length > 1 ? 's' : ''} need${pendingDocs.length === 1 ? 's' : ''} your signature`,
                buttonText: 'Sign Now',
                link: createPageUrl('MyApplication') + '?tab=documents',
                color: 'text-orange-600 bg-orange-50 border-orange-200'
            });
        }

        // Check for pending quizzes
        const pendingQuizzes = quizAssignments.filter(q => q.status === QUIZ_ASSIGNMENT_STATUS.PENDING);
        if (pendingQuizzes.length > 0) {
            items.push({
                type: 'quizzes',
                icon: ClipboardList,
                title: 'Pending Quizzes',
                description: `${pendingQuizzes.length} quiz${pendingQuizzes.length > 1 ? 'zes' : ''} assigned to you`,
                buttonText: 'Take Quiz',
                link: createPageUrl('MyApplication') + '?tab=quizzes',
                color: 'text-blue-600 bg-blue-50 border-blue-200'
            });
        }

        // Check for profile update needed (older than 6 months)
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        const lastUpdate = new Date(freelancer.updated_date || freelancer.created_date);
        if (lastUpdate < sixMonthsAgo) {
            items.push({
                type: 'profile',
                icon: UserCog,
                title: 'Profile Update Needed',
                description: 'Please review and update your CV, rates, and availability',
                buttonText: 'Update Profile',
                link: createPageUrl('MyApplication') + '?tab=profile',
                color: 'text-purple-600 bg-purple-50 border-purple-200'
            });
        }

        return items;
    }, [documentSignatures, quizAssignments, freelancer]);

    const performanceStats = useMemo(() => {
        const lqaScores = qualityReports.filter(r => r.lqa_score != null).map(r => r.lqa_score);
        const qsScores = qualityReports.filter(r => r.qs_score != null).map(r => r.qs_score);
        
        const avgLqa = lqaScores.length > 0 
            ? (lqaScores.reduce((a, b) => a + b, 0) / lqaScores.length).toFixed(1)
            : null;
        const avgQs = qsScores.length > 0 
            ? (qsScores.reduce((a, b) => a + b, 0) / qsScores.length).toFixed(1)
            : null;

        const trendData = qualityReports
            .sort((a, b) => new Date(a.created_date) - new Date(b.created_date))
            .slice(-5)
            .map((r, idx) => ({
                name: `Job ${idx + 1}`,
                lqa: r.lqa_score,
                qs: r.qs_score ? r.qs_score * 20 : null,
            }));

        return { avgLqa, avgQs, trendData, totalReports: qualityReports.length };
    }, [qualityReports]);

    const completionPercentage = Math.round(
        ((freelancer.cv_file_url ? 1 : 0) + 
         (freelancer.nda ? 1 : 0) + 
         (freelancer.language_pairs?.length > 0 ? 1 : 0) + 
         (freelancer.rates?.length > 0 ? 1 : 0)) / 4 * 100
    );

    const bestQuizScore = quizAttempts.length > 0 
        ? Math.max(...quizAttempts.map(q => q.percentage || 0))
        : null;



    return (
        <div className="space-y-6">
            {/* Quick Availability Toggle */}
            <Card className="border-0 shadow-sm">
                <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full ${isCurrentlyAvailable ? 'bg-green-500' : 'bg-red-500'}`} />
                            <div>
                                <div className="font-medium">Current Status</div>
                                <div className="text-sm text-gray-500">
                                    {isCurrentlyAvailable ? 'Available for work' : 'Marked as busy'}
                                    {todayAvailability?.notes && ` - ${todayAvailability.notes}`}
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className={`text-sm font-medium ${isCurrentlyAvailable ? 'text-green-600' : 'text-red-600'}`}>
                                {isCurrentlyAvailable ? 'Available' : 'Busy'}
                            </span>
                            <Switch 
                                checked={isCurrentlyAvailable}
                                onCheckedChange={handleAvailabilityToggle}
                                disabled={availabilityMutation.isPending}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Busy Until Dialog */}
            <Dialog open={busyDialogOpen} onOpenChange={setBusyDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Set Unavailability Period</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="text-sm text-gray-600">
                            Until when will you be unavailable?
                        </div>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className="w-full justify-start text-left font-normal">
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {busyUntilDate ? format(busyUntilDate, 'PPP') : 'Select end date'}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    mode="single"
                                    selected={busyUntilDate}
                                    onSelect={setBusyUntilDate}
                                    disabled={(date) => date < new Date()}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                        <p className="text-xs text-gray-500">
                            Times are in your local timezone ({Intl.DateTimeFormat().resolvedOptions().timeZone})
                        </p>
                    </div>
                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setBusyDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button 
                            onClick={handleConfirmBusy}
                            disabled={availabilityMutation.isPending}
                        >
                            {availabilityMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            {busyUntilDate ? 'Set as Busy' : 'Mark Busy Today Only'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Action Required */}
            {actionItems.length > 0 && (
                <Card className="border-2 border-amber-300 bg-amber-50">
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-amber-800">
                            <AlertTriangle className="w-5 h-5" />
                            Action Required
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {actionItems.map((item) => (
                            <div 
                                key={item.type} 
                                className={`flex items-center justify-between p-3 rounded-lg border ${item.color}`}
                            >
                                <div className="flex items-center gap-3">
                                    <item.icon className="w-5 h-5" />
                                    <div>
                                        <div className="font-medium">{item.title}</div>
                                        <div className="text-sm opacity-80">{item.description}</div>
                                    </div>
                                </div>
                                <Link to={item.link}>
                                    <Button size="sm" variant="outline" className="shrink-0">
                                        {item.buttonText}
                                    </Button>
                                </Link>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            )}

            {/* Key Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="border-0 shadow-sm">
                    <CardContent className="pt-6">
                        <div className="text-sm text-gray-600 mb-2">Status</div>
                        <Badge className={FREELANCER_STATUS_COLORS[freelancer.status] || 'bg-gray-100 text-gray-800'}>
                            {freelancer.status}
                        </Badge>
                    </CardContent>
                </Card>
                <Card className="border-0 shadow-sm">
                    <CardContent className="pt-6">
                        <div className="text-sm text-gray-600 mb-2">Languages</div>
                        <div className="text-2xl font-bold text-blue-600">{freelancer.language_pairs?.length || 0}</div>
                    </CardContent>
                </Card>
                <Card className="border-0 shadow-sm">
                    <CardContent className="pt-6">
                        <div className="text-sm text-gray-600 mb-2">Experience</div>
                        <div className="text-2xl font-bold text-purple-600">{freelancer.experience_years || 0}y</div>
                    </CardContent>
                </Card>
                <Card className="border-0 shadow-sm">
                    <CardContent className="pt-6">
                        <div className="text-sm text-gray-600 mb-2">Matching Jobs</div>
                        <div className="text-2xl font-bold text-green-600">{jobs.length}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Profile Completion */}
            <Card className="border-0 shadow-sm">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                        Profile Completion
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium">{completionPercentage}% Complete</span>
                            <span className="text-xs text-gray-500">{Math.round(completionPercentage / 25)} of 4 sections</span>
                        </div>
                        <Progress value={completionPercentage} className="h-2" />
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        <div className="flex items-center gap-2">
                            {freelancer.cv_file_url ? (
                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                            ) : (
                                <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
                            )}
                            <span>CV</span>
                        </div>
                        <div className="flex items-center gap-2">
                            {freelancer.nda ? (
                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                            ) : (
                                <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
                            )}
                            <span>NDA</span>
                        </div>
                        <div className="flex items-center gap-2">
                            {freelancer.language_pairs?.length > 0 ? (
                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                            ) : (
                                <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
                            )}
                            <span>Languages</span>
                        </div>
                        <div className="flex items-center gap-2">
                            {freelancer.rates?.length > 0 ? (
                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                            ) : (
                                <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
                            )}
                            <span>Rates</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* My Performance */}
            {performanceStats.totalReports > 0 && (
                <Card className="border-0 shadow-sm">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-green-600" />
                                My Performance
                            </CardTitle>
                            <Link to={createPageUrl('QualityManagement') + `?freelancer_id=${freelancer.id}`}>
                                <Button variant="outline" size="sm" className="gap-2">
                                    <Eye className="w-4 h-4" />
                                    View My Reports
                                </Button>
                            </Link>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="text-center p-4 bg-blue-50 rounded-lg">
                                <div className="text-sm text-gray-600 mb-1">Avg LQA Score</div>
                                <div className={`text-3xl font-bold ${
                                    performanceStats.avgLqa >= 90 ? 'text-green-600' :
                                    performanceStats.avgLqa >= 70 ? 'text-yellow-600' :
                                    'text-red-600'
                                }`}>
                                    {performanceStats.avgLqa || '-'}
                                </div>
                            </div>
                            <div className="text-center p-4 bg-yellow-50 rounded-lg">
                                <div className="text-sm text-gray-600 mb-1">Avg QS Score</div>
                                <div className="text-3xl font-bold text-yellow-600 flex items-center justify-center gap-1">
                                    <Star className="w-5 h-5 fill-yellow-500 text-yellow-500" />
                                    {performanceStats.avgQs || '-'}
                                </div>
                            </div>
                        </div>

                        {performanceStats.trendData.length >= 2 && (
                            <div>
                                <div className="text-sm font-medium text-gray-600 mb-2">Last {performanceStats.trendData.length} Jobs Trend</div>
                                <ResponsiveContainer width="100%" height={120}>
                                    <LineChart data={performanceStats.trendData}>
                                        <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                                        <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                                        <Tooltip />
                                        <Line 
                                            type="monotone" 
                                            dataKey="lqa" 
                                            stroke="#3b82f6" 
                                            strokeWidth={2}
                                            dot={{ fill: '#3b82f6' }}
                                            name="LQA"
                                        />
                                        <Line 
                                            type="monotone" 
                                            dataKey="qs" 
                                            stroke="#eab308" 
                                            strokeWidth={2}
                                            dot={{ fill: '#eab308' }}
                                            name="QS (scaled)"
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        )}

                        <div className="text-xs text-gray-500 text-center">
                            Based on {performanceStats.totalReports} finalized report{performanceStats.totalReports !== 1 ? 's' : ''}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Quiz Performance */}
            {quizAttempts.length > 0 && (
                <Card className="border-0 shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Star className="w-5 h-5 text-yellow-500" />
                            Quiz Performance
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium">Best Score</span>
                                <span className="text-2xl font-bold text-yellow-600">{bestQuizScore}%</span>
                            </div>
                            <div className="flex justify-between text-sm text-gray-600">
                                <span>Attempts</span>
                                <span>{quizAttempts.length}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Language & Service Summary */}
            {freelancer.language_pairs?.length > 0 && (
                <Card className="border-0 shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Languages className="w-5 h-5 text-blue-600" />
                            Language Pairs
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                            {freelancer.language_pairs.map((pair, idx) => (
                                <Badge key={idx} variant="outline" className="text-center py-1">
                                    {pair.source_language} → {pair.target_language}
                                </Badge>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Service Types */}
            {freelancer.service_types?.length > 0 && (
                <Card className="border-0 shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Briefcase className="w-5 h-5 text-purple-600" />
                            Service Types
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                            {freelancer.service_types.map((service, idx) => (
                                <Badge key={idx} variant="secondary" className="text-center">
                                    {service}
                                </Badge>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}