import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, FileText, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function UploadCV({ onSuccess }) {
    const [files, setFiles] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [parsing, setParsing] = useState(false);
    const [error, setError] = useState(null);
    const [progress, setProgress] = useState({ current: 0, total: 0 });

    const handleFileSelect = (e) => {
        const selectedFiles = Array.from(e.target.files);
        if (selectedFiles.length > 0) {
            setFiles(selectedFiles);
            setError(null);
        }
    };

    const handleUpload = async () => {
        if (files.length === 0) return;

        setUploading(true);
        setError(null);
        setProgress({ current: 0, total: files.length });

        try {
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                setProgress({ current: i + 1, total: files.length });

                // Upload file
                const { file_url } = await base44.integrations.Core.UploadFile({ file });

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
                }

                setParsing(false);
            }
            
            setFiles([]);
            setUploading(false);
            onSuccess();

        } catch (err) {
            setError(err.message || 'Failed to upload CVs');
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
                        multiple
                    />
                    <label htmlFor="cv-upload" className="cursor-pointer">
                        {files.length > 0 ? (
                            <div className="space-y-2">
                                <div className="flex items-center justify-center gap-2 text-green-600">
                                    <FileText className="w-6 h-6" />
                                    <span className="font-medium">{files.length} file(s) selected</span>
                                </div>
                                <div className="text-sm text-gray-500 max-h-24 overflow-y-auto">
                                    {files.map((f, i) => (
                                        <div key={i}>{f.name}</div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div>
                                <Upload className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                                <p className="text-gray-600">Click to select CV files</p>
                                <p className="text-sm text-gray-400 mt-1">Multiple files supported - PDF, DOC, DOCX</p>
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
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-blue-600 bg-blue-50 p-3 rounded-lg">
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span>
                                {parsing ? 'Parsing CV with AI...' : `Processing ${progress.current} of ${progress.total}...`}
                            </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${(progress.current / progress.total) * 100}%` }}
                            />
                        </div>
                    </div>
                )}

                <Button
                    onClick={handleUpload}
                    disabled={files.length === 0 || uploading || parsing}
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
                            Upload & Parse {files.length > 0 ? `${files.length} CV(s)` : 'CVs'}
                        </>
                    )}
                </Button>
            </CardContent>
        </Card>
    );
}