import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { AlertCircle } from "lucide-react";

export default function QuizAssignmentDialog({ freelancerId, freelancerEmail, open, onOpenChange }) {
    const queryClient = useQueryClient();
    const [selectedQuizId, setSelectedQuizId] = useState('');
    const [deadline, setDeadline] = useState('');
    const [notes, setNotes] = useState('');
    const [isLoading, setIsLoading] = useState(false);

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

    const assignedQuizIds = assignments.map(a => a.quiz_id);
    const availableQuizzes = quizzes.filter(q => !assignedQuizIds.includes(q.id));

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Assign Quiz to Freelancer</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    {availableQuizzes.length === 0 ? (
                        <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <AlertCircle className="w-4 h-4 text-yellow-600" />
                            <p className="text-sm text-yellow-800">All quizzes are already assigned to this freelancer.</p>
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
                                        {availableQuizzes.map(quiz => (
                                            <SelectItem key={quiz.id} value={quiz.id}>
                                                {quiz.title}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
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