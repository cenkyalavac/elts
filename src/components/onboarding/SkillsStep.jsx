import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { HelpCircle, Plus, X, Wrench } from "lucide-react";

export default function SkillsStep({ formData, updateFormData }) {
    const [newSkill, setNewSkill] = useState('');
    const [newCert, setNewCert] = useState('');

    const commonTools = [
        "SDL Trados", "MemoQ", "Wordfast", "MateCat", "Memsource",
        "Adobe Acrobat", "Microsoft Office", "Google Workspace"
    ];

    const addSkill = () => {
        if (newSkill.trim()) {
            updateFormData({
                skills: [...(formData.skills || []), newSkill.trim()]
            });
            setNewSkill('');
        }
    };

    const addCommonSkill = (skill) => {
        if (!formData.skills?.includes(skill)) {
            updateFormData({
                skills: [...(formData.skills || []), skill]
            });
        }
    };

    const removeSkill = (index) => {
        updateFormData({
            skills: formData.skills.filter((_, i) => i !== index)
        });
    };

    const addCertification = () => {
        if (newCert.trim()) {
            updateFormData({
                certifications: [...(formData.certifications || []), newCert.trim()]
            });
            setNewCert('');
        }
    };

    const removeCertification = (index) => {
        updateFormData({
            certifications: formData.certifications.filter((_, i) => i !== index)
        });
    };

    return (
        <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-2">
                    <Wrench className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                        <p className="text-sm font-medium text-blue-900 mb-1">Skills & Certifications</p>
                        <p className="text-sm text-blue-800">
                            Add technical skills, tools you're proficient with, and any professional certifications.
                        </p>
                    </div>
                </div>
            </div>

            <div>
                <div className="flex items-center gap-2 mb-3">
                    <Label>Technical Skills & Tools</Label>
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger>
                                <HelpCircle className="w-4 h-4 text-gray-400" />
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>CAT tools, software, and technical skills you use professionally</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>

                {formData.skills?.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                        {formData.skills.map((skill, idx) => (
                            <Badge key={idx} variant="secondary" className="pr-1">
                                {skill}
                                <button
                                    onClick={() => removeSkill(idx)}
                                    className="ml-2 hover:text-red-600"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </Badge>
                        ))}
                    </div>
                )}

                <div className="mb-4">
                    <p className="text-xs text-gray-600 mb-2">Quick add common tools:</p>
                    <div className="flex flex-wrap gap-2">
                        {commonTools.map(tool => (
                            <Badge
                                key={tool}
                                variant={formData.skills?.includes(tool) ? "default" : "outline"}
                                className="cursor-pointer"
                                onClick={() => addCommonSkill(tool)}
                            >
                                {formData.skills?.includes(tool) ? '✓ ' : '+ '}
                                {tool}
                            </Badge>
                        ))}
                    </div>
                </div>

                <div className="flex gap-2">
                    <Input
                        placeholder="e.g., SDL Trados, Subtitle Edit, Excel"
                        value={newSkill}
                        onChange={(e) => setNewSkill(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                    />
                    <Button onClick={addSkill} disabled={!newSkill.trim()} variant="outline">
                        <Plus className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            <div className="border-t pt-6">
                <div className="flex items-center gap-2 mb-3">
                    <Label>Certifications (Optional)</Label>
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger>
                                <HelpCircle className="w-4 h-4 text-gray-400" />
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                                <p>Professional certifications like ATA, ITI, DPSI, CIOL, etc.</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>

                {formData.certifications?.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                        {formData.certifications.map((cert, idx) => (
                            <Badge key={idx} variant="secondary" className="pr-1">
                                {cert}
                                <button
                                    onClick={() => removeCertification(idx)}
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
                        placeholder="e.g., ATA Certified Translator (Spanish>English)"
                        value={newCert}
                        onChange={(e) => setNewCert(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCertification())}
                    />
                    <Button onClick={addCertification} disabled={!newCert.trim()} variant="outline">
                        <Plus className="w-4 h-4" />
                    </Button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                    Examples: ATA Certified, DPSI, ITI Member, CIOL, etc.
                </p>
            </div>
        </div>
    );
}