console.log("Hello Content")

let currentBox = null;

// Listens for any mouseup events
document.addEventListener('mouseup', () => {
  popUpText();
});

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "updateSettings") {
    console.log('Settings updated:', request.data);
    sendResponse({success: true});
  }
});

// Language detector to detect the selected text's language
async function useLanguageDetector(text) {
  const availability = await LanguageDetector.availability();
  
  if (availability === 'no') {
    return `Language Detector cannot be initialized`;
  };

  const detector = await LanguageDetector.create();

  const results = await detector.detect(text);
  return results[0].detectedLanguage;
};

// Using the Translator API to translate selected text
async function useTranslator(text) {
  let settings = {};
  
  try {
    settings = await chrome.storage.sync.get(['sourceLanguage', 'targetLanguage']);
  } catch (error) {
    console.log('Storage unavailable, using defaults:', error);
    settings = { sourceLanguage: 'en', targetLanguage: 'fr' };
  }

  if (settings.sourceLanguage === 'auto') {
    settings.sourceLanguage = await useLanguageDetector(text);
  };

  const sourceLanguage = settings.sourceLanguage || 'en';
  const targetLanguage = settings.targetLanguage || 'fr';

  if (sourceLanguage === targetLanguage) {
    return text;
  }

  try {
    const availability = await Translator.availability({
      sourceLanguage,
      targetLanguage,
    });

    if (availability === 'no') {
      return `Translation not available for ${sourceLanguage} to ${targetLanguage}`;
    };

    const translator = await Translator.create({
      sourceLanguage,
      targetLanguage,
    });
    
    // For longer texts
    if (text.length > 999) {
      const stream = await translator.translateStreaming(text);
      let fullTranslation = '';

      for await (const chunk of stream) {
        fullTranslation += chunk;
      };

      return fullTranslation;
    }

    const result = await translator.translate(text);
    return result;
  } catch (error) {
    return `Translation error: ${error.message}`;
  }
};

// Creates Pop up text below the highlighted text
async function popUpText() {
  if (currentBox) {
    currentBox.remove();
  };

  const selection = window.getSelection();
  if (selection.rangeCount === 0 || selection.toString().trim() === '') return;
  
  const range = selection.getRangeAt(0);
  const rect = range.getBoundingClientRect();

  let settings = {};
  
  try {
    settings = await chrome.storage.sync.get(['fontSize']);
  } catch (error) {
    console.log('Storage unavailable for fontSize, using default:', error);
    settings = { fontSize: 'medium' };
  }
  
  const fontSize = settings.fontSize || 'medium';

  let fontSizeValue;
  switch (fontSize) {
    case 'small': fontSizeValue = '14px'; break;
    case 'large': fontSizeValue = '22px'; break;
    default: fontSizeValue = '18px'; // medium
  };
  
  currentBox = document.createElement('div');
  currentBox.style.cssText = `
    position: absolute;
    left: ${rect.left + window.scrollX}px;
    top: ${rect.bottom + window.scrollY}px;
    background-color: white;
    border: 1px solid black;
    padding: 5px;
    font-size: ${fontSizeValue};
  `;

  const translatedText = await useTranslator(selection.toString());
  currentBox.textContent = translatedText;

  document.body.appendChild(currentBox);
};