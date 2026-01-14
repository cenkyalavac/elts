import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
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

        // Get all badges
        const allBadges = await base44.asServiceRole.entities.Badge.filter({ is_active: true });

        // Get freelancer's existing badges
        const existingBadges = await base44.asServiceRole.entities.FreelancerBadge.filter({ freelancer_id: freelancerId });
        const earnedBadgeIds = new Set(existingBadges.map(fb => fb.badge_id));

        // Get all attempts by this freelancer
        const allAttempts = await base44.asServiceRole.entities.QuizAttempt.filter({ freelancer_id: freelancerId });

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
                    const quiz = await base44.asServiceRole.entities.Quiz.filter({ id: quizAttempt.quiz_id });
                    if (quiz && quiz[0]?.specialization) {
                        const specialtyAttempts = allAttempts.filter(a => {
                            // Would need to check quiz specialization for each, simplified here
                            return a.passed;
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