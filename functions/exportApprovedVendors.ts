import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const VENDOR_EXPORT_API_KEY = Deno.env.get('VENDOR_EXPORT_API_KEY');

Deno.serve(async (req) => {
    try {
        // API Key kontrolü
        const { apiKey } = await req.json();
        
        if (!VENDOR_EXPORT_API_KEY) {
            return Response.json({ error: 'API key not configured on server' }, { status: 500 });
        }
        
        if (apiKey !== VENDOR_EXPORT_API_KEY) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const base44 = createClientFromRequest(req);
        
        // Sadece onaylı freelancer'ları çek
        const vendors = await base44.asServiceRole.entities.Freelancer.filter({ status: 'Approved' });

        // Hassas verileri filtrele ve sadece gerekli alanları döndür
        const exportedVendors = vendors.map(v => ({
            external_id: v.id,
            full_name: v.full_name,
            email: v.email,
            email2: v.email2,
            phone: v.phone,
            location: v.location,
            native_language: v.native_language,
            language_pairs: v.language_pairs || [],
            specializations: v.specializations || [],
            categories: v.categories || [],
            service_types: v.service_types || [],
            experience_years: v.experience_years,
            certifications: v.certifications || [],
            skills: v.skills || [],
            software: v.software || [],
            rates: v.rates || [],
            currency: v.currency,
            availability: v.availability,
            resource_code: v.resource_code,
            resource_type: v.resource_type,
            resource_rating: v.resource_rating,
            combined_quality_score: v.combined_quality_score,
            average_lqa_score: v.average_lqa_score,
            average_qs_score: v.average_qs_score,
            can_do_lqa: v.can_do_lqa,
            lqa_languages: v.lqa_languages || [],
            lqa_specializations: v.lqa_specializations || [],
            is_ninja: v.is_ninja,
            ninja_program_type: v.ninja_program_type,
            minimum_fee: v.minimum_fee,
            minimum_project_fee: v.minimum_project_fee,
            smartcat_supplier_id: v.smartcat_supplier_id,
            tags: v.tags || [],
            created_date: v.created_date,
            updated_date: v.updated_date
        }));

        return Response.json({ 
            success: true, 
            count: exportedVendors.length,
            vendors: exportedVendors,
            exported_at: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Export error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});