import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { X, Plus } from "lucide-react";

export default function OpenPositionForm({ position, onSubmit, onCancel }) {
    const [formData, setFormData] = useState(position || {
        title: '',
        description: '',
        language_pairs: [],
        required_specializations: [],
        required_service_types: [],
        min_experience_years: '',
        required_skills: [],
        rate_range: '',
        is_active: true,
        priority: 'medium'
    });

    const [newPair, setNewPair] = useState({ source_language: '', target_language: '' });
    const [newSpec, setNewSpec] = useState('');
    const [newSkill, setNewSkill] = useState('');

    const serviceTypes = ["Translation", "Interpretation", "Proofreading", "Localization", "Transcription", "Subtitling"];

    const addLanguagePair = () => {
        if (newPair.source_language && newPair.target_language) {
            setFormData({
                ...formData,
                language_pairs: [...(formData.language_pairs || []), newPair]
            });
            setNewPair({ source_language: '', target_language: '' });
        }
    };

    const removeLanguagePair = (index) => {
        setFormData({
            ...formData,
            language_pairs: formData.language_pairs.filter((_, i) => i !== index)
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>{position ? 'Edit Position' : 'Create New Position'}</CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <Label htmlFor="title">Position Title *</Label>
                        <Input
                            id="title"
                            required
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            placeholder="e.g., Turkish-English Medical Translator"
                        />
                    </div>

                    <div>
                        <Label htmlFor="description">Description *</Label>
                        <Textarea
                            id="description"
                            required
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Detailed description of the position requirements..."
                            className="h-32"
                        />
                    </div>

                    <div>
                        <Label>Language Pairs</Label>
                        <div className="flex gap-2 mt-2">
                            <Input
                                placeholder="Source language"
                                value={newPair.source_language}
                                onChange={(e) => setNewPair({ ...newPair, source_language: e.target.value })}
                            />
                            <span className="flex items-center">→</span>
                            <Input
                                placeholder="Target language"
                                value={newPair.target_language}
                                onChange={(e) => setNewPair({ ...newPair, target_language: e.target.value })}
                            />
                            <Button type="button" onClick={addLanguagePair}>
                                <Plus className="w-4 h-4" />
                            </Button>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-3">
                            {formData.language_pairs?.map((pair, idx) => (
                                <Badge key={idx} variant="outline">
                                    {pair.source_language} → {pair.target_language}
                                    <button
                                        type="button"
                                        onClick={() => removeLanguagePair(idx)}
                                        className="ml-2"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </Badge>
                            ))}
                        </div>
                    </div>

                    <div>
                        <Label>Service Types</Label>
                        <div className="flex flex-wrap gap-2 mt-2">
                            {serviceTypes.map(service => (
                                <Badge
                                    key={service}
                                    variant={formData.required_service_types?.includes(service) ? "default" : "outline"}
                                    className="cursor-pointer"
                                    onClick={() => {
                                        const current = formData.required_service_types || [];
                                        setFormData({
                                            ...formData,
                                            required_service_types: current.includes(service)
                                                ? current.filter(s => s !== service)
                                                : [...current, service]
                                        });
                                    }}
                                >
                                    {service}
                                </Badge>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="min_experience">Min. Experience (years)</Label>
                            <Input
                                id="min_experience"
                                type="number"
                                value={formData.min_experience_years}
                                onChange={(e) => setFormData({ ...formData, min_experience_years: e.target.value })}
                            />
                        </div>
                        <div>
                            <Label htmlFor="rate_range">Rate Range</Label>
                            <Input
                                id="rate_range"
                                value={formData.rate_range}
                                onChange={(e) => setFormData({ ...formData, rate_range: e.target.value })}
                                placeholder="e.g., $0.10-0.15/word"
                            />
                        </div>
                    </div>

                    <div>
                        <Label htmlFor="priority">Priority</Label>
                        <select
                            id="priority"
                            value={formData.priority}
                            onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                            className="w-full border rounded-md p-2"
                        >
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                        </select>
                    </div>

                    <div className="flex gap-4">
                        <Button type="submit" className="flex-1">
                            {position ? 'Update Position' : 'Create Position'}
                        </Button>
                        <Button type="button" variant="outline" onClick={onCancel}>
                            Cancel
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}