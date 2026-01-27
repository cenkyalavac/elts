import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Mail, MailCheck, Star, Paperclip, UserPlus } from 'lucide-react';

export default function InboxStatsCards({ stats, activeFilter, onFilterChange }) {
    const cards = [
        {
            key: 'all',
            label: 'All Emails',
            value: stats.total,
            icon: Mail,
            color: 'purple',
            ring: 'ring-purple-500',
        },
        {
            key: 'unread',
            label: 'Unread',
            value: stats.unread,
            icon: MailCheck,
            color: 'indigo',
            ring: 'ring-indigo-500',
        },
        {
            key: 'starred',
            label: 'Starred',
            value: stats.starred,
            icon: Star,
            color: 'yellow',
            ring: 'ring-yellow-500',
        },
        {
            key: 'attachments',
            label: 'With Files',
            value: stats.withAttachments,
            icon: Paperclip,
            color: 'blue',
            ring: 'ring-blue-500',
        },
        {
            key: 'applications',
            label: 'Applications',
            value: stats.applications,
            icon: UserPlus,
            color: 'green',
            ring: 'ring-green-500',
        },
    ];

    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
            {cards.map((card) => {
                const Icon = card.icon;
                return (
                    <Card 
                        key={card.key}
                        className={`border-0 shadow-sm cursor-pointer transition-all hover:shadow-md ${
                            activeFilter === card.key ? `ring-2 ${card.ring}` : ''
                        }`}
                        onClick={() => onFilterChange(card.key)}
                    >
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500">{card.label}</p>
                                    <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                                </div>
                                <div className={`p-2 bg-${card.color}-100 rounded-lg`}>
                                    <Icon className={`w-5 h-5 text-${card.color}-600`} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}