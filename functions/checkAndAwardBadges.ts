import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        // Authentication check
        const user = await base44.auth.me();
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }
        
        const { quizAttemptId } = await req.json();

        if (!quizAttemptId) {
            return Response.json({ error: 'Quiz attempt ID is required' }, { status: 400 });
        }

        // Get the quiz attempt
        const attempt = await base44.asServiceRole.entities.QuizAttempt.filter({ id: quizAttemptId });
        if (!attempt || attempt.length === 0) {
            return Response.json({ error: 'Quiz attempt not found' }, { status: 404 });
        }

        const quizAttempt = attempt[0];
        const freelancerId = quizAttempt.freelancer_id;

        // Get all badges, existing badges, and all attempts in parallel
        const [allBadges, existingBadges, allAttempts] = await Promise.all([
            base44.asServiceRole.entities.Badge.filter({ is_active: true }),
            base44.asServiceRole.entities.FreelancerBadge.filter({ freelancer_id: freelancerId }),
            base44.asServiceRole.entities.QuizAttempt.filter({ freelancer_id: freelancerId })
        ]);
        
        const earnedBadgeIds = new Set(existingBadges.map(fb => fb.badge_id));
        
        // Pre-fetch all quizzes for specialty badge checks (avoid N+1)
        const uniqueQuizIds = [...new Set(allAttempts.map(a => a.quiz_id))];
        const quizFetches = await Promise.all(
            uniqueQuizIds.map(id => base44.asServiceRole.entities.Quiz.filter({ id }))
        );
        const quizMap = new Map();
        quizFetches.forEach((result, idx) => {
            if (result && result[0]) {
                quizMap.set(uniqueQuizIds[idx], result[0]);
            }
        });

        const newBadges = [];

        // Check each badge's criteria
        for (const badge of allBadges) {
            if (earnedBadgeIds.has(badge.id)) continue; // Already earned

            let shouldAward = false;

            switch (badge.criteria_type) {
                case 'score':
                    // Award if current attempt score meets criteria
                    if (quizAttempt.percentage >= badge.criteria_value) {
                        shouldAward = true;
                    }
                    break;

                case 'perfect':
                    // Perfect score on current attempt
                    if (quizAttempt.percentage === 100) {
                        shouldAward = true;
                    }
                    break;

                case 'completion':
                    // Total number of completed quizzes
                    if (allAttempts.length >= badge.criteria_value) {
                        shouldAward = true;
                    }
                    break;

                case 'streak':
                    // Number of consecutive passed quizzes
                    const recentAttempts = [...allAttempts]
                        .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))
                        .slice(0, badge.criteria_value);
                    if (recentAttempts.length >= badge.criteria_value && 
                        recentAttempts.every(a => a.passed)) {
                        shouldAward = true;
                    }
                    break;

                case 'speed':
                    // Completed quiz under time limit
                    if (quizAttempt.time_taken_minutes && 
                        quizAttempt.time_taken_minutes <= badge.criteria_value &&
                        quizAttempt.passed) {
                        shouldAward = true;
                    }
                    break;

                case 'specialty':
                    // Completed quizzes in specific specialty (stored in criteria_value as quiz count)
                    const currentQuiz = quizMap.get(quizAttempt.quiz_id);
                    if (currentQuiz?.specialization) {
                        const targetSpecialization = currentQuiz.specialization;
                        const specialtyAttempts = allAttempts.filter(a => {
                            const attemptQuiz = quizMap.get(a.quiz_id);
                            return a.passed && attemptQuiz?.specialization === targetSpecialization;
                        });
                        if (specialtyAttempts.length >= badge.criteria_value) {
                            shouldAward = true;
                        }
                    }
                    break;
            }

            if (shouldAward) {
                const newBadge = await base44.asServiceRole.entities.FreelancerBadge.create({
                    freelancer_id: freelancerId,
                    badge_id: badge.id,
                    earned_date: new Date().toISOString(),
                    quiz_attempt_id: quizAttemptId
                });
                newBadges.push({ badge, earnedBadge: newBadge });
            }
        }

        return Response.json({
            success: true,
            newBadges: newBadges.map(nb => ({
                id: nb.badge.id,
                name: nb.badge.name,
                description: nb.badge.description,
                icon: nb.badge.icon,
                color: nb.badge.color
            }))
        });

    } catch (error) {
        console.error('Error checking badges:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});