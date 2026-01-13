import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, AlertCircle, CheckCircle } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function DocumentUploadForm({ onSuccess }) {
    const [title, setTitle] = useState('');
    const [type, setType] = useState('NDA');
    const [description, setDescription] = useState('');
    const [file, setFile] = useState(null);
    const [requiredForApproval, setRequiredForApproval] = useState(true);

    const uploadMutation = useMutation({
        mutationFn: async () => {
            if (!file || !title || !type) {
                throw new Error('Please fill in all required fields');
            }

            // Upload file
            const uploadResponse = await base44.functions.invoke('uploadFile', { file });
            const fileUrl = uploadResponse.data.file_url;

            // Create document
            const docResponse = await base44.functions.invoke('createDocument', {
                title,
                type,
                description,
                file_url: fileUrl,
                required_for_approval: requiredForApproval
            });

            return docResponse.data;
        },
        onSuccess: (data) => {
            toast.success(`Document "${title}" uploaded successfully`);
            setTitle('');
            setType('NDA');
            setDescription('');
            setFile(null);
            setRequiredForApproval(true);
            onSuccess?.();
        },
        onError: (error) => {
            toast.error(error.message || 'Failed to upload document');
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

    return (
        <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Upload New Document</h3>
            <div className="space-y-4">
                <div>
                    <label className="text-sm font-medium">Document Title</label>
                    <Input
                        placeholder="e.g., NDA Agreement 2026"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                    />
                </div>

                <div>
                    <label className="text-sm font-medium">Document Type</label>
                    <Select value={type} onValueChange={setType}>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="NDA">NDA</SelectItem>
                            <SelectItem value="SLA">SLA</SelectItem>
                            <SelectItem value="Contract">Contract</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div>
                    <label className="text-sm font-medium">Description</label>
                    <textarea
                        placeholder="Document requirements and instructions..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full p-2 border rounded-md text-sm"
                        rows={3}
                    />
                </div>

                <div>
                    <label className="text-sm font-medium">Upload File (PDF, DOCX)</label>
                    <Input
                        type="file"
                        accept=".pdf,.docx,.doc"
                        onChange={handleFileChange}
                    />
                    {file && (
                        <p className="text-sm text-green-600 mt-1 flex items-center gap-1">
                            <CheckCircle className="w-4 h-4" />
                            {file.name}
                        </p>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        id="required"
                        checked={requiredForApproval}
                        onChange={(e) => setRequiredForApproval(e.target.checked)}
                        className="rounded"
                    />
                    <label htmlFor="required" className="text-sm">
                        Required for freelancer approval
                    </label>
                </div>

                <Button
                    onClick={() => uploadMutation.mutate()}
                    disabled={uploadMutation.isPending || !file}
                    className="w-full"
                >
                    <Upload className="w-4 h-4 mr-2" />
                    {uploadMutation.isPending ? 'Uploading...' : 'Upload Document'}
                </Button>
            </div>
        </Card>
    );
}