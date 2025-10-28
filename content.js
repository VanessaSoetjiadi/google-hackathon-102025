console.log("Hello Content")

let currentBox = null;

document.addEventListener('mouseup', () => {
  popUpText();
});

function popUpText() {
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
  currentBox.textContent = selection.toString();

  document.body.appendChild(currentBox);
};

async function translateText() {
  try {
    const capabilities = await navigator.ai.available();

    if (!capabilities.translator) {
      throw new Error('Chrome Translator API not available');
    }
  } catch (error) {
    console.error('Error checking Chrome AI capabilities:', error);
  };
};

currentBox = null;

