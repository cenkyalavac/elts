import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, FileText, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function UploadCV({ onSuccess }) {
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [parsing, setParsing] = useState(false);
    const [error, setError] = useState(null);

    const handleFileSelect = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            setFile(selectedFile);
            setError(null);
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        setUploading(true);
        setError(null);

        try {
            // Upload file
            const { file_url } = await base44.integrations.Core.UploadFile({ file });

            setUploading(false);
            setParsing(true);

            // Parse CV
            const response = await base44.functions.invoke('parseCV', { file_url });

            if (response.data.success) {
                // Create freelancer record
                const freelancerData = {
                    ...response.data.data,
                    cv_file_url: file_url,
                    status: 'New'
                };

                await base44.entities.Freelancer.create(freelancerData);
                
                setFile(null);
                setParsing(false);
                onSuccess();
            } else {
                throw new Error('Failed to parse CV');
            }

        } catch (err) {
            setError(err.message || 'Failed to upload CV');
            setUploading(false);
            setParsing(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Upload className="w-5 h-5" />
                    Upload Freelancer CV
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors">
                    <input
                        type="file"
                        id="cv-upload"
                        className="hidden"
                        accept=".pdf,.doc,.docx"
                        onChange={handleFileSelect}
                        disabled={uploading || parsing}
                    />
                    <label htmlFor="cv-upload" className="cursor-pointer">
                        {file ? (
                            <div className="flex items-center justify-center gap-2 text-green-600">
                                <FileText className="w-6 h-6" />
                                <span className="font-medium">{file.name}</span>
                            </div>
                        ) : (
                            <div>
                                <Upload className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                                <p className="text-gray-600">Click to select CV file</p>
                                <p className="text-sm text-gray-400 mt-1">PDF, DOC, DOCX supported</p>
                            </div>
                        )}
                    </label>
                </div>

                {error && (
                    <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg">
                        <XCircle className="w-5 h-5" />
                        <span>{error}</span>
                    </div>
                )}

                {(uploading || parsing) && (
                    <div className="flex items-center gap-2 text-blue-600 bg-blue-50 p-3 rounded-lg">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>{uploading ? 'Uploading file...' : 'Parsing CV with AI...'}</span>
                    </div>
                )}

                <Button
                    onClick={handleUpload}
                    disabled={!file || uploading || parsing}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                >
                    {uploading || parsing ? (
                        <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Processing...
                        </>
                    ) : (
                        <>
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Upload & Parse CV
                        </>
                    )}
                </Button>
            </CardContent>
        </Card>
    );
}