import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Mail, Phone, MapPin, ExternalLink, CheckCircle, XCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../../utils";

const proficiencyScore = {
    'Intermediate': 1,
    'Professional': 2,
    'Fluent': 3,
    'Native': 4
};

export function calculateMatchScore(freelancer, job) {
    let totalScore = 0;
    let maxScore = 0;
    const details = [];

    // Languages matching (40% weight)
    if (job.required_languages?.length > 0) {
        maxScore += 40;
        const freelancerLangs = freelancer.languages || [];
        let langScore = 0;
        
        job.required_languages.forEach(reqLang => {
            const match = freelancerLangs.find(fl => fl.language === reqLang.language);
            if (match) {
                const reqScore = proficiencyScore[reqLang.min_proficiency] || 0;
                const freelancerScore = proficiencyScore[match.proficiency] || 0;
                if (freelancerScore >= reqScore) {
                    langScore += 40 / job.required_languages.length;
                    details.push({ type: 'match', text: `✓ ${reqLang.language} (${match.proficiency})` });
                } else {
                    details.push({ type: 'partial', text: `~ ${reqLang.language} (needs ${reqLang.min_proficiency}, has ${match.proficiency})` });
                }
            } else {
                details.push({ type: 'miss', text: `✗ Missing ${reqLang.language}` });
            }
        });
        totalScore += langScore;
    }

    // Service types (20% weight)
    if (job.required_service_types?.length > 0) {
        maxScore += 20;
        const freelancerServices = freelancer.service_types || [];
        const matchingServices = job.required_service_types.filter(s => freelancerServices.includes(s));
        totalScore += (matchingServices.length / job.required_service_types.length) * 20;
        
        if (matchingServices.length > 0) {
            details.push({ type: 'match', text: `✓ Services: ${matchingServices.join(', ')}` });
        }
    }

    // Specializations (20% weight)
    if (job.required_specializations?.length > 0) {
        maxScore += 20;
        const freelancerSpecs = freelancer.specializations || [];
        const matchingSpecs = job.required_specializations.filter(s => freelancerSpecs.includes(s));
        totalScore += (matchingSpecs.length / job.required_specializations.length) * 20;
        
        if (matchingSpecs.length > 0) {
            details.push({ type: 'match', text: `✓ Specializations: ${matchingSpecs.join(', ')}` });
        } else if (job.required_specializations.length > 0) {
            details.push({ type: 'miss', text: `✗ Missing specializations` });
        }
    }

    // Experience (10% weight)
    if (job.min_experience_years) {
        maxScore += 10;
        if (freelancer.experience_years >= job.min_experience_years) {
            totalScore += 10;
            details.push({ type: 'match', text: `✓ ${freelancer.experience_years} years experience` });
        } else {
            details.push({ type: 'miss', text: `✗ Only ${freelancer.experience_years || 0} years (needs ${job.min_experience_years})` });
        }
    }

    // Skills (10% weight)
    if (job.required_skills?.length > 0) {
        maxScore += 10;
        const freelancerSkills = freelancer.skills || [];
        const matchingSkills = job.required_skills.filter(s => 
            freelancerSkills.some(fs => fs.toLowerCase().includes(s.toLowerCase()))
        );
        totalScore += (matchingSkills.length / job.required_skills.length) * 10;
        
        if (matchingSkills.length > 0) {
            details.push({ type: 'match', text: `✓ Skills: ${matchingSkills.join(', ')}` });
        }
    }

    const finalScore = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;
    return { score: finalScore, details };
}

export default function FreelancerMatch({ freelancer, job }) {
    const { score, details } = calculateMatchScore(freelancer, job);

    const getScoreColor = (score) => {
        if (score >= 80) return 'text-green-600 bg-green-50';
        if (score >= 60) return 'text-yellow-600 bg-yellow-50';
        return 'text-red-600 bg-red-50';
    };

    const getProgressColor = (score) => {
        if (score >= 80) return 'bg-green-600';
        if (score >= 60) return 'bg-yellow-600';
        return 'bg-red-600';
    };

    return (
        <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
                <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                        <h3 className="text-lg font-semibold">{freelancer.full_name}</h3>
                        {freelancer.location && (
                            <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                                <MapPin className="w-3 h-3" />
                                {freelancer.location}
                            </div>
                        )}
                    </div>
                    <div className={`text-right px-4 py-2 rounded-lg ${getScoreColor(score)}`}>
                        <div className="text-2xl font-bold">{score}%</div>
                        <div className="text-xs font-medium">Match</div>
                    </div>
                </div>

                <Progress 
                    value={score} 
                    className="h-2 mb-4"
                    indicatorClassName={getProgressColor(score)}
                />

                <div className="space-y-2 mb-4">
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

                <div className="mb-4">
                    <div className="text-sm font-medium mb-2">Match Details:</div>
                    <div className="space-y-1 text-sm">
                        {details.map((detail, idx) => (
                            <div 
                                key={idx} 
                                className={`flex items-start gap-2 ${
                                    detail.type === 'match' ? 'text-green-700' : 
                                    detail.type === 'partial' ? 'text-yellow-700' : 
                                    'text-red-700'
                                }`}
                            >
                                {detail.type === 'match' ? <CheckCircle className="w-4 h-4 mt-0.5" /> :
                                 detail.type === 'miss' ? <XCircle className="w-4 h-4 mt-0.5" /> : 
                                 <div className="w-4 h-4 mt-0.5">~</div>}
                                <span>{detail.text}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <Link to={createPageUrl(`FreelancerDetail?id=${freelancer.id}`)}>
                    <Button variant="outline" className="w-full">
                        View Full Profile
                        <ExternalLink className="w-4 h-4 ml-2" />
                    </Button>
                </Link>
            </CardContent>
        </Card>
    );
}