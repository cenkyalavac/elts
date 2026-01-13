import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get active documents
        const documents = await base44.asServiceRole.entities.Document.filter({
            is_active: true
        });

        // Sort by creation date
        const sorted = documents.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));

        return Response.json({ documents: sorted });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});