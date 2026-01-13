import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { freelancer_id } = await req.json();

        if (!freelancer_id) {
            return Response.json({ error: 'Missing freelancer_id' }, { status: 400 });
        }

        const signatures = await base44.asServiceRole.entities.DocumentSignature.filter({
            freelancer_id
        });

        return Response.json({ signatures });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});