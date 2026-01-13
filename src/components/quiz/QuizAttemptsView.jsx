import React from 'react';
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Clock, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createPageUrl } from "../../utils";

export default function QuizAttemptsView({ freelancerId }) {
    const { data: attempts = [], isLoading } = useQuery({
        queryKey: ['quizAttempts', freelancerId],
        queryFn: () => base44.entities.QuizAttempt.filter({ freelancer_id: freelancerId }, '-created_date'),
    });

    const { data: quizzes = [] } = useQuery({
        queryKey: ['quizzes'],
        queryFn: () => base44.entities.Quiz.list(),
    });

    if (isLoading) {
        return <div className="text-center py-4">Loading quiz attempts...</div>;
    }

    if (attempts.length === 0) {
        return (
            <Card>
                <CardContent className="py-8 text-center text-gray-500">
                    <Award className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p>No quiz attempts yet</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            {attempts.map(attempt => {
                const quiz = quizzes.find(q => q.id === attempt.quiz_id);
                return (
                    <Card key={attempt.id} className="border-l-4" style={{
                        borderLeftColor: attempt.passed ? '#10b981' : attempt.passed === false ? '#ef4444' : '#6366f1'
                    }}>
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle className="text-lg">{quiz?.title || 'Quiz'}</CardTitle>
                                    <p className="text-sm text-gray-600 mt-1">
                                        {new Date(attempt.created_date).toLocaleDateString()} at {new Date(attempt.created_date).toLocaleTimeString()}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <div className="text-2xl font-bold text-blue-600">
                                        {attempt.percentage}%
                                    </div>
                                    <div className="text-xs text-gray-600">
                                        {attempt.score}/{attempt.total_possible} pts
                                    </div>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-wrap gap-2 items-center">
                                {attempt.passed !== null && (
                                    <Badge className={attempt.passed ? 'bg-green-500' : 'bg-red-500'}>
                                        {attempt.passed ? (
                                            <>
                                                <CheckCircle className="w-3 h-3 mr-1" />
                                                PASSED
                                            </>
                                        ) : (
                                            <>
                                                <XCircle className="w-3 h-3 mr-1" />
                                                FAILED
                                            </>
                                        )}
                                    </Badge>
                                )}
                                {attempt.time_taken_minutes && (
                                    <Badge variant="outline">
                                        <Clock className="w-3 h-3 mr-1" />
                                        {attempt.time_taken_minutes} min
                                    </Badge>
                                )}
                                <Badge variant="outline" className={
                                    attempt.status === 'reviewed' ? 'bg-purple-50' : ''
                                }>
                                    {attempt.status}
                                </Badge>
                            </div>
                            {attempt.reviewer_notes && (
                                <div className="mt-3 bg-gray-50 border rounded-lg p-3">
                                    <p className="text-sm font-medium mb-1">Reviewer Notes:</p>
                                    <p className="text-sm text-gray-700">{attempt.reviewer_notes}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}