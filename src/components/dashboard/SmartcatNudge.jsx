import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { createPageUrl } from "../../utils";
import { AlertTriangle } from "lucide-react";

export default function SmartcatNudge({ freelancers }) {
    const approved = freelancers.filter(f => f.status === 'Approved');
    const missingSmartcat = approved.filter(f => !f.smartcat_supplier_id);

    if (missingSmartcat.length === 0) return null;

    return (
        <Card className="border-l-4 border-l-orange-400 bg-orange-50">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2 text-orange-800">
                    <AlertTriangle className="w-4 h-4" />
                    Smartcat Registration Reminder
                </CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-xs text-orange-700 mb-2">
                    {missingSmartcat.length} approved freelancer{missingSmartcat.length !== 1 ? 's' : ''} without Smartcat ID — they cannot receive payments.
                </p>
                <div className="flex flex-wrap gap-1.5">
                    {missingSmartcat.slice(0, 8).map(f => (
                        <Link key={f.id} to={`${createPageUrl('FreelancerDetail')}?id=${f.id}`}>
                            <Badge variant="outline" className="text-xs hover:bg-orange-100 cursor-pointer">
                                {f.full_name}
                            </Badge>
                        </Link>
                    ))}
                    {missingSmartcat.length > 8 && (
                        <Badge variant="secondary" className="text-xs">
                            +{missingSmartcat.length - 8} more
                        </Badge>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}