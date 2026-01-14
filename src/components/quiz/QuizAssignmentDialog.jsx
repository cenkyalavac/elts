import React, { useState, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { AlertCircle, Globe, Sparkles } from "lucide-react";

export default function QuizAssignmentDialog({ freelancerId, freelancerEmail, freelancerLanguagePairs, open, onOpenChange }) {
    const queryClient = useQueryClient();
    const [selectedQuizId, setSelectedQuizId] = useState('');
    const [deadline, setDeadline] = useState('');
    const [notes, setNotes] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [filterMode, setFilterMode] = useState('matching'); // 'matching' or 'all'

    const { data: quizzes = [] } = useQuery({
        queryKey: ['quizzes'],
        queryFn: () => base44.entities.Quiz.list(),
        enabled: open,
    });

    const { data: assignments = [] } = useQuery({
        queryKey: ['quizAssignments', freelancerId],
        queryFn: () => base44.entities.QuizAssignment.filter({ freelancer_id: freelancerId }),
        enabled: open,
    });

    const { data: freelancer } = useQuery({
        queryKey: ['freelancer', freelancerId],
        queryFn: async () => {
            const freelancers = await base44.entities.Freelancer.filter({ id: freelancerId });
            return freelancers[0];
        },
        enabled: open && !freelancerLanguagePairs,
    });

    const languagePairs = freelancerLanguagePairs || freelancer?.language_pairs || [];

    // Find matching quizzes based on freelancer's language pairs
    const { matchingQuizzes, otherQuizzes } = useMemo(() => {
        const assignedQuizIds = assignments.map(a => a.quiz_id);
        const unassignedQuizzes = quizzes.filter(q => q.is_active && !assignedQuizIds.includes(q.id));
        
        const matching = [];
        const others = [];
        
        unassignedQuizzes.forEach(quiz => {
            // Check if quiz matches any of the freelancer's language pairs
            const isMatch = languagePairs.some(lp => {
                const sourceMatch = !quiz.source_language || quiz.source_language === lp.source_language;
                const targetMatch = !quiz.target_language || quiz.target_language === lp.target_language;
                return sourceMatch && targetMatch;
            });
            
            if (isMatch || (!quiz.source_language && !quiz.target_language)) {
                matching.push(quiz);
            } else {
                others.push(quiz);
            }
        });
        
        return { matchingQuizzes: matching, otherQuizzes: others };
    }, [quizzes, assignments, languagePairs]);

    const assignmentMutation = useMutation({
        mutationFn: async () => {
            setIsLoading(true);
            const assignedQuizzes = assignments.map(a => a.quiz_id);
            if (assignedQuizzes.includes(selectedQuizId)) {
                throw new Error('This quiz is already assigned to this freelancer');
            }

            await base44.entities.QuizAssignment.create({
                freelancer_id: freelancerId,
                quiz_id: selectedQuizId,
                deadline,
                notes,
                assigned_by: (await base44.auth.me()).email
            });

            // Send email
            await base44.functions.invoke('sendQuizAssignmentEmail', {
                freelancerId,
                quizId: selectedQuizId,
                freelancerEmail
            });
        },
        onSuccess: () => {
            toast.success('Quiz assigned successfully');
            queryClient.invalidateQueries({ queryKey: ['quizAssignments'] });
            setSelectedQuizId('');
            setDeadline('');
            setNotes('');
            setIsLoading(false);
            onOpenChange(false);
        },
        onError: (error) => {
            toast.error(error.message || 'Failed to assign quiz');
            setIsLoading(false);
        }
    });

    const displayedQuizzes = filterMode === 'matching' ? matchingQuizzes : [...matchingQuizzes, ...otherQuizzes];

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Assign Quiz to Freelancer</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Freelancer's Language Pairs */}
                    {languagePairs.length > 0 && (
                        <div className="p-3 bg-purple-50 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                                <Globe className="w-4 h-4 text-purple-600" />
                                <span className="text-sm font-medium text-purple-900">Freelancer's Languages</span>
                            </div>
                            <div className="flex flex-wrap gap-1">
                                {languagePairs.map((lp, idx) => (
                                    <Badge key={idx} variant="secondary" className="text-xs">
                                        {lp.source_language} → {lp.target_language}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Filter Toggle */}
                    <div className="flex gap-2">
                        <Button 
                            size="sm" 
                            variant={filterMode === 'matching' ? 'default' : 'outline'}
                            onClick={() => setFilterMode('matching')}
                            className="flex-1"
                        >
                            <Sparkles className="w-3 h-3 mr-1" />
                            Matching ({matchingQuizzes.length})
                        </Button>
                        <Button 
                            size="sm" 
                            variant={filterMode === 'all' ? 'default' : 'outline'}
                            onClick={() => setFilterMode('all')}
                            className="flex-1"
                        >
                            All Available ({matchingQuizzes.length + otherQuizzes.length})
                        </Button>
                    </div>

                    {displayedQuizzes.length === 0 ? (
                        <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <AlertCircle className="w-4 h-4 text-yellow-600" />
                            <p className="text-sm text-yellow-800">
                                {filterMode === 'matching' 
                                    ? "No matching quizzes found. Try viewing all quizzes."
                                    : "All quizzes are already assigned to this freelancer."}
                            </p>
                        </div>
                    ) : (
                        <>
                            <div>
                                <Label htmlFor="quiz-select">Select Quiz</Label>
                                <Select value={selectedQuizId} onValueChange={setSelectedQuizId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Choose a quiz..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {displayedQuizzes.map(quiz => (
                                            <SelectItem key={quiz.id} value={quiz.id}>
                                                <div className="flex items-center gap-2">
                                                    <span>{quiz.title}</span>
                                                    {quiz.source_language && quiz.target_language && (
                                                        <span className="text-xs text-gray-500">
                                                            ({quiz.source_language} → {quiz.target_language})
                                                        </span>
                                                    )}
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {selectedQuizId && (
                                    <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                                        {(() => {
                                            const quiz = quizzes.find(q => q.id === selectedQuizId);
                                            if (!quiz) return null;
                                            return (
                                                <div className="space-y-1">
                                                    {quiz.description && <p className="text-gray-600">{quiz.description}</p>}
                                                    <div className="flex flex-wrap gap-1">
                                                        {quiz.source_language && quiz.target_language && (
                                                            <Badge variant="outline" className="text-xs">
                                                                {quiz.source_language} → {quiz.target_language}
                                                            </Badge>
                                                        )}
                                                        {quiz.service_type && (
                                                            <Badge variant="outline" className="text-xs">{quiz.service_type}</Badge>
                                                        )}
                                                        {quiz.specialization && (
                                                            <Badge variant="outline" className="text-xs">{quiz.specialization}</Badge>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })()}
                                    </div>
                                )}
                            </div>

                            <div>
                                <Label htmlFor="deadline">Deadline (Optional)</Label>
                                <Input
                                    id="deadline"
                                    type="date"
                                    value={deadline}
                                    onChange={(e) => setDeadline(e.target.value)}
                                />
                            </div>

                            <div>
                                <Label htmlFor="notes">Notes for Freelancer</Label>
                                <Textarea
                                    id="notes"
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="E.g., This is a required assessment for approval..."
                                    className="h-20"
                                />
                            </div>
                        </>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button
                        onClick={() => assignmentMutation.mutate()}
                        disabled={!selectedQuizId || isLoading}
                    >
                        {isLoading ? 'Assigning...' : 'Assign Quiz'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}