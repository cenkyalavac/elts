import React from 'react';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Mail, Phone, MapPin, Globe, Award, Calendar, ExternalLink, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../../utils";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

const statusColors = {
    'New': 'bg-blue-100 text-blue-800 border-blue-200',
    'Reviewing': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    'Interview Scheduled': 'bg-purple-100 text-purple-800 border-purple-200',
    'Accepted': 'bg-green-100 text-green-800 border-green-200',
    'Rejected': 'bg-red-100 text-red-800 border-red-200',
    'On Hold': 'bg-gray-100 text-gray-800 border-gray-200'
};

const availabilityColors = {
    'Immediate': 'bg-green-100 text-green-800',
    'Within 1 week': 'bg-blue-100 text-blue-800',
    'Within 2 weeks': 'bg-yellow-100 text-yellow-800',
    'Within 1 month': 'bg-orange-100 text-orange-800',
    'Not available': 'bg-gray-100 text-gray-800'
};

export default function FreelancerCard({ freelancer }) {
    const { data: quizAttempts = [] } = useQuery({
        queryKey: ['quizAttempts', freelancer.id],
        queryFn: () => base44.entities.QuizAttempt.filter({ freelancer_id: freelancer.id }),
    });

    const passedQuizzes = quizAttempts.filter(a => a.passed === true);
    const hasPassedQuiz = passedQuizzes.length > 0;
    const avgScore = quizAttempts.length > 0
        ? Math.round(quizAttempts.reduce((sum, a) => sum + a.percentage, 0) / quizAttempts.length)
        : null;

    return (
        <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="text-lg font-semibold">{freelancer.full_name}</h3>
                        {freelancer.location && (
                            <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                                <MapPin className="w-3 h-3" />
                                {freelancer.location}
                            </div>
                        )}
                    </div>
                    <div className="flex flex-col gap-1 items-end">
                        <Badge className={`${statusColors[freelancer.status]} border`}>
                            {freelancer.status}
                        </Badge>
                        {hasPassedQuiz && (
                            <Badge className="bg-green-100 text-green-800 border-green-200">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Quiz Passed
                            </Badge>
                        )}
                        {avgScore !== null && (
                            <Badge variant="outline" className="text-xs">
                                <Award className="w-3 h-3 mr-1" />
                                {avgScore}% avg
                            </Badge>
                        )}
                    </div>
                </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    {freelancer.email && (
                        <div className="flex items-center gap-2 text-sm">
                            <Mail className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-700">{freelancer.email}</span>
                        </div>
                    )}
                    {freelancer.phone && (
                        <div className="flex items-center gap-2 text-sm">
                            <Phone className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-700">{freelancer.phone}</span>
                        </div>
                    )}
                </div>

                {freelancer.language_pairs && freelancer.language_pairs.length > 0 && (
                    <div>
                        <div className="flex items-center gap-1 text-sm font-medium mb-2">
                            <Globe className="w-4 h-4" />
                            Language Pairs
                        </div>
                        <div className="flex flex-wrap gap-1">
                            {freelancer.language_pairs.slice(0, 3).map((pair, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs">
                                    {pair.source_language} → {pair.target_language}
                                </Badge>
                            ))}
                            {freelancer.language_pairs.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                    +{freelancer.language_pairs.length - 3} more
                                </Badge>
                            )}
                        </div>
                    </div>
                )}

                {freelancer.service_types && freelancer.service_types.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                        {freelancer.service_types.map((service, idx) => (
                            <Badge key={idx} className="bg-indigo-100 text-indigo-800">
                                {service}
                            </Badge>
                        ))}
                    </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t">
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                        {freelancer.experience_years && (
                            <div className="flex items-center gap-1">
                                <Award className="w-4 h-4" />
                                {freelancer.experience_years} years
                            </div>
                        )}
                        {freelancer.language_pairs?.[0]?.rates?.[0] && (
                            <div className="text-sm font-medium text-green-600">
                                ${freelancer.language_pairs[0].rates[0].rate_value}/{freelancer.language_pairs[0].rates[0].rate_type.replace('per_', '')}
                            </div>
                        )}
                        {freelancer.availability && (
                            <Badge className={availabilityColors[freelancer.availability]}>
                                {freelancer.availability}
                            </Badge>
                        )}
                    </div>
                    <Link to={createPageUrl(`FreelancerDetail?id=${freelancer.id}`)}>
                        <Button variant="outline" size="sm">
                            View Details
                            <ExternalLink className="w-3 h-3 ml-2" />
                        </Button>
                    </Link>
                </div>
            </CardContent>
        </Card>
    );
}