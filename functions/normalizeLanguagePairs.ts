import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const LANGUAGE_CODES = {
    'en': 'en', 'en-US': 'en', 'en-GB': 'en-GB', 'en-AU': 'en-AU',
    'English': 'en', 'İngilizce': 'en',
    'fr': 'fr', 'fr-FR': 'fr', 'fr-CA': 'fr-CA',
    'French': 'fr', 'Fransızca': 'fr',
    'de': 'de', 'de-DE': 'de', 'de-AT': 'de-AT', 'de-CH': 'de-CH',
    'German': 'de', 'Almanca': 'de',
    'es': 'es', 'es-ES': 'es', 'es-MX': 'es-MX', 'es-AR': 'es-AR',
    'Spanish': 'es', 'İspanyolca': 'es',
    'tr': 'tr', 'Turkish': 'tr', 'Türkçe': 'tr',
    'ar': 'ar', 'ar-SA': 'ar-SA', 'ar-AE': 'ar-AE', 'ar-EG': 'ar-EG',
    'Arabic': 'ar', 'Arapça': 'ar',
    'it': 'it', 'Italian': 'it', 'İtalyanca': 'it',
    'pt': 'pt', 'pt-BR': 'pt-BR', 'pt-PT': 'pt',
    'Portuguese': 'pt',
    'zh': 'zh', 'zh-CN': 'zh-CN', 'zh-TW': 'zh-TW',
    'Chinese': 'zh', 'Çince': 'zh',
    'ru': 'ru', 'Russian': 'ru', 'Rusça': 'ru',
    'ja': 'ja', 'Japanese': 'ja', 'Japonca': 'ja',
    'ko': 'ko', 'Korean': 'ko', 'Korece': 'ko',
    'nl': 'nl', 'Dutch': 'nl', 'Hollandaca': 'nl',
    'pl': 'pl', 'Polish': 'pl', 'Lehçe': 'pl',
    'sv': 'sv', 'Swedish': 'sv', 'İsveççe': 'sv',
    'no': 'no', 'Norwegian': 'no', 'Norveççe': 'no',
    'da': 'da', 'Danish': 'da', 'Danca': 'da',
    'fi': 'fi', 'Finnish': 'fi', 'Fince': 'fi',
    'el': 'el', 'Greek': 'el', 'Yunanca': 'el',
    'he': 'he', 'Hebrew': 'he', 'İbranice': 'he',
    'hi': 'hi', 'Hindi': 'hi',
    'cs': 'cs', 'Czech': 'cs', 'Çekçe': 'cs',
    'hu': 'hu', 'Hungarian': 'hu', 'Macarca': 'hu',
    'ro': 'ro', 'Romanian': 'ro', 'Rumence': 'ro',
    'bg': 'bg', 'Bulgarian': 'bg', 'Bulgarca': 'bg',
    'uk': 'uk', 'Ukrainian': 'uk', 'Ukraynaca': 'uk',
    'th': 'th', 'Thai': 'th', 'Tayca': 'th',
    'vi': 'vi', 'Vietnamese': 'vi', 'Vietnamca': 'vi',
    'id': 'id', 'Indonesian': 'id', 'Endonezce': 'id',
};

const normalizeLanguage = (lang) => {
    if (!lang) return null;
    return LANGUAGE_CODES[lang] || lang;
};

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user || user.role !== 'admin') {
            return Response.json({ error: 'Unauthorized' }, { status: 403 });
        }

        // Fetch all freelancers
        const freelancers = await base44.asServiceRole.entities.Freelancer.list();
        
        let updatedCount = 0;
        const results = [];

        for (const freelancer of freelancers) {
            if (freelancer.language_pairs && freelancer.language_pairs.length > 0) {
                let needsUpdate = false;
                const normalizedPairs = freelancer.language_pairs.map(pair => {
                    const normalizedSource = normalizeLanguage(pair.source_language);
                    const normalizedTarget = normalizeLanguage(pair.target_language);
                    
                    if (normalizedSource !== pair.source_language || normalizedTarget !== pair.target_language) {
                        needsUpdate = true;
                    }
                    
                    return {
                        ...pair,
                        source_language: normalizedSource,
                        target_language: normalizedTarget
                    };
                });

                if (needsUpdate) {
                    await base44.asServiceRole.entities.Freelancer.update(freelancer.id, {
                        language_pairs: normalizedPairs
                    });
                    updatedCount++;
                    results.push({
                        id: freelancer.id,
                        name: freelancer.full_name,
                        updated: true
                    });
                }
            }
        }

        return Response.json({
            success: true,
            totalFreelancers: freelancers.length,
            updatedCount,
            results
        });

    } catch (error) {
        return Response.json({ 
            success: false,
            error: error.message 
        }, { status: 500 });
    }
});