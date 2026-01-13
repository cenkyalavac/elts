import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Download, Upload, CheckCircle, Clock } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';

export default function DocumentSigningCard({ document, signature, freelancerId, onSigned }) {
    const [showUploadForm, setShowUploadForm] = useState(false);
    const [file, setFile] = useState(null);

    const signMutation = useMutation({
        mutationFn: async () => {
            if (!file) throw new Error('Please select a file');

            // Upload signed document
            const uploadResponse = await base44.functions.invoke('uploadFile', { file });

            // Create signature record
            const signResponse = await base44.functions.invoke('signDocument', {
                document_id: document.id,
                freelancer_id: freelancerId,
                signature_file_url: uploadResponse.data.file_url
            });

            return signResponse.data;
        },
        onSuccess: (data) => {
            toast.success(`${document.title} signed successfully`);
            setFile(null);
            setShowUploadForm(false);
            onSigned?.();
        },
        onError: (error) => {
            toast.error(error.message || 'Failed to sign document');
        }
    });

    const handleFileChange = (e) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            if (selectedFile.size > 10 * 1024 * 1024) {
                toast.error('File size must be less than 10MB');
                return;
            }
            setFile(selectedFile);
        }
    };

    const isSigned = signature?.status === 'signed';
    const isPending = signature?.status === 'pending';

    return (
        <Card className={`p-4 ${isSigned ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
            <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                    <FileText className="w-5 h-5 text-gray-600 mt-1 flex-shrink-0" />
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-gray-900">{document.title}</h4>
                            <Badge variant={isSigned ? 'default' : 'secondary'}>
                                {isSigned ? (
                                    <>
                                        <CheckCircle className="w-3 h-3 mr-1" />
                                        Signed
                                    </>
                                ) : (
                                    <>
                                        <Clock className="w-3 h-3 mr-1" />
                                        Pending
                                    </>
                                )}
                            </Badge>
                        </div>
                        <p className="text-sm text-gray-600">{document.description}</p>
                        {isSigned && signature?.signed_date && (
                            <p className="text-xs text-green-700 mt-1">
                                Signed on {format(parseISO(signature.signed_date), 'MMM d, yyyy')}
                            </p>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(document.file_url, '_blank')}
                        className="gap-1"
                    >
                        <Download className="w-4 h-4" />
                        View
                    </Button>

                    {!isSigned && (
                        <Button
                            size="sm"
                            onClick={() => setShowUploadForm(!showUploadForm)}
                            variant={showUploadForm ? 'default' : 'outline'}
                        >
                            {showUploadForm ? 'Cancel' : 'Sign'}
                        </Button>
                    )}
                </div>
            </div>

            {showUploadForm && !isSigned && (
                <div className="mt-4 pt-4 border-t border-yellow-200">
                    <p className="text-sm text-gray-600 mb-3">
                        Download the document, sign it, and upload the signed copy
                    </p>
                    <div className="space-y-3">
                        <input
                            type="file"
                            accept=".pdf,.docx,.doc"
                            onChange={handleFileChange}
                            className="block w-full text-sm"
                        />
                        {file && (
                            <p className="text-sm text-green-600">
                                ✓ {file.name} ({(file.size / 1024).toFixed(0)}KB)
                            </p>
                        )}
                        <Button
                            onClick={() => signMutation.mutate()}
                            disabled={!file || signMutation.isPending}
                            className="w-full"
                        >
                            <Upload className="w-4 h-4 mr-2" />
                            {signMutation.isPending ? 'Uploading...' : 'Upload Signed Document'}
                        </Button>
                    </div>
                </div>
            )}
        </Card>
    );
}