import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Plus, Save, XCircle, Trash2, DollarSign, Globe, Briefcase } from "lucide-react";

const SERVICE_TYPES = ["Translation", "Interpretation", "Proofreading", "Localization", "Transcription", "Subtitling", "MTPE", "Review", "LQA", "Transcreation"];
const RESOURCE_TYPES = ["Freelancer", "Agency", "In-house"];
const PROFICIENCY_LEVELS = ["Native", "Fluent", "Professional", "Intermediate"];
const AVAILABILITY_OPTIONS = ["Immediate", "Within 1 week", "Within 2 weeks", "Within 1 month", "Not available"];
const STATUS_OPTIONS = ["New Application", "Form Sent", "Price Negotiation", "Test Sent", "Approved", "On Hold", "Rejected", "Red Flag"];
const CURRENCY_OPTIONS = ["USD", "EUR", "GBP", "TRY"];

export default function FreelancerEditForm({ freelancer, onSave, onCancel }) {
    const [formData, setFormData] = useState({
        full_name: freelancer.full_name || '',
        email: freelancer.email || '',
        phone: freelancer.phone || '',
        location: freelancer.location || '',
        resource_type: freelancer.resource_type || 'Freelancer',
        company_name: freelancer.company_name || '',
        native_language: freelancer.native_language || '',
        language_pairs: freelancer.language_pairs || [],
        specializations: freelancer.specializations || [],
        service_types: freelancer.service_types || [],
        experience_years: freelancer.experience_years || '',
        education: freelancer.education || '',
        certifications: freelancer.certifications || [],
        skills: freelancer.skills || [],
        software: freelancer.software || [],
        rates: freelancer.rates || [],
        currency: freelancer.currency || 'USD',
        availability: freelancer.availability || 'Immediate',
        status: freelancer.status || 'New Application',
        notes: freelancer.notes || '',
        tags: freelancer.tags || [],
        minimum_fee: freelancer.minimum_fee || 0,
        minimum_project_fee: freelancer.minimum_project_fee || 0,
    });

    const [newSpec, setNewSpec] = useState('');
    const [newCert, setNewCert] = useState('');
    const [newSkill, setNewSkill] = useState('');
    const [newSoftware, setNewSoftware] = useState('');
    const [newTag, setNewTag] = useState('');
    const [newServiceType, setNewServiceType] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    const updateField = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    // Language pairs
    const addLanguagePair = () => {
        updateField('language_pairs', [...formData.language_pairs, { source_language: '', target_language: '', proficiency: 'Professional' }]);
    };

    const updateLanguagePair = (index, key, value) => {
        const updated = [...formData.language_pairs];
        updated[index] = { ...updated[index], [key]: value };
        updateField('language_pairs', updated);
    };

    const removeLanguagePair = (index) => {
        updateField('language_pairs', formData.language_pairs.filter((_, i) => i !== index));
    };

    // Rates
    const addRate = () => {
        updateField('rates', [...formData.rates, { source_language: '', target_language: '', specialization: '', tool: '', rate_type: 'per_word', rate_value: 0, currency: formData.currency || 'USD' }]);
    };

    const updateRate = (index, key, value) => {
        const updated = [...formData.rates];
        updated[index] = { ...updated[index], [key]: value };
        updateField('rates', updated);
    };

    const removeRate = (index) => {
        updateField('rates', formData.rates.filter((_, i) => i !== index));
    };

    // Toggle service type from predefined list
    const toggleServiceType = (service) => {
        const current = formData.service_types || [];
        updateField('service_types', current.includes(service) ? current.filter(s => s !== service) : [...current, service]);
    };

    // Add custom service type
    const addCustomServiceType = () => {
        if (newServiceType.trim() && !formData.service_types.includes(newServiceType.trim())) {
            updateField('service_types', [...formData.service_types, newServiceType.trim()]);
            setNewServiceType('');
        }
    };

    // Generic add/remove for array fields
    const addItem = (field, value, setter) => {
        if (value.trim()) {
            updateField(field, [...(formData[field] || []), value.trim()]);
            setter('');
        }
    };

    const removeItem = (field, index) => {
        updateField(field, formData[field].filter((_, i) => i !== index));
    };

    // Group rates by language pair for display
    const languagePairOptions = formData.language_pairs.map(lp => `${lp.source_language} → ${lp.target_language}`).filter(lp => lp !== ' → ');

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <Card>
                <CardHeader><CardTitle>Basic Information</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label>Full Name *</Label>
                            <Input value={formData.full_name} onChange={(e) => updateField('full_name', e.target.value)} required />
                        </div>
                        <div>
                            <Label>Email *</Label>
                            <Input type="email" value={formData.email} onChange={(e) => updateField('email', e.target.value)} required />
                        </div>
                        <div>
                            <Label>Phone</Label>
                            <Input value={formData.phone} onChange={(e) => updateField('phone', e.target.value)} />
                        </div>
                        <div>
                            <Label>Location</Label>
                            <Input value={formData.location} onChange={(e) => updateField('location', e.target.value)} />
                        </div>
                        <div>
                            <Label>Resource Type</Label>
                            <Select value={formData.resource_type} onValueChange={(v) => updateField('resource_type', v)}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {RESOURCE_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        {formData.resource_type === 'Agency' && (
                            <div>
                                <Label>Company Name</Label>
                                <Input value={formData.company_name} onChange={(e) => updateField('company_name', e.target.value)} />
                            </div>
                        )}
                        <div>
                            <Label>Native Language</Label>
                            <Input value={formData.native_language} onChange={(e) => updateField('native_language', e.target.value)} />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Language Pairs */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Globe className="w-5 h-5" /> Language Pairs</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {formData.language_pairs.map((pair, idx) => (
                        <div key={idx} className="border rounded-lg p-4 space-y-3 bg-gray-50">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <div>
                                    <Label>Source Language</Label>
                                    <Input value={pair.source_language} onChange={(e) => updateLanguagePair(idx, 'source_language', e.target.value)} />
                                </div>
                                <div>
                                    <Label>Target Language</Label>
                                    <Input value={pair.target_language} onChange={(e) => updateLanguagePair(idx, 'target_language', e.target.value)} />
                                </div>
                                <div>
                                    <Label>Proficiency</Label>
                                    <Select value={pair.proficiency} onValueChange={(v) => updateLanguagePair(idx, 'proficiency', v)}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {PROFICIENCY_LEVELS.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <Button type="button" variant="destructive" size="sm" onClick={() => removeLanguagePair(idx)}>
                                <Trash2 className="w-4 h-4 mr-1" /> Remove
                            </Button>
                        </div>
                    ))}
                    <Button type="button" variant="outline" onClick={addLanguagePair}>
                        <Plus className="w-4 h-4 mr-1" /> Add Language Pair
                    </Button>
                </CardContent>
            </Card>

            {/* Service Types - Bug #1: Added custom add button */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Briefcase className="w-5 h-5" /> Service Types</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                        {SERVICE_TYPES.map(service => (
                            <Badge
                                key={service}
                                variant={formData.service_types?.includes(service) ? "default" : "outline"}
                                className="cursor-pointer"
                                onClick={() => toggleServiceType(service)}
                            >
                                {service}
                            </Badge>
                        ))}
                        {/* Show custom service types not in predefined list */}
                        {formData.service_types?.filter(s => !SERVICE_TYPES.includes(s)).map(service => (
                            <Badge key={service} variant="default" className="cursor-pointer pr-1" onClick={() => toggleServiceType(service)}>
                                {service}
                                <X className="w-3 h-3 ml-1" />
                            </Badge>
                        ))}
                    </div>
                    <div className="flex gap-2">
                        <Input
                            placeholder="Add custom service type..."
                            value={newServiceType}
                            onChange={(e) => setNewServiceType(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomServiceType())}
                        />
                        <Button type="button" onClick={addCustomServiceType} size="icon" variant="outline">
                            <Plus className="w-4 h-4" />
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Rates - Bug #2: Separated from Experience, now language-pair based */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><DollarSign className="w-5 h-5" /> Rates</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2">
                        <div>
                            <Label>Default Currency</Label>
                            <Select value={formData.currency} onValueChange={(v) => updateField('currency', v)}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {CURRENCY_OPTIONS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>Minimum Fee</Label>
                            <Input type="number" min="0" value={formData.minimum_fee} onChange={(e) => updateField('minimum_fee', parseFloat(e.target.value) || 0)} />
                        </div>
                        <div>
                            <Label>Min. Project Fee</Label>
                            <Input type="number" min="0" value={formData.minimum_project_fee} onChange={(e) => updateField('minimum_project_fee', parseFloat(e.target.value) || 0)} />
                        </div>
                    </div>

                    {formData.rates.map((rate, idx) => (
                        <div key={idx} className="border rounded-lg p-4 space-y-3 bg-gray-50">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div>
                                    <Label>Source Language</Label>
                                    <Input value={rate.source_language || ''} onChange={(e) => updateRate(idx, 'source_language', e.target.value)} placeholder="e.g. English" />
                                </div>
                                <div>
                                    <Label>Target Language</Label>
                                    <Input value={rate.target_language || ''} onChange={(e) => updateRate(idx, 'target_language', e.target.value)} placeholder="e.g. Turkish" />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                                <div>
                                    <Label>Rate Type</Label>
                                    <Select value={rate.rate_type} onValueChange={(v) => updateRate(idx, 'rate_type', v)}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="per_word">Per Word</SelectItem>
                                            <SelectItem value="per_hour">Per Hour</SelectItem>
                                            <SelectItem value="per_page">Per Page</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label>Rate Value</Label>
                                    <Input type="number" step="0.01" min="0" value={rate.rate_value} onChange={(e) => updateRate(idx, 'rate_value', parseFloat(e.target.value) || 0)} />
                                </div>
                                <div>
                                    <Label>Currency</Label>
                                    <Select value={rate.currency || 'USD'} onValueChange={(v) => updateRate(idx, 'currency', v)}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {CURRENCY_OPTIONS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label>Specialization</Label>
                                    <Input value={rate.specialization || ''} onChange={(e) => updateRate(idx, 'specialization', e.target.value)} placeholder="e.g. Legal" />
                                </div>
                            </div>
                            <div>
                                <Label>Tool</Label>
                                <Input value={rate.tool || ''} onChange={(e) => updateRate(idx, 'tool', e.target.value)} placeholder="e.g. MemoQ, Trados" />
                            </div>
                            <Button type="button" variant="destructive" size="sm" onClick={() => removeRate(idx)}>
                                <Trash2 className="w-4 h-4 mr-1" /> Remove Rate
                            </Button>
                        </div>
                    ))}
                    <Button type="button" variant="outline" onClick={addRate}>
                        <Plus className="w-4 h-4 mr-1" /> Add Rate
                    </Button>
                </CardContent>
            </Card>

            {/* Experience & Education - Bug #2: Rate removed from here */}
            <Card>
                <CardHeader><CardTitle>Experience & Education</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <Label>Years of Experience</Label>
                        <Input type="number" min="0" value={formData.experience_years} onChange={(e) => updateField('experience_years', parseFloat(e.target.value) || '')} />
                    </div>
                    <div>
                        <Label>Education</Label>
                        <Textarea value={formData.education} onChange={(e) => updateField('education', e.target.value)} className="h-20" />
                    </div>
                </CardContent>
            </Card>

            {/* Specializations */}
            <Card>
                <CardHeader><CardTitle>Specializations</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                        {formData.specializations.map((spec, idx) => (
                            <Badge key={idx} variant="secondary" className="pr-1">
                                {spec}
                                <button type="button" onClick={() => removeItem('specializations', idx)} className="ml-2 hover:text-red-600"><X className="w-3 h-3" /></button>
                            </Badge>
                        ))}
                    </div>
                    <div className="flex gap-2">
                        <Input placeholder="Add specialization (e.g., Legal, Medical)" value={newSpec} onChange={(e) => setNewSpec(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addItem('specializations', newSpec, setNewSpec))} />
                        <Button type="button" onClick={() => addItem('specializations', newSpec, setNewSpec)} size="icon"><Plus className="w-4 h-4" /></Button>
                    </div>
                </CardContent>
            </Card>

            {/* Certifications */}
            <Card>
                <CardHeader><CardTitle>Certifications</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                        {formData.certifications.map((cert, idx) => (
                            <Badge key={idx} variant="secondary" className="pr-1">
                                {cert}
                                <button type="button" onClick={() => removeItem('certifications', idx)} className="ml-2 hover:text-red-600"><X className="w-3 h-3" /></button>
                            </Badge>
                        ))}
                    </div>
                    <div className="flex gap-2">
                        <Input placeholder="Add certification" value={newCert} onChange={(e) => setNewCert(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addItem('certifications', newCert, setNewCert))} />
                        <Button type="button" onClick={() => addItem('certifications', newCert, setNewCert)} size="icon"><Plus className="w-4 h-4" /></Button>
                    </div>
                </CardContent>
            </Card>

            {/* Technical Skills & CAT Tools */}
            <Card>
                <CardHeader><CardTitle>Technical Skills & CAT Tools</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <Label className="text-sm text-gray-600 mb-2">Skills</Label>
                        <div className="flex flex-wrap gap-2 mb-2">
                            {formData.skills.map((skill, idx) => (
                                <Badge key={idx} variant="secondary" className="pr-1">
                                    {skill}
                                    <button type="button" onClick={() => removeItem('skills', idx)} className="ml-2 hover:text-red-600"><X className="w-3 h-3" /></button>
                                </Badge>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <Input placeholder="Add skill" value={newSkill} onChange={(e) => setNewSkill(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addItem('skills', newSkill, setNewSkill))} />
                            <Button type="button" onClick={() => addItem('skills', newSkill, setNewSkill)} size="icon"><Plus className="w-4 h-4" /></Button>
                        </div>
                    </div>
                    <div>
                        <Label className="text-sm text-gray-600 mb-2">CAT Tools & Software</Label>
                        <div className="flex flex-wrap gap-2 mb-2">
                            {(formData.software || []).map((sw, idx) => (
                                <Badge key={idx} variant="secondary" className="pr-1">
                                    {sw}
                                    <button type="button" onClick={() => removeItem('software', idx)} className="ml-2 hover:text-red-600"><X className="w-3 h-3" /></button>
                                </Badge>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <Input placeholder="Add software (e.g., MemoQ, Trados)" value={newSoftware} onChange={(e) => setNewSoftware(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addItem('software', newSoftware, setNewSoftware))} />
                            <Button type="button" onClick={() => addItem('software', newSoftware, setNewSoftware)} size="icon"><Plus className="w-4 h-4" /></Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Status & Availability - Bug #5: Correct status options */}
            <Card>
                <CardHeader><CardTitle>Status & Availability</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label>Status</Label>
                            <Select value={formData.status} onValueChange={(v) => updateField('status', v)}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {STATUS_OPTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>Availability</Label>
                            <Select value={formData.availability} onValueChange={(v) => updateField('availability', v)}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {AVAILABILITY_OPTIONS.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Tags */}
                    <div>
                        <Label className="text-sm text-gray-600 mb-2">Tags</Label>
                        <div className="flex flex-wrap gap-2 mb-2">
                            {(formData.tags || []).map((tag, idx) => (
                                <Badge key={idx} variant="outline" className="pr-1">
                                    {tag}
                                    <button type="button" onClick={() => removeItem('tags', idx)} className="ml-2 hover:text-red-600"><X className="w-3 h-3" /></button>
                                </Badge>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <Input placeholder="Add tag" value={newTag} onChange={(e) => setNewTag(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addItem('tags', newTag, setNewTag))} />
                            <Button type="button" onClick={() => addItem('tags', newTag, setNewTag)} size="icon"><Plus className="w-4 h-4" /></Button>
                        </div>
                    </div>

                    <div>
                        <Label>Internal Notes</Label>
                        <Textarea value={formData.notes} onChange={(e) => updateField('notes', e.target.value)} placeholder="Add notes about this candidate..." className="h-24" />
                    </div>
                </CardContent>
            </Card>

            {/* Save / Cancel */}
            <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={onCancel}>
                    <XCircle className="w-4 h-4 mr-2" /> Cancel
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                    <Save className="w-4 h-4 mr-2" /> Save Changes
                </Button>
            </div>
        </form>
    );
}