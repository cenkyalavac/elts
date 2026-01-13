import React from 'react';
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import AvailabilityCalendar from "../components/availability/AvailabilityCalendar";
import { Calendar, AlertCircle } from "lucide-react";

export default function MyAvailabilityPage() {
    const { data: user, isLoading } = useQuery({
        queryKey: ['currentUser'],
        queryFn: () => base44.auth.me()
    });

    const { data: freelancers = [] } = useQuery({
        queryKey: ['myFreelancerProfile'],
        queryFn: async () => {
            const all = await base44.entities.Freelancer.list();
            return all.filter(f => f.user_id === user?.id);
        },
        enabled: !!user
    });

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    const freelancer = freelancers[0];

    if (!freelancer) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
                <div className="max-w-4xl mx-auto">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                        <div>
                            <h3 className="font-semibold text-yellow-900">No Freelancer Profile Found</h3>
                            <p className="text-sm text-yellow-800 mt-1">
                                You need to complete your freelancer profile before setting availability.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
            <div className="max-w-6xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                        <Calendar className="w-8 h-8 text-blue-600" />
                        My Availability
                    </h1>
                    <p className="text-gray-600 mt-1">
                        Manage your available dates and working hours
                    </p>
                </div>

                <AvailabilityCalendar freelancerId={freelancer.id} readOnly={false} />
            </div>
        </div>
    );
}