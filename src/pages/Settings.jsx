import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings as SettingsIcon, Mail, Plus, Pencil, Trash2, Power, PowerOff, Calendar, CheckCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import EmailTemplateForm from "../components/settings/EmailTemplateForm";
import PipelineSettings from "../components/settings/PipelineSettings";
import QuizSettings from "../components/settings/QuizSettings";
import NotificationSettings from "../components/settings/NotificationSettings";
import ApplicationSettings from "../components/settings/ApplicationSettings";
import AdminTools from "../components/settings/AdminTools";
import StatusSettings from "../components/settings/StatusSettings";
import GmailConnect from "../components/gmail/GmailConnect";
import QualityManagementSettings from "../components/settings/QualityManagementSettings";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

export default function SettingsPage() {
    const [showTemplateForm, setShowTemplateForm] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState(null);
    const queryClient = useQueryClient();

    const { data: user, isLoading: userLoading } = useQuery({
        queryKey: ['currentUser'],
        queryFn: () => base44.auth.me(),
    });

    const { data: templates = [], isLoading: templatesLoading } = useQuery({
        queryKey: ['emailTemplates'],
        queryFn: () => base44.entities.EmailTemplate.list('-created_date'),
    });

    const createTemplateMutation = useMutation({
        mutationFn: (data) => base44.entities.EmailTemplate.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['emailTemplates'] });
            setShowTemplateForm(false);
            setEditingTemplate(null);
            toast.success('Template created successfully');
        },
        onError: (error) => {
            toast.error('Failed to create template: ' + error.message);
        }
    });

    const updateTemplateMutation = useMutation({
        mutationFn: ({ id, data }) => base44.entities.EmailTemplate.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['emailTemplates'] });
            setShowTemplateForm(false);
            setEditingTemplate(null);
            toast.success('Template updated successfully');
        },
        onError: (error) => {
            toast.error('Failed to update template: ' + error.message);
        }
    });

    const deleteTemplateMutation = useMutation({
        mutationFn: (id) => base44.entities.EmailTemplate.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['emailTemplates'] });
            toast.success('Template deleted successfully');
        },
        onError: (error) => {
            toast.error('Failed to delete template: ' + error.message);
        }
    });

    const toggleTemplateMutation = useMutation({
        mutationFn: ({ id, is_active }) => 
            base44.entities.EmailTemplate.update(id, { is_active }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['emailTemplates'] });
            toast.success('Template status updated');
        },
    });

    const handleSaveTemplate = (data) => {
        if (editingTemplate) {
            updateTemplateMutation.mutate({ id: editingTemplate.id, data });
        } else {
            createTemplateMutation.mutate(data);
        }
    };

    const handleEdit = (template) => {
        setEditingTemplate(template);
        setShowTemplateForm(true);
    };

    const handleDelete = (id) => {
        if (confirm('Are you sure you want to delete this template?')) {
            deleteTemplateMutation.mutate(id);
        }
    };

    const handleToggleActive = (template) => {
        toggleTemplateMutation.mutate({ 
            id: template.id, 
            is_active: !template.is_active 
        });
    };

    if (userLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    if (user?.role !== 'admin') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
                <div className="max-w-4xl mx-auto text-center mt-20">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
                    <p className="text-gray-600">Only administrators can access settings.</p>
                </div>
            </div>
        );
    }

    const groupedTemplates = {
        status_change: templates.filter(t => t.trigger_type === 'status_change'),
        manual: templates.filter(t => t.trigger_type === 'manual'),
        scheduled: templates.filter(t => t.trigger_type === 'scheduled'),
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
            <div className="max-w-6xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                        <SettingsIcon className="w-8 h-8 text-blue-600" />
                        Settings
                    </h1>
                    <p className="text-gray-600 mt-1">
                        Manage your freelancer platform configuration
                    </p>
                </div>

                <Tabs defaultValue="email" className="space-y-6">
                    <TabsList className="grid w-full md:w-auto md:inline-grid md:grid-cols-4 lg:grid-cols-7 gap-1">
                        <TabsTrigger value="email">Email Templates</TabsTrigger>
                        <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
                        <TabsTrigger value="quiz">Quizzes</TabsTrigger>
                        <TabsTrigger value="quality">Quality</TabsTrigger>
                        <TabsTrigger value="notifications">Notifications</TabsTrigger>
                        <TabsTrigger value="application">Application</TabsTrigger>
                        <TabsTrigger value="admin">Admin Tools</TabsTrigger>
                    </TabsList>

                    <TabsContent value="email">
                        {/* Email Templates Section */}
                        <Card className="mb-6">
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <Mail className="w-5 h-5" />
                                    Email Templates
                                </CardTitle>
                                <CardDescription>
                                    Create and manage email templates with dynamic placeholders
                                </CardDescription>
                            </div>
                            <Button
                                onClick={() => {
                                    setEditingTemplate(null);
                                    setShowTemplateForm(true);
                                }}
                                className="bg-blue-600 hover:bg-blue-700"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                New Template
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {templatesLoading ? (
                            <div className="space-y-3">
                                {Array(3).fill(0).map((_, i) => (
                                    <Skeleton key={i} className="h-20 w-full" />
                                ))}
                            </div>
                        ) : templates.length === 0 ? (
                            <div className="text-center py-12">
                                <Mail className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-600">No email templates yet</p>
                                <p className="text-sm text-gray-500 mt-1">
                                    Create your first template to get started
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {/* Status Change Templates */}
                                {groupedTemplates.status_change.length > 0 && (
                                    <div>
                                        <h3 className="text-sm font-semibold text-gray-700 mb-3">
                                            Automatic - Status Change
                                        </h3>
                                        <div className="space-y-2">
                                            {groupedTemplates.status_change.map(template => (
                                                <div
                                                    key={template.id}
                                                    className="bg-white border rounded-lg p-4 flex items-start justify-between"
                                                >
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <h4 className="font-semibold text-gray-900">
                                                                {template.name}
                                                            </h4>
                                                            {template.trigger_status && (
                                                                <Badge variant="outline">
                                                                    On: {template.trigger_status}
                                                                </Badge>
                                                            )}
                                                            <Badge variant={template.is_active ? "default" : "secondary"}>
                                                                {template.is_active ? 'Active' : 'Inactive'}
                                                            </Badge>
                                                        </div>
                                                        {template.description && (
                                                            <p className="text-sm text-gray-600 mb-2">
                                                                {template.description}
                                                            </p>
                                                        )}
                                                        <p className="text-xs text-gray-500">
                                                            <strong>Subject:</strong> {template.subject}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() => handleToggleActive(template)}
                                                        >
                                                            {template.is_active ? (
                                                                <PowerOff className="w-4 h-4" />
                                                            ) : (
                                                                <Power className="w-4 h-4" />
                                                            )}
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() => handleEdit(template)}
                                                        >
                                                            <Pencil className="w-4 h-4" />
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() => handleDelete(template.id)}
                                                        >
                                                            <Trash2 className="w-4 h-4 text-red-600" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Manual Templates */}
                                {groupedTemplates.manual.length > 0 && (
                                    <div>
                                        <h3 className="text-sm font-semibold text-gray-700 mb-3">
                                            Manual Send
                                        </h3>
                                        <div className="space-y-2">
                                            {groupedTemplates.manual.map(template => (
                                                <div
                                                    key={template.id}
                                                    className="bg-white border rounded-lg p-4 flex items-start justify-between"
                                                >
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <h4 className="font-semibold text-gray-900">
                                                                {template.name}
                                                            </h4>
                                                            <Badge variant={template.is_active ? "default" : "secondary"}>
                                                                {template.is_active ? 'Active' : 'Inactive'}
                                                            </Badge>
                                                        </div>
                                                        {template.description && (
                                                            <p className="text-sm text-gray-600 mb-2">
                                                                {template.description}
                                                            </p>
                                                        )}
                                                        <p className="text-xs text-gray-500">
                                                            <strong>Subject:</strong> {template.subject}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() => handleToggleActive(template)}
                                                        >
                                                            {template.is_active ? (
                                                                <PowerOff className="w-4 h-4" />
                                                            ) : (
                                                                <Power className="w-4 h-4" />
                                                            )}
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() => handleEdit(template)}
                                                        >
                                                            <Pencil className="w-4 h-4" />
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() => handleDelete(template.id)}
                                                        >
                                                            <Trash2 className="w-4 h-4 text-red-600" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
                    </TabsContent>

                    <TabsContent value="pipeline">
                        <div className="space-y-6">
                            <StatusSettings />
                            <PipelineSettings />
                        </div>
                    </TabsContent>

                    <TabsContent value="quiz">
                        <QuizSettings />
                    </TabsContent>

                    <TabsContent value="quality">
                        <QualityManagementSettings />
                    </TabsContent>

                    <TabsContent value="notifications">
                        <NotificationSettings />
                    </TabsContent>

                    <TabsContent value="application">
                        <ApplicationSettings />
                    </TabsContent>

                    <TabsContent value="admin">
                        <div className="space-y-6">
                            <GmailConnect />
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Calendar className="w-5 h-5" />
                                        Google Calendar Integration
                                    </CardTitle>
                                    <CardDescription>
                                        Connect Google Calendar for availability sync
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                                        <CheckCircle className="w-5 h-5 text-green-600" />
                                        <div>
                                            <div className="font-medium">Connected</div>
                                            <div className="text-sm text-gray-600">
                                                Google Calendar is authorized for this app
                                            </div>
                                        </div>
                                    </div>
                                    <p className="text-sm text-gray-500 mt-3">
                                        Freelancers can now sync their availability from Google Calendar in their profile settings.
                                    </p>
                                </CardContent>
                            </Card>
                            <AdminTools />
                        </div>
                    </TabsContent>
                </Tabs>
            </div>

            {/* Template Form Dialog */}
            <Dialog open={showTemplateForm} onOpenChange={setShowTemplateForm}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            {editingTemplate ? 'Edit Email Template' : 'Create Email Template'}
                        </DialogTitle>
                    </DialogHeader>
                    <EmailTemplateForm
                        template={editingTemplate}
                        onSave={handleSaveTemplate}
                        onCancel={() => {
                            setShowTemplateForm(false);
                            setEditingTemplate(null);
                        }}
                    />
                </DialogContent>
            </Dialog>
        </div>
    );
}