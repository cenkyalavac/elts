import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Internal e-signature process
 * Accepts a base64 encoded signature image drawn by the user
 */

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { document_id, freelancer_id, signature_base64 } = await req.json();

        if (!document_id || !freelancer_id || !signature_base64) {
            return Response.json({ error: 'Missing required fields: document_id, freelancer_id, signature_base64' }, { status: 400 });
        }

        // Validate base64 format
        if (!signature_base64.startsWith('data:image/')) {
            return Response.json({ error: 'Invalid signature format. Expected base64 image.' }, { status: 400 });
        }

        // Get document
        const documents = await base44.asServiceRole.entities.Document.filter({ id: document_id });
        if (!documents || documents.length === 0) {
            return Response.json({ error: 'Document not found' }, { status: 404 });
        }
        const document = documents[0];

        // Get freelancer
        const freelancers = await base44.asServiceRole.entities.Freelancer.filter({ id: freelancer_id });
        if (!freelancers || freelancers.length === 0) {
            return Response.json({ error: 'Freelancer not found' }, { status: 404 });
        }
        const freelancer = freelancers[0];

        // Convert base64 to blob and upload
        const base64Data = signature_base64.split(',')[1];
        const mimeType = signature_base64.split(';')[0].split(':')[1];
        const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
        const blob = new Blob([binaryData], { type: mimeType });
        const file = new File([blob], `signature_${freelancer_id}_${Date.now()}.png`, { type: mimeType });

        // Upload signature image
        const uploadResult = await base44.asServiceRole.integrations.Core.UploadFile({ file });
        const signatureImageUrl = uploadResult.file_url;

        // Check for existing signature record
        const existingSignatures = await base44.asServiceRole.entities.DocumentSignature.filter({
            document_id: document_id,
            freelancer_id: freelancer_id
        });

        const signedDate = new Date().toISOString();
        let signatureRecord;

        if (existingSignatures && existingSignatures.length > 0) {
            // Update existing record
            signatureRecord = await base44.asServiceRole.entities.DocumentSignature.update(
                existingSignatures[0].id,
                {
                    status: 'signed',
                    signature_type: 'esign',
                    signed_date: signedDate,
                    signature_file_url: signatureImageUrl,
                    document_version: document.version || 1
                }
            );
        } else {
            // Create new signature record
            signatureRecord = await base44.asServiceRole.entities.DocumentSignature.create({
                document_id: document_id,
                freelancer_id: freelancer_id,
                freelancer_email: freelancer.email,
                status: 'signed',
                signature_type: 'esign',
                signed_date: signedDate,
                signature_file_url: signatureImageUrl,
                document_version: document.version || 1
            });
        }

        return Response.json({
            success: true,
            message: 'Document signed successfully',
            signature: {
                id: signatureRecord.id,
                document_id: document_id,
                freelancer_id: freelancer_id,
                signed_date: signedDate,
                signature_image_url: signatureImageUrl
            }
        });

    } catch (error) {
        console.error('E-signature error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});