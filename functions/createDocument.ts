import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        // Admin-only
        if (!user || user.role !== 'admin') {
            return Response.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { title, type, description, file_url, required_for_approval } = await req.json();

        if (!title || !type || !file_url) {
            return Response.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const document = await base44.asServiceRole.entities.Document.create({
            title,
            type,
            description,
            file_url,
            required_for_approval: required_for_approval !== false,
            is_active: true,
            version: 1
        });

        return Response.json({ document });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});