import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { Power, Clock, Calendar, ChevronDown, Zap, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "sonner";

const QUICK_DURATIONS = [
    { label: 'Rest of today', hours: null, icon: Sun, id: 'today' },
    { label: '4 hours', hours: 4, icon: Clock, id: '4h' },
    { label: '8 hours', hours: 8, icon: Clock, id: '8h' },
    { label: 'This week', hours: null, icon: Calendar, id: 'week' },
];

export default function QuickAvailabilityToggle({ freelancerId }) {
    const queryClient = useQueryClient();
    const [isChanging, setIsChanging] = useState(false);
    const [showOptions, setShowOptions] = useState(false);

    const today = new Date().toISOString().split('T')[0];

    // Get today's availability
    const { data: todayAvailability, isLoading } = useQuery({
        queryKey: ['todayAvailability', freelancerId, today],
        queryFn: async () => {
            const availabilities = await base44.entities.Availability.filter({
                freelancer_id: freelancerId,
                date: today
            });
            return availabilities[0] || null;
        },
        enabled: !!freelancerId,
        staleTime: 30000,
    });

    const isAvailable = todayAvailability?.status === 'available' || todayAvailability?.status === 'partially_available';

    const updateAvailabilityMutation = useMutation({
        mutationFn: async ({ status, hours, duration }) => {
            const now = new Date();
            const currentHour = now.getHours();
            const remainingHoursToday = Math.max(0, 18 - currentHour); // Assume work day ends at 6pm

            let hoursAvailable = hours;
            if (duration === 'today') {
                hoursAvailable = remainingHoursToday;
            } else if (duration === 'week') {
                // For week, we'll create entries for the next 7 days
                const dates = [];
                for (let i = 0; i < 7; i++) {
                    const d = new Date();
                    d.setDate(d.getDate() + i);
                    dates.push(d.toISOString().split('T')[0]);
                }
                
                for (const date of dates) {
                    const existing = await base44.entities.Availability.filter({
                        freelancer_id: freelancerId,
                        date: date
                    });
                    
                    if (existing[0]) {
                        await base44.entities.Availability.update(existing[0].id, {
                            status,
                            hours_available: 8
                        });
                    } else {
                        await base44.entities.Availability.create({
                            freelancer_id: freelancerId,
                            date,
                            status,
                            hours_available: 8
                        });
                    }
                }
                return;
            }

            if (todayAvailability) {
                await base44.entities.Availability.update(todayAvailability.id, {
                    status,
                    hours_available: hoursAvailable || 8
                });
            } else {
                await base44.entities.Availability.create({
                    freelancer_id: freelancerId,
                    date: today,
                    status,
                    hours_available: hoursAvailable || 8
                });
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['todayAvailability'] });
            queryClient.invalidateQueries({ queryKey: ['availability'] });
            setIsChanging(false);
            setShowOptions(false);
        },
        onError: (error) => {
            console.error('Error updating availability:', error);
            toast.error('Failed to update availability');
            setIsChanging(false);
        }
    });

    const handleToggle = (goOnline = true, duration = 'today', hours = null) => {
        setIsChanging(true);
        
        if (goOnline) {
            updateAvailabilityMutation.mutate({
                status: 'available',
                hours,
                duration
            });
            toast.success(
                duration === 'week' 
                    ? "You're now available for the week!" 
                    : `You're now available${hours ? ` for ${hours} hours` : ' for today'}!`,
                { icon: '🟢' }
            );
        } else {
            updateAvailabilityMutation.mutate({
                status: 'unavailable',
                hours: 0,
                duration: 'today'
            });
            toast.success("You're now offline", { icon: '🔴' });
        }
    };

    const handleQuickGoOffline = () => {
        handleToggle(false);
    };

    if (isLoading) {
        return (
            <div className="bg-gray-100 rounded-2xl p-4 animate-pulse">
                <div className="h-16 bg-gray-200 rounded-xl"></div>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative"
        >
            <div className={`
                relative overflow-hidden rounded-2xl transition-all duration-500
                ${isAvailable 
                    ? 'bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 shadow-lg shadow-green-500/30' 
                    : 'bg-gradient-to-r from-gray-600 via-gray-700 to-gray-800 shadow-lg shadow-gray-500/20'
                }
            `}>
                {/* Animated background pulse when available */}
                {isAvailable && (
                    <motion.div
                        className="absolute inset-0 bg-white/20"
                        animate={{ opacity: [0.1, 0.3, 0.1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                    />
                )}

                <div className="relative z-10 p-4 sm:p-5">
                    <div className="flex items-center justify-between gap-4">
                        {/* Status indicator and text */}
                        <div className="flex items-center gap-4">
                            {/* Pulsing status light */}
                            <div className="relative">
                                <motion.div
                                    className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center
                                        ${isAvailable ? 'bg-white/20' : 'bg-white/10'}
                                    `}
                                    animate={isAvailable ? { scale: [1, 1.05, 1] } : {}}
                                    transition={{ duration: 1.5, repeat: Infinity }}
                                >
                                    <Power className={`w-7 h-7 sm:w-8 sm:h-8 ${isAvailable ? 'text-white' : 'text-gray-400'}`} />
                                </motion.div>
                                
                                {/* Status dot */}
                                <motion.div
                                    className={`absolute -top-1 -right-1 w-5 h-5 rounded-full border-2 border-white
                                        ${isAvailable ? 'bg-green-300' : 'bg-gray-500'}
                                    `}
                                    animate={isAvailable ? { scale: [1, 1.2, 1] } : {}}
                                    transition={{ duration: 1, repeat: Infinity }}
                                />
                            </div>

                            <div className="text-white">
                                <div className="text-xl sm:text-2xl font-bold tracking-tight">
                                    {isAvailable ? "You're Online" : "You're Offline"}
                                </div>
                                <div className="text-white/80 text-sm sm:text-base mt-0.5">
                                    {isAvailable ? (
                                        <span className="flex items-center gap-2">
                                            <Zap className="w-4 h-4" />
                                            Ready to receive projects
                                            {todayAvailability?.hours_available && (
                                                <Badge className="bg-white/20 text-white border-0 ml-1">
                                                    {todayAvailability.hours_available}h today
                                                </Badge>
                                            )}
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-2">
                                            <Moon className="w-4 h-4" />
                                            Not receiving new projects
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Toggle button */}
                        <div className="flex items-center gap-2">
                            {isAvailable ? (
                                <Button
                                    onClick={handleQuickGoOffline}
                                    disabled={isChanging}
                                    className="bg-white/20 hover:bg-white/30 text-white border-0 h-12 px-6 text-base font-semibold"
                                >
                                    {isChanging ? (
                                        <motion.div
                                            animate={{ rotate: 360 }}
                                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                        >
                                            <Power className="w-5 h-5" />
                                        </motion.div>
                                    ) : (
                                        <>
                                            <Power className="w-5 h-5 mr-2" />
                                            Go Offline
                                        </>
                                    )}
                                </Button>
                            ) : (
                                <Popover open={showOptions} onOpenChange={setShowOptions}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            disabled={isChanging}
                                            className="bg-green-500 hover:bg-green-600 text-white border-0 h-12 px-6 text-base font-semibold shadow-lg"
                                        >
                                            {isChanging ? (
                                                <motion.div
                                                    animate={{ rotate: 360 }}
                                                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                                >
                                                    <Power className="w-5 h-5" />
                                                </motion.div>
                                            ) : (
                                                <>
                                                    <Zap className="w-5 h-5 mr-2" />
                                                    Go Online
                                                    <ChevronDown className="w-4 h-4 ml-2" />
                                                </>
                                            )}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-64 p-2" align="end">
                                        <div className="space-y-1">
                                            <div className="px-2 py-1.5 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                How long are you available?
                                            </div>
                                            {QUICK_DURATIONS.map((duration) => (
                                                <Button
                                                    key={duration.id}
                                                    variant="ghost"
                                                    className="w-full justify-start h-11 text-base"
                                                    onClick={() => handleToggle(true, duration.id, duration.hours)}
                                                >
                                                    <duration.icon className="w-5 h-5 mr-3 text-green-600" />
                                                    {duration.label}
                                                </Button>
                                            ))}
                                        </div>
                                    </PopoverContent>
                                </Popover>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Subtle hint text */}
            <AnimatePresence>
                {!isAvailable && (
                    <motion.p
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="text-center text-gray-500 text-sm mt-3"
                    >
                        Go online to start receiving project invitations
                    </motion.p>
                )}
            </AnimatePresence>
        </motion.div>
    );
}