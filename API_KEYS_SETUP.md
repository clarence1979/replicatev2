# API Keys Setup Guide

## Overview
The application now uses a centralized authentication system where students log in with their credentials, and API keys are stored securely in the database.

## Database Tables Created

### 1. `login` table
Contains student credentials:
- **20 students** with usernames: clarence, kiisi, elise, olivia, annabel, ashton, isaiah, reggie, isaac, aaveer, jeriel, ethan, jake, niamh, sidh, hamish, arnavc, ruibin, jackson, lucas
- All passwords are set to: `12345678`

### 2. `api_secrets` table
Contains the API keys used by all students:
- `replicate_api` - Replicate API key
- `meshy_api` - Meshy API key

## How to Update API Keys

You need to update the placeholder API keys in the `api_secrets` table with your actual keys.

### Using Supabase Dashboard:

1. Go to your Supabase project dashboard
2. Navigate to the "Table Editor"
3. Select the `api_secrets` table
4. Update the `key_value` column for:
   - Row with `key_name` = 'replicate_api' → Set to your actual Replicate API key
   - Row with `key_name` = 'meshy_api' → Set to your actual Meshy API key

### Using SQL:

Run this SQL in the Supabase SQL Editor:

```sql
-- Update Replicate API key
UPDATE api_secrets
SET key_value = 'r8_YOUR_ACTUAL_REPLICATE_KEY_HERE', updated_at = now()
WHERE key_name = 'replicate_api';

-- Update Meshy API key
UPDATE api_secrets
SET key_value = 'YOUR_ACTUAL_MESHY_KEY_HERE', updated_at = now()
WHERE key_name = 'meshy_api';
```

## How Students Use the System

1. Students click the **gear icon** at the top right (red when not logged in)
2. Enter their username and password
3. Optionally check "Remember me" to save credentials locally
4. Upon successful login:
   - The gear icon turns **green**
   - API keys are automatically retrieved from the database
   - Students can start using the application
5. Click the **logout icon** to log out

## Security Notes

- Passwords are stored in plaintext (for educational purposes only)
- API keys are shared among all students
- Login credentials can be remembered locally in browser
- For production use, implement proper password hashing and individual API key management
