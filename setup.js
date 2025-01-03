document.addEventListener('DOMContentLoaded', async () => {
  // Load existing settings
  const settings = await chrome.storage.local.get([
    'pexelsApiKey', 
    'searchTerm',
    'greeting',
    'use24Hour',
    'showQuote'
  ]);
  
  if (settings.pexelsApiKey) {
    document.getElementById('apiKey').value = settings.pexelsApiKey;
  }
  if (settings.searchTerm) {
    document.getElementById('searchTerm').value = settings.searchTerm;
  }
  if (settings.greeting) {
    document.getElementById('greeting').value = settings.greeting;
  }
  if (settings.use24Hour) {
    document.getElementById('use24Hour').checked = settings.use24Hour;
  }
  if (settings.showQuote) {
    document.getElementById('showQuote').checked = settings.showQuote;
  }
});

document.getElementById('saveButton').addEventListener('click', async () => {
  const apiKey = document.getElementById('apiKey').value.trim();
  const searchTerm = document.getElementById('searchTerm').value.trim();
  const greeting = document.getElementById('greeting').value.trim();
  const use24Hour = document.getElementById('use24Hour').checked;
  const showQuote = document.getElementById('showQuote').checked;
  const errorElement = document.getElementById('error');
  
  if (!apiKey) {
    errorElement.style.display = 'block';
    return;
  }
  
  // Validate the API key by making a test request
  try {
    const response = await fetch('https://api.pexels.com/v1/curated?per_page=1', {
      headers: {
        'Authorization': apiKey
      }
    });
    
    if (!response.ok) {
      throw new Error('Invalid API key');
    }
    
    // Save all settings
    await chrome.storage.local.set({ 
      pexelsApiKey: apiKey,
      searchTerm: searchTerm,
      greeting: greeting,
      use24Hour: use24Hour,
      showQuote: showQuote
    });
    
    // Close the setup tab
    window.close();
  } catch (error) {
    errorElement.textContent = 'Invalid API key. Please check and try again.';
    errorElement.style.display = 'block';
  }
}); 