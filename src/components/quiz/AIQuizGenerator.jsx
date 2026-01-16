import React, { useState } from 'react';
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { 
    Sparkles, Loader2, Plus, Trash2, Edit, Check, X, 
    ChevronDown, ChevronUp, Save, RefreshCw
} from "lucide-react";
import { toast } from "sonner";

export default function AIQuizGenerator({ onSuccess, ninjaProgram }) {
    const queryClient = useQueryClient();
    
    const [config, setConfig] = useState({
        title: ninjaProgram ? `${ninjaProgram.name} Assessment` : '',
        programType: ninjaProgram?.program_type || 'bootcamp',
        focusAreas: ninjaProgram?.focus_areas || [],
        numQuestions: 10,
        difficulty: 'intermediate',
        targetLanguage: 'English',
        includeMultipleChoice: true,
        includeTrueFalse: true,
        passingScore: 70,
    });
    
    const [focusInput, setFocusInput] = useState('');
    const [generatedQuestions, setGeneratedQuestions] = useState([]);
    const [editingIndex, setEditingIndex] = useState(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [showAdvanced, setShowAdvanced] = useState(false);

    const { data: ninjaPrograms = [] } = useQuery({
        queryKey: ['ninjaPrograms'],
        queryFn: () => base44.entities.NinjaProgram.list(),
    });

    const generateQuizMutation = useMutation({
        mutationFn: async () => {
            setIsGenerating(true);
            
            const prompt = `Generate ${config.numQuestions} quiz questions for a ${config.programType} training program in localization/translation.

Focus Areas: ${config.focusAreas.join(', ') || 'General localization and translation'}
Difficulty Level: ${config.difficulty}
Target Language for Quiz: ${config.targetLanguage}

Question Types to Include:
${config.includeMultipleChoice ? '- Multiple choice questions (4 options each)' : ''}
${config.includeTrueFalse ? '- True/False questions' : ''}

Topics to cover based on program type "${config.programType}":
${config.programType === 'bootcamp' ? `
- Basic translation principles
- CAT tools introduction
- Quality assurance basics
- Industry terminology
- File formats and handling
- Cultural adaptation basics
` : ''}
${config.programType === 'masterclass' ? `
- Advanced translation techniques
- Specialized terminology management
- Complex quality assurance processes
- Advanced CAT tool features
- Project management in localization
- Style guide development
` : ''}
${config.programType === 'specialized_training' ? `
- Domain-specific terminology (based on focus areas)
- Industry-specific best practices
- Specialized quality metrics
- Advanced subject matter expertise
- Regulatory compliance (if applicable)
` : ''}

Generate questions that test practical knowledge and understanding.
For each question, provide:
1. The question text
2. Question type (multiple_choice or true_false)
3. Options (for multiple choice, provide 4 options labeled A, B, C, D)
4. The correct answer
5. Points value (1-3 based on difficulty)`;

            const response = await base44.integrations.Core.InvokeLLM({
                prompt,
                response_json_schema: {
                    type: "object",
                    properties: {
                        questions: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    question_text: { type: "string" },
                                    question_type: { type: "string", enum: ["multiple_choice", "true_false"] },
                                    options: { type: "array", items: { type: "string" } },
                                    correct_answer: { type: "string" },
                                    points: { type: "number" }
                                }
                            }
                        }
                    }
                }
            });
            
            return response.questions || [];
        },
        onSuccess: (questions) => {
            setGeneratedQuestions(questions);
            setIsGenerating(false);
            toast.success(`Generated ${questions.length} questions!`);
        },
        onError: (error) => {
            setIsGenerating(false);
            toast.error('Failed to generate questions: ' + error.message);
        }
    });

    const saveQuizMutation = useMutation({
        mutationFn: async () => {
            // Create quiz
            const quiz = await base44.entities.Quiz.create({
                title: config.title,
                description: `AI-generated quiz for ${config.programType} program. Focus areas: ${config.focusAreas.join(', ')}`,
                passing_score: config.passingScore,
                total_points: generatedQuestions.reduce((sum, q) => sum + (q.points || 1), 0),
                is_active: false, // Start as inactive for review
                required_for_approval: false,
                target_language: config.targetLanguage,
            });

            // Create questions
            for (let i = 0; i < generatedQuestions.length; i++) {
                const q = generatedQuestions[i];
                await base44.entities.Question.create({
                    quiz_id: quiz.id,
                    question_text: q.question_text,
                    question_type: q.question_type,
                    options: q.question_type === 'multiple_choice' ? q.options : ['True', 'False'],
                    correct_answer: q.correct_answer,
                    points: q.points || 1,
                    order: i + 1
                });
            }

            // If linked to a ninja program, update the program
            if (ninjaProgram) {
                const existingQuizzes = ninjaProgram.quizzes_to_assign || [];
                await base44.entities.NinjaProgram.update(ninjaProgram.id, {
                    quizzes_to_assign: [...existingQuizzes, quiz.id]
                });
            }

            return quiz;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['quizzes'] });
            queryClient.invalidateQueries({ queryKey: ['ninjaPrograms'] });
            toast.success('Quiz saved! It is set as inactive for your review.');
            onSuccess?.();
        },
        onError: (error) => {
            toast.error('Failed to save quiz: ' + error.message);
        }
    });

    const addFocusArea = () => {
        if (focusInput.trim() && !config.focusAreas.includes(focusInput.trim())) {
            setConfig({ ...config, focusAreas: [...config.focusAreas, focusInput.trim()] });
            setFocusInput('');
        }
    };

    const removeFocusArea = (area) => {
        setConfig({ ...config, focusAreas: config.focusAreas.filter(a => a !== area) });
    };

    const updateQuestion = (index, field, value) => {
        const updated = [...generatedQuestions];
        updated[index] = { ...updated[index], [field]: value };
        setGeneratedQuestions(updated);
    };

    const deleteQuestion = (index) => {
        setGeneratedQuestions(generatedQuestions.filter((_, i) => i !== index));
    };

    const addQuestion = () => {
        setGeneratedQuestions([
            ...generatedQuestions,
            {
                question_text: '',
                question_type: 'multiple_choice',
                options: ['', '', '', ''],
                correct_answer: '',
                points: 1
            }
        ]);
        setEditingIndex(generatedQuestions.length);
    };

    return (
        <div className="space-y-6">
            {/* Configuration */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-purple-600" />
                        AI Quiz Generator
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <label className="text-sm font-medium">Quiz Title</label>
                        <Input
                            value={config.title}
                            onChange={(e) => setConfig({ ...config, title: e.target.value })}
                            placeholder="e.g., Localization Fundamentals Quiz"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium">Program Type</label>
                            <Select 
                                value={config.programType} 
                                onValueChange={(v) => setConfig({ ...config, programType: v })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="bootcamp">Bootcamp</SelectItem>
                                    <SelectItem value="masterclass">Masterclass</SelectItem>
                                    <SelectItem value="specialized_training">Specialized Training</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <label className="text-sm font-medium">Difficulty</label>
                            <Select 
                                value={config.difficulty} 
                                onValueChange={(v) => setConfig({ ...config, difficulty: v })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="beginner">Beginner</SelectItem>
                                    <SelectItem value="intermediate">Intermediate</SelectItem>
                                    <SelectItem value="advanced">Advanced</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div>
                        <label className="text-sm font-medium">Focus Areas</label>
                        <div className="flex gap-2 mb-2">
                            <Input
                                value={focusInput}
                                onChange={(e) => setFocusInput(e.target.value)}
                                placeholder="e.g., Translation, MTPE, Project Management"
                                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addFocusArea())}
                            />
                            <Button type="button" variant="outline" onClick={addFocusArea}>Add</Button>
                        </div>
                        <div className="flex flex-wrap gap-1">
                            {config.focusAreas.map((area, idx) => (
                                <Badge 
                                    key={idx} 
                                    variant="secondary" 
                                    className="cursor-pointer" 
                                    onClick={() => removeFocusArea(area)}
                                >
                                    {area} ×
                                </Badge>
                            ))}
                        </div>
                    </div>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowAdvanced(!showAdvanced)}
                    >
                        {showAdvanced ? <ChevronUp className="w-4 h-4 mr-1" /> : <ChevronDown className="w-4 h-4 mr-1" />}
                        Advanced Options
                    </Button>

                    {showAdvanced && (
                        <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium">Number of Questions</label>
                                    <Input
                                        type="number"
                                        min={5}
                                        max={30}
                                        value={config.numQuestions}
                                        onChange={(e) => setConfig({ ...config, numQuestions: parseInt(e.target.value) || 10 })}
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium">Passing Score (%)</label>
                                    <Input
                                        type="number"
                                        min={50}
                                        max={100}
                                        value={config.passingScore}
                                        onChange={(e) => setConfig({ ...config, passingScore: parseInt(e.target.value) || 70 })}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <Checkbox
                                        id="mc"
                                        checked={config.includeMultipleChoice}
                                        onCheckedChange={(checked) => setConfig({ ...config, includeMultipleChoice: checked })}
                                    />
                                    <label htmlFor="mc" className="text-sm">Include Multiple Choice</label>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Checkbox
                                        id="tf"
                                        checked={config.includeTrueFalse}
                                        onCheckedChange={(checked) => setConfig({ ...config, includeTrueFalse: checked })}
                                    />
                                    <label htmlFor="tf" className="text-sm">Include True/False</label>
                                </div>
                            </div>
                        </div>
                    )}

                    <Button
                        onClick={() => generateQuizMutation.mutate()}
                        disabled={isGenerating || !config.title}
                        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                    >
                        {isGenerating ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Generating Questions...
                            </>
                        ) : (
                            <>
                                <Sparkles className="w-4 h-4 mr-2" />
                                Generate Quiz with AI
                            </>
                        )}
                    </Button>
                </CardContent>
            </Card>

            {/* Generated Questions for Review */}
            {generatedQuestions.length > 0 && (
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle>Review & Edit Questions ({generatedQuestions.length})</CardTitle>
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" onClick={addQuestion}>
                                    <Plus className="w-4 h-4 mr-1" />
                                    Add Question
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => generateQuizMutation.mutate()}
                                    disabled={isGenerating}
                                >
                                    <RefreshCw className="w-4 h-4 mr-1" />
                                    Regenerate
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {generatedQuestions.map((q, idx) => (
                            <div key={idx} className="border rounded-lg p-4 bg-gray-50">
                                {editingIndex === idx ? (
                                    <QuestionEditor
                                        question={q}
                                        onSave={(updated) => {
                                            updateQuestion(idx, 'question_text', updated.question_text);
                                            updateQuestion(idx, 'options', updated.options);
                                            updateQuestion(idx, 'correct_answer', updated.correct_answer);
                                            updateQuestion(idx, 'points', updated.points);
                                            setEditingIndex(null);
                                        }}
                                        onCancel={() => setEditingIndex(null)}
                                    />
                                ) : (
                                    <div>
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="text-sm font-medium text-gray-500">Q{idx + 1}</span>
                                                    <Badge variant="outline" className="text-xs">
                                                        {q.question_type === 'multiple_choice' ? 'Multiple Choice' : 'True/False'}
                                                    </Badge>
                                                    <Badge variant="secondary" className="text-xs">
                                                        {q.points || 1} pts
                                                    </Badge>
                                                </div>
                                                <p className="font-medium mb-2">{q.question_text}</p>
                                                <div className="space-y-1">
                                                    {(q.question_type === 'true_false' ? ['True', 'False'] : q.options || []).map((opt, optIdx) => (
                                                        <div 
                                                            key={optIdx}
                                                            className={`text-sm px-2 py-1 rounded ${
                                                                opt === q.correct_answer 
                                                                    ? 'bg-green-100 text-green-800 font-medium' 
                                                                    : 'text-gray-600'
                                                            }`}
                                                        >
                                                            {String.fromCharCode(65 + optIdx)}. {opt}
                                                            {opt === q.correct_answer && ' ✓'}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="flex gap-1">
                                                <Button variant="ghost" size="sm" onClick={() => setEditingIndex(idx)}>
                                                    <Edit className="w-4 h-4" />
                                                </Button>
                                                <Button variant="ghost" size="sm" onClick={() => deleteQuestion(idx)}>
                                                    <Trash2 className="w-4 h-4 text-red-500" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}

                        <div className="flex justify-end gap-2 pt-4 border-t">
                            <Button variant="outline" onClick={onSuccess}>
                                Cancel
                            </Button>
                            <Button
                                onClick={() => saveQuizMutation.mutate()}
                                disabled={saveQuizMutation.isPending || generatedQuestions.length === 0}
                                className="bg-green-600 hover:bg-green-700"
                            >
                                {saveQuizMutation.isPending ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-4 h-4 mr-2" />
                                        Save Quiz (Inactive)
                                    </>
                                )}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

function QuestionEditor({ question, onSave, onCancel }) {
    const [q, setQ] = useState({ ...question });

    const updateOption = (idx, value) => {
        const newOptions = [...(q.options || ['', '', '', ''])];
        newOptions[idx] = value;
        setQ({ ...q, options: newOptions });
    };

    return (
        <div className="space-y-3">
            <div>
                <label className="text-sm font-medium">Question</label>
                <Textarea
                    value={q.question_text}
                    onChange={(e) => setQ({ ...q, question_text: e.target.value })}
                    rows={2}
                />
            </div>

            {q.question_type === 'multiple_choice' && (
                <div className="space-y-2">
                    <label className="text-sm font-medium">Options</label>
                    {(q.options || ['', '', '', '']).map((opt, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                            <span className="w-6 text-sm font-medium">{String.fromCharCode(65 + idx)}.</span>
                            <Input
                                value={opt}
                                onChange={(e) => updateOption(idx, e.target.value)}
                                placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                            />
                            <Checkbox
                                checked={q.correct_answer === opt}
                                onCheckedChange={() => setQ({ ...q, correct_answer: opt })}
                            />
                        </div>
                    ))}
                </div>
            )}

            {q.question_type === 'true_false' && (
                <div>
                    <label className="text-sm font-medium">Correct Answer</label>
                    <Select value={q.correct_answer} onValueChange={(v) => setQ({ ...q, correct_answer: v })}>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="True">True</SelectItem>
                            <SelectItem value="False">False</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            )}

            <div>
                <label className="text-sm font-medium">Points</label>
                <Input
                    type="number"
                    min={1}
                    max={5}
                    value={q.points || 1}
                    onChange={(e) => setQ({ ...q, points: parseInt(e.target.value) || 1 })}
                    className="w-20"
                />
            </div>

            <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={onCancel}>
                    <X className="w-4 h-4 mr-1" />
                    Cancel
                </Button>
                <Button size="sm" onClick={() => onSave(q)}>
                    <Check className="w-4 h-4 mr-1" />
                    Save
                </Button>
            </div>
        </div>
    );
}