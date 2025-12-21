import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Plus, Save, XCircle } from "lucide-react";

export default function FreelancerEditForm({ freelancer, onSave, onCancel }) {
    const [formData, setFormData] = useState({
        full_name: freelancer.full_name || '',
        email: freelancer.email || '',
        phone: freelancer.phone || '',
        location: freelancer.location || '',
        languages: freelancer.languages || [],
        specializations: freelancer.specializations || [],
        service_types: freelancer.service_types || [],
        experience_years: freelancer.experience_years || '',
        education: freelancer.education || '',
        certifications: freelancer.certifications || [],
        skills: freelancer.skills || [],
        rate: freelancer.rate || '',
        availability: freelancer.availability || 'Immediate',
        status: freelancer.status || 'New',
        notes: freelancer.notes || ''
    });

    const [newLanguage, setNewLanguage] = useState({ language: '', proficiency: 'Professional' });
    const [newSpec, setNewSpec] = useState('');
    const [newCert, setNewCert] = useState('');
    const [newSkill, setNewSkill] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    const addLanguage = () => {
        if (newLanguage.language) {
            setFormData({
                ...formData,
                languages: [...formData.languages, newLanguage]
            });
            setNewLanguage({ language: '', proficiency: 'Professional' });
        }
    };

    const removeLanguage = (index) => {
        setFormData({
            ...formData,
            languages: formData.languages.filter((_, i) => i !== index)
        });
    };

    const toggleServiceType = (service) => {
        const current = formData.service_types || [];
        setFormData({
            ...formData,
            service_types: current.includes(service)
                ? current.filter(s => s !== service)
                : [...current, service]
        });
    };

    const addItem = (field, value, setterFn) => {
        if (value.trim()) {
            setFormData({
                ...formData,
                [field]: [...(formData[field] || []), value.trim()]
            });
            setterFn('');
        }
    };

    const removeItem = (field, index) => {
        setFormData({
            ...formData,
            [field]: formData[field].filter((_, i) => i !== index)
        });
    };

    const serviceTypes = ["Translation", "Interpretation", "Proofreading", "Localization", "Transcription", "Subtitling"];
    const proficiencyLevels = ["Native", "Fluent", "Professional", "Intermediate"];
    const availabilityOptions = ["Immediate", "Within 1 week", "Within 2 weeks", "Within 1 month", "Not available"];
    const statusOptions = ["New", "Reviewing", "Interview Scheduled", "Accepted", "Rejected", "On Hold"];

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="full_name">Full Name *</Label>
                            <Input
                                id="full_name"
                                value={formData.full_name}
                                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <Label htmlFor="email">Email *</Label>
                            <Input
                                id="email"
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="phone">Phone</Label>
                            <Input
                                id="phone"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            />
                        </div>
                        <div>
                            <Label htmlFor="location">Location</Label>
                            <Input
                                id="location"
                                value={formData.location}
                                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Languages</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex flex-wrap gap-2 mb-4">
                        {formData.languages.map((lang, idx) => (
                            <Badge key={idx} variant="secondary" className="pr-1">
                                {lang.language} ({lang.proficiency})
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
                        <Input
                            placeholder="Language"
                            value={newLanguage.language}
                            onChange={(e) => setNewLanguage({ ...newLanguage, language: e.target.value })}
                        />
                        <Select
                            value={newLanguage.proficiency}
                            onValueChange={(value) => setNewLanguage({ ...newLanguage, proficiency: value })}
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
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Service Types</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap gap-2">
                        {serviceTypes.map(service => (
                            <Badge
                                key={service}
                                variant={formData.service_types?.includes(service) ? "default" : "outline"}
                                className="cursor-pointer"
                                onClick={() => toggleServiceType(service)}
                            >
                                {service}
                            </Badge>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Specializations</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex flex-wrap gap-2 mb-4">
                        {formData.specializations.map((spec, idx) => (
                            <Badge key={idx} variant="secondary" className="pr-1">
                                {spec}
                                <button
                                    type="button"
                                    onClick={() => removeItem('specializations', idx)}
                                    className="ml-2 hover:text-red-600"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </Badge>
                        ))}
                    </div>
                    <div className="flex gap-2">
                        <Input
                            placeholder="Add specialization (e.g., Legal, Medical, Technical)"
                            value={newSpec}
                            onChange={(e) => setNewSpec(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addItem('specializations', newSpec, setNewSpec))}
                        />
                        <Button type="button" onClick={() => addItem('specializations', newSpec, setNewSpec)} size="icon">
                            <Plus className="w-4 h-4" />
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Experience & Education</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="experience_years">Years of Experience</Label>
                            <Input
                                id="experience_years"
                                type="number"
                                min="0"
                                value={formData.experience_years}
                                onChange={(e) => setFormData({ ...formData, experience_years: parseFloat(e.target.value) || '' })}
                            />
                        </div>
                        <div>
                            <Label htmlFor="rate">Rate</Label>
                            <Input
                                id="rate"
                                placeholder="e.g., $50/hour or $0.10/word"
                                value={formData.rate}
                                onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
                            />
                        </div>
                    </div>

                    <div>
                        <Label htmlFor="education">Education</Label>
                        <Textarea
                            id="education"
                            value={formData.education}
                            onChange={(e) => setFormData({ ...formData, education: e.target.value })}
                            className="h-20"
                        />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Certifications</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex flex-wrap gap-2 mb-4">
                        {formData.certifications.map((cert, idx) => (
                            <Badge key={idx} variant="secondary" className="pr-1">
                                {cert}
                                <button
                                    type="button"
                                    onClick={() => removeItem('certifications', idx)}
                                    className="ml-2 hover:text-red-600"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </Badge>
                        ))}
                    </div>
                    <div className="flex gap-2">
                        <Input
                            placeholder="Add certification"
                            value={newCert}
                            onChange={(e) => setNewCert(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addItem('certifications', newCert, setNewCert))}
                        />
                        <Button type="button" onClick={() => addItem('certifications', newCert, setNewCert)} size="icon">
                            <Plus className="w-4 h-4" />
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Technical Skills & Tools</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex flex-wrap gap-2 mb-4">
                        {formData.skills.map((skill, idx) => (
                            <Badge key={idx} variant="secondary" className="pr-1">
                                {skill}
                                <button
                                    type="button"
                                    onClick={() => removeItem('skills', idx)}
                                    className="ml-2 hover:text-red-600"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </Badge>
                        ))}
                    </div>
                    <div className="flex gap-2">
                        <Input
                            placeholder="Add skill (e.g., CAT tools, SDL Trados, MemoQ)"
                            value={newSkill}
                            onChange={(e) => setNewSkill(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addItem('skills', newSkill, setNewSkill))}
                        />
                        <Button type="button" onClick={() => addItem('skills', newSkill, setNewSkill)} size="icon">
                            <Plus className="w-4 h-4" />
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Status & Availability</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="status">Status</Label>
                            <Select
                                value={formData.status}
                                onValueChange={(value) => setFormData({ ...formData, status: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {statusOptions.map(status => (
                                        <SelectItem key={status} value={status}>{status}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label htmlFor="availability">Availability</Label>
                            <Select
                                value={formData.availability}
                                onValueChange={(value) => setFormData({ ...formData, availability: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {availabilityOptions.map(avail => (
                                        <SelectItem key={avail} value={avail}>{avail}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div>
                        <Label htmlFor="notes">Internal Notes</Label>
                        <Textarea
                            id="notes"
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            placeholder="Add notes about this candidate..."
                            className="h-24"
                        />
                    </div>
                </CardContent>
            </Card>

            <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={onCancel}>
                    <XCircle className="w-4 h-4 mr-2" />
                    Cancel
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                </Button>
            </div>
        </form>
    );
}