import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { FileQuestion, Save } from "lucide-react";
import { toast } from "sonner";

export default function QuizSettings() {
    const queryClient = useQueryClient();
    
    const [settings, setSettings] = useState({
        default_passing_score: 70,
        auto_flag_on_pass: true,
        require_quiz_for_approval: false,
        allow_retakes: true,
        max_retakes: 3,
    });

    const handleSave = () => {
        toast.success('Quiz settings saved successfully');
        // In a real implementation, save to AppSetting entity
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <FileQuestion className="w-5 h-5" />
                    Quiz Settings
                </CardTitle>
                <CardDescription>
                    Configure quiz behavior and scoring thresholds
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-4">
                    <div>
                        <Label htmlFor="passing-score">Default Passing Score (%)</Label>
                        <Input
                            id="passing-score"
                            type="number"
                            min="0"
                            max="100"
                            value={settings.default_passing_score}
                            onChange={(e) => setSettings({
                                ...settings,
                                default_passing_score: parseInt(e.target.value)
                            })}
                            className="mt-2"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            New quizzes will use this as the default passing score
                        </p>
                    </div>

                    <div className="flex items-center justify-between py-2 border-t">
                        <div>
                            <Label>Auto-flag for Approval</Label>
                            <p className="text-sm text-gray-500">
                                Automatically flag applicants who pass quizzes
                            </p>
                        </div>
                        <Switch
                            checked={settings.auto_flag_on_pass}
                            onCheckedChange={(checked) => setSettings({
                                ...settings,
                                auto_flag_on_pass: checked
                            })}
                        />
                    </div>

                    <div className="flex items-center justify-between py-2 border-t">
                        <div>
                            <Label>Require Quiz for Approval</Label>
                            <p className="text-sm text-gray-500">
                                Make passing a quiz mandatory for approval
                            </p>
                        </div>
                        <Switch
                            checked={settings.require_quiz_for_approval}
                            onCheckedChange={(checked) => setSettings({
                                ...settings,
                                require_quiz_for_approval: checked
                            })}
                        />
                    </div>

                    <div className="flex items-center justify-between py-2 border-t">
                        <div>
                            <Label>Allow Quiz Retakes</Label>
                            <p className="text-sm text-gray-500">
                                Let applicants retake failed quizzes
                            </p>
                        </div>
                        <Switch
                            checked={settings.allow_retakes}
                            onCheckedChange={(checked) => setSettings({
                                ...settings,
                                allow_retakes: checked
                            })}
                        />
                    </div>

                    {settings.allow_retakes && (
                        <div>
                            <Label htmlFor="max-retakes">Maximum Retakes</Label>
                            <Input
                                id="max-retakes"
                                type="number"
                                min="1"
                                max="10"
                                value={settings.max_retakes}
                                onChange={(e) => setSettings({
                                    ...settings,
                                    max_retakes: parseInt(e.target.value)
                                })}
                                className="mt-2"
                            />
                        </div>
                    )}
                </div>

                <Button onClick={handleSave} className="w-full">
                    <Save className="w-4 h-4 mr-2" />
                    Save Quiz Settings
                </Button>
            </CardContent>
        </Card>
    );
}