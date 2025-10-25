# EmailJS Setup Guide for Real Email Sending

## 1. Create EmailJS Account

1. Go to [EmailJS.com](https://www.emailjs.com/)
2. Sign up for a free account
3. Verify your email address

## 2. Create Email Service

1. Go to **Email Services** in your EmailJS dashboard
2. Click **Add New Service**
3. Choose your email provider:
   - **Gmail** (recommended for testing)
   - **Outlook**
   - **Yahoo**
   - Or any SMTP service
4. Follow the setup instructions for your chosen provider
5. **Copy the Service ID** (you'll need this)

## 3. Create Email Template

1. Go to **Email Templates** in your dashboard
2. Click **Create New Template**
3. Use this template content:

### Template Settings:
- **Template Name**: `radiology_report_notification`
- **Subject**: `Your Radiology Report is Ready - {{patient_name}}`

### Template Content:
```html
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .footer { padding: 15px; font-size: 12px; color: #666; }
        .warning { background: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>RadAI Orchestrator</h1>
            <p>Your Radiology Report is Ready</p>
        </div>
        
        <div class="content">
            <p>Dear {{patient_name}},</p>
            
            <p>Your X-ray analysis has been completed and reviewed by our medical team.</p>
            
            <h3>Report Summary</h3>
            <p><strong>Impression:</strong> {{impression}}</p>
            <p><strong>Report ID:</strong> {{report_id}}</p>
            <p><strong>Date:</strong> {{date}}</p>
            
            <h3>Next Steps</h3>
            <ul>
                <li>Please schedule an appointment with your doctor to discuss the results</li>
                <li>Bring this report notification with you to your appointment</li>
                <li>If you have any urgent concerns, contact your healthcare provider immediately</li>
            </ul>
        </div>
        
        <div class="warning">
            <p><strong>⚠️ Important Medical Disclaimer:</strong></p>
            <p>This is an AI-assisted analysis for decision support only. It is not intended for sole diagnosis. Always consult with qualified medical professionals for proper medical advice and treatment.</p>
        </div>
        
        <div class="footer">
            <p>© 2025 RadAI Orchestrator - Medical Analysis System</p>
            <p>This is an automated message. Please do not reply to this email.</p>
        </div>
    </div>
</body>
</html>
```

4. **Save the template** and copy the **Template ID**

## 4. Get Your Public Key

1. Go to **Account** → **General** in your EmailJS dashboard
2. Find your **Public Key** (starts with something like `user_...`)
3. Copy this key

## 5. Update Environment Variables

Update your `.env` file with the actual values:

```env
# EmailJS configuration for real email sending
VITE_EMAILJS_SERVICE_ID=service_xxxxxxx
VITE_EMAILJS_TEMPLATE_ID=template_xxxxxxx  
VITE_EMAILJS_PUBLIC_KEY=user_xxxxxxxxxxxxxxxxxxxx
```

## 6. Test Email Sending

1. Start your application: `npm run dev`
2. Complete an X-ray analysis
3. Click "Approve Report" in the Doctor Dashboard
4. Click "Notify Patient" 
5. Check the patient's email inbox

## 7. EmailJS Free Tier Limits

- **200 emails/month** (free tier)
- **50 emails/day** maximum
- For production, consider upgrading to a paid plan

## 8. Troubleshooting

### Common Issues:

1. **"EmailJS configuration missing"**
   - Check that all three environment variables are set correctly
   - Restart your development server after updating `.env`

2. **"Failed to send email"**
   - Verify your Service ID, Template ID, and Public Key
   - Check EmailJS dashboard for error logs
   - Ensure your email service is properly connected

3. **Emails not received**
   - Check spam/junk folder
   - Verify the recipient email address
   - Check EmailJS dashboard for delivery status

4. **Gmail specific issues**
   - Enable 2-factor authentication
   - Use an App Password instead of your regular password
   - Allow less secure apps (if needed)

## 9. Production Considerations

For production use:
- Upgrade to EmailJS paid plan for higher limits
- Consider using a professional email service (SendGrid, Mailgun, etc.)
- Implement email delivery tracking
- Add email templates for different scenarios
- Set up proper error handling and retry logic

## 10. Security Notes

- Never commit your actual API keys to version control
- Use environment variables for all sensitive data
- Consider implementing rate limiting for email sending
- Monitor email usage to prevent abuse