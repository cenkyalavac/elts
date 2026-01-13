import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, X, TrendingUp } from "lucide-react";
import { calculateMatchScore } from "../jobs/FreelancerMatch";
import { Link } from "react-router-dom";
import { createPageUrl } from "../../utils";

export default function SmartMatchDialog({ open, onOpenChange, freelancers }) {
    const [criteria, setCriteria] = useState({
        languages: [],
        services: [],
        specializations: [],
        minExperience: '',
        skills: [],
        maxRate: '',
        availability: ''
    });
    const [inputValue, setInputValue] = useState({ languages: '', services: '', specializations: '', skills: '' });

    const addItem = (field, value) => {
        if (value.trim() && !criteria[field].includes(value.trim())) {
            setCriteria(prev => ({
                ...prev,
                [field]: [...prev[field], value.trim()]
            }));
            setInputValue(prev => ({ ...prev, [field]: '' }));
        }
    };

    const removeItem = (field, value) => {
        setCriteria(prev => ({
            ...prev,
            [field]: prev[field].filter(item => item !== value)
        }));
    };

    const matchedFreelancers = useMemo(() => {
        if (!criteria.languages.length && !criteria.services.length && 
            !criteria.specializations.length && !criteria.skills.length) {
            return [];
        }

        // Create a pseudo-job based on criteria
        const pseudoJob = {
            required_languages: criteria.languages.map(lang => ({ language: lang, min_proficiency: 'Professional' })),
            required_service_types: criteria.services,
            required_specializations: criteria.specializations,
            required_skills: criteria.skills,
            min_experience_years: criteria.minExperience ? parseFloat(criteria.minExperience) : 0
        };

        return freelancers
            .filter(f => {
                // Status filter - only show approved or active freelancers
                if (!['Approved', 'Price Negotiation', 'Test Sent'].includes(f.status)) return false;

                // Availability filter
                if (criteria.availability && f.availability !== criteria.availability) return false;

                // Max rate filter - check if freelancer has ANY rate below the max
                if (criteria.maxRate) {
                    const maxRateNum = parseFloat(criteria.maxRate);
                    const hasAffordableRate = f.rates?.some(rate => 
                        rate.rate_value && rate.rate_value <= maxRateNum
                    );
                    if (!hasAffordableRate && f.rates?.length > 0) return false;
                }

                return true;
            })
            .map(freelancer => ({
                freelancer,
                matchData: calculateMatchScore(freelancer, pseudoJob)
            }))
            .filter(({ matchData }) => matchData.score >= 40) // Only show matches above 40%
            .sort((a, b) => b.matchData.score - a.matchData.score)
            .slice(0, 20); // Limit to top 20 matches
    }, [criteria, freelancers]);

    const hasAnyCriteria = criteria.languages.length > 0 || criteria.services.length > 0 || 
                          criteria.specializations.length > 0 || criteria.skills.length > 0;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-2xl">
                        <Sparkles className="w-6 h-6 text-purple-600" />
                        Smart Freelancer Finder
                    </DialogTitle>
                    <DialogDescription>
                        Enter your requirements and we'll find the best matching freelancers
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 mt-4">
                    {/* Languages */}
                    <div>
                        <Label>Languages</Label>
                        <div className="flex gap-2 mt-2">
                            <Input
                                placeholder="e.g. English, Spanish"
                                value={inputValue.languages}
                                onChange={(e) => setInputValue(prev => ({ ...prev, languages: e.target.value }))}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        addItem('languages', inputValue.languages);
                                    }
                                }}
                            />
                            <Button 
                                type="button" 
                                variant="secondary"
                                onClick={() => addItem('languages', inputValue.languages)}
                            >
                                Add
                            </Button>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2">
                            {criteria.languages.map(lang => (
                                <Badge key={lang} variant="secondary" className="gap-1">
                                    {lang}
                                    <X className="w-3 h-3 cursor-pointer" onClick={() => removeItem('languages', lang)} />
                                </Badge>
                            ))}
                        </div>
                    </div>

                    {/* Services */}
                    <div>
                        <Label>Service Types</Label>
                        <div className="flex gap-2 mt-2">
                            <Input
                                placeholder="e.g. Translation, Proofreading"
                                value={inputValue.services}
                                onChange={(e) => setInputValue(prev => ({ ...prev, services: e.target.value }))}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        addItem('services', inputValue.services);
                                    }
                                }}
                            />
                            <Button 
                                type="button" 
                                variant="secondary"
                                onClick={() => addItem('services', inputValue.services)}
                            >
                                Add
                            </Button>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2">
                            {criteria.services.map(service => (
                                <Badge key={service} variant="secondary" className="gap-1">
                                    {service}
                                    <X className="w-3 h-3 cursor-pointer" onClick={() => removeItem('services', service)} />
                                </Badge>
                            ))}
                        </div>
                    </div>

                    {/* Specializations */}
                    <div>
                        <Label>Specializations</Label>
                        <div className="flex gap-2 mt-2">
                            <Input
                                placeholder="e.g. Medical, Legal, IT"
                                value={inputValue.specializations}
                                onChange={(e) => setInputValue(prev => ({ ...prev, specializations: e.target.value }))}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        addItem('specializations', inputValue.specializations);
                                    }
                                }}
                            />
                            <Button 
                                type="button" 
                                variant="secondary"
                                onClick={() => addItem('specializations', inputValue.specializations)}
                            >
                                Add
                            </Button>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2">
                            {criteria.specializations.map(spec => (
                                <Badge key={spec} variant="secondary" className="gap-1">
                                    {spec}
                                    <X className="w-3 h-3 cursor-pointer" onClick={() => removeItem('specializations', spec)} />
                                </Badge>
                            ))}
                        </div>
                    </div>

                    {/* Skills */}
                    <div>
                        <Label>Required Skills</Label>
                        <div className="flex gap-2 mt-2">
                            <Input
                                placeholder="e.g. MemoQ, SDL Trados"
                                value={inputValue.skills}
                                onChange={(e) => setInputValue(prev => ({ ...prev, skills: e.target.value }))}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        addItem('skills', inputValue.skills);
                                    }
                                }}
                            />
                            <Button 
                                type="button" 
                                variant="secondary"
                                onClick={() => addItem('skills', inputValue.skills)}
                            >
                                Add
                            </Button>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2">
                            {criteria.skills.map(skill => (
                                <Badge key={skill} variant="secondary" className="gap-1">
                                    {skill}
                                    <X className="w-3 h-3 cursor-pointer" onClick={() => removeItem('skills', skill)} />
                                </Badge>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        {/* Min Experience */}
                        <div>
                            <Label>Min Experience (years)</Label>
                            <Input
                                type="number"
                                placeholder="e.g. 5"
                                value={criteria.minExperience}
                                onChange={(e) => setCriteria(prev => ({ ...prev, minExperience: e.target.value }))}
                                className="mt-2"
                            />
                        </div>

                        {/* Max Rate */}
                        <div>
                            <Label>Max Rate (USD)</Label>
                            <Input
                                type="number"
                                placeholder="e.g. 0.15"
                                value={criteria.maxRate}
                                onChange={(e) => setCriteria(prev => ({ ...prev, maxRate: e.target.value }))}
                                className="mt-2"
                            />
                        </div>

                        {/* Availability */}
                        <div>
                            <Label>Availability</Label>
                            <select
                                className="w-full mt-2 px-3 py-2 border rounded-md"
                                value={criteria.availability}
                                onChange={(e) => setCriteria(prev => ({ ...prev, availability: e.target.value }))}
                            >
                                <option value="">Any</option>
                                <option value="Immediate">Immediate</option>
                                <option value="Within 1 week">Within 1 week</option>
                                <option value="Within 2 weeks">Within 2 weeks</option>
                                <option value="Within 1 month">Within 1 month</option>
                            </select>
                        </div>
                    </div>

                    {/* Results */}
                    {hasAnyCriteria && (
                        <div className="mt-6 pt-6 border-t">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold flex items-center gap-2">
                                    <TrendingUp className="w-5 h-5 text-green-600" />
                                    Top Matches ({matchedFreelancers.length})
                                </h3>
                            </div>

                            {matchedFreelancers.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    No freelancers match your criteria. Try adjusting your requirements.
                                </div>
                            ) : (
                                <div className="space-y-3 max-h-96 overflow-y-auto">
                                    {matchedFreelancers.map(({ freelancer, matchData }) => (
                                        <Card key={freelancer.id} className="hover:shadow-md transition-shadow">
                                            <CardContent className="p-4">
                                                <div className="flex items-start justify-between gap-4">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <h4 className="font-semibold">{freelancer.full_name}</h4>
                                                            <Badge 
                                                                className={
                                                                    matchData.score >= 80 ? 'bg-green-100 text-green-800' :
                                                                    matchData.score >= 60 ? 'bg-yellow-100 text-yellow-800' :
                                                                    'bg-orange-100 text-orange-800'
                                                                }
                                                            >
                                                                {matchData.score}% Match
                                                            </Badge>
                                                        </div>
                                                        <div className="text-sm text-gray-600 space-y-1">
                                                            {freelancer.location && <div>📍 {freelancer.location}</div>}
                                                            {freelancer.experience_years && <div>💼 {freelancer.experience_years} years experience</div>}
                                                            {freelancer.availability && <div>⏰ {freelancer.availability}</div>}
                                                        </div>
                                                    </div>
                                                    <Link to={createPageUrl(`FreelancerDetail?id=${freelancer.id}`)}>
                                                        <Button size="sm" variant="outline">
                                                            View Profile
                                                        </Button>
                                                    </Link>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}