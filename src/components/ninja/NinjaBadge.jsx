import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const programTypeLabels = {
    bootcamp: 'Bootcamp',
    masterclass: 'Masterclass',
    specialized_training: 'Specialized',
};

export default function NinjaBadge({ freelancer, size = 'sm' }) {
    if (!freelancer?.is_ninja) return null;

    const typeLabel = programTypeLabels[freelancer.ninja_program_type] || 'Ninja';
    
    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Badge 
                        className={`bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0 cursor-default ${
                            size === 'lg' ? 'px-3 py-1 text-sm' : 'px-2 py-0.5 text-xs'
                        }`}
                    >
                        🥷 Ninja
                    </Badge>
                </TooltipTrigger>
                <TooltipContent>
                    <p className="font-medium">Localization Ninja Graduate</p>
                    <p className="text-xs text-gray-400">
                        {typeLabel}
                        {freelancer.ninja_graduation_date && (
                            <> • {new Date(freelancer.ninja_graduation_date).toLocaleDateString()}</>
                        )}
                    </p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}