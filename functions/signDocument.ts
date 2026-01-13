import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { document_id, freelancer_id, signature_file_url } = await req.json();

        if (!document_id || !freelancer_id || !signature_file_url) {
            return Response.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Check if signature already exists
        let existingSignatures = [];
        try {
            existingSignatures = await base44.asServiceRole.entities.DocumentSignature.filter({
                document_id,
                freelancer_id
            });
        } catch (e) {
            // No existing signatures
        }

        const signature = existingSignatures.length > 0
            ? await base44.asServiceRole.entities.DocumentSignature.update(existingSignatures[0].id, {
                status: 'signed',
                signed_date: new Date().toISOString(),
                signature_file_url
            })
            : await base44.asServiceRole.entities.DocumentSignature.create({
                document_id,
                freelancer_id,
                freelancer_email: user.email,
                status: 'signed',
                signed_date: new Date().toISOString(),
                signature_file_url
            });

        return Response.json({ signature });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});