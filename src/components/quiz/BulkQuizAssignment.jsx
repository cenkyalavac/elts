import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Award, AlertCircle } from "lucide-react";

export default function BulkQuizAssignment({ freelancers = [] }) {
    const queryClient = useQueryClient();
    const [selectedFreelancers, setSelectedFreelancers] = useState(new Set());
    const [selectedQuizId, setSelectedQuizId] = useState('');
    const [deadline, setDeadline] = useState('');
    const [notes, setNotes] = useState('');
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const { data: quizzes = [] } = useQuery({
        queryKey: ['quizzes'],
        queryFn: () => base44.entities.Quiz.list(),
    });

    const { data: currentUser } = useQuery({
        queryKey: ['currentUser'],
        queryFn: () => base44.auth.me(),
    });

    const assignmentMutation = useMutation({
        mutationFn: async () => {
            setIsLoading(true);
            const freelancerIds = Array.from(selectedFreelancers);

            for (const freelancerId of freelancerIds) {
                const freelancer = freelancers.find(f => f.id === freelancerId);
                
                await base44.entities.QuizAssignment.create({
                    freelancer_id: freelancerId,
                    quiz_id: selectedQuizId,
                    deadline,
                    notes,
                    assigned_by: currentUser?.email,
                    status: 'pending'
                });

                // Send email notification
                try {
                    await base44.functions.invoke('sendQuizAssignmentEmail', {
                        freelancerId,
                        quizId: selectedQuizId,
                        freelancerEmail: freelancer?.email
                    });
                } catch (error) {
                    console.error('Failed to send email:', error);
                }
            }
        },
        onSuccess: () => {
            toast.success(`Quiz assigned to ${selectedFreelancers.size} freelancer(s)`);
            queryClient.invalidateQueries({ queryKey: ['quizAssignments'] });
            setSelectedFreelancers(new Set());
            setSelectedQuizId('');
            setDeadline('');
            setNotes('');
            setOpen(false);
            setIsLoading(false);
        },
        onError: (error) => {
            toast.error('Failed to assign quiz: ' + error.message);
            setIsLoading(false);
        }
    });

    const handleTogglFreelancer = (id) => {
        const newSet = new Set(selectedFreelancers);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setSelectedFreelancers(newSet);
    };

    const handleSelectAll = () => {
        if (selectedFreelancers.size === freelancers.length) {
            setSelectedFreelancers(new Set());
        } else {
            setSelectedFreelancers(new Set(freelancers.map(f => f.id)));
        }
    };

    return (
        <>
            <Button 
                onClick={() => setOpen(true)}
                variant="outline"
                className="gap-2"
            >
                <Award className="w-4 h-4" />
                Bulk Assign Quiz
            </Button>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Assign Quiz to Multiple Freelancers</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4">
                        {/* Quiz Selection */}
                        <div>
                            <Label htmlFor="quiz-select">Select Quiz *</Label>
                            <Select value={selectedQuizId} onValueChange={setSelectedQuizId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Choose a quiz..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {quizzes.map(quiz => (
                                        <SelectItem key={quiz.id} value={quiz.id}>
                                            {quiz.title}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Deadline */}
                        <div>
                            <Label htmlFor="deadline">Deadline (Optional)</Label>
                            <Input
                                id="deadline"
                                type="date"
                                value={deadline}
                                onChange={(e) => setDeadline(e.target.value)}
                            />
                        </div>

                        {/* Notes */}
                        <div>
                            <Label htmlFor="notes">Notes for Freelancers</Label>
                            <Textarea
                                id="notes"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="E.g., This is a required assessment..."
                                className="h-20"
                            />
                        </div>

                        {/* Freelancer Selection */}
                        <div className="border rounded-lg p-3">
                            <div className="flex items-center justify-between mb-3">
                                <Label className="flex items-center gap-2">
                                    <Checkbox 
                                        checked={selectedFreelancers.size === freelancers.length && freelancers.length > 0}
                                        onCheckedChange={handleSelectAll}
                                    />
                                    <span className="text-sm font-medium">
                                        Select All ({freelancers.length})
                                    </span>
                                </Label>
                                <Badge variant="outline">
                                    {selectedFreelancers.size} selected
                                </Badge>
                            </div>

                            <div className="max-h-48 overflow-y-auto space-y-2">
                                {freelancers.length === 0 ? (
                                    <div className="flex items-center gap-2 text-sm text-gray-600 py-4">
                                        <AlertCircle className="w-4 h-4" />
                                        No freelancers available
                                    </div>
                                ) : (
                                    freelancers.map(freelancer => (
                                        <label key={freelancer.id} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                                            <Checkbox 
                                                checked={selectedFreelancers.has(freelancer.id)}
                                                onCheckedChange={() => handleTogglFreelancer(freelancer.id)}
                                            />
                                            <div className="flex-1 min-w-0">
                                                <div className="text-sm font-medium text-gray-900">{freelancer.full_name}</div>
                                                <div className="text-xs text-gray-500">{freelancer.email}</div>
                                            </div>
                                        </label>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={() => assignmentMutation.mutate()}
                            disabled={!selectedQuizId || selectedFreelancers.size === 0 || isLoading}
                        >
                            {isLoading ? 'Assigning...' : `Assign to ${selectedFreelancers.size}`}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}