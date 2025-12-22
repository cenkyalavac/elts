import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mail, Globe, Calendar, AlertCircle } from "lucide-react";

export default function FreelancerPipelineCard({ freelancer, daysInStage, isDragging }) {
    return (
        <Card className={`cursor-pointer hover:shadow-lg transition-all ${
            isDragging ? 'shadow-2xl rotate-2 opacity-90' : ''
        }`}>
            <CardContent className="p-4 space-y-3">
                <div>
                    <h3 className="font-semibold text-sm truncate">{freelancer.full_name}</h3>
                    <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                        <Mail className="w-3 h-3" />
                        <span className="truncate">{freelancer.email}</span>
                    </div>
                </div>

                {freelancer.languages && freelancer.languages.length > 0 && (
                    <div className="flex items-center gap-1 text-xs text-gray-600">
                        <Globe className="w-3 h-3" />
                        <span className="truncate">
                            {freelancer.languages.slice(0, 2).map(l => l.language).join(', ')}
                            {freelancer.languages.length > 2 && ` +${freelancer.languages.length - 2}`}
                        </span>
                    </div>
                )}

                {freelancer.rate && (
                    <div className="text-xs font-medium text-blue-600">
                        {freelancer.rate}
                    </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t">
                    {daysInStage !== null && (
                        <div className={`flex items-center gap-1 text-xs ${
                            daysInStage > 14 ? 'text-red-600' : 'text-gray-500'
                        }`}>
                            <Calendar className="w-3 h-3" />
                            {daysInStage} days
                        </div>
                    )}
                    {freelancer.follow_up_date && new Date(freelancer.follow_up_date) <= new Date() && (
                        <Badge variant="destructive" className="text-xs">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            Follow-up
                        </Badge>
                    )}
                </div>

                {freelancer.assigned_to && (
                    <div className="text-xs text-gray-500">
                        Assigned: {freelancer.assigned_to.split('@')[0]}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}