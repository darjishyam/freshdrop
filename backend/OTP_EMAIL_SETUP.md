# FreshDrop OTP & Email Setup Guide

## Current Status

✅ **Fixed Issues:**
1. Expo Router warning for `idHelper.js` - Moved to root `utils/` folder
2. OTP display on frontend - Now shows actual OTP from backend
3. Email logging - All emails and OTPs are now logged to backend console

## How OTP Works Now

### Development Mode (Current Setup)

**Backend Console Logging:**
- All OTPs are logged to the backend terminal with this format:
  ```
  --------------------------------
  DEV OTP (SIGNUP): 123456
  --------------------------------
  
  ========== EMAIL DEBUG ==========
  To: user@example.com
  Subject: FreshDrop Sign Up Code
  Message: Your Sign Up OTP is 123456
  =================================
  ```

**Frontend Display:**
- OTP screen shows: "Check your email/SMS for OTP"
- **To see the OTP:** Check the backend terminal (where `nodemon server.js` is running)

### Why Email Might Not Be Sent

Gmail SMTP often blocks automated emails. The current setup:
- **Tries** to send via Gmail SMTP
- **Fails silently** but continues the flow
- **Logs** the OTP to console so you can still test

## Setting Up Brevo (Recommended for Production)

Brevo (formerly Sendinblue) is FREE and more reliable than Gmail for transactional emails.

### Step 1: Create Brevo Account
1. Go to https://www.brevo.com/
2. Sign up for a free account
3. Verify your email

### Step 2: Get SMTP Credentials
1. Login to Brevo dashboard
2. Go to **Settings** → **SMTP & API**
3. Click on **SMTP** tab
4. You'll see:
   - **SMTP Server:** `smtp-relay.brevo.com`
   - **Port:** `587`
   - **Login:** Your Brevo account email
   - **SMTP Key:** Click "Generate a new SMTP key"

### Step 3: Update Backend .env
Replace the email settings in `backend/.env`:

```env
EMAIL_HOST=smtp-relay.brevo.com
EMAIL_PORT=587
EMAIL_USER=your_brevo_email@example.com
EMAIL_PASS=your_brevo_smtp_key_here
EMAIL_FROM=noreply@freshdrop.com
FROM_NAME=FreshDrop
```

### Step 4: Verify Sender Email (Important!)
1. In Brevo dashboard, go to **Senders & IP**
2. Add and verify `noreply@freshdrop.com` (or use your own domain)
3. Brevo will send a verification email
4. Click the verification link

### Step 5: Test
1. Restart your backend server
2. Try signing up with a real email
3. Check your inbox (and spam folder)

## Alternative: Keep Using Console Logs

If you don't want to set up email right now:

1. **Keep current setup** - OTPs are logged to backend console
2. **Check backend terminal** when you need the OTP
3. **Copy the OTP** from console and paste it in the app

## Troubleshooting

### OTP Not Showing on Frontend
- The OTP is **always** logged to the backend console
- Check the terminal where `nodemon server.js` is running
- Look for lines like: `DEV OTP (SIGNUP): 123456`

### Email Not Received
- **Gmail SMTP:** Often blocked, use console logs instead
- **Brevo:** Check spam folder, verify sender email
- **Both:** Check backend console for error messages

### Backend Not Logging OTP
- Make sure `NODE_ENV=development` in `.env`
- Make sure `LOG_OTPS=true` in `.env`
- Restart the backend server

## Quick Test

1. **Start backend:** `cd backend && nodemon server.js`
2. **Start frontend:** `npx expo start -c`
3. **Sign up** with any email
4. **Check backend terminal** for OTP
5. **Copy OTP** and paste in app
6. **Success!** ✅

## Production Deployment

When deploying to production:

1. Set `NODE_ENV=production` in production environment
2. OTPs will **NOT** be logged to console (security)
3. Emails **MUST** work (use Brevo)
4. Test thoroughly before going live

---

**Need Help?**
- Brevo has excellent documentation: https://developers.brevo.com/docs
- Free tier: 300 emails/day (perfect for testing)
- Paid plans available for production use
