import React, { useMemo } from 'react';
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, Award, TrendingUp } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Leaderboard({ quizId }) {
    const { data: attempts = [] } = useQuery({
        queryKey: ['leaderboard', quizId],
        queryFn: () => base44.entities.QuizAttempt.filter(
            quizId ? { quiz_id: quizId } : {},
            '-percentage'
        ),
    });

    const { data: freelancers = [] } = useQuery({
        queryKey: ['freelancers'],
        queryFn: () => base44.entities.Freelancer.list(),
    });

    const leaderboards = useMemo(() => {
        // Top scores (single attempts)
        const topScores = [...attempts]
            .sort((a, b) => b.percentage - a.percentage)
            .slice(0, 10)
            .map((attempt, idx) => {
                const freelancer = freelancers.find(f => f.id === attempt.freelancer_id);
                return {
                    rank: idx + 1,
                    name: freelancer?.full_name || 'Unknown',
                    score: attempt.percentage,
                    date: new Date(attempt.created_date).toLocaleDateString(),
                    time: attempt.time_taken_minutes
                };
            });

        // Average scores per freelancer
        const freelancerScores = {};
        attempts.forEach(attempt => {
            if (!freelancerScores[attempt.freelancer_id]) {
                freelancerScores[attempt.freelancer_id] = {
                    scores: [],
                    totalTime: 0,
                    attempts: 0
                };
            }
            freelancerScores[attempt.freelancer_id].scores.push(attempt.percentage);
            freelancerScores[attempt.freelancer_id].totalTime += attempt.time_taken_minutes || 0;
            freelancerScores[attempt.freelancer_id].attempts++;
        });

        const averageScores = Object.entries(freelancerScores)
            .map(([freelancerId, data]) => {
                const freelancer = freelancers.find(f => f.id === freelancerId);
                const avgScore = data.scores.reduce((sum, s) => sum + s, 0) / data.scores.length;
                return {
                    name: freelancer?.full_name || 'Unknown',
                    avgScore: Math.round(avgScore),
                    attempts: data.attempts,
                    avgTime: Math.round(data.totalTime / data.attempts)
                };
            })
            .sort((a, b) => b.avgScore - a.avgScore)
            .slice(0, 10)
            .map((item, idx) => ({ ...item, rank: idx + 1 }));

        // Fastest completions (among passed attempts)
        const fastestCompletions = [...attempts]
            .filter(a => a.passed && a.time_taken_minutes)
            .sort((a, b) => a.time_taken_minutes - b.time_taken_minutes)
            .slice(0, 10)
            .map((attempt, idx) => {
                const freelancer = freelancers.find(f => f.id === attempt.freelancer_id);
                return {
                    rank: idx + 1,
                    name: freelancer?.full_name || 'Unknown',
                    time: attempt.time_taken_minutes,
                    score: attempt.percentage,
                    date: new Date(attempt.created_date).toLocaleDateString()
                };
            });

        return { topScores, averageScores, fastestCompletions };
    }, [attempts, freelancers]);

    const getRankIcon = (rank) => {
        if (rank === 1) return <Trophy className="w-5 h-5 text-yellow-500" />;
        if (rank === 2) return <Medal className="w-5 h-5 text-gray-400" />;
        if (rank === 3) return <Medal className="w-5 h-5 text-orange-600" />;
        return <span className="w-5 h-5 flex items-center justify-center text-sm font-bold text-gray-500">{rank}</span>;
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-yellow-600" />
                    Leaderboard
                </CardTitle>
            </CardHeader>
            <CardContent>
                <Tabs defaultValue="top-scores">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="top-scores">🏆 Top Scores</TabsTrigger>
                        <TabsTrigger value="average">📊 Average</TabsTrigger>
                        <TabsTrigger value="fastest">⚡ Fastest</TabsTrigger>
                    </TabsList>

                    <TabsContent value="top-scores" className="space-y-2 mt-4">
                        {leaderboards.topScores.length === 0 ? (
                            <p className="text-center text-gray-500 py-8">No attempts yet</p>
                        ) : (
                            leaderboards.topScores.map((item) => (
                                <div key={item.rank} className={`flex items-center gap-3 p-3 rounded-lg ${
                                    item.rank <= 3 ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200' : 'bg-gray-50'
                                }`}>
                                    <div className="flex items-center justify-center w-8">
                                        {getRankIcon(item.rank)}
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-semibold text-gray-900">{item.name}</p>
                                        <p className="text-xs text-gray-600">{item.date} • {item.time} min</p>
                                    </div>
                                    <Badge className="bg-purple-600 text-white text-lg px-3">
                                        {item.score}%
                                    </Badge>
                                </div>
                            ))
                        )}
                    </TabsContent>

                    <TabsContent value="average" className="space-y-2 mt-4">
                        {leaderboards.averageScores.length === 0 ? (
                            <p className="text-center text-gray-500 py-8">No attempts yet</p>
                        ) : (
                            leaderboards.averageScores.map((item) => (
                                <div key={item.rank} className={`flex items-center gap-3 p-3 rounded-lg ${
                                    item.rank <= 3 ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200' : 'bg-gray-50'
                                }`}>
                                    <div className="flex items-center justify-center w-8">
                                        {getRankIcon(item.rank)}
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-semibold text-gray-900">{item.name}</p>
                                        <p className="text-xs text-gray-600">
                                            {item.attempts} attempt{item.attempts > 1 ? 's' : ''} • Avg {item.avgTime} min
                                        </p>
                                    </div>
                                    <Badge className="bg-blue-600 text-white text-lg px-3">
                                        {item.avgScore}%
                                    </Badge>
                                </div>
                            ))
                        )}
                    </TabsContent>

                    <TabsContent value="fastest" className="space-y-2 mt-4">
                        {leaderboards.fastestCompletions.length === 0 ? (
                            <p className="text-center text-gray-500 py-8">No passed attempts yet</p>
                        ) : (
                            leaderboards.fastestCompletions.map((item) => (
                                <div key={item.rank} className={`flex items-center gap-3 p-3 rounded-lg ${
                                    item.rank <= 3 ? 'bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200' : 'bg-gray-50'
                                }`}>
                                    <div className="flex items-center justify-center w-8">
                                        {getRankIcon(item.rank)}
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-semibold text-gray-900">{item.name}</p>
                                        <p className="text-xs text-gray-600">{item.date} • {item.score}% score</p>
                                    </div>
                                    <Badge className="bg-green-600 text-white text-lg px-3">
                                        {item.time} min
                                    </Badge>
                                </div>
                            ))
                        )}
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );
}