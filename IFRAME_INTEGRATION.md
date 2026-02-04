# Iframe Integration Guide

This application can run in an iframe and receive the Replicate API key from the parent window.

## How It Works

When the application is loaded in an iframe, it will:
1. Automatically detect that it's running in an iframe
2. Request the Replicate API key from the parent window
3. Listen for messages from the parent window containing the API key
4. Use the provided API key for all Replicate API requests
5. Fall back to the database-stored API key if no key is provided from the parent

## Sending the API Key from Parent Window

The parent window can send the Replicate API key to the iframe using any of the following formats:

### Option 1: Using postMessage with type (Recommended)
```javascript
const iframe = document.getElementById('your-iframe-id');
iframe.contentWindow.postMessage({
  type: 'replicate-api-key',
  key: 'r8_your_api_key_here'
}, '*');
```

### Option 2: Using postMessage with camelCase property
```javascript
iframe.contentWindow.postMessage({
  replicateApiKey: 'r8_your_api_key_here'
}, '*');
```

### Option 3: Using postMessage with snake_case property
```javascript
iframe.contentWindow.postMessage({
  replicate_api_key: 'r8_your_api_key_here'
}, '*');
```

### Option 4: Sending the key directly as a string
```javascript
iframe.contentWindow.postMessage('r8_your_api_key_here', '*');
```

## Example Parent Page Implementation

```html
<!DOCTYPE html>
<html>
<head>
  <title>Parent Page</title>
</head>
<body>
  <iframe id="replicate-app" src="https://your-app-url.com" width="100%" height="800px"></iframe>

  <script>
    const iframe = document.getElementById('replicate-app');
    const REPLICATE_API_KEY = 'r8_your_api_key_here';

    // Wait for iframe to load
    iframe.addEventListener('load', () => {
      // Send API key to iframe
      iframe.contentWindow.postMessage({
        type: 'replicate-api-key',
        key: REPLICATE_API_KEY
      }, '*');
    });

    // Listen for requests from iframe
    window.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'request-replicate-api-key') {
        // Iframe is requesting the API key
        iframe.contentWindow.postMessage({
          type: 'replicate-api-key',
          key: REPLICATE_API_KEY
        }, '*');
      }
    });
  </script>
</body>
</html>
```

## Security Considerations

- The application accepts messages from any origin (`'*'`). In production, you should specify the exact origin of the parent window for security.
- The API key is transmitted via postMessage. Ensure both the parent and iframe pages are served over HTTPS.
- The API key is not stored in localStorage when provided from the parent window, maintaining better security.

## Fallback Behavior

If no API key is provided from the parent window, the application will automatically fall back to using the API key stored in the Supabase database (configured by the admin).
