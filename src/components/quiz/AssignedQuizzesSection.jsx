import React, { useState } from 'react';
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../../utils";

export default function AssignedQuizzesSection({ freelancerId }) {
    const { data: assignments = [] } = useQuery({
        queryKey: ['quizAssignments', freelancerId],
        queryFn: () => base44.entities.QuizAssignment.filter({ freelancer_id: freelancerId }),
    });

    const { data: quizzes = [] } = useQuery({
        queryKey: ['quizzes'],
        queryFn: () => base44.entities.Quiz.list(),
    });

    const { data: attempts = [] } = useQuery({
        queryKey: ['quizAttempts', freelancerId],
        queryFn: () => base44.entities.QuizAttempt.filter({ freelancer_id: freelancerId }),
    });

    const getQuizDetails = (quizId) => quizzes.find(q => q.id === quizId);
    const getQuizAttempt = (quizId) => attempts.find(a => a.quiz_id === quizId);

    if (assignments.length === 0) {
        return (
            <Card>
                <CardContent className="pt-12 pb-8 text-center">
                    <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-gray-500">No quizzes assigned yet.</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            {assignments.map(assignment => {
                const quiz = getQuizDetails(assignment.quiz_id);
                const attempt = getQuizAttempt(assignment.quiz_id);
                const isCompleted = assignment.status === 'completed' || attempt?.status === 'submitted';

                return (
                    <Card key={assignment.id}>
                        <CardHeader className="pb-3">
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle className="text-lg">{quiz?.title || 'Quiz'}</CardTitle>
                                    {quiz?.description && (
                                        <p className="text-sm text-gray-600 mt-1">{quiz.description}</p>
                                    )}
                                </div>
                                <Badge className={
                                    isCompleted ? 'bg-green-100 text-green-800' :
                                    assignment.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                                    'bg-yellow-100 text-yellow-800'
                                }>
                                    {isCompleted ? 'Completed' :
                                     assignment.status === 'in_progress' ? 'In Progress' :
                                     'Pending'}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {assignment.deadline && (
                                <div className="flex items-center gap-2 text-sm">
                                    <Calendar className="w-4 h-4 text-gray-400" />
                                    <span>Deadline: {new Date(assignment.deadline).toLocaleDateString()}</span>
                                </div>
                            )}

                            {assignment.notes && (
                                <div className="bg-blue-50 p-3 rounded-lg">
                                    <p className="text-sm text-blue-900">{assignment.notes}</p>
                                </div>
                            )}

                            {attempt && (
                                <div className="border-t pt-3">
                                    <div className="flex items-center gap-2 mb-2">
                                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                                        <span className="text-sm font-medium">Quiz Attempt</span>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2 text-sm">
                                        <div>
                                            <div className="text-gray-600">Score</div>
                                            <div className="font-semibold">{attempt.score}/{attempt.total_possible}</div>
                                        </div>
                                        <div>
                                            <div className="text-gray-600">Percentage</div>
                                            <div className="font-semibold">{attempt.percentage.toFixed(1)}%</div>
                                        </div>
                                        <div>
                                            <div className="text-gray-600">Status</div>
                                            <div className={`font-semibold ${attempt.passed ? 'text-green-600' : 'text-red-600'}`}>
                                                {attempt.passed ? 'Passed' : 'Failed'}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {!isCompleted && (
                                <Link to={createPageUrl(`TakeQuiz?quizId=${assignment.quiz_id}`)}>
                                    <Button className="w-full gap-2">
                                        <Clock className="w-4 h-4" />
                                        Take Quiz
                                    </Button>
                                </Link>
                            )}
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}