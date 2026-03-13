import React, { useState, useEffect, useRef } from 'react';
import { useMutation } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, CheckCircle, Loader2, X, Plus, ArrowLeft, Sparkles, FileText } from "lucide-react";
import { toast } from "sonner";
import DuplicateWarning from "../freelancers/DuplicateWarning";
import CVExtractForm from "./CVExtractForm";
import LanguagePairRateInput from "./LanguagePairRateInput";

const STORAGE_KEY = 'application_form_draft_v2';

const SERVICE_TYPES = [
    "Translation", "Interpretation", "Proofreading", "Localization",
    "Transcription", "Subtitling", "MTPE", "Review", "LQA", "Transcreation"
];

const COMMON_TOOLS = [
    "SDL Trados", "MemoQ", "Wordfast", "Smartcat", "XTM",
    "Phrase", "Memsource", "MateCat"
];

const initialFormData = {
    full_name: '',
    email: '',
    phone: '',
    location: '',
    cv_file_url: '',
    availability: 'Immediate',
    linkedin_url: '',
    portfolio_url: '',
    native_language: '',
    language_pairs: [],
    service_types: [],
    specializations: [],
    skills: [],
    certifications: [],
    experience_years: '',
    education: '',
    why_join: '',
    status: 'New Application',
    website_url: '' // Honeypot
};

export default function ApplicationFormFull({ position, onCancel, onSuccess }) {
    const [step, setStep] = useState('cv'); // 'cv' | 'form'
    const [uploading, setUploading] = useState(false);
    const [newSpec, setNewSpec] = useState('');
    const [newSkill, setNewSkill] = useState('');
    const [newCert, setNewCert] = useState('');

    const [formData, setFormData] = useState(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (parsed.full_name || parsed.email) {
                    return parsed;
                }
            } catch {}
        }
        return initialFormData;
    });

    const isInitialMount = useRef(true);

    // If draft had data, skip CV step
    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (parsed.full_name || parsed.email) {
                    setStep('form');
                    toast.success('Draft restored');
                }
            } catch {}
        }
    }, []);

    // Auto-save
    useEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false;
            return;
        }
        const t = setTimeout(() => {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
        }, 1000);
        return () => clearTimeout(t);
    }, [formData]);

    const createMutation = useMutation({
        mutationFn: (data) => base44.entities.Freelancer.create(data),
        onSuccess: () => {
            const name = formData.full_name;
            localStorage.removeItem(STORAGE_KEY);
            setFormData(initialFormData);
            onSuccess(name);
        },
        onError: () => {
            toast.error('Failed to submit. Please try again.');
        }
    });

    const handleCvUpload = (url) => {
        setFormData(prev => ({ ...prev, cv_file_url: url }));
    };

    const handleExtracted = (data) => {
        setFormData(prev => ({
            ...prev,
            full_name: data.full_name || prev.full_name,
            email: data.email || prev.email,
            phone: data.phone || prev.phone,
            location: data.location || prev.location,
            experience_years: data.experience_years || prev.experience_years,
            education: data.education || prev.education,
            native_language: data.native_language || prev.native_language,
            linkedin_url: data.linkedin_url || prev.linkedin_url,
            portfolio_url: data.portfolio_url || prev.portfolio_url,
            language_pairs: data.languages?.length ? data.languages.map(l => ({
                source_language: l.source_language || '',
                target_language: l.target_language || '',
                proficiency: l.proficiency || 'Professional',
                rates: []
            })) : prev.language_pairs,
            service_types: data.service_types?.length ? data.service_types : prev.service_types,
            specializations: data.specializations?.length ? data.specializations : prev.specializations,
            skills: data.skills?.length ? data.skills : prev.skills,
            certifications: data.certifications?.length ? data.certifications : prev.certifications,
        }));
        setStep('form');
    };

    const handleFileUploadInForm = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.name.match(/\.(pdf|doc|docx)$/i)) {
            toast.error('PDF, DOC, or DOCX only');
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            toast.error('Max 5MB');
            return;
        }
        setUploading(true);
        try {
            const { file_url } = await base44.integrations.Core.UploadFile({ file });
            setFormData(prev => ({ ...prev, cv_file_url: file_url }));
            toast.success('CV uploaded');
        } catch {
            toast.error('Upload failed');
        } finally {
            setUploading(false);
        }
    };

    const toggleServiceType = (service) => {
        setFormData(prev => ({
            ...prev,
            service_types: prev.service_types.includes(service)
                ? prev.service_types.filter(s => s !== service)
                : [...prev.service_types, service]
        }));
    };

    const addItem = (field, value, setter) => {
        if (value.trim()) {
            setFormData(prev => ({ ...prev, [field]: [...(prev[field] || []), value.trim()] }));
            setter('');
        }
    };

    const removeItem = (field, index) => {
        setFormData(prev => ({ ...prev, [field]: prev[field].filter((_, i) => i !== index) }));
    };

    const toggleSkill = (skill) => {
        setFormData(prev => ({
            ...prev,
            skills: prev.skills?.includes(skill)
                ? prev.skills.filter(s => s !== skill)
                : [...(prev.skills || []), skill]
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.website_url) {
            toast.success('Application submitted!');
            return;
        }
        if (!formData.full_name || !formData.email) {
            toast.error('Name and email are required');
            return;
        }
        if (!formData.cv_file_url) {
            toast.error('Please upload your CV');
            return;
        }
        let sanitizedPhone = formData.phone;
        if (sanitizedPhone) {
            const hasPlus = sanitizedPhone.startsWith('+');
            sanitizedPhone = sanitizedPhone.replace(/[^\d]/g, '');
            if (hasPlus) sanitizedPhone = '+' + sanitizedPhone;
        }

        const { website_url, linkedin_url, portfolio_url, why_join, ...submitData } = formData;
        await createMutation.mutateAsync({
            ...submitData,
            phone: sanitizedPhone,
            website: portfolio_url || '',
            notes: [
                why_join ? `Why join: ${why_join}` : '',
                linkedin_url ? `LinkedIn: ${linkedin_url}` : '',
                portfolio_url ? `Portfolio: ${portfolio_url}` : '',
            ].filter(Boolean).join('\n'),
        });
    };

    if (step === 'cv') {
        return (
            <div className="max-w-xl mx-auto">
                <div className="mb-6">
                    <Button
                        variant="ghost"
                        className="text-gray-400 hover:text-white hover:bg-white/10"
                        onClick={onCancel}
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" /> Back to positions
                    </Button>
                </div>
                {position && (
                    <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg px-4 py-3 mb-6">
                        <p className="text-sm text-purple-300">Applying for: <span className="font-semibold text-white">{position.title}</span></p>
                    </div>
                )}
                <CVExtractForm
                    cvUrl={formData.cv_file_url}
                    onCvUpload={handleCvUpload}
                    onExtracted={handleExtracted}
                    onSkip={() => setStep('form')}
                />
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto">
            <div className="mb-6 flex items-center justify-between">
                <Button
                    variant="ghost"
                    className="text-gray-400 hover:text-white hover:bg-white/10"
                    onClick={onCancel}
                >
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back
                </Button>
                {formData.cv_file_url && (
                    <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                        <CheckCircle className="w-3 h-3 mr-1" /> CV Uploaded
                    </Badge>
                )}
            </div>

            {position && (
                <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg px-4 py-3 mb-6">
                    <p className="text-sm text-purple-300">Applying for: <span className="font-semibold text-white">{position.title}</span></p>
                </div>
            )}

            <h2 className="text-2xl font-bold text-white mb-1">
                {position ? `Application: ${position.title}` : 'General Application'}
            </h2>
            <p className="text-gray-400 mb-8">Fill in your details. Fields marked * are required.</p>

            <form onSubmit={handleSubmit} className="space-y-10">
                {/* Honeypot */}
                <div className="hidden" aria-hidden="true">
                    <Input
                        name="website_url"
                        tabIndex={-1}
                        autoComplete="off"
                        value={formData.website_url}
                        onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                    />
                </div>

                {/* Duplicate warning */}
                {(formData.email || formData.full_name) && (
                    <DuplicateWarning email={formData.email} fullName={formData.full_name} />
                )}

                {/* Section 1: Basic Info */}
                <section className="space-y-4">
                    <h3 className="text-lg font-semibold text-white border-b border-white/10 pb-2">Basic Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label className="text-gray-300">Full Name *</Label>
                            <Input
                                required
                                value={formData.full_name}
                                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                                placeholder="e.g., Maria Garcia"
                            />
                        </div>
                        <div>
                            <Label className="text-gray-300">Email *</Label>
                            <Input
                                type="email"
                                required
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                                placeholder="maria@example.com"
                            />
                        </div>
                        <div>
                            <Label className="text-gray-300">Phone</Label>
                            <Input
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                                placeholder="+1 234 567 8900"
                            />
                        </div>
                        <div>
                            <Label className="text-gray-300">Location</Label>
                            <Input
                                value={formData.location}
                                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                                placeholder="City, Country"
                            />
                        </div>
                    </div>
                </section>

                {/* Section 2: CV Upload (if not already uploaded) */}
                {!formData.cv_file_url && (
                    <section className="space-y-4">
                        <h3 className="text-lg font-semibold text-white border-b border-white/10 pb-2">CV / Resume *</h3>
                        <div className="bg-white/5 border-2 border-dashed border-white/20 rounded-xl p-6 text-center">
                            {uploading ? (
                                <div className="flex flex-col items-center gap-2">
                                    <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
                                    <p className="text-sm text-gray-400">Uploading...</p>
                                </div>
                            ) : (
                                <div>
                                    <Upload className="w-10 h-10 text-gray-500 mx-auto mb-2" />
                                    <p className="text-gray-400 text-sm mb-3">PDF, DOC, or DOCX (max 5MB)</p>
                                    <input type="file" accept=".pdf,.doc,.docx" onChange={handleFileUploadInForm} className="hidden" id="cv-form-upload" />
                                    <label htmlFor="cv-form-upload">
                                        <Button type="button" variant="outline" asChild className="border-white/20 text-gray-300 hover:bg-white/10 bg-transparent">
                                            <span><FileText className="w-4 h-4 mr-2" />Upload CV</span>
                                        </Button>
                                    </label>
                                </div>
                            )}
                        </div>
                    </section>
                )}

                {/* Section 3: Languages & Rates */}
                <section className="space-y-4">
                    <h3 className="text-lg font-semibold text-white border-b border-white/10 pb-2">Language Pairs & Rates</h3>
                    <p className="text-sm text-gray-500">Add language pairs you work with and optionally your rates per specialization/tool.</p>
                    <div className="[&_*]:text-gray-900">
                        <LanguagePairRateInput
                            languagePairs={formData.language_pairs}
                            onChange={(pairs) => setFormData({ ...formData, language_pairs: pairs })}
                        />
                    </div>
                </section>

                {/* Section 4: Services */}
                <section className="space-y-4">
                    <h3 className="text-lg font-semibold text-white border-b border-white/10 pb-2">Services</h3>
                    <div className="flex flex-wrap gap-2">
                        {SERVICE_TYPES.map(s => (
                            <Badge
                                key={s}
                                className={`cursor-pointer transition-all ${
                                    formData.service_types.includes(s)
                                        ? 'bg-purple-500/30 text-purple-200 border-purple-500/50'
                                        : 'bg-white/5 text-gray-400 border-white/10 hover:border-purple-500/30'
                                }`}
                                onClick={() => toggleServiceType(s)}
                            >
                                {formData.service_types.includes(s) ? '✓ ' : ''}{s}
                            </Badge>
                        ))}
                    </div>
                </section>

                {/* Section 5: Specializations */}
                <section className="space-y-4">
                    <h3 className="text-lg font-semibold text-white border-b border-white/10 pb-2">Specializations</h3>
                    {formData.specializations?.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {formData.specializations.map((spec, idx) => (
                                <Badge key={idx} className="bg-white/10 text-gray-300 border-white/10 pr-1">
                                    {spec}
                                    <button onClick={() => removeItem('specializations', idx)} className="ml-1.5 hover:text-red-400"><X className="w-3 h-3" /></button>
                                </Badge>
                            ))}
                        </div>
                    )}
                    <div className="flex gap-2">
                        <Input
                            value={newSpec}
                            onChange={(e) => setNewSpec(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addItem('specializations', newSpec, setNewSpec))}
                            className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                            placeholder="e.g., Legal, Medical, Technical, Marketing..."
                        />
                        <Button type="button" variant="outline" onClick={() => addItem('specializations', newSpec, setNewSpec)} disabled={!newSpec.trim()} className="border-white/20 text-gray-300 hover:bg-white/10 bg-transparent">
                            <Plus className="w-4 h-4" />
                        </Button>
                    </div>
                </section>

                {/* Section 6: Experience & Education */}
                <section className="space-y-4">
                    <h3 className="text-lg font-semibold text-white border-b border-white/10 pb-2">Experience & Education</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label className="text-gray-300">Years of Experience</Label>
                            <Input
                                type="number"
                                min="0"
                                step="0.5"
                                value={formData.experience_years}
                                onChange={(e) => setFormData({ ...formData, experience_years: parseFloat(e.target.value) || '' })}
                                className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                                placeholder="e.g., 5"
                            />
                        </div>
                        <div>
                            <Label className="text-gray-300">Native Language</Label>
                            <Input
                                value={formData.native_language}
                                onChange={(e) => setFormData({ ...formData, native_language: e.target.value })}
                                className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                                placeholder="e.g., Turkish"
                            />
                        </div>
                    </div>
                    <div>
                        <Label className="text-gray-300">Education</Label>
                        <Textarea
                            value={formData.education}
                            onChange={(e) => setFormData({ ...formData, education: e.target.value })}
                            className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 h-20"
                            placeholder="Degree, university, year..."
                        />
                    </div>
                </section>

                {/* Section 7: Skills & CAT Tools */}
                <section className="space-y-4">
                    <h3 className="text-lg font-semibold text-white border-b border-white/10 pb-2">Skills & CAT Tools</h3>
                    <div className="flex flex-wrap gap-2 mb-3">
                        {COMMON_TOOLS.map(tool => (
                            <Badge
                                key={tool}
                                className={`cursor-pointer transition-all ${
                                    formData.skills?.includes(tool)
                                        ? 'bg-purple-500/30 text-purple-200 border-purple-500/50'
                                        : 'bg-white/5 text-gray-400 border-white/10 hover:border-purple-500/30'
                                }`}
                                onClick={() => toggleSkill(tool)}
                            >
                                {formData.skills?.includes(tool) ? '✓ ' : '+ '}{tool}
                            </Badge>
                        ))}
                    </div>
                    {formData.skills?.filter(s => !COMMON_TOOLS.includes(s)).length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {formData.skills.filter(s => !COMMON_TOOLS.includes(s)).map((skill, idx) => (
                                <Badge key={idx} className="bg-white/10 text-gray-300 border-white/10 pr-1">
                                    {skill}
                                    <button onClick={() => removeItem('skills', formData.skills.indexOf(skill))} className="ml-1.5 hover:text-red-400"><X className="w-3 h-3" /></button>
                                </Badge>
                            ))}
                        </div>
                    )}
                    <div className="flex gap-2">
                        <Input
                            value={newSkill}
                            onChange={(e) => setNewSkill(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addItem('skills', newSkill, setNewSkill))}
                            className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                            placeholder="Add other tools or skills..."
                        />
                        <Button type="button" variant="outline" onClick={() => addItem('skills', newSkill, setNewSkill)} disabled={!newSkill.trim()} className="border-white/20 text-gray-300 hover:bg-white/10 bg-transparent">
                            <Plus className="w-4 h-4" />
                        </Button>
                    </div>
                </section>

                {/* Section 8: Certifications */}
                <section className="space-y-4">
                    <h3 className="text-lg font-semibold text-white border-b border-white/10 pb-2">Certifications</h3>
                    {formData.certifications?.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {formData.certifications.map((cert, idx) => (
                                <Badge key={idx} className="bg-white/10 text-gray-300 border-white/10 pr-1">
                                    {cert}
                                    <button onClick={() => removeItem('certifications', idx)} className="ml-1.5 hover:text-red-400"><X className="w-3 h-3" /></button>
                                </Badge>
                            ))}
                        </div>
                    )}
                    <div className="flex gap-2">
                        <Input
                            value={newCert}
                            onChange={(e) => setNewCert(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addItem('certifications', newCert, setNewCert))}
                            className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                            placeholder="e.g., ATA Certified Translator"
                        />
                        <Button type="button" variant="outline" onClick={() => addItem('certifications', newCert, setNewCert)} disabled={!newCert.trim()} className="border-white/20 text-gray-300 hover:bg-white/10 bg-transparent">
                            <Plus className="w-4 h-4" />
                        </Button>
                    </div>
                </section>

                {/* Section 9: Additional */}
                <section className="space-y-4">
                    <h3 className="text-lg font-semibold text-white border-b border-white/10 pb-2">Additional Info</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label className="text-gray-300">LinkedIn</Label>
                            <Input
                                type="url"
                                value={formData.linkedin_url}
                                onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
                                className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                                placeholder="https://linkedin.com/in/..."
                            />
                        </div>
                        <div>
                            <Label className="text-gray-300">Portfolio / Website</Label>
                            <Input
                                type="url"
                                value={formData.portfolio_url}
                                onChange={(e) => setFormData({ ...formData, portfolio_url: e.target.value })}
                                className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                                placeholder="https://..."
                            />
                        </div>
                    </div>
                    <div>
                        <Label className="text-gray-300">Availability</Label>
                        <Select value={formData.availability} onValueChange={(v) => setFormData({ ...formData, availability: v })}>
                            <SelectTrigger className="bg-white/5 border-white/10 text-white">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Immediate">Immediate</SelectItem>
                                <SelectItem value="Within 1 week">Within 1 week</SelectItem>
                                <SelectItem value="Within 2 weeks">Within 2 weeks</SelectItem>
                                <SelectItem value="Within 1 month">Within 1 month</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <Label className="text-gray-300">Why do you want to join our team?</Label>
                        <Textarea
                            value={formData.why_join}
                            onChange={(e) => setFormData({ ...formData, why_join: e.target.value })}
                            className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 h-24"
                            placeholder="Tell us about your motivation..."
                        />
                    </div>
                </section>

                {/* Submit */}
                <div className="flex gap-4 pt-4 border-t border-white/10">
                    <Button
                        type="submit"
                        className="flex-1 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-white shadow-lg shadow-purple-500/25 h-12 text-base"
                        disabled={createMutation.isPending || !formData.cv_file_url}
                    >
                        {createMutation.isPending ? (
                            <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Submitting...</>
                        ) : (
                            'Submit Application'
                        )}
                    </Button>
                    <Button type="button" variant="outline" onClick={onCancel} className="border-white/20 text-gray-300 hover:bg-white/10 bg-transparent">
                        Cancel
                    </Button>
                </div>
            </form>
        </div>
    );
}