import React from 'react';
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { createPageUrl } from "../../utils";
import { TrendingDown } from "lucide-react";

export default function TestScoreAlerts({ freelancers }) {
    const { data: quizAttempts = [] } = useQuery({
        queryKey: ['allQuizAttempts'],
        queryFn: () => base44.entities.QuizAttempt.list(),
        staleTime: 120000,
    });

    // Find freelancers whose latest quiz score dropped below passing
    const alerts = [];
    freelancers.filter(f => f.status === 'Approved' || f.status === 'Test Sent').forEach(f => {
        const attempts = quizAttempts
            .filter(a => a.freelancer_id === f.id)
            .sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
        
        if (attempts.length >= 2) {
            const latest = attempts[0];
            const previous = attempts[1];
            if (latest.percentage < previous.percentage && latest.percentage < 70) {
                alerts.push({
                    freelancer: f,
                    latestScore: latest.percentage,
                    previousScore: previous.percentage,
                    drop: previous.percentage - latest.percentage
                });
            }
        } else if (attempts.length === 1 && attempts[0].passed === false) {
            alerts.push({
                freelancer: f,
                latestScore: attempts[0].percentage,
                previousScore: null,
                drop: null
            });
        }
    });

    if (alerts.length === 0) return null;

    return (
        <Card className="border-l-4 border-l-red-400 bg-red-50">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2 text-red-800">
                    <TrendingDown className="w-4 h-4" />
                    Test Score Alerts ({alerts.length})
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
                {alerts.slice(0, 5).map(a => (
                    <Link key={a.freelancer.id} to={`${createPageUrl('FreelancerDetail')}?id=${a.freelancer.id}`}>
                        <div className="flex items-center justify-between p-2 bg-white rounded border hover:shadow-sm cursor-pointer">
                            <span className="text-sm font-medium text-gray-800">{a.freelancer.full_name}</span>
                            <div className="flex items-center gap-2">
                                <Badge className={a.latestScore < 50 ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}>
                                    {Math.round(a.latestScore)}%
                                </Badge>
                                {a.drop && (
                                    <span className="text-xs text-red-600">↓{Math.round(a.drop)}%</span>
                                )}
                            </div>
                        </div>
                    </Link>
                ))}
                {alerts.length > 5 && (
                    <p className="text-xs text-red-600">+{alerts.length - 5} more</p>
                )}
            </CardContent>
        </Card>
    );
}