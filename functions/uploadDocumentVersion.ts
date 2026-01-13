import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user || user.role !== 'admin') {
            return Response.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { document_id, file_url, change_notes } = await req.json();

        if (!document_id || !file_url) {
            return Response.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Get the parent document
        const parentDoc = await base44.asServiceRole.entities.Document.read(document_id);
        
        if (!parentDoc) {
            return Response.json({ error: 'Document not found' }, { status: 404 });
        }

        // Mark old document as not latest
        await base44.asServiceRole.entities.Document.update(document_id, {
            is_latest_version: false
        });

        // Create new version
        const newVersion = await base44.asServiceRole.entities.Document.create({
            title: parentDoc.title,
            type: parentDoc.type,
            description: parentDoc.description,
            file_url,
            required_for_approval: parentDoc.required_for_approval,
            requires_esign: parentDoc.requires_esign,
            esign_template_id: parentDoc.esign_template_id,
            version: parentDoc.version + 1,
            parent_document_id: document_id,
            is_latest_version: true,
            is_active: true,
            change_notes,
            created_by: user.email
        });

        return Response.json({ 
            document: newVersion,
            old_version_id: document_id,
            new_version: newVersion.version
        });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});