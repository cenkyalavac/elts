import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, Award, MapPin } from "lucide-react";

export default function PositionCard({ position, onApply }) {
    return (
        <Card className="bg-white/5 border-white/10 hover:border-purple-500/30 transition-all group">
            <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                    <CardTitle className="text-lg text-white group-hover:text-purple-200 transition-colors">{position.title}</CardTitle>
                    {position.priority === 'high' && (
                        <Badge className="bg-red-500/20 text-red-300 border-red-500/30 text-xs">Urgent</Badge>
                    )}
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {position.description && (
                    <p className="text-gray-400 text-sm line-clamp-3">{position.description}</p>
                )}

                {position.language_pairs?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                        {position.language_pairs.map((pair, idx) => (
                            <Badge key={idx} className="bg-white/5 border-white/10 text-gray-300 text-xs">
                                {pair.source_language} → {pair.target_language}
                            </Badge>
                        ))}
                    </div>
                )}

                {position.required_service_types?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                        {position.required_service_types.map((service, idx) => (
                            <Badge key={idx} className="bg-purple-500/10 text-purple-300 border-purple-500/20 text-xs">
                                {service}
                            </Badge>
                        ))}
                    </div>
                )}

                <div className="flex items-center justify-between pt-2">
                    <div className="flex gap-3 text-xs text-gray-500">
                        {position.min_experience_years && (
                            <span className="flex items-center gap-1">
                                <Award className="w-3 h-3" />
                                {position.min_experience_years}+ years
                            </span>
                        )}
                        {position.location_type && (
                            <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {position.location_type}
                            </span>
                        )}
                    </div>
                    <Button
                        size="sm"
                        className="bg-purple-600/80 hover:bg-purple-600 text-white"
                        onClick={() => onApply(position)}
                    >
                        Apply <ArrowRight className="w-3 h-3 ml-1" />
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}