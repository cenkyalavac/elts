import React from 'react';
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ExternalLink, User, Mail, Globe, Star, Languages, CheckCircle2, XCircle } from "lucide-react";

export default function SmartcatProfileSection({ freelancerEmail }) {
    const { data: smartcatProfile, isLoading, error } = useQuery({
        queryKey: ['smartcatProfile', freelancerEmail],
        queryFn: async () => {
            const response = await base44.functions.invoke('smartcat', {
                action: 'searchLinguist',
                email: freelancerEmail
            });
            return response.data?.data;
        },
        enabled: !!freelancerEmail,
        staleTime: 300000, // 5 minutes
        retry: 1,
    });

    if (isLoading) {
        return (
            <Card className="border-0 shadow-sm">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded bg-orange-100 flex items-center justify-center">
                            <span className="text-orange-600 font-bold text-sm">SC</span>
                        </div>
                        Smartcat Profile
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-24 w-full" />
                </CardContent>
            </Card>
        );
    }

    if (error || !smartcatProfile) {
        return (
            <Card className="border-0 shadow-sm">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded bg-orange-100 flex items-center justify-center">
                            <span className="text-orange-600 font-bold text-sm">SC</span>
                        </div>
                        Smartcat Profile
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-3 text-gray-500">
                        <XCircle className="w-5 h-5" />
                        <span>No Smartcat profile found for this email</span>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="border-0 shadow-sm bg-gradient-to-br from-orange-50 to-white">
            <CardHeader>
                <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded bg-orange-100 flex items-center justify-center">
                            <span className="text-orange-600 font-bold text-sm">SC</span>
                        </div>
                        Smartcat Profile
                    </div>
                    <Badge className="bg-green-100 text-green-700 border-0">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Linked
                    </Badge>
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-start gap-4">
                    {smartcatProfile.profilePicture ? (
                        <img 
                            src={smartcatProfile.profilePicture} 
                            alt={smartcatProfile.name}
                            className="w-16 h-16 rounded-full object-cover border-2 border-orange-200"
                        />
                    ) : (
                        <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center">
                            <User className="w-8 h-8 text-orange-600" />
                        </div>
                    )}
                    <div className="flex-1">
                        <h3 className="font-semibold text-lg">{smartcatProfile.name || smartcatProfile.displayName}</h3>
                        <p className="text-gray-600 text-sm flex items-center gap-1">
                            <Mail className="w-4 h-4" />
                            {smartcatProfile.email}
                        </p>
                        {smartcatProfile.id && (
                            <p className="text-gray-400 text-xs mt-1">ID: {smartcatProfile.id}</p>
                        )}
                    </div>
                </div>

                {/* Language Pairs */}
                {smartcatProfile.languagePairs && smartcatProfile.languagePairs.length > 0 && (
                    <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                            <Languages className="w-4 h-4" />
                            Language Pairs
                        </h4>
                        <div className="flex flex-wrap gap-2">
                            {smartcatProfile.languagePairs.map((pair, idx) => (
                                <Badge key={idx} variant="outline" className="bg-white">
                                    {pair.sourceLanguage} → {pair.targetLanguage}
                                </Badge>
                            ))}
                        </div>
                    </div>
                )}

                {/* Services */}
                {smartcatProfile.services && smartcatProfile.services.length > 0 && (
                    <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Services</h4>
                        <div className="flex flex-wrap gap-2">
                            {smartcatProfile.services.map((service, idx) => (
                                <Badge key={idx} className="bg-orange-100 text-orange-700 border-0">
                                    {service}
                                </Badge>
                            ))}
                        </div>
                    </div>
                )}

                {/* Rating */}
                {smartcatProfile.rating && (
                    <div className="flex items-center gap-2">
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        <span className="font-medium">{smartcatProfile.rating.toFixed(1)}</span>
                        <span className="text-gray-500 text-sm">
                            ({smartcatProfile.jobsCompleted || 0} jobs completed)
                        </span>
                    </div>
                )}

                {/* External Link */}
                {smartcatProfile.externalProfileUrl && (
                    <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => window.open(smartcatProfile.externalProfileUrl, '_blank')}
                    >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        View Full Smartcat Profile
                    </Button>
                )}
            </CardContent>
        </Card>
    );
}