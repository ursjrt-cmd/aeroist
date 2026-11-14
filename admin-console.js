import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const CFG = window.JRT_CONFIG || {};
const ready = /^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(String(CFG.supabaseUrl || '')) && /^(sb_publishable_|eyJ)/.test(String(CFG.supabaseAnonKey || ''));
const supabase = ready ? createClient(CFG.supabaseUrl, CFG.supabaseAnonKey) : null;
const $ = (id) => document.getElementById(id);
const state = {
  user: null, role: 'admin', tab: 'overview', products: [], categories: [], pages: [], sections: [],
  inquiries: [], orders: [], transactions: [], currentProduct: null, currentCategory: null,
  currentPage: null, currentSection: null, paymentSettings: null, storeSettings: [],
};

function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function slugify(value) {
  return String(value || '').toLowerCase().normalize('NFKD').replace(/[’']/g, '').replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}
function money(value, currency = 'INR') {
  try { return new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 2 }).format(Number(value || 0)); }
  catch { return `₹${Number(value || 0).toFixed(2)}`; }
}
function notify(message, kind = 'success') {
  const host = $('toast-host');
  const item = document.createElement('div'); item.className = `toast ${kind}`; item.textContent = message; host.append(item);
  setTimeout(() => item.remove(), 4500);
}
function jsonText(value, fallback) { return JSON.stringify(value ?? fallback, null, 2); }
function parseJson(text, expected, label) {
  let parsed;
  try { parsed = JSON.parse(text || JSON.stringify(expected)); }
  catch { throw new Error(`${label} must be valid JSON.`); }
  if (expected === null && (!parsed || typeof parsed !== 'object' || Array.isArray(parsed))) throw new Error(`${label} must be a JSON object.`);
  if (Array.isArray(expected) && !Array.isArray(parsed)) throw new Error(`${label} must be a JSON array.`);
  return parsed;
}
function setMessage(id, value, kind = '') {
  const el = $(id); if (!el) return;
  el.textContent = value; el.className = kind ? `message ${kind}` : 'message';
}
function setNotice(text) {
  const el = $('global-notice');
  el.hidden = !text; el.textContent = text || '';
}
function panelHeading(title, detail = '') {
  return `<div class="card-head"><div><h2>${esc(title)}</h2>${detail ? `<p>${esc(detail)}</p>` : ''}</div></div>`;
}
function empty(text) { return `<div class="empty">${esc(text)}</div>`; }

async function verifyAdmin(user) {
  if (!user) return false;
  const { data, error } = await supabase.from('admin_users').select('user_id,role').eq('user_id', user.id).maybeSingle();
  if (error) throw error;
  if (!data) return false;
  state.role = data.role || 'admin';
  return true;
}
async function login(email, password) {
  if (!supabase) throw new Error('Supabase configuration is missing. Check config.js.');
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  const allowed = await verifyAdmin(data.user);
  if (!allowed) {
    await supabase.auth.signOut();
    throw new Error('This account is not an authorised administrator. Add its Auth user UUID to public.admin_users.');
  }
  state.user = data.user;
  showConsole();
  await renderTab('overview');
}
function showLogin() {
  $('login-screen').hidden = false; $('console').hidden = true; $('admin-app').hidden = false; $('boot').hidden = true;
}
function showConsole() {
  $('login-screen').hidden = true; $('console').hidden = false; $('admin-app').hidden = false; $('boot').hidden = true;
  $('staff-email').textContent = state.user?.email || 'Administrator';
  $('staff-avatar').textContent = (state.user?.email || 'A').slice(0, 1).toUpperCase();
  $('staff-role').textContent = String(state.role).replaceAll('_', ' ');
  $('connection-state').textContent = 'Supabase connected';
}
async function restoreSession() {
  if (!supabase) {
    $('boot').hidden = true; $('admin-app').hidden = false; $('login-screen').hidden = false;
    setMessage('login-message', 'Supabase config.js is missing or invalid. Set a project URL and publishable key before signing in.');
    return;
  }
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  const user = data.session?.user;
  if (!user) return showLogin();
  try {
    const allowed = await verifyAdmin(user);
    if (!allowed) { await supabase.auth.signOut(); return showLogin(); }
    state.user = user; showConsole(); await renderTab('overview');
  } catch (error) {
    console.warn(error); showLogin(); setMessage('login-message', error.message || 'Could not verify administrator access.');
  }
}

async function fetchAll(table, query = '*', order = 'created_at') {
  const result = await supabase.from(table).select(query).order(order, { ascending: false }).limit(500);
  if (result.error) throw result.error;
  return result.data || [];
}

async function renderTab(tab) {
  state.tab = tab;
  document.querySelectorAll('[data-tab]').forEach((button) => button.classList.toggle('active', button.dataset.tab === tab));
  document.querySelectorAll('.panel').forEach((panel) => { panel.hidden = panel.id !== `panel-${tab}`; });
  $('tab-title').textContent = ({
    overview: 'Overview', products: 'Products & pricing', categories: 'Categories & menus', pages: 'Pages & sections',
    orders: 'Orders & payments', inquiries: 'Customer enquiries', settings: 'Store information', 'payment-settings': 'Payment setup',
  })[tab] || 'Admin';
  setNotice('');
  try {
    if (tab === 'overview') await renderOverview();
    else if (tab === 'products') await renderProducts();
    else if (tab === 'categories') await renderCategories();
    else if (tab === 'pages') await renderPages();
    else if (tab === 'orders') await renderOrders();
    else if (tab === 'inquiries') await renderInquiries();
    else if (tab === 'settings') await renderSettings();
    else if (tab === 'payment-settings') await renderPaymentSettings();
  } catch (error) {
    console.error(error); $('panel-' + tab).innerHTML = `<div class="card"><div class="status bad">Could not load this section</div><p>${esc(error.message || 'Unknown database error')}</p></div>`;
  }
}

async function renderOverview() {
  const [products, orders, inquiries, pages, sections] = await Promise.all([
    supabase.from('products').select('id,is_active', { count: 'exact' }),
    supabase.from('orders').select('id,payment_status,total,status', { count: 'exact' }),
    supabase.from('inquiries').select('id,status', { count: 'exact' }),
    supabase.from('site_pages').select('id,is_published', { count: 'exact' }),
    supabase.from('site_sections').select('id,is_visible', { count: 'exact' }),
  ]);
  for (const x of [products, orders, inquiries, pages, sections]) if (x.error) throw x.error;
  const orderRows = orders.data || [];
  const pending = orderRows.filter((x) => x.payment_status !== 'paid').length;
  const paidValue = orderRows.filter((x) => x.payment_status === 'paid').reduce((sum, x) => sum + Number(x.total || 0), 0);
  const published = pages.data?.filter((x) => x.is_published).length || 0;
  $('panel-overview').innerHTML = `
    <div class="grid-stats">
      <div class="stat"><small>Products in catalogue</small><strong>${products.count ?? products.data?.length ?? 0}</strong></div>
      <div class="stat"><small>Orders received</small><strong>${orders.count ?? orderRows.length}</strong></div>
      <div class="stat"><small>Payments pending</small><strong>${pending}</strong></div>
      <div class="stat"><small>Recorded paid order value</small><strong>${money(paidValue)}</strong></div>
    </div>
    <div class="two-col">
      <div class="card">${panelHeading('Store content', 'Manage all page sections, category navigation and public business information.')}
        <div class="list-row"><span>Pages</span><b>${pages.count ?? pages.data?.length ?? 0} (${published} published)</b></div>
        <div class="list-row"><span>Sections</span><b>${sections.count ?? sections.data?.length ?? 0}</b></div>
        <div class="list-row"><span>Enquiries</span><b>${inquiries.count ?? inquiries.data?.length ?? 0}</b></div>
        <div class="form-actions"><button class="btn primary" data-go="pages">Manage pages & sections</button><button class="btn secondary" data-go="settings">Edit store information</button></div>
      </div>
      <div class="card">${panelHeading('Store operations', 'Update catalogue prices, order progress and payment settings.')}
        <div class="list-row"><span>Published products</span><b>${products.data?.filter((x) => x.is_active).length || 0}</b></div>
        <div class="list-row"><span>Open / unpaid orders</span><b>${pending}</b></div>
        <div class="form-actions"><button class="btn primary" data-go="products">Manage products</button><button class="btn secondary" data-go="orders">Review orders</button><button class="btn secondary" data-go="payment-settings">Payment setup</button></div>
      </div>
    </div>
    <div class="card">${panelHeading('Launch safety reminders', 'A few items remain environment-specific and must be confirmed before accepting live transactions.')}
      <div class="gateway-alert"><b>Payment secrets:</b> Set Razorpay test/live keys and webhook secrets in Supabase Edge Function Secrets. Do not paste secret keys into store settings or public JavaScript. <br><br><b>First admin:</b> Add every staff Auth UUID and role to <code>public.admin_users</code>. <br><br><b>Business content:</b> Verify company details, prices, GST, shipping, refund rules and any source-provided claims before publishing.</div>
    </div>`;
}

async function loadCategories() {
  const rows = await fetchAll('categories', '*', 'sort_order');
  state.categories = rows.sort((a, b) => Number(a.sort_order) - Number(b.sort_order));
  return state.categories;
}
function categoryOptionList(selected = '') {
  const groups = [...new Set(state.categories.map((x) => x.group_name || x.group_key))];
  return groups.map((group) => `<optgroup label="${esc(group)}">${state.categories.filter((x) => (x.group_name || x.group_key) === group).map((c) => `<option value="${esc(c.name)}" ${selected === c.name ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}</optgroup>`).join('');
}
function productFormHTML(item = null) {
  const p = item || {};
  return `<div class="card">${panelHeading(p.id ? 'Edit product' : 'Add product', 'Control all public product information, images, pricing, inventory and publication status.')}
    <form id="product-form">
      <input type="hidden" name="id" value="${esc(p.id || '')}">
      <div class="form-grid">
        <div class="field"><label>Product name *<input name="name" required value="${esc(p.name || '')}" placeholder="Premium cotton T-shirt"></label></div>
        <div class="field"><label>Category *<select name="category" required><option value="">Choose category</option>${categoryOptionList(p.category || '')}</select></label></div>
        <div class="field"><label>SKU / item code<input name="sku" value="${esc(p.sku || '')}" placeholder="JRT-TS-001"></label></div>
        <div class="field"><label>URL slug<input name="slug" value="${esc(p.slug || '')}" placeholder="premium-cotton-t-shirt"></label></div>
        <div class="field"><label>Base price (₹) *<input name="price" type="number" required min="0" step="0.01" value="${esc(p.price ?? '')}"></label></div>
        <div class="field"><label>Compare-at / MRP (₹)<input name="compare_at_price" type="number" min="0" step="0.01" value="${esc(p.compare_at_price ?? '')}"></label></div>
        <div class="field"><label>Minimum order quantity<input name="moq" type="number" min="1" step="1" value="${esc(p.moq || 1)}"></label></div>
        <div class="field"><label>Stock quantity (blank = untracked)<input name="stock_qty" type="number" min="0" step="1" value="${esc(p.stock_qty ?? '')}"></label></div>
        <div class="field"><label>Tax rate (%)<input name="tax_rate" type="number" min="0" max="100" step="0.01" value="${esc(p.tax_rate ?? 0)}"></label></div>
        <div class="field"><label>Unit label<input name="unit_name" value="${esc(p.unit_name || 'piece')}" placeholder="piece / set / box"></label></div>
        <div class="field"><label>Main product image (PNG/JPG/WEBP)<input name="image" type="file" accept="image/png,image/jpeg,image/webp"></label><span class="help">Maximum 6 MB. Upload goes to the JRT product image bucket.</span></div>
        <div class="field"><label>Current main image URL<input name="image_url" type="url" value="${esc(p.image_url || '')}" placeholder="https://..."></label></div>
        <div class="field full"><label>Gallery image URLs (one per line)<textarea name="gallery_urls" placeholder="https://...
https://...">${esc((p.gallery_urls || []).join('\n'))}</textarea></label></div>
        <div class="field full"><label>Short description<input name="short_description" maxlength="180" value="${esc(p.short_description || '')}"></label></div>
        <div class="field full"><label>Full product description<textarea name="description">${esc(p.description || '')}</textarea></label></div>
        <div class="field full"><label>Product specifications JSON<div class="field-json"><textarea name="specifications">${esc(jsonText(p.specifications || {}, {}))}</textarea></div><span class="help">Example: {"Fabric":"220 GSM cotton","Fit":"Regular","Origin":"India"}</span></label></div>
        <div class="field full"><label>Product variants JSON<div class="field-json"><textarea name="variants">${esc(jsonText(p.variants || [], []))}</textarea></div><span class="help">Example: [{"name":"Size","options":["S","M","L","XL"]}]</span></label></div>
        <div class="field full"><label>Quantity price tiers JSON<div class="field-json"><textarea name="price_tiers">${esc(jsonText(p.price_tiers || [], []))}</textarea></div><span class="help">Example: [{"min_qty":100,"price":220},{"min_qty":500,"price":195}]. The database selects the highest matching minimum quantity tier.</span></label></div>
        <div class="field"><label>SEO title<input name="meta_title" value="${esc(p.meta_title || '')}" maxlength="180"></label></div>
        <div class="field"><label>SEO description<input name="meta_description" value="${esc(p.meta_description || '')}" maxlength="300"></label></div>
      </div>
      <label class="check-line"><input name="featured" type="checkbox" ${p.featured ? 'checked' : ''}> Feature this product on the homepage</label>
      <label class="check-line"><input name="is_active" type="checkbox" ${p.is_active !== false ? 'checked' : ''}> Publish product in the public catalogue</label>
      <p class="message" id="product-message"></p>
      <div class="form-actions"><button class="btn primary" type="submit">${p.id ? 'Save product changes' : 'Create product'}</button><button class="btn secondary" type="button" data-product-reset>Clear form</button></div>
    </form>
  </div>`;
}
async function renderProducts() {
  await loadCategories();
  state.products = await fetchAll('products', '*', 'created_at');
  const rows = state.products.map((p) => `<tr><td><b>${esc(p.name)}</b><small>${esc(p.category)} · ${esc(p.sku || 'No SKU')}</small></td><td><b>${money(p.price)}</b>${Number(p.compare_at_price) > Number(p.price) ? `<small><s>${money(p.compare_at_price)}</s></small>` : ''}<small>${(p.price_tiers || []).length} tier(s)</small></td><td>${Number(p.moq || 1)} ${esc(p.unit_name || 'piece')}<small>Stock: ${p.stock_qty == null ? 'Not tracked' : esc(p.stock_qty)}</small></td><td><span class="status ${p.is_active ? 'ok' : 'warn'}">${p.is_active ? 'Published' : 'Draft'}</span></td><td><div class="table-actions"><button class="btn small secondary" data-edit-product="${esc(p.id)}">Edit</button><button class="btn small danger" data-delete-product="${esc(p.id)}">Delete</button></div></td></tr>`).join('');
  $('panel-products').innerHTML = `${productFormHTML(state.currentProduct)}<div class="card">${panelHeading(`Catalogue (${state.products.length})`, 'Edit any listing to update its public price, quantity tiers, stock and product details.')}${rows ? `<div class="table-wrap"><table class="data-table"><thead><tr><th>Product</th><th>Price</th><th>MOQ / stock</th><th>Visibility</th><th>Actions</th></tr></thead><tbody>${rows}</tbody></table></div>` : empty('No products yet. Add your first verified product above.')}</div>`;
}
async function uploadImage(file) {
  if (!file) return null;
  if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) throw new Error('Only PNG, JPG or WEBP images are allowed.');
  if (file.size > 6 * 1024 * 1024) throw new Error('Image file must be 6 MB or smaller.');
  const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg';
  const safeFolder = String(folder || 'products').replace(/[^a-z0-9_-]/gi, '').slice(0, 40) || 'products';
  const path = `${safeFolder}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from('jrt-product-images').upload(path, file, { upsert: false, contentType: file.type });
  if (error) throw error;
  return supabase.storage.from('jrt-product-images').getPublicUrl(path).data.publicUrl;
}
async function saveProduct(form) {
  const msg = $('product-message'); msg.textContent = 'Saving product…';
  try {
    const f = new FormData(form);
    const name = String(f.get('name') || '').trim();
    const price = Number(f.get('price'));
    if (!name || !String(f.get('category') || '').trim() || !Number.isFinite(price) || price < 0) throw new Error('Product name, category and a valid base price are required.');
    const imageFile = f.get('image');
    let imageUrl = String(f.get('image_url') || '').trim();
    if (imageFile instanceof File && imageFile.size) imageUrl = await uploadImage(imageFile);
    const gallery = String(f.get('gallery_urls') || '').split(/\r?\n/).map((x) => x.trim()).filter((x) => /^https?:\/\//i.test(x));
    const specifications = parseJson(String(f.get('specifications') || '{}'), {}, 'Specifications');
    const variants = parseJson(String(f.get('variants') || '[]'), [], 'Variants');
    const tiers = parseJson(String(f.get('price_tiers') || '[]'), [], 'Price tiers');
    for (const tier of tiers) {
      if (!Number.isInteger(Number(tier.min_qty)) || Number(tier.min_qty) < 1 || !Number.isFinite(Number(tier.price)) || Number(tier.price) < 0) throw new Error('Each price tier needs a minimum quantity (whole number) and a valid price.');
    }
    tiers.sort((a, b) => Number(a.min_qty) - Number(b.min_qty));
    const rawStock = String(f.get('stock_qty') || '').trim();
    const payload = {
      name, slug: slugify(String(f.get('slug') || name)), category: String(f.get('category') || '').trim(),
      sku: String(f.get('sku') || '').trim() || null, price,
      compare_at_price: Number(f.get('compare_at_price') || 0) || null,
      moq: Math.max(1, Math.floor(Number(f.get('moq') || 1))), stock_qty: rawStock ? Math.max(0, Math.floor(Number(rawStock))) : null,
      tax_rate: Math.min(100, Math.max(0, Number(f.get('tax_rate') || 0))), unit_name: String(f.get('unit_name') || 'piece').trim() || 'piece',
      image_url: imageUrl || null, gallery_urls: gallery, specifications, variants, price_tiers: tiers,
      short_description: String(f.get('short_description') || '').trim(), description: String(f.get('description') || '').trim(),
      meta_title: String(f.get('meta_title') || '').trim(), meta_description: String(f.get('meta_description') || '').trim(),
      featured: f.get('featured') === 'on', is_active: f.get('is_active') === 'on', updated_at: new Date().toISOString(),
    };
    const id = String(f.get('id') || '');
    const result = id ? await supabase.from('products').update(payload).eq('id', id) : await supabase.from('products').insert(payload);
    if (result.error) throw result.error;
    state.currentProduct = null; notify('Product saved successfully.'); await renderProducts();
  } catch (error) { msg.textContent = error.message || 'Could not save product.'; }
}

function categoryFormHTML(item = null) {
  const c = item || {};
  return `<div class="card">${panelHeading(c.id ? 'Edit category' : 'Add a category', 'Categories control the mega menu, mobile navigation, catalogue filters and category landing pages.')}
    <form id="category-form"><input name="id" type="hidden" value="${esc(c.id || '')}"><div class="form-grid">
      <div class="field"><label>Category name *<input name="name" required value="${esc(c.name || '')}"></label></div>
      <div class="field"><label>URL slug<input name="slug" value="${esc(c.slug || '')}"></label></div>
      <div class="field"><label>Menu group key<input name="group_key" value="${esc(c.group_key || 'apparel')}" placeholder="apparel"></label></div>
      <div class="field"><label>Menu group label<input name="group_name" value="${esc(c.group_name || 'Apparel')}" placeholder="Apparel & Fashion"></label></div>
      <div class="field"><label>Menu icon / emoji<input name="icon" value="${esc(c.icon || '📦')}"></label></div>
      <div class="field"><label>Sort order<input name="sort_order" type="number" step="1" value="${esc(c.sort_order ?? 100)}"></label></div>
      <div class="field"><label>Category image URL<input name="image_url" type="url" value="${esc(c.image_url || '')}"></label></div>
      <div class="field"><label>Upload category image<input name="image_file" type="file" accept="image/png,image/jpeg,image/webp"></label></div>
      <div class="field full"><label>Category description<textarea name="description">${esc(c.description || '')}</textarea></label></div>
    </div><label class="check-line"><input type="checkbox" name="is_active" ${c.is_active !== false ? 'checked' : ''}> Show this category in public menus and catalogue</label>
    <p class="message" id="category-message"></p><div class="form-actions"><button class="btn primary" type="submit">Save category</button><button class="btn secondary" type="button" data-category-reset>Clear form</button></div></form>
  </div>`;
}
async function renderCategories() {
  await loadCategories();
  const rows = state.categories.map((c) => `<tr><td><b>${esc(c.icon || '📦')} ${esc(c.name)}</b><small>/${esc(c.slug)}</small></td><td>${esc(c.group_name || c.group_key)}</td><td>${esc(c.sort_order)}</td><td><span class="status ${c.is_active ? 'ok' : 'warn'}">${c.is_active ? 'Visible' : 'Hidden'}</span></td><td><div class="table-actions"><button class="btn small secondary" data-edit-category="${esc(c.id)}">Edit</button><button class="btn small danger" data-delete-category="${esc(c.id)}">Delete</button></div></td></tr>`).join('');
  $('panel-categories').innerHTML = `${categoryFormHTML(state.currentCategory)}<div class="card">${panelHeading(`Categories (${state.categories.length})`, 'Reorder, rename, group or hide categories. Removing a category may leave historical products associated with its former text value.')}${rows ? `<div class="table-wrap"><table class="data-table"><thead><tr><th>Category</th><th>Menu group</th><th>Order</th><th>Visibility</th><th>Actions</th></tr></thead><tbody>${rows}</tbody></table></div>` : empty('No categories configured. Run supabase/seed.sql to import the 116 categories from your uploaded site.')}</div>`;
}
async function saveCategory(form) {
  const msg = $('category-message'); msg.textContent = 'Saving category…';
  try {
    const f = new FormData(form); const name = String(f.get('name') || '').trim();
    if (!name) throw new Error('A category name is required.');
    let imageUrl = String(f.get('image_url') || '').trim();
    const imageFile = f.get('image_file');
    if (imageFile instanceof File && imageFile.size) imageUrl = await uploadProductImage(imageFile, 'categories');
    const payload = {
      name, slug: slugify(String(f.get('slug') || name)),
      group_key: slugify(String(f.get('group_key') || 'other')) || 'other',
      group_name: String(f.get('group_name') || 'Other').trim() || 'Other',
      icon: String(f.get('icon') || '📦').trim().slice(0, 12),
      image_url: imageUrl || null,
      description: String(f.get('description') || '').trim(),
      sort_order: Math.floor(Number(f.get('sort_order') || 100)),
      is_active: f.get('is_active') === 'on', updated_at: new Date().toISOString(),
    };
    const id = String(f.get('id') || '');
    const previousName = id ? state.categories.find((row) => row.id === id)?.name : '';
    const result = id ? await supabase.from('categories').update(payload).eq('id', id) : await supabase.from('categories').insert(payload);
    if (result.error) throw result.error;
    if (id && previousName && previousName !== name) {
      const { error: productRelabelError } = await supabase.from('products').update({ category: name, updated_at: new Date().toISOString() }).eq('category', previousName);
      if (productRelabelError) throw new Error(`Category was saved, but linked products could not be relabelled: ${productRelabelError.message}`);
    }
    state.currentCategory = null; notify('Category saved.'); await renderCategories();
  } catch (error) { msg.textContent = error.message || 'Could not save category.'; }
}

function pageFormHTML(item = null) {
  const p = item || {};
  return `<div class="card">${panelHeading(p.id ? 'Edit page' : 'Create a page', 'Create custom pages or edit existing page titles, SEO information and publication status.')}
    <form id="page-form"><input type="hidden" name="id" value="${esc(p.id || '')}"><div class="form-grid">
      <div class="field"><label>Page title *<input name="title" required value="${esc(p.title || '')}"></label></div>
      <div class="field"><label>Page slug *<input name="slug" required value="${esc(p.slug || '')}" placeholder="about-us"></label></div>
      <div class="field"><label>SEO title<input name="meta_title" value="${esc(p.meta_title || '')}"></label></div>
      <div class="field"><label>Menu order<input name="sort_order" type="number" value="${esc(p.sort_order ?? 100)}"></label></div>
      <div class="field full"><label>Meta description<input name="meta_description" value="${esc(p.meta_description || '')}" maxlength="300"></label></div>
    </div><label class="check-line"><input name="is_published" type="checkbox" ${p.is_published ? 'checked' : ''}> Publish this page</label>
    <p class="message" id="page-message"></p><div class="form-actions"><button type="submit" class="btn primary">Save page</button><button type="button" class="btn secondary" data-page-reset>Clear form</button></div></form></div>`;
}
function sectionFormHTML(item = null, pageSlug = 'home') {
  const s = item || {};
  const typeList = ['hero','trust_strip','category_grid','product_grid','manufacturing','clients','offerings','credentials','values','media','faq','cta','rich_text','image_text','stats','logo_strip','newsletter'];
  return `<div class="section-editor"><h3>${s.id ? 'Edit section' : 'Add section'} <span class="subtle">· Page: /${esc(pageSlug)}</span></h3>
    <form id="section-form"><input type="hidden" name="id" value="${esc(s.id || '')}"><input type="hidden" name="page_slug" value="${esc(pageSlug)}">
      <div class="form-grid">
        <div class="field"><label>Section key *<input name="section_key" required value="${esc(s.section_key || '')}" placeholder="hero / faq / footer-trust"></label></div>
        <div class="field"><label>Section type<select name="section_type">${typeList.map((t) => `<option value="${t}" ${s.section_type === t ? 'selected' : ''}>${t.replaceAll('_', ' ')}</option>`).join('')}</select></label></div>
        <div class="field"><label>Eyebrow / small label<input name="eyebrow" value="${esc(s.eyebrow || '')}"></label></div>
        <div class="field"><label>Heading / title<input name="title" value="${esc(s.title || '')}"></label></div>
        <div class="field full"><label>Body copy<textarea name="body">${esc(s.body || '')}</textarea></label></div>
        <div class="field"><label>Image URL<input name="image_url" type="url" value="${esc(s.image_url || '')}"></label></div>
        <div class="field"><label>Upload section image<input name="image_file" type="file" accept="image/png,image/jpeg,image/webp"></label></div>
        <div class="field"><label>Display order<input name="sort_order" type="number" value="${esc(s.sort_order ?? 100)}"></label></div>
        <div class="field"><label>Call-to-action label<input name="cta_label" value="${esc(s.cta_label || '')}"></label></div>
        <div class="field"><label>Call-to-action URL<input name="cta_url" value="${esc(s.cta_url || '')}"></label></div>
        <div class="field full"><label>Structured section content (JSON)<div class="field-json"><textarea name="content">${esc(jsonText(s.content || {}, {}))}</textarea></div><span class="help">Cards, FAQ answers, client logos, steps, stats and other repeating content are edited here. Use valid JSON. Plain text in the title/body fields is always escaped on the public site.</span></label></div>
      </div>
      <label class="check-line"><input type="checkbox" name="is_visible" ${s.is_visible !== false ? 'checked' : ''}> Show this section on the public page</label>
      <p class="message" id="section-message"></p><div class="form-actions"><button type="submit" class="btn primary">Save section</button><button type="button" class="btn secondary" data-section-reset>Clear section form</button></div>
    </form></div>`;
}
async function renderPages() {
  state.pages = await fetchAll('site_pages', '*', 'sort_order');
  const rows = state.pages.map((p) => `<tr><td><b>${esc(p.title)}</b><small>/${esc(p.slug)}</small></td><td><span class="status ${p.is_published ? 'ok' : 'warn'}">${p.is_published ? 'Published' : 'Draft'}</span></td><td>${esc(p.sort_order)}</td><td><div class="table-actions"><button class="btn small secondary" data-edit-page="${esc(p.id)}">Edit</button><button class="btn small primary" data-open-page="${esc(p.slug)}">Manage sections</button><button class="btn small danger" data-delete-page="${esc(p.id)}">Delete</button></div></td></tr>`).join('');
  let selectedSlug = state.currentPage?.slug || 'home';
  if (!state.pages.some((x) => x.slug === selectedSlug)) selectedSlug = state.pages[0]?.slug || 'home';
  state.currentPage = state.pages.find((x) => x.slug === selectedSlug) || null;
  state.sections = state.currentPage ? await fetchPageSections(selectedSlug) : [];
  const sectionRows = state.sections.map((s) => `<tr><td><b>${esc(s.title || s.section_key)}</b><small>${esc(s.section_type)} · ${esc(s.section_key)}</small></td><td>${esc(s.sort_order)}</td><td><span class="status ${s.is_visible ? 'ok' : 'warn'}">${s.is_visible ? 'Visible' : 'Hidden'}</span></td><td><div class="table-actions"><button class="btn small secondary" data-edit-section="${esc(s.id)}">Edit</button><button class="btn small secondary" data-toggle-section="${esc(s.id)}">${s.is_visible ? 'Hide' : 'Show'}</button><button class="btn small danger" data-delete-section="${esc(s.id)}">Delete</button></div></td></tr>`).join('');
  $('panel-pages').innerHTML = `${pageFormHTML(state.currentPage)}
    <div class="card">${panelHeading(`Website pages (${state.pages.length})`, 'Use the list to choose a page, then edit each section independently. The homepage sections were imported from your uploaded JRT Mart HTML.')}
      ${rows ? `<div class="table-wrap"><table class="data-table"><thead><tr><th>Page</th><th>Status</th><th>Order</th><th>Actions</th></tr></thead><tbody>${rows}</tbody></table></div>` : empty('No pages yet. Create your first page above.')}
    </div>
    <div class="card">${panelHeading(`Sections for ${state.currentPage ? `/${state.currentPage.slug}` : 'selected page'}`, 'Add, edit, reorder or hide content blocks. Each section type has its own presentation on the public storefront.')}
      <div class="field" style="max-width:340px"><label>Selected page<select id="selected-page">${state.pages.map((p) => `<option value="${esc(p.slug)}" ${p.slug === selectedSlug ? 'selected' : ''}>/${esc(p.slug)} — ${esc(p.title)}</option>`).join('')}</select></label></div>
      ${sectionFormHTML(state.currentSection, selectedSlug)}
      ${sectionRows ? `<div class="table-wrap"><table class="data-table"><thead><tr><th>Section</th><th>Order</th><th>Visibility</th><th>Actions</th></tr></thead><tbody>${sectionRows}</tbody></table></div>` : empty('No sections on this page yet. Add your first section above.')}
    </div>`;
}
async function fetchPageSections(slug) {
  const { data, error } = await supabase.from('site_sections').select('*').eq('page_slug', slug).order('sort_order', { ascending: true });
  if (error) throw error; return data || [];
}
async function savePage(form) {
  const msg = $('page-message'); msg.textContent = 'Saving page…';
  try {
    const f = new FormData(form); const title = String(f.get('title') || '').trim(); const slug = slugify(String(f.get('slug') || ''));
    if (!title || !slug) throw new Error('Page title and URL slug are required.');
    const payload = { title, slug, meta_title: String(f.get('meta_title') || '').trim(), meta_description: String(f.get('meta_description') || '').trim(), sort_order: Math.floor(Number(f.get('sort_order') || 100)), is_published: f.get('is_published') === 'on', updated_at: new Date().toISOString() };
    const id = String(f.get('id') || '');
    const result = id ? await supabase.from('site_pages').update(payload).eq('id', id) : await supabase.from('site_pages').insert(payload);
    if (result.error) throw result.error;
    state.currentPage = { ...payload, id: id || undefined }; state.currentSection = null;
    notify('Page saved.'); await renderPages();
  } catch (error) { msg.textContent = error.message || 'Could not save page.'; }
}
async function saveSection(form) {
  const msg = $('section-message'); msg.textContent = 'Saving section…';
  try {
    const f = new FormData(form); const key = slugify(String(f.get('section_key') || ''));
    if (!key) throw new Error('Section key is required.');
    const content = parseJson(String(f.get('content') || '{}'), {}, 'Structured content');
    let imageUrl = String(f.get('image_url') || '').trim();
    const imageFile = f.get('image_file');
    if (imageFile instanceof File && imageFile.size) imageUrl = await uploadProductImage(imageFile, 'sections');
    const payload = {
      page_slug: String(f.get('page_slug') || 'home'), section_key: key,
      section_type: String(f.get('section_type') || 'rich_text'), eyebrow: String(f.get('eyebrow') || '').trim(),
      title: String(f.get('title') || '').trim(), body: String(f.get('body') || '').trim(),
      image_url: imageUrl || null,
      cta_label: String(f.get('cta_label') || '').trim(), cta_url: String(f.get('cta_url') || '').trim(),
      content, sort_order: Math.floor(Number(f.get('sort_order') || 100)), is_visible: f.get('is_visible') === 'on', updated_at: new Date().toISOString(),
    };
    const id = String(f.get('id') || '');
    const result = id ? await supabase.from('site_sections').update(payload).eq('id', id) : await supabase.from('site_sections').upsert(payload, { onConflict: 'page_slug,section_key' });
    if (result.error) throw result.error;
    state.currentSection = null; notify('Section saved.'); await renderPages();
  } catch (error) { msg.textContent = error.message || 'Could not save section.'; }
}

async function renderOrders() {
  state.orders = await fetchAll('orders', '*,order_items(*)', 'created_at');
  state.transactions = await fetchAll('payment_transactions', '*', 'created_at');
  const statusOptions = ['pending_confirmation', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
  const rows = state.orders.map((o) => {
    const a = o.shipping_address || {};
    const address = [a.line1, a.line2, a.city, a.state, a.pincode, a.country].filter(Boolean).join(', ');
    const lines = (o.order_items || []).map((i) => `${esc(i.product_name)} × ${Number(i.quantity)} · ${money(i.unit_price)}${i.sku ? ` · SKU ${esc(i.sku)}` : ''}<small>Line ${money(i.line_total)} · GST ${Number(i.tax_rate || 0)}% (${money(i.tax_amount || 0)})</small>`).join('<br>');
    const tx = state.transactions.filter((t) => t.order_id === o.id);
    const gateway = o.payment_method === 'razorpay';
    const payText = gateway ? 'Razorpay (server verified)' : o.payment_method === 'bank_transfer' ? 'Bank transfer' : 'Pay after confirmation';
    const canSetFreight = !gateway && !['paid','refunded'].includes(o.payment_status) && o.status !== 'cancelled';
    return `<tr><td><b>${esc(o.order_number)}</b><small>${new Date(o.created_at).toLocaleString('en-IN')}</small></td><td><b>${esc(o.customer_name)}</b><small>${esc(o.company || '')}</small><small>${esc(o.customer_email)} · ${esc(o.customer_phone)}</small><small>${esc(address)}</small>${o.notes ? `<small>Notes: ${esc(o.notes)}</small>` : ''}</td><td>${lines || 'No line items'}</td><td><b>${money(o.total)}</b><small>Subtotal ${money(o.subtotal)} · Tax ${money(o.tax_amount)} · Shipping ${money(o.shipping_amount)}</small>${canSetFreight ? `<button class="btn small secondary" style="margin-top:6px" data-set-shipping="${esc(o.id)}" data-current-shipping="${Number(o.shipping_amount || 0)}">Set freight</button>` : ''}</td><td><b>${esc(payText)}</b><small><span class="status ${o.payment_status === 'paid' ? 'ok' : 'warn'}">${esc(o.payment_status)}</span></small>${o.razorpay_payment_id ? `<small class="mono">${esc(o.razorpay_payment_id)}</small>` : ''}${tx.length ? `<small>${tx.length} transaction record(s)</small>` : ''}</td><td><select data-order-status="${esc(o.id)}">${statusOptions.map((s) => `<option value="${s}" ${o.status === s ? 'selected' : ''}>${s.replaceAll('_', ' ')}</option>`).join('')}</select></td><td>${gateway ? '<span class="subtle">Gateway payments are updated by signature/webhook verification.</span>' : `<select data-offline-payment="${esc(o.id)}" data-current-payment="${esc(o.payment_status)}"><option value="">Update payment…</option>${['awaiting_confirmation','awaiting_payment','paid','failed','refunded'].map((s) => `<option value="${s}">${s.replaceAll('_', ' ')}</option>`).join('')}</select><small>Verify bank/UPI receipt before marking paid.</small>`}</td></tr>`;
  }).join('');
  const txRows = state.transactions.map((t) => `<tr><td>${esc(t.provider)}</td><td>${esc(t.provider_order_id || '—')}<small>${esc(t.provider_payment_id || '—')}</small></td><td>${money(t.amount)} ${esc(t.currency)}</td><td><span class="status ${t.status === 'captured' || t.status === 'reconciled' ? 'ok' : 'warn'}">${esc(t.status)}</span></td><td>${new Date(t.created_at).toLocaleString('en-IN')}</td></tr>`).join('');
  $('panel-orders').innerHTML = `<div class="card">${panelHeading(`Orders (${state.orders.length})`, 'Review complete customer details, delivery address, order lines, quantities, product snapshots and payment transaction references.')}
    ${rows ? `<div class="table-wrap"><table class="data-table" style="min-width:1250px"><thead><tr><th>Order</th><th>Customer / delivery</th><th>Order details</th><th>Total / freight</th><th>Payment</th><th>Order status</th><th>Payment reconciliation</th></tr></thead><tbody>${rows}</tbody></table></div>` : empty('No orders have been submitted yet.')}
  </div><div class="card">${panelHeading(`Payment audit (${state.transactions.length})`, 'Server-generated Razorpay callbacks, webhook updates and offline payment reconciliation history.')}${txRows ? `<div class="table-wrap"><table class="data-table"><thead><tr><th>Provider</th><th>Gateway references</th><th>Amount</th><th>Result</th><th>Created</th></tr></thead><tbody>${txRows}</tbody></table></div>` : empty('No payment attempts recorded yet.')}</div>`;
}

async function renderInquiries() {
  state.inquiries = await fetchAll('inquiries', '*', 'created_at');
  const rows = state.inquiries.map((x) => `<tr><td><b>${esc(x.name)}</b><small>${esc(x.company || '')}</small></td><td><b>${esc(x.product)}</b><small>Qty: ${esc(x.quantity || 'Not specified')}</small><small>${esc(x.message || '')}</small></td><td>${esc(x.email)}<small>${esc(x.phone || '')}</small></td><td>${new Date(x.created_at).toLocaleString('en-IN')}</td><td><select data-inquiry-status="${esc(x.id)}"><option value="new" ${x.status === 'new' ? 'selected' : ''}>New</option><option value="contacted" ${x.status === 'contacted' ? 'selected' : ''}>Contacted</option><option value="closed" ${x.status === 'closed' ? 'selected' : ''}>Closed</option></select></td></tr>`).join('');
  $('panel-inquiries').innerHTML = `<div class="card">${panelHeading(`Enquiries (${state.inquiries.length})`, 'Customer quote requests and contact messages submitted from the public storefront.')}${rows ? `<div class="table-wrap"><table class="data-table"><thead><tr><th>Customer</th><th>Requirement</th><th>Contact</th><th>Received</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table></div>` : empty('No enquiries received yet.')}</div>`;
}

const settingFields = [
  ['store_name','Store / business name'],['store_tagline','Header tagline'],['footer_text','Footer description'],
  ['support_email','Support email'],['support_phone','Support phone'],['business_address','Business address'],['gstin','GSTIN'],
  ['currency','Currency code'],['locale','Number / date locale'],['seo_title','Default SEO title'],['seo_description','Default SEO description'],
  ['logo_url','Logo image URL'],['announcement','Announcement banner text'],
  ['shipping_mode','Shipping pricing mode (quote / flat / free_over_threshold)'],['shipping_flat_rate','Flat shipping amount (₹)'],['free_shipping_threshold','Free shipping threshold (₹, blank disables)'],
  ['shipping_note','Shipping note'],['tax_note','Tax / GST note'],
  ['facebook_url','Facebook URL'],['instagram_url','Instagram URL'],['linkedin_url','LinkedIn URL'],['youtube_url','YouTube URL'],
];
async function renderSettings() {
  state.storeSettings = await fetchAll('store_settings', '*', 'key');
  const values = Object.fromEntries(state.storeSettings.map((x) => [x.key, typeof x.value === 'string' ? x.value : JSON.stringify(x.value ?? '')]));
  const fields = settingFields.map(([key, label]) => `<div class="setting-field"><label>${esc(label)}${['footer_text','seo_description','business_address','announcement','shipping_note','tax_note'].includes(key) ? `<textarea name="${key}">${esc(values[key] || '')}</textarea>` : key === 'shipping_mode' ? `<select name="${key}"><option value="quote" ${(values[key] || 'quote') === 'quote' ? 'selected' : ''}>Quote freight after order review</option><option value="flat" ${values[key] === 'flat' ? 'selected' : ''}>Fixed shipping amount</option><option value="free_over_threshold" ${values[key] === 'free_over_threshold' ? 'selected' : ''}>Free above order threshold</option></select>` : `<input name="${key}" value="${esc(values[key] || '')}" ${key.endsWith('_url') ? 'type="url"' : key === 'support_email' ? 'type="email"' : ['shipping_flat_rate','free_shipping_threshold'].includes(key) ? 'type="number" min="0" step="0.01"' : 'type="text"'}>${key === 'logo_url' ? '<input name="logo_file" type="file" accept="image/png,image/jpeg,image/webp" aria-label="Upload store logo">' : ''}`}</label><span class="subtle">Key: ${esc(key)}</span></div>`).join('');
  $('panel-settings').innerHTML = `<div class="card">${panelHeading('Store identity and public information', 'Manage brand information shown in the header, footer, contact areas, metadata and checkout notices.')}
    <form id="settings-form"><div class="settings-grid">${fields}</div><p class="message" id="settings-message"></p><div class="form-actions"><button class="btn primary" type="submit">Save store information</button></div></form>
  </div><div class="card">${panelHeading('Content publishing checklist', 'Confirm these company details and policies before publishing the site.')}
    <div class="gateway-alert">Your uploaded source contains business claims, client references and compliance identifiers. Keep only information that is current and authorised for publication. This console stores the values you enter; it does not independently validate GST, legal entity records or policy compliance.</div>
  </div>`;
}
async function saveSettings(form) {
  const msg = $('settings-message'); msg.textContent = 'Saving store information…';
  try {
    const f = new FormData(form);
    const shippingMode = String(f.get('shipping_mode') || 'quote');
    if (!['quote','flat','free_over_threshold'].includes(shippingMode)) throw new Error('Choose a valid shipping pricing mode.');
    for (const key of ['shipping_flat_rate','free_shipping_threshold']) {
      const raw = String(f.get(key) || '').trim();
      if (raw && (!Number.isFinite(Number(raw)) || Number(raw) < 0)) throw new Error(`${key.replaceAll('_',' ')} must be a non-negative amount.`);
    }
    const rows = settingFields.map(([key]) => ({ key, value: String(f.get(key) || '').trim(), is_public: true, updated_at: new Date().toISOString() }));
    const logoFile = f.get('logo_file');
    if (logoFile instanceof File && logoFile.size) {
      const logoUrl = await uploadProductImage(logoFile, 'branding');
      const logoRow = rows.find((row) => row.key === 'logo_url'); if (logoRow) logoRow.value = logoUrl;
    }
    const { error } = await supabase.from('store_settings').upsert(rows, { onConflict: 'key' });
    if (error) throw error;
    notify('Store information saved.'); await renderSettings();
  } catch (error) { msg.textContent = error.message || 'Could not save settings.'; }
}
async function renderPaymentSettings() {
  const { data, error } = await supabase.from('payment_settings').select('*').eq('id', 1).single();
  if (error) throw error;
  state.paymentSettings = data;
  const s = data;
  $('panel-payment-settings').innerHTML = `<div class="card">${panelHeading('Payment gateway and offline payment settings', 'Choose the available payment methods and manage the public payment instructions displayed during checkout.')}
    <form id="payment-settings-form">
      <div class="form-grid">
        <div class="field"><label>Payment provider<select name="provider"><option value="razorpay" ${s.provider === 'razorpay' ? 'selected' : ''}>Razorpay Checkout</option><option value="manual" ${s.provider === 'manual' ? 'selected' : ''}>Manual payment only</option></select></label></div>
        <div class="field"><label>Gateway mode<select name="mode"><option value="test" ${s.mode === 'test' ? 'selected' : ''}>Test / sandbox</option><option value="live" ${s.mode === 'live' ? 'selected' : ''}>Live payments</option></select></label></div>
        <div class="field"><label>Currency code<input name="currency" value="${esc(s.currency || 'INR')}" maxlength="3"></label></div>
        <div class="field"><label>Bank account name<input name="bank_account_name" value="${esc(s.bank_account_name || '')}"></label></div>
        <div class="field"><label>Bank name<input name="bank_name" value="${esc(s.bank_name || '')}"></label></div>
        <div class="field"><label>Account number<input name="bank_account_number" value="${esc(s.bank_account_number || '')}" autocomplete="off"></label></div>
        <div class="field"><label>IFSC<input name="bank_ifsc" value="${esc(s.bank_ifsc || '')}"></label></div>
        <div class="field"><label>Branch<input name="bank_branch" value="${esc(s.bank_branch || '')}"></label></div>
        <div class="field"><label>UPI ID<input name="upi_id" value="${esc(s.upi_id || '')}"></label></div>
        <div class="field full"><label>Customer payment instructions<textarea name="instructions">${esc(s.instructions || '')}</textarea></label></div>
      </div>
      <label class="check-line"><input name="gateway_enabled" type="checkbox" ${s.gateway_enabled ? 'checked' : ''}> Enable Razorpay online payments at checkout</label>
      <label class="check-line"><input name="manual_payment_enabled" type="checkbox" ${s.manual_payment_enabled ? 'checked' : ''}> Enable offline bank transfer / UPI instructions</label>
      <p class="message" id="payment-settings-message"></p><div class="form-actions"><button class="btn primary" type="submit">Save payment settings</button></div>
    </form>
  </div>
  <div class="card">${panelHeading('Razorpay secret keys — server only', 'The browser and admin form never store or read the Razorpay secret key.')}
    <div class="gateway-alert"><b>Set these as Supabase Edge Function Secrets</b> in Project Settings → Edge Functions → Secrets (or with the Supabase CLI).<br><br>
      <code>RAZORPAY_TEST_KEY_ID</code><br><code>RAZORPAY_TEST_KEY_SECRET</code><br><code>RAZORPAY_LIVE_KEY_ID</code><br><code>RAZORPAY_LIVE_KEY_SECRET</code><br><code>RAZORPAY_TEST_WEBHOOK_SECRET</code><br><code>RAZORPAY_LIVE_WEBHOOK_SECRET</code><br><br>
      Use the exact API credentials for each mode selected above. For Razorpay webhook configuration, set the webhook URL to:<br><code>${esc(CFG.supabaseUrl || 'https://YOUR-PROJECT.supabase.co')}/functions/v1/razorpay-webhook</code><br><br>
      Subscribe to <code>payment.authorized</code>, <code>payment.captured</code>, <code>payment.failed</code>, <code>order.paid</code> and <code>refund.processed</code>. Keep the test and live webhook secrets separate. Never paste any secret into a public setting, HTML file, Git repository or browser console.
    </div>
    <p class="subtle">This integration currently supports INR checkout through Razorpay Standard Checkout. Online payments require a signed-in customer account; guest checkout remains available for offline / pay-after-confirmation requests.</p>
  </div>`;
}
async function savePaymentSettings(form) {
  const msg = $('payment-settings-message'); msg.textContent = 'Saving payment settings…';
  try {
    const f = new FormData(form);
    const payload = {
      provider: String(f.get('provider') || 'razorpay'), mode: String(f.get('mode') || 'test'),
      currency: String(f.get('currency') || 'INR').trim().toUpperCase(),
      bank_account_name: String(f.get('bank_account_name') || '').trim(), bank_name: String(f.get('bank_name') || '').trim(),
      bank_account_number: String(f.get('bank_account_number') || '').trim(), bank_ifsc: String(f.get('bank_ifsc') || '').trim().toUpperCase(),
      bank_branch: String(f.get('bank_branch') || '').trim(), upi_id: String(f.get('upi_id') || '').trim(),
      instructions: String(f.get('instructions') || '').trim(), gateway_enabled: f.get('gateway_enabled') === 'on',
      manual_payment_enabled: f.get('manual_payment_enabled') === 'on', updated_at: new Date().toISOString(),
    };
    if (payload.currency !== 'INR' && payload.gateway_enabled) throw new Error('This Razorpay checkout build supports INR only. Keep currency as INR or disable Razorpay.');
    const { error } = await supabase.from('payment_settings').update(payload).eq('id', 1);
    if (error) throw error;
    notify('Payment settings saved. Check Edge Function secrets before enabling live payments.'); await renderPaymentSettings();
  } catch (error) { msg.textContent = error.message || 'Could not save payment settings.'; }
}

async function manualPaymentReconcile(orderId, paymentStatus, reference = '', note = '') {
  if (!paymentStatus) return;
  const { error } = await supabase.rpc('admin_update_offline_payment', {
    p_order_id: orderId, p_payment_status: paymentStatus,
    p_reference: reference, p_note: note,
  });
  if (error) throw error;
  notify('Offline payment status updated.'); await renderOrders();
}

// Global actions and event delegation keep handlers alive when each panel rerenders.
document.addEventListener('click', async (event) => {
  const forgotPassword = event.target.closest('#admin-forgot-password');
  if (forgotPassword) {
    if (!supabase) { setMessage('login-message', 'Supabase configuration is missing.'); return; }
    const email = prompt('Enter your administrator email address:');
    if (!email || !email.includes('@')) { setMessage('login-message', 'Enter a valid administrator email address.'); return; }
    setMessage('login-message', 'Sending a password reset email…');
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${location.origin}/reset-password` });
    setMessage('login-message', error ? error.message : 'Password reset instructions have been sent if this account exists. Check your email inbox.');
    return;
  }
  const shippingButton = event.target.closest('[data-set-shipping]');
  if (shippingButton) {
    const raw = prompt('Enter the final gross shipping/freight amount for this unpaid offline order (INR):', shippingButton.dataset.currentShipping || '0');
    if (raw === null) return;
    const amount = Number(raw);
    if (!Number.isFinite(amount) || amount < 0) { notify('Enter a valid non-negative shipping amount.', 'error'); return; }
    try {
      const { error } = await supabase.rpc('admin_set_order_shipping', { p_order_id: shippingButton.dataset.setShipping, p_shipping_amount: amount });
      if (error) throw error;
      notify('Order freight and payable total updated. Confirm any freight-tax treatment before invoicing.');
      await renderOrders();
    } catch (error) { notify(error.message || 'Freight could not be updated.', 'error'); }
    return;
  }
  const tab = event.target.closest('[data-tab]');
  if (tab) { await renderTab(tab.dataset.tab); return; }
  const go = event.target.closest('[data-go]');
  if (go) { await renderTab(go.dataset.go); return; }
  const editP = event.target.closest('[data-edit-product]');
  if (editP) { state.currentProduct = state.products.find((x) => x.id === editP.dataset.editProduct) || null; await renderProducts(); window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
  const delP = event.target.closest('[data-delete-product]');
  if (delP) {
    if (!confirm('Delete this product from the public catalogue? Historical order lines are retained.')) return;
    const { error } = await supabase.from('products').delete().eq('id', delP.dataset.deleteProduct);
    if (error) notify(error.message, 'error'); else { state.currentProduct = null; notify('Product deleted.'); await renderProducts(); }
    return;
  }
  if (event.target.closest('[data-product-reset]')) { state.currentProduct = null; await renderProducts(); return; }
  const editC = event.target.closest('[data-edit-category]');
  if (editC) { state.currentCategory = state.categories.find((x) => x.id === editC.dataset.editCategory) || null; await renderCategories(); window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
  const delC = event.target.closest('[data-delete-category]');
  if (delC) {
    if (!confirm('Delete this category? It may affect menu links for products assigned to this category.')) return;
    const { error } = await supabase.from('categories').delete().eq('id', delC.dataset.deleteCategory);
    if (error) notify(error.message, 'error'); else { state.currentCategory = null; notify('Category deleted.'); await renderCategories(); }
    return;
  }
  if (event.target.closest('[data-category-reset]')) { state.currentCategory = null; await renderCategories(); return; }
  const editPage = event.target.closest('[data-edit-page]');
  if (editPage) { state.currentPage = state.pages.find((x) => x.id === editPage.dataset.editPage) || null; state.currentSection = null; await renderPages(); return; }
  const openPage = event.target.closest('[data-open-page]');
  if (openPage) { state.currentPage = state.pages.find((x) => x.slug === openPage.dataset.openPage) || null; state.currentSection = null; await renderPages(); return; }
  const deletePage = event.target.closest('[data-delete-page]');
  if (deletePage) {
    const page = state.pages.find((x) => x.id === deletePage.dataset.deletePage);
    if (!page || !confirm(`Delete /${page.slug} and all of its sections? This cannot be undone.`)) return;
    const { error } = await supabase.from('site_pages').delete().eq('id', page.id);
    if (error) notify(error.message, 'error');
    else { state.currentPage = null; state.currentSection = null; notify('Page and its sections deleted.'); await renderPages(); }
    return;
  }
  const editSection = event.target.closest('[data-edit-section]');
  if (editSection) { state.currentSection = state.sections.find((x) => x.id === editSection.dataset.editSection) || null; await renderPages(); return; }
  const toggleSection = event.target.closest('[data-toggle-section]');
  if (toggleSection) {
    const item = state.sections.find((x) => x.id === toggleSection.dataset.toggleSection); if (!item) return;
    const { error } = await supabase.from('site_sections').update({ is_visible: !item.is_visible, updated_at: new Date().toISOString() }).eq('id', item.id);
    if (error) notify(error.message, 'error'); else { notify('Section visibility updated.'); state.currentSection = null; await renderPages(); }
    return;
  }
  const delSection = event.target.closest('[data-delete-section]');
  if (delSection) {
    if (!confirm('Delete this page section? This cannot be undone.')) return;
    const { error } = await supabase.from('site_sections').delete().eq('id', delSection.dataset.deleteSection);
    if (error) notify(error.message, 'error'); else { state.currentSection = null; notify('Section deleted.'); await renderPages(); }
    return;
  }
  if (event.target.closest('[data-page-reset]')) { state.currentPage = null; state.currentSection = null; await renderPages(); return; }
  if (event.target.closest('[data-section-reset]')) { state.currentSection = null; await renderPages(); return; }
});

document.addEventListener('change', async (event) => {
  const el = event.target;
  if (el.id === 'selected-page') { state.currentPage = state.pages.find((x) => x.slug === el.value) || null; state.currentSection = null; await renderPages(); return; }
  if (el.matches('[data-order-status]')) {
    const { error } = await supabase.from('orders').update({ status: el.value, updated_at: new Date().toISOString() }).eq('id', el.dataset.orderStatus);
    if (error) notify(error.message, 'error'); else notify('Order status updated.'); return;
  }
  if (el.matches('[data-offline-payment]')) {
    const status = el.value; if (!status) return;
    const reference = prompt('Enter the bank/UPI transaction reference after verifying cleared funds:', '');
    if (reference === null) { el.value = ''; return; }
    const note = prompt('Add an internal payment note (optional):', '') || '';
    try { await manualPaymentReconcile(el.dataset.offlinePayment, status, reference, note); }
    catch (error) { notify(error.message || 'Payment status could not be updated.', 'error'); await renderOrders(); }
    return;
  }
  if (el.matches('[data-inquiry-status]')) {
    const { error } = await supabase.from('inquiries').update({ status: el.value }).eq('id', el.dataset.inquiryStatus);
    if (error) notify(error.message, 'error'); else notify('Enquiry status updated.');
  }
});

document.addEventListener('submit', async (event) => {
  const form = event.target;
  if (!(form instanceof HTMLFormElement)) return;
  if (form.id === 'login-form') {
    event.preventDefault(); const f = new FormData(form); setMessage('login-message', 'Signing in…');
    try { await login(String(f.get('email') || '').trim(), String(f.get('password') || '')); }
    catch (error) { setMessage('login-message', error.message || 'Sign-in failed.'); }
    return;
  }
  if (form.id === 'product-form') { event.preventDefault(); await saveProduct(form); return; }
  if (form.id === 'category-form') { event.preventDefault(); await saveCategory(form); return; }
  if (form.id === 'page-form') { event.preventDefault(); await savePage(form); return; }
  if (form.id === 'section-form') { event.preventDefault(); await saveSection(form); return; }
  if (form.id === 'settings-form') { event.preventDefault(); await saveSettings(form); return; }
  if (form.id === 'payment-settings-form') { event.preventDefault(); await savePaymentSettings(form); return; }
});

$('logout-btn').addEventListener('click', async () => {
  if (!confirm('Sign out of the JRT Mart admin console?')) return;
  await supabase.auth.signOut(); state.user = null; showLogin();
});
$('refresh-btn').addEventListener('click', async () => { await renderTab(state.tab); notify('Data refreshed.'); });

supabase?.auth.onAuthStateChange((_event, session) => {
  if (!session) { state.user = null; showLogin(); }
});

restoreSession().catch((error) => {
  console.error(error); $('boot').hidden = true; $('admin-app').hidden = false; showLogin();
  setMessage('login-message', error.message || 'Could not initialise the admin console.');
});
