console.log("Hello Content")

let currentBox = null;
let translatorReady = false;

// Checks if Translator API is available
document.addEventListener('click', async function initializeTranslator(event) {
  if (translatorReady) return;

  try {
    const translatorAvailability = await Translator.availability({
      sourceLanguage: 'es',
      targetLanguage: 'fr',
    });
    console.log("Translator availability:", translatorAvailability);
    translatorReady = true;

    if (translatorAvailability === 'downloadable') {
      const translator = await Translator.create({
        sourceLanguage: 'es',
        targetLanguage: 'fr',
        monitor(m) {
          m.addEventListener('downloadprogress', (e) => {
            console.log(`Downloaded ${e.loaded * 100}%`);
          });
        },
      });

      return translator;
    };
  } catch (error) {
    console.log("Error initializing translator:", error);
  };
});

async function useTranslator(text) {
  const translator = await Translator.create({
    sourceLanguage: 'en',
    targetLanguage: 'fr',
  });

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