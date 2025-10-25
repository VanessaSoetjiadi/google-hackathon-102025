console.log("Hello Content")

document.addEventListener('mouseup', () => {
  const selectedText = window.getSelection().toString();
  if (selectedText.length > 0) {
    console.log("Selected Text:", selectedText);
  };
});