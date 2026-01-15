import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../../utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Star, Medal, Award } from "lucide-react";

export default function TopPerformers({ freelancers = [] }) {
    // Sort by combined score
    const topPerformers = [...freelancers]
        .filter(f => f.combinedScore && f.totalReviews >= 3)
        .sort((a, b) => b.combinedScore - a.combinedScore)
        .slice(0, 5);

    const getMedalColor = (index) => {
        if (index === 0) return "text-yellow-500";
        if (index === 1) return "text-gray-400";
        if (index === 2) return "text-amber-600";
        return "text-gray-300";
    };

    const getScoreColor = (score) => {
        if (score >= 90) return "bg-green-100 text-green-700";
        if (score >= 80) return "bg-blue-100 text-blue-700";
        if (score >= 70) return "bg-yellow-100 text-yellow-700";
        return "bg-red-100 text-red-700";
    };

    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                    <Trophy className="w-5 h-5 text-yellow-500" />
                    En İyi Performans
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                {topPerformers.length === 0 ? (
                    <div className="text-center py-6 text-gray-500">
                        <Award className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                        <p className="text-sm">Henüz yeterli veri yok</p>
                    </div>
                ) : (
                    topPerformers.map((f, index) => (
                        <Link 
                            key={f.id} 
                            to={createPageUrl(`FreelancerDetail?id=${f.id}`)}
                            className="flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50 transition"
                        >
                            <div className="flex items-center justify-center w-8 h-8">
                                {index < 3 ? (
                                    <Medal className={`w-6 h-6 ${getMedalColor(index)}`} />
                                ) : (
                                    <span className="text-lg font-bold text-gray-400">{index + 1}</span>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-medium text-gray-900 truncate">{f.full_name}</p>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-xs text-gray-500">{f.totalReviews} değerlendirme</span>
                                    {f.avgQs && (
                                        <span className="flex items-center text-xs text-yellow-600">
                                            <Star className="w-3 h-3 mr-0.5 fill-yellow-500" />
                                            {f.avgQs.toFixed(1)}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <Badge className={getScoreColor(f.combinedScore)}>
                                {f.combinedScore.toFixed(0)}
                            </Badge>
                        </Link>
                    ))
                )}
            </CardContent>
        </Card>
    );
}