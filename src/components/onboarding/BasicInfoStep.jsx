import React from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { HelpCircle } from "lucide-react";

export default function BasicInfoStep({ formData, updateFormData }) {
    return (
        <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-800">
                    Let's start with the basics. This information will help clients identify and contact you.
                </p>
            </div>

            <div>
                <div className="flex items-center gap-2 mb-2">
                    <Label htmlFor="full_name">Full Name *</Label>
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger>
                                <HelpCircle className="w-4 h-4 text-gray-400" />
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Enter your full professional name as you'd like it to appear to clients</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
                <Input
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e) => updateFormData({ full_name: e.target.value })}
                    placeholder="e.g., Maria Garcia"
                    required
                />
            </div>

            <div>
                <div className="flex items-center gap-2 mb-2">
                    <Label htmlFor="email">Email Address *</Label>
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger>
                                <HelpCircle className="w-4 h-4 text-gray-400" />
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Your primary email for receiving job notifications and communications</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
                <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => updateFormData({ email: e.target.value })}
                    placeholder="e.g., maria.garcia@example.com"
                    required
                />
            </div>

            <div>
                <div className="flex items-center gap-2 mb-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger>
                                <HelpCircle className="w-4 h-4 text-gray-400" />
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Include country code for international contacts (e.g., +1 555-123-4567)</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
                <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => updateFormData({ phone: e.target.value })}
                    placeholder="e.g., +1 (555) 123-4567"
                />
            </div>

            <div>
                <div className="flex items-center gap-2 mb-2">
                    <Label htmlFor="location">Location</Label>
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger>
                                <HelpCircle className="w-4 h-4 text-gray-400" />
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Your city and country (e.g., Barcelona, Spain)</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
                <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => updateFormData({ location: e.target.value })}
                    placeholder="e.g., Barcelona, Spain"
                />
            </div>
        </div>
    );
}