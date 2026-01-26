import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const formData = await req.formData();
        const file = formData.get('file');

        if (!file) {
            return Response.json({ error: 'No file provided' }, { status: 400 });
        }

        // Validate file size (max 5MB)
        const MAX_FILE_SIZE = 5 * 1024 * 1024;
        if (file.size > MAX_FILE_SIZE) {
            return Response.json({ error: 'File too large (max 5MB)' }, { status: 400 });
        }

        // Validate file type
        const ALLOWED_TYPES = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'text/plain'
        ];
        if (!ALLOWED_TYPES.includes(file.type)) {
            return Response.json({ error: 'Invalid file type. Only PDF and Word documents are allowed.' }, { status: 400 });
        }

        // Upload file
        const { file_url } = await base44.integrations.Core.UploadFile({ file });

        return Response.json({ file_url });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});