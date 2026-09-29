# 👑 B2B (Best of Beauty) — Web Application

> **"Radiate Beauty, Embrace Confidence — Your Ultimate Pampering & Glow Experience."**

Welcome to **B2B (Best of Beauty)**, a premier, full-stack, responsive web application for a luxury beauty parlour & spa with an integrated e-commerce boutique, real-time owner admin management system, automated WhatsApp (Twilio) & Email (Nodemailer) owner notifications, Excel sheet logging, and **instant public gateway tunnel integration**.

---

## 🚫 How to Eliminate the Ngrok Warning Screen Completely

Standard mobile web browsers show a free-tier warning page when navigating to `*.ngrok-free.app` URLs for the first time. Below are 3 instant free alternatives to bypass or eliminate it completely:

### 1. Localtunnel (Zero Warning Page!)
Run this command in your terminal to get an instant HTTPS link with NO warning page:
```bash
npx localtunnel --port 3000
```
👉 Gives a clean public link like: `https://b2b-beauty.loca.lt`

---

### 2. Cloudflare Tunnel (Enterprise Free HTTPS, Zero Warning Page!)
Run Cloudflare's free tunnel in your terminal:
```bash
npx cloudflared tunnel --url http://localhost:3000
```
👉 Gives an official Cloudflare HTTPS link like: `https://xxxx-xx.trycloudflare.com`

---

### 3. Deploy to Render.com (Permanent Cloud Link, Zero Warning Page!)
Deploying your repository to **[Render.com](https://dashboard.render.com)** provides a permanent 24/7 cloud URL with **NO warning pages**:
👉 `https://b2b-best-of-beauty.onrender.com`

---

### 4. If Using Ngrok
- **On Mobile Browser**: Tap the **"Visit Site"** button once. Ngrok saves a 7-day cookie so it won't appear again on your device.
- **In Android App WebView**: `MainActivity.kt` automatically injects `ngrok-skip-browser-warning: true` and a custom User-Agent to bypass the screen!

---

## 📲 Owner Notification Configuration

The application is pre-configured with the owner's contact details in `.env`:
- **Owner WhatsApp Number**: `+917904183225`
- **Owner Email ID**: `cecsbaraths24@gmail.com`
- **Protected Admin PIN**: `1234`

Whenever a customer submits an appointment booking, the backend automatically triggers:
1. **Twilio WhatsApp Notification** with Customer Name, Mobile, Service, Price, Date, Time Slot, and Notes.
2. **Nodemailer HTML Email Alert** sent to `cecsbaraths24@gmail.com`.
3. **Automated Excel Sheet Logging** (`data/b2b_bookings.xlsx`).

---

## 🎨 Design & Styling Specifications

- **Logo**: Sleek monogram **B2B** emblem with metallic rose-gold gradient badge and **"Best of Beauty"** brand mark.
- **Typography**: 
  - Headings: `'Playfair Display'` & `'Cinzel'` (Serif fonts for high-end luxury feel).
  - Body Text: `'Plus Jakarta Sans'` (Clean sans-serif for optimal readability).
- **Color Palette**:
  - **Blush Pink**: `#FDF6F6`, `#F8E7E7` (Soft background & cards).
  - **Rose Gold Accent**: `#D4AF37`, `#C5A059`, `#9A7831` (Metallic gradients & action highlights).
  - **Charcoal / Slate**: `#1A1A1A` (Rich dark slate text).

---

## 📱 Public Customer App vs Protected Admin Portal

| Surface | URL Path | Access Level |
| :--- | :--- | :--- |
| **Public Customer Website** | `/` | **Public** *(Services, Shop, Booking Form)* |
| **Owner Admin Portal** | `/admin` | **Protected** *(PIN: `1234`)* |
| **Download Excel Log** | `/api/export/excel` | **Admin Download** |

---

## ⚡ How to Run the Web Application

```bash
npm start
```
Access at: **[http://localhost:3000](http://localhost:3000)**.

---

## 📜 License
MIT License. Created for **B2B (Best of Beauty)**.
