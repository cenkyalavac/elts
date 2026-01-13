import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        // Admin-only function
        if (!user || user.role !== 'admin') {
            return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
        }

        const { email } = await req.json();

        if (!email || !email.body) {
            return Response.json({ error: 'Invalid email data' }, { status: 400 });
        }

        // Prepare email content for LLM
        const emailContent = `
Email From: ${email.from}
Email Subject: ${email.subject}
Email Date: ${email.date}

Email Body:
${email.body}

${email.attachments?.length > 0 ? `Attachments: ${email.attachments.map(a => a.filename).join(', ')}` : ''}
`;

        // Call LLM to extract applicant data
        const response = await base44.integrations.Core.InvokeLLM({
            prompt: `You are an expert recruiter. Extract structured applicant data from the following email. 

The applicant may be applying for freelance translation, interpretation, or other language services.

Extract ONLY the following fields if present in the email:
- full_name (string): Full name of the applicant
- email (string): Email address
- email2 (string): Secondary email if mentioned
- phone (string): Phone number
- phone2 (string): Secondary phone if mentioned
- location (string): City/Country mentioned
- native_language (string): Native language
- language_pairs (array): [{"source_language": "...", "target_language": "...", "proficiency": "Native/Fluent/Professional/Intermediate"}]
- specializations (array): Areas of expertise (Medical, Legal, IT, etc.)
- service_types (array): Types of services offered (Translation, Interpretation, Proofreading, Localization, Transcription, Subtitling, MTPE, Review, LQA, Transcreation)
- experience_years (number): Years of professional experience
- skills (array): Technical skills and tools
- software (array): CAT tools (MemoQ, Trados, etc.)
- certifications (array): Professional certifications
- website (string): Portfolio or personal website
- skype (string): Skype handle
- education (string): Educational background
- rates (array): [{"source_language": "...", "target_language": "...", "rate_type": "per_word/per_hour/per_page", "rate_value": number, "currency": "USD/EUR/GBP/TRY"}]
- currency (string): Preferred currency (USD, EUR, GBP, TRY)
- availability (string): Availability status (Immediate, Within 1 week, Within 2 weeks, Within 1 month, Not available)
- notes (string): Any other relevant information

Only include fields that are clearly mentioned in the email. Do NOT make up or assume data. Return a JSON object with only the fields found.

Email Content:
${emailContent}`,
            response_json_schema: {
                type: 'object',
                properties: {
                    full_name: { type: 'string' },
                    email: { type: 'string' },
                    email2: { type: 'string' },
                    phone: { type: 'string' },
                    phone2: { type: 'string' },
                    location: { type: 'string' },
                    native_language: { type: 'string' },
                    language_pairs: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                source_language: { type: 'string' },
                                target_language: { type: 'string' },
                                proficiency: { type: 'string' }
                            }
                        }
                    },
                    specializations: { type: 'array', items: { type: 'string' } },
                    service_types: { type: 'array', items: { type: 'string' } },
                    experience_years: { type: 'number' },
                    skills: { type: 'array', items: { type: 'string' } },
                    software: { type: 'array', items: { type: 'string' } },
                    certifications: { type: 'array', items: { type: 'string' } },
                    website: { type: 'string' },
                    skype: { type: 'string' },
                    education: { type: 'string' },
                    rates: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                source_language: { type: 'string' },
                                target_language: { type: 'string' },
                                rate_type: { type: 'string' },
                                rate_value: { type: 'number' },
                                currency: { type: 'string' }
                            }
                        }
                    },
                    currency: { type: 'string' },
                    availability: { type: 'string' },
                    notes: { type: 'string' }
                },
                required: ['email', 'full_name']
            },
            add_context_from_internet: false
        });

        // Validate required fields
        if (!response.email || !response.full_name) {
            return Response.json({
                error: 'Could not extract required fields (email and full_name) from email',
                extracted: response
            }, { status: 400 });
        }

        // Check if freelancer with this email already exists
        const existingFreelancers = await base44.asServiceRole.entities.Freelancer.filter({
            email: response.email
        });

        if (existingFreelancers.length > 0) {
            return Response.json({
                error: 'Freelancer with this email already exists',
                freelancer_id: existingFreelancers[0].id
            }, { status: 409 });
        }

        // Set default status for new applications
        const freelancerData = {
            ...response,
            status: 'New Application',
            resource_type: 'Freelancer',
            date_added: new Date().toISOString().split('T')[0],
            notes: (response.notes || '') + `\n\nSource: Email from ${email.from} on ${email.date}`
        };

        // Create the freelancer record
        const createdFreelancer = await base44.asServiceRole.entities.Freelancer.create(freelancerData);

        // Log activity
        await base44.asServiceRole.entities.FreelancerActivity.create({
            freelancer_id: createdFreelancer.id,
            activity_type: 'Email Sent',
            description: `Application created from email: ${email.subject}`,
            performed_by: user.email
        });

        return Response.json({
            success: true,
            freelancer: createdFreelancer,
            extracted_data: response
        });

    } catch (error) {
        console.error('Error processing email:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});