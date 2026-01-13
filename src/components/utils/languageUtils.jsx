// ISO 639-1 language code mapping and normalization
export const LANGUAGE_CODES = {
    // English variants
    'en': 'en',
    'en-US': 'en',
    'en-GB': 'en-GB',
    'en-AU': 'en-AU',
    'English': 'en',
    'İngilizce': 'en',
    
    // French variants
    'fr': 'fr',
    'fr-FR': 'fr',
    'fr-CA': 'fr-CA',
    'French': 'fr',
    'Fransızca': 'fr',
    
    // German
    'de': 'de',
    'de-DE': 'de',
    'de-AT': 'de-AT',
    'de-CH': 'de-CH',
    'German': 'de',
    'Almanca': 'de',
    
    // Spanish variants
    'es': 'es',
    'es-ES': 'es',
    'es-MX': 'es-MX',
    'es-AR': 'es-AR',
    'Spanish': 'es',
    'İspanyolca': 'es',
    
    // Turkish
    'tr': 'tr',
    'Turkish': 'tr',
    'Türkçe': 'tr',
    
    // Arabic variants
    'ar': 'ar',
    'ar-SA': 'ar-SA',
    'ar-AE': 'ar-AE',
    'ar-EG': 'ar-EG',
    'Arabic': 'ar',
    'Arapça': 'ar',
    
    // Italian
    'it': 'it',
    'Italian': 'it',
    'İtalyanca': 'it',
    
    // Portuguese variants
    'pt': 'pt',
    'pt-BR': 'pt-BR',
    'pt-PT': 'pt',
    'Portuguese': 'pt',
    
    // Chinese variants
    'zh': 'zh',
    'zh-CN': 'zh-CN',
    'zh-TW': 'zh-TW',
    'Chinese': 'zh',
    'Çince': 'zh',
    
    // Russian
    'ru': 'ru',
    'Russian': 'ru',
    'Rusça': 'ru',
    
    // Japanese
    'ja': 'ja',
    'Japanese': 'ja',
    'Japonca': 'ja',
    
    // Korean
    'ko': 'ko',
    'Korean': 'ko',
    'Korece': 'ko',
    
    // Dutch
    'nl': 'nl',
    'Dutch': 'nl',
    'Hollandaca': 'nl',
    
    // Polish
    'pl': 'pl',
    'Polish': 'pl',
    'Lehçe': 'pl',
    
    // Swedish
    'sv': 'sv',
    'Swedish': 'sv',
    'İsveççe': 'sv',
    
    // Norwegian
    'no': 'no',
    'Norwegian': 'no',
    'Norveççe': 'no',
    
    // Danish
    'da': 'da',
    'Danish': 'da',
    'Danca': 'da',
    
    // Finnish
    'fi': 'fi',
    'Finnish': 'fi',
    'Fince': 'fi',
    
    // Greek
    'el': 'el',
    'Greek': 'el',
    'Yunanca': 'el',
    
    // Hebrew
    'he': 'he',
    'Hebrew': 'he',
    'İbranice': 'he',
    
    // Hindi
    'hi': 'hi',
    'Hindi': 'hi',
    
    // Czech
    'cs': 'cs',
    'Czech': 'cs',
    'Çekçe': 'cs',
    
    // Hungarian
    'hu': 'hu',
    'Hungarian': 'hu',
    'Macarca': 'hu',
    
    // Romanian
    'ro': 'ro',
    'Romanian': 'ro',
    'Rumence': 'ro',
    
    // Bulgarian
    'bg': 'bg',
    'Bulgarian': 'bg',
    'Bulgarca': 'bg',
    
    // Ukrainian
    'uk': 'uk',
    'Ukrainian': 'uk',
    'Ukraynaca': 'uk',
    
    // Thai
    'th': 'th',
    'Thai': 'th',
    'Tayca': 'th',
    
    // Vietnamese
    'vi': 'vi',
    'Vietnamese': 'vi',
    'Vietnamca': 'vi',
    
    // Indonesian
    'id': 'id',
    'Indonesian': 'id',
    'Endonezce': 'id',
};

export const LANGUAGE_NAMES = {
    'en': 'English',
    'en-GB': 'English (UK)',
    'en-AU': 'English (AU)',
    'fr': 'French',
    'fr-CA': 'French (CA)',
    'de': 'German',
    'de-AT': 'German (AT)',
    'de-CH': 'German (CH)',
    'es': 'Spanish',
    'es-MX': 'Spanish (MX)',
    'es-AR': 'Spanish (AR)',
    'tr': 'Turkish',
    'ar': 'Arabic',
    'ar-SA': 'Arabic (SA)',
    'ar-AE': 'Arabic (AE)',
    'ar-EG': 'Arabic (EG)',
    'it': 'Italian',
    'pt': 'Portuguese',
    'pt-BR': 'Portuguese (BR)',
    'zh': 'Chinese',
    'zh-CN': 'Chinese (Simplified)',
    'zh-TW': 'Chinese (Traditional)',
    'ru': 'Russian',
    'ja': 'Japanese',
    'ko': 'Korean',
    'nl': 'Dutch',
    'pl': 'Polish',
    'sv': 'Swedish',
    'no': 'Norwegian',
    'da': 'Danish',
    'fi': 'Finnish',
    'el': 'Greek',
    'he': 'Hebrew',
    'hi': 'Hindi',
    'cs': 'Czech',
    'hu': 'Hungarian',
    'ro': 'Romanian',
    'bg': 'Bulgarian',
    'uk': 'Ukrainian',
    'th': 'Thai',
    'vi': 'Vietnamese',
    'id': 'Indonesian',
};

export const normalizeLanguage = (lang) => {
    if (!lang) return null;
    const normalized = LANGUAGE_CODES[lang];
    return normalized || lang;
};

export const getLanguageName = (code) => {
    return LANGUAGE_NAMES[code] || code;
};

export const normalizeLanguagePair = (sourceLang, targetLang) => {
    const source = normalizeLanguage(sourceLang);
    const target = normalizeLanguage(targetLang);
    return `${source} → ${target}`;
};

export const formatLanguagePair = (sourceLang, targetLang) => {
    const source = getLanguageName(normalizeLanguage(sourceLang));
    const target = getLanguageName(normalizeLanguage(targetLang));
    return `${source} → ${target}`;
};