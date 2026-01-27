import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Mail, Eye } from 'lucide-react';

const STATUS_COLORS = {
    'New Application': 'bg-blue-100 text-blue-800',
    'Form Sent': 'bg-purple-100 text-purple-800',
    'Price Negotiation': 'bg-yellow-100 text-yellow-800',
    'Test Sent': 'bg-indigo-100 text-indigo-800',
    'Approved': 'bg-green-100 text-green-800',
    'On Hold': 'bg-gray-100 text-gray-800',
    'Rejected': 'bg-red-100 text-red-800',
    'Red Flag': 'bg-orange-100 text-orange-800'
};

export default function FreelancerMobileCard({ freelancer }) {
    return (
        <Card className="bg-white shadow-sm">
            <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                            {freelancer.full_name?.charAt(0)?.toUpperCase() || 'F'}
                        </div>
                        <div className="min-w-0">
                            <h3 className="font-semibold text-gray-900 truncate">
                                {freelancer.full_name}
                            </h3>
                        </div>
                    </div>
                    <Badge className={`${STATUS_COLORS[freelancer.status] || 'bg-gray-100 text-gray-800'} flex-shrink-0`}>
                        {freelancer.status}
                    </Badge>
                </div>
            </CardHeader>

            <CardContent className="space-y-3 pb-3">
                {/* Native Language */}
                {freelancer.native_language && (
                    <div className="text-sm">
                        <span className="text-gray-500">Native:</span>{' '}
                        <span className="font-medium">{freelancer.native_language}</span>
                    </div>
                )}

                {/* Service Types */}
                {freelancer.service_types?.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                        {freelancer.service_types.slice(0, 3).map((service, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                                {service}
                            </Badge>
                        ))}
                        {freelancer.service_types.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                                +{freelancer.service_types.length - 3}
                            </Badge>
                        )}
                    </div>
                )}

                {/* Email */}
                {freelancer.email && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Mail className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{freelancer.email}</span>
                    </div>
                )}
            </CardContent>

            <CardFooter className="pt-0">
                <Link to={createPageUrl('FreelancerDetail') + `?id=${encodeURIComponent(freelancer.id)}`} className="w-full">
                    <Button variant="outline" className="w-full">
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                    </Button>
                </Link>
            </CardFooter>
        </Card>
    );
}