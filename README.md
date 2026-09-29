# 👑 B2B (Best of Beauty) — Web Application

> **"Radiate Beauty, Embrace Confidence — Your Ultimate Pampering & Glow Experience."**

Welcome to **B2B (Best of Beauty)**, a premier, full-stack, responsive web application for a luxury beauty parlour & spa with an integrated e-commerce boutique, real-time owner admin management system, automated WhatsApp (Twilio) & Email (Nodemailer) owner notifications, Excel sheet logging, and **Ngrok Public Gateway Tunnel integration**.

---

## 🌐 Ngrok Gateway Tunnel Integration

You can host your local application on the internet instantly and generate a live HTTPS link for your mobile phone using **Ngrok**.

### Option 1: Automatic Ngrok Tunnel via `.env` (Recommended)
1. Copy your Ngrok authtoken from **[dashboard.ngrok.com/get-started/your-authtoken](https://dashboard.ngrok.com/get-started/your-authtoken)**.
2. Open `.env` and set `NGROK_AUTHTOKEN`:
   ```ini
   NGROK_AUTHTOKEN=your_actual_ngrok_authtoken_here
   ```
3. Run `npm start`. `server.js` will automatically launch the Ngrok HTTPS tunnel and output your live mobile URL in the console:
   ```text
   ====================================================
    🚀 NGROK PUBLIC GATEWAY TUNNEL LIVE!
    📱 Public Customer Link:  https://xxxx-xx-xxx.ngrok-free.app
    🔒 Protected Owner Admin: https://xxxx-xx-xxx.ngrok-free.app/admin
   ====================================================
   ```

### Option 2: Standalone Ngrok CLI
If you prefer running Ngrok directly from your terminal:
```bash
# 1. Add your authtoken
npx ngrok config add-authtoken YOUR_AUTHTOKEN_HERE

# 2. Forward local port 3000
npx ngrok http 3000
```

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
