# STC Call Center Dashboard - Features Documentation

## Overview
This dashboard provides a comprehensive call center management system for STC (Saudi Telecom Company) with AI-powered voice agents, multilingual support, and custom prompt templates.

---

## 1. Multilingual Support (Arabic & English)

### Features:
- **Language Selection**: Choose between English and Arabic (Khaleeji/Gulf accent) for each call
- **Voice Configuration**: 
  - Arabic: Uses Azure `ar-AE-FatimaNeural` (UAE Arabic with Khaleeji accent)
  - English: Uses Azure `en-US-AndrewNeural`
- **Speech Recognition**: Automatic language detection with Deepgram Nova-2
- **Dynamic Prompts**: System prompts adapt based on selected language

### How to Use:
1. Go to **Live Calls** page
2. Click **Make New Call**
3. Select **Call Language** (English or Arabic)
4. Fill in customer details
5. Agent Omar will speak in the selected language

---

## 2. Custom Prompt Templates

### Features:
- **Template Management**: Create, save, and manage custom call scenarios
- **Dynamic Variables**: Use placeholders like `{customer_name}`, `{phone_number}`, `{customer_email}`
- **AI-Powered Generation**: Let Gemini AI generate professional prompts for you
- **Reusable Scenarios**: Save templates for future use

### How to Use:
1. Go to **Templates** page
2. Click **Create New Template**
3. Fill in:
   - Template Name
   - Description
   - Required/Optional Fields
4. Either:
   - Write your own system prompt, OR
   - Click **AI Generate Prompt** to let AI create it for you
5. Click **Save Template**
6. Use your custom template in the **Live Calls** page

### AI Prompt Generation:
- Powered by Google Gemini API
- Automatically creates professional, comprehensive prompts
- Includes proper structure, objectives, and closing messages
- Follows STC brand guidelines

---

## 3. Email Field & Webhook Integration

### Features:
- **Email Collection**: Capture customer email for all scenarios
- **Silent Email**: Agent Omar never mentions the email during calls (internal use only)
- **Post-Call Webhook**: Automatically sends call data to n8n webhook after call ends

### Webhook Data Sent:
\`\`\`json
{
  "email": "customer@example.com",
  "phoneNumber": "+973XXXXXXXX",
  "transcript": "Full conversation transcript...",
  "callId": "uuid",
  "customerName": "Customer Name",
  "duration": 120,
  "status": "completed",
  "endedAt": "2025-01-06T...",
  "recordingUrl": "https://..."
}
\`\`\`

### Webhook URL:
`https://omar545454.app.n8n.cloud/webhook/ee4cfe15-bab4-4e8d-973a-2e2d0c9f5b42`

### How It Works:
1. Customer email is collected in the call form
2. Email is stored internally (not mentioned during call)
3. When call ends, webhook automatically triggers
4. n8n receives: Email, Phone Number, and Full Transcript
5. You can use this data for:
   - Email follow-ups
   - CRM updates
   - Analytics
   - Customer service workflows

---

## 4. Built-in Scenarios

### Payment Reminder
- Remind customers about overdue payments
- Collect payment commitments
- Offer payment plan options

### Account Inquiry
- Handle general account questions
- Provide account information
- Assist with service inquiries

### Service Upgrade
- Offer service upgrades
- Explain new features and benefits
- Handle upgrade requests

### Technical Support
- Troubleshoot technical issues
- Guide customers through solutions
- Escalate when needed

---

## Environment Variables Required

\`\`\`env
# VAPI Configuration
VAPI_API_KEY=your-private-api-key
VAPI_ASSISTANT_ID=your-assistant-id
VAPI_BASE_URL=https://api.vapi.ai
VAPI_PHONE_NUMBER_ID=your-phone-number-uuid

# Webhook (Optional - defaults to n8n webhook)
WEBHOOK_URL=https://omar545454.app.n8n.cloud/webhook/ee4cfe15-bab4-4e8d-973a-2e2d0c9f5b42
\`\`\`

---

## API Integrations

### VAPI (Voice AI Platform)
- Voice calls with AI agents
- Speech-to-text and text-to-speech
- Call recording and transcription
- Webhook events

### Google Gemini AI
- API Key: `AIzaSyCEyQByGkrdaCItsERJoy4rIKUWdgL6jPE`
- Used for AI-powered prompt generation
- Creates professional, contextual prompts

### n8n Webhook
- Receives post-call data
- Enables automation workflows
- Integrates with other systems

---

## Best Practices

1. **Always collect customer email** - Required for post-call follow-ups
2. **Choose appropriate language** - Match customer's preferred language
3. **Use custom templates** - Create scenarios specific to your needs
4. **Test AI-generated prompts** - Review and adjust before using in production
5. **Monitor webhook delivery** - Check n8n for successful data receipt

---

## Support

For issues or questions:
1. Check the Settings page for connection status
2. Review environment variables
3. Check browser console for debug logs (prefixed with `[v0]`)
4. Verify VAPI dashboard for call logs and recordings
