import React, { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Clock, CalendarIcon, Bell } from 'lucide-react';
import { format, addHours, addDays, setHours, setMinutes, startOfTomorrow, nextMonday } from 'date-fns';

export default function SnoozeDialog({ email, open, onOpenChange, onSnooze }) {
    const [snoozeDate, setSnoozeDate] = useState(null);
    const [snoozeTime, setSnoozeTime] = useState('09:00');
    const [showCalendar, setShowCalendar] = useState(false);

    const quickSnoozeOptions = [
        { label: 'Later today', getValue: () => addHours(new Date(), 3) },
        { label: 'Tomorrow morning', getValue: () => setHours(setMinutes(startOfTomorrow(), 0), 9) },
        { label: 'Tomorrow afternoon', getValue: () => setHours(setMinutes(startOfTomorrow(), 0), 14) },
        { label: 'Next Monday', getValue: () => setHours(setMinutes(nextMonday(new Date()), 0), 9) },
        { label: 'Next week', getValue: () => addDays(new Date(), 7) },
    ];

    const handleQuickSnooze = (option) => {
        const snoozeUntil = option.getValue();
        onSnooze(email, snoozeUntil);
        toast.success(`Snoozed until ${format(snoozeUntil, 'PPp')}`);
        onOpenChange(false);
    };

    const handleCustomSnooze = () => {
        if (!snoozeDate) {
            toast.error('Please select a date');
            return;
        }
        const [hours, minutes] = snoozeTime.split(':').map(Number);
        const snoozeUntil = setMinutes(setHours(snoozeDate, hours), minutes);
        onSnooze(email, snoozeUntil);
        toast.success(`Snoozed until ${format(snoozeUntil, 'PPp')}`);
        onOpenChange(false);
    };

    if (!email) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Clock className="w-5 h-5 text-purple-600" />
                        Snooze Email
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="bg-gray-50 rounded-lg p-3 text-sm">
                        <p className="text-gray-500">Email:</p>
                        <p className="font-medium text-gray-900 truncate">{email.subject}</p>
                    </div>

                    {/* Quick Options */}
                    <div className="space-y-2">
                        <Label className="text-sm font-medium">Quick snooze</Label>
                        <div className="grid grid-cols-1 gap-2">
                            {quickSnoozeOptions.map((option, idx) => (
                                <Button
                                    key={idx}
                                    variant="outline"
                                    className="justify-start gap-2"
                                    onClick={() => handleQuickSnooze(option)}
                                >
                                    <Bell className="w-4 h-4 text-gray-400" />
                                    {option.label}
                                </Button>
                            ))}
                        </div>
                    </div>

                    {/* Custom Date/Time */}
                    <div className="space-y-3 pt-3 border-t">
                        <Label className="text-sm font-medium">Or pick a date & time</Label>
                        
                        <Button 
                            variant="outline" 
                            className="w-full justify-start gap-2"
                            onClick={() => setShowCalendar(!showCalendar)}
                        >
                            <CalendarIcon className="w-4 h-4" />
                            {snoozeDate ? format(snoozeDate, 'PPP') : 'Select date'}
                        </Button>

                        {showCalendar && (
                            <div className="border rounded-lg p-2">
                                <Calendar
                                    mode="single"
                                    selected={snoozeDate}
                                    onSelect={(date) => {
                                        setSnoozeDate(date);
                                        setShowCalendar(false);
                                    }}
                                    disabled={(date) => date < new Date()}
                                />
                            </div>
                        )}

                        <Select value={snoozeTime} onValueChange={setSnoozeTime}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select time" />
                            </SelectTrigger>
                            <SelectContent>
                                {Array.from({ length: 24 }, (_, i) => {
                                    const hour = i.toString().padStart(2, '0');
                                    return (
                                        <React.Fragment key={hour}>
                                            <SelectItem value={`${hour}:00`}>{hour}:00</SelectItem>
                                            <SelectItem value={`${hour}:30`}>{hour}:30</SelectItem>
                                        </React.Fragment>
                                    );
                                })}
                            </SelectContent>
                        </Select>

                        {snoozeDate && (
                            <Button 
                                onClick={handleCustomSnooze}
                                className="w-full bg-purple-600 hover:bg-purple-700"
                            >
                                Snooze until {format(snoozeDate, 'MMM d')} at {snoozeTime}
                            </Button>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}