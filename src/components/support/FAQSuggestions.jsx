import React, { useState, useEffect } from 'react';
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lightbulb, ChevronDown, ChevronUp, ExternalLink, Loader2 } from "lucide-react";

const STATIC_FAQS = [
    {
        category: 'application_status',
        question: 'How long does the application review process take?',
        answer: 'Our team typically reviews applications within 5-7 business days. You will receive an email notification once your application has been reviewed.'
    },
    {
        category: 'application_status',
        question: 'What are the requirements to become a freelancer?',
        answer: 'We require native-level proficiency in your target language, at least 2 years of professional translation experience, and proficiency with CAT tools like MemoQ or Trados.'
    },
    {
        category: 'payment_inquiry',
        question: 'When and how will I get paid?',
        answer: 'Payments are processed monthly via bank transfer or PayPal. You need to submit an invoice through Smartcat by the end of each month for work completed.'
    },
    {
        category: 'payment_inquiry',
        question: 'What are the payment rates?',
        answer: 'Rates vary based on language pair, specialization, and service type. Your specific rates are agreed upon during the onboarding process and listed in your profile.'
    },
    {
        category: 'technical_issue',
        question: 'I cannot access my account',
        answer: 'Please try clearing your browser cache and cookies. If the issue persists, use the password reset feature or contact support with your registered email address.'
    },
    {
        category: 'general_question',
        question: 'How do I update my availability?',
        answer: 'Go to "My Availability" in the navigation menu to update your calendar. You can also connect your Google Calendar for automatic sync.'
    },
    {
        category: 'general_question',
        question: 'How do I add new language pairs or services?',
        answer: 'Visit "My Application" page and click on the edit button to update your profile with additional language pairs, services, or specializations.'
    },
];

export default function FAQSuggestions({ subject, message, category, onSelectFAQ }) {
    const [suggestions, setSuggestions] = useState([]);
    const [expanded, setExpanded] = useState(null);
    const [loading, setLoading] = useState(false);
    const [aiSuggestions, setAiSuggestions] = useState([]);

    useEffect(() => {
        // Filter static FAQs based on category and keywords
        const text = `${subject} ${message}`.toLowerCase();
        
        let relevantFaqs = STATIC_FAQS.filter(faq => {
            const matchesCategory = faq.category === category;
            const matchesKeywords = faq.question.toLowerCase().split(' ').some(word => 
                word.length > 3 && text.includes(word)
            );
            return matchesCategory || matchesKeywords;
        });

        // Remove duplicates and limit
        const seen = new Set();
        relevantFaqs = relevantFaqs.filter(faq => {
            if (seen.has(faq.question)) return false;
            seen.add(faq.question);
            return true;
        }).slice(0, 3);

        setSuggestions(relevantFaqs);
    }, [subject, message, category]);

    useEffect(() => {
        // Fetch AI suggestions when there's enough content
        const fetchAISuggestions = async () => {
            if (subject.length < 10 && message.length < 20) {
                setAiSuggestions([]);
                return;
            }

            setLoading(true);
            try {
                const response = await base44.integrations.Core.InvokeLLM({
                    prompt: `Based on this support inquiry, suggest 2-3 relevant help topics or solutions that might resolve the issue without needing to submit a ticket.

Subject: ${subject}
Message: ${message}
Category: ${category}

Respond with a JSON object containing an array of suggestions, each with:
- question: A relevant FAQ question
- answer: A helpful answer (2-3 sentences max)
- confidence: How confident you are this helps (high, medium, low)

Only suggest things that could actually resolve common issues. Focus on self-service solutions.`,
                    response_json_schema: {
                        type: 'object',
                        properties: {
                            suggestions: {
                                type: 'array',
                                items: {
                                    type: 'object',
                                    properties: {
                                        question: { type: 'string' },
                                        answer: { type: 'string' },
                                        confidence: { type: 'string' }
                                    }
                                }
                            }
                        }
                    }
                });

                if (response?.suggestions) {
                    setAiSuggestions(response.suggestions.filter(s => s.confidence !== 'low'));
                }
            } catch (error) {
                console.error('Failed to get AI suggestions:', error);
            } finally {
                setLoading(false);
            }
        };

        const debounce = setTimeout(fetchAISuggestions, 1000);
        return () => clearTimeout(debounce);
    }, [subject, message, category]);

    const allSuggestions = [...suggestions, ...aiSuggestions.map(s => ({ ...s, isAI: true }))];

    if (allSuggestions.length === 0 && !loading) return null;

    return (
        <Card className="bg-amber-50 border-amber-200">
            <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-3">
                    <Lightbulb className="w-4 h-4 text-amber-600" />
                    <span className="text-sm font-medium text-amber-800">
                        These might help you
                    </span>
                    {loading && <Loader2 className="w-3 h-3 animate-spin text-amber-600" />}
                </div>

                <div className="space-y-2">
                    {allSuggestions.map((faq, idx) => (
                        <div key={idx} className="bg-white rounded-lg border border-amber-100">
                            <button
                                className="w-full text-left px-3 py-2 flex items-center justify-between"
                                onClick={() => setExpanded(expanded === idx ? null : idx)}
                            >
                                <span className="text-sm font-medium text-gray-800 flex items-center gap-2">
                                    {faq.question}
                                    {faq.isAI && (
                                        <span className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">AI</span>
                                    )}
                                </span>
                                {expanded === idx ? (
                                    <ChevronUp className="w-4 h-4 text-gray-400" />
                                ) : (
                                    <ChevronDown className="w-4 h-4 text-gray-400" />
                                )}
                            </button>
                            {expanded === idx && (
                                <div className="px-3 pb-3 text-sm text-gray-600 border-t border-amber-100 pt-2">
                                    {faq.answer}
                                    {onSelectFAQ && (
                                        <Button
                                            variant="link"
                                            size="sm"
                                            className="mt-2 h-auto p-0 text-amber-700"
                                            onClick={() => onSelectFAQ(faq)}
                                        >
                                            This solved my issue
                                        </Button>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}