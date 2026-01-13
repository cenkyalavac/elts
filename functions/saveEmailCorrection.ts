import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user || user.role !== 'admin') {
            return Response.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const { email_id, email_subject, email_from, original_ai_category, corrected_category, original_ai_tags, corrected_tags, notes } = await req.json();

        if (!email_id || !corrected_category) {
            return Response.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Check if correction already exists
        const existing = await base44.entities.EmailCorrection.filter({
            email_id: email_id
        });

        let correction;
        if (existing.length > 0) {
            // Update existing correction
            correction = await base44.entities.EmailCorrection.update(existing[0].id, {
                corrected_category,
                corrected_tags: corrected_tags || [],
                notes
            });
        } else {
            // Create new correction record
            correction = await base44.entities.EmailCorrection.create({
                email_id,
                email_subject,
                email_from,
                original_ai_category,
                corrected_category,
                original_ai_tags: original_ai_tags || [],
                corrected_tags: corrected_tags || [],
                notes
            });
        }

        return Response.json({
            success: true,
            correction: correction
        });
    } catch (error) {
        console.error('Error saving email correction:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});