import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Save } from "lucide-react";
import { toast } from "sonner";

export default function ApplicationSettings() {
    const [settings, setSettings] = useState({
        require_cv: true,
        require_portfolio: false,
        require_nda: true,
        require_certifications: false,
        collect_rates: true,
        collect_availability: true,
        custom_questions_enabled: false,
        custom_questions: '',
        welcome_message: 'Thank you for your interest in joining our team!',
    });

    const handleSave = () => {
        toast.success('Application settings saved successfully');
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Application Form
                </CardTitle>
                <CardDescription>
                    Configure what information to collect from applicants
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-4">
                    <div className="flex items-center justify-between py-2">
                        <div>
                            <Label>Require CV Upload</Label>
                            <p className="text-sm text-gray-500">Make CV upload mandatory</p>
                        </div>
                        <Switch
                            checked={settings.require_cv}
                            onCheckedChange={(checked) => setSettings({
                                ...settings,
                                require_cv: checked
                            })}
                        />
                    </div>

                    <div className="flex items-center justify-between py-2 border-t">
                        <div>
                            <Label>Require Portfolio</Label>
                            <p className="text-sm text-gray-500">Request portfolio or work samples</p>
                        </div>
                        <Switch
                            checked={settings.require_portfolio}
                            onCheckedChange={(checked) => setSettings({
                                ...settings,
                                require_portfolio: checked
                            })}
                        />
                    </div>

                    <div className="flex items-center justify-between py-2 border-t">
                        <div>
                            <Label>Require NDA Signature</Label>
                            <p className="text-sm text-gray-500">Request signed NDA document</p>
                        </div>
                        <Switch
                            checked={settings.require_nda}
                            onCheckedChange={(checked) => setSettings({
                                ...settings,
                                require_nda: checked
                            })}
                        />
                    </div>

                    <div className="flex items-center justify-between py-2 border-t">
                        <div>
                            <Label>Request Certifications</Label>
                            <p className="text-sm text-gray-500">Ask for certification documents</p>
                        </div>
                        <Switch
                            checked={settings.require_certifications}
                            onCheckedChange={(checked) => setSettings({
                                ...settings,
                                require_certifications: checked
                            })}
                        />
                    </div>

                    <div className="flex items-center justify-between py-2 border-t">
                        <div>
                            <Label>Collect Rate Information</Label>
                            <p className="text-sm text-gray-500">Ask for hourly/per-word rates</p>
                        </div>
                        <Switch
                            checked={settings.collect_rates}
                            onCheckedChange={(checked) => setSettings({
                                ...settings,
                                collect_rates: checked
                            })}
                        />
                    </div>

                    <div className="flex items-center justify-between py-2 border-t">
                        <div>
                            <Label>Collect Availability</Label>
                            <p className="text-sm text-gray-500">Ask when they can start</p>
                        </div>
                        <Switch
                            checked={settings.collect_availability}
                            onCheckedChange={(checked) => setSettings({
                                ...settings,
                                collect_availability: checked
                            })}
                        />
                    </div>

                    <div className="pt-4 border-t">
                        <Label htmlFor="welcome-message">Welcome Message</Label>
                        <Textarea
                            id="welcome-message"
                            placeholder="Enter a welcome message for applicants..."
                            value={settings.welcome_message}
                            onChange={(e) => setSettings({
                                ...settings,
                                welcome_message: e.target.value
                            })}
                            className="mt-2 h-24"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Shown at the top of the application form
                        </p>
                    </div>
                </div>

                <Button onClick={handleSave} className="w-full">
                    <Save className="w-4 h-4 mr-2" />
                    Save Application Settings
                </Button>
            </CardContent>
        </Card>
    );
}