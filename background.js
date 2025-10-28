console.log("Hello Background")

async function checkChromeAI() {
    if (!('ai' in navigator)) {
        console.log('Chrome AI APIs not available in this browser');
        return false;
    }
    
    const capabilities = await navigator.ai.available();
    console.log('Available Chrome AI capabilities:', capabilities);
    return capabilities;
}

// Usage
checkChromeAI().then(capabilities => {
    if (capabilities && capabilities.translator) {
        console.log('✅ Chrome Translator API is available!');
    }
});