import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle, AlertCircle, ChevronRight, ChevronLeft, Check, X } from "lucide-react";
import { toast } from "sonner";
import { createPageUrl } from "../utils";
import { motion, AnimatePresence } from "framer-motion";

// RTL language detection
const rtlLanguages = ['Arabic', 'Hebrew', 'Persian', 'Urdu', 'Farsi', 'العربية', 'עברית', 'فارسی', 'اردو'];

function isRTL(text) {
    if (!text) return false;
    // Check for RTL Unicode characters
    const rtlRegex = /[\u0591-\u07FF\u200F\u202B\u202E\uFB1D-\uFDFD\uFE70-\uFEFC]/;
    return rtlRegex.test(text);
}

// Localization strings based on target language
const localizations = {
    tr: {
        trueFalse: ['Doğru', 'Yanlış'],
        start: 'Teste Başla',
        startPreview: 'Önizlemeyi Başlat',
        submit: 'Testi Gönder',
        submitting: 'Gönderiliyor...',
        endPreview: 'Önizlemeyi Bitir',
        previous: 'Önceki',
        next: 'Sonraki',
        question: 'Soru',
        questions: 'Soru',
        points: 'Puan',
        minutes: 'Dakika',
        toPass: 'Geçme Notu',
        quizComplete: 'Test Tamamlandı!',
        passed: '✓ GEÇTİ',
        failed: '✗ KALDI',
        timeTaken: 'Geçen süre',
        returnToApp: 'Başvuruma Dön',
        outOf: '/',
        press: 'Basın',
        navHint: 'Gezinmek için ok tuşlarını kullanın • Seçmek için 1-9 tuşlarına basın',
        navNote: 'Not: Formu göndermeden önce istediğiniz soruya dönüp değişiklik yapmak için sayfanın sağ altındaki yukarı/aşağı okları kullanabilirsiniz.',
        previewMode: 'Önizleme Modu',
        welcomeTitle: 'Merhaba!',
        welcomeText: 'El Turco tarafından hazırlanan serbest çevirmen/redaktör başvuru formuna hoş geldiniz. Sizi daha iyi tanıyabilmek adına aşağıdaki soruları yanıtlamanızı istiyoruz. Bu soruların ilk bölümünde genel bilgiler edinmeyi, ikinci bölümünde dil becerilerini ölçmeyi amaçlıyoruz. Başvurunuz ve içtenlikle vereceğiniz yanıtlar için şimdiden teşekkür ederiz.',
        unansweredWarning: 'Yanıtlanmamış sorular var. Yine de göndermek istiyor musunuz?',
        pts: 'puan'
    },
    ar: {
        trueFalse: ['صحيح', 'خطأ'],
        start: 'ابدأ الاختبار',
        startPreview: 'ابدأ المعاينة',
        submit: 'إرسال الاختبار',
        submitting: 'جاري الإرسال...',
        endPreview: 'إنهاء المعاينة',
        previous: 'السابق',
        next: 'التالي',
        question: 'سؤال',
        questions: 'أسئلة',
        points: 'نقاط',
        minutes: 'دقائق',
        toPass: 'للنجاح',
        quizComplete: 'اكتمل الاختبار!',
        passed: '✓ ناجح',
        failed: '✗ راسب',
        timeTaken: 'الوقت المستغرق',
        returnToApp: 'العودة إلى طلبي',
        outOf: '/',
        press: 'اضغط',
        navHint: 'استخدم مفاتيح الأسهم للتنقل • اضغط 1-9 للاختيار',
        navNote: 'ملاحظة: يمكنك الرجوع إلى أي سؤال وتعديل إجابتك باستخدام الأسهم أسفل يمين الصفحة قبل الإرسال.',
        previewMode: 'وضع المعاينة',
        welcomeTitle: 'مرحباً!',
        welcomeText: 'مرحباً بك في نموذج طلب المترجم/المحرر المستقل من El Turco. نود أن نعرفك بشكل أفضل من خلال الإجابة على الأسئلة التالية. شكراً لتقديمك وإجاباتك الصادقة.',
        unansweredWarning: 'هناك أسئلة غير مجابة. هل تريد الإرسال على أي حال؟',
        pts: 'نقطة'
    },
    en: {
        trueFalse: ['True', 'False'],
        start: 'Start Quiz',
        startPreview: 'Start Preview',
        submit: 'Submit Quiz',
        submitting: 'Submitting...',
        endPreview: 'End Preview',
        previous: 'Previous',
        next: 'Next',
        question: 'Question',
        questions: 'Questions',
        points: 'Points',
        minutes: 'Minutes',
        toPass: 'To Pass',
        quizComplete: 'Quiz Complete!',
        passed: '✓ PASSED',
        failed: '✗ FAILED',
        timeTaken: 'Time taken',
        returnToApp: 'Return to My Application',
        outOf: 'out of',
        press: 'Press',
        navHint: 'Use arrow keys to navigate • Press 1-9 to select answers',
        navNote: 'Note: You can return to any question and change your answer using the up/down arrows at the bottom right of the page before submitting.',
        previewMode: 'Preview Mode',
        welcomeTitle: 'Welcome!',
        welcomeText: 'Welcome to El Turco\'s freelance translator/editor application form. We would like to get to know you better by asking you to answer the following questions. Thank you in advance for your application and your sincere answers.',
        unansweredWarning: 'You have unanswered questions. Submit anyway?',
        pts: 'pts'
    }
};

function getLocale(quiz) {
    if (!quiz?.target_language) return localizations.en;
    
    const target = quiz.target_language.toLowerCase();
    
    if (target.includes('turkish') || target.includes('türkçe') || target === 'tr') {
        return localizations.tr;
    }
    if (target.includes('arabic') || target.includes('العربية') || target === 'ar') {
        return localizations.ar;
    }
    // Add more languages as needed
    return localizations.en;
}

export default function TakeQuiz() {
    const urlParams = new URLSearchParams(window.location.search);
    const quizId = urlParams.get('quiz_id');
    const isPreview = urlParams.get('preview') === 'true';

    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState({});
    const [startTime] = useState(new Date());
    const [submitted, setSubmitted] = useState(false);
    const [result, setResult] = useState(null);
    const [timeRemaining, setTimeRemaining] = useState(null);
    const [showIntro, setShowIntro] = useState(true);
    const [direction, setDirection] = useState(1);

    const queryClient = useQueryClient();

    const { data: user } = useQuery({
        queryKey: ['currentUser'],
        queryFn: () => base44.auth.me(),
    });

    const { data: quiz } = useQuery({
        queryKey: ['quiz', quizId],
        queryFn: async () => {
            const quizzes = await base44.entities.Quiz.list();
            return quizzes.find(q => q.id === quizId);
        },
        enabled: !!quizId,
    });

    const { data: questions = [] } = useQuery({
        queryKey: ['questions', quizId],
        queryFn: () => base44.entities.Question.filter({ quiz_id: quizId }, 'order'),
        enabled: !!quizId,
    });

    const { data: freelancer } = useQuery({
        queryKey: ['myFreelancer', user?.email],
        queryFn: async () => {
            const freelancers = await base44.entities.Freelancer.filter({ email: user.email });
            return freelancers[0];
        },
        enabled: !!user?.email && !isPreview,
    });

    // Determine if quiz content is RTL
    const quizIsRTL = quiz && (
        rtlLanguages.some(lang => 
            quiz.target_language?.toLowerCase().includes(lang.toLowerCase()) ||
            quiz.source_language?.toLowerCase().includes(lang.toLowerCase())
        ) ||
        isRTL(quiz.title) ||
        questions.some(q => isRTL(q.question_text))
    );

    // Timer effect
    useEffect(() => {
        if (!quiz?.time_limit_minutes || submitted || showIntro || isPreview) return;

        const endTime = new Date(startTime.getTime() + quiz.time_limit_minutes * 60000);
        const interval = setInterval(() => {
            const now = new Date();
            const remaining = Math.max(0, Math.floor((endTime - now) / 1000));
            setTimeRemaining(remaining);

            if (remaining === 0) {
                clearInterval(interval);
                handleSubmit();
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [quiz?.time_limit_minutes, submitted, startTime, showIntro, isPreview]);

    // Auto-save effect
    useEffect(() => {
        if (isPreview) return;
        const timer = setTimeout(async () => {
            if (Object.keys(answers).length > 0 && !submitted) {
                localStorage.setItem(`quiz_draft_${quizId}`, JSON.stringify({
                    answers,
                    savedAt: new Date().toISOString()
                }));
            }
        }, 2000);
        return () => clearTimeout(timer);
    }, [answers, submitted, quizId, isPreview]);

    const submitQuizMutation = useMutation({
        mutationFn: async (data) => {
            const attempt = await base44.entities.QuizAttempt.create(data);
            const assignments = await base44.entities.QuizAssignment.filter({ freelancer_id: freelancer.id, quiz_id: quizId });
            if (assignments.length > 0) {
                await base44.entities.QuizAssignment.update(assignments[0].id, { status: 'completed' });
            }
            return attempt;
        },
        onSuccess: (attempt) => {
            queryClient.invalidateQueries({ queryKey: ['quizAttempts'] });
            queryClient.invalidateQueries({ queryKey: ['quizAssignments'] });
            setResult(attempt);
            setSubmitted(true);
            localStorage.removeItem(`quiz_draft_${quizId}`);
            toast.success('Quiz submitted successfully!');
        },
    });

    const handleAnswerChange = (questionId, answer) => {
        setAnswers({ ...answers, [questionId]: answer });
        
        // Auto-advance to next question after selection (but not on last question)
        if (currentIndex < questions.length - 1) {
            setTimeout(() => {
                setDirection(1);
                setCurrentIndex(currentIndex + 1);
            }, 400);
        }
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const goNext = () => {
        if (currentIndex < questions.length - 1) {
            setDirection(1);
            setCurrentIndex(currentIndex + 1);
        }
    };

    const goPrev = () => {
        if (currentIndex > 0) {
            setDirection(-1);
            setCurrentIndex(currentIndex - 1);
        }
    };

    // Get localized strings
    const t = getLocale(quiz);

    const handleSubmit = () => {
        if (isPreview) {
            toast.info('This is preview mode - submissions are disabled');
            return;
        }

        localStorage.removeItem(`quiz_draft_${quizId}`);

        if (Object.keys(answers).length < questions.length) {
            if (!confirm(t.unansweredWarning)) {
                return;
            }
        }

        const timeTaken = Math.round((new Date() - startTime) / 60000);

        const gradedAnswers = questions.map(q => {
            const userAnswer = answers[q.id] || '';
            const isCorrect = userAnswer === q.correct_answer;
            return {
                question_id: q.id,
                answer: userAnswer,
                is_correct: isCorrect,
                points_earned: isCorrect ? q.points : 0
            };
        });

        const score = gradedAnswers.reduce((sum, a) => sum + a.points_earned, 0);
        const totalPossible = questions.reduce((sum, q) => sum + q.points, 0);
        const percentage = totalPossible > 0 ? (score / totalPossible) * 100 : 0;
        const passed = quiz.passing_score ? percentage >= quiz.passing_score : null;

        submitQuizMutation.mutate({
            quiz_id: quizId,
            freelancer_id: freelancer.id,
            answers: gradedAnswers,
            score,
            total_possible: totalPossible,
            percentage: Math.round(percentage),
            passed,
            time_taken_minutes: timeTaken,
            status: 'submitted'
        });
    };

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (showIntro || submitted) return;
            
            if (e.key === 'ArrowRight' || e.key === 'Enter') {
                if (currentIndex < questions.length - 1) goNext();
            } else if (e.key === 'ArrowLeft') {
                goPrev();
            } else if (e.key >= '1' && e.key <= '9') {
                const question = questions[currentIndex];
                const options = question.question_type === 'true_false' 
                    ? ['True', 'False'] 
                    : question.options;
                const idx = parseInt(e.key) - 1;
                if (idx < options.length) {
                    handleAnswerChange(question.id, options[idx]);
                }
            }
        };
        
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [showIntro, submitted, currentIndex, questions]);

    if (!quizId) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 flex items-center justify-center p-6">
                <div className="text-center text-white">
                    <h2 className="text-3xl font-bold mb-4">No Quiz Selected</h2>
                    <p className="text-white/70">Please select a quiz to take.</p>
                </div>
            </div>
        );
    }

    if (!quiz || (!freelancer && !isPreview)) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 flex items-center justify-center">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-white/30 border-t-white"></div>
            </div>
        );
    }

    // Result Screen
    if (submitted && result) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 flex items-center justify-center p-6">
                <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-white/10 backdrop-blur-xl rounded-3xl p-12 max-w-lg w-full text-center border border-white/20"
                >
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: "spring" }}
                        className="mb-8"
                    >
                        {result.passed ? (
                            <div className="w-32 h-32 mx-auto rounded-full bg-green-500/20 flex items-center justify-center">
                                <CheckCircle className="w-20 h-20 text-green-400" />
                            </div>
                        ) : result.passed === false ? (
                            <div className="w-32 h-32 mx-auto rounded-full bg-red-500/20 flex items-center justify-center">
                                <X className="w-20 h-20 text-red-400" />
                            </div>
                        ) : (
                            <div className="w-32 h-32 mx-auto rounded-full bg-blue-500/20 flex items-center justify-center">
                                <Check className="w-20 h-20 text-blue-400" />
                            </div>
                        )}
                    </motion.div>

                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.4 }}
                    >
                        <h1 className="text-4xl font-bold text-white mb-2">{t.quizComplete}</h1>
                        <p className="text-white/60 mb-8">{quiz.title}</p>

                        <div className="text-7xl font-bold text-white mb-4">
                            {result.percentage}%
                        </div>
                        <p className="text-white/70 text-lg mb-6">
                            {result.score} {t.outOf} {result.total_possible} {t.points.toLowerCase()}
                        </p>

                        {result.passed !== null && (
                            <div className={`inline-block px-6 py-3 rounded-full text-lg font-semibold mb-8 ${
                                result.passed 
                                    ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                                    : 'bg-red-500/20 text-red-400 border border-red-500/30'
                            }`}>
                                {result.passed ? t.passed : t.failed}
                            </div>
                        )}

                        <div className="text-white/50 text-sm mb-8">
                            {t.timeTaken}: {result.time_taken_minutes} {t.minutes.toLowerCase()}
                        </div>

                        <Button
                            onClick={() => window.location.href = createPageUrl('MyApplication')}
                            className="bg-white text-purple-900 hover:bg-white/90 px-8 py-6 text-lg rounded-xl"
                        >
                            {t.returnToApp}
                        </Button>
                    </motion.div>
                </motion.div>
            </div>
        );
    }

    // Intro Screen
    if (showIntro) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 flex items-center justify-center p-6" dir={quizIsRTL ? 'rtl' : 'ltr'}>
                <motion.div 
                    initial={{ y: 50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 md:p-12 max-w-2xl w-full text-center border border-white/20"
                >
                    {isPreview && (
                        <div className="mb-6 px-4 py-2 bg-yellow-500/20 border border-yellow-500/30 rounded-full inline-block">
                            <span className="text-yellow-300 text-sm font-medium">👁 {t.previewMode}</span>
                        </div>
                    )}
                    
                    {/* Welcome message */}
                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">{t.welcomeTitle}</h1>
                    
                    <p className="text-white/80 text-lg leading-relaxed mb-8 text-left">
                        {t.welcomeText}
                    </p>

                    <h2 className="text-2xl font-semibold text-white/90 mb-4">{quiz.title}</h2>
                    
                    {quiz.description && (
                        <p className="text-white/60 mb-8">{quiz.description}</p>
                    )}

                    <div className="flex flex-wrap justify-center gap-4 mb-8">
                        <div className="bg-white/10 rounded-xl px-6 py-4">
                            <div className="text-3xl font-bold text-white">{questions.length}</div>
                            <div className="text-white/60 text-sm">{t.questions}</div>
                        </div>
                        <div className="bg-white/10 rounded-xl px-6 py-4">
                            <div className="text-3xl font-bold text-white">{quiz.total_points || 0}</div>
                            <div className="text-white/60 text-sm">{t.points}</div>
                        </div>
                        {quiz.time_limit_minutes && (
                            <div className="bg-white/10 rounded-xl px-6 py-4">
                                <div className="text-3xl font-bold text-white">{quiz.time_limit_minutes}</div>
                                <div className="text-white/60 text-sm">{t.minutes}</div>
                            </div>
                        )}
                        {quiz.passing_score && (
                            <div className="bg-white/10 rounded-xl px-6 py-4">
                                <div className="text-3xl font-bold text-white">{quiz.passing_score}%</div>
                                <div className="text-white/60 text-sm">{t.toPass}</div>
                            </div>
                        )}
                    </div>

                    {quiz.instructions && (
                        <div className="bg-white/5 rounded-xl p-6 mb-6 text-left" dir={isRTL(quiz.instructions) ? 'rtl' : 'ltr'}>
                            <p className="text-white/80 whitespace-pre-wrap">{quiz.instructions}</p>
                        </div>
                    )}

                    {/* Navigation note */}
                    <div className="text-white/40 text-sm mb-8 text-left bg-white/5 rounded-lg p-4">
                        {t.navNote}
                    </div>

                    <Button
                        onClick={() => setShowIntro(false)}
                        className="bg-white text-purple-900 hover:bg-white/90 px-12 py-6 text-xl rounded-xl font-semibold"
                    >
                        {isPreview ? t.startPreview : t.start} →
                    </Button>
                </motion.div>
            </div>
        );
    }

    const currentQuestion = questions[currentIndex];
    const progress = ((currentIndex + 1) / questions.length) * 100;
    const options = currentQuestion?.question_type === 'true_false' 
        ? t.trueFalse 
        : currentQuestion?.options || [];

    const questionIsRTL = isRTL(currentQuestion?.question_text);

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 flex flex-col" dir={quizIsRTL ? 'rtl' : 'ltr'}>
            {/* Header */}
            <div className="p-4 md:p-6">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        {isPreview && (
                            <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30">
                                {t.previewMode}
                            </Badge>
                        )}
                        <span className="text-white/60 text-sm hidden md:block">{quiz.title}</span>
                    </div>
                    
                    <div className="flex items-center gap-4">
                        {timeRemaining !== null && !isPreview && (
                            <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${
                                timeRemaining < 300 ? 'bg-red-500/20 text-red-300' :
                                timeRemaining < 600 ? 'bg-yellow-500/20 text-yellow-300' :
                                'bg-white/10 text-white'
                            }`}>
                                <Clock className="w-4 h-4" />
                                <span className="font-mono font-bold">{formatTime(timeRemaining)}</span>
                            </div>
                        )}
                        
                        <div className="text-white/60">
                            {currentIndex + 1} / {questions.length}
                        </div>
                    </div>
                </div>
                
                <div className="max-w-4xl mx-auto mt-4">
                    <Progress value={progress} className="h-1 bg-white/10" />
                </div>
            </div>

            {/* Question */}
            <div className="flex-1 flex items-center justify-center p-6">
                <div className="max-w-3xl w-full">
                    <AnimatePresence mode="wait" custom={direction}>
                        <motion.div
                            key={currentIndex}
                            custom={direction}
                            initial={{ x: direction * 100, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: direction * -100, opacity: 0 }}
                            transition={{ duration: 0.3, ease: "easeInOut" }}
                        >
                            <div className="mb-8">
                                <div className="flex items-center gap-3 mb-4">
                                    <span className="text-white/40 text-sm">{t.question} {currentIndex + 1}</span>
                                    <Badge className="bg-white/10 text-white/70 border-0">
                                        {currentQuestion?.points} {t.pts}
                                    </Badge>
                                    {currentQuestion?.section && (
                                        <Badge className="bg-purple-500/20 text-purple-300 border-0">
                                            {currentQuestion.section}
                                        </Badge>
                                    )}
                                </div>
                                <h2 
                                    className="text-2xl md:text-4xl font-bold text-white leading-relaxed"
                                    dir={questionIsRTL ? 'rtl' : 'ltr'}
                                >
                                    {currentQuestion?.question_text}
                                </h2>
                            </div>

                            <div className="space-y-3">
                                {options.map((option, idx) => {
                                    const isSelected = answers[currentQuestion?.id] === option;
                                    const optionIsRTL = isRTL(option);
                                    
                                    return (
                                        <motion.button
                                            key={idx}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.1 }}
                                            onClick={() => handleAnswerChange(currentQuestion?.id, option)}
                                            className={`w-full text-left p-5 rounded-2xl border-2 transition-all duration-200 flex items-center gap-4 group ${
                                                isSelected
                                                    ? 'bg-white/20 border-white text-white'
                                                    : 'bg-white/5 border-white/10 text-white/80 hover:bg-white/10 hover:border-white/30'
                                            }`}
                                            dir={optionIsRTL ? 'rtl' : 'ltr'}
                                        >
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0 transition-all ${
                                                isSelected
                                                    ? 'bg-white text-purple-900'
                                                    : 'bg-white/10 text-white/60 group-hover:bg-white/20'
                                            }`}>
                                                {isSelected ? <Check className="w-5 h-5" /> : String.fromCharCode(65 + idx)}
                                            </div>
                                            <span className="text-lg flex-1">{option}</span>
                                            <span className="text-white/30 text-sm hidden md:block">{t.press} {idx + 1}</span>
                                        </motion.button>
                                    );
                                })}
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>

            {/* Navigation */}
            <div className="p-6">
                <div className="max-w-3xl mx-auto flex items-center justify-between">
                    <Button
                        onClick={goPrev}
                        disabled={currentIndex === 0}
                        variant="ghost"
                        className="text-white/60 hover:text-white hover:bg-white/10 disabled:opacity-30"
                    >
                        <ChevronLeft className="w-5 h-5 mr-2" />
                        {t.previous}
                    </Button>

                    {/* Question dots */}
                    <div className="hidden md:flex gap-1.5 flex-wrap justify-center max-w-md">
                        {questions.map((q, idx) => (
                            <button
                                key={q.id}
                                onClick={() => {
                                    setDirection(idx > currentIndex ? 1 : -1);
                                    setCurrentIndex(idx);
                                }}
                                className={`w-3 h-3 rounded-full transition-all ${
                                    idx === currentIndex
                                        ? 'bg-white scale-125'
                                        : answers[q.id]
                                            ? 'bg-green-400'
                                            : 'bg-white/30 hover:bg-white/50'
                                }`}
                            />
                        ))}
                    </div>

                    {currentIndex === questions.length - 1 ? (
                        <Button
                            onClick={handleSubmit}
                            disabled={submitQuizMutation.isPending}
                            className="bg-white text-purple-900 hover:bg-white/90 px-8"
                        >
                            {submitQuizMutation.isPending ? t.submitting : isPreview ? t.endPreview : t.submit}
                        </Button>
                    ) : (
                        <Button
                            onClick={goNext}
                            className="bg-white/10 text-white hover:bg-white/20 border border-white/20"
                        >
                            {t.next}
                            <ChevronRight className="w-5 h-5 ml-2" />
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}