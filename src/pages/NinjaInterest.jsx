import React, { useState } from 'react';
import { useMutation } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
    GraduationCap, CheckCircle, ArrowLeft, Plus, X,
    Globe, BookOpen, Zap, Target, Users, Award
} from "lucide-react";
import { createPageUrl } from "../utils";
import { toast } from "sonner";

const INTEREST_AREAS = [
    "Translation", "MTPE", "Project Management", "Vendor Management",
    "Localization", "Proofreading", "Subtitling", "Transcreation", "LQA", "Review"
];

const EXPERIENCE_LABELS = {
    student: "Student",
    new_graduate: "New Graduate",
    "0_1_years": "0–1 Years",
    "1_3_years": "1–3 Years",
    "3_plus_years": "3+ Years",
};

const EDUCATION_STATUS_LABELS = {
    "1st_year": "1st Year",
    "2nd_year": "2nd Year",
    "3rd_year": "3rd Year",
    "4th_year": "4th Year",
    masters: "Master's",
    phd: "PhD",
    graduated: "Graduated",
    other: "Other",
};

const CAREER_PATH_LABELS = {
    linguist: "Linguist (Translator / Interpreter)",
    project_management: "Project Management",
    vendor_management: "Vendor Management",
    undecided: "Not sure yet",
};

export default function NinjaInterestPage() {
    const [submitted, setSubmitted] = useState(false);
    const [form, setForm] = useState({
        full_name: '',
        email: '',
        phone: '',
        location: '',
        university: '',
        department: '',
        education_status: '',
        graduation_date: '',
        career_path: '',
        experience_level: '',
        interests: [],
        language_pairs: [],
        how_heard: '',
        notes: '',
    });
    const [honeypot, setHoneypot] = useState('');
    const [formLoadedAt] = useState(Date.now());
    const [langPair, setLangPair] = useState({ source_language: '', target_language: '' });

    const submitMutation = useMutation({
        mutationFn: (data) => base44.entities.NinjaInterest.create(data),
        onSuccess: () => {
            setSubmitted(true);
            toast.success('Your interest has been registered!');
        },
    });

    const addLangPair = () => {
        if (langPair.source_language && langPair.target_language) {
            setForm({ ...form, language_pairs: [...form.language_pairs, { ...langPair }] });
            setLangPair({ source_language: '', target_language: '' });
        }
    };

    const removeLangPair = (idx) => {
        setForm({ ...form, language_pairs: form.language_pairs.filter((_, i) => i !== idx) });
    };

    const toggleInterest = (area) => {
        setForm(prev => ({
            ...prev,
            interests: prev.interests.includes(area)
                ? prev.interests.filter(a => a !== area)
                : [...prev.interests, area]
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        // Honeypot check
        if (honeypot) {
            toast.success('Your interest has been registered!');
            setSubmitted(true);
            return;
        }

        // Time-based check - form filled in less than 3 seconds = bot
        if (Date.now() - formLoadedAt < 3000) {
            toast.success('Your interest has been registered!');
            setSubmitted(true);
            return;
        }

        if (!form.full_name || !form.email) {
            toast.error("Please fill in your name and email");
            return;
        }

        // Basic email format check
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
            toast.error("Please enter a valid email address");
            return;
        }

        submitMutation.mutate(form);
    };

    if (submitted) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-pink-700 flex items-center justify-center p-6">
                <Card className="max-w-lg w-full text-center">
                    <CardContent className="pt-12 pb-12 px-8">
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle className="w-10 h-10 text-green-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-3">Thank You!</h2>
                        <p className="text-gray-600 mb-6 leading-relaxed">
                            We've registered your interest in the Localization Ninja program. 
                            We'll notify you as soon as the next cohort opens for applications.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <Button
                                variant="outline"
                                onClick={() => window.location.href = createPageUrl('Home')}
                            >
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Back to Home
                            </Button>
                            <Button
                                className="bg-purple-600 hover:bg-purple-700"
                                onClick={() => window.location.href = createPageUrl('Apply')}
                            >
                                Apply as Freelancer
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white">
            {/* Nav */}
            <nav className="bg-gradient-to-r from-purple-900 via-purple-800 to-pink-700 text-white">
                <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
                    <a href={createPageUrl('Home')} className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center font-bold">et</div>
                        <span className="text-xl font-bold">el turco</span>
                    </a>
                    <Button
                        variant="ghost"
                        className="text-white hover:bg-white/10"
                        onClick={() => base44.auth.redirectToLogin()}
                    >
                        Staff Login
                    </Button>
                </div>
            </nav>

            {/* Hero */}
            <div className="bg-gradient-to-br from-purple-900 via-purple-800 to-pink-700 text-white py-16 lg:py-24">
                <div className="max-w-4xl mx-auto px-6 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full text-sm mb-6">
                        <span className="text-lg">🥷</span>
                        Coming Soon
                    </div>
                    <h1 className="text-4xl lg:text-5xl font-bold mb-6 leading-tight">
                        Localization Ninja Program
                    </h1>
                    <p className="text-lg lg:text-xl text-purple-100 max-w-2xl mx-auto leading-relaxed">
                        An intensive training program for aspiring linguists and localization professionals. 
                        Register your interest now and be the first to know when applications open.
                    </p>
                </div>
            </div>

            {/* What You'll Learn */}
            <div className="py-16 bg-gray-50">
                <div className="max-w-5xl mx-auto px-6">
                    <h2 className="text-2xl font-bold text-center text-gray-900 mb-10">What to Expect</h2>
                    <div className="grid md:grid-cols-3 gap-6">
                        <Card className="border-0 shadow-sm">
                            <CardContent className="pt-6">
                                <BookOpen className="w-10 h-10 text-purple-600 mb-4" />
                                <h3 className="text-lg font-semibold mb-2">Hands-on Training</h3>
                                <p className="text-gray-600 text-sm">Real-world translation and localization projects guided by industry experts</p>
                            </CardContent>
                        </Card>
                        <Card className="border-0 shadow-sm">
                            <CardContent className="pt-6">
                                <Zap className="w-10 h-10 text-purple-600 mb-4" />
                                <h3 className="text-lg font-semibold mb-2">CAT Tools & AI</h3>
                                <p className="text-gray-600 text-sm">Learn MemoQ, Trados, MTPE workflows, and modern localization technology</p>
                            </CardContent>
                        </Card>
                        <Card className="border-0 shadow-sm">
                            <CardContent className="pt-6">
                                <Award className="w-10 h-10 text-purple-600 mb-4" />
                                <h3 className="text-lg font-semibold mb-2">Career Launch</h3>
                                <p className="text-gray-600 text-sm">Graduates join our professional freelancer network with priority project access</p>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            {/* Interest Form */}
            <div className="py-16">
                <div className="max-w-2xl mx-auto px-6">
                    <div className="text-center mb-10">
                        <h2 className="text-2xl font-bold text-gray-900 mb-3">Register Your Interest</h2>
                        <p className="text-gray-600">Fill out the form below and we'll notify you when the next program opens.</p>
                    </div>

                    <Card>
                        <CardContent className="pt-6">
                            <form onSubmit={handleSubmit} className="space-y-5">
                                {/* Honeypot - hidden from real users */}
                                <div className="hidden" aria-hidden="true">
                                    <input
                                        type="text"
                                        name="company_website"
                                        tabIndex={-1}
                                        autoComplete="off"
                                        value={honeypot}
                                        onChange={(e) => setHoneypot(e.target.value)}
                                    />
                                </div>
                                {/* Name & Email */}
                                <div className="grid sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium text-gray-700">Full Name *</label>
                                        <Input
                                            value={form.full_name}
                                            onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                                            placeholder="Your full name"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-700">Email *</label>
                                        <Input
                                            type="email"
                                            value={form.email}
                                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                                            placeholder="your@email.com"
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Phone & Location */}
                                <div className="grid sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium text-gray-700">Phone</label>
                                        <Input
                                            value={form.phone}
                                            onChange={(e) => setForm({ ...form, phone: e.target.value })}
                                            placeholder="+90 555 ..."
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-700">Location</label>
                                        <Input
                                            value={form.location}
                                            onChange={(e) => setForm({ ...form, location: e.target.value })}
                                            placeholder="City, Country"
                                        />
                                    </div>
                                </div>

                                {/* University & Department */}
                                <div className="grid sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium text-gray-700">University</label>
                                        <Input
                                            value={form.university}
                                            onChange={(e) => setForm({ ...form, university: e.target.value })}
                                            placeholder="e.g. Boğaziçi University"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-700">Department</label>
                                        <Input
                                            value={form.department}
                                            onChange={(e) => setForm({ ...form, department: e.target.value })}
                                            placeholder="e.g. Translation & Interpreting"
                                        />
                                    </div>
                                </div>

                                {/* Education Status & Graduation */}
                                <div className="grid sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium text-gray-700">Education Status</label>
                                        <Select value={form.education_status} onValueChange={(v) => setForm({ ...form, education_status: v })}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select status" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {Object.entries(EDUCATION_STATUS_LABELS).map(([key, label]) => (
                                                    <SelectItem key={key} value={key}>{label}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-700">Graduation Date (or Expected)</label>
                                        <Input
                                            value={form.graduation_date}
                                            onChange={(e) => setForm({ ...form, graduation_date: e.target.value })}
                                            placeholder="e.g. June 2026"
                                        />
                                    </div>
                                </div>

                                {/* Career Path */}
                                <div>
                                    <label className="text-sm font-medium text-gray-700">Which career path interests you most?</label>
                                    <Select value={form.career_path} onValueChange={(v) => setForm({ ...form, career_path: v })}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a career path" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {Object.entries(CAREER_PATH_LABELS).map(([key, label]) => (
                                                <SelectItem key={key} value={key}>{label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Experience Level */}
                                <div>
                                    <label className="text-sm font-medium text-gray-700">Experience in Localization</label>
                                    <Select value={form.experience_level} onValueChange={(v) => setForm({ ...form, experience_level: v })}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select your experience level" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {Object.entries(EXPERIENCE_LABELS).map(([key, label]) => (
                                                <SelectItem key={key} value={key}>{label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Language Pairs */}
                                <div>
                                    <label className="text-sm font-medium text-gray-700">Language Pairs</label>
                                    <div className="flex gap-2 mt-1">
                                        <Input
                                            value={langPair.source_language}
                                            onChange={(e) => setLangPair({ ...langPair, source_language: e.target.value })}
                                            placeholder="Source (e.g. English)"
                                            className="flex-1"
                                        />
                                        <span className="flex items-center text-gray-400">→</span>
                                        <Input
                                            value={langPair.target_language}
                                            onChange={(e) => setLangPair({ ...langPair, target_language: e.target.value })}
                                            placeholder="Target (e.g. Turkish)"
                                            className="flex-1"
                                        />
                                        <Button type="button" variant="outline" size="icon" onClick={addLangPair}>
                                            <Plus className="w-4 h-4" />
                                        </Button>
                                    </div>
                                    {form.language_pairs.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {form.language_pairs.map((pair, idx) => (
                                                <Badge key={idx} variant="secondary" className="cursor-pointer" onClick={() => removeLangPair(idx)}>
                                                    {pair.source_language} → {pair.target_language}
                                                    <X className="w-3 h-3 ml-1" />
                                                </Badge>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Interest Areas */}
                                <div>
                                    <label className="text-sm font-medium text-gray-700 mb-2 block">Areas of Interest</label>
                                    <div className="flex flex-wrap gap-2">
                                        {INTEREST_AREAS.map(area => (
                                            <Badge
                                                key={area}
                                                variant={form.interests.includes(area) ? "default" : "outline"}
                                                className={`cursor-pointer transition-colors ${
                                                    form.interests.includes(area) 
                                                        ? 'bg-purple-600 hover:bg-purple-700' 
                                                        : 'hover:bg-purple-50'
                                                }`}
                                                onClick={() => toggleInterest(area)}
                                            >
                                                {area}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>

                                {/* How heard */}
                                <div>
                                    <label className="text-sm font-medium text-gray-700">How did you hear about us?</label>
                                    <Input
                                        value={form.how_heard}
                                        onChange={(e) => setForm({ ...form, how_heard: e.target.value })}
                                        placeholder="LinkedIn, referral, university..."
                                    />
                                </div>

                                {/* Additional Notes */}
                                <div>
                                    <label className="text-sm font-medium text-gray-700">Anything else you'd like to share?</label>
                                    <Textarea
                                        value={form.notes}
                                        onChange={(e) => setForm({ ...form, notes: e.target.value })}
                                        placeholder="Your motivation, questions, or expectations..."
                                        rows={3}
                                    />
                                </div>

                                <Button
                                    type="submit"
                                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-3"
                                    disabled={submitMutation.isPending}
                                >
                                    {submitMutation.isPending ? 'Submitting...' : 'Register My Interest'}
                                </Button>

                                <p className="text-xs text-gray-500 text-center">
                                    By submitting, you agree to be contacted about the Localization Ninja program.
                                </p>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-900 text-gray-400 py-8">
                <div className="max-w-7xl mx-auto px-6 text-center text-sm">
                    © {new Date().getFullYear()} el turco. All rights reserved.
                </div>
            </div>
        </div>
    );
}