import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { HelpCircle, Plus, X, Globe } from "lucide-react";

export default function LanguagesStep({ formData, updateFormData }) {
    const [newLanguage, setNewLanguage] = useState({ language: '', proficiency: 'Professional' });

    const proficiencyLevels = [
        { value: 'Native', description: 'Native speaker' },
        { value: 'Fluent', description: 'Full professional fluency' },
        { value: 'Professional', description: 'Working proficiency' },
        { value: 'Intermediate', description: 'Limited working proficiency' }
    ];

    const addLanguage = () => {
        if (newLanguage.language) {
            updateFormData({
                languages: [...formData.languages, newLanguage]
            });
            setNewLanguage({ language: '', proficiency: 'Professional' });
        }
    };

    const removeLanguage = (index) => {
        updateFormData({
            languages: formData.languages.filter((_, i) => i !== index)
        });
    };

    return (
        <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-2">
                    <Globe className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                        <p className="text-sm font-medium text-blue-900 mb-1">Language Proficiency</p>
                        <p className="text-sm text-blue-800">
                            Add all languages you can work with. Be honest about your proficiency level.
                        </p>
                    </div>
                </div>
            </div>

            {formData.languages.length > 0 && (
                <div>
                    <Label className="mb-3 block">Your Languages</Label>
                    <div className="space-y-2">
                        {formData.languages.map((lang, idx) => (
                            <div key={idx} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                                <div>
                                    <span className="font-medium">{lang.language}</span>
                                    <Badge variant="outline" className="ml-2">
                                        {lang.proficiency}
                                    </Badge>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeLanguage(idx)}
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="border-t pt-6">
                <Label className="mb-4 block">Add a Language</Label>
                <div className="space-y-4">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <Label htmlFor="language">Language *</Label>
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger>
                                        <HelpCircle className="w-4 h-4 text-gray-400" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Enter the language name (e.g., Spanish, Mandarin, Arabic)</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>
                        <Input
                            id="language"
                            value={newLanguage.language}
                            onChange={(e) => setNewLanguage({ ...newLanguage, language: e.target.value })}
                            placeholder="e.g., Spanish"
                            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addLanguage())}
                        />
                    </div>

                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <Label htmlFor="proficiency">Proficiency Level *</Label>
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger>
                                        <HelpCircle className="w-4 h-4 text-gray-400" />
                                    </TooltipTrigger>
                                    <TooltipContent className="max-w-xs">
                                        <div className="space-y-1 text-xs">
                                            <p><strong>Native:</strong> It's your mother tongue</p>
                                            <p><strong>Fluent:</strong> Complete mastery, like a native</p>
                                            <p><strong>Professional:</strong> Can work professionally</p>
                                            <p><strong>Intermediate:</strong> Basic working knowledge</p>
                                        </div>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>
                        <Select
                            value={newLanguage.proficiency}
                            onValueChange={(value) => setNewLanguage({ ...newLanguage, proficiency: value })}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {proficiencyLevels.map(level => (
                                    <SelectItem key={level.value} value={level.value}>
                                        {level.value} - {level.description}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <Button
                        onClick={addLanguage}
                        disabled={!newLanguage.language}
                        variant="outline"
                        className="w-full"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Language
                    </Button>
                </div>
            </div>

            {formData.languages.length === 0 && (
                <p className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg border border-amber-200">
                    Please add at least one language to continue
                </p>
            )}
        </div>
    );
}