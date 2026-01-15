import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Search, X } from "lucide-react";

const CONTENT_TYPES = [
    "Marketing", "Legal", "Medical", "Technical", "Financial", 
    "UI/UX", "Support", "Creative", "E-commerce", "Gaming", 
    "Documentation", "Website", "App", "Help Center", "Knowledge Base", 
    "Training", "General"
];

const JOB_TYPES = [
    "Translation", "Review", "MTPE", "Proofreading", "Transcreation", 
    "Localization", "LQA", "QA Check", "Editing", "Copywriting"
];

const REPORT_STATUSES = [
    { value: "draft", label: "Draft" },
    { value: "submitted", label: "Submitted" },
    { value: "pending_translator_review", label: "Pending Review" },
    { value: "translator_accepted", label: "Accepted" },
    { value: "translator_disputed", label: "Disputed" },
    { value: "pending_final_review", label: "Final Review" },
    { value: "finalized", label: "Finalized" }
];

export default function QualityFilters({ 
    filters, 
    setFilters, 
    freelancers, 
    clientAccounts, 
    languages,
    showFreelancerFilter = true 
}) {
    const hasFilters = Object.values(filters).some(v => v);

    const clearFilters = () => {
        setFilters({
            freelancer_id: "",
            content_type: "",
            job_type: "",
            client_account: "",
            source_language: "",
            target_language: "",
            status: "",
            report_type: "",
            search: ""
        });
    };

    return (
        <Card className="mb-6">
            <CardContent className="pt-6">
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {/* Search */}
                    <div className="col-span-2 md:col-span-1">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <Input
                                placeholder="Search..."
                                value={filters.search}
                                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                                className="pl-10"
                            />
                        </div>
                    </div>

                    {/* Freelancer */}
                    {showFreelancerFilter && (
                        <Select
                            value={filters.freelancer_id}
                            onValueChange={(v) => setFilters(prev => ({ ...prev, freelancer_id: v === 'all' ? '' : v }))}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Freelancer" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Freelancers</SelectItem>
                                {freelancers
                                    .filter(f => f.status === 'Approved')
                                    .map(f => (
                                        <SelectItem key={f.id} value={f.id}>
                                            {f.full_name}
                                        </SelectItem>
                                    ))
                                }
                            </SelectContent>
                        </Select>
                    )}

                    {/* Report Type */}
                    <Select
                        value={filters.report_type}
                        onValueChange={(v) => setFilters(prev => ({ ...prev, report_type: v === 'all' ? '' : v }))}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Report Type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Types</SelectItem>
                            <SelectItem value="LQA">LQA</SelectItem>
                            <SelectItem value="QS">QS</SelectItem>
                            <SelectItem value="Random_QA">Random QA</SelectItem>
                        </SelectContent>
                    </Select>

                    {/* Content Type */}
                    <Select
                        value={filters.content_type}
                        onValueChange={(v) => setFilters(prev => ({ ...prev, content_type: v === 'all' ? '' : v }))}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Content Type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Content</SelectItem>
                            {CONTENT_TYPES.map(type => (
                                <SelectItem key={type} value={type}>{type}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {/* Job Type */}
                    <Select
                        value={filters.job_type}
                        onValueChange={(v) => setFilters(prev => ({ ...prev, job_type: v === 'all' ? '' : v }))}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Job Type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Jobs</SelectItem>
                            {JOB_TYPES.map(type => (
                                <SelectItem key={type} value={type}>{type}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {/* Client Account */}
                    <Select
                        value={filters.client_account}
                        onValueChange={(v) => setFilters(prev => ({ ...prev, client_account: v === 'all' ? '' : v }))}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Client" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Clients</SelectItem>
                            {clientAccounts.map(account => (
                                <SelectItem key={account} value={account}>{account}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {/* Source Language */}
                    <Select
                        value={filters.source_language}
                        onValueChange={(v) => setFilters(prev => ({ ...prev, source_language: v === 'all' ? '' : v }))}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Source" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Sources</SelectItem>
                            {languages.source.map(lang => (
                                <SelectItem key={lang} value={lang}>{lang}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {/* Target Language */}
                    <Select
                        value={filters.target_language}
                        onValueChange={(v) => setFilters(prev => ({ ...prev, target_language: v === 'all' ? '' : v }))}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Target" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Targets</SelectItem>
                            {languages.target.map(lang => (
                                <SelectItem key={lang} value={lang}>{lang}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {/* Status */}
                    <Select
                        value={filters.status}
                        onValueChange={(v) => setFilters(prev => ({ ...prev, status: v === 'all' ? '' : v }))}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            {REPORT_STATUSES.map(status => (
                                <SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {/* Clear Filters */}
                    {hasFilters && (
                        <Button variant="ghost" size="sm" onClick={clearFilters} className="h-10">
                            <X className="w-4 h-4 mr-1" />
                            Clear
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}