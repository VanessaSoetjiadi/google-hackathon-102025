console.log("Hello Content")

let currentBox = null;
let translatorReady = false;

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
  }
})();

// Use translator API to translate text
async function useTranslator(text) {
  const translator = await Translator.create({
    sourceLanguage: 'en',
    targetLanguage: 'fr',
  });

  console.log(text.length);

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

document.addEventListener('mouseup', () => {
  popUpText();
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "updateSettings") {
    const { sourceLanguage, targetLanguage } = message.data;
    console.log("Received settings from popup:", sourceLanguage, targetLanguage);
    
    sendResponse({ success: true });
  }
});