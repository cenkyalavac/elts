import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
    LineChart, Line, XAxis, YAxis, CartesianGrid, 
    Tooltip, ResponsiveContainer, Legend
} from "recharts";
import { TrendingUp } from "lucide-react";
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";

export default function QualityTrendChart({ reports = [], settings }) {
    const chartData = useMemo(() => {
        const months = [];
        for (let i = 5; i >= 0; i--) {
            const date = subMonths(new Date(), i);
            months.push({
                month: format(date, 'MMM'),
                start: startOfMonth(date),
                end: endOfMonth(date)
            });
        }

        return months.map(m => {
            const monthReports = reports.filter(r => {
                const reportDate = new Date(r.created_date);
                return isWithinInterval(reportDate, { start: m.start, end: m.end }) &&
                    (r.status === 'finalized' || r.status === 'translator_accepted');
            });

            const lqaScores = monthReports.filter(r => r.lqa_score != null).map(r => r.lqa_score);
            const qsScores = monthReports.filter(r => r.qs_score != null).map(r => r.qs_score);

            const avgLqa = lqaScores.length > 0 
                ? lqaScores.reduce((a, b) => a + b, 0) / lqaScores.length 
                : null;
            const avgQs = qsScores.length > 0 
                ? qsScores.reduce((a, b) => a + b, 0) / qsScores.length 
                : null;

            // Calculate combined score
            let combined = null;
            const lqaWeight = settings?.lqa_weight || 4;
            const qsMultiplier = settings?.qs_multiplier || 20;
            
            if (avgLqa !== null && avgQs !== null) {
                combined = ((avgLqa * lqaWeight) + (avgQs * qsMultiplier)) / (lqaWeight + 1);
            } else if (avgLqa !== null) {
                combined = avgLqa;
            } else if (avgQs !== null) {
                combined = avgQs * qsMultiplier;
            }

            return {
                month: m.month,
                lqa: avgLqa ? parseFloat(avgLqa.toFixed(1)) : null,
                qs: avgQs ? parseFloat((avgQs * 20).toFixed(1)) : null, // Scale QS to 100
                combined: combined ? parseFloat(combined.toFixed(1)) : null,
                count: monthReports.length
            };
        });
    }, [reports, settings]);

    return (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                    <TrendingUp className="w-5 h-5" />
                    Quality Trend Analysis (Last 6 Months)
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                            <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                            <Tooltip 
                                formatter={(value, name) => {
                                    const labels = { lqa: 'LQA', qs: 'QS (x20)', combined: 'Combined' };
                                    return [value || '-', labels[name] || name];
                                }}
                            />
                            <Legend />
                            <Line 
                                type="monotone" 
                                dataKey="combined" 
                                stroke="#8b5cf6" 
                                strokeWidth={3}
                                name="Combined"
                                connectNulls
                            />
                            <Line 
                                type="monotone" 
                                dataKey="lqa" 
                                stroke="#3b82f6" 
                                strokeWidth={2}
                                name="LQA"
                                connectNulls
                            />
                            <Line 
                                type="monotone" 
                                dataKey="qs" 
                                stroke="#f59e0b" 
                                strokeWidth={2}
                                name="QS (x20)"
                                connectNulls
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}