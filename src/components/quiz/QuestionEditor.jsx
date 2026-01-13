import React, { useState } from 'react';
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Trash2, Save, X } from "lucide-react";
import { toast } from "sonner";

export default function QuestionEditor({ quizId, question, onClose }) {
    const [formData, setFormData] = useState({
        question_text: question?.question_text || '',
        question_type: question?.question_type || 'multiple_choice',
        options: question?.options || ['', '', '', ''],
        correct_answer: question?.correct_answer || '',
        points: question?.points || 1,
        section: question?.section || '',
        order: question?.order || 0,
    });

    const queryClient = useQueryClient();

    const saveQuestionMutation = useMutation({
        mutationFn: async (data) => {
            if (question?.id) {
                return base44.entities.Question.update(question.id, data);
            } else {
                return base44.entities.Question.create(data);
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['questions', quizId] });
            queryClient.invalidateQueries({ queryKey: ['quizzes'] });
            toast.success(question?.id ? 'Question updated' : 'Question added');
            onClose();
        },
    });

    const handleSave = () => {
        if (!formData.question_text) {
            toast.error('Please enter question text');
            return;
        }
        if (!formData.correct_answer) {
            toast.error('Please specify correct answer');
            return;
        }

        const data = {
            ...formData,
            quiz_id: quizId,
            points: parseFloat(formData.points) || 1,
            order: parseFloat(formData.order) || 0,
        };

        if (formData.question_type === 'true_false') {
            data.options = ['True', 'False'];
        } else {
            data.options = formData.options.filter(opt => opt.trim());
        }

        saveQuestionMutation.mutate(data);
    };

    const updateOption = (index, value) => {
        const newOptions = [...formData.options];
        newOptions[index] = value;
        setFormData({ ...formData, options: newOptions });
    };

    const addOption = () => {
        setFormData({ ...formData, options: [...formData.options, ''] });
    };

    const removeOption = (index) => {
        const newOptions = formData.options.filter((_, i) => i !== index);
        setFormData({ ...formData, options: newOptions });
    };

    return (
        <Card className="border-2 border-blue-200">
            <CardContent className="pt-6 space-y-4">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold text-lg">
                        {question?.id ? 'Edit Question' : 'Add New Question'}
                    </h3>
                    <Button variant="ghost" size="icon" onClick={onClose}>
                        <X className="w-5 h-5" />
                    </Button>
                </div>

                <div>
                    <Label htmlFor="question_text">Question *</Label>
                    <Textarea
                        id="question_text"
                        value={formData.question_text}
                        onChange={(e) => setFormData({ ...formData, question_text: e.target.value })}
                        placeholder="Enter your question"
                        rows={3}
                    />
                </div>

                <div className="grid grid-cols-3 gap-4">
                    <div>
                        <Label htmlFor="question_type">Type</Label>
                        <Select
                            value={formData.question_type}
                            onValueChange={(value) => setFormData({ ...formData, question_type: value })}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                                <SelectItem value="true_false">True/False</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <Label htmlFor="points">Points *</Label>
                        <Input
                            id="points"
                            type="number"
                            step="0.5"
                            value={formData.points}
                            onChange={(e) => setFormData({ ...formData, points: e.target.value })}
                        />
                    </div>

                    <div>
                        <Label htmlFor="order">Order</Label>
                        <Input
                            id="order"
                            type="number"
                            value={formData.order}
                            onChange={(e) => setFormData({ ...formData, order: e.target.value })}
                        />
                    </div>
                </div>

                <div>
                    <Label htmlFor="section">Section (optional)</Label>
                    <Input
                        id="section"
                        value={formData.section}
                        onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                        placeholder="e.g., Grammar, Vocabulary"
                    />
                </div>

                {formData.question_type === 'multiple_choice' ? (
                    <div>
                        <Label>Answer Options</Label>
                        <div className="space-y-2 mt-2">
                            {formData.options.map((option, idx) => (
                                <div key={idx} className="flex gap-2">
                                    <Input
                                        value={option}
                                        onChange={(e) => updateOption(idx, e.target.value)}
                                        placeholder={`Option ${idx + 1}`}
                                    />
                                    {formData.options.length > 2 && (
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            onClick={() => removeOption(idx)}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    )}
                                </div>
                            ))}
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={addOption}
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Add Option
                            </Button>
                        </div>
                    </div>
                ) : null}

                <div>
                    <Label htmlFor="correct_answer">Correct Answer *</Label>
                    {formData.question_type === 'true_false' ? (
                        <Select
                            value={formData.correct_answer}
                            onValueChange={(value) => setFormData({ ...formData, correct_answer: value })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select correct answer" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="True">True</SelectItem>
                                <SelectItem value="False">False</SelectItem>
                            </SelectContent>
                        </Select>
                    ) : (
                        <Select
                            value={formData.correct_answer}
                            onValueChange={(value) => setFormData({ ...formData, correct_answer: value })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select correct answer" />
                            </SelectTrigger>
                            <SelectContent>
                                {formData.options.filter(opt => opt.trim()).map((option, idx) => (
                                    <SelectItem key={idx} value={option}>
                                        {option}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}
                </div>

                <div className="flex gap-2 pt-4">
                    <Button
                        onClick={handleSave}
                        disabled={saveQuestionMutation.isPending}
                        className="flex-1"
                    >
                        <Save className="w-4 h-4 mr-2" />
                        {question?.id ? 'Update' : 'Add'} Question
                    </Button>
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}