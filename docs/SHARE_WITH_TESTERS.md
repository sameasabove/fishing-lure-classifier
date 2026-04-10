# 📱 How to Share Your App with Beta Testers

## ✅ Quick Guide - Get Your App to Friends

---

## 🎯 **Option 1: Same WiFi Network (Easiest)**

**Best if your friend is nearby (same house/location)**

### **You (Developer):**
1. Make sure Expo is running
2. Look for this in your terminal:
   ```
   Metro waiting on exp://10.0.0.245:8081
   ```
3. You'll see a **QR code**

### **Your Friend (Tester):**
1. Download **"Expo Go"** app from App Store or Google Play
2. **Make sure they're on the SAME WiFi as you**
3. Open Expo Go app
4. Tap "Scan QR code"
5. Scan your QR code
6. App loads!

**✅ This works great for in-person testing!**

---

## 🌐 **Option 2: Remote Testing (Friend Not Nearby)**

**If your friend is in a different location**

### **Method A: Tunnel Mode (Your Laptop Stays On)**

**You:**
```bash
# Stop current Expo (Ctrl+C)
# Start with tunnel:
npx expo start --tunnel
```

**Wait 1-2 minutes for tunnel to establish**

**Look for:**
```
› Metro waiting on exp://xxx-xxx.ngrok.io:8081
› Tunnel ready.
```

**Copy the exp:// link and send to friend**

**Your Friend:**
1. Install Expo Go
2. Open the link you sent (on their phone)
3. It opens in Expo Go automatically
4. App loads!

**Note:** Your laptop must stay on while they test

---

### **Method B: EAS Update (Better - Laptop Can Be Off)**

**You (One-Time Setup):**
```bash
# Install EAS CLI
npm install -g eas-cli

# Login (create free account if needed)
npx eas login

# Configure updates
npx eas update:configure

# Publish your app
npx eas update --branch preview --message "Beta for friends"
```

**After publishing, you'll get a link like:**
```
exp://u.expo.dev/your-project-id?channel-name=preview
```

**Your Friend:**
1. Install Expo Go
2. Open your link
3. App loads!

**Benefits:**
- ✅ Your laptop can be off
- ✅ Works 24/7
- ✅ Easy to update (just run eas update again)

---

## 🐛 **Troubleshooting "Something Went Wrong"**

### **Common Causes:**

**1. Expo Not Fully Started**
- Wait 30-60 seconds after starting Expo
- Look for "Metro waiting on..." message
- Then share QR code/link

**2. Wrong Link Format**
- ✅ Correct: `exp://10.0.0.245:8081` or `exp://xxx.ngrok.io:8081`
- ❌ Wrong: `http://localhost:8081`

**3. Not on Same WiFi (for local testing)**
- Both must be on exact same network
- Turn off VPN if using one
- Check WiFi name matches

**4. Tunnel Not Ready**
- In tunnel mode, wait for "Tunnel ready" message
- Can take 1-2 minutes first time

**5. Expo Go App Issues**
- Update Expo Go to latest version
- Clear Expo Go cache (in app settings)
- Restart phone

**6. Backend Connection Issues**
- Make sure backend is awake: https://fishing-lure-backend.onrender.com/health
- First request might take 30 seconds (cold start)

---

## 🧪 **Testing Checklist**

### **Before Sending to Friend:**
- [ ] Expo shows "Metro waiting on..."
- [ ] QR code is visible
- [ ] If tunnel mode: "Tunnel ready" appears
- [ ] Test on YOUR phone first
- [ ] Backend health check returns 200

### **Send to Friend:**
- [ ] Clear instructions (install Expo Go first)
- [ ] Correct link format
- [ ] WiFi instructions if local mode
- [ ] Your contact info for questions

### **After They Get Error:**
- [ ] Ask for screenshot
- [ ] Check what exact error message says
- [ ] Try different link format
- [ ] Test yourself first to verify it works

---

## 📝 **Message Template for Your Friend**

**If Testing Locally (Same WiFi):**
```
Hey! Ready to test my fishing lure app?

1. Download "Expo Go" app (App Store or Google Play)
2. Connect to the same WiFi as me: [WiFi name]
3. Open Expo Go
4. Tap "Scan QR code"
5. Scan this: [send screenshot of QR code]

Let me know if you get any errors!
```

**If Testing Remotely:**
```
Hey! Ready to test my fishing lure app?

1. Download "Expo Go" app (App Store or Google Play)
2. Open this link on your phone: [exp:// link]
3. It should open in Expo Go automatically

If you get "something went wrong":
- Make sure Expo Go is installed first
- Try opening the link again
- Text me and I'll troubleshoot!
```

---

## 🎯 **Best Practices**

**Start Small:**
1. Test with 1 friend first (debug issues)
2. Once working, add 2-3 more friends
3. Then expand to 10+ testers

**Keep Them Updated:**
- Let them know when you push updates
- Thank them for finding bugs
- Show them what you fixed

**Make It Easy:**
- Clear instructions
- Quick response to questions
- Appreciate their time!

---

## 🆘 **Still Having Issues?**

### **Debug Steps:**

**1. Test Yourself First:**
```bash
# On your own phone:
1. Install Expo Go
2. Connect to same WiFi
3. Scan QR code from your terminal
4. Does it work?
```

**2. Check Expo Logs:**
- Look at terminal for error messages
- Red text = problems
- Check for network errors

**3. Try Simplest Method:**
- Local WiFi (not tunnel)
- Same room
- Same network
- Just to prove it works

**4. Check Backend:**
```
curl https://fishing-lure-backend.onrender.com/health
```
Should return 200 OK

---

## ✅ **What Link to Share?**

**Look in your Expo terminal for:**

```
Metro waiting on exp://10.0.0.245:8081
```

**This is your link!** Send `exp://10.0.0.245:8081` to your friend.

**Or for tunnel mode:**
```
Metro waiting on exp://abc-123.ngrok.io:8081
```

**Send:** `exp://abc-123.ngrok.io:8081`

---

**Check your Expo terminal now - what link do you see?** 🔍

