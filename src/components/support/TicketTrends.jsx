import React, { useMemo, useState } from 'react';
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
    PieChart, Pie, Cell, LineChart, Line 
} from "recharts";
import { 
    TrendingUp, Tag, AlertTriangle, Clock, Sparkles, Loader2,
    ArrowUp, ArrowDown, Minus
} from "lucide-react";
import { format, subDays, startOfWeek, endOfWeek, isWithinInterval } from "date-fns";

const COLORS = ['#8b5cf6', '#06b6d4', '#f59e0b', '#ef4444', '#10b981'];

export default function TicketTrends({ tickets }) {
    const [aiInsights, setAiInsights] = useState(null);
    const [loadingInsights, setLoadingInsights] = useState(false);

    // Category distribution
    const categoryData = useMemo(() => {
        const counts = {};
        tickets.forEach(t => {
            const cat = t.category || 'other';
            counts[cat] = (counts[cat] || 0) + 1;
        });
        return Object.entries(counts).map(([name, value]) => ({
            name: name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            value
        }));
    }, [tickets]);

    // Weekly trend
    const weeklyTrend = useMemo(() => {
        const weeks = [];
        for (let i = 5; i >= 0; i--) {
            const weekStart = startOfWeek(subDays(new Date(), i * 7));
            const weekEnd = endOfWeek(weekStart);
            const count = tickets.filter(t => {
                const created = new Date(t.created_date);
                return isWithinInterval(created, { start: weekStart, end: weekEnd });
            }).length;
            weeks.push({
                week: format(weekStart, 'MMM d'),
                tickets: count
            });
        }
        return weeks;
    }, [tickets]);

    // Resolution time stats
    const resolutionStats = useMemo(() => {
        const resolved = tickets.filter(t => t.resolved_at && t.status === 'resolved');
        if (resolved.length === 0) return null;

        const times = resolved.map(t => {
            const created = new Date(t.created_date);
            const resolvedAt = new Date(t.resolved_at);
            return (resolvedAt - created) / (1000 * 60 * 60); // hours
        });

        return {
            average: times.reduce((a, b) => a + b, 0) / times.length,
            min: Math.min(...times),
            max: Math.max(...times),
            count: resolved.length
        };
    }, [tickets]);

    // Tag analysis
    const tagAnalysis = useMemo(() => {
        const tagCounts = {};
        tickets.forEach(t => {
            (t.tags || []).forEach(tag => {
                tagCounts[tag] = (tagCounts[tag] || 0) + 1;
            });
        });
        return Object.entries(tagCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([tag, count]) => ({ tag, count }));
    }, [tickets]);

    // Priority distribution
    const priorityData = useMemo(() => {
        const counts = { low: 0, medium: 0, high: 0, urgent: 0 };
        tickets.forEach(t => {
            if (counts[t.priority] !== undefined) {
                counts[t.priority]++;
            }
        });
        return Object.entries(counts).map(([name, value]) => ({ name, value }));
    }, [tickets]);

    // Sentiment analysis
    const sentimentData = useMemo(() => {
        const counts = { positive: 0, neutral: 0, negative: 0, frustrated: 0 };
        tickets.forEach(t => {
            if (t.sentiment && counts[t.sentiment] !== undefined) {
                counts[t.sentiment]++;
            }
        });
        return Object.entries(counts)
            .filter(([_, v]) => v > 0)
            .map(([name, value]) => ({ name, value }));
    }, [tickets]);

    const generateAIInsights = async () => {
        setLoadingInsights(true);
        try {
            const recentTickets = tickets.slice(0, 50).map(t => ({
                subject: t.subject,
                category: t.category,
                priority: t.priority,
                sentiment: t.sentiment,
                tags: t.tags,
                status: t.status
            }));

            const response = await base44.integrations.Core.InvokeLLM({
                prompt: `Analyze these support tickets and provide actionable insights:

${JSON.stringify(recentTickets, null, 2)}

Provide:
1. Top 3 recurring issues or themes
2. Areas that need improvement
3. Suggestions to reduce ticket volume
4. Any concerning patterns (frustrated users, urgent issues)
5. Quick wins to improve user satisfaction`,
                response_json_schema: {
                    type: 'object',
                    properties: {
                        recurring_issues: { 
                            type: 'array', 
                            items: { 
                                type: 'object',
                                properties: {
                                    issue: { type: 'string' },
                                    frequency: { type: 'string' },
                                    suggestion: { type: 'string' }
                                }
                            }
                        },
                        areas_to_improve: { type: 'array', items: { type: 'string' } },
                        volume_reduction_tips: { type: 'array', items: { type: 'string' } },
                        concerning_patterns: { type: 'array', items: { type: 'string' } },
                        quick_wins: { type: 'array', items: { type: 'string' } },
                        overall_health: { type: 'string' }
                    }
                }
            });

            setAiInsights(response);
        } catch (error) {
            console.error('Failed to generate insights:', error);
        } finally {
            setLoadingInsights(false);
        }
    };

    // Trend indicator
    const trendIndicator = useMemo(() => {
        if (weeklyTrend.length < 2) return null;
        const current = weeklyTrend[weeklyTrend.length - 1].tickets;
        const previous = weeklyTrend[weeklyTrend.length - 2].tickets;
        const change = previous > 0 ? ((current - previous) / previous * 100) : 0;
        return { change, current, previous };
    }, [weeklyTrend]);

    return (
        <div className="space-y-6">
            {/* Overview Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="pt-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-2xl font-bold">{tickets.length}</div>
                                <div className="text-sm text-gray-600">Total Tickets</div>
                            </div>
                            {trendIndicator && (
                                <div className={`flex items-center gap-1 text-sm ${
                                    trendIndicator.change > 0 ? 'text-red-600' : 
                                    trendIndicator.change < 0 ? 'text-green-600' : 'text-gray-600'
                                }`}>
                                    {trendIndicator.change > 0 ? <ArrowUp className="w-4 h-4" /> :
                                     trendIndicator.change < 0 ? <ArrowDown className="w-4 h-4" /> :
                                     <Minus className="w-4 h-4" />}
                                    {Math.abs(trendIndicator.change).toFixed(0)}%
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-4">
                        <div className="text-2xl font-bold text-yellow-600">
                            {tickets.filter(t => t.status === 'open').length}
                        </div>
                        <div className="text-sm text-gray-600">Open Tickets</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-4">
                        <div className="text-2xl font-bold text-red-600">
                            {tickets.filter(t => t.priority === 'urgent' && t.status !== 'resolved').length}
                        </div>
                        <div className="text-sm text-gray-600">Urgent</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-4">
                        <div className="text-2xl font-bold text-green-600">
                            {resolutionStats ? `${resolutionStats.average.toFixed(1)}h` : '--'}
                        </div>
                        <div className="text-sm text-gray-600">Avg Resolution</div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Category Distribution */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base">Tickets by Category</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={200}>
                            <PieChart>
                                <Pie
                                    data={categoryData}
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={80}
                                    dataKey="value"
                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                >
                                    {categoryData.map((_, idx) => (
                                        <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Weekly Trend */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center gap-2">
                            <TrendingUp className="w-4 h-4" />
                            Weekly Trend
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={200}>
                            <LineChart data={weeklyTrend}>
                                <XAxis dataKey="week" tick={{ fontSize: 12 }} />
                                <YAxis tick={{ fontSize: 12 }} />
                                <Tooltip />
                                <Line 
                                    type="monotone" 
                                    dataKey="tickets" 
                                    stroke="#8b5cf6" 
                                    strokeWidth={2}
                                    dot={{ fill: '#8b5cf6' }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* Top Tags */}
            {tagAnalysis.length > 0 && (
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center gap-2">
                            <Tag className="w-4 h-4" />
                            Common Topics
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-2">
                            {tagAnalysis.map(({ tag, count }) => (
                                <Badge key={tag} variant="outline" className="text-sm">
                                    {tag} ({count})
                                </Badge>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* AI Insights */}
            <Card className="bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200">
                <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-base flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-purple-600" />
                            AI Insights
                        </CardTitle>
                        <Button
                            size="sm"
                            onClick={generateAIInsights}
                            disabled={loadingInsights || tickets.length === 0}
                            className="bg-purple-600 hover:bg-purple-700"
                        >
                            {loadingInsights ? (
                                <>
                                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                    Analyzing...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-3 h-3 mr-1" />
                                    Generate Insights
                                </>
                            )}
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {aiInsights ? (
                        <div className="space-y-4">
                            {aiInsights.recurring_issues?.length > 0 && (
                                <div>
                                    <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                                        Recurring Issues
                                    </h4>
                                    <div className="space-y-2">
                                        {aiInsights.recurring_issues.map((item, idx) => (
                                            <div key={idx} className="bg-white rounded-lg p-3 text-sm">
                                                <div className="font-medium">{item.issue}</div>
                                                <div className="text-gray-600 text-xs mt-1">{item.suggestion}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {aiInsights.quick_wins?.length > 0 && (
                                <div>
                                    <h4 className="font-medium text-sm mb-2">Quick Wins</h4>
                                    <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                                        {aiInsights.quick_wins.map((win, idx) => (
                                            <li key={idx}>{win}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {aiInsights.overall_health && (
                                <div className="text-sm text-gray-600 italic">
                                    Overall: {aiInsights.overall_health}
                                </div>
                            )}
                        </div>
                    ) : (
                        <p className="text-sm text-gray-600">
                            Click "Generate Insights" to analyze ticket patterns and get actionable recommendations.
                        </p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}