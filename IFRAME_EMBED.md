# iFrame Embedding Guide

This application is configured to be embedded in iframes on external websites.

## Basic Embedding

Use this HTML code to embed the application:

```html
<iframe
  src="YOUR_APP_URL"
  width="100%"
  height="800"
  frameborder="0"
  allow="camera; microphone; fullscreen; clipboard-read; clipboard-write"
  sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals allow-downloads"
>
</iframe>
```

## Configuration

The application includes the following iframe-friendly configurations:

### 1. Server Headers
- `X-Frame-Options: ALLOWALL` - Allows embedding in any domain
- Configured in `vite.config.ts` for both dev and preview servers

### 2. Recommended iframe Attributes

**allow**: Grants necessary permissions
- `camera` - For image uploads via camera
- `microphone` - For potential audio features
- `fullscreen` - Allow fullscreen mode
- `clipboard-read; clipboard-write` - For copy/paste functionality

**sandbox**: Security restrictions (recommended)
- `allow-same-origin` - Access to same-origin resources
- `allow-scripts` - JavaScript execution
- `allow-forms` - Form submission
- `allow-popups` - Open popups/new windows
- `allow-modals` - Display modal dialogs
- `allow-downloads` - Download generated files

### 3. Responsive Sizing

For responsive embedding:

```html
<div style="position: relative; width: 100%; padding-bottom: 75%; /* 4:3 aspect ratio */">
  <iframe
    src="YOUR_APP_URL"
    style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;"
    frameborder="0"
  >
  </iframe>
</div>
```

## Testing

A demo page is included at `iframe-demo.html` that shows the application embedded in an iframe. Open this file in a browser to test the embedding.

## Security Considerations

When embedding on external domains:

1. **CORS**: The application is configured to work across domains
2. **API Keys**: Sensitive data is managed through the parent window postMessage API
3. **Authentication**: Login state is preserved within the iframe
4. **Storage**: Uses localStorage scoped to the iframe's origin

## Cross-Origin Communication

The application supports postMessage API for parent-to-iframe communication:

```javascript
// From parent window
iframe.contentWindow.postMessage({
  type: 'API_KEY',
  payload: { apiKey: 'your-api-key' }
}, '*');
```

## Common Issues

### Issue: "Refused to display in a frame"
**Solution**: Ensure your server is sending the correct `X-Frame-Options` header or remove it entirely.

### Issue: Features not working in iframe
**Solution**: Add the necessary permissions to the `allow` attribute.

### Issue: Mobile responsive problems
**Solution**: Add `viewport-fit=cover` meta tag and ensure proper CSS viewport units.

## Production Deployment

When deploying to production, configure your web server to send appropriate headers:

**Nginx:**
```nginx
add_header X-Frame-Options "ALLOWALL";
```

**Apache:**
```apache
Header set X-Frame-Options "ALLOWALL"
```

**Netlify (_headers file):**
```
/*
  X-Frame-Options: ALLOWALL
```

**Vercel (vercel.json):**
```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Frame-Options",
          "value": "ALLOWALL"
        }
      ]
    }
  ]
}
```
