import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bell, Save } from "lucide-react";
import { toast } from "sonner";

export default function NotificationSettings() {
    const [settings, setSettings] = useState({
        notify_new_application: true,
        notify_stage_change: true,
        notify_follow_up: true,
        notify_quiz_completed: true,
        notify_message_received: true,
        digest_frequency: 'daily',
        admin_emails: 'admin@example.com',
    });

    const handleSave = () => {
        toast.success('Notification settings saved successfully');
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Bell className="w-5 h-5" />
                    Notification Preferences
                </CardTitle>
                <CardDescription>
                    Configure when and how you receive notifications
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-4">
                    <div className="flex items-center justify-between py-2">
                        <div>
                            <Label>New Application Received</Label>
                            <p className="text-sm text-gray-500">Get notified when someone applies</p>
                        </div>
                        <Switch
                            checked={settings.notify_new_application}
                            onCheckedChange={(checked) => setSettings({
                                ...settings,
                                notify_new_application: checked
                            })}
                        />
                    </div>

                    <div className="flex items-center justify-between py-2 border-t">
                        <div>
                            <Label>Stage Changes</Label>
                            <p className="text-sm text-gray-500">When a freelancer moves stages</p>
                        </div>
                        <Switch
                            checked={settings.notify_stage_change}
                            onCheckedChange={(checked) => setSettings({
                                ...settings,
                                notify_stage_change: checked
                            })}
                        />
                    </div>

                    <div className="flex items-center justify-between py-2 border-t">
                        <div>
                            <Label>Follow-up Reminders</Label>
                            <p className="text-sm text-gray-500">Daily reminder for scheduled follow-ups</p>
                        </div>
                        <Switch
                            checked={settings.notify_follow_up}
                            onCheckedChange={(checked) => setSettings({
                                ...settings,
                                notify_follow_up: checked
                            })}
                        />
                    </div>

                    <div className="flex items-center justify-between py-2 border-t">
                        <div>
                            <Label>Quiz Completed</Label>
                            <p className="text-sm text-gray-500">When an applicant completes a quiz</p>
                        </div>
                        <Switch
                            checked={settings.notify_quiz_completed}
                            onCheckedChange={(checked) => setSettings({
                                ...settings,
                                notify_quiz_completed: checked
                            })}
                        />
                    </div>

                    <div className="flex items-center justify-between py-2 border-t">
                        <div>
                            <Label>New Messages</Label>
                            <p className="text-sm text-gray-500">Internal messaging notifications</p>
                        </div>
                        <Switch
                            checked={settings.notify_message_received}
                            onCheckedChange={(checked) => setSettings({
                                ...settings,
                                notify_message_received: checked
                            })}
                        />
                    </div>

                    <div className="pt-4 border-t">
                        <Label htmlFor="admin-emails">Admin Notification Emails</Label>
                        <Input
                            id="admin-emails"
                            placeholder="admin@example.com, manager@example.com"
                            value={settings.admin_emails}
                            onChange={(e) => setSettings({
                                ...settings,
                                admin_emails: e.target.value
                            })}
                            className="mt-2"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Comma-separated list of emails to receive admin notifications
                        </p>
                    </div>
                </div>

                <Button onClick={handleSave} className="w-full">
                    <Save className="w-4 h-4 mr-2" />
                    Save Notification Settings
                </Button>
            </CardContent>
        </Card>
    );
}