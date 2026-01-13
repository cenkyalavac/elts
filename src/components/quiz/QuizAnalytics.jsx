import React, { useMemo } from 'react';
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { AlertCircle, TrendingUp } from 'lucide-react';

export default function QuizAnalytics({ quizId, quiz }) {
    const { data: attempts = [] } = useQuery({
        queryKey: ['quizAttempts', quizId],
        queryFn: () => base44.entities.QuizAttempt.filter({ quiz_id: quizId }, '-created_date', 100),
    });

    const { data: questions = [] } = useQuery({
        queryKey: ['quizQuestions', quizId],
        queryFn: () => base44.entities.Question.filter({ quiz_id: quizId }, 'order'),
    });

    const analytics = useMemo(() => {
        if (attempts.length === 0) return null;

        const totalAttempts = attempts.length;
        const passedAttempts = attempts.filter(a => a.passed).length;
        const passRate = ((passedAttempts / totalAttempts) * 100).toFixed(1);
        const avgScore = (attempts.reduce((sum, a) => sum + a.percentage, 0) / totalAttempts).toFixed(1);
        const avgTime = (attempts.reduce((sum, a) => sum + (a.time_taken_minutes || 0), 0) / totalAttempts).toFixed(1);

        // Calculate incorrect answers by question
        const incorrectAnswers = {};
        questions.forEach(q => {
            incorrectAnswers[q.id] = {
                question: q.question_text,
                correct_answer: q.correct_answer,
                total_attempts: 0,
                incorrect_count: 0,
                incorrect_answers: {}
            };
        });

        attempts.forEach(attempt => {
            attempt.answers?.forEach(ans => {
                if (incorrectAnswers[ans.question_id]) {
                    incorrectAnswers[ans.question_id].total_attempts++;
                    if (!ans.is_correct) {
                        incorrectAnswers[ans.question_id].incorrect_count++;
                        const answer = ans.answer || 'No answer';
                        incorrectAnswers[ans.question_id].incorrect_answers[answer] =
                            (incorrectAnswers[ans.question_id].incorrect_answers[answer] || 0) + 1;
                    }
                }
            });
        });

        // Find most common incorrect answers
        const incorrectAnswersArray = Object.entries(incorrectAnswers)
            .map(([qId, data]) => ({
                question_id: qId,
                ...data,
                incorrect_rate: data.total_attempts > 0 ? ((data.incorrect_count / data.total_attempts) * 100).toFixed(1) : 0
            }))
            .filter(q => q.incorrect_count > 0)
            .sort((a, b) => b.incorrect_count - a.incorrect_count);

        // Score distribution
        const scoreRanges = { '0-20': 0, '21-40': 0, '41-60': 0, '61-80': 0, '81-100': 0 };
        attempts.forEach(a => {
            const score = a.percentage;
            if (score <= 20) scoreRanges['0-20']++;
            else if (score <= 40) scoreRanges['21-40']++;
            else if (score <= 60) scoreRanges['41-60']++;
            else if (score <= 80) scoreRanges['61-80']++;
            else scoreRanges['81-100']++;
        });

        const scoreDistribution = Object.entries(scoreRanges).map(([range, count]) => ({
            range,
            count
        }));

        // Attempts over time
        const attemptsByDate = {};
        attempts.forEach(a => {
            const date = new Date(a.created_date).toLocaleDateString();
            attemptsByDate[date] = (attemptsByDate[date] || 0) + 1;
        });

        const attemptsTimeline = Object.entries(attemptsByDate)
            .sort((a, b) => new Date(a[0]) - new Date(b[0]))
            .map(([date, count]) => ({ date, attempts: count }));

        return {
            totalAttempts,
            passedAttempts,
            passRate,
            avgScore,
            avgTime,
            incorrectAnswersArray,
            scoreDistribution,
            attemptsTimeline
        };
    }, [attempts, questions]);

    if (!analytics) {
        return (
            <Card>
                <CardContent className="py-12 text-center">
                    <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900">No data yet</h3>
                    <p className="text-gray-600">Once freelancers take this quiz, analytics will appear here.</p>
                </CardContent>
            </Card>
        );
    }

    const COLORS = ['#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e'];

    return (
        <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-3xl font-bold text-blue-600">{analytics.totalAttempts}</div>
                        <div className="text-sm text-gray-600 mt-1">Total Attempts</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-3xl font-bold text-green-600">{analytics.passRate}%</div>
                        <div className="text-sm text-gray-600 mt-1">Pass Rate</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-3xl font-bold text-purple-600">{analytics.avgScore}%</div>
                        <div className="text-sm text-gray-600 mt-1">Avg Score</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-3xl font-bold text-orange-600">{analytics.avgTime}</div>
                        <div className="text-sm text-gray-600 mt-1">Avg Time (mins)</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-3xl font-bold text-red-600">{analytics.passedAttempts}</div>
                        <div className="text-sm text-gray-600 mt-1">Passed</div>
                    </CardContent>
                </Card>
            </div>

            {/* Score Distribution */}
            <Card>
                <CardHeader>
                    <CardTitle>Score Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie data={analytics.scoreDistribution} dataKey="count" nameKey="range" cx="50%" cy="50%" outerRadius={100} label>
                                {analytics.scoreDistribution.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {/* Attempts Timeline */}
            {analytics.attemptsTimeline.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Attempts Over Time</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={analytics.attemptsTimeline}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" />
                                <YAxis />
                                <Tooltip />
                                <Line type="monotone" dataKey="attempts" stroke="#3b82f6" strokeWidth={2} />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            )}

            {/* Most Incorrect Questions */}
            {analytics.incorrectAnswersArray.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="w-5 h-5" />
                            Problem Questions
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-6">
                            {analytics.incorrectAnswersArray.slice(0, 5).map((item, idx) => (
                                <div key={item.question_id} className="border-b pb-4 last:border-0">
                                    <div className="flex items-start justify-between mb-2">
                                        <h4 className="font-semibold text-gray-900">{idx + 1}. {item.question}</h4>
                                        <Badge className="bg-red-100 text-red-800">
                                            {item.incorrect_rate}% incorrect
                                        </Badge>
                                    </div>
                                    <div className="bg-gray-50 p-3 rounded mb-2">
                                        <div className="text-sm text-gray-600">Correct Answer:</div>
                                        <div className="text-sm font-semibold text-green-700">{item.correct_answer}</div>
                                    </div>
                                    {Object.entries(item.incorrect_answers).length > 0 && (
                                        <div>
                                            <div className="text-sm text-gray-600 mb-2">Common Incorrect Answers:</div>
                                            <div className="space-y-1">
                                                {Object.entries(item.incorrect_answers)
                                                    .sort((a, b) => b[1] - a[1])
                                                    .slice(0, 3)
                                                    .map(([answer, count]) => (
                                                        <div key={answer} className="text-sm text-gray-700">
                                                            • {answer} <span className="text-red-600">({count}x)</span>
                                                        </div>
                                                    ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}