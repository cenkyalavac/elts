import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, X, TrendingUp, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../../utils";
import { normalizeLanguage, getLanguageName } from "../../utils/languageUtils";

export default function SmartMatchDialog({ open, onOpenChange, freelancers }) {

    const [criteria, setCriteria] = useState({
        languagePairs: [],
        services: [],
        specializations: [],
        minExperience: '',
        skills: [],
        maxRate: '',
        availability: ''
    });
    const [inputValue, setInputValue] = useState({ 
        sourceLanguage: '', 
        targetLanguage: '',
        services: '', 
        specializations: '', 
        skills: '' 
    });

    const addLanguagePair = () => {
        const source = normalizeLanguage(inputValue.sourceLanguage.trim());
        const target = normalizeLanguage(inputValue.targetLanguage.trim());
        if (source && target) {
            const pair = `${source} → ${target}`;
            if (!criteria.languagePairs.includes(pair)) {
                setCriteria(prev => ({
                    ...prev,
                    languagePairs: [...prev.languagePairs, pair]
                }));
                setInputValue(prev => ({ ...prev, sourceLanguage: '', targetLanguage: '' }));
            }
        }
    };

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
        if (!criteria.languagePairs.length && !criteria.services.length && 
            !criteria.specializations.length && !criteria.skills.length) {
            return [];
        }

        return freelancers
            .filter(f => {
                // Status filter
                if (!['Approved', 'Price Negotiation', 'Test Sent'].includes(f.status)) return false;

                // Language pairs filter
                if (criteria.languagePairs.length > 0) {
                    const freelancerPairs = f.language_pairs?.map(p => 
                        `${normalizeLanguage(p.source_language)} → ${normalizeLanguage(p.target_language)}`
                    ) || [];
                    const hasMatch = criteria.languagePairs.some(pair => {
                        return freelancerPairs.includes(pair);
                    });
                    if (!hasMatch) return false;
                }

                // Services filter
                if (criteria.services.length > 0) {
                    const hasMatch = criteria.services.some(service => 
                        f.service_types?.includes(service)
                    );
                    if (!hasMatch) return false;
                }

                // Specializations filter
                if (criteria.specializations.length > 0) {
                    const hasMatch = criteria.specializations.some(spec => 
                        f.specializations?.includes(spec)
                    );
                    if (!hasMatch) return false;
                }

                // Skills filter
                if (criteria.skills.length > 0) {
                    const hasMatch = criteria.skills.some(skill => 
                        f.skills?.includes(skill) || f.software?.includes(skill)
                    );
                    if (!hasMatch) return false;
                }

                // Experience filter
                if (criteria.minExperience) {
                    const minExp = parseFloat(criteria.minExperience);
                    if (!f.experience_years || f.experience_years < minExp) return false;
                }

                // Availability filter
                if (criteria.availability && f.availability !== criteria.availability) return false;

                // Max rate filter
                if (criteria.maxRate) {
                    const maxRateNum = parseFloat(criteria.maxRate);
                    const hasAffordableRate = f.rates?.some(rate => 
                        rate.rate_value && rate.rate_value <= maxRateNum
                    );
                    if (!hasAffordableRate && f.rates?.length > 0) return false;
                }

                return true;
            })
            .map(freelancer => {
                // Calculate match score
                let score = 100;
                
                return {
                    freelancer,
                    score
                };
            })
            .sort((a, b) => b.score - a.score)
            .slice(0, 20);
    }, [criteria, freelancers]);

    const hasAnyCriteria = criteria.languagePairs.length > 0 || criteria.services.length > 0 || 
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
                    {/* Language Pairs */}
                    <div>
                        <Label>Language Pairs</Label>
                        <div className="flex gap-2 mt-2">
                            <Input
                                placeholder="Source (e.g. English)"
                                value={inputValue.sourceLanguage}
                                onChange={(e) => setInputValue(prev => ({ ...prev, sourceLanguage: e.target.value }))}
                                className="flex-1"
                            />
                            <ArrowRight className="w-4 h-4 mt-2 text-gray-400" />
                            <Input
                                placeholder="Target (e.g. French)"
                                value={inputValue.targetLanguage}
                                onChange={(e) => setInputValue(prev => ({ ...prev, targetLanguage: e.target.value }))}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        addLanguagePair();
                                    }
                                }}
                                className="flex-1"
                            />
                            <Button 
                                type="button" 
                                variant="secondary"
                                onClick={addLanguagePair}
                            >
                                Add
                            </Button>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2">
                            {criteria.languagePairs.map(pair => {
                                const [source, target] = pair.split(' → ');
                                return (
                                    <Badge key={pair} variant="secondary" className="gap-1">
                                        {getLanguageName(source)} → {getLanguageName(target)}
                                        <X className="w-3 h-3 cursor-pointer" onClick={() => removeItem('languagePairs', pair)} />
                                    </Badge>
                                );
                            })}
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
                                    Matched Freelancers ({matchedFreelancers.length})
                                </h3>
                            </div>

                            {matchedFreelancers.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    No freelancers match your criteria. Try adjusting your requirements.
                                </div>
                            ) : (
                                <div className="space-y-3 max-h-96 overflow-y-auto">
                                    {matchedFreelancers.map(({ freelancer }) => (
                                        <Card key={freelancer.id} className="hover:shadow-md transition-shadow">
                                            <CardContent className="p-4">
                                                <div className="flex items-start justify-between gap-4">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <h4 className="font-semibold">{freelancer.full_name}</h4>
                                                            <Badge className="bg-green-100 text-green-800">
                                                                Match
                                                            </Badge>
                                                        </div>
                                                        <div className="text-sm text-gray-600 space-y-1">
                                                            {freelancer.location && <div>📍 {freelancer.location}</div>}
                                                            {freelancer.experience_years && <div>💼 {freelancer.experience_years} years experience</div>}
                                                            {freelancer.availability && <div>⏰ {freelancer.availability}</div>}
                                                            {freelancer.language_pairs?.slice(0, 2).map((pair, idx) => (
                                                                <div key={idx}>
                                                                    🌐 {getLanguageName(normalizeLanguage(pair.source_language))} → {getLanguageName(normalizeLanguage(pair.target_language))}
                                                                </div>
                                                            ))}
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