import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2, Save, ArrowLeft, Globe } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const LANGUAGES = [
    "English", "Turkish", "Arabic", "Russian", "German", "French", "Spanish", 
    "Italian", "Portuguese", "Dutch", "Polish", "Czech", "Hungarian", "Romanian",
    "Bulgarian", "Greek", "Hebrew", "Persian", "Ukrainian", "Kazakh", "Uzbek",
    "Azerbaijani", "Georgian", "Armenian", "Chinese", "Japanese", "Korean"
];

const SERVICE_TYPES = [
    "Translation", "Interpretation", "Proofreading", "Localization", 
    "Transcription", "Subtitling", "MTPE", "Review", "LQA", "Transcreation"
];

const SPECIALIZATIONS = [
    "General", "Medical", "Legal", "Technical", "IT/Software", "Marketing",
    "Financial", "Gaming", "E-commerce", "Automotive", "Life Sciences",
    "Manufacturing", "Travel & Tourism", "Education"
];
import { toast } from "sonner";
import QuestionEditor from "./QuestionEditor";

export default function QuizForm({ quiz, onClose }) {
    const [formData, setFormData] = useState({
        title: quiz?.title || '',
        description: quiz?.description || '',
        instructions: quiz?.instructions || '',
        source_language: quiz?.source_language || '',
        target_language: quiz?.target_language || '',
        service_type: quiz?.service_type || '',
        specialization: quiz?.specialization || '',
        time_limit_minutes: quiz?.time_limit_minutes || '',
        passing_score: quiz?.passing_score || '',
        is_active: quiz?.is_active !== undefined ? quiz.is_active : true,
        required_for_approval: quiz?.required_for_approval || false,
    });

    const [showQuestionEditor, setShowQuestionEditor] = useState(false);
    const [editingQuestion, setEditingQuestion] = useState(null);

    const queryClient = useQueryClient();

    const { data: questions = [] } = useQuery({
        queryKey: ['questions', quiz?.id],
        queryFn: () => base44.entities.Question.filter({ quiz_id: quiz.id }, 'order'),
        enabled: !!quiz?.id,
    });

    const saveQuizMutation = useMutation({
        mutationFn: async (data) => {
            if (quiz?.id) {
                return base44.entities.Quiz.update(quiz.id, data);
            } else {
                return base44.entities.Quiz.create(data);
            }
        },
        onSuccess: (result) => {
            queryClient.invalidateQueries({ queryKey: ['quizzes'] });
            toast.success(quiz?.id ? 'Quiz updated' : 'Quiz created');
            if (!quiz?.id) {
                // After creating quiz, stay on form to add questions
                window.location.href = window.location.href;
            }
        },
    });

    const deleteQuestionMutation = useMutation({
        mutationFn: (id) => base44.entities.Question.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['questions', quiz?.id] });
            toast.success('Question deleted');
        },
    });

    const handleSaveQuiz = () => {
        if (!formData.title) {
            toast.error('Please enter a quiz title');
            return;
        }

        const totalPoints = questions.reduce((sum, q) => sum + (q.points || 0), 0);
        saveQuizMutation.mutate({
            ...formData,
            total_points: totalPoints
        });
    };

    const handleDeleteQuestion = (questionId) => {
        if (confirm('Delete this question?')) {
            deleteQuestionMutation.mutate(questionId);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" onClick={onClose}>
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <h2 className="text-2xl font-bold">{quiz?.id ? 'Edit Quiz' : 'Create New Quiz'}</h2>
            </div>

            {/* Quiz Details */}
            <Card>
                <CardHeader>
                    <CardTitle>Quiz Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <Label htmlFor="title">Title *</Label>
                        <Input
                            id="title"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            placeholder="e.g., Translation Skills Assessment"
                        />
                    </div>

                    <div>
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Brief description of the quiz"
                            rows={2}
                        />
                    </div>

                    <div>
                        <Label htmlFor="instructions">Instructions</Label>
                        <Textarea
                            id="instructions"
                            value={formData.instructions}
                            onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                            placeholder="Instructions for taking the quiz"
                            rows={3}
                        />
                    </div>

                    {/* Language Pair Section */}
                    <div className="border-t pt-4 mt-4">
                        <div className="flex items-center gap-2 mb-3">
                            <Globe className="w-4 h-4 text-purple-600" />
                            <Label className="text-base font-semibold">Language & Service Configuration</Label>
                        </div>
                        <p className="text-sm text-gray-500 mb-4">
                            Assign this quiz to a specific language pair and service type for automatic matching with freelancers.
                        </p>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Source Language</Label>
                                <Select 
                                    value={formData.source_language} 
                                    onValueChange={(value) => setFormData({ ...formData, source_language: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select source language" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value={null}>Any Language</SelectItem>
                                        {LANGUAGES.map(lang => (
                                            <SelectItem key={lang} value={lang}>{lang}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>Target Language</Label>
                                <Select 
                                    value={formData.target_language} 
                                    onValueChange={(value) => setFormData({ ...formData, target_language: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select target language" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value={null}>Any Language</SelectItem>
                                        {LANGUAGES.map(lang => (
                                            <SelectItem key={lang} value={lang}>{lang}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mt-4">
                            <div>
                                <Label>Service Type</Label>
                                <Select 
                                    value={formData.service_type} 
                                    onValueChange={(value) => setFormData({ ...formData, service_type: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select service type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value={null}>Any Service</SelectItem>
                                        {SERVICE_TYPES.map(type => (
                                            <SelectItem key={type} value={type}>{type}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>Specialization</Label>
                                <Select 
                                    value={formData.specialization} 
                                    onValueChange={(value) => setFormData({ ...formData, specialization: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select specialization" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value={null}>Any Specialization</SelectItem>
                                        {SPECIALIZATIONS.map(spec => (
                                            <SelectItem key={spec} value={spec}>{spec}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 border-t pt-4 mt-4">
                        <div>
                            <Label htmlFor="time_limit">Time Limit (minutes)</Label>
                            <Input
                                id="time_limit"
                                type="number"
                                value={formData.time_limit_minutes}
                                onChange={(e) => setFormData({ ...formData, time_limit_minutes: e.target.value })}
                                placeholder="Optional"
                            />
                        </div>
                        <div>
                            <Label htmlFor="passing_score">Passing Score (%)</Label>
                            <Input
                                id="passing_score"
                                type="number"
                                value={formData.passing_score}
                                onChange={(e) => setFormData({ ...formData, passing_score: e.target.value })}
                                placeholder="Optional"
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <div>
                            <Label>Active</Label>
                            <p className="text-sm text-gray-600">Quiz is available for applicants</p>
                        </div>
                        <Switch
                            checked={formData.is_active}
                            onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <div>
                            <Label>Required for Approval</Label>
                            <p className="text-sm text-gray-600">Must be completed to approve applicant</p>
                        </div>
                        <Switch
                            checked={formData.required_for_approval}
                            onCheckedChange={(checked) => setFormData({ ...formData, required_for_approval: checked })}
                        />
                    </div>

                    <Button
                        onClick={handleSaveQuiz}
                        disabled={saveQuizMutation.isPending}
                        className="w-full"
                    >
                        <Save className="w-4 h-4 mr-2" />
                        {quiz?.id ? 'Update Quiz Details' : 'Create Quiz'}
                    </Button>
                </CardContent>
            </Card>

            {/* Questions Section */}
            {quiz?.id && (
                <Card>
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <CardTitle>Questions ({questions.length})</CardTitle>
                            <Button
                                onClick={() => {
                                    setEditingQuestion(null);
                                    setShowQuestionEditor(true);
                                }}
                                size="sm"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Add Question
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {showQuestionEditor ? (
                            <QuestionEditor
                                quizId={quiz.id}
                                question={editingQuestion}
                                onClose={() => {
                                    setShowQuestionEditor(false);
                                    setEditingQuestion(null);
                                }}
                            />
                        ) : (
                            <div className="space-y-3">
                                {questions.length === 0 ? (
                                    <p className="text-center text-gray-500 py-8">
                                        No questions yet. Add your first question.
                                    </p>
                                ) : (
                                    questions.map((question, idx) => (
                                        <div key={question.id} className="border rounded-lg p-4 bg-gray-50">
                                            <div className="flex justify-between items-start">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <span className="font-semibold">Q{idx + 1}.</span>
                                                        <span className="text-sm text-blue-600">
                                                            {question.question_type === 'true_false' ? 'True/False' : 'Multiple Choice'}
                                                        </span>
                                                        <span className="text-sm font-semibold text-green-600">
                                                            {question.points} pts
                                                        </span>
                                                    </div>
                                                    <p className="text-sm mb-2">{question.question_text}</p>
                                                    {question.section && (
                                                        <span className="text-xs text-gray-600">Section: {question.section}</span>
                                                    )}
                                                </div>
                                                <div className="flex gap-2">
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => {
                                                            setEditingQuestion(question);
                                                            setShowQuestionEditor(true);
                                                        }}
                                                    >
                                                        Edit
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => handleDeleteQuestion(question.id)}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    );
}