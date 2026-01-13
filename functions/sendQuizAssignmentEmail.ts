import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { freelancerId, quizId, freelancerEmail } = body;

        if (!freelancerId || !quizId || !freelancerEmail) {
            return Response.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Get quiz details
        const quiz = await base44.asServiceRole.entities.Quiz.list();
        const quizData = quiz.find(q => q.id === quizId);

        if (!quizData) {
            return Response.json({ error: 'Quiz not found' }, { status: 404 });
        }

        // Send email to freelancer
        await base44.integrations.Core.SendEmail({
            to: freelancerEmail,
            subject: `You've been assigned a new quiz: ${quizData.title}`,
            body: `Dear Freelancer,\n\nYou have been assigned a new quiz: "${quizData.title}"\n\n${quizData.description || ''}\n\nPlease visit your application dashboard to take the quiz.\n\nBest regards,\nEl Turco Team`
        });

        return Response.json({ success: true, message: 'Email sent successfully' });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});