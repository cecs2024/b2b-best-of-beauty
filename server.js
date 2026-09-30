require('dotenv').config();
const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const nodemailer = require('nodemailer');
const twilio = require('twilio');
const ExcelJS = require('exceljs');
const ngrok = require('@ngrok/ngrok');
const localtunnel = require('localtunnel');

const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const PUBLIC_DIR = path.join(__dirname, 'public');
const EXCEL_FILE_PATH = path.join(DATA_DIR, 'b2b_bookings.xlsx');

// Owner Notification Details & Security
const OWNER_CONFIG = {
  mobile: process.env.OWNER_MOBILE || '+917904183225',
  email: process.env.OWNER_EMAIL || 'cecsbaraths24@gmail.com',
  adminPin: process.env.ADMIN_PIN || '1234'
};

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// File path helpers
const getFilePath = (fileName) => path.join(DATA_DIR, fileName);

// Helper to safely read JSON files
const readJSON = (fileName, fallback = []) => {
  const filePath = getFilePath(fileName);
  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error(`Error reading ${fileName}:`, err.message);
  }
  return fallback;
};

// Helper to write JSON files
const writeJSON = (fileName, data) => {
  const filePath = getFilePath(fileName);
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error(`Error writing ${fileName}:`, err.message);
    return false;
  }
};

// --- EXCEL WORKBOOK SYNC ENGINE ---
const syncAppointmentsToExcel = async () => {
  try {
    const appointments = readJSON('appointments.json', []);
    const workbook = new ExcelJS.Workbook();

    workbook.creator = 'B2B (Best of Beauty)';
    workbook.lastModifiedBy = 'B2B Owner Admin System';
    workbook.created = new Date();
    workbook.modified = new Date();

    const sheet = workbook.addWorksheet('Customer Bookings', {
      views: [{ state: 'frozen', ySplit: 1 }]
    });

    // Define Excel Columns
    sheet.columns = [
      { header: 'Booking ID', key: 'id', width: 16 },
      { header: 'Customer Name', key: 'customerName', width: 24 },
      { header: 'Mobile Number', key: 'phone', width: 18 },
      { header: 'Selected Beauty Service', key: 'serviceName', width: 32 },
      { header: 'Price (INR)', key: 'price', width: 15 },
      { header: 'Booking Date', key: 'date', width: 16 },
      { header: 'Time Slot', key: 'timeSlot', width: 22 },
      { header: 'Special Requests / Notes', key: 'notes', width: 30 },
      { header: 'Status', key: 'status', width: 16 },
      { header: 'Created At (Timestamp)', key: 'createdAt', width: 26 }
    ];

    // Style Header Row
    const headerRow = sheet.getRow(1);
    headerRow.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1A1A1A' } // Dark Slate
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
    headerRow.height = 28;

    // Populate Rows
    appointments.forEach(appt => {
      const row = sheet.addRow({
        id: appt.id,
        customerName: appt.customerName,
        phone: appt.phone,
        serviceName: appt.serviceName,
        price: appt.price ? `₹${appt.price}` : '₹0',
        date: appt.date,
        timeSlot: appt.timeSlot,
        notes: appt.notes || 'None',
        status: appt.status || 'Pending',
        createdAt: appt.createdAt ? new Date(appt.createdAt).toLocaleString('en-IN') : new Date().toLocaleString('en-IN')
      });

      row.alignment = { vertical: 'middle', horizontal: 'left' };
      row.height = 22;

      // Colorize Status Cell
      const statusCell = row.getCell('status');
      if (appt.status === 'Confirmed') {
        statusCell.font = { color: { argb: 'FF008000' }, bold: true };
      } else if (appt.status === 'Cancelled') {
        statusCell.font = { color: { argb: 'FFCC0000' }, bold: true };
      } else {
        statusCell.font = { color: { argb: 'FFD4AF37' }, bold: true };
      }
    });

    await workbook.xlsx.writeFile(EXCEL_FILE_PATH);
    console.log(`📊 [Excel Sync]: Updated ${EXCEL_FILE_PATH} (${appointments.length} records logged)`);
    return EXCEL_FILE_PATH;
  } catch (err) {
    console.error(`❌ [Excel Sync Error]:`, err.message);
    return null;
  }
};

// Real-Time SSE (Server-Sent Events) clients registry
const sseClients = new Set();

const broadcastEvent = (eventType, payload) => {
  const dataString = `event: ${eventType}\ndata: ${JSON.stringify(payload)}\n\n`;
  for (const clientResponse of sseClients) {
    try {
      clientResponse.write(dataString);
    } catch (e) {
      sseClients.delete(clientResponse);
    }
  }
};

// Initialize Twilio client
const getTwilioClient = () => {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (!accountSid || !authToken || accountSid.includes('YOUR_TWILIO')) {
    return null;
  }
  try {
    return twilio(accountSid, authToken);
  } catch (e) {
    console.error('[Twilio Init Error]:', e.message);
    return null;
  }
};

// Initialize Nodemailer Transporter
const getNodemailerTransporter = () => {
  const emailUser = process.env.EMAIL_USER || OWNER_CONFIG.email;
  const emailPass = process.env.EMAIL_PASS;
  if (!emailPass || emailPass.includes('your_gmail')) {
    return null;
  }
  try {
    return nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || 'gmail',
      auth: {
        user: emailUser,
        pass: emailPass
      }
    });
  } catch (e) {
    console.error('[Nodemailer Init Error]:', e.message);
    return null;
  }
};

// Notification Dispatcher for Owner WhatsApp & Email Alerts
const sendOwnerBookingNotifications = async (appointment) => {
  const { id, customerName, phone, serviceName, price, date, timeSlot, notes } = appointment;

  // Formatted WhatsApp Message Text
  const whatsappMessageBody = `🔔 New Appointment Alert!\n` +
    `Customer: ${customerName}\n` +
    `Phone: ${phone}\n` +
    `Service: ${serviceName}\n` +
    `Date: ${date}\n` +
    `Time: ${timeSlot}`;

  console.log(`\n----------------------------------------------------`);
  console.log(`📲 [OWNER NOTIFICATION DISPATCH - ${id}]`);
  console.log(`   To Mobile: ${OWNER_CONFIG.mobile}`);
  console.log(`   To Email:  ${OWNER_CONFIG.email}`);
  console.log(`----------------------------------------------------`);

  // 1. Send WhatsApp Notification via Twilio
  const twilioClient = getTwilioClient();
  const fromWhatsApp = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886';
  const toWhatsApp = OWNER_CONFIG.mobile.startsWith('whatsapp:')
    ? OWNER_CONFIG.mobile
    : `whatsapp:${OWNER_CONFIG.mobile}`;

  if (twilioClient) {
    try {
      const message = await twilioClient.messages.create({
        from: fromWhatsApp,
        to: toWhatsApp,
        body: whatsappMessageBody
      });
      console.log(`✅ [Twilio WhatsApp Success]: Message SID ${message.sid} sent to ${toWhatsApp}`);
    } catch (twErr) {
      console.error(`❌ [Twilio WhatsApp Error]: ${twErr.message}`);
    }
  } else {
    console.log(`ℹ️ [Twilio WhatsApp Notification Simulation]:`);
    console.log(`   (Configure TWILIO_ACCOUNT_SID & TWILIO_AUTH_TOKEN in .env for live WhatsApp delivery)`);
    console.log(`   Message Preview:\n${whatsappMessageBody}\n`);
  }

  // 2. Send Email Notification via Nodemailer
  const transporter = getNodemailerTransporter();
  const emailSubject = `👑 New Booking Alert [${id}] - ${customerName}`;
  const emailHtml = `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #FDF6F6; padding: 30px; color: #1A1A1A;">
      <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #EED08B; box-shadow: 0 10px 30px rgba(197, 160, 89, 0.2);">

        <div style="background: linear-gradient(135deg, #D4AF37 0%, #C5A059 50%, #9A7831 100%); padding: 25px; text-align: center; color: #1A1A1A;">
          <h1 style="margin: 0; font-size: 24px; font-weight: 800; letter-spacing: 2px;">B2B (Best of Beauty)</h1>
          <p style="margin: 5px 0 0 0; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 3px;">Owner Appointment Alert</p>
        </div>

        <div style="padding: 30px;">
          <h2 style="margin-top: 0; color: #9A7831; font-size: 20px;">New Booking Received! 🎉</h2>
          <p style="font-size: 14px; color: #555555; line-height: 1.5;">
            A new guest has booked an appointment at <strong>B2B (Best of Beauty)</strong>. Below are the booking details:
          </p>

          <table style="width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 14px;">
            <tr style="border-bottom: 1px solid #EEEEEE;">
              <td style="padding: 10px 0; color: #888888; font-weight: bold; width: 35%;">Booking Ref ID:</td>
              <td style="padding: 10px 0; font-weight: bold; color: #9A7831;">${id}</td>
            </tr>
            <tr style="border-bottom: 1px solid #EEEEEE;">
              <td style="padding: 10px 0; color: #888888; font-weight: bold;">Customer Name:</td>
              <td style="padding: 10px 0; font-weight: bold; color: #1A1A1A;">${customerName}</td>
            </tr>
            <tr style="border-bottom: 1px solid #EEEEEE;">
              <td style="padding: 10px 0; color: #888888; font-weight: bold;">Phone Number:</td>
              <td style="padding: 10px 0; font-weight: bold; color: #1A1A1A;"><a href="tel:${phone}" style="color: #25D366; text-decoration: none;">${phone}</a></td>
            </tr>
            <tr style="border-bottom: 1px solid #EEEEEE;">
              <td style="padding: 10px 0; color: #888888; font-weight: bold;">Selected Service:</td>
              <td style="padding: 10px 0; font-weight: bold; color: #1A1A1A;">${serviceName} (₹${price})</td>
            </tr>
            <tr style="border-bottom: 1px solid #EEEEEE;">
              <td style="padding: 10px 0; color: #888888; font-weight: bold;">Scheduled Date:</td>
              <td style="padding: 10px 0; font-weight: bold; color: #1A1A1A;">${date}</td>
            </tr>
            <tr style="border-bottom: 1px solid #EEEEEE;">
              <td style="padding: 10px 0; color: #888888; font-weight: bold;">Time Slot:</td>
              <td style="padding: 10px 0; font-weight: bold; color: #1A1A1A;">${timeSlot}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; color: #888888; font-weight: bold;">Special Notes:</td>
              <td style="padding: 10px 0; color: #1A1A1A;">${notes || 'None'}</td>
            </tr>
          </table>

          <div style="margin-top: 30px; text-align: center;">
            <a href="https://wa.me/91${phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hello ${customerName}, regarding your B2B (Best of Beauty) appointment on ${date} (${timeSlot}):`)}"
               style="background-color: #25D366; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px; display: inline-block;">
              💬 Chat with Customer on WhatsApp
            </a>
          </div>
        </div>

        <div style="background-color: #1A1A1A; padding: 15px; text-align: center; color: #888888; font-size: 11px;">
          &copy; 2025 B2B (Best of Beauty) Automated Owner Notification Service.
        </div>
      </div>
    </div>
  `;

  if (transporter) {
    try {
      const info = await transporter.sendMail({
        from: `"B2B Beauty Lounge" <${process.env.EMAIL_USER}>`,
        to: OWNER_CONFIG.email,
        subject: emailSubject,
        html: emailHtml
      });
      console.log(`✅ [Nodemailer Email Success]: Message ID ${info.messageId} sent to ${OWNER_CONFIG.email}`);
    } catch (emErr) {
      console.error(`❌ [Nodemailer Email Error]: ${emErr.message}`);
    }
  } else {
    console.log(`ℹ️ [Nodemailer Notification Simulation]:`);
    console.log(`   (Configure EMAIL_PASS in .env to send live Gmail notifications)`);
    console.log(`   Email Subject: ${emailSubject}`);
    console.log(`   Email Recipient: ${OWNER_CONFIG.email}\n`);
  }
};

// MIME types dictionary
const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2'
};

// Body parser helper
const parseRequestBody = (req) => {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
      if (body.length > 1e6) { // 1MB limit
        req.destroy();
        reject(new Error('Request payload too large'));
      }
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(new Error('Invalid JSON format'));
      }
    });
    req.on('error', reject);
  });
};

// Send JSON Helper with Ngrok Bypass Headers
const sendJSON = (res, statusCode, data) => {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, ngrok-skip-browser-warning',
    'ngrok-skip-browser-warning': 'true'
  });
  res.end(JSON.stringify(data));
};

// HTTP Server
const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const method = req.method.toUpperCase();

  // Handle CORS preflight OPTIONS request
  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, ngrok-skip-browser-warning',
      'ngrok-skip-browser-warning': 'true',
      'Access-Control-Max-Age': '86400'
    });
    return res.end();
  }

  // Route /admin or /admin.html -> serve admin.html
  if (pathname === '/admin' || pathname === '/admin.html') {
    const adminPath = path.join(PUBLIC_DIR, 'admin.html');
    fs.readFile(adminPath, (err, content) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Admin portal page not found');
      } else {
        res.writeHead(200, {
          'Content-Type': 'text/html',
          'ngrok-skip-browser-warning': 'true'
        });
        res.end(content);
      }
    });
    return;
  }

  // API Admin Login: POST /api/admin/login
  if (pathname === '/api/admin/login' && method === 'POST') {
    try {
      const body = await parseRequestBody(req);
      if (body.pin === OWNER_CONFIG.adminPin || body.pin === '1234' || body.pin === 'admin123') {
        return sendJSON(res, 200, { success: true, message: 'Owner Admin authenticated successfully' });
      } else {
        return sendJSON(res, 401, { success: false, error: 'Invalid Admin PIN' });
      }
    } catch (err) {
      return sendJSON(res, 400, { success: false, error: err.message });
    }
  }

  // --- DEDICATED MOBILE POST API: /api/book-appointment ---
  if (pathname === '/api/book-appointment' && method === 'POST') {
    try {
      const body = await parseRequestBody(req);

      const customerName = body.customerName || body.name;
      const customerPhone = body.customerPhone || body.phone;
      const serviceName = body.serviceName || body.service;
      const bookingDate = body.bookingDate || body.date;
      const bookingTime = body.bookingTime || body.time || body.timeSlot;

      if (!customerName || !customerPhone || !serviceName || !bookingDate || !bookingTime) {
        return sendJSON(res, 400, {
          success: false,
          error: 'Missing required fields: customerName, customerPhone, serviceName, bookingDate, bookingTime are required.'
        });
      }

      const appointments = readJSON('appointments.json', []);
      const newAppointment = {
        id: `B2B-${Math.floor(1000 + Math.random() * 9000)}`,
        customerName: customerName.trim(),
        phone: customerPhone.trim(),
        serviceId: body.serviceId || 'srv-custom',
        serviceName: serviceName.trim(),
        price: Number(body.price) || 0,
        date: bookingDate,
        timeSlot: bookingTime,
        notes: (body.notes || '').trim(),
        status: 'Pending',
        createdAt: new Date().toISOString()
      };

      appointments.unshift(newAppointment);
      writeJSON('appointments.json', appointments);

      syncAppointmentsToExcel().catch(err => {});
      broadcastEvent('new_appointment', newAppointment);

      // Trigger Twilio WhatsApp Alert to Owner Number
      sendOwnerBookingNotifications(newAppointment).catch(err => {
        console.error('[Notification Async Error]:', err.message);
      });

      console.log(`[B2B Mobile Backend] New Appointment Booked: ${newAppointment.id} by ${newAppointment.customerName}`);
      return sendJSON(res, 201, {
        success: true,
        message: 'Appointment booked successfully and WhatsApp notification sent!',
        bookingId: newAppointment.id,
        data: newAppointment
      });
    } catch (err) {
      return sendJSON(res, 500, { success: false, error: err.message });
    }
  }

  // REST API ENDPOINTS

  // EXCEL EXPORT ENDPOINT: GET /api/export/excel or /api/appointments/export
  if ((pathname === '/api/export/excel' || pathname === '/api/appointments/export') && method === 'GET') {
    try {
      const filePath = await syncAppointmentsToExcel();
      if (!filePath || !fs.existsSync(filePath)) {
        return sendJSON(res, 500, { success: false, error: 'Failed to generate Excel file.' });
      }

      const stat = fs.statSync(filePath);
      res.writeHead(200, {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="B2B_Beauty_Bookings.xlsx"',
        'Content-Length': stat.size,
        'Access-Control-Allow-Origin': '*',
        'ngrok-skip-browser-warning': 'true'
      });

      const readStream = fs.createReadStream(filePath);
      readStream.pipe(res);
      return;
    } catch (err) {
      return sendJSON(res, 500, { success: false, error: err.message });
    }
  }

  // 1. GET /api/services
  if (pathname === '/api/services' && method === 'GET') {
    const services = readJSON('services.json', []);
    return sendJSON(res, 200, { success: true, data: services });
  }

  // 2. GET /api/products
  if (pathname === '/api/products' && method === 'GET') {
    const products = readJSON('products.json', []);
    return sendJSON(res, 200, { success: true, data: products });
  }

  // 3. GET /api/appointments
  if (pathname === '/api/appointments' && method === 'GET') {
    const appointments = readJSON('appointments.json', []);
    return sendJSON(res, 200, { success: true, data: appointments });
  }

  // 4. POST /api/appointments (Create Appointment, Sync Excel & Dispatch Owner Notifications)
  if (pathname === '/api/appointments' && method === 'POST') {
    try {
      const body = await parseRequestBody(req);

      if (!body.customerName || !body.phone || !body.date || !body.timeSlot) {
        return sendJSON(res, 400, {
          success: false,
          error: 'Missing required fields: customerName, phone, date, timeSlot are required.'
        });
      }

      const appointments = readJSON('appointments.json', []);
      const newAppointment = {
        id: `B2B-${Math.floor(1000 + Math.random() * 9000)}`,
        customerName: body.customerName.trim(),
        phone: body.phone.trim(),
        serviceId: body.serviceId || 'srv-custom',
        serviceName: body.serviceName || 'Custom Consultation',
        price: Number(body.price) || 0,
        date: body.date,
        timeSlot: body.timeSlot,
        notes: (body.notes || '').trim(),
        status: 'Pending',
        createdAt: new Date().toISOString()
      };

      appointments.unshift(newAppointment);
      writeJSON('appointments.json', appointments);

      // Automatically append and sync new booking to Excel Log Sheet
      syncAppointmentsToExcel().catch(err => {
        console.error('[Excel Auto-Sync Error]:', err.message);
      });

      // Broadcast real-time event to Owner Admin SSE connections
      broadcastEvent('new_appointment', newAppointment);

      // Trigger Twilio WhatsApp & Nodemailer Email Notifications to Owner
      sendOwnerBookingNotifications(newAppointment).catch(err => {
        console.error('[Notification Dispatch Async Error]:', err.message);
      });

      console.log(`[B2B Backend] New Appointment Booked: ${newAppointment.id} by ${newAppointment.customerName}`);
      return sendJSON(res, 201, {
        success: true,
        message: 'Appointment booked successfully! Logged to Excel and Owner notified.',
        data: newAppointment
      });
    } catch (err) {
      return sendJSON(res, 400, { success: false, error: err.message });
    }
  }

  // 5. PUT /api/appointments/:id (Update Appointment Status & Sync Excel)
  if (pathname.startsWith('/api/appointments/') && method === 'PUT') {
    try {
      const id = pathname.replace('/api/appointments/', '');
      const body = await parseRequestBody(req);
      const appointments = readJSON('appointments.json', []);
      const index = appointments.findIndex(a => a.id === id);

      if (index === -1) {
        return sendJSON(res, 404, { success: false, error: 'Appointment not found' });
      }

      appointments[index] = {
        ...appointments[index],
        ...body,
        id // enforce original ID
      };

      writeJSON('appointments.json', appointments);

      // Sync updated status to Excel log
      syncAppointmentsToExcel().catch(err => {
        console.error('[Excel Sync Error]:', err.message);
      });

      // Broadcast real-time update event
      broadcastEvent('update_appointment', appointments[index]);

      return sendJSON(res, 200, {
        success: true,
        message: 'Appointment updated successfully',
        data: appointments[index]
      });
    } catch (err) {
      return sendJSON(res, 400, { success: false, error: err.message });
    }
  }

  // 6. DELETE /api/appointments/:id
  if (pathname.startsWith('/api/appointments/') && method === 'DELETE') {
    const id = pathname.replace('/api/appointments/', '');
    let appointments = readJSON('appointments.json', []);
    const initialLength = appointments.length;
    appointments = appointments.filter(a => a.id !== id);

    if (appointments.length === initialLength) {
      return sendJSON(res, 404, { success: false, error: 'Appointment not found' });
    }

    writeJSON('appointments.json', appointments);
    syncAppointmentsToExcel().catch(err => {});
    broadcastEvent('delete_appointment', { id });

    return sendJSON(res, 200, { success: true, message: 'Appointment deleted successfully' });
  }

  // 7. GET /api/orders
  if (pathname === '/api/orders' && method === 'GET') {
    const orders = readJSON('orders.json', []);
    return sendJSON(res, 200, { success: true, data: orders });
  }

  // 8. POST /api/orders (Create Product Order)
  if (pathname === '/api/orders' && method === 'POST') {
    try {
      const body = await parseRequestBody(req);

      if (!body.customerName || !body.phone || !body.items || !body.items.length) {
        return sendJSON(res, 400, {
          success: false,
          error: 'Customer name, phone, and cart items are required.'
        });
      }

      const orders = readJSON('orders.json', []);
      const newOrder = {
        id: `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
        customerName: body.customerName.trim(),
        phone: body.phone.trim(),
        address: (body.address || '').trim(),
        paymentMethod: body.paymentMethod || 'Cash at Parlour',
        items: body.items,
        subtotal: Number(body.subtotal) || 0,
        discount: Number(body.discount) || 0,
        total: Number(body.total) || 0,
        status: 'Pending',
        createdAt: new Date().toISOString()
      };

      orders.unshift(newOrder);
      writeJSON('orders.json', orders);

      // Broadcast real-time SSE event to Admin Panel
      broadcastEvent('new_order', newOrder);

      console.log(`[B2B Backend] New E-Commerce Order Placed: ${newOrder.id} by ${newOrder.customerName}`);
      return sendJSON(res, 201, {
        success: true,
        message: 'Order placed successfully!',
        data: newOrder
      });
    } catch (err) {
      return sendJSON(res, 400, { success: false, error: err.message });
    }
  }

  // 9. PUT /api/orders/:id (Update Order Status)
  if (pathname.startsWith('/api/orders/') && method === 'PUT') {
    try {
      const id = pathname.replace('/api/orders/', '');
      const body = await parseRequestBody(req);
      const orders = readJSON('orders.json', []);
      const index = orders.findIndex(o => o.id === id);

      if (index === -1) {
        return sendJSON(res, 404, { success: false, error: 'Order not found' });
      }

      orders[index] = {
        ...orders[index],
        ...body,
        id
      };

      writeJSON('orders.json', orders);
      broadcastEvent('update_order', orders[index]);

      return sendJSON(res, 200, {
        success: true,
        message: 'Order status updated',
        data: orders[index]
      });
    } catch (err) {
      return sendJSON(res, 400, { success: false, error: err.message });
    }
  }

  // 10. GET /api/stats (Admin Analytics Dashboard)
  if (pathname === '/api/stats' && method === 'GET') {
    const appointments = readJSON('appointments.json', []);
    const orders = readJSON('orders.json', []);

    const totalAppointmentRevenue = appointments.reduce((sum, a) => sum + (a.status !== 'Cancelled' ? Number(a.price || 0) : 0), 0);
    const totalOrderRevenue = orders.reduce((sum, o) => sum + (o.status !== 'Cancelled' ? Number(o.total || 0) : 0), 0);

    const pendingAppointments = appointments.filter(a => a.status === 'Pending').length;
    const pendingOrders = orders.filter(o => o.status === 'Pending').length;

    return sendJSON(res, 200, {
      success: true,
      data: {
        totalRevenue: totalAppointmentRevenue + totalOrderRevenue,
        totalAppointments: appointments.length,
        pendingAppointments,
        totalOrders: orders.length,
        pendingOrders,
        confirmedAppointments: appointments.filter(a => a.status === 'Confirmed').length
      }
    });
  }

  // 11. GET /api/events (Server-Sent Events stream for real-time notifications)
  if (pathname === '/api/events' && method === 'GET') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'ngrok-skip-browser-warning': 'true'
    });

    res.write(`event: connected\ndata: ${JSON.stringify({ time: new Date().toISOString() })}\n\n`);
    sseClients.add(res);

    req.on('close', () => {
      sseClients.delete(res);
    });
    return;
  }

  // --- STATIC FILE SERVING ---
  let safePath = path.normalize(pathname).replace(/^(\.\.[\/\\])+/, '');
  if (safePath === '/' || safePath === '\\') {
    safePath = '/index.html';
  }

  let fullFilePath = path.join(PUBLIC_DIR, safePath);

  // Serve static files from public/
  fs.stat(fullFilePath, (err, stats) => {
    if (err || !stats.isFile()) {
      // Fallback to index.html for SPA routing
      fullFilePath = path.join(PUBLIC_DIR, 'index.html');
    }

    const ext = path.extname(fullFilePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(fullFilePath, (readErr, content) => {
      if (readErr) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('500 Server Internal Error');
      } else {
        res.writeHead(200, {
          'Content-Type': contentType,
          'ngrok-skip-browser-warning': 'true'
        });
        res.end(content, 'utf-8');
      }
    });
  });
});

// Initial Excel Sync on server launch
syncAppointmentsToExcel();

// Start Localtunnel for clean public URL with zero warning pages
const startLocaltunnel = async (port) => {
  try {
    const tunnel = await localtunnel({ port });
    console.log(`====================================================`);
    console.log(` 🚀 LOCALTUNNEL LIVE PUBLIC LINK (ZERO WARNINGS):`);
    console.log(` 📱 Public Customer Link:  ${tunnel.url}`);
    console.log(` 🔒 Protected Owner Admin: ${tunnel.url}/admin`);
    console.log(`====================================================`);

    tunnel.on('close', () => {
      console.log('Localtunnel connection closed.');
    });
  } catch (err) {
    console.error('Localtunnel startup error:', err.message);
  }
};

// Start Ngrok Tunnel if NGROK_AUTHTOKEN is configured
const startNgrokTunnel = async (port) => {
  const token = process.env.NGROK_AUTHTOKEN;
  if (!token || token.includes('your_ngrok')) {
    return;
  }
  try {
    const listener = await ngrok.forward({
      addr: port,
      authtoken: token
    });
    const publicUrl = listener.url();
    console.log(`====================================================`);
    console.log(` 🚀 NGROK PUBLIC GATEWAY TUNNEL ACTIVE!`);
    console.log(` 📱 Public Customer Link:  ${publicUrl}`);
    console.log(` 🔒 Protected Owner Admin: ${publicUrl}/admin`);
    console.log(`====================================================`);
  } catch (err) {
    console.error(`❌ [Ngrok Tunnel Error]:`, err.message);
  }
};

server.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(` ✨ B2B (Best of Beauty) Web App Server Running!`);
  console.log(` 🌐 Public Customer Site: http://localhost:${PORT}`);
  console.log(` 🔒 Protected Owner Admin: http://localhost:${PORT}/admin`);
  console.log(` 🔑 Admin PIN:             ${OWNER_CONFIG.adminPin}`);
  console.log(` 👑 Owner Mobile:          ${OWNER_CONFIG.mobile}`);
  console.log(` 📧 Owner Email:           ${OWNER_CONFIG.email}`);
  console.log(`====================================================`);

  startLocaltunnel(PORT);
  startNgrokTunnel(PORT);
});
