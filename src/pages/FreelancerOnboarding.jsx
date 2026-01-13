import React, { useState } from 'react';
import { useMutation } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, ChevronRight, ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "../utils";
import BasicInfoStep from "../components/onboarding/BasicInfoStep";
import LanguagesStep from "../components/onboarding/LanguagesStep";
import ServicesStep from "../components/onboarding/ServicesStep";
import ExperienceStep from "../components/onboarding/ExperienceStep";
import SkillsStep from "../components/onboarding/SkillsStep";
import RateAvailabilityStep from "../components/onboarding/RateAvailabilityStep";
import CVUploadStep from "../components/onboarding/CVUploadStep";

export default function FreelancerOnboarding() {
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(0);
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        phone: '',
        location: '',
        languages: [],
        service_types: [],
        specializations: [],
        experience_years: '',
        education: '',
        certifications: [],
        skills: [],
        rate: '',
        availability: 'Immediate',
        cv_file_url: '',
        status: 'New'
    });

    const steps = [
        { title: 'Basic Info', component: BasicInfoStep },
        { title: 'Languages', component: LanguagesStep },
        { title: 'Services', component: ServicesStep },
        { title: 'Experience', component: ExperienceStep },
        { title: 'Skills', component: SkillsStep },
        { title: 'Rate & Availability', component: RateAvailabilityStep },
        { title: 'Upload CV', component: CVUploadStep }
    ];

    const createFreelancerMutation = useMutation({
        mutationFn: async (data) => {
            const freelancer = await base44.entities.Freelancer.create(data);
            // Trigger welcome email
            await base44.functions.invoke('onboarding', { 
                action: 'sendWelcomeEmail', 
                freelancerId: freelancer.id 
            });
            return freelancer;
        },
        onSuccess: () => {
            // If user is authenticated as applicant, go to MyApplication
            // Otherwise go to home/login
             navigate(createPageUrl('MyApplication'));
        },
    });

    const updateFormData = (data) => {
        setFormData(prev => ({ ...prev, ...data }));
    };

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            createFreelancerMutation.mutate(formData);
        }
    };

    const handleBack = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    const CurrentStepComponent = steps[currentStep].component;
    const progress = ((currentStep + 1) / steps.length) * 100;

    const isStepValid = () => {
        switch (currentStep) {
            case 0:
                return formData.full_name && formData.email;
            case 1:
                return formData.languages.length > 0;
            case 2:
                return formData.service_types.length > 0;
            default:
                return true;
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        Welcome to Our Freelancer Network!
                    </h1>
                    <p className="text-gray-600">
                        Let's set up your profile in just a few steps
                    </p>
                </div>

                {/* Progress Bar */}
                <div className="mb-8">
                    <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">
                            Step {currentStep + 1} of {steps.length}: {steps[currentStep].title}
                        </span>
                        <span className="text-sm text-gray-500">
                            {Math.round(progress)}% complete
                        </span>
                    </div>
                    <Progress value={progress} className="h-2" />
                </div>

                {/* Step Indicators */}
                <div className="flex justify-between mb-8">
                    {steps.map((step, index) => (
                        <div key={index} className="flex flex-col items-center flex-1">
                            <div
                                className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-all ${
                                    index < currentStep
                                        ? 'bg-green-500 text-white'
                                        : index === currentStep
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-200 text-gray-400'
                                }`}
                            >
                                {index < currentStep ? (
                                    <CheckCircle className="w-6 h-6" />
                                ) : (
                                    <span className="text-sm font-semibold">{index + 1}</span>
                                )}
                            </div>
                            <span className={`text-xs text-center hidden md:block ${
                                index <= currentStep ? 'text-gray-900 font-medium' : 'text-gray-400'
                            }`}>
                                {step.title}
                            </span>
                        </div>
                    ))}
                </div>

                {/* Main Content */}
                <Card>
                    <CardHeader>
                        <CardTitle>{steps[currentStep].title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <CurrentStepComponent
                            formData={formData}
                            updateFormData={updateFormData}
                        />

                        {/* Navigation Buttons */}
                        <div className="flex justify-between mt-8 pt-6 border-t">
                            <Button
                                variant="outline"
                                onClick={handleBack}
                                disabled={currentStep === 0}
                            >
                                <ChevronLeft className="w-4 h-4 mr-2" />
                                Back
                            </Button>
                            <Button
                                onClick={handleNext}
                                disabled={!isStepValid() || createFreelancerMutation.isPending}
                                className="bg-blue-600 hover:bg-blue-700"
                            >
                                {currentStep === steps.length - 1 ? (
                                    createFreelancerMutation.isPending ? 'Submitting...' : 'Complete Profile'
                                ) : (
                                    <>
                                        Next
                                        <ChevronRight className="w-4 h-4 ml-2" />
                                    </>
                                )}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}