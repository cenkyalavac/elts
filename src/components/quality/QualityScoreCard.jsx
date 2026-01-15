import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../../utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, TrendingUp, TrendingDown, Minus, Eye, FileCheck } from "lucide-react";

export default function QualityScoreCard({ freelancer, stats, filters }) {
    const getScoreColor = (score) => {
        const numScore = parseFloat(score);
        if (isNaN(numScore)) return "text-gray-500";
        if (numScore >= 80) return "text-green-600";
        if (numScore >= 60) return "text-yellow-600";
        return "text-red-600";
    };

    const getScoreBg = (score) => {
        const numScore = parseFloat(score);
        if (isNaN(numScore)) return "bg-gray-100";
        if (numScore >= 80) return "bg-green-100";
        if (numScore >= 60) return "bg-yellow-100";
        return "bg-red-100";
    };

    const hasFilters = filters.translation_type || filters.client_account || 
                       filters.source_language || filters.target_language;

    return (
        <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg">
                            {freelancer.full_name?.charAt(0) || "?"}
                        </div>
                        <div>
                            <h3 className="font-semibold">{freelancer.full_name}</h3>
                            <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-xs">
                                    {stats.totalReviews} değerlendirme
                                </Badge>
                                {hasFilters && (
                                    <Badge className="bg-purple-100 text-purple-700 text-xs">
                                        Filtrelenmiş
                                    </Badge>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        {/* LQA Average */}
                        <div className="text-center">
                            <p className="text-xs text-gray-500 mb-1">LQA Ort.</p>
                            <p className={`text-xl font-bold ${getScoreColor(stats.avgLqa)}`}>
                                {stats.avgLqa}
                            </p>
                        </div>

                        {/* QS Average */}
                        <div className="text-center">
                            <p className="text-xs text-gray-500 mb-1">QS Ort.</p>
                            <div className="flex items-center gap-1 justify-center">
                                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                <span className="text-xl font-bold">
                                    {stats.avgQs}
                                </span>
                            </div>
                        </div>

                        {/* Combined Score */}
                        <div className={`text-center px-4 py-2 rounded-lg ${getScoreBg(stats.combinedScore)}`}>
                            <p className="text-xs text-gray-500 mb-1">Combined</p>
                            <p className={`text-2xl font-bold ${getScoreColor(stats.combinedScore)}`}>
                                {stats.combinedScore}
                            </p>
                        </div>

                        <Link to={createPageUrl(`FreelancerDetail?id=${freelancer.id}`)}>
                            <Button variant="ghost" size="sm">
                                <Eye className="w-4 h-4 mr-1" />
                                Detay
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Active Filters Info */}
                {hasFilters && (
                    <div className="mt-3 pt-3 border-t flex flex-wrap gap-2">
                        {filters.translation_type && (
                            <Badge variant="outline" className="text-xs">
                                Alan: {filters.translation_type}
                            </Badge>
                        )}
                        {filters.client_account && (
                            <Badge variant="outline" className="text-xs">
                                Müşteri: {filters.client_account}
                            </Badge>
                        )}
                        {filters.source_language && filters.target_language && (
                            <Badge variant="outline" className="text-xs">
                                {filters.source_language} → {filters.target_language}
                            </Badge>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}