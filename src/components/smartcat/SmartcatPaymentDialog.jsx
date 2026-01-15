import React, { useState } from 'react';
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { DollarSign, Loader2 } from "lucide-react";

const SERVICE_TYPES = [
    'Translation',
    'Editing',
    'Proofreading',
    'Postediting',
    'Copywriting',
    'Transcription',
    'Subtitling',
    'Voiceover',
    'DTP',
    'Review',
    'QA',
    'Other'
];

const UNIT_TYPES = [
    'Words',
    'Characters',
    'Pages',
    'Hours',
    'Minutes',
    'Items',
    'Fixed'
];

const CURRENCIES = ['USD', 'EUR', 'GBP', 'TRY'];

export default function SmartcatPaymentDialog({ open, onOpenChange, smartcatUserId, freelancerName }) {
    const queryClient = useQueryClient();
    const [formData, setFormData] = useState({
        serviceType: 'Translation',
        jobDescription: '',
        unitsType: 'Words',
        unitsAmount: '',
        pricePerUnit: '',
        currency: 'USD',
    });

    const createPayableMutation = useMutation({
        mutationFn: async (payableData) => {
            const response = await base44.functions.invoke('smartcat', {
                action: 'createPayable',
                payableData
            });
            if (!response.data?.success) {
                throw new Error(response.data?.error || 'Failed to create payable');
            }
            return response.data;
        },
        onSuccess: () => {
            toast.success('Payment job created successfully in Smartcat');
            queryClient.invalidateQueries({ queryKey: ['smartcatPayables'] });
            onOpenChange(false);
            resetForm();
        },
        onError: (error) => {
            toast.error(`Failed to create payment: ${error.message}`);
        }
    });

    const resetForm = () => {
        setFormData({
            serviceType: 'Translation',
            jobDescription: '',
            unitsType: 'Words',
            unitsAmount: '',
            pricePerUnit: '',
            currency: 'USD',
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        
        if (!smartcatUserId) {
            toast.error('No Smartcat user ID available');
            return;
        }

        createPayableMutation.mutate({
            userId: smartcatUserId,
            serviceType: formData.serviceType,
            jobDescription: formData.jobDescription,
            unitsType: formData.unitsType,
            unitsAmount: parseFloat(formData.unitsAmount),
            pricePerUnit: parseFloat(formData.pricePerUnit),
            currency: formData.currency,
        });
    };

    const totalAmount = formData.unitsAmount && formData.pricePerUnit
        ? (parseFloat(formData.unitsAmount) * parseFloat(formData.pricePerUnit)).toFixed(2)
        : '0.00';

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <DollarSign className="w-5 h-5 text-green-600" />
                        Create Smartcat Payment
                    </DialogTitle>
                    {freelancerName && (
                        <p className="text-sm text-gray-500">
                            Creating payment for: <span className="font-medium">{freelancerName}</span>
                        </p>
                    )}
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Service Type</Label>
                            <Select
                                value={formData.serviceType}
                                onValueChange={(v) => setFormData({ ...formData, serviceType: v })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {SERVICE_TYPES.map(type => (
                                        <SelectItem key={type} value={type}>{type}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Unit Type</Label>
                            <Select
                                value={formData.unitsType}
                                onValueChange={(v) => setFormData({ ...formData, unitsType: v })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {UNIT_TYPES.map(type => (
                                        <SelectItem key={type} value={type}>{type}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Job Description</Label>
                        <Textarea
                            placeholder="Enter job description or invoice reference..."
                            value={formData.jobDescription}
                            onChange={(e) => setFormData({ ...formData, jobDescription: e.target.value })}
                            rows={2}
                        />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label>Units Amount</Label>
                            <Input
                                type="number"
                                placeholder="1000"
                                value={formData.unitsAmount}
                                onChange={(e) => setFormData({ ...formData, unitsAmount: e.target.value })}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Price per Unit</Label>
                            <Input
                                type="number"
                                step="0.001"
                                placeholder="0.05"
                                value={formData.pricePerUnit}
                                onChange={(e) => setFormData({ ...formData, pricePerUnit: e.target.value })}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Currency</Label>
                            <Select
                                value={formData.currency}
                                onValueChange={(v) => setFormData({ ...formData, currency: v })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {CURRENCIES.map(curr => (
                                        <SelectItem key={curr} value={curr}>{curr}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Total Preview */}
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex justify-between items-center">
                            <span className="text-green-800 font-medium">Total Amount</span>
                            <span className="text-2xl font-bold text-green-700">
                                {formData.currency} {totalAmount}
                            </span>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button 
                            type="submit" 
                            className="bg-green-600 hover:bg-green-700"
                            disabled={createPayableMutation.isPending}
                        >
                            {createPayableMutation.isPending ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                <>
                                    <DollarSign className="w-4 h-4 mr-2" />
                                    Create Payment
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}