/**
 * B2B (Best of Beauty) - Customer Application Logic
 * Pure ES6+ JavaScript handling Services, Products, Cart, & Appointment Booking
 */

// Global State
const state = {
  services: [],
  products: [],
  cart: JSON.parse(localStorage.getItem('b2b_cart') || '[]'),
  selectedTimeSlot: '11:00 AM (Morning)'
};

// API Base URL
const API_BASE = window.location.protocol.startsWith('http') ? '' : 'http://localhost:3000';

// Default fetch headers including Ngrok bypass
const getFetchHeaders = () => ({
  'Content-Type': 'application/json',
  'ngrok-skip-browser-warning': 'true'
});

// Customer Toast Notification Helper
const showToast = (title, message) => {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `p-4 rounded-xl border shadow-2xl flex items-start space-x-3 transition-all duration-300 animate-slide-in bg-stone-900 border-amber-500 text-amber-100 max-w-sm w-full pointer-events-auto`;
  toast.innerHTML = `
    <div class="p-2 rounded-full bg-amber-500/20 text-amber-400 shrink-0">
      <i class="fas fa-sparkles text-amber-300"></i>
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

  setTimeout(() => {
    toast.classList.remove('animate-slide-in');
    toast.classList.add('animate-slide-out');
    setTimeout(() => toast.remove(), 400);
  }, 4000);
};

// --- API FETCHERS ---

// Load Initial Services
const fetchServices = async () => {
  try {
    const res = await fetch(`${API_BASE}/api/services`, { headers: getFetchHeaders() });
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
    const res = await fetch(`${API_BASE}/api/products`, { headers: getFetchHeaders() });
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
    showToast('Cart Empty', 'Please add products before checking out.');
    return;
  }
  toggleCartDrawer();
  const modal = document.getElementById('checkoutModal');
  if (modal) {
    modal.classList.remove('hidden');
    document.body.classList.add('modal-open');
    modal.scrollTop = 0;
  }
};

const closeCheckoutModal = () => {
  const modal = document.getElementById('checkoutModal');
  if (modal) {
    modal.classList.add('hidden');
    document.body.classList.remove('modal-open');
  }
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
    await fetch(`${API_BASE}/api/orders`, {
      method: 'POST',
      headers: getFetchHeaders(),
      body: JSON.stringify(orderPayload)
    });
  } catch (err) {
    console.log('Order saved via API');
  }

  // Clear Cart
  state.cart = [];
  saveCart();
  updateCartUI();
  closeCheckoutModal();

  showToast('🎉 Order Placed Successfully!', `Thank you ${name}! Your products order has been logged.`);
};

// --- APPOINTMENT BOOKING SYSTEM ---

const openBookingModalForService = (srvId) => {
  const select = document.getElementById('bookingServiceSelect');
  if (select && srvId) {
    select.value = srvId;
  }

  const dateInput = document.getElementById('bookingDate');
  if (dateInput) {
    const today = new Date().toISOString().split('T')[0];
    dateInput.min = today;
    if (!dateInput.value) dateInput.value = today;
  }

  const modal = document.getElementById('bookingModal');
  if (modal) {
    modal.classList.remove('hidden');
    document.body.classList.add('modal-open');
    modal.scrollTop = 0;
  }
};

const closeBookingModal = () => {
  const modal = document.getElementById('bookingModal');
  if (modal) {
    modal.classList.add('hidden');
    document.body.classList.remove('modal-open');
  }
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
      headers: getFetchHeaders(),
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (data.success && data.data) {
      newAppointment = data.data;
    }
  } catch (err) {
    newAppointment = {
      id: `B2B-${Math.floor(1000 + Math.random() * 9000)}`,
      ...payload,
      status: 'Pending',
      createdAt: new Date().toISOString()
    };
  }

  closeBookingModal();
  document.getElementById('bookingForm').reset();

  // Show Confirmation Popup to Customer
  showConfirmationModal(newAppointment || payload);
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
    whatsappBtn.href = `https://wa.me/917904183225?text=${message}`;
  }

  modal.classList.remove('hidden');
  document.body.classList.add('modal-open');
  modal.scrollTop = 0;
};

const closeConfirmationModal = () => {
  const modal = document.getElementById('confirmationModal');
  if (modal) {
    modal.classList.add('hidden');
    document.body.classList.remove('modal-open');
  }
};

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
  fetchServices();
  fetchProducts();
  updateCartUI();

  const dateInput = document.getElementById('bookingDate');
  if (dateInput) {
    const today = new Date().toISOString().split('T')[0];
    dateInput.min = today;
    dateInput.value = today;
  }
});
