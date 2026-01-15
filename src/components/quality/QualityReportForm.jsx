import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Star, Plus, Trash2, AlertCircle } from "lucide-react";

const TRANSLATION_TYPES = ["Technical", "Marketing", "Legal", "Medical", "General", "UI/UX", "Support", "Creative"];
const ERROR_TYPES = ["Accuracy", "Fluency", "Terminology", "Style", "Locale", "Verity", "Grammar", "Punctuation", "Spelling"];
const SEVERITY_LEVELS = ["Critical", "Major", "Minor", "Preferential"];

export default function QualityReportForm({ freelancers, onSubmit, onCancel, settings, initialData }) {
    const [formData, setFormData] = useState(initialData || {
        freelancer_id: "",
        report_type: "QS",
        qs_score: null,
        lqa_score: null,
        lqa_words_reviewed: null,
        lqa_errors: [],
        translation_type: "",
        client_account: "",
        source_language: "",
        target_language: "",
        project_name: "",
        reviewer_comments: "",
        status: "draft"
    });

    const [hoveredStar, setHoveredStar] = useState(0);

    const lqaWeight = settings?.lqa_weight || 4;
    const qsMultiplier = settings?.qs_multiplier || 20;

    // Calculate LQA score from errors
    const calculateLqaFromErrors = () => {
        if (!formData.lqa_words_reviewed || formData.lqa_words_reviewed === 0) return null;
        
        const errorWeights = settings?.lqa_error_weights || {
            Critical: 10,
            Major: 5,
            Minor: 2,
            Preferential: 0.5
        };

        let totalPenalty = 0;
        formData.lqa_errors.forEach(error => {
            const weight = errorWeights[error.severity] || 1;
            totalPenalty += (error.count || 0) * weight;
        });

        // Penalty per 1000 words, max 100 penalty
        const penaltyPer1000 = (totalPenalty / formData.lqa_words_reviewed) * 1000;
        const score = Math.max(0, 100 - penaltyPer1000);
        return Math.round(score * 10) / 10;
    };

    // Calculate combined score preview
    const calculateCombinedPreview = () => {
        const lqa = formData.report_type === 'LQA' ? (formData.lqa_score || calculateLqaFromErrors()) : null;
        const qs = formData.qs_score;

        if (lqa != null && qs != null) {
            // Both scores: weighted average
            return ((lqa * lqaWeight) + (qs * qsMultiplier)) / (lqaWeight + 1);
        } else if (lqa != null) {
            return lqa;
        } else if (qs != null) {
            return qs * qsMultiplier;
        }
        return null;
    };

    const addError = () => {
        setFormData(prev => ({
            ...prev,
            lqa_errors: [...prev.lqa_errors, { error_type: "", severity: "", count: 1, examples: "" }]
        }));
    };

    const updateError = (index, field, value) => {
        setFormData(prev => ({
            ...prev,
            lqa_errors: prev.lqa_errors.map((err, i) => 
                i === index ? { ...err, [field]: value } : err
            )
        }));
    };

    const removeError = (index) => {
        setFormData(prev => ({
            ...prev,
            lqa_errors: prev.lqa_errors.filter((_, i) => i !== index)
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        
        const submitData = { ...formData };
        
        // Auto-calculate LQA score if errors are provided
        if (formData.report_type === 'LQA' && formData.lqa_errors.length > 0 && !formData.lqa_score) {
            submitData.lqa_score = calculateLqaFromErrors();
        }

        onSubmit(submitData);
    };

    const combinedScore = calculateCombinedPreview();

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label>Çevirmen *</Label>
                    <Select
                        value={formData.freelancer_id}
                        onValueChange={(v) => setFormData(prev => ({ ...prev, freelancer_id: v }))}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Çevirmen seçin" />
                        </SelectTrigger>
                        <SelectContent>
                            {freelancers
                                .filter(f => f.status === 'Approved')
                                .map(f => (
                                    <SelectItem key={f.id} value={f.id}>
                                        {f.full_name}
                                    </SelectItem>
                                ))
                            }
                        </SelectContent>
                    </Select>
                </div>

                <div>
                    <Label>Rapor Tipi *</Label>
                    <Select
                        value={formData.report_type}
                        onValueChange={(v) => setFormData(prev => ({ ...prev, report_type: v }))}
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="QS">QS (Quality Score)</SelectItem>
                            <SelectItem value="LQA">LQA (Detaylı İnceleme)</SelectItem>
                            <SelectItem value="Random_QA">Random QA</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Project Details */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label>Proje / İş Adı</Label>
                    <Input
                        value={formData.project_name}
                        onChange={(e) => setFormData(prev => ({ ...prev, project_name: e.target.value }))}
                        placeholder="Proje referansı"
                    />
                </div>
                <div>
                    <Label>Müşteri Hesabı</Label>
                    <Input
                        value={formData.client_account}
                        onChange={(e) => setFormData(prev => ({ ...prev, client_account: e.target.value }))}
                        placeholder="Amazon CCM, AppleCare, etc."
                    />
                </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
                <div>
                    <Label>Kaynak Dil</Label>
                    <Input
                        value={formData.source_language}
                        onChange={(e) => setFormData(prev => ({ ...prev, source_language: e.target.value }))}
                        placeholder="EN, DE, FR..."
                    />
                </div>
                <div>
                    <Label>Hedef Dil</Label>
                    <Input
                        value={formData.target_language}
                        onChange={(e) => setFormData(prev => ({ ...prev, target_language: e.target.value }))}
                        placeholder="TR, ES, IT..."
                    />
                </div>
                <div>
                    <Label>Çeviri Alanı</Label>
                    <Select
                        value={formData.translation_type}
                        onValueChange={(v) => setFormData(prev => ({ ...prev, translation_type: v }))}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Seçin" />
                        </SelectTrigger>
                        <SelectContent>
                            {TRANSLATION_TYPES.map(type => (
                                <SelectItem key={type} value={type}>{type}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* QS Score */}
            <div className="border rounded-lg p-4 bg-yellow-50">
                <Label className="text-lg mb-3 block">QS (Quality Score) - 5 Üzerinden</Label>
                <div className="flex items-center gap-2">
                    {[1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5].map((score) => {
                        const isHalf = score % 1 !== 0;
                        const fullStars = Math.floor(score);
                        const isSelected = formData.qs_score === score;
                        const isHovered = hoveredStar === score;
                        
                        return (
                            <button
                                key={score}
                                type="button"
                                className={`p-2 rounded-lg transition-all ${
                                    isSelected ? 'bg-yellow-400 ring-2 ring-yellow-500' :
                                    isHovered ? 'bg-yellow-200' : 'bg-white hover:bg-yellow-100'
                                }`}
                                onMouseEnter={() => setHoveredStar(score)}
                                onMouseLeave={() => setHoveredStar(0)}
                                onClick={() => setFormData(prev => ({ 
                                    ...prev, 
                                    qs_score: prev.qs_score === score ? null : score 
                                }))}
                            >
                                <div className="flex items-center gap-0.5">
                                    {[...Array(fullStars)].map((_, i) => (
                                        <Star key={i} className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                                    ))}
                                    {isHalf && (
                                        <div className="relative w-4 h-4">
                                            <Star className="w-4 h-4 text-yellow-500" />
                                            <div className="absolute inset-0 overflow-hidden w-1/2">
                                                <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <span className="text-xs mt-1 block">{score}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* LQA Section */}
            {(formData.report_type === 'LQA' || formData.report_type === 'Random_QA') && (
                <div className="border rounded-lg p-4 bg-blue-50">
                    <Label className="text-lg mb-3 block">LQA Detayları</Label>
                    
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                            <Label>İncelenen Kelime Sayısı</Label>
                            <Input
                                type="number"
                                value={formData.lqa_words_reviewed || ""}
                                onChange={(e) => setFormData(prev => ({ 
                                    ...prev, 
                                    lqa_words_reviewed: parseInt(e.target.value) || null 
                                }))}
                                placeholder="1000"
                            />
                        </div>
                        <div>
                            <Label>LQA Skoru (Manuel)</Label>
                            <Input
                                type="number"
                                min="0"
                                max="100"
                                step="0.1"
                                value={formData.lqa_score || ""}
                                onChange={(e) => setFormData(prev => ({ 
                                    ...prev, 
                                    lqa_score: parseFloat(e.target.value) || null 
                                }))}
                                placeholder="Otomatik hesaplanır veya manuel girin"
                            />
                            {formData.lqa_errors.length > 0 && formData.lqa_words_reviewed && (
                                <p className="text-xs text-blue-600 mt-1">
                                    Hesaplanan: {calculateLqaFromErrors()?.toFixed(1)}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Error List */}
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <Label>Hata Listesi</Label>
                            <Button type="button" variant="outline" size="sm" onClick={addError}>
                                <Plus className="w-4 h-4 mr-1" /> Hata Ekle
                            </Button>
                        </div>

                        {formData.lqa_errors.map((error, index) => (
                            <div key={index} className="grid grid-cols-12 gap-2 items-start bg-white p-3 rounded-lg">
                                <div className="col-span-3">
                                    <Select
                                        value={error.error_type}
                                        onValueChange={(v) => updateError(index, 'error_type', v)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Hata Tipi" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {ERROR_TYPES.map(type => (
                                                <SelectItem key={type} value={type}>{type}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="col-span-3">
                                    <Select
                                        value={error.severity}
                                        onValueChange={(v) => updateError(index, 'severity', v)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Ciddiyet" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {SEVERITY_LEVELS.map(level => (
                                                <SelectItem key={level} value={level}>{level}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="col-span-2">
                                    <Input
                                        type="number"
                                        min="1"
                                        value={error.count}
                                        onChange={(e) => updateError(index, 'count', parseInt(e.target.value) || 1)}
                                        placeholder="Adet"
                                    />
                                </div>
                                <div className="col-span-3">
                                    <Input
                                        value={error.examples}
                                        onChange={(e) => updateError(index, 'examples', e.target.value)}
                                        placeholder="Örnek"
                                    />
                                </div>
                                <div className="col-span-1">
                                    <Button 
                                        type="button" 
                                        variant="ghost" 
                                        size="icon"
                                        onClick={() => removeError(index)}
                                    >
                                        <Trash2 className="w-4 h-4 text-red-500" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Comments */}
            <div>
                <Label>Reviewer Yorumları</Label>
                <Textarea
                    value={formData.reviewer_comments}
                    onChange={(e) => setFormData(prev => ({ ...prev, reviewer_comments: e.target.value }))}
                    placeholder="Detaylı geri bildirim..."
                    rows={4}
                />
            </div>

            {/* Combined Score Preview */}
            {combinedScore != null && (
                <div className="bg-gradient-to-r from-purple-100 to-blue-100 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Combined Score Önizleme</p>
                            <p className="text-xs text-gray-500">
                                Formül: (LQA × {lqaWeight} + QS × {qsMultiplier}) / {lqaWeight + 1}
                            </p>
                        </div>
                        <div className={`text-3xl font-bold ${
                            combinedScore >= 80 ? 'text-green-600' :
                            combinedScore >= 60 ? 'text-yellow-600' :
                            'text-red-600'
                        }`}>
                            {combinedScore.toFixed(1)}
                        </div>
                    </div>
                </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t">
                <Button type="button" variant="outline" onClick={onCancel}>
                    İptal
                </Button>
                <Button 
                    type="submit" 
                    className="bg-purple-600 hover:bg-purple-700"
                    disabled={!formData.freelancer_id}
                >
                    Raporu Kaydet
                </Button>
            </div>
        </form>
    );
}