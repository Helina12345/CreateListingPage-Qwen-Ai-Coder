// ============================================================
// ListingDesk Pro — Multi-Language Support Service
// Real translation integration with multiple providers
// ============================================================

export interface TranslationResult {
  originalText: string;
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
  provider: 'google' | 'deepl' | 'azure' | 'aws';
  confidence?: number;
}

export interface LanguageConfig {
  code: string;
  name: string;
  nativeName: string;
  supported: boolean;
}

export class MultiLanguageService {
  private apiKey: string;
  private provider: 'google' | 'deepl' | 'azure' | 'aws';

  constructor(apiKey: string, provider: 'google' | 'deepl' | 'azure' | 'aws' = 'google') {
    this.apiKey = apiKey;
    this.provider = provider;
  }

  // ============================================================
  // TRANSLATE TEXT
  // ============================================================

  async translate(
    text: string,
    targetLanguage: string,
    sourceLanguage: string = 'auto'
  ): Promise<TranslationResult> {
    switch (this.provider) {
      case 'google':
        return await this.translateWithGoogle(text, targetLanguage, sourceLanguage);
      case 'deepl':
        return await this.translateWithDeepL(text, targetLanguage, sourceLanguage);
      case 'azure':
        return await this.translateWithAzure(text, targetLanguage, sourceLanguage);
      case 'aws':
        return await this.translateWithAWS(text, targetLanguage, sourceLanguage);
      default:
        throw new Error('Unsupported translation provider');
    }
  }

  // ============================================================
  // GOOGLE TRANSLATE
  // ============================================================

  private async translateWithGoogle(
    text: string,
    targetLanguage: string,
    sourceLanguage: string
  ): Promise<TranslationResult> {
    const response = await fetch(
      `https://translation.googleapis.com/language/translate/v2?key=${this.apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          q: text,
          target: targetLanguage,
          source: sourceLanguage === 'auto' ? undefined : sourceLanguage,
          format: 'text',
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Google Translate API error: ${response.statusText}`);
    }

    const data = await response.json();
    const translatedText = data.data.translations[0].translatedText;
    const detectedLanguage = data.data.translations[0].detectedSourceLanguage;

    return {
      originalText: text,
      translatedText,
      sourceLanguage: detectedLanguage || sourceLanguage,
      targetLanguage,
      provider: 'google',
    };
  }

  // ============================================================
  // DEEPL TRANSLATE
  // ============================================================

  private async translateWithDeepL(
    text: string,
    targetLanguage: string,
    sourceLanguage: string
  ): Promise<TranslationResult> {
    const response = await fetch('https://api-free.deepl.com/v2/translate', {
      method: 'POST',
      headers: {
        'Authorization': `DeepL-Auth-Key ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: [text],
        target_lang: targetLanguage.toUpperCase(),
        source_lang: sourceLanguage === 'auto' ? undefined : sourceLanguage.toUpperCase(),
      }),
    });

    if (!response.ok) {
      throw new Error(`DeepL API error: ${response.statusText}`);
    }

    const data = await response.json();
    const translatedText = data.translations[0].text;
    const detectedLanguage = data.translations[0].detected_source_language;

    return {
      originalText: text,
      translatedText,
      sourceLanguage: detectedLanguage?.toLowerCase() || sourceLanguage,
      targetLanguage,
      provider: 'deepl',
    };
  }

  // ============================================================
  // AZURE TRANSLATE
  // ============================================================

  private async translateWithAzure(
    text: string,
    targetLanguage: string,
    sourceLanguage: string
  ): Promise<TranslationResult> {
    const response = await fetch(
      `https://api.cognitive.microsofttranslator.com/translate?api-version=3.0&to=${targetLanguage}${sourceLanguage !== 'auto' ? `&from=${sourceLanguage}` : ''}`,
      {
        method: 'POST',
        headers: {
          'Ocp-Apim-Subscription-Key': this.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([{ text }]),
      }
    );

    if (!response.ok) {
      throw new Error(`Azure Translate API error: ${response.statusText}`);
    }

    const data = await response.json();
    const translatedText = data[0].translations[0].text;
    const detectedLanguage = data[0].detectedLanguage?.language;

    return {
      originalText: text,
      translatedText,
      sourceLanguage: detectedLanguage || sourceLanguage,
      targetLanguage,
      provider: 'azure',
    };
  }

  // ============================================================
  // AWS TRANSLATE
  // ============================================================

  private async translateWithAWS(
    text: string,
    targetLanguage: string,
    sourceLanguage: string
  ): Promise<TranslationResult> {
    // AWS Translate requires AWS SDK
    // This is a placeholder for the actual implementation
    throw new Error('AWS Translate requires AWS SDK - implement with @aws-sdk/client-translate');
  }

  // ============================================================
  // BATCH TRANSLATE
  // ============================================================

  async translateBatch(
    texts: string[],
    targetLanguage: string,
    sourceLanguage: string = 'auto'
  ): Promise<TranslationResult[]> {
    const results: TranslationResult[] = [];

    for (const text of texts) {
      const result = await this.translate(text, targetLanguage, sourceLanguage);
      results.push(result);
    }

    return results;
  }

  // ============================================================
  // DETECT LANGUAGE
  // ============================================================

  async detectLanguage(text: string): Promise<{ language: string; confidence: number }> {
    const response = await fetch(
      `https://translation.googleapis.com/language/translate/v2/detect?key=${this.apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ q: text }),
      }
    );

    if (!response.ok) {
      throw new Error(`Language detection error: ${response.statusText}`);
    }

    const data = await response.json();
    const detection = data.data.detections[0][0];

    return {
      language: detection.language,
      confidence: detection.confidence,
    };
  }

  // ============================================================
  // GET SUPPORTED LANGUAGES
  // ============================================================

  async getSupportedLanguages(): Promise<LanguageConfig[]> {
    const response = await fetch(
      `https://translation.googleapis.com/language/translate/v2/languages?key=${this.apiKey}&target=en`
    );

    if (!response.ok) {
      throw new Error(`Failed to get supported languages: ${response.statusText}`);
    }

    const data = await response.json();

    return data.data.languages.map((lang: any) => ({
      code: lang.language,
      name: lang.name,
      nativeName: lang.name, // Would need separate call for native names
      supported: true,
    }));
  }

  // ============================================================
  // TRANSLATE LISTING
  // ============================================================

  async translateListing(
    listing: {
      title: string;
      description: string;
      shortDescription?: string;
      tags?: string[];
    },
    targetLanguages: string[],
    sourceLanguage: string = 'auto'
  ): Promise<Record<string, typeof listing>> {
    const translations: Record<string, typeof listing> = {};

    for (const targetLang of targetLanguages) {
      const [titleResult, descResult, shortDescResult, tagsResults] = await Promise.all([
        this.translate(listing.title, targetLang, sourceLanguage),
        this.translate(listing.description, targetLang, sourceLanguage),
        listing.shortDescription
          ? this.translate(listing.shortDescription, targetLang, sourceLanguage)
          : Promise.resolve(null),
        listing.tags
          ? this.translateBatch(listing.tags, targetLang, sourceLanguage)
          : Promise.resolve([]),
      ]);

      translations[targetLang] = {
        title: titleResult.translatedText,
        description: descResult.translatedText,
        shortDescription: shortDescResult?.translatedText,
        tags: tagsResults.map((r) => r.translatedText),
      };
    }

    return translations;
  }
}

// ============================================================
// EXPORT
// ============================================================

export function createMultiLanguageService(
  apiKey: string,
  provider: 'google' | 'deepl' | 'azure' | 'aws' = 'google'
): MultiLanguageService {
  return new MultiLanguageService(apiKey, provider);
}
