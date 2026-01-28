import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const EXPORT_API_KEY = Deno.env.get('VENDOR_EXPORT_API_KEY');

Deno.serve(async (req) => {
    try {
        const { apiKey } = await req.json();
        
        // API Key güvenlik kontrolü
        if (!EXPORT_API_KEY) {
            return Response.json({ error: 'Server configuration error: API key not set' }, { status: 500 });
        }
        
        if (!apiKey || apiKey !== EXPORT_API_KEY) {
            return Response.json({ error: 'Unauthorized: Invalid API key' }, { status: 401 });
        }

        const base44 = createClientFromRequest(req);
        
        // Sadece onaylı freelancer'ları çek
        const approvedVendors = await base44.asServiceRole.entities.Freelancer.filter({ status: 'Approved' });
        
        // Hassas verileri filtrele ve sadece gerekli alanları döndür
        const vendors = approvedVendors.map(v => ({
            external_id: v.id,
            full_name: v.full_name,
            email: v.email,
            email2: v.email2,
            phone: v.phone,
            location: v.location,
            language_pairs: v.language_pairs || [],
            native_language: v.native_language,
            specializations: v.specializations || [],
            categories: v.categories || [],
            service_types: v.service_types || [],
            software: v.software || [],
            rates: v.rates || [],
            currency: v.currency,
            experience_years: v.experience_years,
            certifications: v.certifications || [],
            resource_type: v.resource_type,
            resource_rating: v.resource_rating,
            combined_quality_score: v.combined_quality_score,
            average_lqa_score: v.average_lqa_score,
            average_qs_score: v.average_qs_score,
            can_do_lqa: v.can_do_lqa,
            lqa_languages: v.lqa_languages || [],
            lqa_specializations: v.lqa_specializations || [],
            is_ninja: v.is_ninja,
            smartcat_supplier_id: v.smartcat_supplier_id,
            minimum_fee: v.minimum_fee,
            minimum_project_fee: v.minimum_project_fee,
            availability: v.availability,
            tags: v.tags || [],
            created_date: v.created_date,
            updated_date: v.updated_date
        }));

        return Response.json({ 
            success: true, 
            count: vendors.length,
            exported_at: new Date().toISOString(),
            vendors 
        });

    } catch (error) {
        console.error('Export error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});