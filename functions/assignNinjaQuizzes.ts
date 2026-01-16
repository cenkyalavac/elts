import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
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
            return Response.json({ 
                success: true, 
                message: 'No quizzes to assign for this program',
                assigned_count: 0 
            });
        }
        
        // Create quiz assignments
        const assignments = [];
        for (const quizId of quizzesToAssign) {
            // Check if already assigned
            const existing = await base44.asServiceRole.entities.QuizAssignment.filter({
                freelancer_id: applicant_id,
                quiz_id: quizId
            });
            
            if (existing.length === 0) {
                const assignment = await base44.asServiceRole.entities.QuizAssignment.create({
                    freelancer_id: applicant_id, // Using applicant_id as freelancer_id for ninja applicants
                    quiz_id: quizId,
                    assigned_by: 'system',
                    status: 'pending',
                    notes: `Auto-assigned for ${program.name}`
                });
                assignments.push(assignment);
            }
        }
        
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