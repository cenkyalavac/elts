import React, { useState } from 'react';
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { CalendarIcon, Loader2 } from "lucide-react";

const AVAILABILITY_STATUS = {
    AVAILABLE: 'available',
    UNAVAILABLE: 'unavailable'
};

export default function QuickAvailabilityToggle({ freelancerId, todayAvailability, todayStr }) {
    const queryClient = useQueryClient();
    const [busyDialogOpen, setBusyDialogOpen] = useState(false);
    const [busyUntilDate, setBusyUntilDate] = useState(null);

    const isCurrentlyAvailable = !todayAvailability || todayAvailability.status === AVAILABILITY_STATUS.AVAILABLE;

    const availabilityMutation = useMutation({
        mutationFn: async ({ status, untilDate, todayOnly }) => {
            const today = new Date();
            const datesToUpdate = [];
            
            if (todayOnly) {
                datesToUpdate.push(todayStr);
            } else {
                const endDate = untilDate || today;
                for (let d = new Date(today); d <= endDate; d.setDate(d.getDate() + 1)) {
                    datesToUpdate.push(format(new Date(d), 'yyyy-MM-dd'));
                }
            }

            for (const dateStr of datesToUpdate) {
                const existing = await base44.entities.Availability.filter({
                    freelancer_id: freelancerId,
                    date: dateStr
                });
                
                if (existing.length > 0) {
                    await base44.entities.Availability.update(existing[0].id, { status });
                } else {
                    await base44.entities.Availability.create({
                        freelancer_id: freelancerId,
                        date: dateStr,
                        status
                    });
                }
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['availability', freelancerId] });
            setBusyDialogOpen(false);
            setBusyUntilDate(null);
        }
    });

    const handleAvailabilityToggle = (checked) => {
        if (!checked) {
            setBusyDialogOpen(true);
        } else {
            availabilityMutation.mutate({ status: AVAILABILITY_STATUS.AVAILABLE, todayOnly: true });
        }
    };

    const handleConfirmBusy = () => {
        availabilityMutation.mutate({ status: AVAILABILITY_STATUS.UNAVAILABLE, untilDate: busyUntilDate });
    };

    return (
        <>
            <Card className="border-0 shadow-sm">
                <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full ${isCurrentlyAvailable ? 'bg-green-500' : 'bg-red-500'}`} />
                            <div>
                                <div className="font-medium">Current Status</div>
                                <div className="text-sm text-gray-500">
                                    {isCurrentlyAvailable ? 'Available for work' : 'Marked as busy'}
                                    {todayAvailability?.notes && ` - ${todayAvailability.notes}`}
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className={`text-sm font-medium ${isCurrentlyAvailable ? 'text-green-600' : 'text-red-600'}`}>
                                {isCurrentlyAvailable ? 'Available' : 'Busy'}
                            </span>
                            <Switch 
                                checked={isCurrentlyAvailable}
                                onCheckedChange={handleAvailabilityToggle}
                                disabled={availabilityMutation.isPending}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Dialog open={busyDialogOpen} onOpenChange={setBusyDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Set Unavailability Period</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="text-sm text-gray-600">
                            Until when will you be unavailable?
                        </div>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className="w-full justify-start text-left font-normal">
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {busyUntilDate ? format(busyUntilDate, 'PPP') : 'Select end date'}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    mode="single"
                                    selected={busyUntilDate}
                                    onSelect={setBusyUntilDate}
                                    disabled={(date) => date < new Date()}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                        <p className="text-xs text-gray-500">
                            Times are in your local timezone ({Intl.DateTimeFormat().resolvedOptions().timeZone})
                        </p>
                    </div>
                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setBusyDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button 
                            onClick={handleConfirmBusy}
                            disabled={availabilityMutation.isPending}
                        >
                            {availabilityMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            {busyUntilDate ? 'Set as Busy' : 'Mark Busy Today Only'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}