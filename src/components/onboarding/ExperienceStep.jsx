import React from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { HelpCircle, Award } from "lucide-react";

export default function ExperienceStep({ formData, updateFormData }) {
    return (
        <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-2">
                    <Award className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                        <p className="text-sm font-medium text-blue-900 mb-1">Your Background</p>
                        <p className="text-sm text-blue-800">
                            Share your professional experience and educational background.
                        </p>
                    </div>
                </div>
            </div>

            <div>
                <div className="flex items-center gap-2 mb-2">
                    <Label htmlFor="experience_years">Years of Experience</Label>
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger>
                                <HelpCircle className="w-4 h-4 text-gray-400" />
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Total years working professionally in translation/interpretation</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
                <Input
                    id="experience_years"
                    type="number"
                    min="0"
                    step="0.5"
                    value={formData.experience_years}
                    onChange={(e) => updateFormData({ experience_years: parseFloat(e.target.value) || '' })}
                    placeholder="e.g., 5"
                />
                <p className="text-xs text-gray-500 mt-1">
                    Enter 0.5 for 6 months, 1 for 1 year, 1.5 for 18 months, etc.
                </p>
            </div>

            <div>
                <div className="flex items-center gap-2 mb-2">
                    <Label htmlFor="education">Education</Label>
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger>
                                <HelpCircle className="w-4 h-4 text-gray-400" />
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                                <p>Relevant degrees, diplomas, or courses in languages, translation, or related fields</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
                <Textarea
                    id="education"
                    value={formData.education}
                    onChange={(e) => updateFormData({ education: e.target.value })}
                    placeholder="e.g., Master's in Translation Studies, University of Barcelona (2018)"
                    className="h-24"
                />
                <p className="text-xs text-gray-500 mt-1">
                    Include degree, institution, and year. You can list multiple qualifications.
                </p>
            </div>
        </div>
    );
}