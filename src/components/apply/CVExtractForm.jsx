import React, { useState } from 'react';
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Upload, CheckCircle, Loader2, FileText, Sparkles, X } from "lucide-react";
import { toast } from "sonner";

export default function CVExtractForm({ onExtracted, onSkip, cvUrl, onCvUpload }) {
    const [uploading, setUploading] = useState(false);
    const [extracting, setExtracting] = useState(false);

    const MAX_FILE_SIZE = 5 * 1024 * 1024;

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
            onCvUpload(file_url);
            toast.success('CV uploaded successfully');
        } catch {
            toast.error('Failed to upload CV');
        } finally {
            setUploading(false);
        }
    };

    const handleExtract = async () => {
        if (!cvUrl) return;
        setExtracting(true);
        try {
            const result = await base44.integrations.Core.ExtractDataFromUploadedFile({
                file_url: cvUrl,
                json_schema: {
                    type: "object",
                    properties: {
                        full_name: { type: "string" },
                        email: { type: "string" },
                        phone: { type: "string" },
                        location: { type: "string" },
                        experience_years: { type: "number" },
                        education: { type: "string" },
                        languages: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    source_language: { type: "string" },
                                    target_language: { type: "string" },
                                    proficiency: { type: "string", enum: ["Native", "Fluent", "Professional", "Intermediate"] }
                                }
                            }
                        },
                        service_types: {
                            type: "array",
                            items: { type: "string", enum: ["Translation", "Interpretation", "Proofreading", "Localization", "Transcription", "Subtitling", "MTPE", "Review", "LQA", "Transcreation"] }
                        },
                        specializations: {
                            type: "array",
                            items: { type: "string" }
                        },
                        skills: {
                            type: "array",
                            items: { type: "string" }
                        },
                        certifications: {
                            type: "array",
                            items: { type: "string" }
                        },
                        linkedin_url: { type: "string" },
                        portfolio_url: { type: "string" },
                        native_language: { type: "string" }
                    }
                }
            });

            if (result.status === 'success' && result.output) {
                onExtracted(result.output);
                toast.success('Profile data extracted from your CV!');
            } else {
                toast.error('Could not extract data. Please fill in manually.');
                onSkip();
            }
        } catch {
            toast.error('Extraction failed. Please fill in manually.');
            onSkip();
        } finally {
            setExtracting(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="text-center mb-2">
                <h2 className="text-2xl font-bold text-white mb-2">Start with Your CV</h2>
                <p className="text-gray-400">
                    Upload your CV and we'll auto-fill your profile, or skip to fill manually.
                </p>
            </div>

            <div className="bg-white/5 border-2 border-dashed border-white/20 rounded-xl p-8 text-center hover:border-purple-500/40 transition-colors">
                {uploading ? (
                    <div className="flex flex-col items-center gap-3">
                        <Loader2 className="w-10 h-10 animate-spin text-purple-400" />
                        <p className="text-gray-400">Uploading...</p>
                    </div>
                ) : cvUrl ? (
                    <div className="flex flex-col items-center gap-3">
                        <CheckCircle className="w-10 h-10 text-green-400" />
                        <p className="text-green-400 font-medium">CV uploaded successfully</p>
                        <div className="flex gap-3">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="border-white/20 text-gray-300 hover:bg-white/10 bg-transparent"
                                onClick={() => onCvUpload('')}
                            >
                                <X className="w-4 h-4 mr-1" /> Remove
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div>
                        <Upload className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                        <p className="text-gray-300 mb-1">Upload your CV (PDF, DOC, DOCX)</p>
                        <p className="text-sm text-gray-500 mb-4">Max 5MB</p>
                        <input
                            type="file"
                            accept=".pdf,.doc,.docx"
                            onChange={handleFileUpload}
                            className="hidden"
                            id="cv-extract-upload"
                        />
                        <label htmlFor="cv-extract-upload">
                            <Button type="button" variant="outline" asChild className="border-white/20 text-gray-300 hover:bg-white/10 bg-transparent">
                                <span><FileText className="w-4 h-4 mr-2" />Select File</span>
                            </Button>
                        </label>
                    </div>
                )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
                {cvUrl && (
                    <Button
                        onClick={handleExtract}
                        disabled={extracting}
                        className="flex-1 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-white shadow-lg shadow-purple-500/25"
                    >
                        {extracting ? (
                            <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Extracting with AI...</>
                        ) : (
                            <><Sparkles className="w-4 h-4 mr-2" />Auto-fill from CV</>
                        )}
                    </Button>
                )}
                <Button
                    onClick={onSkip}
                    variant="outline"
                    className={`border-white/20 text-gray-300 hover:bg-white/10 bg-transparent ${cvUrl ? '' : 'flex-1'}`}
                >
                    {cvUrl ? 'Skip, fill manually' : 'Fill form manually'}
                </Button>
            </div>
        </div>
    );
}