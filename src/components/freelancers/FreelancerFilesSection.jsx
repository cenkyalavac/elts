import React, { useState } from 'react';
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { 
    Upload, FileText, File, Image, Trash2, Download, 
    Plus, X, Loader2
} from "lucide-react";

export default function FreelancerFilesSection({ freelancer, onUpdate }) {
    const [uploading, setUploading] = useState(false);
    const [uploadType, setUploadType] = useState(null);
    const queryClient = useQueryClient();

    const fileTypes = [
        { key: 'cv_file_url', label: 'CV / Resume', icon: FileText },
        { key: 'nda_file_url', label: 'NDA Document', icon: File },
        { key: 'portfolio_file_url', label: 'Portfolio', icon: Image },
    ];

    const handleFileUpload = async (e, fileKey) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        setUploadType(fileKey);

        try {
            const { file_url } = await base44.integrations.Core.UploadFile({ file });
            onUpdate({ [fileKey]: file_url });
        } catch (error) {
            console.error('Upload failed:', error);
        } finally {
            setUploading(false);
            setUploadType(null);
        }
    };

    const handleCertificationUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        setUploadType('certification');

        try {
            const { file_url } = await base44.integrations.Core.UploadFile({ file });
            const currentFiles = freelancer.certification_files || [];
            onUpdate({ certification_files: [...currentFiles, file_url] });
        } catch (error) {
            console.error('Upload failed:', error);
        } finally {
            setUploading(false);
            setUploadType(null);
        }
    };

    const removeCertificationFile = (index) => {
        const currentFiles = freelancer.certification_files || [];
        onUpdate({ 
            certification_files: currentFiles.filter((_, i) => i !== index) 
        });
    };

    const removeFile = (fileKey) => {
        onUpdate({ [fileKey]: null });
    };

    const getFileName = (url) => {
        if (!url) return '';
        const parts = url.split('/');
        return decodeURIComponent(parts[parts.length - 1]).substring(0, 30) + '...';
    };

    return (
        <div className="space-y-4">
            <h3 className="font-semibold text-lg">Documents & Files</h3>

            {/* Main Documents */}
            <div className="grid gap-3">
                {fileTypes.map(({ key, label, icon: Icon }) => (
                    <Card key={key}>
                        <CardContent className="py-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-gray-100 rounded-lg">
                                        <Icon className="w-5 h-5 text-gray-600" />
                                    </div>
                                    <div>
                                        <div className="font-medium text-sm">{label}</div>
                                        {freelancer[key] ? (
                                            <a 
                                                href={freelancer[key]} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="text-xs text-blue-600 hover:underline"
                                            >
                                                {getFileName(freelancer[key])}
                                            </a>
                                        ) : (
                                            <span className="text-xs text-gray-400">Not uploaded</span>
                                        )}
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    {freelancer[key] && (
                                        <>
                                            <a href={freelancer[key]} target="_blank" rel="noopener noreferrer">
                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                    <Download className="w-4 h-4" />
                                                </Button>
                                            </a>
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className="h-8 w-8 text-red-500 hover:text-red-700"
                                                onClick={() => removeFile(key)}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </>
                                    )}
                                    <Label className="cursor-pointer">
                                        <Input
                                            type="file"
                                            className="hidden"
                                            onChange={(e) => handleFileUpload(e, key)}
                                            accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                                        />
                                        <Button 
                                            variant="outline" 
                                            size="sm" 
                                            asChild
                                            disabled={uploading && uploadType === key}
                                        >
                                            <span>
                                                {uploading && uploadType === key ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <>
                                                        <Upload className="w-4 h-4 mr-1" />
                                                        {freelancer[key] ? 'Replace' : 'Upload'}
                                                    </>
                                                )}
                                            </span>
                                        </Button>
                                    </Label>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Certification Files */}
            <Card>
                <CardContent className="py-3">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-yellow-100 rounded-lg">
                                <FileText className="w-5 h-5 text-yellow-600" />
                            </div>
                            <div className="font-medium text-sm">Certification Documents</div>
                        </div>
                        <Label className="cursor-pointer">
                            <Input
                                type="file"
                                className="hidden"
                                onChange={handleCertificationUpload}
                                accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                            />
                            <Button 
                                variant="outline" 
                                size="sm" 
                                asChild
                                disabled={uploading && uploadType === 'certification'}
                            >
                                <span>
                                    {uploading && uploadType === 'certification' ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <>
                                            <Plus className="w-4 h-4 mr-1" />
                                            Add
                                        </>
                                    )}
                                </span>
                            </Button>
                        </Label>
                    </div>
                    
                    {freelancer.certification_files?.length > 0 ? (
                        <div className="space-y-2 pl-12">
                            {freelancer.certification_files.map((url, idx) => (
                                <div key={idx} className="flex items-center justify-between py-1 px-2 bg-gray-50 rounded">
                                    <a 
                                        href={url} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="text-sm text-blue-600 hover:underline truncate flex-1"
                                    >
                                        {getFileName(url)}
                                    </a>
                                    <div className="flex gap-1">
                                        <a href={url} target="_blank" rel="noopener noreferrer">
                                            <Button variant="ghost" size="icon" className="h-7 w-7">
                                                <Download className="w-3 h-3" />
                                            </Button>
                                        </a>
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="h-7 w-7 text-red-500"
                                            onClick={() => removeCertificationFile(idx)}
                                        >
                                            <X className="w-3 h-3" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-xs text-gray-400 pl-12">No certifications uploaded</div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}