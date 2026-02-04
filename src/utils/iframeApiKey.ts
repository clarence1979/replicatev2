// Utility for handling API key communication between iframe and parent window

let parentProvidedApiKey: string | null = null;

export function isInIframe(): boolean {
  try {
    return window.self !== window.top;
  } catch (e) {
    return true;
  }
}

export function getParentApiKey(): string | null {
  return parentProvidedApiKey;
}

export function setParentApiKey(key: string): void {
  parentProvidedApiKey = key;
}

export function initIframeListener(): void {
  if (!isInIframe()) {
    return;
  }

  // Listen for messages from parent window
  window.addEventListener('message', (event) => {
    // Handle different message formats
    if (event.data && typeof event.data === 'object') {
      // Format 1: { type: 'replicate-api-key', key: '...' }
      if (event.data.type === 'replicate-api-key' && event.data.key) {
        setParentApiKey(event.data.key);
        console.log('Replicate API key received from parent window');
      }
      // Format 2: { replicateApiKey: '...' }
      else if (event.data.replicateApiKey) {
        setParentApiKey(event.data.replicateApiKey);
        console.log('Replicate API key received from parent window');
      }
      // Format 3: { replicate_api_key: '...' }
      else if (event.data.replicate_api_key) {
        setParentApiKey(event.data.replicate_api_key);
        console.log('Replicate API key received from parent window');
      }
    }
    // Format 4: Direct string (API key)
    else if (typeof event.data === 'string' && event.data.startsWith('r8_')) {
      setParentApiKey(event.data);
      console.log('Replicate API key received from parent window');
    }
  });

  // Request API key from parent on load
  if (window.parent) {
    window.parent.postMessage({ type: 'request-replicate-api-key' }, '*');
  }
}
