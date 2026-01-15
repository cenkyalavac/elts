import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Info, Image, Smile, Sparkles, Eye, Palette } from "lucide-react";
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

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

const EMAIL_DESIGNS = [
    { 
        id: 'modern', 
        name: 'Modern', 
        description: 'Clean and professional',
        primaryColor: '#7C3AED',
        accentColor: '#EC4899'
    },
    { 
        id: 'minimal', 
        name: 'Minimal', 
        description: 'Simple and elegant',
        primaryColor: '#1F2937',
        accentColor: '#3B82F6'
    },
    { 
        id: 'vibrant', 
        name: 'Vibrant', 
        description: 'Colorful and energetic',
        primaryColor: '#059669',
        accentColor: '#F59E0B'
    },
    { 
        id: 'corporate', 
        name: 'Corporate', 
        description: 'Traditional business style',
        primaryColor: '#1E40AF',
        accentColor: '#64748B'
    },
];

const POPULAR_GIFS = [
    { url: 'https://media.giphy.com/media/3oz8xAFtqoOUUrsh7W/giphy.gif', label: 'Welcome' },
    { url: 'https://media.giphy.com/media/xT0xeJpnrWC4XWblEk/giphy.gif', label: 'Thumbs Up' },
    { url: 'https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif', label: 'Celebrate' },
    { url: 'https://media.giphy.com/media/3oKIPnAiaMCws8nOsE/giphy.gif', label: 'Thank You' },
    { url: 'https://media.giphy.com/media/xUPGcguWZHRC2HyBRS/giphy.gif', label: 'Congrats' },
    { url: 'https://media.giphy.com/media/l4FGpPki5v2Bcd6Ss/giphy.gif', label: 'High Five' },
];

const POPULAR_EMOJIS = [
    '👋', '🎉', '✨', '🚀', '💼', '📝', '✅', '🌟', '💪', '🤝', 
    '📧', '🎯', '💡', '🔥', '❤️', '👏', '🙌', '😊', '🥳', '🏆'
];

export default function EmailTemplateForm({ template, onSave, onCancel }) {
    const [formData, setFormData] = useState(template || {
        name: '',
        description: '',
        subject: '',
        body: '',
        trigger_type: 'manual',
        trigger_status: '',
        is_active: true,
        design_template: 'modern',
        header_image_url: '',
        footer_text: '',
        button_text: '',
        button_url: '',
    });
    const [showPreview, setShowPreview] = useState(false);
    const [gifUrl, setGifUrl] = useState('');
    const [imageUrl, setImageUrl] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    const insertContent = (content) => {
        setFormData({ 
            ...formData, 
            body: formData.body + content 
        });
    };

    const insertEmoji = (emoji) => {
        setFormData({ 
            ...formData, 
            body: formData.body + emoji 
        });
    };

    const insertGif = (url) => {
        const gifHtml = `<p><img src="${url}" alt="GIF" style="max-width: 300px; border-radius: 8px;" /></p>`;
        setFormData({ 
            ...formData, 
            body: formData.body + gifHtml 
        });
    };

    const insertImage = () => {
        if (imageUrl) {
            const imgHtml = `<p><img src="${imageUrl}" alt="Image" style="max-width: 100%; border-radius: 8px;" /></p>`;
            setFormData({ 
                ...formData, 
                body: formData.body + imgHtml 
            });
            setImageUrl('');
        }
    };

    const selectedDesign = EMAIL_DESIGNS.find(d => d.id === formData.design_template) || EMAIL_DESIGNS[0];

    const renderPreview = () => {
        return (
            <div className="bg-gray-100 p-4 rounded-lg">
                <div 
                    className="max-w-xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden"
                    style={{ fontFamily: 'Arial, sans-serif' }}
                >
                    {/* Header */}
                    <div 
                        className="p-6 text-center"
                        style={{ 
                            background: `linear-gradient(135deg, ${selectedDesign.primaryColor}, ${selectedDesign.accentColor})` 
                        }}
                    >
                        {formData.header_image_url ? (
                            <img 
                                src={formData.header_image_url} 
                                alt="Header" 
                                className="max-h-16 mx-auto mb-3"
                            />
                        ) : (
                            <div className="text-white text-2xl font-bold">el turco</div>
                        )}
                    </div>
                    
                    {/* Body */}
                    <div className="p-6">
                        <div 
                            className="prose prose-sm max-w-none"
                            dangerouslySetInnerHTML={{ 
                                __html: formData.body.replace(/\{\{name\}\}/g, 'John Doe')
                                    .replace(/\{\{email\}\}/g, 'john@example.com')
                            }}
                        />
                        
                        {/* CTA Button */}
                        {formData.button_text && (
                            <div className="text-center mt-6">
                                <a 
                                    href={formData.button_url || '#'}
                                    className="inline-block px-8 py-3 rounded-full text-white font-semibold"
                                    style={{ backgroundColor: selectedDesign.primaryColor }}
                                >
                                    {formData.button_text}
                                </a>
                            </div>
                        )}
                    </div>
                    
                    {/* Footer */}
                    <div className="bg-gray-50 p-4 text-center text-xs text-gray-500">
                        {formData.footer_text || '© 2024 el turco. All rights reserved.'}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
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

            {/* Design Template Selection */}
            <div>
                <Label className="flex items-center gap-2 mb-3">
                    <Palette className="w-4 h-4" />
                    Email Design
                </Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {EMAIL_DESIGNS.map(design => (
                        <div
                            key={design.id}
                            onClick={() => setFormData({ ...formData, design_template: design.id })}
                            className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                                formData.design_template === design.id 
                                    ? 'border-purple-500 bg-purple-50' 
                                    : 'border-gray-200 hover:border-gray-300'
                            }`}
                        >
                            <div 
                                className="h-8 rounded mb-2"
                                style={{ 
                                    background: `linear-gradient(135deg, ${design.primaryColor}, ${design.accentColor})` 
                                }}
                            />
                            <div className="text-sm font-medium">{design.name}</div>
                            <div className="text-xs text-gray-500">{design.description}</div>
                        </div>
                    ))}
                </div>
            </div>

            <div>
                <Label htmlFor="subject">Email Subject *</Label>
                <Input
                    id="subject"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    placeholder="e.g., Welcome to our team, {{name}}! 🎉"
                    required
                />
            </div>

            {/* Header Image */}
            <div>
                <Label htmlFor="header_image_url">Header Logo/Image URL (optional)</Label>
                <Input
                    id="header_image_url"
                    value={formData.header_image_url}
                    onChange={(e) => setFormData({ ...formData, header_image_url: e.target.value })}
                    placeholder="https://example.com/logo.png"
                />
            </div>

            {/* Email Body with Tabs */}
            <div>
                <Label className="mb-2 block">Email Body *</Label>
                <Tabs defaultValue="editor" className="w-full">
                    <TabsList className="mb-2">
                        <TabsTrigger value="editor">Editor</TabsTrigger>
                        <TabsTrigger value="emojis">
                            <Smile className="w-4 h-4 mr-1" />
                            Emojis
                        </TabsTrigger>
                        <TabsTrigger value="gifs">
                            <Sparkles className="w-4 h-4 mr-1" />
                            GIFs
                        </TabsTrigger>
                        <TabsTrigger value="images">
                            <Image className="w-4 h-4 mr-1" />
                            Images
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="editor">
                        <ReactQuill
                            theme="snow"
                            value={formData.body}
                            onChange={(value) => setFormData({ ...formData, body: value })}
                            placeholder="Write your email template here..."
                            className="bg-white rounded-md"
                            style={{ minHeight: '200px' }}
                            modules={{
                                toolbar: [
                                    [{ 'header': [1, 2, 3, false] }],
                                    ['bold', 'italic', 'underline', 'strike'],
                                    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                                    [{ 'color': [] }, { 'background': [] }],
                                    [{ 'align': [] }],
                                    ['link', 'image'],
                                    ['clean']
                                ]
                            }}
                        />
                    </TabsContent>

                    <TabsContent value="emojis">
                        <Card>
                            <CardContent className="pt-4">
                                <p className="text-sm text-gray-600 mb-3">Click to insert emoji:</p>
                                <div className="flex flex-wrap gap-2">
                                    {POPULAR_EMOJIS.map((emoji, i) => (
                                        <button
                                            key={i}
                                            type="button"
                                            onClick={() => insertEmoji(emoji)}
                                            className="text-2xl hover:scale-125 transition-transform p-1"
                                        >
                                            {emoji}
                                        </button>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="gifs">
                        <Card>
                            <CardContent className="pt-4">
                                <p className="text-sm text-gray-600 mb-3">Popular GIFs (click to insert):</p>
                                <div className="grid grid-cols-3 gap-3 mb-4">
                                    {POPULAR_GIFS.map((gif, i) => (
                                        <div 
                                            key={i}
                                            onClick={() => insertGif(gif.url)}
                                            className="cursor-pointer hover:opacity-80 transition-opacity"
                                        >
                                            <img 
                                                src={gif.url} 
                                                alt={gif.label}
                                                className="w-full h-20 object-cover rounded-lg"
                                            />
                                            <p className="text-xs text-center mt-1">{gif.label}</p>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex gap-2">
                                    <Input
                                        value={gifUrl}
                                        onChange={(e) => setGifUrl(e.target.value)}
                                        placeholder="Or paste a GIF URL..."
                                    />
                                    <Button 
                                        type="button" 
                                        variant="outline"
                                        onClick={() => {
                                            if (gifUrl) {
                                                insertGif(gifUrl);
                                                setGifUrl('');
                                            }
                                        }}
                                    >
                                        Add
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="images">
                        <Card>
                            <CardContent className="pt-4">
                                <p className="text-sm text-gray-600 mb-3">Insert image by URL:</p>
                                <div className="flex gap-2">
                                    <Input
                                        value={imageUrl}
                                        onChange={(e) => setImageUrl(e.target.value)}
                                        placeholder="Paste image URL (e.g., from Unsplash)"
                                    />
                                    <Button 
                                        type="button" 
                                        variant="outline"
                                        onClick={insertImage}
                                    >
                                        Insert
                                    </Button>
                                </div>
                                <p className="text-xs text-gray-500 mt-2">
                                    Tip: Use images from Unsplash, Pexels, or upload to a hosting service
                                </p>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>

            {/* CTA Button */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="button_text">CTA Button Text (optional)</Label>
                    <Input
                        id="button_text"
                        value={formData.button_text}
                        onChange={(e) => setFormData({ ...formData, button_text: e.target.value })}
                        placeholder="e.g., Get Started"
                    />
                </div>
                <div>
                    <Label htmlFor="button_url">CTA Button URL</Label>
                    <Input
                        id="button_url"
                        value={formData.button_url}
                        onChange={(e) => setFormData({ ...formData, button_url: e.target.value })}
                        placeholder="https://..."
                    />
                </div>
            </div>

            {/* Footer */}
            <div>
                <Label htmlFor="footer_text">Footer Text (optional)</Label>
                <Input
                    id="footer_text"
                    value={formData.footer_text}
                    onChange={(e) => setFormData({ ...formData, footer_text: e.target.value })}
                    placeholder="© 2024 el turco. All rights reserved."
                />
            </div>

            {/* Placeholders */}
            <Card className="bg-blue-50 border-blue-200">
                <CardHeader className="pb-2">
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
                                onClick={() => insertContent(p.key)}
                                title={p.description}
                            >
                                {p.key}
                            </Badge>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Preview Toggle */}
            <div>
                <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setShowPreview(!showPreview)}
                    className="w-full"
                >
                    <Eye className="w-4 h-4 mr-2" />
                    {showPreview ? 'Hide Preview' : 'Show Preview'}
                </Button>
                
                {showPreview && (
                    <div className="mt-4">
                        {renderPreview()}
                    </div>
                )}
            </div>

            <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={onCancel}>
                    Cancel
                </Button>
                <Button type="submit" className="bg-purple-600 hover:bg-purple-700">
                    {template ? 'Update Template' : 'Create Template'}
                </Button>
            </div>
        </form>
    );
}