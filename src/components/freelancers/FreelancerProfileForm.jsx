import React from 'react';
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Plus, Trash2, Save, XCircle, Loader2 } from "lucide-react";

const LanguagePairSchema = z.object({
    source_language: z.string().min(1, "Source language required"),
    target_language: z.string().min(1, "Target language required"),
    proficiency: z.enum(["Native", "Fluent", "Professional", "Intermediate"]),
});

const RateSchema = z.object({
    source_language: z.string().optional(),
    target_language: z.string().optional(),
    specialization: z.string().optional(),
    tool: z.string().optional(),
    rate_type: z.enum(["per_word", "per_hour", "per_page"]),
    rate_value: z.coerce.number().positive("Rate must be positive"),
    currency: z.string().min(1).default("USD"),
});

const FreelancerProfileSchema = z.object({
    full_name: z.string().min(1, "Full name required"),
    email: z.string().email(),
    phone: z.string().optional(),
    location: z.string().optional(),
    website: z.string().url().optional().or(z.literal("")),
    native_language: z.string().optional(),
    language_pairs: z.array(LanguagePairSchema).optional(),
    specializations: z.array(z.string()).optional(),
    service_types: z.array(z.string()).optional(),
    experience_years: z.coerce.number().min(0).optional(),
    education: z.string().optional(),
    skills: z.array(z.string()).optional(),
    software: z.array(z.string()).optional(),
    rates: z.array(RateSchema).optional(),
    currency: z.enum(["USD", "EUR", "GBP", "TRY"]).default("USD"),
    availability: z.enum(["Immediate", "Within 1 week", "Within 2 weeks", "Within 1 month", "Not available"]).default("Immediate"),
    notes: z.string().optional(),
    special_instructions: z.string().optional(),
    tags: z.array(z.string()).optional(),
    minimum_fee: z.coerce.number().min(0).optional(),
    minimum_project_fee: z.coerce.number().min(0).optional(),
    gender: z.enum(["M", "F", "Other"]).optional(),
    company_name: z.string().optional(),
});

export default function FreelancerProfileForm({ freelancer, onSaveSuccess }) {
    const queryClient = useQueryClient();

    const { register, control, handleSubmit, reset, watch, formState: { errors, isDirty, isSubmitting } } = useForm({
        resolver: zodResolver(FreelancerProfileSchema),
        defaultValues: {
            full_name: freelancer?.full_name || '',
            email: freelancer?.email || '',
            phone: freelancer?.phone || '',
            location: freelancer?.location || '',
            website: freelancer?.website || '',
            native_language: freelancer?.native_language || '',
            language_pairs: freelancer?.language_pairs || [],
            specializations: freelancer?.specializations || [],
            service_types: freelancer?.service_types || [],
            experience_years: freelancer?.experience_years || 0,
            education: freelancer?.education || '',
            skills: freelancer?.skills || [],
            software: freelancer?.software || [],
            rates: freelancer?.rates || [],
            currency: freelancer?.currency || 'USD',
            availability: freelancer?.availability || 'Immediate',
            notes: freelancer?.notes || '',
            special_instructions: freelancer?.special_instructions || '',
            tags: freelancer?.tags || [],
            minimum_fee: freelancer?.minimum_fee || 0,
            minimum_project_fee: freelancer?.minimum_project_fee || 0,
            gender: freelancer?.gender || undefined,
            company_name: freelancer?.company_name || '',
        }
    });

    const { fields: languagePairFields, append: appendLanguagePair, remove: removeLanguagePair } = useFieldArray({
        control,
        name: "language_pairs",
    });

    const { fields: rateFields, append: appendRate, remove: removeRate } = useFieldArray({
        control,
        name: "rates",
    });

    const updateFreelancerMutation = useMutation({
        mutationFn: (data) => base44.entities.Freelancer.update(freelancer.id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['myApplication'] });
            toast.success("Profile updated successfully!");
            onSaveSuccess?.();
        },
        onError: (error) => {
            toast.error(`Failed to update profile: ${error.message}`);
        },
    });

    const onSubmit = (data) => {
        updateFreelancerMutation.mutate(data);
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Personal Information</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="full_name">Full Name</Label>
                        <Input id="full_name" {...register("full_name")} />
                        {errors.full_name && <p className="text-red-500 text-sm mt-1">{errors.full_name.message}</p>}
                    </div>
                    <div>
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" type="email" {...register("email")} disabled className="bg-gray-100" />
                    </div>
                    <div>
                        <Label htmlFor="phone">Phone</Label>
                        <Input id="phone" {...register("phone")} />
                    </div>
                    <div>
                        <Label htmlFor="location">Location</Label>
                        <Input id="location" {...register("location")} />
                    </div>
                    <div>
                        <Label htmlFor="website">Website</Label>
                        <Input id="website" {...register("website")} />
                    </div>
                    <div>
                        <Label htmlFor="native_language">Native Language</Label>
                        <Input id="native_language" {...register("native_language")} />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Language Pairs</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {languagePairFields.map((field, index) => (
                        <div key={field.id} className="border p-4 rounded-lg space-y-3">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <Label>Source Language</Label>
                                    <Input {...register(`language_pairs.${index}.source_language`)} />
                                    {errors.language_pairs?.[index]?.source_language && <p className="text-red-500 text-sm mt-1">{errors.language_pairs[index].source_language.message}</p>}
                                </div>
                                <div>
                                    <Label>Target Language</Label>
                                    <Input {...register(`language_pairs.${index}.target_language`)} />
                                    {errors.language_pairs?.[index]?.target_language && <p className="text-red-500 text-sm mt-1">{errors.language_pairs[index].target_language.message}</p>}
                                </div>
                                <div>
                                    <Label>Proficiency</Label>
                                    <Select defaultValue={field.proficiency} onValueChange={(value) => register(`language_pairs.${index}.proficiency`).onChange({ target: { value } })}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Native">Native</SelectItem>
                                            <SelectItem value="Fluent">Fluent</SelectItem>
                                            <SelectItem value="Professional">Professional</SelectItem>
                                            <SelectItem value="Intermediate">Intermediate</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <Button type="button" variant="destructive" size="sm" onClick={() => removeLanguagePair(index)} className="gap-2">
                                <Trash2 className="w-4 h-4" /> Remove
                            </Button>
                        </div>
                    ))}
                    <Button type="button" variant="outline" onClick={() => appendLanguagePair({ source_language: "", target_language: "", proficiency: "Intermediate" })} className="gap-2">
                        <Plus className="w-4 h-4" /> Add Language Pair
                    </Button>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Rates</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {rateFields.map((field, index) => (
                        <div key={field.id} className="border p-4 rounded-lg space-y-3">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div>
                                    <Label>Rate Type</Label>
                                    <Select defaultValue={field.rate_type} onValueChange={(value) => register(`rates.${index}.rate_type`).onChange({ target: { value } })}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="per_word">Per Word</SelectItem>
                                            <SelectItem value="per_hour">Per Hour</SelectItem>
                                            <SelectItem value="per_page">Per Page</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label>Rate Value</Label>
                                    <Input type="number" {...register(`rates.${index}.rate_value`)} />
                                </div>
                                <div>
                                    <Label>Currency</Label>
                                    <Select defaultValue={field.currency} onValueChange={(value) => register(`rates.${index}.currency`).onChange({ target: { value } })}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="USD">USD</SelectItem>
                                            <SelectItem value="EUR">EUR</SelectItem>
                                            <SelectItem value="GBP">GBP</SelectItem>
                                            <SelectItem value="TRY">TRY</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label>Specialization</Label>
                                    <Input {...register(`rates.${index}.specialization`)} />
                                </div>
                            </div>
                            <Button type="button" variant="destructive" size="sm" onClick={() => removeRate(index)} className="gap-2">
                                <Trash2 className="w-4 h-4" /> Remove
                            </Button>
                        </div>
                    ))}
                    <Button type="button" variant="outline" onClick={() => appendRate({ rate_type: "per_word", rate_value: 0, currency: "USD" })} className="gap-2">
                        <Plus className="w-4 h-4" /> Add Rate
                    </Button>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Professional Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="experience_years">Years of Experience</Label>
                            <Input id="experience_years" type="number" {...register("experience_years")} />
                        </div>
                        <div>
                            <Label htmlFor="availability">Availability</Label>
                            <Select defaultValue={watch("availability")} onValueChange={(value) => register("availability").onChange({ target: { value } })}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Immediate">Immediate</SelectItem>
                                    <SelectItem value="Within 1 week">Within 1 week</SelectItem>
                                    <SelectItem value="Within 2 weeks">Within 2 weeks</SelectItem>
                                    <SelectItem value="Within 1 month">Within 1 month</SelectItem>
                                    <SelectItem value="Not available">Not available</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div>
                        <Label htmlFor="education">Education</Label>
                        <Textarea id="education" {...register("education")} rows={3} />
                    </div>
                    <div>
                        <Label htmlFor="specializations">Specializations (comma-separated)</Label>
                        <Input id="specializations" placeholder="Medical, Legal, IT..." {...register("specializations")} />
                    </div>
                    <div>
                        <Label htmlFor="skills">Skills (comma-separated)</Label>
                        <Input id="skills" placeholder="Project management, Quality assurance..." {...register("skills")} />
                    </div>
                    <div>
                        <Label htmlFor="software">CAT Tools (comma-separated)</Label>
                        <Input id="software" placeholder="Trados, MemoQ, Smartcat..." {...register("software")} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="minimum_fee">Minimum Fee</Label>
                            <Input id="minimum_fee" type="number" {...register("minimum_fee")} />
                        </div>
                        <div>
                            <Label htmlFor="minimum_project_fee">Minimum Project Fee</Label>
                            <Input id="minimum_project_fee" type="number" {...register("minimum_project_fee")} />
                        </div>
                    </div>
                    <div>
                        <Label htmlFor="notes">Additional Notes</Label>
                        <Textarea id="notes" {...register("notes")} rows={3} placeholder="Any additional information..." />
                    </div>
                </CardContent>
            </Card>

            <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => reset()} disabled={!isDirty || isSubmitting}>
                    <XCircle className="w-4 h-4 mr-2" /> Reset
                </Button>
                <Button type="submit" disabled={!isDirty || isSubmitting}>
                    {isSubmitting ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                        <Save className="w-4 h-4 mr-2" />
                    )}
                    Save Changes
                </Button>
            </div>
        </form>
    );
}