import React, { useState } from 'react';
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Upload, File, Trash2, ExternalLink, Loader2 } from "lucide-react";

export default function PortfolioSection({ freelancer }) {
    const queryClient = useQueryClient();
    const [isUploading, setIsUploading] = useState(false);

    const updateMutation = useMutation({
        mutationFn: (data) => base44.entities.Freelancer.update(freelancer.id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['myApplication'] });
            toast.success("Portfolio updated!");
        },
        onError: () => {
            toast.error("Failed to update portfolio");
        }
    });

    const handleFileUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        try {
            const { file_url } = await base44.integrations.Core.UploadFile({ file });
            updateMutation.mutate({ portfolio_file_url: file_url });
        } catch (error) {
            toast.error("Upload failed");
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <Card className="border-0 shadow-sm">
            <CardHeader>
                <CardTitle>Portfolio & Work Samples</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {freelancer?.portfolio_file_url ? (
                    <div className="space-y-3">
                        <div className="p-4 bg-blue-50 rounded-lg flex items-start justify-between">
                            <div className="flex items-start gap-3">
                                <File className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
                                <div className="flex-1">
                                    <p className="font-medium text-sm text-gray-900">Portfolio Document</p>
                                    <p className="text-xs text-gray-500 mt-1">Uploaded portfolio showcasing your work</p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <a href={freelancer.portfolio_file_url} target="_blank" rel="noopener noreferrer">
                                    <Button variant="outline" size="sm" className="gap-2">
                                        <ExternalLink className="w-4 h-4" /> View
                                    </Button>
                                </a>
                            </div>
                        </div>
                        <div className="relative">
                            <input 
                                type="file"
                                onChange={handleFileUpload}
                                disabled={isUploading}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                            <Button variant="outline" disabled={isUploading} className="w-full gap-2">
                                {isUploading ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Upload className="w-4 h-4" />
                                )}
                                Update Portfolio
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                        <File className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-700 font-medium mb-1">Upload Your Portfolio</p>
                        <p className="text-sm text-gray-500 mb-4">Showcase your best work and past projects</p>
                        <div className="relative inline-block">
                            <input 
                                type="file"
                                onChange={handleFileUpload}
                                disabled={isUploading}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                            <Button disabled={isUploading} className="gap-2">
                                {isUploading ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Upload className="w-4 h-4" />
                                )}
                                Upload Portfolio
                            </Button>
                        </div>
                    </div>
                )}
                <p className="text-xs text-gray-500">Supported formats: PDF, Word, ZIP (Max 50MB)</p>
            </CardContent>
        </Card>
    );
}