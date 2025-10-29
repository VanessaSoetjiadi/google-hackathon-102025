console.log("Hello Content")

let currentBox = null;
let translatorReady = false;
let langDetectorReady = false;

// Initialize translator once on page load
(async function initializeTranslator() {
  if (translatorReady) return;

  try {
    const availability = await Translator.availability({
      sourceLanguage: 'en',
      targetLanguage: 'fr',
    });
    
    if (availability === 'downloadable') {
      await Translator.create({
        sourceLanguage: 'en',
        targetLanguage: 'fr',
        monitor(m) {
          m.addEventListener('downloadprogress', (e) => {
            console.log(`Downloaded ${e.loaded}%`);
          });
        },
      });
    }
    
    translatorReady = true;
  } catch (error) {
    console.log("Error initializing translator:", error);
  };
})();

// Initialize language detection once on page load
(async function initializeLangDetector() {
  if (langDetectorReady) return;

  try {
    const availability = await LanguageDetector.availability();
    
    if (availability === 'downloadable') {
      await LanguageDetector.create({
        monitor(m) {
          m.addEventListener('downloadprogress', (e) => {
            console.log(`Downloaded ${e.loaded*100}%`);
          });
        },
      });
    }
    
    langDetectorReady = true;
  } catch (error) {
    console.log("Error initializing language detector:", error);
  };
})();

// Use language detector to detect language
async function useLangDetector(text) {
  const detector = await LanguageDetector.create();

  const results = await detector.detect(text);
  return results[0].detectedLanguage;
};

// Use translator API to translate text
async function useTranslator(text) {
  const settings = await chrome.storage.sync.get(['sourceLanguage', 'targetLanguage']);

  if (settings.sourceLanguage === 'auto') {
    settings.sourceLanguage = await useLangDetector(text);
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
    }

    const translator = await Translator.create({
      sourceLanguage,
      targetLanguage,
    });

    const result = await translator.translate(text);
    return result;
  } catch (error) {
    return `Translation error: ${error.message}`;
  }
};

// Creates pop up text below the highlighted text
async function popUpText() {
  if (currentBox) {
    currentBox.remove();
  };

  const selection = window.getSelection();
  if (selection.rangeCount === 0 || selection.toString().trim() === '') return;
  
  const range = selection.getRangeAt(0);
  const rect = range.getBoundingClientRect();
  
  currentBox = document.createElement('div');
  currentBox.style.cssText = `
    position: absolute;
    left: ${rect.left + window.scrollX}px;
    top: ${rect.bottom + window.scrollY}px;
    background-color: white;
    border: 1px solid black;
    padding: 5px;
  `;

  const translatedText = await useTranslator(selection.toString());
  currentBox.textContent = translatedText;

  document.body.appendChild(currentBox);
};

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "updateSettings") {
    console.log('Settings updated:', request.data);
    sendResponse({success: true});
  }
});

document.addEventListener('mouseup', () => {
  popUpText();
});