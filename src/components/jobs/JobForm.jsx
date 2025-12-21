import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, X, Briefcase } from "lucide-react";

export default function JobForm({ onSubmit, onCancel, freelancers }) {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        required_languages: [],
        required_specializations: [],
        required_service_types: [],
        min_experience_years: '',
        required_skills: [],
        budget: '',
        deadline: '',
        status: 'Open'
    });

    const [newLanguage, setNewLanguage] = useState({ language: '', min_proficiency: 'Professional' });
    const [newSpec, setNewSpec] = useState('');
    const [newSkill, setNewSkill] = useState('');

    // Extract unique values from freelancers
    const allLanguages = [...new Set(
        freelancers.flatMap(f => f.languages?.map(l => l.language) || [])
    )].sort();

    const allSpecializations = [...new Set(
        freelancers.flatMap(f => f.specializations || [])
    )].sort();

    const allSkills = [...new Set(
        freelancers.flatMap(f => f.skills || [])
    )].sort();

    const serviceTypes = ["Translation", "Interpretation", "Proofreading", "Localization", "Transcription", "Subtitling"];
    const proficiencyLevels = ["Intermediate", "Professional", "Fluent", "Native"];

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    const addLanguage = () => {
        if (newLanguage.language) {
            setFormData({
                ...formData,
                required_languages: [...formData.required_languages, newLanguage]
            });
            setNewLanguage({ language: '', min_proficiency: 'Professional' });
        }
    };

    const removeLanguage = (index) => {
        setFormData({
            ...formData,
            required_languages: formData.required_languages.filter((_, i) => i !== index)
        });
    };

    const toggleServiceType = (service) => {
        const current = formData.required_service_types || [];
        setFormData({
            ...formData,
            required_service_types: current.includes(service)
                ? current.filter(s => s !== service)
                : [...current, service]
        });
    };

    const addItem = (field, value) => {
        if (value.trim()) {
            setFormData({
                ...formData,
                [field]: [...(formData[field] || []), value.trim()]
            });
            if (field === 'required_specializations') setNewSpec('');
            if (field === 'required_skills') setNewSkill('');
        }
    };

    const removeItem = (field, index) => {
        setFormData({
            ...formData,
            [field]: formData[field].filter((_, i) => i !== index)
        });
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Briefcase className="w-5 h-5" />
                    Create New Job
                </CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <Label htmlFor="title">Job Title *</Label>
                            <Input
                                id="title"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                placeholder="e.g., Spanish-English Legal Translation Project"
                                required
                            />
                        </div>

                        <div className="md:col-span-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Describe the job requirements..."
                                className="h-24"
                            />
                        </div>

                        <div>
                            <Label htmlFor="budget">Budget</Label>
                            <Input
                                id="budget"
                                value={formData.budget}
                                onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                                placeholder="e.g., $1000-$2000"
                            />
                        </div>

                        <div>
                            <Label htmlFor="deadline">Deadline</Label>
                            <Input
                                id="deadline"
                                type="date"
                                value={formData.deadline}
                                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                            />
                        </div>
                    </div>

                    <div>
                        <Label className="mb-2 block">Required Languages</Label>
                        <div className="flex flex-wrap gap-2 mb-3">
                            {formData.required_languages.map((lang, idx) => (
                                <Badge key={idx} variant="secondary" className="pr-1">
                                    {lang.language} (min: {lang.min_proficiency})
                                    <button
                                        type="button"
                                        onClick={() => removeLanguage(idx)}
                                        className="ml-2 hover:text-red-600"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </Badge>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <Select
                                value={newLanguage.language}
                                onValueChange={(value) => setNewLanguage({ ...newLanguage, language: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select language" />
                                </SelectTrigger>
                                <SelectContent>
                                    {allLanguages.map(lang => (
                                        <SelectItem key={lang} value={lang}>{lang}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Select
                                value={newLanguage.min_proficiency}
                                onValueChange={(value) => setNewLanguage({ ...newLanguage, min_proficiency: value })}
                            >
                                <SelectTrigger className="w-40">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {proficiencyLevels.map(level => (
                                        <SelectItem key={level} value={level}>{level}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Button type="button" onClick={addLanguage} size="icon">
                                <Plus className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>

                    <div>
                        <Label className="mb-2 block">Required Service Types</Label>
                        <div className="flex flex-wrap gap-2">
                            {serviceTypes.map(service => (
                                <Badge
                                    key={service}
                                    variant={formData.required_service_types?.includes(service) ? "default" : "outline"}
                                    className="cursor-pointer"
                                    onClick={() => toggleServiceType(service)}
                                >
                                    {service}
                                </Badge>
                            ))}
                        </div>
                    </div>

                    <div>
                        <Label className="mb-2 block">Required Specializations</Label>
                        <div className="flex flex-wrap gap-2 mb-3">
                            {formData.required_specializations.map((spec, idx) => (
                                <Badge key={idx} variant="secondary" className="pr-1">
                                    {spec}
                                    <button
                                        type="button"
                                        onClick={() => removeItem('required_specializations', idx)}
                                        className="ml-2 hover:text-red-600"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </Badge>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <Select
                                value={newSpec}
                                onValueChange={setNewSpec}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select specialization" />
                                </SelectTrigger>
                                <SelectContent>
                                    {allSpecializations.map(spec => (
                                        <SelectItem key={spec} value={spec}>{spec}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Button type="button" onClick={() => addItem('required_specializations', newSpec)} size="icon">
                                <Plus className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>

                    <div>
                        <Label className="mb-2 block">Required Skills</Label>
                        <div className="flex flex-wrap gap-2 mb-3">
                            {formData.required_skills.map((skill, idx) => (
                                <Badge key={idx} variant="secondary" className="pr-1">
                                    {skill}
                                    <button
                                        type="button"
                                        onClick={() => removeItem('required_skills', idx)}
                                        className="ml-2 hover:text-red-600"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </Badge>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <Select
                                value={newSkill}
                                onValueChange={setNewSkill}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select skill" />
                                </SelectTrigger>
                                <SelectContent>
                                    {allSkills.map(skill => (
                                        <SelectItem key={skill} value={skill}>{skill}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Button type="button" onClick={() => addItem('required_skills', newSkill)} size="icon">
                                <Plus className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>

                    <div>
                        <Label htmlFor="min_experience">Minimum Experience (years)</Label>
                        <Input
                            id="min_experience"
                            type="number"
                            min="0"
                            value={formData.min_experience_years}
                            onChange={(e) => setFormData({ ...formData, min_experience_years: parseFloat(e.target.value) || '' })}
                            placeholder="e.g., 3"
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <Button type="button" variant="outline" onClick={onCancel}>
                            Cancel
                        </Button>
                        <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                            Create Job & Find Matches
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}