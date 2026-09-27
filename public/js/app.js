/**
 * B2B (Best of Beauty) - Master Application Logic
 * Pure ES6+ JavaScript handling Cart, Bookings, Real-Time SSE, & Admin Panel
 */

// Global State
const state = {
  services: [],
  products: [],
  cart: JSON.parse(localStorage.getItem('b2b_cart') || localStorage.getItem('aura_cart') || '[]'),
  appointments: [],
  orders: [],
  isAdminAuthenticated: false,
  selectedTimeSlot: '11:00 AM (Morning)',
  sseConnected: false
};

// API Base URL (Relative or current origin)
const API_BASE = window.location.protocol.startsWith('http') ? '' : 'http://localhost:3000';

// Web Audio API Chime Notification
const playNotificationChime = () => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.3); // A5

    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.6);
  } catch (e) {
    console.log('Audio playback prevented or unsupported:', e);
  }
};

// Toast Notification Helper
const showToast = (title, message, type = 'gold') => {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  const bgClass = type === 'alert'
    ? 'bg-rose-900 border-rose-500 text-white'
    : 'bg-stone-900 border-amber-500 text-amber-100';

  toast.className = `p-4 rounded-xl border shadow-2xl flex items-start space-x-3 transition-all duration-300 animate-slide-in ${bgClass} max-w-sm w-full`;
  toast.innerHTML = `
    <div class="p-2 rounded-full bg-amber-500/20 text-amber-400 shrink-0">
      <i class="fas ${type === 'alert' ? 'fa-bell text-rose-400' : 'fa-sparkles text-amber-300'}"></i>
    </div>
    <div class="flex-1 min-w-0">
      <h4 class="text-sm font-semibold text-amber-200">${title}</h4>
      <p class="text-xs text-stone-300 mt-1 line-clamp-2">${message}</p>
    </div>
    <button onclick="this.parentElement.remove()" class="text-stone-400 hover:text-white text-xs p-1">
      <i class="fas fa-times"></i>
    </button>
  `;

  container.appendChild(toast);
  playNotificationChime();

  setTimeout(() => {
    toast.classList.remove('animate-slide-in');
    toast.classList.add('animate-slide-out');
    setTimeout(() => toast.remove(), 400);
  }, 5000);
};

// --- API FETCHERS ---

// Load Initial Services
const fetchServices = async () => {
  try {
    const res = await fetch(`${API_BASE}/api/services`);
    const data = await res.json();
    if (data.success && data.data) {
      state.services = data.data;
    }
  } catch (e) {
    console.warn('API unavailable, loading static fallback services');
    state.services = [
      { id: "srv-1", title: "Hair Styling & Spa", subtitle: "Cut, Color, Keratin", category: "Hair", price: 1499, originalPrice: 1999, duration: "60 Min", rating: 4.9, image: "https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&w=800&q=80", description: "Revitalize your locks with precision cutting and deep Keratin hydration." },
      { id: "srv-2", title: "Luxury Glow Facial & Cleanups", subtitle: "Hydra-Peel & Vitamin C Glow", category: "Facial", price: 1999, originalPrice: 2499, duration: "75 Min", rating: 5.0, image: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=800&q=80", description: "Rejuvenate your skin with our signature 7-step radiance facial." },
      { id: "srv-3", title: "Bridal & Event Makeover Packages", subtitle: "HD Airbrush Makeup & Hair", category: "Bridal", price: 7999, originalPrice: 9999, duration: "180 Min", rating: 5.0, image: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=800&q=80", description: "Exquisite bridal glow transformations with waterproof HD makeup." },
      { id: "srv-4", title: "Manicure & Pedicure Spa", subtitle: "Rose Petal Soak & Gel Polish", category: "Nails", price: 999, originalPrice: 1299, duration: "45 Min", rating: 4.8, image: "https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=800&q=80", description: "Aromatherapy foot soak, herbal scrub, gel polish and reflexology." },
      { id: "srv-5", title: "Threading & Skin Care", subtitle: "Eyebrows & Herbal De-Tan", category: "Skincare", price: 499, originalPrice: 699, duration: "30 Min", rating: 4.9, image: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80", description: "Precise eyebrow threading paired with soothing aloe vera gel." }
    ];
  }
  renderServices();
  populateServiceDropdown();
};

// Load Initial Products
const fetchProducts = async () => {
  try {
    const res = await fetch(`${API_BASE}/api/products`);
    const data = await res.json();
    if (data.success && data.data) {
      state.products = data.data;
    }
  } catch (e) {
    console.warn('API unavailable, loading static fallback products');
    state.products = [
      { id: "prod-1", name: "Organic Face Serum", category: "Skincare", price: 899, originalPrice: 1199, rating: 4.9, image: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=800&q=80", badge: "Best Seller", description: "Hyaluronic Acid & Niacinamide glass-skin serum." },
      { id: "prod-2", name: "Hydrating Hair Mask", category: "Haircare", price: 749, originalPrice: 999, rating: 4.8, image: "https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?auto=format&fit=crop&w=800&q=80", badge: "Organic", description: "Deep nourishment mask with Moroccan Argan Oil." },
      { id: "prod-3", name: "24K Glow Cream", category: "Skincare", price: 1299, originalPrice: 1699, rating: 5.0, image: "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&w=800&q=80", badge: "Luxury", description: "Youth-boosting cream enriched with 24K gold." },
      { id: "prod-4", name: "Rose Water Toner", category: "Skincare", price: 399, originalPrice: 549, rating: 4.7, image: "https://images.unsplash.com/photo-1608248597309-1705888e404b?auto=format&fit=crop&w=800&q=80", badge: "Popular", description: "Steam-distilled pure rose water mist." }
    ];
  }
  renderProducts();
};

// Fetch Appointments for Admin
const fetchAppointments = async () => {
  try {
    const res = await fetch(`${API_BASE}/api/appointments`);
    const data = await res.json();
    if (data.success && data.data) {
      state.appointments = data.data;
      renderAdminDashboard();
    }
  } catch (e) {
    console.log('LocalStorage fallback for appointments');
    state.appointments = JSON.parse(localStorage.getItem('b2b_appointments') || localStorage.getItem('aura_appointments') || '[]');
    renderAdminDashboard();
  }
};

// Fetch Orders for Admin
const fetchOrders = async () => {
  try {
    const res = await fetch(`${API_BASE}/api/orders`);
    const data = await res.json();
    if (data.success && data.data) {
      state.orders = data.data;
      renderAdminDashboard();
    }
  } catch (e) {
    console.log('LocalStorage fallback for orders');
    state.orders = JSON.parse(localStorage.getItem('b2b_orders') || localStorage.getItem('aura_orders') || '[]');
    renderAdminDashboard();
  }
};

// --- REAL-TIME SSE (SERVER-SENT EVENTS) LISTENER ---
const initRealtimeSSE = () => {
  if (!window.EventSource) return;

  try {
    const evtSource = new EventSource(`${API_BASE}/api/events`);

    evtSource.addEventListener('connected', () => {
      state.sseConnected = true;
      console.log('⚡ Connected to B2B (Best of Beauty) Real-Time SSE Stream');
    });

    evtSource.addEventListener('new_appointment', (e) => {
      const appt = JSON.parse(e.data);
      state.appointments.unshift(appt);
      updateAdminNotificationBadge(1);
      showToast('🔔 New Appointment Booked!', `${appt.customerName} booked ${appt.serviceName} for ${appt.date}`, 'alert');
      renderAdminDashboard();
    });

    evtSource.addEventListener('new_order', (e) => {
      const order = JSON.parse(e.data);
      state.orders.unshift(order);
      updateAdminNotificationBadge(1);
      showToast('🛍️ New E-Commerce Order!', `${order.customerName} ordered products worth ₹${order.total}`, 'alert');
      renderAdminDashboard();
    });

    evtSource.addEventListener('update_appointment', () => fetchAppointments());
    evtSource.addEventListener('update_order', () => fetchOrders());

  } catch (err) {
    console.warn('SSE connection failed, using periodic polling fallback');
    setInterval(() => {
      if (state.isAdminAuthenticated) {
        fetchAppointments();
        fetchOrders();
      }
    }, 10000);
  }
};

// --- RENDERING FUNCTIONS ---

// Render Service Cards
const renderServices = () => {
  const container = document.getElementById('servicesContainer');
  if (!container) return;

  container.innerHTML = state.services.map(srv => `
    <div class="glass-card glass-card-hover rounded-2xl overflow-hidden flex flex-col group border border-amber-500/20">
      <div class="relative h-56 overflow-hidden">
        <img src="${srv.image}" alt="${srv.title}" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110">
        <div class="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div>
        <span class="absolute top-3 left-3 bg-stone-900/80 backdrop-blur-md text-amber-300 border border-amber-500/30 text-xs px-3 py-1 rounded-full font-medium">
          <i class="far fa-clock mr-1"></i> ${srv.duration}
        </span>
        ${srv.popular ? `<span class="absolute top-3 right-3 bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 font-bold text-xs px-3 py-1 rounded-full shadow-lg">POPULAR</span>` : ''}
        <div class="absolute bottom-3 left-3 right-3 flex justify-between items-end">
          <span class="text-xs bg-amber-500/20 text-amber-200 border border-amber-400/30 px-2.5 py-0.5 rounded-md backdrop-blur-sm">
            <i class="fas fa-star text-amber-400 mr-1"></i>${srv.rating} (${srv.reviewsCount || 40}+)
          </span>
        </div>
      </div>

      <div class="p-6 flex-1 flex flex-col justify-between">
        <div>
          <h3 class="text-xl font-bold font-heading text-stone-900 group-hover:text-amber-700 transition-colors">
            ${srv.title}
          </h3>
          <p class="text-xs font-semibold text-amber-700 mt-1 uppercase tracking-wider">${srv.subtitle}</p>
          <p class="text-stone-600 text-sm mt-3 line-clamp-2 leading-relaxed">${srv.description}</p>
        </div>

        <div class="mt-6 pt-4 border-t border-stone-200 flex items-center justify-between">
          <div>
            <span class="text-xs text-stone-600 block">Price</span>
            <div class="flex items-baseline space-x-2">
              <span class="text-2xl font-bold text-stone-900">₹${srv.price}</span>
              ${srv.originalPrice ? `<span class="text-xs text-stone-600 line-through">₹${srv.originalPrice}</span>` : ''}
            </div>
          </div>
          <button onclick="openBookingModalForService('${srv.id}', '${srv.title}', ${srv.price})"
                  class="bg-rose-gold-gradient hover:opacity-95 text-stone-950 font-semibold px-5 py-2.5 rounded-xl shadow-md transition-all text-sm flex items-center space-x-2">
            <span>Select Service</span>
            <i class="fas fa-arrow-right text-xs"></i>
          </button>
        </div>
      </div>
    </div>
  `).join('');
};

// Render E-Commerce Product Catalog
const renderProducts = () => {
  const container = document.getElementById('productsContainer');
  if (!container) return;

  container.innerHTML = state.products.map(prod => `
    <div class="glass-card glass-card-hover rounded-2xl overflow-hidden flex flex-col group border border-stone-200">
      <div class="relative h-52 overflow-hidden bg-stone-100">
        <img src="${prod.image}" alt="${prod.name}" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105">
        ${prod.badge ? `<span class="absolute top-3 left-3 bg-amber-600 text-white font-semibold text-xs px-2.5 py-1 rounded-md shadow">${prod.badge}</span>` : ''}
      </div>

      <div class="p-5 flex-1 flex flex-col justify-between">
        <div>
          <div class="flex items-center justify-between text-xs text-stone-600 mb-1">
            <span>${prod.category}</span>
            <span class="text-amber-600"><i class="fas fa-star text-amber-400 mr-1"></i>${prod.rating}</span>
          </div>
          <h4 class="font-bold text-stone-900 text-base line-clamp-1 group-hover:text-amber-700 transition-colors">${prod.name}</h4>
          <p class="text-xs text-stone-600 mt-2 line-clamp-2">${prod.description}</p>
        </div>

        <div class="mt-4 pt-3 border-t border-stone-200 flex items-center justify-between">
          <div class="flex items-baseline space-x-1.5">
            <span class="text-xl font-bold text-stone-900">₹${prod.price}</span>
            ${prod.originalPrice ? `<span class="text-xs text-stone-600 line-through">₹${prod.originalPrice}</span>` : ''}
          </div>
          <button onclick="addToCart('${prod.id}')"
                  class="bg-stone-900 hover:bg-stone-800 text-amber-300 font-medium px-4 py-2 rounded-xl text-xs flex items-center space-x-1.5 transition-all shadow-sm">
            <i class="fas fa-shopping-bag"></i>
            <span>Add to Cart</span>
          </button>
        </div>
      </div>
    </div>
  `).join('');
};

// Populate Service Selection Dropdown
const populateServiceDropdown = () => {
  const select = document.getElementById('bookingServiceSelect');
  if (!select) return;

  select.innerHTML = `<option value="">-- Choose a Service --</option>` +
    state.services.map(s => `<option value="${s.id}" data-price="${s.price}" data-title="${s.title}">${s.title} (₹${s.price})</option>`).join('');
};

// --- CART MANAGEMENT ---

const addToCart = (productId) => {
  const product = state.products.find(p => p.id === productId);
  if (!product) return;

  const existing = state.cart.find(item => item.id === productId);
  if (existing) {
    existing.quantity += 1;
  } else {
    state.cart.push({ ...product, quantity: 1 });
  }

  saveCart();
  updateCartUI();
  showToast('🛒 Added to Cart', `${product.name} added to your pampering cart.`);
};

const updateCartQuantity = (productId, delta) => {
  const item = state.cart.find(i => i.id === productId);
  if (!item) return;

  item.quantity += delta;
  if (item.quantity <= 0) {
    state.cart = state.cart.filter(i => i.id !== productId);
  }

  saveCart();
  updateCartUI();
};

const removeFromCart = (productId) => {
  state.cart = state.cart.filter(i => i.id !== productId);
  saveCart();
  updateCartUI();
};

const saveCart = () => {
  localStorage.setItem('b2b_cart', JSON.stringify(state.cart));
};

const updateCartUI = () => {
  const badge = document.getElementById('cartBadgeCount');
  const itemsContainer = document.getElementById('cartItemsContainer');
  const subtotalEl = document.getElementById('cartSubtotalAmount');
  const totalEl = document.getElementById('cartTotalAmount');

  const totalCount = state.cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = state.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  if (badge) {
    badge.innerText = totalCount;
    badge.classList.toggle('hidden', totalCount === 0);
  }

  if (itemsContainer) {
    if (state.cart.length === 0) {
      itemsContainer.innerHTML = `
        <div class="text-center py-12 px-4">
          <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-50 flex items-center justify-center text-amber-600 text-2xl">
            <i class="fas fa-shopping-bag"></i>
          </div>
          <p class="text-stone-700 font-medium text-sm">Your pampering cart is empty.</p>
          <p class="text-stone-600 text-xs mt-1">Explore our luxurious B2B skincare & hair products above!</p>
        </div>
      `;
    } else {
      itemsContainer.innerHTML = state.cart.map(item => `
        <div class="flex items-center space-x-3 p-3 rounded-xl bg-stone-50 border border-stone-200">
          <img src="${item.image}" alt="${item.name}" class="w-14 h-14 object-cover rounded-lg border border-stone-200">
          <div class="flex-1 min-w-0">
            <h5 class="text-xs font-bold text-stone-900 truncate">${item.name}</h5>
            <p class="text-xs font-semibold text-amber-700 mt-0.5">₹${item.price}</p>
            <div class="flex items-center space-x-2 mt-1">
              <button onclick="updateCartQuantity('${item.id}', -1)" class="w-5 h-5 rounded bg-stone-200 text-stone-700 text-xs flex items-center justify-center hover:bg-stone-300">-</button>
              <span class="text-xs font-medium text-stone-800">${item.quantity}</span>
              <button onclick="updateCartQuantity('${item.id}', 1)" class="w-5 h-5 rounded bg-stone-200 text-stone-700 text-xs flex items-center justify-center hover:bg-stone-300">+</button>
            </div>
          </div>
          <div class="text-right">
            <span class="text-xs font-bold text-stone-900 block">₹${item.price * item.quantity}</span>
            <button onclick="removeFromCart('${item.id}')" class="text-rose-500 hover:text-rose-700 text-xs mt-1">
              <i class="fas fa-trash-alt"></i>
            </button>
          </div>
        </div>
      `).join('');
    }
  }

  if (subtotalEl) subtotalEl.innerText = `₹${subtotal}`;
  if (totalEl) totalEl.innerText = `₹${subtotal}`;
};

// Toggle Cart Drawer
const toggleCartDrawer = () => {
  const drawer = document.getElementById('cartDrawer');
  const overlay = document.getElementById('cartOverlay');
  if (!drawer) return;

  const isOpen = !drawer.classList.contains('translate-x-full');
  if (isOpen) {
    drawer.classList.add('translate-x-full');
    overlay.classList.add('hidden');
  } else {
    updateCartUI();
    drawer.classList.remove('translate-x-full');
    overlay.classList.remove('hidden');
  }
};

// Open Checkout Modal
const openCheckoutModal = () => {
  if (state.cart.length === 0) {
    showToast('Cart Empty', 'Please add products before checking out.', 'alert');
    return;
  }
  toggleCartDrawer();
  document.getElementById('checkoutModal').classList.remove('hidden');
};

const closeCheckoutModal = () => {
  document.getElementById('checkoutModal').classList.add('hidden');
};

// Handle Checkout Form Submission
const handleCheckoutSubmit = async (e) => {
  e.preventDefault();
  const name = document.getElementById('checkoutName').value;
  const phone = document.getElementById('checkoutPhone').value;
  const address = document.getElementById('checkoutAddress').value;
  const payment = document.getElementById('checkoutPayment').value;

  const subtotal = state.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const orderPayload = {
    customerName: name,
    phone: phone,
    address: address,
    paymentMethod: payment,
    items: state.cart.map(i => ({ id: i.id, name: i.name, price: i.price, quantity: i.quantity })),
    subtotal: subtotal,
    discount: 0,
    total: subtotal
  };

  try {
    const res = await fetch(`${API_BASE}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderPayload)
    });
    const data = await res.json();
    if (data.success) {
      state.orders.unshift(data.data);
    }
  } catch (err) {
    // LocalStorage fallback
    const fallbackOrder = {
      id: `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
      ...orderPayload,
      status: 'Pending',
      createdAt: new Date().toISOString()
    };
    state.orders.unshift(fallbackOrder);
    localStorage.setItem('b2b_orders', JSON.stringify(state.orders));
  }

  // Clear Cart
  state.cart = [];
  saveCart();
  updateCartUI();
  closeCheckoutModal();

  showToast('🎉 Order Placed Successfully!', `Thank you ${name}! Your products order has been logged.`);
  renderAdminDashboard();
};

// --- APPOINTMENT BOOKING SYSTEM ---

const openBookingModalForService = (srvId, srvTitle, price) => {
  const select = document.getElementById('bookingServiceSelect');
  if (select && srvId) {
    select.value = srvId;
  }

  // Auto set date picker min to today
  const dateInput = document.getElementById('bookingDate');
  if (dateInput) {
    const today = new Date().toISOString().split('T')[0];
    dateInput.min = today;
    if (!dateInput.value) dateInput.value = today;
  }

  const modal = document.getElementById('bookingModal');
  if (modal) modal.classList.remove('hidden');
};

const closeBookingModal = () => {
  const modal = document.getElementById('bookingModal');
  if (modal) modal.classList.add('hidden');
};

const selectTimeSlot = (slotBtn, slotText) => {
  state.selectedTimeSlot = slotText;
  document.querySelectorAll('.time-slot-btn').forEach(btn => {
    btn.classList.remove('bg-amber-600', 'text-white', 'border-amber-600');
    btn.classList.add('bg-stone-100', 'text-stone-700', 'border-stone-200');
  });
  slotBtn.classList.remove('bg-stone-100', 'text-stone-700', 'border-stone-200');
  slotBtn.classList.add('bg-amber-600', 'text-white', 'border-amber-600');
};

const handleBookingFormSubmit = async (e) => {
  e.preventDefault();

  const name = document.getElementById('bookingName').value;
  const phone = document.getElementById('bookingPhone').value;
  const serviceSelect = document.getElementById('bookingServiceSelect');
  const serviceId = serviceSelect.value;
  const serviceOption = serviceSelect.options[serviceSelect.selectedIndex];
  const serviceTitle = serviceOption ? serviceOption.getAttribute('data-title') || 'Beauty Treatment' : 'Beauty Treatment';
  const price = serviceOption ? Number(serviceOption.getAttribute('data-price') || 0) : 0;
  const date = document.getElementById('bookingDate').value;
  const notes = document.getElementById('bookingNotes').value;

  const payload = {
    customerName: name,
    phone: phone,
    serviceId: serviceId,
    serviceName: serviceTitle,
    price: price,
    date: date,
    timeSlot: state.selectedTimeSlot,
    notes: notes
  };

  let newAppointment = null;

  try {
    const res = await fetch(`${API_BASE}/api/appointments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (data.success && data.data) {
      newAppointment = data.data;
      state.appointments.unshift(newAppointment);
    }
  } catch (err) {
    // LocalStorage Fallback
    newAppointment = {
      id: `B2B-${Math.floor(1000 + Math.random() * 9000)}`,
      ...payload,
      status: 'Pending',
      createdAt: new Date().toISOString()
    };
    state.appointments.unshift(newAppointment);
    localStorage.setItem('b2b_appointments', JSON.stringify(state.appointments));
  }

  closeBookingModal();
  document.getElementById('bookingForm').reset();

  // Show Confirmation Popup
  showConfirmationModal(newAppointment || payload);
  updateAdminNotificationBadge(1);
  renderAdminDashboard();
};

const showConfirmationModal = (appt) => {
  const modal = document.getElementById('confirmationModal');
  const detailsEl = document.getElementById('confirmDetailsContainer');
  const whatsappBtn = document.getElementById('confirmWhatsappShareBtn');

  if (!modal || !detailsEl) return;

  const refId = appt.id || `B2B-${Math.floor(1000 + Math.random() * 9000)}`;

  detailsEl.innerHTML = `
    <div class="bg-amber-50 border border-amber-200 rounded-xl p-4 text-left space-y-2 text-xs text-stone-800">
      <div class="flex justify-between border-b border-amber-200 pb-2">
        <span class="text-stone-500">Booking Reference:</span>
        <span class="font-bold text-amber-800">${refId}</span>
      </div>
      <div class="flex justify-between">
        <span class="text-stone-500">Guest Name:</span>
        <span class="font-semibold text-stone-900">${appt.customerName}</span>
      </div>
      <div class="flex justify-between">
        <span class="text-stone-500">Service:</span>
        <span class="font-semibold text-amber-700">${appt.serviceName}</span>
      </div>
      <div class="flex justify-between">
        <span class="text-stone-500">Scheduled Date:</span>
        <span class="font-semibold text-stone-900">${appt.date}</span>
      </div>
      <div class="flex justify-between">
        <span class="text-stone-500">Time Slot:</span>
        <span class="font-semibold text-stone-900">${appt.timeSlot}</span>
      </div>
    </div>
  `;

  if (whatsappBtn) {
    const message = encodeURIComponent(`Hello B2B (Best of Beauty)! I have booked an appointment.\n\nBooking ID: ${refId}\nName: ${appt.customerName}\nService: ${appt.serviceName}\nDate: ${appt.date}\nTime: ${appt.timeSlot}`);
    whatsappBtn.href = `https://wa.me/919876543210?text=${message}`;
  }

  modal.classList.remove('hidden');
};

const closeConfirmationModal = () => {
  document.getElementById('confirmationModal').classList.add('hidden');
};

// --- OWNER NOTIFICATION & ADMIN DASHBOARD ---

const updateAdminNotificationBadge = (countDelta = 0) => {
  const badge = document.getElementById('adminNoticeBadge');
  if (!badge) return;

  let current = parseInt(badge.innerText || '0', 10);
  current += countDelta;
  if (current <= 0) {
    badge.innerText = '0';
    badge.classList.add('hidden');
  } else {
    badge.innerText = current;
    badge.classList.remove('hidden');
  }
};

const toggleAdminModal = () => {
  const modal = document.getElementById('adminDashboardModal');
  if (!modal) return;

  if (modal.classList.contains('hidden')) {
    // Reset notification badge counter on view
    updateAdminNotificationBadge(-999);
    modal.classList.remove('hidden');
    fetchAppointments();
    fetchOrders();
  } else {
    modal.classList.add('hidden');
  }
};

const switchAdminTab = (tabName) => {
  document.getElementById('adminApptsTab').classList.toggle('hidden', tabName !== 'appts');
  document.getElementById('adminOrdersTab').classList.toggle('hidden', tabName !== 'orders');

  document.getElementById('btnAdminTabAppts').classList.toggle('border-amber-600', tabName === 'appts');
  document.getElementById('btnAdminTabAppts').classList.toggle('text-amber-600', tabName === 'appts');
  document.getElementById('btnAdminTabOrders').classList.toggle('border-amber-600', tabName === 'orders');
  document.getElementById('btnAdminTabOrders').classList.toggle('text-amber-600', tabName === 'orders');
};

// Render Owner Admin Dashboard
const renderAdminDashboard = () => {
  const apptsTable = document.getElementById('adminApptsTableBody');
  const ordersTable = document.getElementById('adminOrdersTableBody');
  const totalRevEl = document.getElementById('adminStatRevenue');
  const totalApptsEl = document.getElementById('adminStatAppts');
  const pendingCountEl = document.getElementById('adminStatPending');

  const totalApptRev = state.appointments.reduce((sum, a) => sum + (a.status !== 'Cancelled' ? Number(a.price || 0) : 0), 0);
  const totalOrderRev = state.orders.reduce((sum, o) => sum + (o.status !== 'Cancelled' ? Number(o.total || 0) : 0), 0);
  const pendingCount = state.appointments.filter(a => a.status === 'Pending').length + state.orders.filter(o => o.status === 'Pending').length;

  if (totalRevEl) totalRevEl.innerText = `₹${(totalApptRev + totalOrderRev).toLocaleString()}`;
  if (totalApptsEl) totalApptsEl.innerText = state.appointments.length;
  if (pendingCountEl) pendingCountEl.innerText = pendingCount;

  // Render Appointments
  if (apptsTable) {
    if (state.appointments.length === 0) {
      apptsTable.innerHTML = `<tr><td colspan="6" class="p-6 text-center text-stone-500 text-xs">No appointments booked yet.</td></tr>`;
    } else {
      apptsTable.innerHTML = state.appointments.map(a => `
        <tr class="border-b border-stone-200 hover:bg-stone-50 text-xs transition-colors">
          <td class="p-3 font-bold text-amber-800">${a.id}</td>
          <td class="p-3">
            <span class="font-semibold text-stone-900 block">${a.customerName}</span>
            <span class="text-stone-500 text-[11px]"><i class="fas fa-phone-alt text-stone-400 mr-1"></i>${a.phone}</span>
          </td>
          <td class="p-3">
            <span class="font-medium text-stone-900 block">${a.serviceName}</span>
            <span class="text-stone-500 font-bold">₹${a.price}</span>
          </td>
          <td class="p-3 text-stone-700">
            <span class="block font-medium">${a.date}</span>
            <span class="text-stone-500">${a.timeSlot}</span>
          </td>
          <td class="p-3">
            <select onchange="updateAppointmentStatus('${a.id}', this.value)"
                    class="text-xs px-2 py-1 rounded-md border ${getStatusBadgeClass(a.status)} font-semibold">
              <option value="Pending" ${a.status === 'Pending' ? 'selected' : ''}>Pending</option>
              <option value="Confirmed" ${a.status === 'Confirmed' ? 'selected' : ''}>Confirmed</option>
              <option value="Completed" ${a.status === 'Completed' ? 'selected' : ''}>Completed</option>
              <option value="Cancelled" ${a.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
            </select>
          </td>
          <td class="p-3 space-x-1">
            <a href="tel:${a.phone}" class="p-1.5 rounded-lg bg-emerald-100 text-emerald-700 hover:bg-emerald-200 inline-block" title="Call Customer">
              <i class="fas fa-phone-alt"></i>
            </a>
            <a href="https://wa.me/91${a.phone}?text=${encodeURIComponent(`Hello ${a.customerName}, regarding your appointment at B2B (Best of Beauty) for ${a.serviceName} on ${a.date} (${a.timeSlot}):`)}"
               target="_blank" class="p-1.5 rounded-lg bg-green-100 text-green-700 hover:bg-green-200 inline-block" title="WhatsApp Customer">
              <i class="fab fa-whatsapp text-sm"></i>
            </a>
          </td>
        </tr>
      `).join('');
    }
  }

  // Render Product Orders
  if (ordersTable) {
    if (state.orders.length === 0) {
      ordersTable.innerHTML = `<tr><td colspan="6" class="p-6 text-center text-stone-500 text-xs">No e-commerce orders placed yet.</td></tr>`;
    } else {
      ordersTable.innerHTML = state.orders.map(o => `
        <tr class="border-b border-stone-200 hover:bg-stone-50 text-xs transition-colors">
          <td class="p-3 font-bold text-amber-800">${o.id}</td>
          <td class="p-3">
            <span class="font-semibold text-stone-900 block">${o.customerName}</span>
            <span class="text-stone-500 text-[11px]">${o.phone}</span>
          </td>
          <td class="p-3">
            <span class="text-stone-800 block line-clamp-1">${(o.items || []).map(i => `${i.name} (${i.quantity})`).join(', ')}</span>
            <span class="font-bold text-emerald-700">₹${o.total}</span>
          </td>
          <td class="p-3 text-stone-600">${o.paymentMethod || 'Cash'}</td>
          <td class="p-3">
            <select onchange="updateOrderStatus('${o.id}', this.value)"
                    class="text-xs px-2 py-1 rounded-md border ${getStatusBadgeClass(o.status)} font-semibold">
              <option value="Pending" ${o.status === 'Pending' ? 'selected' : ''}>Pending</option>
              <option value="Confirmed" ${o.status === 'Confirmed' ? 'selected' : ''}>Confirmed</option>
              <option value="Delivered" ${o.status === 'Delivered' ? 'selected' : ''}>Delivered</option>
              <option value="Cancelled" ${o.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
            </select>
          </td>
          <td class="p-3 space-x-1">
            <a href="tel:${o.phone}" class="p-1.5 rounded-lg bg-emerald-100 text-emerald-700 hover:bg-emerald-200 inline-block" title="Call">
              <i class="fas fa-phone-alt"></i>
            </a>
            <a href="https://wa.me/91${o.phone}?text=${encodeURIComponent(`Hello ${o.customerName}, regarding your order #${o.id} from B2B (Best of Beauty):`)}"
               target="_blank" class="p-1.5 rounded-lg bg-green-100 text-green-700 hover:bg-green-200 inline-block" title="WhatsApp">
              <i class="fab fa-whatsapp text-sm"></i>
            </a>
          </td>
        </tr>
      `).join('');
    }
  }
};

const getStatusBadgeClass = (status) => {
  switch (status) {
    case 'Confirmed': return 'bg-emerald-50 text-emerald-700 border-emerald-300';
    case 'Completed':
    case 'Delivered': return 'bg-blue-50 text-blue-700 border-blue-300';
    case 'Cancelled': return 'bg-rose-50 text-rose-700 border-rose-300';
    default: return 'bg-amber-50 text-amber-700 border-amber-300';
  }
};

const updateAppointmentStatus = async (id, newStatus) => {
  try {
    await fetch(`${API_BASE}/api/appointments/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    });
  } catch (err) {
    const item = state.appointments.find(a => a.id === id);
    if (item) item.status = newStatus;
    localStorage.setItem('b2b_appointments', JSON.stringify(state.appointments));
  }
  showToast('Status Updated', `Appointment ${id} set to ${newStatus}`);
  fetchAppointments();
};

const updateOrderStatus = async (id, newStatus) => {
  try {
    await fetch(`${API_BASE}/api/orders/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    });
  } catch (err) {
    const item = state.orders.find(o => o.id === id);
    if (item) item.status = newStatus;
    localStorage.setItem('b2b_orders', JSON.stringify(state.orders));
  }
  showToast('Status Updated', `Order ${id} set to ${newStatus}`);
  fetchOrders();
};

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
  fetchServices();
  fetchProducts();
  fetchAppointments();
  fetchOrders();
  initRealtimeSSE();
  updateCartUI();

  // Set default booking date to today
  const dateInput = document.getElementById('bookingDate');
  if (dateInput) {
    const today = new Date().toISOString().split('T')[0];
    dateInput.min = today;
    dateInput.value = today;
  }
});
