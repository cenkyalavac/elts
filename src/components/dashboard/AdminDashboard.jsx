import React from 'react';
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
    TrendingUp, Clock, AlertCircle, CheckCircle2, Users, 
    Zap, Calendar, FileText, Award 
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../../utils";
import { formatDistanceToNow, isPast } from "date-fns";

export default function AdminDashboard() {
    const { data: freelancers = [] } = useQuery({
        queryKey: ['freelancers'],
        queryFn: () => base44.entities.Freelancer.list('-created_date'),
    });

    const { data: quizAssignments = [] } = useQuery({
        queryKey: ['allQuizAssignments'],
        queryFn: () => base44.entities.QuizAssignment.list(),
    });

    const { data: quizAttempts = [] } = useQuery({
        queryKey: ['allQuizAttempts'],
        queryFn: () => base44.entities.QuizAttempt.list(),
    });

    // Calculate metrics
    const stats = {
        totalFreelancers: freelancers.length,
        newApplications: freelancers.filter(f => f.status === 'New Application').length,
        approved: freelancers.filter(f => f.status === 'Approved').length,
        pendingQuizzes: quizAssignments.filter(a => a.status === 'pending').length,
        completedQuizzes: quizAssignments.filter(a => a.status === 'completed').length,
        overdueQuizzes: quizAssignments.filter(a => 
            a.status !== 'completed' && a.deadline && isPast(new Date(a.deadline))
        ).length,
        avgQuizScore: quizAttempts.length > 0 
            ? Math.round(quizAttempts.reduce((sum, a) => sum + a.percentage, 0) / quizAttempts.length)
            : 0,
    };

    const pendingAssignments = quizAssignments
        .filter(a => a.status === 'pending')
        .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
        .slice(0, 5);

    const urgentItems = [
        ...quizAssignments.filter(a => 
            a.status !== 'completed' && a.deadline && 
            isPast(new Date(a.deadline))
        ).map(a => ({
            type: 'overdue_quiz',
            id: a.id,
            description: `Quiz assignment overdue`,
            severity: 'high',
            freelancerId: a.freelancer_id,
            createdDate: a.created_date
        })),
        ...freelancers.filter(f => 
            f.status === 'New Application' && 
            f.follow_up_date && 
            isPast(new Date(f.follow_up_date))
        ).map(f => ({
            type: 'follow_up_due',
            id: f.id,
            description: `Follow-up due for ${f.full_name}`,
            severity: 'medium',
            freelancerId: f.id,
            createdDate: f.follow_up_date
        }))
    ].sort((a, b) => new Date(b.createdDate) - new Date(a.createdDate)).slice(0, 6);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-1">Admin Dashboard</h2>
                <p className="text-gray-600">Overview of applications, assignments, and performance metrics</p>
            </div>

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            Total Freelancers
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{stats.totalFreelancers}</div>
                        <div className="text-xs text-gray-500 mt-1">
                            {stats.newApplications} new, {stats.approved} approved
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                            <Award className="w-4 h-4" />
                            Quiz Assignments
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{stats.pendingQuizzes + stats.completedQuizzes}</div>
                        <div className="text-xs text-gray-500 mt-1">
                            {stats.completedQuizzes} completed
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                            <AlertCircle className="w-4 h-4" />
                            Overdue
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className={`text-3xl font-bold ${stats.overdueQuizzes > 0 ? 'text-red-600' : 'text-green-600'}`}>
                            {stats.overdueQuizzes}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">quiz assignments</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                            <TrendingUp className="w-4 h-4" />
                            Avg Quiz Score
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-blue-600">{stats.avgQuizScore}%</div>
                        <div className="text-xs text-gray-500 mt-1">
                            {quizAttempts.length} attempts
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Urgent Items */}
                <Card className="lg:col-span-1">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <AlertCircle className="w-5 h-5 text-red-600" />
                            Urgent Items ({urgentItems.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 max-h-96 overflow-y-auto">
                        {urgentItems.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-green-500" />
                                <p className="text-sm">All caught up!</p>
                            </div>
                        ) : (
                            urgentItems.map(item => (
                                <div key={`${item.type}-${item.id}`} className={`p-3 rounded-lg border ${
                                    item.severity === 'high' ? 'bg-red-50 border-red-200' :
                                    'bg-yellow-50 border-yellow-200'
                                }`}>
                                    <div className="flex items-start gap-2">
                                        <AlertCircle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
                                            item.severity === 'high' ? 'text-red-600' : 'text-yellow-600'
                                        }`} />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-900">{item.description}</p>
                                            <p className="text-xs text-gray-600 mt-1">
                                                {formatDistanceToNow(new Date(item.createdDate), { addSuffix: true })}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </CardContent>
                </Card>

                {/* Pending Quizzes */}
                <Card className="lg:col-span-2">
                    <CardHeader className="flex items-center justify-between">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Clock className="w-5 h-5" />
                            Pending Quiz Assignments
                        </CardTitle>
                        <Link to={createPageUrl('Freelancers')}>
                            <Button size="sm" variant="outline">View All</Button>
                        </Link>
                    </CardHeader>
                    <CardContent>
                        {pendingAssignments.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-green-500" />
                                <p className="text-sm">No pending assignments</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {pendingAssignments.map(assignment => {
                                    const freelancer = freelancers.find(f => f.id === assignment.freelancer_id);
                                    const daysLeft = assignment.deadline 
                                        ? Math.ceil((new Date(assignment.deadline) - new Date()) / (1000 * 60 * 60 * 24))
                                        : null;

                                    return (
                                        <div key={assignment.id} className="flex items-start justify-between p-3 border rounded-lg hover:bg-gray-50 transition">
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-900 truncate">
                                                    {freelancer?.full_name || 'Unknown'}
                                                </p>
                                                <p className="text-xs text-gray-600 mt-0.5">
                                                    {assignment.notes || 'No notes'}
                                                </p>
                                            </div>
                                            <div className="text-right ml-3 flex-shrink-0">
                                                {daysLeft !== null && (
                                                    <Badge className={daysLeft <= 0 ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}>
                                                        {daysLeft <= 0 ? 'Overdue' : `${daysLeft}d left`}
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Quick Actions */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Zap className="w-5 h-5" />
                        Quick Actions
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                        <Link to={createPageUrl('Freelancers')}>
                            <Button variant="outline" className="w-full justify-start">
                                <Users className="w-4 h-4 mr-2" />
                                Manage Freelancers
                            </Button>
                        </Link>
                        <Link to={createPageUrl('QuizManagement')}>
                            <Button variant="outline" className="w-full justify-start">
                                <Award className="w-4 h-4 mr-2" />
                                Quiz Management
                            </Button>
                        </Link>
                        <Link to={createPageUrl('TeamAvailability')}>
                            <Button variant="outline" className="w-full justify-start">
                                <Calendar className="w-4 h-4 mr-2" />
                                Team Availability
                            </Button>
                        </Link>
                        <Link to={createPageUrl('Analytics')}>
                            <Button variant="outline" className="w-full justify-start">
                                <TrendingUp className="w-4 h-4 mr-2" />
                                View Analytics
                            </Button>
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}