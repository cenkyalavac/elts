import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { X, Lightbulb, ChevronLeft, ChevronRight } from "lucide-react";

const STORAGE_KEY = 'dismissed_tooltips';

export function useTooltipDismissal(tooltipId) {
    const [isDismissed, setIsDismissed] = useState(true);

    useEffect(() => {
        try {
            const dismissed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
            setIsDismissed(dismissed.includes(tooltipId));
        } catch {
            setIsDismissed(false);
        }
    }, [tooltipId]);

    const dismiss = () => {
        try {
            const dismissed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
            if (!dismissed.includes(tooltipId)) {
                dismissed.push(tooltipId);
                localStorage.setItem(STORAGE_KEY, JSON.stringify(dismissed));
            }
        } catch {}
        setIsDismissed(true);
    };

    const reset = () => {
        try {
            const dismissed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
            localStorage.setItem(STORAGE_KEY, JSON.stringify(dismissed.filter(id => id !== tooltipId)));
        } catch {}
        setIsDismissed(false);
    };

    return { isDismissed, dismiss, reset };
}

export default function FeatureTooltip({ 
    id, 
    title, 
    description, 
    position = 'bottom',
    children,
    forceShow = false 
}) {
    const { isDismissed, dismiss } = useTooltipDismissal(id);
    const [show, setShow] = useState(false);

    useEffect(() => {
        if (forceShow || !isDismissed) {
            const timer = setTimeout(() => setShow(true), 500);
            return () => clearTimeout(timer);
        }
    }, [forceShow, isDismissed]);

    if (!show) return children;

    const positionClasses = {
        top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
        bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
        left: 'right-full top-1/2 -translate-y-1/2 mr-2',
        right: 'left-full top-1/2 -translate-y-1/2 ml-2',
    };

    const arrowClasses = {
        top: 'top-full left-1/2 -translate-x-1/2 border-t-purple-600 border-x-transparent border-b-transparent',
        bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-purple-600 border-x-transparent border-t-transparent',
        left: 'left-full top-1/2 -translate-y-1/2 border-l-purple-600 border-y-transparent border-r-transparent',
        right: 'right-full top-1/2 -translate-y-1/2 border-r-purple-600 border-y-transparent border-l-transparent',
    };

    return (
        <div className="relative inline-block">
            {children}
            <div className={`absolute z-50 ${positionClasses[position]}`}>
                <div className="bg-purple-600 text-white rounded-lg shadow-lg p-3 max-w-xs animate-in fade-in slide-in-from-bottom-2">
                    <div className="flex items-start gap-2">
                        <Lightbulb className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                            <div className="font-medium text-sm">{title}</div>
                            <div className="text-xs text-purple-100 mt-1">{description}</div>
                        </div>
                        <button 
                            onClick={(e) => { e.stopPropagation(); dismiss(); setShow(false); }}
                            className="text-purple-200 hover:text-white"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>
                <div className={`absolute w-0 h-0 border-8 ${arrowClasses[position]}`} />
            </div>
        </div>
    );
}

export function FeatureTour({ steps, onComplete }) {
    const [currentStep, setCurrentStep] = useState(0);
    const [isActive, setIsActive] = useState(true);

    if (!isActive || steps.length === 0) return null;

    const step = steps[currentStep];
    const isLast = currentStep === steps.length - 1;
    const isFirst = currentStep === 0;

    const handleNext = () => {
        if (isLast) {
            setIsActive(false);
            onComplete?.();
        } else {
            setCurrentStep(prev => prev + 1);
        }
    };

    const handlePrev = () => {
        if (!isFirst) {
            setCurrentStep(prev => prev - 1);
        }
    };

    const handleSkip = () => {
        setIsActive(false);
        onComplete?.();
    };

    return (
        <>
            {/* Overlay */}
            <div className="fixed inset-0 bg-black/50 z-40" onClick={handleSkip} />
            
            {/* Tour Card */}
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4">
                <div className="bg-white rounded-xl shadow-2xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                            {step.icon && <step.icon className="w-5 h-5 text-purple-600" />}
                        </div>
                        <div>
                            <div className="text-xs text-purple-600 font-medium">
                                Step {currentStep + 1} of {steps.length}
                            </div>
                            <div className="font-semibold text-gray-900">{step.title}</div>
                        </div>
                    </div>
                    
                    <p className="text-gray-600 text-sm mb-6">{step.description}</p>
                    
                    <div className="flex items-center justify-between">
                        <Button variant="ghost" size="sm" onClick={handleSkip}>
                            Skip Tour
                        </Button>
                        <div className="flex gap-2">
                            {!isFirst && (
                                <Button variant="outline" size="sm" onClick={handlePrev}>
                                    <ChevronLeft className="w-4 h-4 mr-1" />
                                    Back
                                </Button>
                            )}
                            <Button size="sm" onClick={handleNext} className="bg-purple-600 hover:bg-purple-700">
                                {isLast ? 'Finish' : 'Next'}
                                {!isLast && <ChevronRight className="w-4 h-4 ml-1" />}
                            </Button>
                        </div>
                    </div>
                    
                    {/* Progress dots */}
                    <div className="flex justify-center gap-1.5 mt-4">
                        {steps.map((_, idx) => (
                            <div 
                                key={idx}
                                className={`w-2 h-2 rounded-full transition-colors ${
                                    idx === currentStep ? 'bg-purple-600' : 
                                    idx < currentStep ? 'bg-purple-300' : 'bg-gray-200'
                                }`}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </>
    );
}