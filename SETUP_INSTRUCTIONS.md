# Omantel Hamsa Dashboard - Setup Instructions

## Overview

This dashboard integrates with Hamsa AI voice platform to provide automated customer service calls for Omantel. The system has been migrated from Vapi to Hamsa for enhanced Arabic language support and better voice quality.

## Environment Variables Setup

You need to add the following environment variables to your project. Go to the **Vars** section in the in-chat sidebar to add them.

### Required Environment Variables

1. **HAMSA_API_KEY** (Required)
   - Your Hamsa API key from https://dashboard.tryhamsa.com
   - Example: `Token_xxxxxxxxxxxxxxxxxxxxx`
   - Keep this secure - do NOT use `NEXT_PUBLIC_` prefix
   - Note: The project ID will be automatically fetched from this key

2. **HAMSA_BASE_URL** (Optional)
   - Default: `https://api.tryhamsa.com/v1`
   - Only change if Hamsa provides a different endpoint

3. **HAMSA_PHONE_NUMBER** (Required for calls)
   - Your Twilio phone number registered with Hamsa
   - Format: `+1234567890`
   - Example: `+96812345678`

4. **HAMSA_VOICE_AGENT_ID** (Required for calls)
   - Your Voice Agent ID from Hamsa Dashboard
   - Example: `d949f13f-40d2-4e48-ac86-b66633070603`
   - This is the pre-configured agent in Hamsa with your scenarios

### Twilio Configuration (Required for Call Control)

5. **TWILIO_ACCOUNT_SID** (Required)
   - Your Twilio account SID
   - Example: `ACxxxxxxxxxxxxxxxxxxxxx`

6. **TWILIO_AUTH_TOKEN** (Required)
   - Your Twilio auth token
   - Keep this secure

### Optional Variables

7. **HAMSA_PROJECT_ID** (Optional)
   - Your Hamsa project ID
   - Only needed if automatic project ID fetching fails
   - Example: `550e8400-e29b-41d4-a716-446655440000`
   - System will try to fetch this automatically from your API key

8. **NEXT_PUBLIC_API_BASE_URL** (Optional)
   - Your deployment URL for webhooks
   - Example: `https://your-domain.vercel.app`

## How to Add Environment Variables

### Using v0 Interface:
1. Click the **Settings** icon in the left sidebar
2. Select **Vars** tab
3. Click **Add Variable**
4. Enter the variable name (e.g., `HAMSA_API_KEY`)
5. Enter the value
6. Click **Save**
7. Click **Publish** to deploy with new variables

## Getting Your Hamsa Credentials

### 1. Create Hamsa Account
1. Go to https://dashboard.tryhamsa.com
2. Sign up or log in
3. Create a new project

### 2. Get Your API Key
1. In Hamsa dashboard, go to **Settings** → **API Keys**
2. Create a new API key
3. Copy the key (starts with `Token_`)
4. Add it as `HAMSA_API_KEY` in your environment variables

### 3. Get Your Project ID

**Note:** The system now automatically fetches your project ID from the API key. You only need to set it manually if auto-fetch fails.

**Manual Setup (if needed):**
1. In Hamsa dashboard, go to **Settings** → **Project**
2. Copy your Project ID
3. Add it as `HAMSA_PROJECT_ID` in environment variables

### 4. Create Voice Agent in Hamsa

**This is now required:**

1. In Hamsa Dashboard, go to **Voice Agents**
2. Click **Create New Voice Agent**
3. Configure your agent:
   - Name: "Agent Omar" or your preferred name
   - Language: Arabic (ar)
   - Configure voice settings (ElevenLabs, speed, stability)
   - Add your system prompt with dynamic variables like `{{customerName}}`, `{{accountBalance}}`
   - Set greeting message
   - Configure other settings (silence threshold, interrupt, etc.)
4. Save the agent
5. Copy the Voice Agent ID (UUID format)
6. Add it as `HAMSA_VOICE_AGENT_ID` in environment variables

**Important:** The system now uses your pre-configured Voice Agent from Hamsa. All prompts and settings are managed in Hamsa Dashboard, not in the code. You only pass dynamic variables from the dashboard.

### 5. Add Phone Number
1. Configure your Twilio number in Hamsa dashboard
2. Copy your phone number
3. Add it as `HAMSA_PHONE_NUMBER`

## Testing the Integration

1. After adding environment variables, publish your app
2. Wait for deployment to complete (1-2 minutes)
3. Refresh the dashboard
4. You should see a green "Connected to Hamsa AI Platform" status
5. Go to the **Calls** page
6. Click **Make New Call**
7. Fill in customer details
8. Select a scenario (Payment Reminder, Account Inquiry, etc.)
9. Choose language (Arabic or English)
10. Click **Start Call with Agent Omar**

## Troubleshooting

### Connection Status Shows "Offline"

**Possible causes:**
1. `HAMSA_API_KEY` is missing or invalid
2. Network cannot reach Hamsa API

**Solutions:**
1. Verify all environment variables are set correctly in Vars section
2. Check your Hamsa API key is valid (test with curl):
   \`\`\`bash
   curl -H "Authorization: Token YOUR_KEY" \
        https://api.tryhamsa.com/v1/projects
   \`\`\`
3. Ensure your Hamsa account is active
4. Check browser console for detailed error messages
5. Click the refresh button on the connection status card

### Calls Not Working

**Possible causes:**
1. Phone number not configured
2. Twilio credentials missing
3. Invalid phone number format

**Solutions:**
1. Verify `HAMSA_PHONE_NUMBER` is set and in E.164 format (+country code + number)
2. Check `TWILIO_ACCOUNT_SID` and `TWILIO_AUTH_TOKEN` are correct
3. Ensure customer phone number is in correct format
4. Check that you have sufficient credits in Hamsa account
5. Review API logs in Hamsa dashboard for errors

### Environment Variables Not Loading

**Solutions:**
1. After adding variables, you MUST click **Publish**
2. Wait for deployment to complete (status will show in bottom right)
3. Hard refresh the page (Cmd/Ctrl + Shift + R)
4. Check Vars section to confirm variables are saved

### "HAMSA_PROJECT_ID not configured" Error

**This should rarely occur** as the project ID is now fetched automatically. If you still see it:

1. Ensure `HAMSA_API_KEY` is valid
2. Check that your API key has access to project information
3. Check browser console for the `/projects` endpoint response
4. If auto-fetch consistently fails, manually add `HAMSA_PROJECT_ID`:
   - Get ID from Hamsa dashboard Settings → Project
   - Add to Vars section
   - Republish

### Calls Using Wrong Scenario

**Symptom:** Calls use a Hamsa-configured agent instead of your dashboard scenarios.

**Solutions:**
1. Make sure `HAMSA_VOICE_AGENT_ID` is NOT set in environment variables
2. Remove it from Vars if present
3. Republish the app
4. The system should now always send custom `agentDetails` with your scenarios
5. Check console logs for "Using custom scenario" message

## Features Overview

### Dashboard
- Real-time call statistics
- Active calls monitoring
- Success rate tracking
- Average call duration

### Calls Page
- Make new outbound calls
- Monitor live calls in real-time
- End active calls
- Multiple scenario support
- Bilingual (Arabic/English)

### Logs Page
- Complete call history
- Filter by status
- Search by customer name or phone
- Generate detailed reports

### Recordings Page
- Listen to call recordings
- Audio player with controls
- Download recordings
- Search and filter

### Transcripts Page
- Read call transcripts
- Arabic and English support
- Search within transcripts
- Export transcripts

## Call Scenarios

The system supports multiple pre-built scenarios:

1. **Payment Reminder** - Remind customers about due payments
2. **Account Inquiry** - Handle general account questions
3. **Service Upgrade** - Offer service upgrades
4. **Technical Support** - Provide technical assistance

Each scenario includes:
- Custom system prompt
- First message template
- Variable placeholders
- Form fields for customer data

## Security Best Practices

1. Never expose API keys in client-side code
2. Use server-side routes for all API calls
3. Validate and sanitize all user inputs
4. Keep Twilio credentials secure
5. Regularly rotate API keys
6. Monitor API usage for unusual activity

## Migration from Vapi

This dashboard was migrated from Vapi to Hamsa. Key changes:

1. API endpoints changed from `/api/vapi/*` to `/api/hamsa/*`
2. Authentication uses Hamsa API keys
3. Job-based architecture instead of call-based
4. Different status codes (PENDING, COMPLETED, FAILED)
5. Enhanced Arabic language support

## Support & Resources

- **Hamsa Documentation**: https://docs.tryhamsa.com
- **Hamsa Dashboard**: https://dashboard.tryhamsa.com
- **Hamsa Support**: Contact via dashboard
- **Integration Guide**: See `HAMSA_INTEGRATION_GUIDE.md`
- **Twilio Docs**: https://www.twilio.com/docs

## Next Steps

Once your environment is configured:

1. Test connection status on dashboard
2. Make a test call to verify setup
3. Configure voice agent settings in Hamsa dashboard
4. Import your customer list
5. Start making automated calls
6. Monitor call quality and adjust prompts as needed
7. Review call analytics regularly

---

**Version**: 2.0.0 (Hamsa Integration)  
**Last Updated**: December 2024  
**Platform**: Hamsa AI Voice Platform
