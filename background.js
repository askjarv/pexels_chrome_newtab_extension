// Check if API key exists when extension is installed or updated
chrome.runtime.onInstalled.addListener(async () => {
  const data = await chrome.storage.local.get('pexelsApiKey');
  if (!data.pexelsApiKey) {
    // Open setup page if API key is not set
    chrome.tabs.create({
      url: 'setup.html'
    });
  }
  
  // Set up refresh alarm
  chrome.alarms.create('refreshImage', {
    periodInMinutes: 30
  });
});

// Handle extension icon click
chrome.action.onClicked.addListener(() => {
  chrome.tabs.create({
    url: 'setup.html'
  });
});

// Handle alarm
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'refreshImage') {
    // Instead of just removing, set a flag indicating need for refresh
    chrome.storage.local.set({
      needsRefresh: true
    });
  }
}); 