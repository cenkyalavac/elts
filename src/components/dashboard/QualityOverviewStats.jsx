import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { 
    BarChart3, Star, AlertTriangle, CheckCircle2, 
    TrendingUp, Users, FileCheck, Clock
} from "lucide-react";

export default function QualityOverviewStats({ stats }) {
    const statCards = [
        {
            label: "Total Reports",
            value: stats.totalReports,
            icon: BarChart3,
            color: "text-purple-600",
            bgColor: "bg-purple-50"
        },
        {
            label: "Avg Combined Score",
            value: stats.avgCombinedScore?.toFixed(1) || '-',
            icon: TrendingUp,
            color: stats.avgCombinedScore >= 80 ? "text-green-600" : 
                   stats.avgCombinedScore >= 70 ? "text-yellow-600" : "text-red-600",
            bgColor: stats.avgCombinedScore >= 80 ? "bg-green-50" : 
                     stats.avgCombinedScore >= 70 ? "bg-yellow-50" : "bg-red-50"
        },
        {
            label: "Avg LQA",
            value: stats.avgLqa?.toFixed(1) || '-',
            icon: FileCheck,
            color: "text-blue-600",
            bgColor: "bg-blue-50"
        },
        {
            label: "Avg QS",
            value: stats.avgQs ? `${stats.avgQs.toFixed(1)}/5` : '-',
            icon: Star,
            color: "text-yellow-600",
            bgColor: "bg-yellow-50"
        },
        {
            label: "On Probation",
            value: stats.probationCount,
            icon: AlertTriangle,
            color: stats.probationCount > 0 ? "text-red-600" : "text-green-600",
            bgColor: stats.probationCount > 0 ? "bg-red-50" : "bg-green-50"
        },
        {
            label: "Approved",
            value: stats.approvedFreelancers,
            icon: Users,
            color: "text-indigo-600",
            bgColor: "bg-indigo-50"
        },
        {
            label: "Pending Review",
            value: stats.pendingReviews,
            icon: Clock,
            color: stats.pendingReviews > 5 ? "text-orange-600" : "text-gray-600",
            bgColor: stats.pendingReviews > 5 ? "bg-orange-50" : "bg-gray-50"
        },
        {
            label: "Disputed",
            value: stats.disputedCount,
            icon: AlertTriangle,
            color: stats.disputedCount > 0 ? "text-red-600" : "text-green-600",
            bgColor: stats.disputedCount > 0 ? "bg-red-50" : "bg-green-50"
        }
    ];

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
            {statCards.map((stat, i) => {
                const Icon = stat.icon;
                return (
                    <Card key={i} className="border-0 shadow-sm">
                        <CardContent className="p-4">
                            <div className={`w-10 h-10 rounded-lg ${stat.bgColor} flex items-center justify-center mb-2`}>
                                <Icon className={`w-5 h-5 ${stat.color}`} />
                            </div>
                            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                            <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}