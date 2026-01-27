import React, { useState, useEffect, useRef } from 'react';
import { useMutation } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, CheckCircle, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import LanguagePairRateInput from "./LanguagePairRateInput";

const STORAGE_KEY = 'application_form_draft';

const initialFormData = {
    full_name: '',
    email: '',
    phone: '',
    location: '',
    cv_file_url: '',
    availability: 'Immediate',
    linkedin_url: '',
    portfolio_url: '',
    why_join: '',
    language_pairs: [],
    status: 'New Application',
    website_url: '' // Honeypot field
};

export default function ApplicationForm({ position, onCancel, onSuccess }) {
    const [uploading, setUploading] = useState(false);
    const [formData, setFormData] = useState(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch {
                return initialFormData;
            }
        }
        return initialFormData;
    });
    const isInitialMount = useRef(true);

    // Show toast on mount if draft was restored
    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            toast.success('Draft restored');
        }
    }, []);

    // Auto-save with debounce
    useEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false;
            return;
        }

        const timeoutId = setTimeout(() => {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
        }, 1000);

        return () => clearTimeout(timeoutId);
    }, [formData]);

    const createApplicationMutation = useMutation({
        mutationFn: async (data) => {
            return await base44.entities.Freelancer.create(data);
        },
        onSuccess: () => {
            localStorage.removeItem(STORAGE_KEY);
            toast.success('Application submitted successfully! We\'ll be in touch soon.');
            setFormData(initialFormData);
            onSuccess();
        },
        onError: (error) => {
            toast.error('Failed to submit application. Please try again.');
        }
    });

    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

    const handleFileUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.name.match(/\.(pdf|doc|docx)$/i)) {
            toast.error('Please upload a PDF, DOC, or DOCX file');
            return;
        }

        if (file.size > MAX_FILE_SIZE) {
            toast.error('File size must be less than 5MB');
            return;
        }

        setUploading(true);
        try {
            const { file_url } = await base44.integrations.Core.UploadFile({ file });
            setFormData(prev => ({ ...prev, cv_file_url: file_url }));
            toast.success('CV uploaded successfully');
        } catch (error) {
            toast.error('Failed to upload CV');
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Honeypot check - if filled, it's a bot
        if (formData.website_url) {
            toast.success('Application submitted successfully! We\'ll be in touch soon.');
            return;
        }
        
        if (!formData.cv_file_url) {
            toast.error('Please upload your CV');
            return;
        }

        // Sanitize phone number - keep only digits and leading +
        let sanitizedPhone = formData.phone;
        if (sanitizedPhone) {
            const hasPlus = sanitizedPhone.startsWith('+');
            sanitizedPhone = sanitizedPhone.replace(/[^\d]/g, '');
            if (hasPlus) sanitizedPhone = '+' + sanitizedPhone;
            
            // Validate minimum length (10 digits)
            const digitCount = sanitizedPhone.replace(/\D/g, '').length;
            if (digitCount < 10) {
                toast.error('Please enter a valid phone number with country code');
                return;
            }
        }

        const { website_url, ...submitData } = formData;
        await createApplicationMutation.mutateAsync({
            ...submitData,
            phone: sanitizedPhone
        });
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="text-2xl">
                            {position ? `Apply for: ${position.title}` : 'General Application'}
                        </CardTitle>
                        <p className="text-gray-600 mt-2">
                            Fill out the form below. We'll review your CV and get back to you.
                        </p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onCancel}>
                        <X className="w-5 h-5" />
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Honeypot field - hidden from real users */}
                    <div className="hidden" aria-hidden="true">
                        <Label htmlFor="website_url">Website URL</Label>
                        <Input
                            id="website_url"
                            name="website_url"
                            tabIndex={-1}
                            autoComplete="off"
                            value={formData.website_url}
                            onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                        />
                    </div>
                    
                    {/* Basic Information */}
                    <div className="space-y-4">
                        <h3 className="font-semibold text-lg">Basic Information</h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="full_name">Full Name *</Label>
                                <Input
                                    id="full_name"
                                    required
                                    value={formData.full_name}
                                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                />
                            </div>
                            <div>
                                <Label htmlFor="email">Email *</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="phone">Phone Number</Label>
                                <Input
                                    id="phone"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    placeholder="+1 234 567 8900"
                                />
                                <p className="text-xs text-gray-500 mt-1">Include country code (e.g., +1 234 567 8900)</p>
                            </div>
                            <div>
                                <Label htmlFor="location">Location</Label>
                                <Input
                                    id="location"
                                    value={formData.location}
                                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                    placeholder="City, Country"
                                />
                            </div>
                        </div>
                    </div>

                    {/* CV Upload */}
                    <div className="space-y-4">
                        <h3 className="font-semibold text-lg">CV/Resume *</h3>
                        <div className="border-2 border-dashed rounded-lg p-8 text-center">
                            {uploading ? (
                                <div className="flex flex-col items-center gap-2">
                                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                                    <p className="text-sm text-gray-600">Uploading...</p>
                                </div>
                            ) : formData.cv_file_url ? (
                                <div className="flex flex-col items-center gap-2">
                                    <CheckCircle className="w-8 h-8 text-green-600" />
                                    <p className="text-sm text-green-600 font-medium">CV uploaded successfully</p>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setFormData({ ...formData, cv_file_url: '' })}
                                    >
                                        Upload Different File
                                    </Button>
                                </div>
                            ) : (
                                <div>
                                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                    <p className="text-sm text-gray-600 mb-2">
                                        Upload your CV (PDF, DOC, or DOCX)
                                    </p>
                                    <input
                                        type="file"
                                        accept=".pdf,.doc,.docx"
                                        onChange={handleFileUpload}
                                        className="hidden"
                                        id="cv-upload"
                                    />
                                    <label htmlFor="cv-upload">
                                        <Button type="button" variant="outline" asChild>
                                            <span>Select File</span>
                                        </Button>
                                    </label>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Additional Information */}
                    <div className="space-y-4">
                        <h3 className="font-semibold text-lg">Additional Information</h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="linkedin_url">LinkedIn Profile</Label>
                                <Input
                                    id="linkedin_url"
                                    type="url"
                                    value={formData.linkedin_url}
                                    onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
                                    placeholder="https://linkedin.com/in/yourprofile"
                                />
                            </div>
                            <div>
                                <Label htmlFor="portfolio_url">Portfolio/Website</Label>
                                <Input
                                    id="portfolio_url"
                                    type="url"
                                    value={formData.portfolio_url}
                                    onChange={(e) => setFormData({ ...formData, portfolio_url: e.target.value })}
                                    placeholder="https://yourportfolio.com"
                                />
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="availability">Availability</Label>
                            <select
                                id="availability"
                                value={formData.availability}
                                onChange={(e) => setFormData({ ...formData, availability: e.target.value })}
                                className="w-full border rounded-md p-2"
                            >
                                <option value="Immediate">Immediate</option>
                                <option value="Within 1 week">Within 1 week</option>
                                <option value="Within 2 weeks">Within 2 weeks</option>
                                <option value="Within 1 month">Within 1 month</option>
                            </select>
                        </div>

                        <div>
                            <Label>Language Pairs & Rates</Label>
                            <p className="text-sm text-gray-600 mb-3">
                                Add your language pairs with rates. You can specify different rates for different specializations and tools.
                            </p>
                            <LanguagePairRateInput
                                languagePairs={formData.language_pairs}
                                onChange={(pairs) => setFormData({ ...formData, language_pairs: pairs })}
                            />
                        </div>

                        <div>
                            <Label htmlFor="why_join">Why do you want to join our team?</Label>
                            <Textarea
                                id="why_join"
                                value={formData.why_join}
                                onChange={(e) => setFormData({ ...formData, why_join: e.target.value })}
                                placeholder="Tell us about your motivation and what you can bring to our team..."
                                className="h-32"
                            />
                        </div>
                    </div>

                    {/* Submit */}
                    <div className="flex gap-4 pt-4">
                        <Button
                            type="submit"
                            className="flex-1 bg-blue-600 hover:bg-blue-700"
                            disabled={createApplicationMutation.isPending || !formData.cv_file_url}
                        >
                            {createApplicationMutation.isPending ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Submitting...
                                </>
                            ) : (
                                'Submit Application'
                            )}
                        </Button>
                        <Button type="button" variant="outline" onClick={onCancel}>
                            Cancel
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}