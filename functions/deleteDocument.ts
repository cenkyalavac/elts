import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        // Admin-only
        if (!user || user.role !== 'admin') {
            return Response.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { document_id } = await req.json();

        if (!document_id) {
            return Response.json({ error: 'Missing document_id' }, { status: 400 });
        }

        // Mark as inactive instead of hard delete
        await base44.asServiceRole.entities.Document.update(document_id, {
            is_active: false
        });

        return Response.json({ success: true });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});