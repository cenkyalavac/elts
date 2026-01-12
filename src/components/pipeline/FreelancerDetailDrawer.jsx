import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import EmailThread from "../gmail/EmailThread";
import { 
    X, Mail, Phone, MapPin, Globe, Calendar, 
    FileText, Save, Bell, MessageSquare, Activity
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../../utils";

const stages = [
    'New Application',
    'Form Sent',
    'Price Negotiation',
    'Test Sent',
    'Approved',
    'On Hold',
    'Rejected',
    'Red Flag'
];

export default function FreelancerDetailDrawer({ freelancer, onClose, onUpdate }) {
    const [activeTab, setActiveTab] = useState('details');
    const [editMode, setEditMode] = useState(false);
    const [formData, setFormData] = useState({
        status: freelancer.status || 'New Application',
        notes: freelancer.notes || '',
        assigned_to: freelancer.assigned_to || '',
        follow_up_date: freelancer.follow_up_date || '',
        follow_up_note: freelancer.follow_up_note || ''
    });

    const queryClient = useQueryClient();

    const { data: currentUser } = useQuery({
        queryKey: ['currentUser'],
        queryFn: () => base44.auth.me(),
    });

    const isAdmin = currentUser?.role === 'admin';
    const canEdit = isAdmin;

    const { data: activities = [] } = useQuery({
        queryKey: ['activities', freelancer.id],
        queryFn: () => base44.entities.FreelancerActivity.filter({ 
            freelancer_id: freelancer.id 
        }).then(data => data.sort((a, b) => 
            new Date(b.created_date) - new Date(a.created_date)
        )),
    });

    const createActivityMutation = useMutation({
        mutationFn: (data) => base44.entities.FreelancerActivity.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['activities', freelancer.id] });
        },
    });

    const handleSave = async () => {
        const updates = {};
        let activityDescription = '';

        if (formData.status !== freelancer.status) {
            updates.status = formData.status;
            updates.stage_changed_date = new Date().toISOString();
            activityDescription += `Stage changed to ${formData.status}. `;
            
            await createActivityMutation.mutateAsync({
                freelancer_id: freelancer.id,
                activity_type: 'Stage Changed',
                description: `Stage changed from ${freelancer.status} to ${formData.status}`,
                old_value: freelancer.status,
                new_value: formData.status,
                performed_by: (await base44.auth.me()).email
            });
        }

        if (formData.notes !== freelancer.notes) {
            updates.notes = formData.notes;
            activityDescription += 'Notes updated. ';
            
            await createActivityMutation.mutateAsync({
                freelancer_id: freelancer.id,
                activity_type: 'Note Added',
                description: 'Internal notes updated',
                performed_by: (await base44.auth.me()).email
            });
        }

        if (formData.assigned_to !== freelancer.assigned_to) {
            updates.assigned_to = formData.assigned_to;
        }

        if (formData.follow_up_date !== freelancer.follow_up_date) {
            updates.follow_up_date = formData.follow_up_date;
            updates.follow_up_note = formData.follow_up_note;
            
            await createActivityMutation.mutateAsync({
                freelancer_id: freelancer.id,
                activity_type: 'Follow-up Scheduled',
                description: `Follow-up scheduled for ${formData.follow_up_date}: ${formData.follow_up_note}`,
                performed_by: (await base44.auth.me()).email
            });
        }

        onUpdate(updates);
        setEditMode(false);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-end">
            <div className="bg-white w-full max-w-2xl h-full overflow-y-auto shadow-2xl">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b z-10 p-6">
                    <div className="flex justify-between items-start">
                        <div>
                            <h2 className="text-2xl font-bold">{freelancer.full_name}</h2>
                            <div className="flex items-center gap-2 mt-2">
                                <Badge className={
                                    freelancer.status === 'Approved' ? 'bg-green-100 text-green-800' :
                                    freelancer.status === 'Red Flag' ? 'bg-red-100 text-red-800' :
                                    freelancer.status === 'Price Negotiation' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-blue-100 text-blue-800'
                                }>
                                    {freelancer.status}
                                </Badge>
                            </div>
                        </div>
                        <Button variant="ghost" size="icon" onClick={onClose}>
                            <X className="w-5 h-5" />
                        </Button>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-2 mt-4">
                        <Button
                            variant={activeTab === 'details' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setActiveTab('details')}
                        >
                            Details
                        </Button>
                        <Button
                            variant={activeTab === 'activity' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setActiveTab('activity')}
                        >
                            <Activity className="w-4 h-4 mr-2" />
                            Activity ({activities.length})
                        </Button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {activeTab === 'details' ? (
                        <>
                            {/* Contact Info */}
                            <div className="space-y-3">
                                <h3 className="font-semibold">Contact Information</h3>
                                <div className="space-y-2">
                                    {freelancer.email && (
                                        <div className="flex items-center gap-2 text-sm">
                                            <Mail className="w-4 h-4 text-gray-400" />
                                            <a href={`mailto:${freelancer.email}`} className="text-blue-600 hover:underline">
                                                {freelancer.email}
                                            </a>
                                        </div>
                                    )}
                                    {freelancer.phone && (
                                        <div className="flex items-center gap-2 text-sm">
                                            <Phone className="w-4 h-4 text-gray-400" />
                                            <span>{freelancer.phone}</span>
                                        </div>
                                    )}
                                    {freelancer.location && (
                                        <div className="flex items-center gap-2 text-sm">
                                            <MapPin className="w-4 h-4 text-gray-400" />
                                            <span>{freelancer.location}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Language Pairs & Rates */}
                            {freelancer.language_pairs && freelancer.language_pairs.length > 0 && (
                                <div className="space-y-3">
                                    <h3 className="font-semibold flex items-center gap-2">
                                        <Globe className="w-4 h-4" />
                                        Language Pairs & Rates
                                    </h3>
                                    <div className="space-y-3">
                                        {freelancer.language_pairs.map((pair, idx) => (
                                            <div key={idx} className="border rounded-lg p-3 bg-gray-50">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Badge variant="outline" className="font-medium">
                                                        {pair.source_language} → {pair.target_language}
                                                    </Badge>
                                                    <Badge variant="secondary" className="text-xs">
                                                        {pair.proficiency}
                                                    </Badge>
                                                </div>
                                                {pair.rates && pair.rates.length > 0 && (
                                                    <div className="space-y-1 pl-3 border-l-2 border-blue-200">
                                                        {pair.rates.map((rate, rateIdx) => (
                                                            <div key={rateIdx} className="text-sm">
                                                                <span className="font-semibold text-green-600">
                                                                    ${rate.rate_value} {rate.currency}
                                                                </span>
                                                                <span className="text-gray-600 ml-1">
                                                                    {rate.rate_type.replace('_', ' ')}
                                                                </span>
                                                                {rate.specialization && (
                                                                    <Badge variant="outline" className="ml-2 text-xs">
                                                                        {rate.specialization}
                                                                    </Badge>
                                                                )}
                                                                {rate.tool && (
                                                                    <Badge variant="outline" className="ml-1 text-xs">
                                                                        {rate.tool}
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Services */}
                            {freelancer.service_types && freelancer.service_types.length > 0 && (
                                <div className="space-y-3">
                                    <h3 className="font-semibold">Services</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {freelancer.service_types.map((service, idx) => (
                                            <Badge key={idx} className="bg-indigo-100 text-indigo-800">
                                                {service}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Services */}
                            {freelancer.service_types && freelancer.service_types.length > 0 && (
                                <div className="space-y-3">
                                    <h3 className="font-semibold">Services</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {freelancer.service_types.map((service, idx) => (
                                            <Badge key={idx} className="bg-indigo-100 text-indigo-800">
                                                {service}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Experience */}
                            {freelancer.experience_years && (
                                <div>
                                    <h3 className="font-semibold text-sm mb-1">Experience</h3>
                                    <p className="text-lg font-medium">{freelancer.experience_years} years</p>
                                </div>
                            )}

                            {/* CV Link */}
                            {freelancer.cv_file_url && (
                                <div>
                                    <a href={freelancer.cv_file_url} target="_blank" rel="noopener noreferrer">
                                        <Button variant="outline" className="w-full">
                                            <FileText className="w-4 h-4 mr-2" />
                                            View CV
                                        </Button>
                                    </a>
                                </div>
                            )}

                            {/* Management Section */}
                            <div className="border-t pt-6 space-y-4">
                                <div className="flex justify-between items-center">
                                    <h3 className="font-semibold">Management</h3>
                                    {!editMode && canEdit && (
                                        <Button size="sm" onClick={() => setEditMode(true)}>
                                            Edit
                                        </Button>
                                    )}
                                </div>

                                {editMode && canEdit ? (
                                    <div className="space-y-4">
                                        <div>
                                            <Label>Stage</Label>
                                            <Select
                                                value={formData.status}
                                                onValueChange={(value) => setFormData({ ...formData, status: value })}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {stages.map(stage => (
                                                        <SelectItem key={stage} value={stage}>
                                                            {stage}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div>
                                            <Label>Assigned To</Label>
                                            <Input
                                                value={formData.assigned_to}
                                                onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
                                                placeholder="Email address"
                                            />
                                        </div>

                                        <div>
                                            <Label>Internal Notes</Label>
                                            <Textarea
                                                value={formData.notes}
                                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                                placeholder="Notes about this application..."
                                                className="h-24"
                                            />
                                        </div>

                                        <div>
                                            <Label className="flex items-center gap-2">
                                                <Bell className="w-4 h-4" />
                                                Follow-up Reminder
                                            </Label>
                                            <Input
                                                type="date"
                                                value={formData.follow_up_date}
                                                onChange={(e) => setFormData({ ...formData, follow_up_date: e.target.value })}
                                                className="mt-2"
                                            />
                                            <Textarea
                                                value={formData.follow_up_note}
                                                onChange={(e) => setFormData({ ...formData, follow_up_note: e.target.value })}
                                                placeholder="Follow-up note..."
                                                className="h-20 mt-2"
                                            />
                                        </div>

                                        <div className="flex gap-2">
                                            <Button onClick={handleSave} className="flex-1">
                                                <Save className="w-4 h-4 mr-2" />
                                                Save
                                            </Button>
                                            <Button variant="outline" onClick={() => setEditMode(false)}>
                                                Cancel
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {freelancer.assigned_to && (
                                            <div>
                                                <span className="text-sm text-gray-600">Assigned: </span>
                                                <span className="font-medium">{freelancer.assigned_to}</span>
                                            </div>
                                        )}
                                        {freelancer.notes && (
                                            <div className="bg-gray-50 p-3 rounded-lg">
                                                <p className="text-sm text-gray-700 whitespace-pre-wrap">{freelancer.notes}</p>
                                            </div>
                                        )}
                                        {freelancer.follow_up_date && (
                                            <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Bell className="w-4 h-4 text-yellow-600" />
                                                    <span className="font-medium text-sm">
                                                        Follow-up: {new Date(freelancer.follow_up_date).toLocaleDateString()}
                                                    </span>
                                                </div>
                                                {freelancer.follow_up_note && (
                                                    <p className="text-sm text-gray-700">{freelancer.follow_up_note}</p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Email Conversations */}
                            {currentUser?.gmailRefreshToken && (
                                <div className="border-t pt-6">
                                    <EmailThread freelancerEmail={freelancer.email} />
                                </div>
                            )}

                            <div className="border-t pt-4">
                                <Link to={createPageUrl(`FreelancerDetail?id=${freelancer.id}`)}>
                                    <Button variant="outline" className="w-full">
                                        View Full Profile
                                    </Button>
                                </Link>
                            </div>
                        </>
                    ) : (
                        /* Activity Tab */
                        <div className="space-y-4">
                            {activities.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    <Activity className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                                    <p>No activity yet</p>
                                </div>
                            ) : (
                                activities.map(activity => (
                                    <div key={activity.id} className="border-l-2 border-blue-500 pl-4 pb-4">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <div className="font-medium text-sm">{activity.activity_type}</div>
                                                <div className="text-sm text-gray-600 mt-1">{activity.description}</div>
                                                {activity.performed_by && (
                                                    <div className="text-xs text-gray-500 mt-1">
                                                        {activity.performed_by.split('@')[0]}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                {new Date(activity.created_date).toLocaleDateString()}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}