import React, { useMemo } from 'react';
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { AlertCircle, TrendingUp, TrendingDown, Clock, Target, Users, Award } from "lucide-react";

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6'];

export default function EnhancedQuizAnalytics({ quizId, quiz }) {
    const { data: attempts = [] } = useQuery({
        queryKey: ['quizAttempts', quizId],
        queryFn: () => base44.entities.QuizAttempt.filter({ quiz_id: quizId }, '-created_date'),
    });

    const { data: questions = [] } = useQuery({
        queryKey: ['questions', quizId],
        queryFn: () => base44.entities.Question.filter({ quiz_id: quizId }, 'order'),
    });

    const { data: freelancers = [] } = useQuery({
        queryKey: ['freelancers'],
        queryFn: () => base44.entities.Freelancer.list(),
    });

    // Calculate analytics
    const analytics = useMemo(() => {
        if (attempts.length === 0) return null;

        // Question-level analytics
        const questionStats = questions.map(q => {
            const answersForQuestion = attempts.flatMap(a => 
                a.answers.filter(ans => ans.question_id === q.id)
            );
            
            const correctCount = answersForQuestion.filter(a => a.is_correct).length;
            const totalCount = answersForQuestion.length;
            const successRate = totalCount > 0 ? (correctCount / totalCount) * 100 : 0;

            return {
                id: q.id,
                text: q.question_text,
                section: q.section,
                successRate: Math.round(successRate),
                totalAttempts: totalCount,
                correctCount,
                incorrectCount: totalCount - correctCount
            };
        });

        // Sort by success rate to find hardest questions
        const hardestQuestions = [...questionStats]
            .sort((a, b) => a.successRate - b.successRate)
            .slice(0, 5);

        // Performance over time
        const attemptsWithDate = attempts.map(a => ({
            ...a,
            date: new Date(a.created_date).toLocaleDateString(),
            month: new Date(a.created_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
        }));

        const performanceByDate = attemptsWithDate.reduce((acc, attempt) => {
            const key = attempt.month;
            if (!acc[key]) {
                acc[key] = { date: key, scores: [], count: 0 };
            }
            acc[key].scores.push(attempt.percentage);
            acc[key].count++;
            return acc;
        }, {});

        const performanceTrend = Object.values(performanceByDate).map(item => ({
            date: item.date,
            avgScore: Math.round(item.scores.reduce((a, b) => a + b, 0) / item.scores.length),
            attempts: item.count
        }));

        // Score distribution
        const scoreRanges = [
            { range: '0-20%', count: 0 },
            { range: '21-40%', count: 0 },
            { range: '41-60%', count: 0 },
            { range: '61-80%', count: 0 },
            { range: '81-100%', count: 0 }
        ];

        attempts.forEach(a => {
            const score = a.percentage;
            if (score <= 20) scoreRanges[0].count++;
            else if (score <= 40) scoreRanges[1].count++;
            else if (score <= 60) scoreRanges[2].count++;
            else if (score <= 80) scoreRanges[3].count++;
            else scoreRanges[4].count++;
        });

        // Time analysis
        const avgTime = attempts.reduce((sum, a) => sum + (a.time_taken_minutes || 0), 0) / attempts.length;
        const minTime = Math.min(...attempts.map(a => a.time_taken_minutes || 0));
        const maxTime = Math.max(...attempts.map(a => a.time_taken_minutes || 0));

        // Pass/fail stats
        const passCount = attempts.filter(a => a.passed === true).length;
        const failCount = attempts.filter(a => a.passed === false).length;
        const passRate = attempts.length > 0 ? (passCount / attempts.length) * 100 : 0;

        // Section performance (if questions have sections)
        const sectionStats = {};
        questionStats.forEach(q => {
            if (q.section) {
                if (!sectionStats[q.section]) {
                    sectionStats[q.section] = { 
                        section: q.section, 
                        totalQuestions: 0, 
                        avgSuccessRate: 0,
                        scores: []
                    };
                }
                sectionStats[q.section].totalQuestions++;
                sectionStats[q.section].scores.push(q.successRate);
            }
        });

        const sectionPerformance = Object.values(sectionStats).map(s => ({
            ...s,
            avgSuccessRate: Math.round(s.scores.reduce((a, b) => a + b, 0) / s.scores.length)
        }));

        // Top performers
        const topPerformers = [...attempts]
            .sort((a, b) => b.percentage - a.percentage)
            .slice(0, 5)
            .map(a => {
                const freelancer = freelancers.find(f => f.id === a.freelancer_id);
                return {
                    name: freelancer?.full_name || 'Unknown',
                    score: a.percentage,
                    date: new Date(a.created_date).toLocaleDateString()
                };
            });

        return {
            questionStats,
            hardestQuestions,
            performanceTrend,
            scoreRanges: scoreRanges.filter(r => r.count > 0),
            avgTime: Math.round(avgTime),
            minTime,
            maxTime,
            passCount,
            failCount,
            passRate: Math.round(passRate),
            sectionPerformance,
            topPerformers
        };
    }, [attempts, questions, freelancers]);

    if (!analytics) {
        return (
            <Card>
                <CardContent className="py-12 text-center">
                    <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600">No quiz attempts yet</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Total Attempts</p>
                                <p className="text-3xl font-bold text-gray-900">{attempts.length}</p>
                            </div>
                            <Users className="w-10 h-10 text-blue-500 opacity-50" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Pass Rate</p>
                                <p className="text-3xl font-bold text-green-600">{analytics.passRate}%</p>
                            </div>
                            <Target className="w-10 h-10 text-green-500 opacity-50" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Avg Time</p>
                                <p className="text-3xl font-bold text-purple-600">{analytics.avgTime}m</p>
                            </div>
                            <Clock className="w-10 h-10 text-purple-500 opacity-50" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Avg Score</p>
                                <p className="text-3xl font-bold text-indigo-600">
                                    {Math.round(attempts.reduce((sum, a) => sum + a.percentage, 0) / attempts.length)}%
                                </p>
                            </div>
                            <Award className="w-10 h-10 text-indigo-500 opacity-50" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Performance Trend Over Time */}
            {analytics.performanceTrend.length > 1 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-blue-600" />
                            Performance Trend Over Time
                        </CardTitle>
                        <CardDescription>Average scores and attempt volume by month</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={analytics.performanceTrend}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" />
                                <YAxis yAxisId="left" label={{ value: 'Average Score (%)', angle: -90, position: 'insideLeft' }} />
                                <YAxis yAxisId="right" orientation="right" label={{ value: 'Attempts', angle: 90, position: 'insideRight' }} />
                                <Tooltip />
                                <Legend />
                                <Line yAxisId="left" type="monotone" dataKey="avgScore" stroke="#6366f1" strokeWidth={2} name="Avg Score (%)" />
                                <Line yAxisId="right" type="monotone" dataKey="attempts" stroke="#10b981" strokeWidth={2} name="Attempts" />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            )}

            {/* Score Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Score Distribution</CardTitle>
                        <CardDescription>How candidates performed</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={250}>
                            <PieChart>
                                <Pie
                                    data={analytics.scoreRanges}
                                    dataKey="count"
                                    nameKey="range"
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={80}
                                    label
                                >
                                    {analytics.scoreRanges.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Time Statistics</CardTitle>
                        <CardDescription>Quiz completion times</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg">
                                <span className="text-sm font-medium text-gray-700">Average Time</span>
                                <span className="text-xl font-bold text-blue-600">{analytics.avgTime} min</span>
                            </div>
                            <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg">
                                <span className="text-sm font-medium text-gray-700">Fastest Time</span>
                                <span className="text-xl font-bold text-green-600">{analytics.minTime} min</span>
                            </div>
                            <div className="flex justify-between items-center p-4 bg-orange-50 rounded-lg">
                                <span className="text-sm font-medium text-gray-700">Longest Time</span>
                                <span className="text-xl font-bold text-orange-600">{analytics.maxTime} min</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Hardest Questions */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-red-600" />
                        Most Commonly Missed Questions
                    </CardTitle>
                    <CardDescription>Questions with the lowest success rates</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {analytics.hardestQuestions.map((q, idx) => (
                            <div key={q.id} className="border-l-4 border-red-400 bg-red-50 p-4 rounded-r-lg">
                                <div className="flex items-start justify-between mb-2">
                                    <div className="flex items-center gap-3 flex-1">
                                        <div className="w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center font-bold text-sm">
                                            {idx + 1}
                                        </div>
                                        <p className="text-sm font-medium text-gray-900 flex-1">{q.text}</p>
                                    </div>
                                    <Badge variant="outline" className="ml-2 bg-white">
                                        {q.successRate}% success
                                    </Badge>
                                </div>
                                <div className="ml-11 text-xs text-gray-600">
                                    {q.correctCount} correct, {q.incorrectCount} incorrect out of {q.totalAttempts} attempts
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Question Success Rates */}
            <Card>
                <CardHeader>
                    <CardTitle>Question-by-Question Success Rates</CardTitle>
                    <CardDescription>Performance breakdown for each question</CardDescription>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={400}>
                        <BarChart data={analytics.questionStats} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" domain={[0, 100]} label={{ value: 'Success Rate (%)', position: 'insideBottom', offset: -5 }} />
                            <YAxis type="category" dataKey="id" hide />
                            <Tooltip 
                                content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                        const data = payload[0].payload;
                                        return (
                                            <div className="bg-white p-3 border border-gray-200 rounded shadow-lg">
                                                <p className="font-semibold text-sm mb-1">{data.text.substring(0, 60)}...</p>
                                                <p className="text-sm text-gray-700">Success Rate: {data.successRate}%</p>
                                                <p className="text-xs text-gray-600">Attempts: {data.totalAttempts}</p>
                                            </div>
                                        );
                                    }
                                    return null;
                                }}
                            />
                            <Bar dataKey="successRate" fill="#6366f1" />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {/* Section Performance (if applicable) */}
            {analytics.sectionPerformance.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Performance by Section</CardTitle>
                        <CardDescription>Success rates grouped by question sections</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={analytics.sectionPerformance}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="section" />
                                <YAxis label={{ value: 'Success Rate (%)', angle: -90, position: 'insideLeft' }} />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="avgSuccessRate" fill="#8b5cf6" name="Avg Success Rate (%)" />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            )}

            {/* Top Performers */}
            {analytics.topPerformers.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Award className="w-5 h-5 text-yellow-600" />
                            Top Performers
                        </CardTitle>
                        <CardDescription>Highest scoring quiz attempts</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {analytics.topPerformers.map((performer, idx) => (
                                <div key={idx} className="flex items-center justify-between p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                                            idx === 0 ? 'bg-yellow-400 text-yellow-900' :
                                            idx === 1 ? 'bg-gray-300 text-gray-700' :
                                            idx === 2 ? 'bg-orange-400 text-orange-900' :
                                            'bg-gray-200 text-gray-600'
                                        }`}>
                                            {idx + 1}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-900">{performer.name}</p>
                                            <p className="text-xs text-gray-600">{performer.date}</p>
                                        </div>
                                    </div>
                                    <div className="text-2xl font-bold text-yellow-600">{performer.score}%</div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}