import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../../utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
    AlertTriangle, AlertCircle, Clock, ArrowRight, 
    TrendingDown, Shield, FileWarning
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function QualityAlerts({ 
    probationFreelancers = [], 
    disputedReports = [], 
    pendingReviews = [],
    lowScoreFreelancers = []
}) {
    const alerts = [
        // Probation freelancers
        ...probationFreelancers.map(f => ({
            type: 'probation',
            severity: 'high',
            icon: TrendingDown,
            title: `${f.full_name} probasyonda`,
            description: `Combined Score: ${f.combinedScore?.toFixed(1) || 'N/A'}`,
            link: createPageUrl(`FreelancerDetail?id=${f.id}`),
            date: f.updated_date
        })),
        // Disputed reports
        ...disputedReports.map(r => ({
            type: 'disputed',
            severity: 'high',
            icon: FileWarning,
            title: `İtiraz edilmiş rapor`,
            description: `${r.freelancerName} - ${r.project_name || 'Proje'}`,
            link: createPageUrl(`QualityReportDetail?id=${r.id}`),
            date: r.updated_date
        })),
        // Pending reviews
        ...pendingReviews.slice(0, 5).map(r => ({
            type: 'pending',
            severity: 'medium',
            icon: Clock,
            title: `İnceleme bekliyor`,
            description: `${r.freelancerName} - ${r.report_type}`,
            link: createPageUrl(`QualityReportDetail?id=${r.id}`),
            date: r.created_date
        })),
        // Low score freelancers
        ...lowScoreFreelancers.slice(0, 3).map(f => ({
            type: 'lowscore',
            severity: 'medium',
            icon: AlertCircle,
            title: `Düşük kalite skoru`,
            description: `${f.full_name}: ${f.combinedScore?.toFixed(1)}`,
            link: createPageUrl(`FreelancerDetail?id=${f.id}&tab=quality`),
            date: f.updated_date
        }))
    ].sort((a, b) => {
        if (a.severity === 'high' && b.severity !== 'high') return -1;
        if (a.severity !== 'high' && b.severity === 'high') return 1;
        return new Date(b.date) - new Date(a.date);
    }).slice(0, 8);

    const criticalCount = alerts.filter(a => a.severity === 'high').length;

    return (
        <Card className={criticalCount > 0 ? 'border-red-200' : ''}>
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <AlertTriangle className={`w-5 h-5 ${criticalCount > 0 ? 'text-red-500' : 'text-yellow-500'}`} />
                        Kritik Uyarılar
                        {criticalCount > 0 && (
                            <Badge className="bg-red-500">{criticalCount}</Badge>
                        )}
                    </div>
                    <Link to={createPageUrl('QualityManagement')}>
                        <Button variant="ghost" size="sm">
                            Tümünü Gör <ArrowRight className="w-4 h-4 ml-1" />
                        </Button>
                    </Link>
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 max-h-80 overflow-y-auto">
                {alerts.length === 0 ? (
                    <div className="text-center py-6 text-gray-500">
                        <Shield className="w-10 h-10 mx-auto mb-2 text-green-500" />
                        <p className="text-sm">Kritik uyarı yok</p>
                    </div>
                ) : (
                    alerts.map((alert, i) => {
                        const Icon = alert.icon;
                        return (
                            <Link 
                                key={`${alert.type}-${i}`} 
                                to={alert.link}
                                className={`flex items-start gap-3 p-3 rounded-lg border transition hover:shadow-sm ${
                                    alert.severity === 'high' 
                                        ? 'bg-red-50 border-red-200 hover:bg-red-100' 
                                        : 'bg-yellow-50 border-yellow-200 hover:bg-yellow-100'
                                }`}
                            >
                                <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                                    alert.severity === 'high' ? 'text-red-500' : 'text-yellow-600'
                                }`} />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900">{alert.title}</p>
                                    <p className="text-xs text-gray-600 truncate">{alert.description}</p>
                                    {alert.date && (
                                        <p className="text-xs text-gray-400 mt-1">
                                            {formatDistanceToNow(new Date(alert.date), { addSuffix: true })}
                                        </p>
                                    )}
                                </div>
                            </Link>
                        );
                    })
                )}
            </CardContent>
        </Card>
    );
}