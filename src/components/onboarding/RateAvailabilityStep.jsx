import React from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { HelpCircle, DollarSign, Calendar } from "lucide-react";

export default function RateAvailabilityStep({ formData, updateFormData }) {
    const availabilityOptions = [
        { value: "Immediate", description: "Available to start right away" },
        { value: "Within 1 week", description: "Can start in the next 7 days" },
        { value: "Within 2 weeks", description: "Available in 2 weeks" },
        { value: "Within 1 month", description: "Available within a month" },
        { value: "Not available", description: "Currently not taking new projects" }
    ];

    return (
        <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-2">
                    <DollarSign className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                        <p className="text-sm font-medium text-blue-900 mb-1">Rate & Availability</p>
                        <p className="text-sm text-blue-800">
                            Set your rates and let clients know when you can start working.
                        </p>
                    </div>
                </div>
            </div>

            <div>
                <div className="flex items-center gap-2 mb-2">
                    <Label htmlFor="rate">Your Rate</Label>
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger>
                                <HelpCircle className="w-4 h-4 text-gray-400" />
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                                <p>Specify your pricing structure clearly</p>
                                <p className="mt-2 text-xs">Common formats:</p>
                                <ul className="text-xs mt-1 space-y-1">
                                    <li>• Per word: $0.10/word</li>
                                    <li>• Per hour: $50/hour</li>
                                    <li>• Per page: $30/page</li>
                                    <li>• Per project: $500/project</li>
                                </ul>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
                <Input
                    id="rate"
                    value={formData.rate}
                    onChange={(e) => updateFormData({ rate: e.target.value })}
                    placeholder="e.g., $0.12/word or $60/hour"
                />
                <p className="text-xs text-gray-500 mt-1">
                    Be specific: per word, per hour, per page, or per project
                </p>
            </div>

            <div>
                <div className="flex items-center gap-2 mb-2">
                    <Label htmlFor="availability">Availability</Label>
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger>
                                <HelpCircle className="w-4 h-4 text-gray-400" />
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>When can you start taking new projects?</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
                <Select
                    value={formData.availability}
                    onValueChange={(value) => updateFormData({ availability: value })}
                >
                    <SelectTrigger>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {availabilityOptions.map(option => (
                            <SelectItem key={option.value} value={option.value}>
                                <div>
                                    <div className="font-medium">{option.value}</div>
                                    <div className="text-xs text-gray-500">{option.description}</div>
                                </div>
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                    <Calendar className="w-5 h-5 text-green-600 mt-0.5" />
                    <div className="text-sm text-green-800">
                        <p className="font-medium mb-1">💡 Tip</p>
                        <p>
                            Freelancers with immediate availability typically receive 2-3x more project inquiries. 
                            You can always update this later in your profile.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}