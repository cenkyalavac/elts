import React from 'react';
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Clock, Award } from "lucide-react";
import QuizPerformanceSummary from "./QuizPerformanceSummary";

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

    return (
        <div className="space-y-4">
            <QuizPerformanceSummary attempts={attempts} quizzes={quizzes} />
            {attempts.length > 0 && (
                <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">Attempt History</h3>
                    <div className="space-y-3">
                        {attempts.map(attempt => {
                            const quiz = quizzes.find(q => q.id === attempt.quiz_id);
                            return (
                                <Card key={attempt.id} className="hover:shadow-md transition-shadow">
                                    <CardContent className="py-4">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <h4 className="font-medium text-gray-900 truncate">{quiz?.title || 'Quiz'}</h4>
                                                    {attempt.passed !== null && (
                                                        <Badge variant="outline" className={
                                                            attempt.passed 
                                                                ? 'border-green-500 text-green-700 bg-green-50' 
                                                                : 'border-red-500 text-red-700 bg-red-50'
                                                        }>
                                                            {attempt.passed ? (
                                                                <><CheckCircle className="w-3 h-3 mr-1" />Pass</>
                                                            ) : (
                                                                <><XCircle className="w-3 h-3 mr-1" />Fail</>
                                                            )}
                                                        </Badge>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-3 text-xs text-gray-600">
                                                    <span>{new Date(attempt.created_date).toLocaleDateString()}</span>
                                                    {attempt.time_taken_minutes && (
                                                        <>
                                                            <span>•</span>
                                                            <span className="flex items-center gap-1">
                                                                <Clock className="w-3 h-3" />
                                                                {attempt.time_taken_minutes}m
                                                            </span>
                                                        </>
                                                    )}
                                                    <span>•</span>
                                                    <span>{attempt.score}/{attempt.total_possible} pts</span>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className={`text-xl font-bold ${
                                                    attempt.passed ? 'text-green-600' : 
                                                    attempt.passed === false ? 'text-red-600' : 'text-gray-600'
                                                }`}>
                                                    {attempt.percentage}%
                                                </div>
                                            </div>
                                        </div>
                                        {attempt.reviewer_notes && (
                                            <div className="mt-3 pt-3 border-t">
                                                <p className="text-xs font-medium text-gray-700 mb-1">Reviewer Notes</p>
                                                <p className="text-sm text-gray-600">{attempt.reviewer_notes}</p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}