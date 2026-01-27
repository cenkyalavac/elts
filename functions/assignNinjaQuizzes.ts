import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Email Templates
const NO_QUIZZES_ADMIN_TEMPLATE = (fullName, email, programName) => `
Dear Admin,

An applicant was processed for a Ninja program, but no matching quizzes were found in the system.

Applicant: ${fullName}
Email: ${email}
Program: ${programName}

Please review the program configuration and ensure appropriate quizzes are available for assignment.

Best regards,
el turco System
`.trim();

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        // Authentication check
        const user = await base44.auth.me();
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }
        
        // Authorization check - only admin or project_manager can assign quizzes
        if (user.role !== 'admin' && user.role !== 'project_manager') {
            return Response.json({ error: 'Forbidden: Admin or Project Manager access required' }, { status: 403 });
        }
        
        const { applicant_id } = await req.json();
        
        if (!applicant_id) {
            return Response.json({ error: 'applicant_id is required' }, { status: 400 });
        }
        
        // Get the applicant
        const applicants = await base44.asServiceRole.entities.NinjaApplicant.filter({ id: applicant_id });
        if (applicants.length === 0) {
            return Response.json({ error: 'Applicant not found' }, { status: 404 });
        }
        const applicant = applicants[0];
        
        // Get the program
        const programs = await base44.asServiceRole.entities.NinjaProgram.filter({ id: applicant.program_id });
        if (programs.length === 0) {
            return Response.json({ error: 'Program not found' }, { status: 404 });
        }
        const program = programs[0];
        
        // Get quizzes to assign from program
        let quizzesToAssign = program.quizzes_to_assign || [];
        
        // If no specific quizzes defined, try to find relevant quizzes based on program type
        if (quizzesToAssign.length === 0) {
            const allQuizzes = await base44.asServiceRole.entities.Quiz.filter({ is_active: true });
            
            // Filter quizzes based on program type and focus areas
            quizzesToAssign = allQuizzes
                .filter(quiz => {
                    // Match by specialization if program has focus areas
                    if (program.focus_areas?.length > 0) {
                        return program.focus_areas.some(area => 
                            quiz.specialization?.toLowerCase().includes(area.toLowerCase()) ||
                            quiz.title?.toLowerCase().includes(area.toLowerCase())
                        );
                    }
                    // For bootcamp, include general translation quizzes
                    if (program.program_type === 'bootcamp') {
                        return quiz.service_type === 'Translation' || !quiz.specialization;
                    }
                    return true;
                })
                .slice(0, 3) // Limit to 3 quizzes max
                .map(q => q.id);
        }
        
        if (quizzesToAssign.length === 0) {
            // Notify admins that no quizzes were found
            const admins = await base44.asServiceRole.entities.User.filter({ role: 'admin' });
            
            for (const admin of admins) {
                await base44.asServiceRole.integrations.Core.SendEmail({
                    to: admin.email,
                    subject: `Action Required: No Quizzes Assigned for ${applicant.full_name}`,
                    body: NO_QUIZZES_ADMIN_TEMPLATE(applicant.full_name, applicant.email, program.name)
                });
            }
            
            return Response.json({ 
                success: true, 
                message: 'No quizzes to assign for this program. Admins have been notified.',
                assigned_count: 0,
                admins_notified: admins.length
            });
        }
        
        // Check existing assignments in parallel
        const existingChecks = await Promise.all(
            quizzesToAssign.map(quizId => 
                base44.asServiceRole.entities.QuizAssignment.filter({
                    freelancer_id: applicant_id,
                    quiz_id: quizId
                })
            )
        );
        
        // Filter to only quizzes not yet assigned
        const quizzesToCreate = quizzesToAssign.filter((_, idx) => existingChecks[idx].length === 0);
        
        // Create assignments in parallel
        const assignments = await Promise.all(
            quizzesToCreate.map(quizId =>
                base44.asServiceRole.entities.QuizAssignment.create({
                    freelancer_id: applicant_id,
                    quiz_id: quizId,
                    assigned_by: user.email,
                    status: 'pending',
                    notes: `Auto-assigned for ${program.name}`
                })
            )
        );
        
        // Update applicant quiz_scores to track assigned quizzes
        const existingScores = applicant.quiz_scores || [];
        const newScores = quizzesToAssign
            .filter(qId => !existingScores.some(s => s.quiz_id === qId))
            .map(qId => ({
                quiz_id: qId,
                score: null,
                passed: null,
                completed_date: null
            }));
        
        if (newScores.length > 0) {
            await base44.asServiceRole.entities.NinjaApplicant.update(applicant_id, {
                quiz_scores: [...existingScores, ...newScores]
            });
        }
        
        return Response.json({ 
            success: true, 
            message: `Assigned ${assignments.length} quizzes`,
            assigned_count: assignments.length,
            quiz_ids: quizzesToAssign
        });
        
    } catch (error) {
        console.error('Error assigning quizzes:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});