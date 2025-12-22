import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { HelpCircle, Upload, FileText, CheckCircle, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function CVUploadStep({ formData, updateFormData }) {
    const [uploading, setUploading] = useState(false);
    const [fileName, setFileName] = useState('');

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        setFileName(file.name);

        try {
            const { file_url } = await base44.integrations.Core.UploadFile({ file });
            updateFormData({ cv_file_url: file_url });
        } catch (error) {
            console.error('Upload failed:', error);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-2">
                    <FileText className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                        <p className="text-sm font-medium text-blue-900 mb-1">Upload Your CV (Optional)</p>
                        <p className="text-sm text-blue-800">
                            Adding your CV helps clients get a complete picture of your background and experience.
                        </p>
                    </div>
                </div>
            </div>

            <div>
                <div className="flex items-center gap-2 mb-3">
                    <Label>CV/Resume</Label>
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger>
                                <HelpCircle className="w-4 h-4 text-gray-400" />
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                                <p>Upload your CV or resume in PDF, DOC, or DOCX format</p>
                                <p className="mt-2 text-xs">Make sure it includes:</p>
                                <ul className="text-xs mt-1 space-y-1">
                                    <li>• Your contact information</li>
                                    <li>• Language pairs and proficiency</li>
                                    <li>• Work experience</li>
                                    <li>• Education and certifications</li>
                                </ul>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>

                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors">
                    <input
                        type="file"
                        id="cv-upload"
                        className="hidden"
                        accept=".pdf,.doc,.docx"
                        onChange={handleFileUpload}
                        disabled={uploading}
                    />
                    <label htmlFor="cv-upload" className="cursor-pointer">
                        {uploading ? (
                            <div className="space-y-2">
                                <Loader2 className="w-12 h-12 mx-auto text-blue-600 animate-spin" />
                                <p className="text-gray-600">Uploading...</p>
                            </div>
                        ) : formData.cv_file_url ? (
                            <div className="space-y-2">
                                <CheckCircle className="w-12 h-12 mx-auto text-green-600" />
                                <p className="text-green-600 font-medium">CV Uploaded Successfully!</p>
                                <p className="text-sm text-gray-500">{fileName}</p>
                                <Button variant="outline" size="sm" className="mt-2">
                                    Upload Different File
                                </Button>
                            </div>
                        ) : (
                            <div>
                                <Upload className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                                <p className="text-gray-600 font-medium">Click to upload your CV</p>
                                <p className="text-sm text-gray-400 mt-1">PDF, DOC, or DOCX (max 10MB)</p>
                            </div>
                        )}
                    </label>
                </div>

                <p className="text-xs text-gray-500 mt-2">
                    You can skip this step and add your CV later from your profile
                </p>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <p className="text-sm text-purple-900 font-medium mb-1">🎉 Almost Done!</p>
                <p className="text-sm text-purple-800">
                    Click "Complete Profile" to finish setting up your freelancer account. 
                    You'll be able to edit all this information later from your profile page.
                </p>
            </div>
        </div>
    );
}