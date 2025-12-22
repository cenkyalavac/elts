// Language normalization mapping
const languageMap = {
  // Turkish variations
  'turkish': 'Turkish',
  'türkçe': 'Turkish',
  'turkce': 'Turkish',
  'tr': 'Turkish',
  
  // English variations
  'english': 'English',
  'ingilizce': 'English',
  'en': 'English',
  
  // French variations
  'french': 'French',
  'fransızca': 'French',
  'fransizca': 'French',
  'fr': 'French',
  'french canadian': 'French (Canadian)',
  'canadian french': 'French (Canadian)',
  
  // German variations
  'german': 'German',
  'almanca': 'German',
  'de': 'German',
  
  // Spanish variations
  'spanish': 'Spanish',
  'ispanyolca': 'Spanish',
  'es': 'Spanish',
  'spanish (latin america)': 'Spanish (Latin America)',
  'spanish (spain)': 'Spanish (Spain)',
  
  // Italian variations
  'italian': 'Italian',
  'italyanca': 'Italian',
  'it': 'Italian',
  
  // Portuguese variations
  'portuguese': 'Portuguese',
  'portekizce': 'Portuguese',
  'pt': 'Portuguese',
  'portuguese (brazil)': 'Portuguese (Brazil)',
  'brazilian portuguese': 'Portuguese (Brazil)',
  
  // Arabic variations
  'arabic': 'Arabic',
  'arapça': 'Arabic',
  'arapca': 'Arabic',
  'ar': 'Arabic',
  
  // Chinese variations
  'chinese': 'Chinese (Simplified)',
  'çince': 'Chinese (Simplified)',
  'cinçe': 'Chinese (Simplified)',
  'zh': 'Chinese (Simplified)',
  'chinese simplified': 'Chinese (Simplified)',
  'chinese traditional': 'Chinese (Traditional)',
  'mandarin': 'Chinese (Simplified)',
  
  // Japanese variations
  'japanese': 'Japanese',
  'japonca': 'Japanese',
  'ja': 'Japanese',
  
  // Korean variations
  'korean': 'Korean',
  'korece': 'Korean',
  'ko': 'Korean',
  
  // Russian variations
  'russian': 'Russian',
  'rusça': 'Russian',
  'rusca': 'Russian',
  'ru': 'Russian',
  
  // Dutch variations
  'dutch': 'Dutch',
  'flemish': 'Dutch',
  'nl': 'Dutch',
  
  // Greek variations
  'greek': 'Greek',
  'yunanca': 'Greek',
  'el': 'Greek'
};

export function normalizeLanguage(language) {
  if (!language) return language;
  
  const normalized = language.toLowerCase().trim();
  return languageMap[normalized] || language;
}

// Deno function endpoint
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { language } = await req.json();
    const normalized = normalizeLanguage(language);
    
    return Response.json({ original: language, normalized });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});