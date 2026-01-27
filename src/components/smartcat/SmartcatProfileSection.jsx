import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { ExternalLink, User, Mail, Globe, Star, Languages, CheckCircle2, XCircle, Edit2, Save, X } from "lucide-react";
import { toast } from "sonner";

export default function SmartcatProfileSection({ freelancerEmail, freelancerId, smartcatSupplierId, onUpdate }) {
    const queryClient = useQueryClient();
    const [isEditingId, setIsEditingId] = useState(false);
    const [editedSupplierId, setEditedSupplierId] = useState(smartcatSupplierId || '');
    
    // Mutation to update freelancer's smartcat_supplier_id
    const updateSupplierIdMutation = useMutation({
        mutationFn: async (newId) => {
            return base44.entities.Freelancer.update(freelancerId, {
                smartcat_supplier_id: newId || null
            });
        },
        onSuccess: () => {
            toast.success('Smartcat Supplier ID updated');
            queryClient.invalidateQueries({ queryKey: ['freelancer', freelancerId] });
            setIsEditingId(false);
            if (onUpdate) onUpdate();
        },
        onError: (error) => {
            toast.error(`Failed to update: ${error.message}`);
        }
    });
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
                        {(smartcatProfile.id || smartcatSupplierId) && (
                            <p className="text-gray-400 text-xs mt-1">
                                ID: {smartcatSupplierId || smartcatProfile.id}
                            </p>
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

                {/* Smartcat Supplier ID */}
                {freelancerId && (
                    <div className="pt-3 border-t">
                        <div className="flex items-center justify-between mb-2">
                            <Label className="text-xs text-gray-500">Smartcat Supplier ID</Label>
                            {!isEditingId && (
                                <Button variant="ghost" size="sm" className="h-6 px-2" onClick={() => setIsEditingId(true)}>
                                    <Edit2 className="w-3 h-3" />
                                </Button>
                            )}
                        </div>
                        {isEditingId ? (
                            <div className="flex gap-2">
                                <Input 
                                    value={editedSupplierId}
                                    onChange={(e) => setEditedSupplierId(e.target.value)}
                                    placeholder="Enter Smartcat ID..."
                                    className="h-8 text-sm"
                                />
                                <Button 
                                    size="sm" 
                                    className="h-8"
                                    onClick={() => updateSupplierIdMutation.mutate(editedSupplierId)}
                                    disabled={updateSupplierIdMutation.isPending}
                                >
                                    <Save className="w-3 h-3" />
                                </Button>
                                <Button 
                                    size="sm" 
                                    variant="ghost"
                                    className="h-8"
                                    onClick={() => {
                                        setIsEditingId(false);
                                        setEditedSupplierId(smartcatSupplierId || '');
                                    }}
                                >
                                    <X className="w-3 h-3" />
                                </Button>
                            </div>
                        ) : (
                            <p className="text-sm font-mono">
                                {smartcatSupplierId || <span className="text-gray-400 italic">Not set</span>}
                            </p>
                        )}
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