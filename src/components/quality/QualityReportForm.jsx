import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
    Tooltip, TooltipContent, TooltipProvider, TooltipTrigger
} from "@/components/ui/tooltip";
import { Star, Plus, Trash2, AlertCircle, FileText, Info } from "lucide-react";

// Reusable tooltip component for form labels
const SmartTooltip = ({ content }) => (
    <Tooltip>
        <TooltipTrigger asChild>
            <Info className="w-4 h-4 text-gray-400 cursor-help inline-block ml-1" />
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
            <p className="text-sm">{content}</p>
        </TooltipContent>
    </Tooltip>
);

const CONTENT_TYPES = [
    "Marketing", "Legal", "Medical", "Technical", "Financial", 
    "UI/UX", "Support", "Creative", "E-commerce", "Gaming", 
    "Documentation", "Website", "App", "Help Center", "Knowledge Base", 
    "Training", "General"
];

const JOB_TYPES = [
    "Translation", "Review", "MTPE", "Proofreading", "Transcreation", 
    "Localization", "LQA", "QA Check", "Editing", "Copywriting"
];

const DEFAULT_ERROR_TYPES = [
    "Accuracy", "Fluency", "Terminology", "Style", "Locale", "Verity", 
    "Grammar", "Punctuation", "Spelling", "Consistency", "Formatting", 
    "Omission", "Addition", "Mistranslation"
];

const DEFAULT_SEVERITY_WEIGHTS = {
    Critical: 10,
    Major: 5,
    Minor: 2,
    Preferential: 0.5
};

const SEVERITY_LEVELS = ["Critical", "Major", "Minor", "Preferential"];

export default function QualityReportForm({ 
    freelancers, 
    onSubmit, 
    onCancel, 
    settings, 
    initialData,
    defaultReportType = "LQA"
}) {
    // Dynamic error types from settings or fallback to defaults
    const errorTypes = (settings?.lqa_error_types?.length > 0) 
        ? settings.lqa_error_types 
        : DEFAULT_ERROR_TYPES;
    const [formData, setFormData] = useState(initialData || {
        freelancer_id: "",
        report_type: defaultReportType,
        qs_score: null,
        lqa_score: null,
        lqa_words_reviewed: null,
        lqa_errors: [],
        content_type: "",
        job_type: "",
        client_account: "",
        source_language: "",
        target_language: "",
        project_name: "",
        word_count: null,
        reviewer_comments: "",
        report_date: new Date().toISOString().split('T')[0],
        status: "draft"
    });

    useEffect(() => {
        if (defaultReportType && !initialData) {
            setFormData(prev => ({ ...prev, report_type: defaultReportType }));
        }
    }, [defaultReportType, initialData]);

    const [hoveredStar, setHoveredStar] = useState(0);

    const lqaWeight = settings?.lqa_weight || 4;
    const qsMultiplier = settings?.qs_multiplier || 20;

    // Dynamic error weights from settings or fallback to defaults
    const errorWeights = {
        ...DEFAULT_SEVERITY_WEIGHTS,
        ...(settings?.lqa_error_weights || {})
    };

    const calculateLqaFromErrors = () => {
        if (!formData.lqa_words_reviewed || formData.lqa_words_reviewed === 0) return null;
        
        let totalPenalty = 0;
        formData.lqa_errors.forEach(error => {
            const weight = errorWeights[error.severity] || 1;
            totalPenalty += (error.count || 0) * weight;
        });

        const penaltyPer1000 = (totalPenalty / formData.lqa_words_reviewed) * 1000;
        const score = Math.max(0, 100 - penaltyPer1000);
        return Math.round(score * 10) / 10;
    };

    const calculateCombinedPreview = () => {
        const lqa = formData.report_type === 'LQA' || formData.report_type === 'Random_QA' 
            ? (formData.lqa_score || calculateLqaFromErrors()) 
            : null;
        const qs = formData.qs_score;

        if (lqa != null && qs != null) {
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
        
        if ((formData.report_type === 'LQA' || formData.report_type === 'Random_QA') && 
            formData.lqa_errors.length > 0 && !formData.lqa_score) {
            submitData.lqa_score = calculateLqaFromErrors();
        }

        onSubmit(submitData);
    };

    const combinedScore = calculateCombinedPreview();
    const calculatedLqa = calculateLqaFromErrors();

    const isLqaReport = formData.report_type === 'LQA' || formData.report_type === 'Random_QA';

    return (
        <TooltipProvider>
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Freelancer & Report Type */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label>Freelancer *</Label>
                    <Select
                        value={formData.freelancer_id}
                        onValueChange={(v) => setFormData(prev => ({ ...prev, freelancer_id: v }))}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select freelancer" />
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
                    <Label>Report Type *</Label>
                    <Select
                        value={formData.report_type}
                        onValueChange={(v) => setFormData(prev => ({ ...prev, report_type: v }))}
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="LQA">LQA (Detailed Review)</SelectItem>
                            <SelectItem value="QS">QS (Quality Score)</SelectItem>
                            <SelectItem value="Random_QA">Random QA</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Project Details */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Project Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label>Project / Job Name</Label>
                            <Input
                                value={formData.project_name}
                                onChange={(e) => setFormData(prev => ({ ...prev, project_name: e.target.value }))}
                                placeholder="Project reference"
                            />
                        </div>
                        <div>
                            <Label>Client Account</Label>
                            <Input
                                value={formData.client_account}
                                onChange={(e) => setFormData(prev => ({ ...prev, client_account: e.target.value }))}
                                placeholder="Amazon CCM, AppleCare, etc."
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-4 gap-4">
                        <div>
                            <Label>Source Language</Label>
                            <Input
                                value={formData.source_language}
                                onChange={(e) => setFormData(prev => ({ ...prev, source_language: e.target.value }))}
                                placeholder="EN"
                            />
                        </div>
                        <div>
                            <Label>Target Language</Label>
                            <Input
                                value={formData.target_language}
                                onChange={(e) => setFormData(prev => ({ ...prev, target_language: e.target.value }))}
                                placeholder="TR"
                            />
                        </div>
                        <div>
                            <Label>Word Count</Label>
                            <Input
                                type="number"
                                value={formData.word_count || ""}
                                onChange={(e) => setFormData(prev => ({ ...prev, word_count: parseInt(e.target.value) || null }))}
                                placeholder="Total words"
                            />
                        </div>
                        <div>
                            <Label>Report Date</Label>
                            <Input
                                type="date"
                                value={formData.report_date}
                                onChange={(e) => setFormData(prev => ({ ...prev, report_date: e.target.value }))}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label>Content Type</Label>
                            <Select
                                value={formData.content_type}
                                onValueChange={(v) => setFormData(prev => ({ ...prev, content_type: v }))}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select content type" />
                                </SelectTrigger>
                                <SelectContent>
                                    {CONTENT_TYPES.map(type => (
                                        <SelectItem key={type} value={type}>{type}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>Job Type</Label>
                            <Select
                                value={formData.job_type}
                                onValueChange={(v) => setFormData(prev => ({ ...prev, job_type: v }))}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select job type" />
                                </SelectTrigger>
                                <SelectContent>
                                    {JOB_TYPES.map(type => (
                                        <SelectItem key={type} value={type}>{type}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* LQA Section - Primary for LQA reports */}
            {isLqaReport && (
                <Card className="border-blue-200 bg-blue-50/50">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm flex items-center gap-2">
                            <FileText className="w-4 h-4 text-blue-600" />
                            LQA Assessment
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <Label>Words Reviewed *</Label>
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
                                <Label>
                                    LQA Score (Manual Override)
                                    <SmartTooltip content="Language Quality Assurance score (0-100). Scores below 80 may trigger a warning." />
                                </Label>
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
                                    placeholder="Auto-calculated"
                                />
                            </div>
                            <div className="flex items-end">
                                {calculatedLqa !== null && (
                                    <div className="p-3 bg-white rounded-lg border w-full">
                                        <p className="text-xs text-gray-500">Calculated Score</p>
                                        <p className={`text-2xl font-bold ${
                                            calculatedLqa >= 90 ? 'text-green-600' :
                                            calculatedLqa >= 70 ? 'text-yellow-600' :
                                            'text-red-600'
                                        }`}>
                                            {calculatedLqa.toFixed(1)}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Error Categories Info */}
                        <div className="flex items-start gap-2 p-3 bg-blue-100 rounded-lg">
                            <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                            <div className="text-xs text-blue-800">
                                <p className="font-medium">
                                    Error Weights (per 1000 words)
                                    <SmartTooltip content="Critical: objectively wrong, changes meaning. Major: significant impact on understanding. Minor: style/grammar issues. Preferential: subjective choices." />
                                </p>
                                <p>Critical: -{errorWeights.Critical} pts | Major: -{errorWeights.Major} pts | Minor: -{errorWeights.Minor} pts | Preferential: -{errorWeights.Preferential} pts</p>
                            </div>
                        </div>

                        {/* Error List */}
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <Label className="text-base font-medium">Error Log</Label>
                                <Button type="button" variant="outline" size="sm" onClick={addError}>
                                    <Plus className="w-4 h-4 mr-1" /> Add Error
                                </Button>
                            </div>

                            {formData.lqa_errors.length === 0 && (
                                <div className="text-center py-6 text-gray-500 bg-white rounded-lg border-2 border-dashed">
                                    <AlertCircle className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                                    <p className="text-sm">No errors logged yet</p>
                                    <p className="text-xs">Click "Add Error" to log translation errors</p>
                                </div>
                            )}

                            {formData.lqa_errors.map((error, index) => (
                                <div key={index} className="grid grid-cols-12 gap-2 items-start bg-white p-3 rounded-lg border">
                                    <div className="col-span-3">
                                        <Label className="text-xs text-gray-500">Error Type</Label>
                                        <Select
                                            value={error.error_type}
                                            onValueChange={(v) => updateError(index, 'error_type', v)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {errorTypes.map(type => (
                                                    <SelectItem key={type} value={type}>{type}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="col-span-2">
                                        <Label className="text-xs text-gray-500">Severity</Label>
                                        <Select
                                            value={error.severity}
                                            onValueChange={(v) => updateError(index, 'severity', v)}
                                        >
                                            <SelectTrigger className={
                                                error.severity === 'Critical' ? 'border-red-500' :
                                                error.severity === 'Major' ? 'border-orange-500' :
                                                error.severity === 'Minor' ? 'border-yellow-500' : ''
                                            }>
                                                <SelectValue placeholder="Level" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {SEVERITY_LEVELS.map(level => (
                                                    <SelectItem key={level} value={level}>{level}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="col-span-1">
                                        <Label className="text-xs text-gray-500">Count</Label>
                                        <Input
                                            type="number"
                                            min="1"
                                            value={error.count}
                                            onChange={(e) => updateError(index, 'count', parseInt(e.target.value) || 1)}
                                        />
                                    </div>
                                    <div className="col-span-5">
                                        <Label className="text-xs text-gray-500">Examples / Notes</Label>
                                        <Input
                                            value={error.examples}
                                            onChange={(e) => updateError(index, 'examples', e.target.value)}
                                            placeholder="Source → Wrong → Correct"
                                        />
                                    </div>
                                    <div className="col-span-1 pt-5">
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

                            {/* Error Summary */}
                            {formData.lqa_errors.length > 0 && (
                                <div className="bg-gray-50 rounded-lg p-3">
                                    <p className="text-xs font-medium text-gray-600 mb-2">Error Summary</p>
                                    <div className="flex gap-3">
                                        {SEVERITY_LEVELS.map(level => {
                                            const count = formData.lqa_errors
                                                .filter(e => e.severity === level)
                                                .reduce((sum, e) => sum + (e.count || 0), 0);
                                            return count > 0 ? (
                                                <Badge 
                                                    key={level} 
                                                    className={
                                                        level === 'Critical' ? 'bg-red-100 text-red-700' :
                                                        level === 'Major' ? 'bg-orange-100 text-orange-700' :
                                                        level === 'Minor' ? 'bg-yellow-100 text-yellow-700' :
                                                        'bg-gray-100 text-gray-700'
                                                    }
                                                >
                                                    {level}: {count}
                                                </Badge>
                                            ) : null;
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* QS Score - Always visible but primary for QS reports */}
            <Card className={`${!isLqaReport ? 'border-yellow-200 bg-yellow-50/50' : ''}`}>
                <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                        <Star className="w-4 h-4 text-yellow-600" />
                        Quality Score (QS) - 1 to 5
                        <SmartTooltip content="General Quality Score (1-5). Used for quick assessments of overall translation quality." />
                        {isLqaReport && <span className="text-xs text-gray-500">(Optional)</span>}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-2 flex-wrap">
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
                                        isHovered ? 'bg-yellow-200' : 'bg-white hover:bg-yellow-100 border'
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
                        {formData.qs_score && (
                            <Button 
                                type="button" 
                                variant="ghost" 
                                size="sm"
                                onClick={() => setFormData(prev => ({ ...prev, qs_score: null }))}
                            >
                                Clear
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Comments */}
            <div>
                <Label>Reviewer Comments</Label>
                <Textarea
                    value={formData.reviewer_comments}
                    onChange={(e) => setFormData(prev => ({ ...prev, reviewer_comments: e.target.value }))}
                    placeholder="Detailed feedback..."
                    rows={4}
                />
            </div>

            {/* Combined Score Preview */}
            {combinedScore != null && (
                <div className="bg-gradient-to-r from-purple-100 to-blue-100 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">
                                Combined Score Preview
                                <SmartTooltip content={`Calculated automatically: (LQA × ${lqaWeight} + QS × ${qsMultiplier}) / ${lqaWeight + 1}. This weighted formula balances detailed LQA analysis with quick QS assessments.`} />
                            </p>
                            <p className="text-xs text-gray-500">
                                Formula: (LQA × {lqaWeight} + QS × {qsMultiplier}) / {lqaWeight + 1}
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
                    Cancel
                </Button>
                <Button 
                    type="submit" 
                    className="bg-purple-600 hover:bg-purple-700"
                    disabled={!formData.freelancer_id}
                >
                    Save Report
                </Button>
            </div>
        </form>
        </TooltipProvider>
    );
}