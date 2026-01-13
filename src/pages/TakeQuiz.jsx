import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Clock, CheckCircle, AlertCircle, Save } from "lucide-react";
import { toast } from "sonner";
import { createPageUrl } from "../utils";

export default function TakeQuiz() {
    const urlParams = new URLSearchParams(window.location.search);
    const quizId = urlParams.get('quiz_id');

    const [answers, setAnswers] = useState({});
    const [startTime] = useState(new Date());
    const [submitted, setSubmitted] = useState(false);
    const [result, setResult] = useState(null);
    const [timeRemaining, setTimeRemaining] = useState(null);
    const [autoSaving, setAutoSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState(null);

    const queryClient = useQueryClient();

    const { data: user } = useQuery({
        queryKey: ['currentUser'],
        queryFn: () => base44.auth.me(),
    });

    const { data: quiz } = useQuery({
        queryKey: ['quiz', quizId],
        queryFn: async () => {
            const quizzes = await base44.entities.Quiz.list();
            return quizzes.find(q => q.id === quizId);
        },
        enabled: !!quizId,
    });

    // Timer effect
    useEffect(() => {
        if (!quiz?.time_limit_minutes || submitted) return;

        const endTime = new Date(startTime.getTime() + quiz.time_limit_minutes * 60000);
        const interval = setInterval(() => {
            const now = new Date();
            const remaining = Math.max(0, Math.floor((endTime - now) / 1000));
            setTimeRemaining(remaining);

            if (remaining === 0) {
                clearInterval(interval);
                handleSubmit();
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [quiz?.time_limit_minutes, submitted, startTime]);

    // Auto-save effect
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (Object.keys(answers).length > 0 && !submitted) {
                setAutoSaving(true);
                try {
                    // Save to localStorage as backup
                    localStorage.setItem(`quiz_draft_${quizId}`, JSON.stringify({
                        answers,
                        savedAt: new Date().toISOString()
                    }));
                    setLastSaved(new Date());
                    setAutoSaving(false);
                } catch (error) {
                    console.error('Auto-save failed:', error);
                    setAutoSaving(false);
                }
            }
        }, 2000);

        return () => clearTimeout(timer);
    }, [answers, submitted, quizId]);

    const { data: questions = [] } = useQuery({
        queryKey: ['questions', quizId],
        queryFn: () => base44.entities.Question.filter({ quiz_id: quizId }, 'order'),
        enabled: !!quizId,
    });

    const { data: freelancer } = useQuery({
        queryKey: ['myFreelancer', user?.email],
        queryFn: async () => {
            const freelancers = await base44.entities.Freelancer.filter({ email: user.email });
            return freelancers[0];
        },
        enabled: !!user?.email,
    });

    const submitQuizMutation = useMutation({
        mutationFn: async (data) => {
            const attempt = await base44.entities.QuizAttempt.create(data);
            // Update assignment status to completed
            const assignments = await base44.entities.QuizAssignment.filter({ freelancer_id: freelancer.id, quiz_id: quizId });
            if (assignments.length > 0) {
                await base44.entities.QuizAssignment.update(assignments[0].id, { status: 'completed' });
            }
            return attempt;
        },
        onSuccess: (attempt) => {
            queryClient.invalidateQueries({ queryKey: ['quizAttempts'] });
            queryClient.invalidateQueries({ queryKey: ['quizAssignments'] });
            setResult(attempt);
            setSubmitted(true);
            toast.success('Quiz submitted successfully!');
        },
    });

    const handleAnswerChange = (questionId, answer) => {
        setAnswers({ ...answers, [questionId]: answer });
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleSubmit = () => {
        // Clear draft from localStorage
        localStorage.removeItem(`quiz_draft_${quizId}`);

        if (Object.keys(answers).length < questions.length) {
            if (!confirm('You have unanswered questions. Submit anyway?')) {
                return;
            }
        }

        const timeTaken = Math.round((new Date() - startTime) / 60000); // minutes

        const gradedAnswers = questions.map(q => {
            const userAnswer = answers[q.id] || '';
            const isCorrect = userAnswer === q.correct_answer;
            return {
                question_id: q.id,
                answer: userAnswer,
                is_correct: isCorrect,
                points_earned: isCorrect ? q.points : 0
            };
        });

        const score = gradedAnswers.reduce((sum, a) => sum + a.points_earned, 0);
        const totalPossible = questions.reduce((sum, q) => sum + q.points, 0);
        const percentage = totalPossible > 0 ? (score / totalPossible) * 100 : 0;
        const passed = quiz.passing_score ? percentage >= quiz.passing_score : null;

        submitQuizMutation.mutate({
            quiz_id: quizId,
            freelancer_id: freelancer.id,
            answers: gradedAnswers,
            score,
            total_possible: totalPossible,
            percentage: Math.round(percentage),
            passed,
            time_taken_minutes: timeTaken,
            status: 'submitted'
        });
    };

    if (!quizId) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
                <div className="max-w-4xl mx-auto text-center mt-20">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">No Quiz Selected</h2>
                    <p className="text-gray-600">Please select a quiz to take.</p>
                </div>
            </div>
        );
    }

    if (!quiz || !freelancer) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (submitted && result) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
                <div className="max-w-3xl mx-auto">
                    <Card className="text-center">
                        <CardHeader>
                            <div className="mx-auto mb-4">
                                {result.passed ? (
                                    <CheckCircle className="w-20 h-20 text-green-500" />
                                ) : result.passed === false ? (
                                    <AlertCircle className="w-20 h-20 text-red-500" />
                                ) : (
                                    <CheckCircle className="w-20 h-20 text-blue-500" />
                                )}
                            </div>
                            <CardTitle className="text-3xl">Quiz Submitted!</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div>
                                <div className="text-5xl font-bold text-blue-600 mb-2">
                                    {result.percentage}%
                                </div>
                                <div className="text-gray-600">
                                    {result.score} out of {result.total_possible} points
                                </div>
                            </div>

                            {result.passed !== null && (
                                <Badge className={result.passed ? 'bg-green-500' : 'bg-red-500'}>
                                    {result.passed ? 'PASSED' : 'FAILED'}
                                </Badge>
                            )}

                            <div className="text-sm text-gray-600">
                                <div>Time taken: {result.time_taken_minutes} minutes</div>
                            </div>

                            <Button
                                onClick={() => window.location.href = createPageUrl('MyApplication')}
                                className="mt-6"
                            >
                                Return to My Application
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    const progress = (Object.keys(answers).length / questions.length) * 100;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <Card className="mb-6">
                    <CardHeader>
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex-1">
                                <CardTitle className="text-2xl">{quiz.title}</CardTitle>
                                {quiz.description && (
                                    <p className="text-gray-600 mt-2">{quiz.description}</p>
                                )}
                            </div>
                            {timeRemaining !== null && (
                                <div className={`text-center px-4 py-2 rounded-lg ${
                                    timeRemaining < 300 ? 'bg-red-100 border border-red-300' :
                                    timeRemaining < 600 ? 'bg-yellow-100 border border-yellow-300' :
                                    'bg-green-100 border border-green-300'
                                }`}>
                                    <Clock className={`w-5 h-5 mx-auto mb-1 ${
                                        timeRemaining < 300 ? 'text-red-600' :
                                        timeRemaining < 600 ? 'text-yellow-600' :
                                        'text-green-600'
                                    }`} />
                                    <div className={`font-bold text-lg ${
                                        timeRemaining < 300 ? 'text-red-600' :
                                        timeRemaining < 600 ? 'text-yellow-600' :
                                        'text-green-600'
                                    }`}>
                                        {formatTime(timeRemaining)}
                                    </div>
                                    {timeRemaining < 300 && (
                                        <div className="text-xs text-red-600 mt-1">⚠️ Hurry up!</div>
                                    )}
                                </div>
                            )}
                        </div>

                        {quiz.instructions && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                                <p className="text-sm text-gray-700 whitespace-pre-wrap">{quiz.instructions}</p>
                            </div>
                        )}

                        <div className="flex gap-4 mt-4 flex-wrap items-center justify-between">
                            <div className="flex gap-4">
                                <Badge variant="outline">
                                    {questions.length} Questions
                                </Badge>
                                <Badge variant="outline">
                                    {quiz.total_points} Total Points
                                </Badge>
                            </div>
                            {lastSaved && (
                                <div className="text-xs text-gray-500 flex items-center gap-1">
                                    <Save className="w-3 h-3" />
                                    Last saved: {lastSaved.toLocaleTimeString()}
                                </div>
                            )}
                        </div>
                    </CardHeader>
                </Card>

                {/* Progress */}
                <Card className="mb-6">
                    <CardContent className="pt-6">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium">Progress</span>
                            <span className="text-sm text-gray-600">
                                {Object.keys(answers).length} / {questions.length} answered
                            </span>
                        </div>
                        <Progress value={progress} className="h-2" />
                    </CardContent>
                </Card>

                {/* Questions */}
                <div className="space-y-6">
                    {questions.map((question, idx) => (
                        <Card key={question.id}>
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="font-bold text-lg">Question {idx + 1}</span>
                                            <Badge variant="outline">{question.points} pts</Badge>
                                            {question.section && (
                                                <Badge variant="secondary">{question.section}</Badge>
                                            )}
                                        </div>
                                        <p className="text-gray-800">{question.question_text}</p>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    {(question.question_type === 'true_false' 
                                        ? ['True', 'False'] 
                                        : question.options
                                    ).map((option, optIdx) => (
                                        <label
                                            key={optIdx}
                                            className={`flex items-center p-4 border rounded-lg cursor-pointer transition-all ${
                                                answers[question.id] === option
                                                    ? 'border-blue-500 bg-blue-50'
                                                    : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                        >
                                            <input
                                                type="radio"
                                                name={`question_${question.id}`}
                                                value={option}
                                                checked={answers[question.id] === option}
                                                onChange={() => handleAnswerChange(question.id, option)}
                                                className="mr-3"
                                            />
                                            <span>{option}</span>
                                        </label>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Submit Button */}
                <Card className="mt-6">
                    <CardContent className="pt-6">
                        <Button
                            onClick={handleSubmit}
                            disabled={submitQuizMutation.isPending}
                            className="w-full bg-blue-600 hover:bg-blue-700"
                            size="lg"
                        >
                            {submitQuizMutation.isPending ? 'Submitting...' : 'Submit Quiz'}
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}