// Enhanced Shop - script.js
// Features: search, filter, sort, price filter, modal details, fly-to-cart, dark mode, cart persistence

// STATE
let products = [];
let cart = [];

// DOM
const productListEl = document.getElementById('productList');
const cartItemsEl = document.getElementById('cartItems');
const cartTotalEl = document.getElementById('cartTotal');
const cartCountEl = document.getElementById('cartCount');
const openCartBtn = document.getElementById('openCartBtn');
const closeCartBtn = document.getElementById('closeCartBtn');
const cartSidebar = document.getElementById('cartSidebar');
const overlay = document.getElementById('overlay');
const checkoutBtn = document.getElementById('checkoutBtn');
const clearCartBtn = document.getElementById('clearCart');
const searchInput = document.getElementById('searchInput');
const sortSelect = document.getElementById('sortSelect');
const categorySelect = document.getElementById('categorySelect');
const minPriceEl = document.getElementById('minPrice');
const maxPriceEl = document.getElementById('maxPrice');
const applyPriceBtn = document.getElementById('applyPrice');
const darkToggle = document.getElementById('darkToggle');
const modal = document.getElementById('modal');
const modalImg = document.getElementById('modalImg');
const modalTitle = document.getElementById('modalTitle');
const modalDesc = document.getElementById('modalDesc');
const modalPrice = document.getElementById('modalPrice');
const modalAdd = document.getElementById('modalAdd');
const modalClose = document.getElementById('modalClose');
/*
- products menyimpan array produk dari products.json.
- cart menyimpan array {id, qty} yang di-persist di localStorage.
- DOM refs dipanggil sekali di awal supaya kita gampang akses elemen tanpa query ulang.
*/

// UTILS
function escapeHtml(str) { return String(str).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;') }
function q(sel) { return document.querySelector(sel) }

/*
- escapeHtml: mencegah XSS kecil ketika menaruh teks ke innerHTML (praktik aman).
- q helper cepat jika butuh querySelector (opsional).
*/

// LOAD PRODUCTS
async function loadProducts() {
    try {
        const res = await fetch('data/products.json');
        if (!res.ok) throw new Error('failed');
        products = await res.json();
        populateCategory();
    } catch (err) { console.error(err); products = [] }
}

/*
- loadProducts: fetch data produk dari JSON eksternal.
- populateCategory: isi dropdown kategori berdasarkan data produk.
*/

// RENDER PRODUCTS with filters
function getFiltered() {
    const qText = searchInput.value.trim().toLowerCase();
    const cat = categorySelect.value;
    const sort = sortSelect.value;
    const min = Number(minPriceEl.value) || 0;
    const max = Number(maxPriceEl.value) || Infinity;

    let list = products.filter(p => {
        const matchText = (p.name + ' ' + p.category + ' ' + (p.tags || '')).toLowerCase().includes(qText);
        const matchCat = cat === 'all' ? true : p.category === cat;
        const matchPrice = p.price >= min && p.price <= max;
        return matchText && matchCat && matchPrice;
    });

    // sorting
    if (sort === 'price-asc') list.sort((a, b) => a.price - b.price);
    else if (sort === 'price-desc') list.sort((a, b) => b.price - a.price);
    else if (sort === 'alpha-asc') list.sort((a, b) => a.name.localeCompare(b.name));
    else if (sort === 'alpha-desc') list.sort((a, b) => b.name.localeCompare(a.name));

    return list;
}

/*
- getFiltered: mengembalikan array produk yang sudah difilter berdasarkan input user.
- filter berdasarkan teks pencarian, kategori, dan rentang harga.
- sorting berdasarkan pilihan user.
- Fungsi ini menerima input dari search, category, price, dan sort; lalu mengembalikan list produk yang cocok.
- Number(minPriceEl.value) || 0 → jika input kosong hasilnya 0, untuk min; max default ke Infinity.
- includes(qText) → pencarian sederhana (case-insensitive).
*/

function renderProducts() {
    const list = getFiltered();
    productListEl.innerHTML = '';
    if (!list.length) { productListEl.innerHTML = '<p class="empty">No products found.</p>'; return }

    list.forEach(p => {
        const card = document.createElement('div'); card.className = 'product-card';
        card.innerHTML = `
      <img src="${p.image}" alt="${escapeHtml(p.name)}" data-id="${p.id}" class="thumb" />
      <h3>${escapeHtml(p.name)}</h3>
      <div class="product-meta"><div>Rp${Number(p.price).toLocaleString()}</div><div class="badge">${escapeHtml(p.category)}</div></div>
      <p style="margin-top:8px;color:var(--muted);font-size:13px">${escapeHtml(p.short || '')}</p>
      <button class="add-btn" data-id="${p.id}">Add to Cart</button>
      <button class="details-btn" data-id="${p.id}" style="margin-top:8px;background:#eef6ff;border:1px solid #d6e9ff;padding:8px;border-radius:8px;cursor:pointer">Details</button>
    `;
        productListEl.appendChild(card);
    });

    // attach listeners
    productListEl.querySelectorAll('.add-btn').forEach(btn => btn.addEventListener('click', e => {
        const id = Number(btn.getAttribute('data-id'));
        addToCart(id, true);
    }));
    productListEl.querySelectorAll('.thumb').forEach(img => img.addEventListener('click', e => openDetails(Number(e.target.dataset.id))));
    productListEl.querySelectorAll('.details-btn').forEach(b => b.addEventListener('click', e => openDetails(Number(e.target.dataset.id))));
}
/*
- Menghapus isi sebelumnya lalu membuat card baru untuk setiap item.
- data-id pada elemen gambar & button → ideal untuk mengetahui product id saat event.
- Setelah render, attach event listeners (bukan sebelum — karena elemen baru).
*/

// CATEGORIES
function populateCategory() {
    const cats = Array.from(new Set(products.map(p => p.category)));
    categorySelect.innerHTML = '<option value="all">All Categories</option>' + cats.map(c => `<option value="${c}">${c}</option>`).join('');
}
/*
- Set untuk membuat unique categories.
- map + join untuk menghasilkan HTML option list.
- Menunjukkan manipulasi array (map, Set) — bagus kaitkan ke materi array sebelumnya.
*/

// CART CRUD
function loadCart() { const s = localStorage.getItem('cartData'); cart = s ? JSON.parse(s) : [] }
function saveCart() { localStorage.setItem('cartData', JSON.stringify(cart)) }

function addToCart(id, animate = false) {
    const it = cart.find(x => x.id === id);
    if (it) it.qty++; else cart.push({ id, qty: 1 });
    saveCart(); renderCart(); updateCartCount();
    if (animate) runFlyToCart(id);
}
function changeQty(id, delta) { const it = cart.find(x => x.id === id); if (!it) return; it.qty += delta; if (it.qty <= 0) cart = cart.filter(x => x.id !== id); saveCart(); renderCart(); updateCartCount(); }
function removeItem(id) { cart = cart.filter(x => x.id !== id); saveCart(); renderCart(); updateCartCount(); }
function clearCart() { cart = []; saveCart(); renderCart(); updateCartCount(); }

/*
Fungsi-fungsi:

loadCart(): baca localStorage.getItem('cartData'), parse JSON.
saveCart(): simpan ke localStorage.
addToCart(id, animate): tambahkan item (jika sudah ada qty++), simpan lalu render.
changeQty(id,delta), removeItem(id), clearCart().

Penjelasan konsep:

cart model simpel: array of {id, qty}. Kita cari produk lengkap dari products saat render cart.
localStorage persist antar reload: localStorage.setItem('cartData', JSON.stringify(cart)).
Keuntungan persistent — siswa paham UX dasar.

Edge cases:
Jika produk di products.json hilang, cek renderCart() — ada if (!p) return; agar tidak crash.
*/

function renderCart() {
    cartItemsEl.innerHTML = '';
    if (cart.length === 0) { cartItemsEl.innerHTML = '<p class="empty">Your cart is empty.</p>'; cartTotalEl.textContent = 'Rp0'; return }
    cart.forEach(c => {
        const p = products.find(x => x.id === c.id); if (!p) return;
        const li = document.createElement('li'); li.className = 'cart-item';
        li.innerHTML = `
      <div style="display:flex;gap:8px;align-items:center">
        <img src="${p.image}" alt="${escapeHtml(p.name)}" />
        <div class="meta"><strong>${escapeHtml(p.name)}</strong><small>Rp${p.price.toLocaleString()} • Sub: Rp${(p.price * c.qty).toLocaleString()}</small></div>
      </div>
      <div style="display:flex;flex-direction:column;align-items:flex-end">
        <div class="qty-controls">
          <button class="qty-btn" data-id="${c.id}" data-delta="-1">-</button>
          <span>${c.qty}</span>
          <button class="qty-btn" data-id="${c.id}" data-delta="1">+</button>
        </div>
        <button class="remove-btn" data-id="${c.id}">Remove</button>
      </div>
    `;
        cartItemsEl.appendChild(li);
    });

    // attach handlers
    cartItemsEl.querySelectorAll('.qty-btn').forEach(b => b.addEventListener('click', e => { const id = Number(b.getAttribute('data-id')); const d = Number(b.getAttribute('data-delta')); changeQty(id, d); }));
    cartItemsEl.querySelectorAll('.remove-btn').forEach(b => b.addEventListener('click', e => { removeItem(Number(b.getAttribute('data-id'))); }));

    updateTotal();
}

function updateTotal() {
    const total = cart.reduce((s, i) => { const p = products.find(x => x.id === i.id); return s + (p ? p.price * i.qty : 0) }, 0);
    cartTotalEl.textContent = 'Rp' + total.toLocaleString();
}

/*
- reduce menghitung total.
- Attach handlers tiap render (qty buttons dan remove buttons).
*/

function updateCartCount() { const c = cart.reduce((s, i) => s + i.qty, 0); cartCountEl.textContent = c }

// Fly-to-cart animation
function runFlyToCart(id) {
    const p = products.find(x => x.id === id); if (!p) return;
    const img = document.querySelector(`img[data-id="${id}"]`);
    if (!img) return;
    const clone = img.cloneNode(true);
    clone.className = 'fly-img'; document.body.appendChild(clone);
    const rect = img.getBoundingClientRect(); clone.style.left = rect.left + 'px'; clone.style.top = rect.top + 'px'; clone.style.width = rect.width + 'px'; clone.style.height = rect.height + 'px';
    const cartRect = document.getElementById('openCartBtn').getBoundingClientRect();
    requestAnimationFrame(() => {
        clone.style.transform = `translate(${cartRect.left - rect.left}px, ${cartRect.top - rect.top}px) scale(.2)`;
        clone.style.opacity = '0.6';
    });
    setTimeout(() => { clone.remove(); }, 700);
}


/*
- Buat clone image, posisikan di layar sesuai posisi aslinya (getBoundingClientRect()).
- requestAnimationFrame untuk transisi halus.
- Setelah anim selesai hapus clone.
*/

// DETAILS MODAL
let modalCurrentId = null;
function openDetails(id) { const p = products.find(x => x.id === id); if (!p) return; modalCurrentId = id; modalImg.src = p.image; modalTitle.textContent = p.name; modalDesc.textContent = p.description || p.short || ''; modalPrice.textContent = 'Rp' + p.price.toLocaleString(); modal.classList.add('show'); modal.setAttribute('aria-hidden', 'false') }
function closeDetails() { modal.classList.remove('show'); modal.setAttribute('aria-hidden', 'true') }
modalClose.addEventListener('click', closeDetails);
// close modal when clicking outside content
modal.addEventListener('click', e => { if (e.target === modal) closeDetails(); });
/*
- Isi modal dengan data produk lalu tampilkan (class .show mengubah display).
- Klik outside modal (e.target === modal) menutup — pattern umum.
*/
modalAdd.addEventListener('click', () => { if (modalCurrentId) { addToCart(modalCurrentId, true); closeDetails(); } });

// CART SIDEBAR Toggle
function openCart() { cartSidebar.classList.add('open'); overlay.classList.add('show'); cartSidebar.setAttribute('aria-hidden', 'false') }
function closeCart() { cartSidebar.classList.remove('open'); overlay.classList.remove('show'); cartSidebar.setAttribute('aria-hidden', 'true') }
openCartBtn.addEventListener('click', openCart);
closeCartBtn.addEventListener('click', closeCart);
overlay.addEventListener('click', closeCart);
// global Escape: close cart or modal if open
document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
        closeCart();
        closeDetails();
    }
});

// DARK MODE
function loadTheme() { const t = localStorage.getItem('theme'); if (t === 'dark') document.body.classList.add('dark') }
function toggleDark() { document.body.classList.toggle('dark'); localStorage.setItem('theme', document.body.classList.contains('dark') ? 'dark' : 'light') }
// Toggle class .dark pada body, simpan pilihan user ke localStorage → persist tema

loadTheme(); darkToggle.addEventListener('click', toggleDark);

// EVENTS: search, sort, category, price
searchInput.addEventListener('input', debounce(() => renderProducts(), 200));
sortSelect.addEventListener('change', () => renderProducts());
categorySelect.addEventListener('change', () => renderProducts());
applyPriceBtn.addEventListener('click', () => renderProducts());

/*
- searchInput.addEventListener('input', debounce(() => renderProducts(), 200)); → debounce untuk performa.
- sortSelect, categorySelect, applyPriceBtn → panggil renderProducts().
*/

// CLEAR / CHECKOUT
clearCartBtn.addEventListener('click', () => { if (confirm('Clear cart?')) clearCart(); });
checkoutBtn.addEventListener('click', () => { if (cart.length === 0) { alert('Cart empty') } else { alert('Checkout'); clearCart(); closeCart(); } });

// simple debounce
function debounce(fn, ms = 200) { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms) } }

// INIT
async function init() { await loadProducts(); loadCart(); renderProducts(); renderCart(); updateCartCount(); }
init();
