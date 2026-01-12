import React, { useState } from 'react';
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

const VALID_STATUSES = ['New Application', 'Form Sent', 'Price Negotiation', 'Test Sent', 'Approved', 'On Hold', 'Rejected', 'Red Flag'];

export default function BulkStatusDialog({ open, onOpenChange, selectedIds, freelancers }) {
    const [newStatus, setNewStatus] = useState('');
    const queryClient = useQueryClient();
    
    const selectedFreelancers = freelancers.filter(f => selectedIds.includes(f.id));
    
    // Count freelancers by current status
    const statusCounts = selectedFreelancers.reduce((acc, f) => {
        acc[f.status] = (acc[f.status] || 0) + 1;
        return acc;
    }, {});
    
    const updateMutation = useMutation({
        mutationFn: async () => {
            const updates = selectedFreelancers.map(f => 
                base44.entities.Freelancer.update(f.id, { status: newStatus })
            );
            await Promise.all(updates);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['freelancers'] });
            toast.success(`Updated ${selectedIds.length} freelancer${selectedIds.length > 1 ? 's' : ''} to ${newStatus}`);
            onOpenChange(false);
            setNewStatus('');
        },
        onError: (error) => {
            toast.error('Failed to update status');
        }
    });
    
    const handleConfirm = async () => {
        if (!newStatus) {
            toast.error('Please select a status');
            return;
        }
        await updateMutation.mutateAsync();
    };
    
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Change Status</DialogTitle>
                </DialogHeader>
                
                <div className="space-y-4">
                    {/* Summary */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <div className="flex gap-2 items-start">
                            <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                            <div className="text-sm">
                                <p className="font-medium text-blue-900">
                                    {selectedIds.length} freelancer{selectedIds.length > 1 ? 's' : ''} selected
                                </p>
                                <p className="text-xs text-blue-800 mt-1">
                                    {Object.entries(statusCounts).map(([status, count]) => 
                                        `${count} ${status}`
                                    ).join(' • ')}
                                </p>
                            </div>
                        </div>
                    </div>
                    
                    {/* Status Select */}
                    <div>
                        <Label htmlFor="status">New Status *</Label>
                        <Select value={newStatus} onValueChange={setNewStatus}>
                            <SelectTrigger id="status" className="mt-1">
                                <SelectValue placeholder="Select new status" />
                            </SelectTrigger>
                            <SelectContent>
                                {VALID_STATUSES.map(status => (
                                    <SelectItem key={status} value={status}>
                                        {status}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                
                <DialogFooter>
                    <Button 
                        variant="outline" 
                        onClick={() => onOpenChange(false)}
                        disabled={updateMutation.isPending}
                    >
                        Cancel
                    </Button>
                    <Button 
                        onClick={handleConfirm}
                        disabled={!newStatus || updateMutation.isPending}
                        className="bg-blue-600 hover:bg-blue-700"
                    >
                        {updateMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Update Status
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}