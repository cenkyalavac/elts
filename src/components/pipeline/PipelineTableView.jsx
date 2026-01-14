import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
    ChevronDown, Mail, Globe, FileText, Calendar,
    User, ExternalLink
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link } from "react-router-dom";
import { createPageUrl } from "../../utils";

export default function PipelineTableView({ 
    freelancers, 
    stages, 
    onStageChange, 
    onFreelancerClick,
    getDaysInStage 
}) {
    const [sortConfig, setSortConfig] = useState({ key: 'updated_date', direction: 'desc' });

    const sortedFreelancers = [...freelancers].sort((a, b) => {
        if (sortConfig.key === 'updated_date') {
            return sortConfig.direction === 'desc' 
                ? new Date(b.updated_date) - new Date(a.updated_date)
                : new Date(a.updated_date) - new Date(b.updated_date);
        }
        if (sortConfig.key === 'full_name') {
            return sortConfig.direction === 'desc'
                ? b.full_name?.localeCompare(a.full_name || '')
                : a.full_name?.localeCompare(b.full_name || '');
        }
        return 0;
    });

    const getStageColor = (status) => {
        const stage = stages.find(s => s.id === status);
        return stage?.color || 'bg-gray-50';
    };

    const getStageLabel = (status) => {
        const stage = stages.find(s => s.id === status);
        return stage?.label || status;
    };

    return (
        <Card>
            <CardContent className="p-0">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Name
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Stage
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Languages
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Specialization
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Rate
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Assigned To
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Days in Stage
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    CV
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {sortedFreelancers.map(freelancer => {
                                const daysInStage = getDaysInStage(freelancer);
                                
                                return (
                                    <tr 
                                        key={freelancer.id} 
                                        className="hover:bg-gray-50 cursor-pointer transition-colors"
                                        onClick={() => onFreelancerClick(freelancer)}
                                    >
                                        <td className="px-4 py-3">
                                            <div>
                                                <div className="font-medium text-gray-900">
                                                    {freelancer.full_name}
                                                </div>
                                                <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                                                    <Mail className="w-3 h-3" />
                                                    {freelancer.email}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button 
                                                        variant="outline" 
                                                        size="sm"
                                                        className="w-full justify-between"
                                                    >
                                                        <span className="truncate">
                                                            {getStageLabel(freelancer.status)}
                                                        </span>
                                                        <ChevronDown className="w-4 h-4 ml-2" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="start" className="w-56">
                                                    {stages.map(stage => (
                                                        <DropdownMenuItem
                                                            key={stage.id}
                                                            onClick={() => onStageChange(
                                                                freelancer.id, 
                                                                stage.id,
                                                                freelancer.status
                                                            )}
                                                            className={
                                                                freelancer.status === stage.id 
                                                                    ? 'bg-blue-50 font-medium' 
                                                                    : ''
                                                            }
                                                        >
                                                            <div className={`w-3 h-3 rounded-full mr-2 ${stage.color}`} />
                                                            {stage.label}
                                                        </DropdownMenuItem>
                                                    ))}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </td>
                                        <td className="px-4 py-3">
                                            {freelancer.language_pairs && freelancer.language_pairs.length > 0 ? (
                                                <div className="flex flex-wrap gap-1">
                                                    {freelancer.language_pairs.slice(0, 2).map((pair, idx) => (
                                                        <Badge key={idx} variant="outline" className="text-xs">
                                                            {pair.source_language} → {pair.target_language}
                                                        </Badge>
                                                    ))}
                                                    {freelancer.language_pairs.length > 2 && (
                                                        <Badge variant="outline" className="text-xs">
                                                            +{freelancer.language_pairs.length - 2}
                                                        </Badge>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="text-gray-400 text-sm">-</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            {freelancer.specializations && freelancer.specializations.length > 0 ? (
                                                <div className="text-sm text-gray-700">
                                                    {freelancer.specializations.slice(0, 2).join(', ')}
                                                    {freelancer.specializations.length > 2 && 
                                                        ` +${freelancer.specializations.length - 2}`
                                                    }
                                                </div>
                                            ) : (
                                                <span className="text-gray-400 text-sm">-</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            {freelancer.language_pairs?.[0]?.rates?.[0] ? (
                                                <div className="text-sm">
                                                    <span className="font-medium text-green-600">
                                                        ${freelancer.language_pairs[0].rates[0].rate_value}
                                                    </span>
                                                    <span className="text-gray-500 ml-1">
                                                        /{freelancer.language_pairs[0].rates[0].rate_type.replace('per_', '')}
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="text-gray-400 text-sm">-</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            {freelancer.assigned_to ? (
                                                <div className="flex items-center gap-1 text-sm text-gray-700">
                                                    <User className="w-3 h-3 text-gray-400" />
                                                    {freelancer.assigned_to.split('@')[0]}
                                                </div>
                                            ) : (
                                                <span className="text-gray-400 text-sm">-</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            {daysInStage !== null ? (
                                                <div className={`flex items-center gap-1 text-sm ${
                                                    daysInStage > 14 ? 'text-red-600 font-medium' : 'text-gray-600'
                                                }`}>
                                                    <Calendar className="w-3 h-3" />
                                                    {daysInStage} days
                                                </div>
                                            ) : (
                                                <span className="text-gray-400 text-sm">-</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                                            {freelancer.cv_file_url ? (
                                                <a 
                                                    href={freelancer.cv_file_url} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="text-blue-600 hover:text-blue-700"
                                                >
                                                    <FileText className="w-4 h-4" />
                                                </a>
                                            ) : (
                                                <span className="text-gray-400 text-sm">-</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                                            <Link to={createPageUrl(`FreelancerDetail?id=${encodeURIComponent(freelancer.id)}`)}>
                                                <Button variant="ghost" size="sm">
                                                    <ExternalLink className="w-4 h-4" />
                                                </Button>
                                            </Link>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    
                    {sortedFreelancers.length === 0 && (
                        <div className="text-center py-12 text-gray-500">
                            <Globe className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                            <p>No applications found</p>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}