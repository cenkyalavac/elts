import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, FileQuestion, BarChart } from "lucide-react";
import { createPageUrl } from "../utils";
import QuizForm from "../components/quiz/QuizForm";
import { toast } from "sonner";

export default function QuizManagement() {
    const [selectedQuiz, setSelectedQuiz] = useState(null);
    const [showForm, setShowForm] = useState(false);

    const queryClient = useQueryClient();

    const { data: user } = useQuery({
        queryKey: ['currentUser'],
        queryFn: () => base44.auth.me(),
    });

    const { data: quizzes = [], isLoading } = useQuery({
        queryKey: ['quizzes'],
        queryFn: () => base44.entities.Quiz.list('-created_date'),
    });

    const { data: allAttempts = [] } = useQuery({
        queryKey: ['allQuizAttempts'],
        queryFn: () => base44.entities.QuizAttempt.list('-created_date'),
    });

    const deleteQuizMutation = useMutation({
        mutationFn: (id) => base44.entities.Quiz.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['quizzes'] });
            toast.success('Quiz deleted');
        },
    });

    const handleEdit = (quiz) => {
        setSelectedQuiz(quiz);
        setShowForm(true);
    };

    const handleDelete = async (quiz) => {
        if (confirm(`Delete quiz "${quiz.title}"? This will also delete all questions and attempts.`)) {
            deleteQuizMutation.mutate(quiz.id);
        }
    };

    const getQuizStats = (quizId) => {
        const attempts = allAttempts.filter(a => a.quiz_id === quizId);
        const avgScore = attempts.length > 0
            ? (attempts.reduce((sum, a) => sum + a.percentage, 0) / attempts.length).toFixed(1)
            : 0;
        return {
            attempts: attempts.length,
            avgScore
        };
    };

    if (user?.role !== 'admin') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
                <div className="max-w-4xl mx-auto text-center mt-20">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
                    <p className="text-gray-600">Only administrators can manage quizzes.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
            <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                            <FileQuestion className="w-8 h-8 text-blue-600" />
                            Quiz Management
                        </h1>
                        <p className="text-gray-600 mt-1">Create and manage applicant assessment quizzes</p>
                    </div>
                    <Button
                        onClick={() => {
                            setSelectedQuiz(null);
                            setShowForm(true);
                        }}
                        className="bg-blue-600 hover:bg-blue-700"
                    >
                        <Plus className="w-5 h-5 mr-2" />
                        Create Quiz
                    </Button>
                </div>

                {showForm ? (
                    <QuizForm
                        quiz={selectedQuiz}
                        onClose={() => {
                            setShowForm(false);
                            setSelectedQuiz(null);
                        }}
                    />
                ) : (
                    <div className="grid gap-4">
                        {isLoading ? (
                            <div className="text-center py-12">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                            </div>
                        ) : quizzes.length === 0 ? (
                            <Card>
                                <CardContent className="py-12 text-center">
                                    <FileQuestion className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No quizzes yet</h3>
                                    <p className="text-gray-600 mb-4">Create your first quiz to assess applicants</p>
                                    <Button
                                        onClick={() => setShowForm(true)}
                                        className="bg-blue-600 hover:bg-blue-700"
                                    >
                                        <Plus className="w-5 h-5 mr-2" />
                                        Create Quiz
                                    </Button>
                                </CardContent>
                            </Card>
                        ) : (
                            quizzes.map(quiz => {
                                const stats = getQuizStats(quiz.id);
                                return (
                                    <Card key={quiz.id} className="hover:shadow-lg transition-shadow">
                                        <CardHeader>
                                            <div className="flex justify-between items-start">
                                                <div className="flex-1">
                                                    <CardTitle className="text-xl mb-2">{quiz.title}</CardTitle>
                                                    <p className="text-sm text-gray-600">{quiz.description}</p>
                                                    <div className="flex gap-2 mt-3">
                                                        {quiz.is_active ? (
                                                            <Badge className="bg-green-100 text-green-800">Active</Badge>
                                                        ) : (
                                                            <Badge variant="outline">Inactive</Badge>
                                                        )}
                                                        {quiz.required_for_approval && (
                                                            <Badge className="bg-purple-100 text-purple-800">Required</Badge>
                                                        )}
                                                        {quiz.passing_score && (
                                                            <Badge variant="outline">Pass: {quiz.passing_score}%</Badge>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => handleEdit(quiz)}
                                                    >
                                                        <Edit className="w-4 h-4 mr-1" />
                                                        Edit
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => handleDelete(quiz)}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="flex gap-6 text-sm">
                                                <div>
                                                    <span className="text-gray-600">Total Points:</span>
                                                    <span className="font-semibold ml-2">{quiz.total_points || 0}</span>
                                                </div>
                                                <div>
                                                    <span className="text-gray-600">Attempts:</span>
                                                    <span className="font-semibold ml-2">{stats.attempts}</span>
                                                </div>
                                                {stats.attempts > 0 && (
                                                    <div>
                                                        <span className="text-gray-600">Avg Score:</span>
                                                        <span className="font-semibold ml-2">{stats.avgScore}%</span>
                                                    </div>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}