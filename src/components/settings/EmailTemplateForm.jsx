import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Info } from "lucide-react";

const PLACEHOLDERS = [
    { key: '{{name}}', description: 'Freelancer full name' },
    { key: '{{email}}', description: 'Freelancer email' },
    { key: '{{phone}}', description: 'Freelancer phone' },
    { key: '{{location}}', description: 'Freelancer location' },
    { key: '{{status}}', description: 'Current status' },
    { key: '{{language_pairs}}', description: 'All language pairs' },
    { key: '{{native_language}}', description: 'Native language' },
    { key: '{{specializations}}', description: 'Specializations' },
    { key: '{{service_types}}', description: 'Service types' },
    { key: '{{skills}}', description: 'Skills' },
    { key: '{{experience_years}}', description: 'Years of experience' },
];

const STATUS_OPTIONS = [
    'New Application', 'Form Sent', 'Price Negotiation', 
    'Test Sent', 'Approved', 'On Hold', 'Rejected', 'Red Flag'
];

export default function EmailTemplateForm({ template, onSave, onCancel }) {
    const [formData, setFormData] = useState(template || {
        name: '',
        description: '',
        subject: '',
        body: '',
        trigger_type: 'manual',
        trigger_status: '',
        is_active: true
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    const insertPlaceholder = (placeholder, field) => {
        const textarea = document.getElementById(field);
        if (textarea) {
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const text = formData[field] || '';
            const newText = text.substring(0, start) + placeholder + text.substring(end);
            setFormData({ ...formData, [field]: newText });
            
            setTimeout(() => {
                textarea.focus();
                textarea.setSelectionRange(start + placeholder.length, start + placeholder.length);
            }, 0);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="name">Template Name *</Label>
                    <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g., Welcome Email"
                        required
                    />
                </div>
                <div>
                    <Label htmlFor="trigger_type">Trigger Type</Label>
                    <Select
                        value={formData.trigger_type}
                        onValueChange={(value) => setFormData({ ...formData, trigger_type: value })}
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="manual">Manual Send</SelectItem>
                            <SelectItem value="status_change">Status Change</SelectItem>
                            <SelectItem value="scheduled">Scheduled</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {formData.trigger_type === 'status_change' && (
                <div>
                    <Label htmlFor="trigger_status">Trigger Status</Label>
                    <Select
                        value={formData.trigger_status}
                        onValueChange={(value) => setFormData({ ...formData, trigger_status: value })}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                            {STATUS_OPTIONS.map(status => (
                                <SelectItem key={status} value={status}>{status}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            )}

            <div>
                <Label htmlFor="description">Description</Label>
                <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Brief description of this template"
                />
            </div>

            <div>
                <Label htmlFor="subject">Email Subject *</Label>
                <Input
                    id="subject"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    placeholder="e.g., Welcome to our team, {{name}}!"
                    required
                />
            </div>

            <div>
                <Label htmlFor="body">Email Body *</Label>
                <Textarea
                    id="body"
                    value={formData.body}
                    onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                    placeholder="Write your email template here..."
                    rows={10}
                    required
                />
            </div>

            <Card className="bg-blue-50 border-blue-200">
                <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                        <Info className="w-4 h-4" />
                        Available Placeholders
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap gap-2">
                        {PLACEHOLDERS.map(p => (
                            <Badge
                                key={p.key}
                                variant="outline"
                                className="cursor-pointer hover:bg-blue-100"
                                onClick={() => insertPlaceholder(p.key, 'body')}
                                title={p.description}
                            >
                                {p.key}
                            </Badge>
                        ))}
                    </div>
                    <p className="text-xs text-gray-600 mt-3">
                        Click a placeholder to insert it into the email body
                    </p>
                </CardContent>
            </Card>

            <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={onCancel}>
                    Cancel
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                    {template ? 'Update Template' : 'Create Template'}
                </Button>
            </div>
        </form>
    );
}