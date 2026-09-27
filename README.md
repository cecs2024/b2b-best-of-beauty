# 👑 B2B (Best of Beauty) — Web Application

> **"Radiate Beauty, Embrace Confidence — Your Ultimate Pampering & Glow Experience."**

Welcome to **B2B (Best of Beauty)**, a premier, full-stack, responsive web application for a luxury beauty parlour & spa with an integrated e-commerce boutique, real-time owner admin management system, and **automated WhatsApp (Twilio) & Email (Nodemailer) owner notifications**.

---

## 📲 Owner Notification Configuration

The application is pre-configured with the owner's contact details in `.env`:
- **Owner WhatsApp Number**: `+917904183225`
- **Owner Email ID**: `cecsbaraths24@gmail.com`

Whenever a customer submits an appointment booking, the backend automatically triggers:
1. **Twilio WhatsApp Notification** with Customer Name, Mobile, Service, Price, Date, Time Slot, and Notes.
2. **Nodemailer HTML Email Alert** sent to `cecsbaraths24@gmail.com`.

### 🔑 Setting Live Credentials in `.env`

Open `.env` in the root folder to supply your live API keys:

```ini
# Owner Contact Details
OWNER_MOBILE=+917904183225
OWNER_EMAIL=cecsbaraths24@gmail.com

# Twilio WhatsApp Configuration
# Get Account SID and Auth Token from https://www.twilio.com/console
TWILIO_ACCOUNT_SID=AC_YOUR_TWILIO_ACCOUNT_SID
TWILIO_AUTH_TOKEN=YOUR_TWILIO_AUTH_TOKEN
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886

# Nodemailer Email Configuration
# Generate a 16-character Gmail App Password from Google Account > Security > App Passwords
EMAIL_SERVICE=gmail
EMAIL_USER=cecsbaraths24@gmail.com
EMAIL_PASS=your_16_digit_gmail_app_password
```

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

## 🚀 Key Features

### 🏠 1. Hero Section & Home Page
- **Luxury Banner**: High-impact HD background banner with glowing gradient overlay.
- **Slogan**: *"Radiate Beauty, Embrace Confidence — Your Ultimate Pampering & Glow Experience."*
- **Action CTAs**: *"Book Appointment"* (interactive modal) and *"Explore Services"* (smooth scroll).

### 💆‍♀️ 2. Beauty Services Section
1. **Hair Styling & Spa** (Cut, Color, Keratin) — **₹1,499** (60 Min)
2. **Luxury Glow Facial & Cleanups** (Hydra-Peel & Vitamin C Glow) — **₹1,999** (75 Min)
3. **Bridal & Event Makeover Packages** (HD Airbrush & Hairstyling) — **₹7,999** (180 Min)
4. **Manicure & Pedicure Spa** (Rose Petal Soak & Gel Polish) — **₹999** (45 Min)
5. **Threading & Skin Care** (Eyebrows & Herbal De-Tan) — **₹499** (30 Min)

### 🛒 3. E-Commerce Boutique Store
- Organic Face Serum, Hydrating Hair Mask, 24K Glow Cream, Rose Water Toner, etc.
- Cart Drawer & Checkout Modal.

### 📅 4. Appointment Booking System
- Collects Customer Name, Phone, Service, Date, Time Slot, and Notes.
- Generates reference ID (`B2B-XXXX`) and WhatsApp share link.

### 🔔 5. Owner Real-Time Notifications & Admin Panel
- **Automatic Twilio WhatsApp Alert** sent to `+917904183225`.
- **Automatic Nodemailer Email Alert** sent to `cecsbaraths24@gmail.com`.
- **Real-Time SSE Live Stream**: Sound chime & toast alerts on the Owner Admin Panel.

---

## ⚡ How to Run the Web Application

```bash
npm start
```
Access at: **[http://localhost:3000](http://localhost:3000)**.

---

## 📜 License
MIT License. Created for **B2B (Best of Beauty)**.
