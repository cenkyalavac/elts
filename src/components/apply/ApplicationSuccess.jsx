import React from 'react';
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { CheckCircle, ArrowRight, Mail, Clock } from "lucide-react";
import { createPageUrl } from "../../utils";

export default function ApplicationSuccess({ applicantName }) {
    return (
        <div className="text-center py-16 px-6">
            <div className="max-w-lg mx-auto">
                <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="w-10 h-10 text-green-400" />
                </div>
                
                <h1 className="text-3xl font-bold text-white mb-3">
                    Application Submitted!
                </h1>
                <p className="text-lg text-gray-400 mb-8">
                    Thank you{applicantName ? `, ${applicantName}` : ''}! Your application has been received successfully.
                </p>

                <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-8 text-left space-y-4">
                    <h3 className="font-semibold text-white text-center mb-4">What happens next?</h3>
                    <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Mail className="w-4 h-4 text-purple-400" />
                        </div>
                        <div>
                            <p className="text-white font-medium">CV Review</p>
                            <p className="text-gray-500 text-sm">Our team will review your CV and qualifications</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Clock className="w-4 h-4 text-purple-400" />
                        </div>
                        <div>
                            <p className="text-white font-medium">We'll Be in Touch</p>
                            <p className="text-gray-500 text-sm">Expect to hear from us within 3-5 business days</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <ArrowRight className="w-4 h-4 text-purple-400" />
                        </div>
                        <div>
                            <p className="text-white font-medium">Onboarding</p>
                            <p className="text-gray-500 text-sm">If selected, you'll be invited to complete your profile and take a skills test</p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button
                        size="lg"
                        className="bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-white px-8"
                        onClick={() => window.location.href = createPageUrl('Home')}
                    >
                        Back to Home
                    </Button>
                    <Button
                        size="lg"
                        variant="outline"
                        className="border-white/20 text-gray-300 hover:bg-white/5 hover:text-white bg-transparent"
                        onClick={() => base44.auth.redirectToLogin(createPageUrl('MyApplication'))}
                    >
                        Track Your Application
                    </Button>
                </div>
            </div>
        </div>
    );
}