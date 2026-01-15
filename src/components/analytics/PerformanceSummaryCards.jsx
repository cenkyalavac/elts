import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { FileText, Users, Star, TrendingUp } from "lucide-react";

export default function PerformanceSummaryCards({ reports, freelancerStats, settings }) {
    const totalReports = reports.length;
    const activeFreelancers = freelancerStats.length;
    
    const avgLqa = reports.filter(r => r.lqa_score != null).length > 0
        ? reports.filter(r => r.lqa_score != null).reduce((sum, r) => sum + r.lqa_score, 0) / 
          reports.filter(r => r.lqa_score != null).length
        : null;
    
    const avgQs = reports.filter(r => r.qs_score != null).length > 0
        ? reports.filter(r => r.qs_score != null).reduce((sum, r) => sum + r.qs_score, 0) /
          reports.filter(r => r.qs_score != null).length
        : null;

    const avgCombined = freelancerStats.filter(s => s.combined_score != null).length > 0
        ? freelancerStats.filter(s => s.combined_score != null)
            .reduce((sum, s) => sum + s.combined_score, 0) / 
          freelancerStats.filter(s => s.combined_score != null).length
        : null;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
                <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                            <FileText className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Total Reports</p>
                            <p className="text-2xl font-bold">{totalReports}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
                            <Users className="w-6 h-6 text-purple-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Active Freelancers</p>
                            <p className="text-2xl font-bold">{activeFreelancers}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                            <Star className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Avg LQA Score</p>
                            <p className={`text-2xl font-bold ${
                                avgLqa >= 85 ? 'text-green-600' : avgLqa >= 70 ? 'text-yellow-600' : 'text-red-600'
                            }`}>
                                {avgLqa?.toFixed(1) || '-'}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-amber-100 flex items-center justify-center">
                            <TrendingUp className="w-6 h-6 text-amber-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Avg Combined</p>
                            <p className={`text-2xl font-bold ${
                                avgCombined >= 80 ? 'text-green-600' : avgCombined >= 60 ? 'text-yellow-600' : 'text-red-600'
                            }`}>
                                {avgCombined?.toFixed(1) || '-'}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}