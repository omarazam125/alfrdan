# Hamsa Integration Guide

This guide explains how the Omantel customer service dashboard integrates with the Hamsa AI voice platform.

## Overview

The dashboard uses Hamsa's API to create outbound voice calls with AI-powered agents that can handle various customer service scenarios in both Arabic and English.

## Architecture

### Core Components

1. **Hamsa Client Library** (`lib/hamsa-client.ts`)
   - Wrapper around Hamsa REST API
   - Handles authentication and request formatting
   - Provides type-safe methods for all Hamsa operations

2. **API Routes** (`app/api/hamsa/`)
   - `/call` - Initiate outbound calls
   - `/jobs` - Retrieve call history
   - `/jobs/[id]` - Get specific job details
   - `/jobs/[id]/end` - End active calls (via Twilio)
   - `/status` - Check Hamsa connection
   - `/analytics` - Get statistics
   - `/recordings` - Fetch call recordings
   - `/transcripts` - Get call transcripts

3. **Pages** (`app/`)
   - Dashboard - Overview and analytics
   - Calls - Make and monitor calls
   - Logs - Call history
   - Recordings - Audio playback
   - Transcripts - Text conversations

## Environment Variables

Required environment variables:

\`\`\`bash
# Hamsa API Configuration
HAMSA_API_KEY=Token_xxxxxxxxxxxxx
HAMSA_BASE_URL=https://api.tryhamsa.com/v1

# Voice Agent ID (required)
HAMSA_VOICE_AGENT_ID=d949f13f-40d2-4e48-ac86-b66633070603

# Phone number for outbound calls
HAMSA_PHONE_NUMBER=+1234567890     # Your Twilio number

# Twilio (for call termination)
TWILIO_ACCOUNT_SID=ACxxxxx
TWILIO_AUTH_TOKEN=xxxxx

# Optional
HAMSA_PROJECT_ID=uuid-xxxx-xxxx   # Only if auto-fetch fails
NEXT_PUBLIC_API_BASE_URL=https://your-domain.com
\`\`\`

**Note:** 
- `HAMSA_PROJECT_ID` is optional. The system automatically fetches it from your API key using the `/projects` endpoint.
- `HAMSA_VOICE_AGENT_ID` is required. The system now uses a pre-configured Voice Agent from the Hamsa Dashboard.

## How It Works

### Making a Call

1. User selects a scenario (payment reminder, account inquiry, etc.)
2. User fills in customer details and variables
3. System extracts dynamic variables from the scenario
4. API call is made to Hamsa with:
   - Customer phone number
   - Voice Agent ID (pre-configured in Hamsa)
   - Dynamic parameters (customerName, accountBalance, etc.)
   - Language setting
5. Hamsa uses your pre-configured agent with the dynamic variables
6. System polls for call status updates

### Call Scenarios

Scenarios are defined in `lib/call-scenarios.ts`:
- Payment Reminder
- Account Inquiry
- Service Upgrade
- Technical Support

Each scenario includes:
- System prompt (Arabic & English)
- First message template
- Variable placeholders
- Form field definitions

### Voice Agent Configuration

The system now uses a pre-configured Voice Agent from Hamsa Dashboard:

\`\`\`typescript
{
  phoneNumber: "+1234567890",
  toNumber: "+96812345678",
  voiceAgentId: "d949f13f-40d2-4e48-ac86-b66633070603",
  params: { 
    customerName: "Ahmed",
    accountBalance: "100",
    dueDate: "15 January 2025",
    scenario: "payment-reminder",
    language: "ar",
    ...otherVariables 
  }
}
\`\`\`

This ensures that:
1. All voice settings are managed in Hamsa Dashboard
2. You can test and modify prompts without redeploying code
3. Dynamic variables are properly substituted in your prompts
4. Consistent voice quality and behavior across all calls

**Setting up your Voice Agent in Hamsa:**
1. Create a Voice Agent in Hamsa Dashboard
2. Add your system prompt with placeholders like `{{customerName}}`
3. Configure voice, language, and behavior settings
4. Get the Voice Agent ID
5. Set it as `HAMSA_VOICE_AGENT_ID` environment variable

## API Methods

### HamsaClient Methods

\`\`\`typescript
// Create call with custom phone number
createCallWithPhoneNumber(params: HamsaCallParams)

// Create call with Hamsa's default numbers
createCall(params: HamsaCallParams)

// Get list of jobs/calls
getJobs(projectId: string, filter?: HamsaJobsFilter)

// Get specific job details
getJobDetails(jobId: string, options?: { search?: string; speaker?: string })

// Get voice agents
getVoiceAgents(skip?: number, take?: number)

// Get statistics
getStatisticsNumbers()
getStatisticsChart()

// Check connection
checkStatus()
\`\`\`

### Job Status Mapping

Hamsa uses different status codes:
- `PENDING` → "queued" or "ringing"
- `COMPLETED` → "completed"
- `FAILED` → "failed"

## Real-time Updates

The dashboard polls for updates every 5 seconds for:
- Live calls on the Calls page
- Dashboard statistics
- Call history in Logs

## Call Termination

Hamsa doesn't provide a direct "end call" endpoint. We use Twilio's API to terminate active calls:

\`\`\`typescript
// Store Twilio Call SID when call is created
// Use it to end the call
await twilioClient.calls(callSid).update({ status: "completed" })
\`\`\`

## Error Handling

Common errors and solutions:

1. **HAMSA_API_KEY not set**
   - Add API key to environment variables
   - Publish changes

2. **HAMSA_PROJECT_ID missing**
   - Get project ID from Hamsa dashboard
   - Add to environment variables

3. **Connection failed**
   - Check API key is valid
   - Verify base URL is correct
   - Ensure network can reach Hamsa API

4. **Call failed to initiate**
   - Verify phone numbers are in correct format
   - Check voice agent ID if using pre-configured agent
   - Review agent details structure

## Testing

To test the integration:

1. Check connection status on the dashboard
2. Make a test call to your own phone number
3. Monitor the call in the Live Calls section
4. End the call using the terminate button
5. Review call details in Logs
6. Check recording in Recordings page
7. View transcript in Transcripts page

## Troubleshooting

### "Connection Failed" on Dashboard

1. Verify `HAMSA_API_KEY` is set correctly
2. Check `HAMSA_BASE_URL` is accessible
3. Test API key with curl:

\`\`\`bash
curl -H "Authorization: Token YOUR_KEY" \
     https://api.tryhamsa.com/v1/projects
\`\`\`

### "projectId undefined" Errors

If you see `projectId=undefined` errors in console:

1. The system will first try to auto-fetch projectId from `/projects` endpoint
2. Check console logs for the response structure
3. If auto-fetch fails, manually set `HAMSA_PROJECT_ID` in environment variables
4. Get your project ID from Hamsa dashboard Settings
5. Republish after adding the variable

### Call Using Voice Agent from Hamsa

The system now always uses your pre-configured Voice Agent from Hamsa:

1. Make sure `HAMSA_VOICE_AGENT_ID` is set correctly in environment variables
2. Verify the Voice Agent exists in your Hamsa Dashboard
3. Check the API call logs - you should see the voiceAgentId being sent
4. Dynamic variables from your dashboard are passed in the `params` object
5. Update your Voice Agent prompts in Hamsa Dashboard to use `{{variableName}}` syntax

## Security Considerations

1. **API Keys**: Never expose Hamsa API keys in client-side code
2. **Phone Numbers**: Validate and sanitize phone number inputs
3. **Rate Limiting**: Implement rate limiting for API calls
4. **CORS**: Configure CORS properly for production
5. **Environment Variables**: Use secure methods to store and access credentials

## Best Practices

1. Always handle API errors gracefully
2. Implement proper loading states
3. Provide clear user feedback
4. Log errors for debugging
5. Use TypeScript types for all Hamsa responses
6. Test scenarios thoroughly before deployment
7. Monitor API usage and costs
8. Keep prompts and scenarios up to date

## Migration from Vapi

If migrating from Vapi:

1. Replace `VAPI_API_KEY` with `HAMSA_API_KEY`
2. Update all API route calls from `/api/vapi/*` to `/api/hamsa/*`
3. Replace `VAPIConnectionStatus` with `HamsaConnectionStatus`
4. Update call initiation logic to use Hamsa's format
5. Adjust status mapping (Vapi uses different status codes)
6. Test all functionality thoroughly

## Resources

- [Hamsa API Documentation](https://docs.tryhamsa.com/api-reference/)
- [Hamsa Dashboard](https://dashboard.tryhamsa.com)
- [Voice Agent Configuration Guide](https://docs.tryhamsa.com/voice-agents)
- [Twilio API Reference](https://www.twilio.com/docs/voice/api)

## Support

For issues specific to:
- **Hamsa API**: Contact Hamsa support
- **Dashboard**: Check GitHub issues or contact development team
- **Twilio**: Refer to Twilio documentation

---

**Last Updated**: December 2024
**Version**: 2.0.0 (Hamsa Integration)
