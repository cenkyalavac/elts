import React from 'react';
import { format } from 'date-fns';
import { 
    ArrowRight, Mail, AlertTriangle, FileCheck, 
    MessageSquare, DollarSign, Upload, Calendar,
    Activity, User
} from 'lucide-react';

const ACTIVITY_CONFIG = {
    'Stage Changed': { 
        icon: ArrowRight, 
        color: 'bg-blue-500',
        borderColor: 'border-blue-500',
        bgColor: 'bg-blue-50'
    },
    'Email Sent': { 
        icon: Mail, 
        color: 'bg-gray-500',
        borderColor: 'border-gray-400',
        bgColor: 'bg-gray-50'
    },
    'Quality Alert': { 
        icon: AlertTriangle, 
        color: 'bg-orange-500',
        borderColor: 'border-orange-500',
        bgColor: 'bg-orange-50'
    },
    'Document Signed': { 
        icon: FileCheck, 
        color: 'bg-green-500',
        borderColor: 'border-green-500',
        bgColor: 'bg-green-50'
    },
    'Document Uploaded': { 
        icon: Upload, 
        color: 'bg-green-500',
        borderColor: 'border-green-500',
        bgColor: 'bg-green-50'
    },
    'Note Added': { 
        icon: MessageSquare, 
        color: 'bg-purple-500',
        borderColor: 'border-purple-500',
        bgColor: 'bg-purple-50'
    },
    'Rate Negotiated': { 
        icon: DollarSign, 
        color: 'bg-yellow-500',
        borderColor: 'border-yellow-500',
        bgColor: 'bg-yellow-50'
    },
    'Test Sent': { 
        icon: FileCheck, 
        color: 'bg-indigo-500',
        borderColor: 'border-indigo-500',
        bgColor: 'bg-indigo-50'
    },
    'Follow-up Scheduled': { 
        icon: Calendar, 
        color: 'bg-teal-500',
        borderColor: 'border-teal-500',
        bgColor: 'bg-teal-50'
    },
};

const DEFAULT_CONFIG = {
    icon: Activity,
    color: 'bg-gray-400',
    borderColor: 'border-gray-400',
    bgColor: 'bg-gray-50'
};

export default function ActivityTimeline({ activities }) {
    if (!activities || activities.length === 0) {
        return (
            <div className="text-center py-12 text-gray-500">
                <Activity className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="font-medium">No activity recorded yet</p>
                <p className="text-sm mt-1">Activity will appear here as actions are taken</p>
            </div>
        );
    }

    return (
        <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />

            <div className="space-y-6">
                {activities.map((activity, index) => {
                    const config = ACTIVITY_CONFIG[activity.activity_type] || DEFAULT_CONFIG;
                    const Icon = config.icon;
                    const isFirst = index === 0;

                    return (
                        <div key={activity.id} className="relative flex gap-4">
                            {/* Icon circle */}
                            <div className={`
                                relative z-10 flex-shrink-0 w-8 h-8 rounded-full 
                                ${config.color} flex items-center justify-center
                                ${isFirst ? 'ring-4 ring-white shadow-lg' : ''}
                            `}>
                                <Icon className="w-4 h-4 text-white" />
                            </div>

                            {/* Content */}
                            <div className={`flex-1 ${config.bgColor} rounded-lg p-4 border ${config.borderColor} border-opacity-30`}>
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="font-semibold text-gray-900">
                                            {activity.activity_type}
                                        </div>
                                        <p className="text-sm text-gray-700 mt-1">
                                            {activity.description}
                                        </p>
                                        
                                        {/* Old/New values for stage changes */}
                                        {activity.old_value && activity.new_value && (
                                            <div className="flex items-center gap-2 mt-2 text-xs">
                                                <span className="px-2 py-1 bg-gray-200 rounded text-gray-600">
                                                    {activity.old_value}
                                                </span>
                                                <ArrowRight className="w-3 h-3 text-gray-400" />
                                                <span className="px-2 py-1 bg-blue-100 rounded text-blue-700 font-medium">
                                                    {activity.new_value}
                                                </span>
                                            </div>
                                        )}

                                        {/* Performed by */}
                                        {activity.performed_by && (
                                            <div className="flex items-center gap-1.5 mt-2 text-xs text-gray-500">
                                                <User className="w-3 h-3" />
                                                <span>{activity.performed_by.split('@')[0]}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Date */}
                                    <div className="text-xs text-gray-500 whitespace-nowrap">
                                        {format(new Date(activity.created_date), 'MMM d, yyyy')}
                                        <div className="text-gray-400">
                                            {format(new Date(activity.created_date), 'h:mm a')}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}