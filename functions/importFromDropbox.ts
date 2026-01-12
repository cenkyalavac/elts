import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

async function listDropboxFiles(accessToken, path = '') {
    const response = await fetch('https://api.dropboxapi.com/2/files/list_folder', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            path: path,
            recursive: true,
            include_deleted: false,
        })
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Dropbox API error: ${error}`);
    }

    return await response.json();
}

async function downloadDropboxFile(accessToken, path) {
    const response = await fetch('https://content.dropboxapi.com/2/files/download', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Dropbox-API-Arg': JSON.stringify({ path }),
        }
    });

    if (!response.ok) {
        throw new Error(`Failed to download file: ${path}`);
    }

    return await response.arrayBuffer();
}

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user || user.role !== 'admin') {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { folder_path } = await req.json();
        
        if (!folder_path) {
            return Response.json({ error: 'folder_path is required' }, { status: 400 });
        }

        const accessToken = Deno.env.get("Dropbox");
        if (!accessToken) {
            return Response.json({ error: 'Dropbox access token not configured' }, { status: 500 });
        }

        // List all files in the folder (recursive)
        const folderData = await listDropboxFiles(accessToken, folder_path);
        
        // Filter CV files (PDF, DOC, DOCX)
        const cvFiles = folderData.entries.filter(entry => {
            if (entry['.tag'] !== 'file') return false;
            const name = entry.name.toLowerCase();
            return name.endsWith('.pdf') || name.endsWith('.doc') || name.endsWith('.docx');
        });

        const imported = [];
        const errors = [];

        // Process each CV file
        for (const file of cvFiles) {
            try {
                // Download file
                const fileContent = await downloadDropboxFile(accessToken, file.path_lower);
                
                // Upload to our storage
                const blob = new Blob([fileContent], { type: 'application/pdf' });
                const formData = new FormData();
                formData.append('file', blob, file.name);
                
                const uploadResult = await base44.asServiceRole.integrations.Core.UploadFile({
                    file: blob
                });

                const fileUrl = uploadResult.file_url;

                // Extract data from CV
                const extractResult = await base44.asServiceRole.integrations.Core.ExtractDataFromUploadedFile({
                    file_url: fileUrl,
                    json_schema: {
                        type: "object",
                        properties: {
                            full_name: { type: "string" },
                            email: { type: "string" },
                            phone: { type: "string" },
                            location: { type: "string" },
                            languages: {
                                type: "array",
                                items: {
                                    type: "object",
                                    properties: {
                                        language: { type: "string" },
                                        proficiency: { type: "string" }
                                    }
                                }
                            },
                            specializations: {
                                type: "array",
                                items: { type: "string" }
                            },
                            service_types: {
                                type: "array",
                                items: { type: "string" }
                            },
                            experience_years: { type: "number" },
                            education: { type: "string" },
                            skills: {
                                type: "array",
                                items: { type: "string" }
                            }
                        }
                    }
                });

                if (extractResult.status === 'success' && extractResult.output) {
                    let freelancerData = {
                        ...extractResult.output,
                        cv_file_url: fileUrl,
                        notes: `Imported from Dropbox: ${file.path_display}`
                    };

                    // Ensure status is always "New Application"
                    freelancerData.status = 'New Application';

                    // Check if freelancer already exists
                    let existingFreelancer = null;
                    if (freelancerData.email) {
                        const existing = await base44.asServiceRole.entities.Freelancer.filter({ 
                            email: freelancerData.email 
                        });
                        existingFreelancer = existing[0];
                    }

                    if (existingFreelancer) {
                        // Update existing
                        await base44.asServiceRole.entities.Freelancer.update(
                            existingFreelancer.id,
                            freelancerData
                        );
                        imported.push({
                            name: file.name,
                            action: 'updated',
                            email: freelancerData.email
                        });
                    } else {
                        // Create new
                        await base44.asServiceRole.entities.Freelancer.create(freelancerData);
                        imported.push({
                            name: file.name,
                            action: 'created',
                            email: freelancerData.email
                        });
                    }
                } else {
                    errors.push({
                        file: file.name,
                        error: 'Failed to extract data from CV'
                    });
                }
            } catch (error) {
                errors.push({
                    file: file.name,
                    error: error.message
                });
            }
        }

        return Response.json({
            success: true,
            total_files: cvFiles.length,
            imported: imported.length,
            errors: errors.length,
            imported_details: imported,
            error_details: errors
        });

    } catch (error) {
        return Response.json({ 
            success: false,
            error: error.message 
        }, { status: 500 });
    }
});