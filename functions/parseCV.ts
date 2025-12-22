import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

// Helper to validate email format
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Helper to validate phone format
function isValidPhone(phone) {
    const phoneRegex = /^[\d\s\-\+\(\)]+$/;
    return phone && phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 7;
}

// Detect inconsistencies in parsed data
function detectInconsistencies(data) {
    const issues = [];

    // Email validation
    if (data.email && !isValidEmail(data.email)) {
        issues.push({
            field: 'email',
            type: 'invalid_format',
            message: 'Email format appears invalid',
            value: data.email
        });
    }

    // Phone validation
    if (data.phone && !isValidPhone(data.phone)) {
        issues.push({
            field: 'phone',
            type: 'invalid_format',
            message: 'Phone format appears invalid',
            value: data.phone
        });
    }

    // Experience validation
    if (data.experience_years && (data.experience_years < 0 || data.experience_years > 60)) {
        issues.push({
            field: 'experience_years',
            type: 'unrealistic_value',
            message: 'Experience years seems unrealistic',
            value: data.experience_years
        });
    }

    // Language pairs validation
    if (data.language_pairs) {
        data.language_pairs.forEach((pair, index) => {
            if (pair.source_language === pair.target_language) {
                issues.push({
                    field: `language_pairs[${index}]`,
                    type: 'inconsistent_data',
                    message: 'Source and target language are the same',
                    value: pair
                });
            }
        });
    }

    // Check for missing critical information
    if (!data.full_name) {
        issues.push({
            field: 'full_name',
            type: 'missing_required',
            message: 'Full name is missing'
        });
    }

    if (!data.email && !data.phone) {
        issues.push({
            field: 'contact',
            type: 'missing_required',
            message: 'No contact information found (email or phone)'
        });
    }

    // Rate validation
    if (data.rates) {
        data.rates.forEach((rate, index) => {
            if (rate.rate_value && (rate.rate_value < 0 || rate.rate_value > 10000)) {
                issues.push({
                    field: `rates[${index}]`,
                    type: 'unrealistic_value',
                    message: 'Rate value seems unrealistic',
                    value: rate.rate_value
                });
            }
        });
    }

    return issues;
}

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

        // Enhanced schema with more granular fields
        const extractedData = await base44.integrations.Core.ExtractDataFromUploadedFile({
            file_url: file_url,
            json_schema: {
                type: "object",
                properties: {
                    full_name: { type: "string", description: "Full name of the freelancer" },
                    email: { type: "string", description: "Primary email address" },
                    email2: { type: "string", description: "Secondary email address if available" },
                    phone: { type: "string", description: "Primary phone number" },
                    phone2: { type: "string", description: "Secondary phone number if available" },
                    phone3: { type: "string", description: "Additional phone number if available" },
                    location: { type: "string", description: "City and/or country" },
                    website: { type: "string", description: "Personal or portfolio website" },
                    
                    // Enhanced language pairs with source and target
                    language_pairs: {
                        type: "array",
                        description: "Language pairs with source and target languages",
                        items: {
                            type: "object",
                            properties: {
                                source_language: { type: "string", description: "Source language" },
                                target_language: { type: "string", description: "Target language" },
                                proficiency: { 
                                    type: "string", 
                                    description: "Proficiency level: Native, Fluent, Professional, or Intermediate" 
                                }
                            }
                        }
                    },
                    
                    native_language: { type: "string", description: "Native/mother tongue language" },
                    
                    specializations: {
                        type: "array",
                        description: "Specialization areas (e.g., Medical, Legal, Technical, Finance)",
                        items: { type: "string" }
                    },
                    
                    service_types: {
                        type: "array",
                        description: "Types of services offered (Translation, Interpretation, Proofreading, MTPE, etc.)",
                        items: { type: "string" }
                    },
                    
                    experience_years: { 
                        type: "number",
                        description: "Total years of professional translation/interpretation experience"
                    },
                    
                    // Project experience
                    projects: {
                        type: "array",
                        description: "Notable projects or work experience",
                        items: {
                            type: "object",
                            properties: {
                                title: { type: "string", description: "Project title or client name" },
                                description: { type: "string", description: "Brief project description" },
                                role: { type: "string", description: "Role in the project" },
                                duration: { type: "string", description: "Project duration or date" },
                                technologies: { 
                                    type: "array", 
                                    items: { type: "string" },
                                    description: "Tools or technologies used"
                                }
                            }
                        }
                    },
                    
                    education: { 
                        type: "string",
                        description: "Educational background and degrees"
                    },
                    
                    certifications: {
                        type: "array",
                        description: "Professional certifications (e.g., ATA, IoLET, SDL, etc.)",
                        items: { type: "string" }
                    },
                    
                    // Enhanced tools and software
                    software: {
                        type: "array",
                        description: "CAT tools and translation software (MemoQ, Trados, Wordfast, etc.)",
                        items: { type: "string" }
                    },
                    
                    skills: {
                        type: "array",
                        description: "Other technical skills and competencies",
                        items: { type: "string" }
                    },
                    
                    // Enhanced rate information
                    rates: {
                        type: "array",
                        description: "Rate information by language pair and service type",
                        items: {
                            type: "object",
                            properties: {
                                source_language: { type: "string" },
                                target_language: { type: "string" },
                                specialization: { type: "string" },
                                tool: { type: "string", description: "CAT tool if applicable" },
                                rate_type: { 
                                    type: "string",
                                    description: "per_word, per_hour, or per_page"
                                },
                                rate_value: { type: "number" },
                                currency: { type: "string" }
                            }
                        }
                    },
                    
                    availability: { 
                        type: "string",
                        description: "Current availability (Immediate, Within 1 week, etc.)"
                    },
                    
                    // Additional metadata
                    years_as_freelancer: { 
                        type: "number",
                        description: "Years working as freelance translator/interpreter"
                    },
                    
                    membership_organizations: {
                        type: "array",
                        description: "Professional organizations or associations",
                        items: { type: "string" }
                    }
                }
            }
        });

        if (extractedData.status === 'error') {
            return Response.json({ 
                error: 'Failed to parse CV', 
                details: extractedData.details 
            }, { status: 400 });
        }

        const parsedData = extractedData.output;

        // Detect inconsistencies
        const inconsistencies = detectInconsistencies(parsedData);

        // Calculate confidence score based on completeness
        let completeness = 0;
        const criticalFields = ['full_name', 'email', 'language_pairs', 'experience_years'];
        const importantFields = ['phone', 'location', 'specializations', 'service_types', 'skills'];
        
        criticalFields.forEach(field => {
            if (parsedData[field]) completeness += 25;
        });
        
        importantFields.forEach(field => {
            if (parsedData[field] && (Array.isArray(parsedData[field]) ? parsedData[field].length > 0 : true)) {
                completeness += 3;
            }
        });

        return Response.json({ 
            success: true, 
            data: parsedData,
            quality_check: {
                completeness_score: Math.min(completeness, 100),
                inconsistencies: inconsistencies,
                has_critical_issues: inconsistencies.some(i => i.type === 'missing_required'),
                warnings: inconsistencies.length
            }
        });

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});