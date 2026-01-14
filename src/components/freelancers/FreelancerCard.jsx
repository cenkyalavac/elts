import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Mail, Phone, MapPin, Globe, Award, Calendar, ExternalLink, CheckCircle, Eye } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../../utils";
import { FreelancerRatesUSD } from "../utils/CurrencyConverter";

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

export default function FreelancerCard({ freelancer, onQuickView, allQuizAttempts = [] }) {
    // Use memoized quiz data from props instead of separate queries
    const { hasPassedQuiz, avgScore } = useMemo(() => {
        const quizAttempts = allQuizAttempts.filter(a => a.freelancer_id === freelancer.id);
        const passedQuizzes = quizAttempts.filter(a => a.passed === true);
        const hasPassedQuiz = passedQuizzes.length > 0;
        const avgScore = quizAttempts.length > 0
            ? Math.round(quizAttempts.reduce((sum, a) => sum + a.percentage, 0) / quizAttempts.length)
            : null;
        return { hasPassedQuiz, avgScore };
    }, [freelancer.id, allQuizAttempts]);

    return (
        <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="text-lg font-semibold">{freelancer.full_name}</h3>
                            {freelancer.resource_type === 'Agency' && (
                                <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                                    Agency
                                </Badge>
                            )}
                        </div>
                        {freelancer.resource_type === 'Agency' && freelancer.company_name && (
                            <div className="text-sm font-medium text-purple-600 mt-0.5">
                                {freelancer.company_name}
                            </div>
                        )}
                        {freelancer.location && (
                            <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                                <MapPin className="w-3 h-3" />
                                {freelancer.location}
                            </div>
                        )}
                    </div>
                    <div className="flex flex-col gap-1.5 items-end">
                        <Badge className={`${statusColors[freelancer.status]} border`}>
                            {freelancer.status}
                        </Badge>
                        {hasPassedQuiz && (
                            <Badge className="bg-green-500 text-white">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                {avgScore}%
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
                        <FreelancerRatesUSD freelancer={freelancer} compact={true} />
                        {freelancer.availability && (
                            <Badge className={availabilityColors[freelancer.availability]}>
                                {freelancer.availability}
                            </Badge>
                        )}
                    </div>
                    <div className="flex gap-2">
                        {onQuickView && (
                            <Button variant="ghost" size="sm" onClick={() => onQuickView(freelancer)}>
                                <Eye className="w-4 h-4" />
                            </Button>
                        )}
                        <Link to={createPageUrl(`FreelancerDetail?id=${encodeURIComponent(freelancer.id)}`)}>
                            <Button variant="outline" size="sm">
                                View Details
                                <ExternalLink className="w-3 h-3 ml-2" />
                            </Button>
                        </Link>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}