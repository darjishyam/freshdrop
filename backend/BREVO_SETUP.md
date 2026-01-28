# 📧 Brevo Email Setup Guide (5 Minutes)

## Why Brevo?
- ✅ **FREE** - 300 emails/day forever
- ✅ **No SMTP issues** - Uses simple API
- ✅ **Reliable** - Better than Gmail for transactional emails
- ✅ **Easy setup** - Just one API key needed

---

## 🚀 Quick Setup (5 Steps)

### Step 1: Create Brevo Account
1. Go to **https://www.brevo.com/**
2. Click **"Sign up free"**
3. Fill in your details
4. Verify your email

### Step 2: Get API Key
1. Login to Brevo dashboard
2. Click your name (top right) → **"SMTP & API"**
3. Click **"API Keys"** tab
4. Click **"Generate a new API key"**
5. Give it a name like "FreshDrop"
6. **Copy the API key** (you'll only see it once!)

### Step 3: Add to .env
Open `backend/.env` and paste your API key:

```env
BREVO_API_KEY=xkeysib-your_actual_api_key_here
```

### Step 4: Verify Sender Email
1. In Brevo dashboard, go to **"Senders & IP"**
2. Click **"Add a sender"**
3. Add email: `noreply@freshdrop.com` (or your domain)
4. Brevo will send verification email
5. Click the verification link

**Important:** You can only send from verified emails!

### Step 5: Test It!
1. Restart backend: `nodemon server.js`
2. Try signing up with your email
3. Check your inbox! 📬

---

## 🧪 Current Status

**Right Now (Without API Key):**
- ✅ OTP is logged to backend console
- ✅ Signup/Login works
- ❌ No emails sent

**After Adding API Key:**
- ✅ OTP is logged to backend console
- ✅ Signup/Login works
- ✅ **Emails sent to inbox!** 🎉

---

## 🔍 Troubleshooting

### "Email not received"
- Check spam folder
- Make sure sender email is verified in Brevo
- Check backend console for errors

### "API key invalid"
- Make sure you copied the full key (starts with `xkeysib-`)
- No spaces before/after the key in `.env`
- Restart backend after adding key

### "Sender not verified"
- Go to Brevo → Senders & IP
- Verify the sender email
- Wait a few minutes for verification

---

## 💡 Pro Tips

1. **Free Tier Limits:**
   - 300 emails/day
   - Perfect for development and small apps
   - Upgrade if you need more

2. **Sender Email:**
   - Use `noreply@yourdomain.com` for professional look
   - Or use your personal email for testing

3. **Testing:**
   - Always check backend console for OTP
   - Email is a bonus, not required for development

---

## 📝 Quick Reference

**Brevo Dashboard:** https://app.brevo.com/  
**API Keys:** https://app.brevo.com/settings/keys/api  
**Senders:** https://app.brevo.com/senders  
**Docs:** https://developers.brevo.com/

---

**Need Help?** The OTP is always in the backend console, even without email! 🎯
