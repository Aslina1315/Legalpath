/**
 * Multilingual localization system.
 * Supports:
 *   - English ('en')
 *   - Tamil ('ta')
 *   - Hindi ('hi')
 *
 * Ensures underlying facts, entity IDs, and statutory references remain intact.
 */

export type SupportedLanguage = 'en' | 'ta' | 'hi';

export interface LanguageOption {
  code: SupportedLanguage;
  label: string;
  nativeLabel: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'en', label: 'English', nativeLabel: 'English' },
  { code: 'ta', label: 'Tamil', nativeLabel: 'தமிழ்' },
  { code: 'hi', label: 'Hindi', nativeLabel: 'हिन्दी' },
];

export const TRANSLATIONS = {
  en: {
    brandName: 'LegalPath',
    headlineLine1: 'Understand what happened.',
    headlineLine2: 'Know what to do next.',
    subText:
      "Tell us your situation in your own words. We'll help organize the details, check current information, review your evidence, and build a clear next-step path.",
    inputPlaceholder: 'Tell us what happened in your own words…',
    startCta: 'Start with my story',
    analyzingCta: 'Analyzing situation…',
    voiceStart: 'Speak your story',
    voiceListening: 'Listening… speak clearly',
    voiceStop: 'Done speaking',
    dropzoneTitle: 'Drop relevant evidence or documents here',
    dropzoneSubtitle: 'Tenancy agreement, termination notice, emails, WhatsApp screenshots, invoices (PDF, PNG, JPG, WebP)',
    trustSignals: {
      sourceAware: 'Source-aware',
      evidenceAware: 'Evidence-aware',
      privacyConscious: 'Privacy-conscious',
      humanHelp: 'Human help when AI reaches its limits',
    },
    sections: {
      whatWeUnderstood: 'What We Understood',
      whereThisMayFit: 'Where This May Fit',
      whatSourcesSay: 'What Current Sources Say',
      yourEvidence: 'Your Evidence & Analysis',
      whatNeedsAttention: 'What Needs Attention',
      verifiedInfo: 'Verified Information',
      yourNextSteps: 'Your Next Steps',
    },
    followUp: {
      clarificationNeeded: 'One clarification is still needed.',
      actionStepOpen: 'Your action step is still open.',
      draftReady: 'Your draft is ready for review.',
      pathComplete: 'Your current action path is complete.',
    },
    privacy: {
      title: 'Case Privacy & Data Controls',
      description: 'Your narrative and documents are encrypted and scoped to your account. We never sell your data or share it with third parties.',
      clearDraft: 'Clear Draft',
      deleteCase: 'Delete Case Record',
    },
  },
  ta: {
    brandName: 'LegalPath',
    headlineLine1: 'என்ன நடந்தது என்பதைப் புரிந்து கொள்ளுங்கள்.',
    headlineLine2: 'அடுத்து என்ன செய்ய வேண்டும் என்பதைத் தெரிந்து கொள்ளுங்கள்.',
    subText:
      'உங்கள் சொந்த வார்த்தைகளில் உங்கள் சூழ்நிலையை எங்களிடம் கூறுங்கள். விவரங்களை ஒழுங்கமைக்கவும், தற்போதைய தகவல்களைச் சரிபார்க்கவும், ஆதாரங்களை ஆய்வு செய்யவும், அடுத்த கட்ட வழியை உருவாக்கவும் நாங்கள் உதவுகிறோம்.',
    inputPlaceholder: 'உங்கள் சொந்த வார்த்தைகளில் என்ன நடந்தது என்று சொல்லுங்கள்…',
    startCta: 'என் கதையுடன் தொடங்குங்கள்',
    analyzingCta: 'சூழ்நிலை ஆய்வு செய்யப்படுகிறது…',
    voiceStart: 'பேசிப் பதிவு செய்யுங்கள்',
    voiceListening: 'கேட்கிறது… தெளிவாகப் பேசுங்கள்',
    voiceStop: 'பேசி முடிந்தது',
    dropzoneTitle: 'தொடர்புடைய ஆவணங்களை இங்கே பதிவேற்றவும்',
    dropzoneSubtitle: 'ஒப்பந்தங்கள், அறிவிப்புகள், மின்னஞ்சல்கள், ரசீதுகள் (PDF, PNG, JPG, WebP)',
    trustSignals: {
      sourceAware: 'ஆதார விழிப்புணர்வு',
      evidenceAware: 'சான்றுகள் ஆய்வு',
      privacyConscious: 'முழு தனியுரிமைப் பாதுகாப்பு',
      humanHelp: 'எல்லைகளை எட்டும்போது மனித உதவி',
    },
    sections: {
      whatWeUnderstood: 'நாங்கள் புரிந்துகொண்டவை',
      whereThisMayFit: 'சட்ட வரம்பு & களம்',
      whatSourcesSay: 'தற்போதைய சட்ட மூலங்கள்',
      yourEvidence: 'உங்கள் ஆதாரங்கள் & ஆய்வு',
      whatNeedsAttention: 'கவனம் தேவைப்படுபவை',
      verifiedInfo: 'சரிபார்க்கப்பட்ட தகவல்',
      yourNextSteps: 'உங்கள் அடுத்த படிகள்',
    },
    followUp: {
      clarificationNeeded: 'ஒரு விளக்கம் இன்னும் தேவைப்படுகிறது.',
      actionStepOpen: 'உங்கள் அடுத்த நடவடிக்கை இன்னும் நிலுவையில் உள்ளது.',
      draftReady: 'உங்கள் வரைவு மதிப்பாய்வுக்குத் தயாராக உள்ளது.',
      pathComplete: 'உங்கள் தற்போதைய நடவடிக்கை பாதை நிறைவடைந்தது.',
    },
    privacy: {
      title: 'தனியுரிமை மற்றும் தரவுக் கட்டுப்பாடு',
      description: 'உங்கள் தகவல்களும் ஆவணங்களும் முழுமையாக மறைகுறியாக்கப்பட்டு பாதுகாக்கப்படுகின்றன.',
      clearDraft: 'வரைவை நீக்கு',
      deleteCase: 'வழக்கு பதிவை நீக்கு',
    },
  },
  hi: {
    brandName: 'LegalPath',
    headlineLine1: 'समझें कि क्या हुआ।',
    headlineLine2: 'जानें कि आगे क्या करना है।',
    subText:
      'अपनी स्थिति अपने शब्दों में बताएं। हम विवरणों को व्यवस्थित करने, वर्तमान कानूनी जानकारी की जांच करने, साक्ष्यों की समीक्षा करने और अगले कदम का स्पष्ट मार्ग बनाने में मदद करेंगे।',
    inputPlaceholder: 'अपने शब्दों में बताएं कि क्या हुआ…',
    startCta: 'मेरी कहानी से शुरू करें',
    analyzingCta: 'स्थिति का विश्लेषण हो रहा है…',
    voiceStart: 'बोलकर बताएं',
    voiceListening: 'सुन रहे हैं… स्पष्ट बोलें',
    voiceStop: 'बोलना समाप्त',
    dropzoneTitle: 'संबंधित दस्तावेज यहां अपलोड करें',
    dropzoneSubtitle: 'अनुबंध, नोटिस, ईमेल, रसीदें (PDF, PNG, JPG, WebP)',
    trustSignals: {
      sourceAware: 'स्रोत-जागरूक',
      evidenceAware: 'साक्ष्य-आधारित',
      privacyConscious: 'गोपनीयता-सुरक्षित',
      humanHelp: 'सीमाओं पर मानवीय कानूनी सहायता',
    },
    sections: {
      whatWeUnderstood: 'हमने क्या समझा',
      whereThisMayFit: 'लागू होने वाला कानूनी दायरा',
      whatSourcesSay: 'वर्तमान आधिकारिक स्रोत क्या कहते हैं',
      yourEvidence: 'आपके साक्ष्य और विश्लेषण',
      whatNeedsAttention: 'जिन पर ध्यान देने की आवश्यकता है',
      verifiedInfo: 'सत्यापित कानूनी जानकारी',
      yourNextSteps: 'आपके अगले कदम',
    },
    followUp: {
      clarificationNeeded: 'एक स्पष्टीकरण अभी भी आवश्यक है।',
      actionStepOpen: 'आपका अगला कदम अभी भी खुला है।',
      draftReady: 'आपका मसौदा समीक्षा के लिए तैयार है।',
      pathComplete: 'आपका वर्तमान एक्शन पाथ पूरा हो गया है।',
    },
    privacy: {
      title: 'मामले की गोपनीयता और डेटा नियंत्रण',
      description: 'आपकी स्थिति और दस्तावेज पूरी तरह से एन्क्रिप्टेड और सुरक्षित हैं।',
      clearDraft: 'ड्राफ्ट हटाएं',
      deleteCase: 'केस रिकॉर्ड मिटाएं',
    },
  },
} as const;

export function getTranslation(lang: SupportedLanguage = 'en') {
  return TRANSLATIONS[lang] || TRANSLATIONS.en;
}
