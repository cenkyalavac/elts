import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek } from "date-fns";
import { toast } from "sonner";

export default function AvailabilityCalendar({ freelancerId, readOnly = false }) {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(null);
    const [showDialog, setShowDialog] = useState(false);
    const [availabilityData, setAvailabilityData] = useState({
        status: 'available',
        hours_available: 8,
        notes: ''
    });
    const queryClient = useQueryClient();

    const { data: availabilities = [] } = useQuery({
        queryKey: ['availabilities', freelancerId, format(currentMonth, 'yyyy-MM')],
        queryFn: async () => {
            const start = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
            const end = format(endOfMonth(currentMonth), 'yyyy-MM-dd');
            const all = await base44.entities.Availability.list();
            return all.filter(a => 
                a.freelancer_id === freelancerId &&
                a.date >= start &&
                a.date <= end
            );
        },
        enabled: !!freelancerId
    });

    const createAvailabilityMutation = useMutation({
        mutationFn: (data) => base44.entities.Availability.create({
            freelancer_id: freelancerId,
            date: format(selectedDate, 'yyyy-MM-dd'),
            ...data
        }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['availabilities'] });
            setShowDialog(false);
            setAvailabilityData({ status: 'available', hours_available: 8, notes: '' });
            toast.success('Availability updated');
        }
    });

    const updateAvailabilityMutation = useMutation({
        mutationFn: ({ id, data }) => base44.entities.Availability.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['availabilities'] });
            setShowDialog(false);
            toast.success('Availability updated');
        }
    });

    const deleteAvailabilityMutation = useMutation({
        mutationFn: (id) => base44.entities.Availability.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['availabilities'] });
            setShowDialog(false);
            toast.success('Availability removed');
        }
    });

    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calendarStart = startOfWeek(monthStart);
    const calendarEnd = endOfWeek(monthEnd);
    const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

    const getAvailabilityForDate = (date) => {
        return availabilities.find(a => isSameDay(new Date(a.date), date));
    };

    const handleDateClick = (date) => {
        if (readOnly || !isSameMonth(date, currentMonth)) return;
        setSelectedDate(date);
        const existing = getAvailabilityForDate(date);
        if (existing) {
            setAvailabilityData({
                status: existing.status,
                hours_available: existing.hours_available || 8,
                notes: existing.notes || ''
            });
        } else {
            setAvailabilityData({ status: 'available', hours_available: 8, notes: '' });
        }
        setShowDialog(true);
    };

    const handleSave = () => {
        const existing = getAvailabilityForDate(selectedDate);
        if (existing) {
            updateAvailabilityMutation.mutate({ id: existing.id, data: availabilityData });
        } else {
            createAvailabilityMutation.mutate(availabilityData);
        }
    };

    const handleDelete = () => {
        const existing = getAvailabilityForDate(selectedDate);
        if (existing) {
            deleteAvailabilityMutation.mutate(existing.id);
        }
    };

    const statusColors = {
        available: 'bg-green-100 text-green-800 border-green-300',
        partially_available: 'bg-yellow-100 text-yellow-800 border-yellow-300',
        unavailable: 'bg-red-100 text-red-800 border-red-300'
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <CalendarIcon className="w-5 h-5" />
                            Availability Calendar
                        </CardTitle>
                        <CardDescription>
                            {readOnly ? 'View freelancer availability' : 'Set your available dates and hours'}
                        </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <div className="text-lg font-semibold min-w-[150px] text-center">
                            {format(currentMonth, 'MMMM yyyy')}
                        </div>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                        >
                            <ChevronRight className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-7 gap-2 mb-2">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                        <div key={day} className="text-center text-sm font-semibold text-gray-600 py-2">
                            {day}
                        </div>
                    ))}
                </div>
                <div className="grid grid-cols-7 gap-2">
                    {calendarDays.map((day, index) => {
                        const availability = getAvailabilityForDate(day);
                        const isCurrentMonth = isSameMonth(day, currentMonth);
                        const isToday = isSameDay(day, new Date());
                        
                        return (
                            <button
                                key={index}
                                onClick={() => handleDateClick(day)}
                                disabled={readOnly && !availability}
                                className={`
                                    aspect-square p-2 rounded-lg border-2 transition-all
                                    ${!isCurrentMonth ? 'opacity-30' : ''}
                                    ${isToday ? 'border-blue-500' : 'border-gray-200'}
                                    ${availability ? statusColors[availability.status] : 'bg-white hover:bg-gray-50'}
                                    ${!readOnly && isCurrentMonth ? 'cursor-pointer' : ''}
                                    ${readOnly && !availability ? 'cursor-default' : ''}
                                `}
                            >
                                <div className="text-sm font-medium">{format(day, 'd')}</div>
                                {availability && (
                                    <div className="text-xs mt-1">
                                        {availability.hours_available ? `${availability.hours_available}h` : ''}
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>

                <div className="mt-6 flex gap-4 text-sm">
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-green-100 border-2 border-green-300"></div>
                        <span>Available</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-yellow-100 border-2 border-yellow-300"></div>
                        <span>Partially Available</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-red-100 border-2 border-red-300"></div>
                        <span>Unavailable</span>
                    </div>
                </div>
            </CardContent>

            {!readOnly && (
                <Dialog open={showDialog} onOpenChange={setShowDialog}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>
                                Set Availability for {selectedDate && format(selectedDate, 'MMMM d, yyyy')}
                            </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-medium mb-2 block">Status</label>
                                <Select value={availabilityData.status} onValueChange={(value) => 
                                    setAvailabilityData({ ...availabilityData, status: value })
                                }>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="available">Available</SelectItem>
                                        <SelectItem value="partially_available">Partially Available</SelectItem>
                                        <SelectItem value="unavailable">Unavailable</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {availabilityData.status !== 'unavailable' && (
                                <div>
                                    <label className="text-sm font-medium mb-2 block flex items-center gap-2">
                                        <Clock className="w-4 h-4" />
                                        Hours Available
                                    </label>
                                    <Input
                                        type="number"
                                        min="1"
                                        max="24"
                                        value={availabilityData.hours_available}
                                        onChange={(e) => setAvailabilityData({ 
                                            ...availabilityData, 
                                            hours_available: parseInt(e.target.value) 
                                        })}
                                    />
                                </div>
                            )}

                            <div>
                                <label className="text-sm font-medium mb-2 block">Notes</label>
                                <Textarea
                                    value={availabilityData.notes}
                                    onChange={(e) => setAvailabilityData({ 
                                        ...availabilityData, 
                                        notes: e.target.value 
                                    })}
                                    placeholder="Add any additional details..."
                                    rows={3}
                                />
                            </div>

                            <div className="flex justify-between pt-4">
                                <Button
                                    variant="destructive"
                                    onClick={handleDelete}
                                    disabled={!getAvailabilityForDate(selectedDate)}
                                >
                                    Remove
                                </Button>
                                <div className="flex gap-2">
                                    <Button variant="outline" onClick={() => setShowDialog(false)}>
                                        Cancel
                                    </Button>
                                    <Button onClick={handleSave}>
                                        Save
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            )}
        </Card>
    );
}