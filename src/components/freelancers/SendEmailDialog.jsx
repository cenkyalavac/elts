import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Loader2, Upload, X, FileText } from "lucide-react";
import { toast } from "sonner";
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

export default function SendEmailDialog({ open, onOpenChange, freelancer }) {
    const [useTemplate, setUseTemplate] = useState(true);
    const [selectedTemplate, setSelectedTemplate] = useState('');
    const [customSubject, setCustomSubject] = useState('');
    const [customBody, setCustomBody] = useState('');
    const [attachments, setAttachments] = useState([]);
    const [uploading, setUploading] = useState(false);

    const { data: templates = [] } = useQuery({
        queryKey: ['emailTemplates'],
        queryFn: () => base44.entities.EmailTemplate.list('-created_date'),
        enabled: open,
    });

    const activeTemplates = templates.filter(t => t.is_active && t.trigger_type === 'manual');

    const sendEmailMutation = useMutation({
        mutationFn: async (data) => {
            const response = await base44.functions.invoke('sendTemplatedEmail', data);
            return response.data;
        },
        onSuccess: () => {
            toast.success('Email sent successfully');
            onOpenChange(false);
            resetForm();
        },
        onError: (error) => {
            toast.error('Failed to send email: ' + error.message);
        }
    });

    const resetForm = () => {
        setUseTemplate(true);
        setSelectedTemplate('');
        setCustomSubject('');
        setCustomBody('');
        setAttachments([]);
    };

    const handleFileUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        setUploading(true);
        try {
            const uploadPromises = files.map(async (file) => {
                const result = await base44.integrations.Core.UploadFile({ file });
                return {
                    url: result.file_url,
                    name: file.name,
                    size: file.size
                };
            });

            const uploadedFiles = await Promise.all(uploadPromises);
            setAttachments([...attachments, ...uploadedFiles]);
            toast.success(`${files.length} file(s) uploaded`);
        } catch (error) {
            toast.error('Failed to upload files: ' + error.message);
        } finally {
            setUploading(false);
        }
    };

    const removeAttachment = (index) => {
        setAttachments(attachments.filter((_, i) => i !== index));
    };

    const handleSend = () => {
        const payload = {
            freelancer_id: freelancer.id,
            attachment_urls: attachments.map(a => a.url)
        };

        if (useTemplate && selectedTemplate) {
            payload.template_id = selectedTemplate;
        } else if (!useTemplate && customSubject && customBody) {
            payload.custom_subject = customSubject;
            payload.custom_body = customBody;
        } else {
            toast.error('Please select a template or provide subject and body');
            return;
        }

        sendEmailMutation.mutate(payload);
    };

    const selectedTemplateData = templates.find(t => t.id === selectedTemplate);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Send Email to {freelancer?.full_name}</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <p className="text-sm text-blue-900">
                            <strong>To:</strong> {freelancer?.email}
                        </p>
                    </div>

                    <div className="flex gap-2">
                        <Button
                            variant={useTemplate ? "default" : "outline"}
                            onClick={() => setUseTemplate(true)}
                            className="flex-1"
                        >
                            Use Template
                        </Button>
                        <Button
                            variant={!useTemplate ? "default" : "outline"}
                            onClick={() => setUseTemplate(false)}
                            className="flex-1"
                        >
                            Custom Email
                        </Button>
                    </div>

                    {useTemplate ? (
                        <div>
                            <Label>Select Template</Label>
                            <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Choose a template" />
                                </SelectTrigger>
                                <SelectContent>
                                    {activeTemplates.map(t => (
                                        <SelectItem key={t.id} value={t.id}>
                                            {t.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            {selectedTemplateData && (
                                <Card className="mt-4">
                                    <CardContent className="pt-4">
                                        <div className="space-y-2">
                                            <div>
                                                <strong className="text-sm">Subject:</strong>
                                                <p className="text-sm text-gray-700 mt-1">
                                                    {selectedTemplateData.subject}
                                                </p>
                                            </div>
                                            <div>
                                                <strong className="text-sm">Preview:</strong>
                                                <div 
                                                    className="text-sm text-gray-700 mt-1 prose prose-sm max-w-none"
                                                    dangerouslySetInnerHTML={{ __html: selectedTemplateData.body }}
                                                />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="subject">Subject</Label>
                                <Input
                                    id="subject"
                                    value={customSubject}
                                    onChange={(e) => setCustomSubject(e.target.value)}
                                    placeholder="Email subject"
                                />
                            </div>
                            <div>
                                <Label htmlFor="body">Message</Label>
                                <ReactQuill
                                    theme="snow"
                                    value={customBody}
                                    onChange={setCustomBody}
                                    placeholder="Write your message..."
                                    className="bg-white rounded-md"
                                    modules={{
                                        toolbar: [
                                            [{ 'header': [1, 2, 3, false] }],
                                            ['bold', 'italic', 'underline'],
                                            [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                                            ['link'],
                                            ['clean']
                                        ]
                                    }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Attachments */}
                    <div>
                        <Label>Attachments</Label>
                        <div className="mt-2">
                            <input
                                type="file"
                                multiple
                                onChange={handleFileUpload}
                                className="hidden"
                                id="file-upload"
                                disabled={uploading}
                            />
                            <label htmlFor="file-upload">
                                <Button
                                    type="button"
                                    variant="outline"
                                    disabled={uploading}
                                    className="cursor-pointer"
                                    asChild
                                >
                                    <span>
                                        {uploading ? (
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        ) : (
                                            <Upload className="w-4 h-4 mr-2" />
                                        )}
                                        Upload Files
                                    </span>
                                </Button>
                            </label>

                            {attachments.length > 0 && (
                                <div className="mt-3 space-y-2">
                                    {attachments.map((file, index) => (
                                        <div
                                            key={index}
                                            className="flex items-center justify-between bg-gray-50 border rounded-lg p-2"
                                        >
                                            <div className="flex items-center gap-2">
                                                <FileText className="w-4 h-4 text-gray-500" />
                                                <span className="text-sm">{file.name}</span>
                                                <Badge variant="outline" className="text-xs">
                                                    {(file.size / 1024).toFixed(1)} KB
                                                </Badge>
                                            </div>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => removeAttachment(index)}
                                            >
                                                <X className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <Button
                            variant="outline"
                            onClick={() => {
                                onOpenChange(false);
                                resetForm();
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSend}
                            disabled={sendEmailMutation.isPending}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            {sendEmailMutation.isPending && (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            )}
                            Send Email
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}