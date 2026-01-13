import React, { useState } from 'react';
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Edit2, Save, X, BookOpen, Award, Briefcase } from "lucide-react";

export default function ProfessionalOverview({ freelancer }) {
    const queryClient = useQueryClient();
    const [isEditing, setIsEditing] = useState(false);
    const [bio, setBio] = useState(freelancer?.notes || '');

    const updateMutation = useMutation({
        mutationFn: (data) => base44.entities.Freelancer.update(freelancer.id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['myApplication'] });
            toast.success("Profile updated!");
            setIsEditing(false);
        },
    });

    const handleSave = () => {
        updateMutation.mutate({ notes: bio });
    };

    return (
        <div className="space-y-6">
            {/* Bio/About Section */}
            <Card className="border-0 shadow-sm">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>About Me</CardTitle>
                        {!isEditing && (
                            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)} className="gap-2">
                                <Edit2 className="w-4 h-4" /> Edit
                            </Button>
                        )}
                    </div>
                </CardHeader>
                <CardContent>
                    {isEditing ? (
                        <div className="space-y-4">
                            <Textarea 
                                value={bio} 
                                onChange={(e) => setBio(e.target.value)}
                                rows={5}
                                placeholder="Tell us about yourself, your experience, specialties, and what makes you unique..."
                            />
                            <div className="flex gap-2">
                                <Button onClick={handleSave} disabled={updateMutation.isPending}>
                                    <Save className="w-4 h-4 mr-2" /> Save
                                </Button>
                                <Button variant="outline" onClick={() => setIsEditing(false)}>
                                    <X className="w-4 h-4 mr-2" /> Cancel
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <p className="text-gray-700 leading-relaxed">
                            {bio || <span className="text-gray-400 italic">No bio added yet. Click edit to add your professional summary.</span>}
                        </p>
                    )}
                </CardContent>
            </Card>

            {/* Education */}
            {freelancer?.education && (
                <Card className="border-0 shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BookOpen className="w-5 h-5 text-blue-600" />
                            Education
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-gray-700">{freelancer.education}</p>
                    </CardContent>
                </Card>
            )}

            {/* Certifications */}
            {(freelancer?.certifications?.length > 0 || freelancer?.certification_files?.length > 0) && (
                <Card className="border-0 shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Award className="w-5 h-5 text-yellow-600" />
                            Certifications & Credentials
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {freelancer.certifications?.length > 0 && (
                            <div>
                                <h4 className="font-semibold text-sm text-gray-700 mb-2">Certifications</h4>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                    {freelancer.certifications.map((cert, idx) => (
                                        <Badge key={idx} variant="secondary" className="text-center py-1">
                                            {cert}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        )}
                        {freelancer.certification_files?.length > 0 && (
                            <div className="border-t pt-4">
                                <h4 className="font-semibold text-sm text-gray-700 mb-3">Certificate Documents</h4>
                                <div className="space-y-2">
                                    {freelancer.certification_files.map((fileUrl, idx) => (
                                        <a 
                                            key={idx} 
                                            href={fileUrl} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="block p-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm text-blue-600 truncate transition-colors"
                                        >
                                            📄 Certificate {idx + 1}
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Specializations */}
            {freelancer?.specializations?.length > 0 && (
                <Card className="border-0 shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Briefcase className="w-5 h-5 text-purple-600" />
                            Specializations
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-2">
                            {freelancer.specializations.map((spec, idx) => (
                                <Badge key={idx} className="bg-purple-100 text-purple-800" variant="outline">
                                    {spec}
                                </Badge>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}