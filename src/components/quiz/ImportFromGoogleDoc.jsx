import React, { useState } from 'react';
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, AlertCircle, CheckCircle, Loader2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { createPageUrl } from "../../utils";

export default function ImportFromGoogleDoc({ onSuccess }) {
    const [formData, setFormData] = useState({
        documentUrl: '',
        quizTitle: '',
        quizDescription: '',
        sourceLanguage: '',
        targetLanguage: '',
        specialization: '',
        serviceType: '',
        timeLimit: '',
        passingScore: ''
    });

    const queryClient = useQueryClient();

    const importMutation = useMutation({
        mutationFn: async (data) => {
            const response = await base44.functions.invoke('generateQuizFromGoogleDoc', data);
            return response.data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['quizzes'] });
            toast.success(`Quiz created with ${data.questions} questions!`);
            if (onSuccess) onSuccess(data);
        },
        onError: (error) => {
            toast.error(error.response?.data?.error || 'Failed to import quiz');
        }
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        
        if (!formData.documentUrl) {
            toast.error('Please provide a Google Docs URL');
            return;
        }

        importMutation.mutate(formData);
    };

    const handleChange = (field, value) => {
        setFormData({ ...formData, [field]: value });
    };

    return (
        <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-purple-900">
                    <FileText className="w-5 h-5" />
                    Import Quiz from Google Docs
                </CardTitle>
                <CardDescription>
                    Automatically generate a quiz from a Google Document. Format your doc with numbered questions, lettered options (A, B, C, D), and highlight the correct answers.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Document URL */}
                    <div>
                        <Label htmlFor="documentUrl" className="flex items-center gap-2">
                            Google Docs URL *
                            <a 
                                href="https://docs.google.com/document/create" 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-700"
                            >
                                <ExternalLink className="w-3 h-3" />
                            </a>
                        </Label>
                        <Input
                            id="documentUrl"
                            value={formData.documentUrl}
                            onChange={(e) => handleChange('documentUrl', e.target.value)}
                            placeholder="https://docs.google.com/document/d/..."
                            required
                        />
                    </div>

                    {/* Quiz Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="quizTitle">Quiz Title (optional)</Label>
                            <Input
                                id="quizTitle"
                                value={formData.quizTitle}
                                onChange={(e) => handleChange('quizTitle', e.target.value)}
                                placeholder="Leave blank to use doc title"
                            />
                        </div>

                        <div>
                            <Label htmlFor="specialization">Specialization (optional)</Label>
                            <Input
                                id="specialization"
                                value={formData.specialization}
                                onChange={(e) => handleChange('specialization', e.target.value)}
                                placeholder="e.g., Medical, Legal, Technical"
                            />
                        </div>
                    </div>

                    <div>
                        <Label htmlFor="quizDescription">Description (optional)</Label>
                        <Input
                            id="quizDescription"
                            value={formData.quizDescription}
                            onChange={(e) => handleChange('quizDescription', e.target.value)}
                            placeholder="Brief description of the quiz"
                        />
                    </div>

                    {/* Language Pairs */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="sourceLanguage">Source Language (optional)</Label>
                            <Input
                                id="sourceLanguage"
                                value={formData.sourceLanguage}
                                onChange={(e) => handleChange('sourceLanguage', e.target.value)}
                                placeholder="e.g., English"
                            />
                        </div>

                        <div>
                            <Label htmlFor="targetLanguage">Target Language (optional)</Label>
                            <Input
                                id="targetLanguage"
                                value={formData.targetLanguage}
                                onChange={(e) => handleChange('targetLanguage', e.target.value)}
                                placeholder="e.g., Turkish"
                            />
                        </div>
                    </div>

                    {/* Service Type */}
                    <div>
                        <Label htmlFor="serviceType">Service Type (optional)</Label>
                        <Select
                            value={formData.serviceType}
                            onValueChange={(value) => handleChange('serviceType', value)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select service type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Translation">Translation</SelectItem>
                                <SelectItem value="Interpretation">Interpretation</SelectItem>
                                <SelectItem value="Proofreading">Proofreading</SelectItem>
                                <SelectItem value="Localization">Localization</SelectItem>
                                <SelectItem value="Transcription">Transcription</SelectItem>
                                <SelectItem value="Subtitling">Subtitling</SelectItem>
                                <SelectItem value="MTPE">MTPE</SelectItem>
                                <SelectItem value="Review">Review</SelectItem>
                                <SelectItem value="LQA">LQA</SelectItem>
                                <SelectItem value="Transcreation">Transcreation</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Quiz Settings */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="timeLimit">Time Limit (minutes, optional)</Label>
                            <Input
                                id="timeLimit"
                                type="number"
                                value={formData.timeLimit}
                                onChange={(e) => handleChange('timeLimit', e.target.value)}
                                placeholder="e.g., 30"
                                min="1"
                            />
                        </div>

                        <div>
                            <Label htmlFor="passingScore">Passing Score (%, optional)</Label>
                            <Input
                                id="passingScore"
                                type="number"
                                value={formData.passingScore}
                                onChange={(e) => handleChange('passingScore', e.target.value)}
                                placeholder="e.g., 70"
                                min="0"
                                max="100"
                            />
                        </div>
                    </div>

                    {/* Instructions */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h4 className="font-semibold text-sm text-blue-900 mb-2 flex items-center gap-2">
                            <AlertCircle className="w-4 h-4" />
                            Document Format Instructions
                        </h4>
                        <ul className="text-xs text-blue-800 space-y-1 list-disc list-inside">
                            <li>Number your questions (1., 2., or Question 1, Q1, etc.)</li>
                            <li>Use capital letters for options (A. B. C. D. or A) B) C) D))</li>
                            <li><strong>Highlight ONLY the correct answer</strong> with any background color (yellow, green, etc.)</li>
                            <li>For True/False questions, write "True" or "False" and highlight the correct one</li>
                            <li>Make sure your Google Doc is shared (Anyone with link can view)</li>
                            <li>Each question must have at least 2 options and exactly 1 highlighted answer</li>
                        </ul>
                    </div>

                    {/* Submit Button */}
                    <Button
                        type="submit"
                        disabled={importMutation.isPending}
                        className="w-full bg-purple-600 hover:bg-purple-700"
                        size="lg"
                    >
                        {importMutation.isPending ? (
                            <>
                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                Importing Quiz...
                            </>
                        ) : (
                            <>
                                <FileText className="w-5 h-5 mr-2" />
                                Import Quiz from Google Docs
                            </>
                        )}
                    </Button>

                    {/* Result Display */}
                    {importMutation.isSuccess && importMutation.data && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                                <div className="flex-1">
                                    <h4 className="font-semibold text-green-900 mb-1">
                                        Quiz Created Successfully!
                                    </h4>
                                    <p className="text-sm text-green-800 mb-2">
                                        "{importMutation.data.quiz.title}" with {importMutation.data.questions} questions
                                    </p>
                                    {importMutation.data.skippedQuestions > 0 && (
                                        <p className="text-xs text-yellow-700">
                                            ⚠️ {importMutation.data.skippedQuestions} questions were skipped (missing correct answers or options)
                                        </p>
                                    )}
                                    <Button
                                        variant="link"
                                        onClick={() => window.location.href = createPageUrl(`TakeQuiz?quiz_id=${importMutation.data.quiz.id}&preview=true`)}
                                        className="text-green-700 p-0 h-auto mt-2"
                                    >
                                        Preview Quiz →
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}

                    {importMutation.isError && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                                <div>
                                    <h4 className="font-semibold text-red-900 mb-1">Import Failed</h4>
                                    <p className="text-sm text-red-800">
                                        {importMutation.error?.response?.data?.error || importMutation.error?.message || 'Unknown error occurred'}
                                    </p>
                                    {importMutation.error?.response?.data?.details && (
                                        <p className="text-xs text-red-700 mt-1">
                                            {importMutation.error.response.data.details}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </form>
            </CardContent>
        </Card>
    );
}