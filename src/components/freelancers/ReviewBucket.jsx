import React, { useState } from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import { createPageUrl } from "../../utils";
import { Eye, FileText, Search, MapPin, Globe, Calendar } from "lucide-react";
import DuplicateWarning from "./DuplicateWarning";

export default function ReviewBucket({ freelancers }) {
    const [search, setSearch] = useState('');
    const [previewId, setPreviewId] = useState(null);

    const newApps = freelancers
        .filter(f => f.status === 'New Application')
        .sort((a, b) => new Date(b.created_date) - new Date(a.created_date));

    const filtered = newApps.filter(f => {
        if (!search) return true;
        const s = search.toLowerCase();
        return f.full_name?.toLowerCase().includes(s) || f.email?.toLowerCase().includes(s);
    });

    const previewFL = previewId ? freelancers.find(f => f.id === previewId) : null;

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                    Review Inbox <Badge className="ml-2 bg-blue-100 text-blue-800">{newApps.length}</Badge>
                </h3>
                <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                        placeholder="Search new applications..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9"
                    />
                </div>
            </div>

            {filtered.length === 0 ? (
                <div className="text-center py-10 text-gray-500">
                    <FileText className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                    <p>No new applications to review</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
                        {filtered.map(f => (
                            <Card 
                                key={f.id} 
                                className={`cursor-pointer hover:shadow-md transition-shadow ${previewId === f.id ? 'ring-2 ring-blue-500' : ''}`}
                                onClick={() => setPreviewId(f.id)}
                            >
                                <CardContent className="p-4">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <div className="font-semibold text-gray-900">{f.full_name}</div>
                                            <div className="text-sm text-gray-500">{f.email}</div>
                                            <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                                                {f.location && (
                                                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{f.location}</span>
                                                )}
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" />
                                                    {new Date(f.created_date).toLocaleDateString()}
                                                </span>
                                            </div>
                                            {f.language_pairs?.length > 0 && (
                                                <div className="flex flex-wrap gap-1 mt-2">
                                                    {f.language_pairs.slice(0, 3).map((lp, i) => (
                                                        <Badge key={i} variant="outline" className="text-xs">
                                                            {lp.source_language} → {lp.target_language}
                                                        </Badge>
                                                    ))}
                                                    {f.language_pairs.length > 3 && (
                                                        <Badge variant="secondary" className="text-xs">+{f.language_pairs.length - 3}</Badge>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex gap-1">
                                            {f.cv_file_url && (
                                                <a href={f.cv_file_url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                                        <FileText className="w-4 h-4 text-blue-600" />
                                                    </Button>
                                                </a>
                                            )}
                                            <Link to={`${createPageUrl('FreelancerDetail')}?id=${f.id}`} onClick={e => e.stopPropagation()}>
                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                    <Eye className="w-4 h-4" />
                                                </Button>
                                            </Link>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {/* Quick Preview Panel */}
                    {previewFL && (
                        <div className="border rounded-lg p-4 bg-white space-y-4 max-h-[600px] overflow-y-auto">
                            <div className="flex items-center justify-between">
                                <h4 className="font-semibold text-lg">{previewFL.full_name}</h4>
                                <Link to={`${createPageUrl('FreelancerDetail')}?id=${previewFL.id}`}>
                                    <Button size="sm">Full Profile</Button>
                                </Link>
                            </div>

                            <DuplicateWarning email={previewFL.email} fullName={previewFL.full_name} />

                            <div className="grid grid-cols-2 gap-3 text-sm">
                                <div><span className="text-gray-500">Email:</span> {previewFL.email}</div>
                                <div><span className="text-gray-500">Phone:</span> {previewFL.phone || '—'}</div>
                                <div><span className="text-gray-500">Location:</span> {previewFL.location || '—'}</div>
                                <div><span className="text-gray-500">Availability:</span> {previewFL.availability || '—'}</div>
                            </div>

                            {previewFL.language_pairs?.length > 0 && (
                                <div>
                                    <div className="text-sm font-medium text-gray-600 mb-1">Language Pairs</div>
                                    <div className="flex flex-wrap gap-1">
                                        {previewFL.language_pairs.map((lp, i) => (
                                            <Badge key={i} variant="outline">
                                                {lp.source_language} → {lp.target_language} ({lp.proficiency})
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {previewFL.cv_file_url && (
                                <div>
                                    <div className="text-sm font-medium text-gray-600 mb-1">CV Preview</div>
                                    <iframe 
                                        src={previewFL.cv_file_url} 
                                        className="w-full h-72 border rounded" 
                                        title="CV Preview"
                                    />
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}