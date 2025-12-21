import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        const user = await base44.auth.me();
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { file_url } = await req.json();

        if (!file_url) {
            return Response.json({ error: 'file_url is required' }, { status: 400 });
        }

        const extractedData = await base44.integrations.Core.ExtractDataFromUploadedFile({
            file_url: file_url,
            json_schema: {
                type: "object",
                properties: {
                    full_name: { type: "string" },
                    email: { type: "string" },
                    phone: { type: "string" },
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
                    certifications: {
                        type: "array",
                        items: { type: "string" }
                    },
                    skills: {
                        type: "array",
                        items: { type: "string" }
                    },
                    rate: { type: "string" },
                    location: { type: "string" }
                }
            }
        });

        if (extractedData.status === 'error') {
            return Response.json({ 
                error: 'Failed to parse CV', 
                details: extractedData.details 
            }, { status: 400 });
        }

        return Response.json({ 
            success: true, 
            data: extractedData.output 
        });

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});