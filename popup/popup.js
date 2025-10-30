document.addEventListener('DOMContentLoaded', loadSettings);
document.getElementById('saveSettings').addEventListener('click', saveSettings);

async function loadSettings() {
  const result = await chrome.storage.sync.get(['sourceLanguage', 'targetLanguage']);
  
  document.getElementById('sourceLanguage').value = result.sourceLanguage || 'auto';
  document.getElementById('targetLanguage').value = result.targetLanguage || 'en';
}

async function saveSettings() {
  const settings = {
    sourceLanguage: document.getElementById('sourceLanguage').value,
    targetLanguage: document.getElementById('targetLanguage').value,
    fontSize: document.getElementById('fontSize').value,
  };
  
  await chrome.storage.sync.set(settings);
  
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    console.log('Current tab:', tabs[0].url);
    
    // Small delay to ensure content script is ready
    setTimeout(() => {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: "updateSettings",
        data: settings
      }, (response) => {
        if (chrome.runtime.lastError) {
          console.log('Content script not available:', chrome.runtime.lastError.message);
        } else {
          console.log('Settings sent successfully');
        }
      });
    }, 100);
  });
}