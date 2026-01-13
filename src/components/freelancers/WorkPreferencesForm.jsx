import React from 'react';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Save, Loader2 } from "lucide-react";

const WorkPreferencesSchema = z.object({
    availability: z.enum(["Immediate", "Within 1 week", "Within 2 weeks", "Within 1 month", "Not available"]),
    language_preference: z.string().optional(),
    special_instructions: z.string().optional(),
    minimum_fee: z.coerce.number().min(0),
    minimum_project_fee: z.coerce.number().min(0),
});

export default function WorkPreferencesForm({ freelancer }) {
    const queryClient = useQueryClient();

    const { register, handleSubmit, watch, formState: { isSubmitting } } = useForm({
        resolver: zodResolver(WorkPreferencesSchema),
        defaultValues: {
            availability: freelancer?.availability || 'Immediate',
            language_preference: freelancer?.language_preference || '',
            special_instructions: freelancer?.special_instructions || '',
            minimum_fee: freelancer?.minimum_fee || 0,
            minimum_project_fee: freelancer?.minimum_project_fee || 0,
        }
    });

    const updateMutation = useMutation({
        mutationFn: (data) => base44.entities.Freelancer.update(freelancer.id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['myApplication'] });
            toast.success("Work preferences updated!");
        },
    });

    const onSubmit = (data) => {
        updateMutation.mutate(data);
    };

    const preferredServiceTypes = watch("service_types") || [];

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Availability & Timeline</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <Label htmlFor="availability">When are you available?</Label>
                        <Select defaultValue={watch("availability")} onValueChange={(value) => register("availability").onChange({ target: { value } })}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Immediate">Immediately</SelectItem>
                                <SelectItem value="Within 1 week">Within 1 week</SelectItem>
                                <SelectItem value="Within 2 weeks">Within 2 weeks</SelectItem>
                                <SelectItem value="Within 1 month">Within 1 month</SelectItem>
                                <SelectItem value="Not available">Currently not available</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Communication & Work Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <Label htmlFor="language_preference">Preferred Communication Language</Label>
                        <Input 
                            id="language_preference" 
                            {...register("language_preference")}
                            placeholder="e.g., English, Spanish, French"
                        />
                    </div>
                    <div>
                        <Label htmlFor="special_instructions">Special Instructions & Requirements</Label>
                        <Textarea 
                            id="special_instructions"
                            {...register("special_instructions")}
                            rows={4}
                            placeholder="Any special preferences for payment, delivery methods, working hours, etc."
                        />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Pricing & Minimums</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="minimum_fee">Minimum Engagement Fee</Label>
                            <Input 
                                id="minimum_fee" 
                                type="number" 
                                {...register("minimum_fee")}
                                placeholder="0"
                            />
                            <p className="text-xs text-gray-500 mt-1">Minimum charge for any engagement</p>
                        </div>
                        <div>
                            <Label htmlFor="minimum_project_fee">Minimum Project Fee</Label>
                            <Input 
                                id="minimum_project_fee" 
                                type="number" 
                                {...register("minimum_project_fee")}
                                placeholder="0"
                            />
                            <p className="text-xs text-gray-500 mt-1">Minimum charge per project</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                    <Save className="w-4 h-4 mr-2" />
                )}
                Save Preferences
            </Button>
        </form>
    );
}