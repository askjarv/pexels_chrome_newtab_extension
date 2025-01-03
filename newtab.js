// Remove the hardcoded API key constant
// const PEXELS_API_KEY = 'YOUR_PEXELS_API_KEY';

async function fetchNewImage() {
  try {
    // Get the API key and search term from storage
    const data = await chrome.storage.local.get(['pexelsApiKey', 'searchTerm']);
    if (!data.pexelsApiKey) {
      // Redirect to setup page if API key is not set
      window.location.href = 'setup.html';
      return;
    }

    // Show some loading state
    document.querySelector('.container').style.opacity = '0.5';
    document.getElementById('refreshButton').disabled = true;

    // Determine which API endpoint to use
    const baseUrl = data.searchTerm 
      ? `https://api.pexels.com/v1/search?query=${encodeURIComponent(data.searchTerm)}&per_page=1&page=` 
      : 'https://api.pexels.com/v1/curated?per_page=1&page=';
    
    const response = await fetch(baseUrl + Math.floor(Math.random() * 100), {
      headers: {
        'Authorization': data.pexelsApiKey
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch image');
    }
    
    const imageData = await response.json();
    if (!imageData.photos || imageData.photos.length === 0) {
      throw new Error('No images found for this search term');
    }
    
    const photo = imageData.photos[0];
    
    // Save image data to storage
    await chrome.storage.local.set({
      currentImage: {
        url: photo.src.original,
        photographer: photo.photographer,
        photographerUrl: photo.photographer_url,
        timestamp: Date.now()
      },
      needsRefresh: false
    });
    
    await updateBackground(photo.src.original, photo.photographer, photo.photographer_url);
  } catch (error) {
    console.error('Error fetching image:', error);
    // If there's an error with the search term, fall back to curated photos
    if (data.searchTerm) {
      await chrome.storage.local.set({ searchTerm: '' });
      await fetchNewImage();
    }
  } finally {
    // Reset loading state
    document.querySelector('.container').style.opacity = '1';
    document.getElementById('refreshButton').disabled = false;
  }
}

async function updateBackground(imageUrl, photographer, photographerUrl) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      // Remove any existing background image
      const existingBg = document.querySelector('.background-image');
      if (existingBg) {
        existingBg.remove();
      }

      // Create new image element
      const bgImg = document.createElement('img');
      bgImg.src = imageUrl;
      bgImg.className = 'background-image';
      
      // Add the image to the container
      document.querySelector('.container').prepend(bgImg);
      
      // Update photographer info
      document.getElementById('photographerName').textContent = photographer;
      document.getElementById('photographerLink').href = photographerUrl;
      resolve();
    };
    img.src = imageUrl;
  });
}

async function updateDateTime() {
  // Get settings for time format and greeting
  const settings = await chrome.storage.local.get(['use24Hour', 'greeting']);
  const now = new Date();
  
  // Update greeting if set
  const greetingElement = document.getElementById('greeting');
  if (settings.greeting) {
    greetingElement.textContent = settings.greeting;
  }
  
  // Update time with format preference
  const timeStr = now.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: !settings.use24Hour // Use 24-hour format if selected
  });
  document.getElementById('time').textContent = timeStr;
  
  // Update date
  const dateStr = now.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  });
  document.getElementById('date').textContent = dateStr;
}

// Add this new function to fetch and display quotes
async function updateQuote() {
  try {
    const settings = await chrome.storage.local.get('showQuote');
    const quoteContainer = document.getElementById('quoteContainer');
    
    if (!settings.showQuote) {
      quoteContainer.style.display = 'none';
      return;
    }

    const response = await fetch('https://api.quotable.io/random');
    if (!response.ok) {
      throw new Error('Failed to fetch quote');
    }

    const data = await response.json();
    
    document.getElementById('quote').textContent = `"${data.content}"`;
    document.getElementById('quoteAuthor').textContent = `- ${data.author}`;
    quoteContainer.style.display = 'block';
  } catch (error) {
    console.error('Error fetching quote:', error);
    document.getElementById('quoteContainer').style.display = 'none';
  }
}

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  // Set up refresh button with proper error handling
  document.getElementById('refreshButton').addEventListener('click', async () => {
    try {
      await fetchNewImage();
    } catch (error) {
      console.error('Error refreshing image:', error);
    }
  });
  
  // Update date/time immediately and every second
  await updateDateTime(); // Make sure to await the first call
  setInterval(updateDateTime, 1000);
  
  // Try to load existing image from storage
  const data = await chrome.storage.local.get(['currentImage', 'needsRefresh']);
  if (data.currentImage && !data.needsRefresh) {
    const { url, photographer, photographerUrl, timestamp } = data.currentImage;
    
    // Check if image is older than 30 minutes
    if (Date.now() - timestamp > 30 * 60 * 1000) {
      await fetchNewImage();
    } else {
      await updateBackground(url, photographer, photographerUrl);
    }
  } else {
    await fetchNewImage();
  }

  // Add this to the DOMContentLoaded event listener
  document.getElementById('settingsButton').addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });

  // Add quote initialization
  await updateQuote();
  
  // Update quote every hour
  setInterval(updateQuote, 60 * 60 * 1000);
}); 