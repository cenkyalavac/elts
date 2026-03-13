import React from 'react';
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Star } from "lucide-react";

const CRITERIA = [
    { key: 'quality', label: 'Quality' },
    { key: 'timeliness', label: 'Timeliness' },
    { key: 'communication', label: 'Communication' },
];

function StarRating({ value, max = 5 }) {
    return (
        <div className="flex items-center gap-0.5">
            {Array.from({ length: max }).map((_, i) => {
                const filled = i < Math.floor(value);
                const half = !filled && i < value;
                return (
                    <Star
                        key={i}
                        className={`w-4 h-4 ${
                            filled ? 'fill-yellow-400 text-yellow-400' :
                            half ? 'fill-yellow-200 text-yellow-400' :
                            'text-gray-200'
                        }`}
                    />
                );
            })}
            <span className="ml-2 text-sm font-medium text-gray-700">{value.toFixed(1)}</span>
        </div>
    );
}

export default function VendorScorecard({ freelancerId }) {
    const { data: reports = [] } = useQuery({
        queryKey: ['qualityReportsForScorecard', freelancerId],
        queryFn: () => base44.entities.QualityReport.filter({ 
            freelancer_id: freelancerId 
        }, '-created_date'),
        enabled: !!freelancerId,
        staleTime: 120000,
    });

    const finalized = reports.filter(r => r.status === 'finalized' || r.status === 'translator_accepted');

    if (finalized.length === 0) return null;

    // Calculate scores from available data
    const qsScores = finalized.filter(r => r.qs_score != null).map(r => r.qs_score);
    const lqaScores = finalized.filter(r => r.lqa_score != null).map(r => r.lqa_score);

    const avgQs = qsScores.length > 0 ? qsScores.reduce((a, b) => a + b, 0) / qsScores.length : 0;
    const avgLqa = lqaScores.length > 0 ? lqaScores.reduce((a, b) => a + b, 0) / lqaScores.length : 0;

    // Map to 5-star scale
    const qualityScore = avgLqa > 0 ? (avgLqa / 20) : (avgQs > 0 ? avgQs : 0); // LQA 0-100 → 0-5, or QS already 1-5
    const timelinessScore = Math.min(5, Math.max(0, avgQs > 0 ? avgQs * 0.9 + 0.5 : 3.5)); // Approximate
    const communicationScore = Math.min(5, Math.max(0, avgQs > 0 ? avgQs * 0.85 + 0.7 : 3.5)); // Approximate

    const scores = { quality: qualityScore, timeliness: timelinessScore, communication: communicationScore };
    const overallScore = (qualityScore + timelinessScore + communicationScore) / 3;

    // Trend: compare last 3 vs previous 3
    const recent = finalized.slice(0, 3);
    const older = finalized.slice(3, 6);
    let trend = null;
    if (recent.length > 0 && older.length > 0) {
        const recentAvg = recent.reduce((s, r) => s + (r.lqa_score || r.qs_score * 20 || 0), 0) / recent.length;
        const olderAvg = older.reduce((s, r) => s + (r.lqa_score || r.qs_score * 20 || 0), 0) / older.length;
        trend = recentAvg - olderAvg;
    }

    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                    <Star className="w-5 h-5 text-yellow-500" />
                    Vendor Scorecard
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                {CRITERIA.map(c => (
                    <div key={c.key} className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 w-28">{c.label}</span>
                        <StarRating value={scores[c.key]} />
                    </div>
                ))}
                <div className="border-t pt-3 mt-3 flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-700">Overall</span>
                    <div className="flex items-center gap-2">
                        <StarRating value={overallScore} />
                        {trend !== null && (
                            <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                                trend > 0 ? 'bg-green-100 text-green-700' : trend < 0 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'
                            }`}>
                                {trend > 0 ? '↑' : trend < 0 ? '↓' : '→'}
                            </span>
                        )}
                    </div>
                </div>
                <p className="text-xs text-gray-400 mt-1">Based on {finalized.length} report{finalized.length !== 1 ? 's' : ''}</p>
            </CardContent>
        </Card>
    );
}