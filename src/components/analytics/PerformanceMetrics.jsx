import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Zap } from "lucide-react";

export default function PerformanceMetrics({ freelancers }) {
    // Calculate performance metrics
    const averageRating = freelancers.reduce((sum, f) => sum + (f.resource_rating || 0), 0) / freelancers.length || 0;
    const testedCount = freelancers.filter(f => f.tested).length;
    const certifiedCount = freelancers.filter(f => f.certified).length;
    const ndaCount = freelancers.filter(f => f.nda).length;
    
    // Time to approval metric
    const approvedFreelancers = freelancers.filter(f => f.status === 'Approved');
    const avgTimeToApproval = approvedFreelancers.length > 0
        ? approvedFreelancers.reduce((sum, f) => {
            if (!f.stage_changed_date) return sum;
            const days = Math.floor((new Date(f.stage_changed_date) - new Date(f.created_date)) / (1000 * 60 * 60 * 24));
            return sum + days;
        }, 0) / approvedFreelancers.length
        : 0;
    
    // Average experience
    const avgExperience = freelancers.reduce((sum, f) => sum + (f.experience_years || 0), 0) / freelancers.length || 0;
    
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-white">
                <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                        <div>
                            <div className="text-2xl font-bold text-blue-900 mb-1">{averageRating.toFixed(1)}/100</div>
                            <div className="text-sm font-medium text-blue-700">Avg Rating</div>
                        </div>
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <Zap className="w-5 h-5 text-blue-600" />
                        </div>
                    </div>
                </CardContent>
            </Card>
            
            <Card className="border-0 shadow-sm bg-gradient-to-br from-green-50 to-white">
                <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                        <div>
                            <div className="text-2xl font-bold text-green-900 mb-1">{testedCount}</div>
                            <div className="text-sm font-medium text-green-700">Tested</div>
                        </div>
                        <Badge className="bg-green-200 text-green-800">{((testedCount / freelancers.length) * 100).toFixed(0)}%</Badge>
                    </div>
                </CardContent>
            </Card>
            
            <Card className="border-0 shadow-sm bg-gradient-to-br from-purple-50 to-white">
                <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                        <div>
                            <div className="text-2xl font-bold text-purple-900 mb-1">{certifiedCount}</div>
                            <div className="text-sm font-medium text-purple-700">Certified</div>
                        </div>
                        <Badge className="bg-purple-200 text-purple-800">{((certifiedCount / freelancers.length) * 100).toFixed(0)}%</Badge>
                    </div>
                </CardContent>
            </Card>
            
            <Card className="border-0 shadow-sm bg-gradient-to-br from-orange-50 to-white">
                <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                        <div>
                            <div className="text-2xl font-bold text-orange-900 mb-1">{Math.round(avgTimeToApproval)}</div>
                            <div className="text-sm font-medium text-orange-700">Avg Days to Approval</div>
                        </div>
                        <div className="p-2 bg-orange-100 rounded-lg">
                            <Zap className="w-5 h-5 text-orange-600" />
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}