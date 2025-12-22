import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { HelpCircle, Plus, X, Briefcase } from "lucide-react";

export default function ServicesStep({ formData, updateFormData }) {
    const [newSpec, setNewSpec] = useState('');

    const serviceTypes = [
        { value: "Translation", description: "Written text conversion between languages" },
        { value: "Interpretation", description: "Real-time spoken language conversion" },
        { value: "Proofreading", description: "Review and correction of translated text" },
        { value: "Localization", description: "Cultural adaptation of content" },
        { value: "Transcription", description: "Converting audio/video to text" },
        { value: "Subtitling", description: "Creating subtitles for video content" }
    ];

    const toggleServiceType = (service) => {
        const current = formData.service_types || [];
        updateFormData({
            service_types: current.includes(service)
                ? current.filter(s => s !== service)
                : [...current, service]
        });
    };

    const addSpecialization = () => {
        if (newSpec.trim()) {
            updateFormData({
                specializations: [...(formData.specializations || []), newSpec.trim()]
            });
            setNewSpec('');
        }
    };

    const removeSpecialization = (index) => {
        updateFormData({
            specializations: formData.specializations.filter((_, i) => i !== index)
        });
    };

    return (
        <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-2">
                    <Briefcase className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                        <p className="text-sm font-medium text-blue-900 mb-1">Your Services</p>
                        <p className="text-sm text-blue-800">
                            Select the types of services you offer and any specializations you have.
                        </p>
                    </div>
                </div>
            </div>

            <div>
                <div className="flex items-center gap-2 mb-3">
                    <Label>Service Types *</Label>
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger>
                                <HelpCircle className="w-4 h-4 text-gray-400" />
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Select all types of services you can provide</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {serviceTypes.map(service => (
                        <div
                            key={service.value}
                            onClick={() => toggleServiceType(service.value)}
                            className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                                formData.service_types?.includes(service.value)
                                    ? 'border-blue-500 bg-blue-50'
                                    : 'border-gray-200 hover:border-blue-300'
                            }`}
                        >
                            <div className="flex items-start justify-between">
                                <div>
                                    <div className="font-medium">{service.value}</div>
                                    <div className="text-xs text-gray-600 mt-1">{service.description}</div>
                                </div>
                                {formData.service_types?.includes(service.value) && (
                                    <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs">
                                        ✓
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {formData.service_types?.length === 0 && (
                <p className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg border border-amber-200">
                    Please select at least one service type to continue
                </p>
            )}

            <div className="border-t pt-6">
                <div className="flex items-center gap-2 mb-3">
                    <Label>Specializations (Optional)</Label>
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger>
                                <HelpCircle className="w-4 h-4 text-gray-400" />
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Industry specializations like Legal, Medical, Technical, etc.</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
                
                {formData.specializations?.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                        {formData.specializations.map((spec, idx) => (
                            <Badge key={idx} variant="secondary" className="pr-1">
                                {spec}
                                <button
                                    onClick={() => removeSpecialization(idx)}
                                    className="ml-2 hover:text-red-600"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </Badge>
                        ))}
                    </div>
                )}

                <div className="flex gap-2">
                    <Input
                        placeholder="e.g., Legal, Medical, Technical, Finance"
                        value={newSpec}
                        onChange={(e) => setNewSpec(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSpecialization())}
                    />
                    <Button onClick={addSpecialization} disabled={!newSpec.trim()} variant="outline">
                        <Plus className="w-4 h-4" />
                    </Button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                    Examples: Legal, Medical, Technical, Finance, Marketing, Gaming, etc.
                </p>
            </div>
        </div>
    );
}