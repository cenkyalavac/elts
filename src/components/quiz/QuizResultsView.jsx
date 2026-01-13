import React from 'react';
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, AlertCircle, Calendar } from "lucide-react";

export default function QuizResultsView({ freelancerId }) {
    const { data: quizAttempts = [], isLoading } = useQuery({
        queryKey: ['quizResults', freelancerId],
        queryFn: () => base44.entities.QuizAttempt.filter({ freelancer_id: freelancerId }),
    });

    const sortedAttempts = [...quizAttempts].sort((a, b) => 
        new Date(b.created_date) - new Date(a.created_date)
    );

    if (isLoading) {
        return <div className="text-center py-8 text-gray-500">Loading quiz results...</div>;
    }

    if (sortedAttempts.length === 0) {
        return (
            <Card className="border-0 shadow-sm">
                <CardContent className="pt-12 pb-8 text-center">
                    <AlertCircle className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-600 font-medium">No quiz attempts yet</p>
                    <p className="text-sm text-gray-500 mt-1">Complete quizzes to see your results here</p>
                </CardContent>
            </Card>
        );
    }

    const bestScore = Math.max(...sortedAttempts.map(q => q.percentage || 0));
    const averageScore = Math.round(
        sortedAttempts.reduce((sum, q) => sum + (q.percentage || 0), 0) / sortedAttempts.length
    );

    return (
        <div className="space-y-6">
            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border-0 shadow-sm">
                    <CardContent className="pt-6">
                        <div className="text-sm text-gray-600 mb-2">Total Attempts</div>
                        <div className="text-3xl font-bold text-blue-600">{sortedAttempts.length}</div>
                    </CardContent>
                </Card>
                <Card className="border-0 shadow-sm">
                    <CardContent className="pt-6">
                        <div className="text-sm text-gray-600 mb-2">Best Score</div>
                        <div className="text-3xl font-bold text-green-600">{bestScore}%</div>
                    </CardContent>
                </Card>
                <Card className="border-0 shadow-sm">
                    <CardContent className="pt-6">
                        <div className="text-sm text-gray-600 mb-2">Average Score</div>
                        <div className="text-3xl font-bold text-purple-600">{averageScore}%</div>
                    </CardContent>
                </Card>
            </div>

            {/* Attempts List */}
            <div className="space-y-4">
                {sortedAttempts.map((attempt, idx) => (
                    <Card key={attempt.id} className="border-0 shadow-sm">
                        <CardContent className="pt-6">
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <h4 className="font-semibold text-lg text-gray-900">Quiz Attempt #{sortedAttempts.length - idx}</h4>
                                    <div className="flex items-center gap-2 mt-1 text-sm text-gray-600">
                                        <Calendar className="w-4 h-4" />
                                        {new Date(attempt.created_date).toLocaleDateString('en-US', { 
                                            year: 'numeric', 
                                            month: 'long', 
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </div>
                                </div>
                                <Badge className={attempt.passed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                                    {attempt.passed ? 'Passed' : 'Not Passed'}
                                </Badge>
                            </div>

                            <div className="space-y-3">
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="font-medium text-gray-700">Score</span>
                                        <span className="text-2xl font-bold text-blue-600">{attempt.percentage}%</span>
                                    </div>
                                    <Progress value={attempt.percentage} className="h-2" />
                                    <div className="text-xs text-gray-500 mt-1">
                                        {attempt.score} of {attempt.total_possible} points
                                    </div>
                                </div>

                                {attempt.time_taken_minutes && (
                                    <div className="text-sm text-gray-600">
                                        Time taken: <span className="font-medium">{attempt.time_taken_minutes} minutes</span>
                                    </div>
                                )}

                                {attempt.reviewer_notes && (
                                    <div className="bg-blue-50 p-3 rounded-lg">
                                        <div className="text-xs font-medium text-blue-900 mb-1">Reviewer Feedback</div>
                                        <p className="text-sm text-blue-800">{attempt.reviewer_notes}</p>
                                    </div>
                                )}

                                {attempt.answers && attempt.answers.length > 0 && (
                                    <div className="text-sm text-gray-600">
                                        <span className="font-medium">{attempt.answers.filter(a => a.is_correct).length}</span> of <span className="font-medium">{attempt.answers.length}</span> questions correct
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}