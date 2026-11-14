import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const CONFIG = window.JRT_CONFIG || {};
const SUPABASE_URL = String(CONFIG.supabaseUrl || "");
const SUPABASE_KEY = String(CONFIG.supabaseAnonKey || "");
const SUPABASE_READY = /^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(SUPABASE_URL) && /^(sb_publishable_|eyJ)/.test(SUPABASE_KEY);
const supabase = SUPABASE_READY ? createClient(SUPABASE_URL, SUPABASE_KEY) : null;
const app = document.getElementById("app");
const CURRENCY = CONFIG.currency || "INR";
const LOCALE = CONFIG.locale || "en-IN";
const STORAGE_KEY = "jrt_mart_cart_v2";

let categoryRows = [
  [16,"T Shirts","apparel"],[17,"Hoodies","apparel"],[20,"Laptop Bags","bags"],[23,"School & College Bags","bags"],
  [30,"Shirts","apparel"],[24,"Tote Bags","bags"],[25,"School & College uniforms","uniforms"],[26,"Corporate & Industrial uniforms","uniforms"],
  [27,"Security & housekeeping uniforms","uniforms"],[28,"Healthcare Uniforms","uniforms"],[21,"Caps","apparel"],[29,"Hotel and Hospitality Uniforms","uniforms"],
  [37,"Sweatshirt","apparel"],[39,"Pens","gifting"],[41,"Diary","gifting"],[42,"Water Bottles","gifting"],[43,"Sleep & Lounge Wear","apparel"],
  [44,"Cups & Mugs","gifting"],[46,"Footwear","apparel"],[35,"Jackets","apparel"],[40,"Corporate Gifting","gifting"],[51,"Mobile Accessories","gifting"],
  [52,"Trousers","apparel"],[50,"Jeans and Jeggings","apparel"],[53,"Clocks","gifting"],[54,"Handbags, Bags & Wallets","bags"],[55,"Sarees","apparel"],
  [48,"Scarves, Stoles & Wraps","apparel"],[49,"Bedding and Linen","home"],[56,"Raincoats","apparel"],[59,"Towels","home"],[60,"Women Ethnic Wear","apparel"],
  [61,"Women Western Tops","apparel"],[62,"Western Dresses","apparel"],[63,"Western Shrug","apparel"],[69,"Men's Shirts & Dhoti Set","apparel"],
  [70,"Toys","gifting"],[71,"Blazers & Waistcoats","apparel"],[75,"Umbrella","bags"],[76,"Lunch Box","kitchen"],[78,"Table Fan","appliances"],
  [79,"Flasks","kitchen"],[80,"Feeding Bottle","kitchen"],[81,"Casserole","kitchen"],[82,"Iron Box","appliances"],[83,"Oil Dispenser","kitchen"],
  [84,"Dosa Tawa","kitchen"],[85,"Appe / Paddu Non Stick Pan","kitchen"],[86,"Mats","home"],[87,"Kadai","kitchen"],[88,"Juicers","appliances"],
  [89,"Lights and Lamps","home"],[90,"Jars and Containers","kitchen"],[91,"Women's Skirts","apparel"],[92,"Women's Shorts","apparel"],[93,"Men's Shorts","apparel"],
  [94,"Joggers","apparel"],[95,"Watches","gifting"],[96,"Cooker","kitchen"],[98,"Cargo Pants","apparel"],[99,"Terracotta Jewellery","gifting"],
  [101,"Mop","home"],[102,"Cleaning Brush","home"],[103,"Alarm Clock","gifting"],[104,"Cooking Pot","kitchen"],[105,"Scrubber","home"],[106,"Whisks","kitchen"],
  [107,"Wall Hooks","home"],[108,"Spatula","kitchen"],[109,"Wiper","home"],[110,"Sponge Wipes","home"],[112,"Plastic Broom","home"],
  [113,"Microfiber Gloves","home"],[114,"Dust Pan With Brush","home"],[117,"Calculator","gifting"],[119,"Rolling Board","kitchen"],[121,"Headphones","appliances"],
  [122,"USB Hubs & Adapters","appliances"],[124,"Rolling Pin","kitchen"],[125,"Tawa","kitchen"],[127,"Dutch Oven","kitchen"],[128,"Appam Pan","kitchen"],
  [129,"Power Banks","appliances"],[130,"Laptop Sleeve","bags"],[132,"Extension Board","appliances"],[134,"Piggy Bank","gifting"],[135,"Spirometer","appliances"],
  [136,"Toilet Brush","home"],[137,"Runner Mat","home"],[140,"Idols","gifting"],[141,"Pen Stands","gifting"],[145,"Trekking Bags","bags"],
  [146,"Garbage Bags & Waste Disposal Liners","home"],[147,"Travel Bags & Luggage","bags"],[151,"Microfiber Cleaning Cloths","home"],[153,"Clothes Drying Ropes","home"],
  [155,"Televisions","appliances"],[156,"Induction Cooktops","appliances"],[157,"Ceiling Fans","appliances"],[158,"Sandwich Griller","appliances"],
  [159,"Kettles","appliances"],[160,"Air Fryers","appliances"],[161,"Pedestal Fans","appliances"],[162,"Wall Fans","appliances"],[163,"Mixer Grinders","appliances"],
  [164,"Mattress Lifter","home"],[165,"Shoe Care & Cleaning","home"],[166,"Comforters","home"],[167,"Pillows","home"],[168,"Mattress Protectors","home"],
  [174,"Dispensers","kitchen"],[175,"Serving Trays","kitchen"],[177,"Storage Boxes","home"],[178,"Candles","gifting"],[182,"Fry Pans","kitchen"],[183,"Key Holders","gifting"]
].map(([id,name,group]) => ({id,name,group,slug:slugify(name)}));

let groups = [
  {id:"apparel",name:"Apparel & Fashion",icon:"👕",desc:"Everyday wear, custom clothing and accessories"},
  {id:"uniforms",name:"Uniforms",icon:"🦺",desc:"School, corporate, healthcare and hospitality uniforms"},
  {id:"bags",name:"Bags & Travel",icon:"🎒",desc:"Work, school, travel and reusable bags"},
  {id:"home",name:"Home & Textiles",icon:"🏠",desc:"Home linen, cleaning and daily essentials"},
  {id:"kitchen",name:"Kitchen & Dining",icon:"🍳",desc:"Cookware, serveware and kitchen essentials"},
  {id:"appliances",name:"Home Appliances & Electronics",icon:"🔌",desc:"Useful appliances and electronic accessories"},
  {id:"gifting",name:"Corporate Gifting",icon:"🎁",desc:"Branded gifts, stationery and merchandise"}
];

const legacyCategoryAliases = {
  "t-shirts":"T Shirts","school-college-uniforms":"School & College uniforms","corporate-industrial-uniforms":"Corporate & Industrial uniforms",
  "security-housekeeping-uniforms":"Security & housekeeping uniforms","healthcare-uniforms":"Healthcare Uniforms",
  "hotel-hospitality-uniforms":"Hotel and Hospitality Uniforms","handbagsbags-wallets":"Handbags, Bags & Wallets",
  "women-ethnic-wear":"Women Ethnic Wear","women-western-tops":"Women Western Tops","western-shrugs":"Western Shrug",
  "mens-shirts-dhoti-set":"Men's Shirts & Dhoti Set","school-college-bags":"School & College Bags","laptop-sleeve":"Laptop Sleeve",
  "appachatty":"Appam Pan","rice-cook-ware":"Cooking Pot","cleaning-brush":"Cleaning Brush","wall-fans":"Wall Fans","pen-stands":"Pen Stands",
  "alarm-clocks":"Alarm Clock","bath-mats":"Mats","cleaning-wipes":"Microfiber Cleaning Cloths","cups-and-mugs":"Cups & Mugs",
  "dust-pan":"Dust Pan With Brush","handcrafted-wooden-toys":"Toys","headphones-earphones":"Headphones",
  "micro-fiber-gloves":"Microfiber Gloves","microfiber-cleaning-cloth-roll":"Microfiber Cleaning Cloths",
  "mobiles-and-accessories":"Mobile Accessories","pedestal":"Pedestal Fans","sleep-and-lounge-wear":"Sleep & Lounge Wear",
  "surge-protection-extension-board":"Extension Board","trays":"Serving Trays"
};

const state = {
  products: [], productsLoadedAt: 0, productLoadError: "", content: {}, cmsPages: [], homeSections: [], storeSettings: {}, paymentSettings: null, user: null, isAdmin: null, adminError: "",
  cart: readCart(), mobileMenuOpen: false, megaOpen: false, adminTab: "overview", editingProduct: null,
  adminProducts: [], adminOrders: [], adminInquiries: [], accountOrders: [], toastTimer: null, renderId: 0,
  lastOrder: null, cloudStatus: "Connecting to store…", cloudKind: ""
};

function slugify(value) {
  return String(value || "").toLowerCase().replace(/[’']/g, "").replace(/&/g, " ").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
}
function safeImage(value, label="JRT Mart") {
  const raw = String(value || "").trim();
  if (/^https?:\/\//i.test(raw)) return raw;
  return `https://placehold.co/720x620/f1f4f7/0b2e4f?text=${encodeURIComponent(label.slice(0,36))}`;
}
function money(value) {
  const currency=String(storeValue("currency",CURRENCY)||CURRENCY).toUpperCase();
  const locale=String(storeValue("locale",LOCALE)||LOCALE);
  try { return new Intl.NumberFormat(locale,{style:"currency",currency,maximumFractionDigits:2}).format(Number(value || 0)); }
  catch { return `${currency} ${Number(value || 0).toFixed(2)}`; }
}
function routeLink(path, label, className="") {
  const href=String(path||"");
  const navigation=/\.html(?:[?#]|$)/i.test(href)?"":"data-nav";
  return `<a class="${className}" href="${esc(href)}" ${navigation}>${label}</a>`;
}
function findCategory(slug) {
  const clean = String(slug || "").replace(/^\/+|\/+$/g, "").toLowerCase();
  const aliasName = legacyCategoryAliases[clean];
  if (aliasName) return categoryRows.find(c => c.name.toLowerCase() === aliasName.toLowerCase());
  return categoryRows.find(c => c.slug === clean || slugify(c.name) === clean);
}
function categoryPath(category) { return `/category/${category.slug}`; }
function groupLabel(id) { return groups.find(g => g.id === id)?.name || "Products"; }
function readCart() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(raw) ? raw.filter(x => x && typeof x.productId === "string" && Number.isFinite(Number(x.qty)) && Number(x.qty) > 0).map(x => ({productId:x.productId,qty:Math.max(1,Math.floor(Number(x.qty)))})) : [];
  } catch { return []; }
}
function writeCart() { localStorage.setItem(STORAGE_KEY,JSON.stringify(state.cart)); updateHeaderCartCount(); }
function cartCount() { return state.cart.reduce((sum,x)=>sum+x.qty,0); }
function toast(message, kind="") {
  let host = document.querySelector(".toast-host");
  if (!host) { host=document.createElement("div");host.className="toast-host";document.body.appendChild(host); }
  const el=document.createElement("div");el.className=`toast ${kind}`;el.textContent=message;host.appendChild(el);
  setTimeout(()=>el.remove(),4200);
}
function setCloud(message, kind="") {
  state.cloudStatus=message;state.cloudKind=kind;
  const el=document.querySelector(".cloud-chip");if(el){el.textContent=message;el.className=`cloud-chip ${kind}`;}
}
function updateHeaderCartCount() {
  const el=document.querySelector("[data-cart-count]");if(el)el.textContent=String(cartCount());
}
function getCartItems() {
  return state.cart.map(line=>{
    const p=state.products.find(x=>String(x.id)===line.productId);
    return p ? {...line,product:p} : null;
  }).filter(Boolean);
}
function unitPriceFor(product, quantity) {
  const tiers=Array.isArray(product?.price_tiers)?[...product.price_tiers].sort((a,b)=>Number(a.min_qty)-Number(b.min_qty)):[];
  let price=Number(product?.price||0);
  for(const tier of tiers){
    const min=Number(tier.min_qty),tierPrice=Number(tier.price);
    if(Number.isFinite(min)&&Number.isFinite(tierPrice)&&min>=1&&tierPrice>=0&&Number(quantity)>=min)price=tierPrice;
  }
  return price;
}
function cartSubtotal() { return getCartItems().reduce((sum,x)=>sum+unitPriceFor(x.product,x.qty)*x.qty,0); }
function cartTaxEstimate() { return getCartItems().reduce((sum,x)=>sum+unitPriceFor(x.product,x.qty)*x.qty*Math.max(0,Number(x.product.tax_rate||0))/100,0); }
function shippingEstimate() {
  const mode=String(storeValue("shipping_mode","quote"));
  const rate=Math.max(0,Number(storeValue("shipping_flat_rate","0")||0));
  const threshold=Number(storeValue("free_shipping_threshold",""));
  if(mode==="flat")return {amount:rate,label:money(rate)};
  if(mode==="free_over_threshold")return Number.isFinite(threshold)&&threshold>0&&cartSubtotal()>=threshold?{amount:0,label:"Free"}:{amount:rate,label:money(rate)};
  return {amount:null,label:"Confirmed separately"};
}
function addToCart(productId, quantity) {
  const product=state.products.find(p=>String(p.id)===String(productId));
  if(!product){toast("This product is no longer available. Refresh and try again.","error");return;}
  const min=Math.max(1,Number(product.moq||1));
  const qty=Math.max(min,Math.floor(Number(quantity)||min));
  const stockTracked=product.stock_qty!==null&&product.stock_qty!==undefined&&product.stock_qty!=="";
  const stock=stockTracked?Number(product.stock_qty):null;
  const existing=state.cart.find(x=>x.productId===String(productId));
  const newQty=(existing?.qty||0)+qty;
  if(stockTracked&&(!Number.isFinite(stock)||stock<=0)){toast("This product is currently out of stock. Please request a quote for availability.","error");return;}
  if(stockTracked&&newQty>stock){toast(`Only ${stock} units are currently available.`,"error");return;}
  if(existing)existing.qty=newQty;else state.cart.push({productId:String(productId),qty});
  writeCart();toast(`${product.name} added to your cart.`,"ok");
}
function changeCart(productId, delta) {
  const line=state.cart.find(x=>x.productId===String(productId));if(!line)return;
  const p=state.products.find(x=>String(x.id)===String(productId));const min=Math.max(1,Number(p?.moq||1));
  line.qty=Math.max(min,line.qty+delta);
  const stockTracked=p?.stock_qty!==null&&p?.stock_qty!==undefined&&p?.stock_qty!=="";const stock=stockTracked?Number(p.stock_qty):null;if(stockTracked&&stock>0)line.qty=Math.min(stock,line.qty);
  writeCart();render();
}
function removeCart(productId) { state.cart=state.cart.filter(x=>x.productId!==String(productId));writeCart();render(); }

async function loadProducts(force=false) {
  if(!supabase)return [];
  if(!force&&state.products.length&&Date.now()-state.productsLoadedAt<45000)return state.products;
  const {data,error}=await supabase.from("products").select("*").eq("is_active",true).order("featured",{ascending:false}).order("created_at",{ascending:false}).limit(300);
  if(error){state.productLoadError=error.message;setCloud("Catalogue setup needed","err");return state.products;}
  state.products=Array.isArray(data)?data:[];state.productsLoadedAt=Date.now();state.productLoadError="";
  if(state.cloudKind!=="err")setCloud("Store connected","ok");
  return state.products;
}
async function loadContent() {
  if(!supabase)return {};
  const {data,error}=await supabase.from("site_content").select("key,value");
  if(error){console.warn("site_content",error.message);return state.content;}
  state.content=Object.fromEntries((data||[]).map(x=>[x.key,x.value||""]));return state.content;
}
function settingValue(value) {
  if (typeof value === "string") return value;
  if (value === null || value === undefined) return "";
  return value;
}
async function loadStoreCMS() {
  if(!supabase)return;
  const [cats,pages,sections,settings,payments]=await Promise.all([
    supabase.from("categories").select("*").eq("is_active",true).order("sort_order",{ascending:true}),
    supabase.from("site_pages").select("*").eq("is_published",true).order("sort_order",{ascending:true}),
    supabase.from("site_sections").select("*").eq("is_visible",true).order("sort_order",{ascending:true}),
    supabase.from("store_settings").select("key,value").eq("is_public",true),
    supabase.from("payment_settings").select("*").eq("id",1).maybeSingle()
  ]);
  if(!cats.error && Array.isArray(cats.data) && cats.data.length){
    categoryRows=cats.data.map(c=>({id:c.legacy_id??c.id,name:c.name,group:c.group_key||"other",slug:c.slug||slugify(c.name),icon:c.icon||"📦",image_url:c.image_url||"",description:c.description||"",group_name:c.group_name||c.group_key||"Other"}));
    const merged=new Map(groups.map(g=>[g.id,g]));
    for(const c of categoryRows) if(!merged.has(c.group)) merged.set(c.group,{id:c.group,name:c.group_name||c.group,icon:c.icon||"📦",desc:"Browse products in this category"});
    groups=[...merged.values()];
  } else if(cats.error) console.warn("categories",cats.error.message);
  if(!pages.error)state.cmsPages=pages.data||[];else console.warn("site_pages",pages.error.message);
  if(!sections.error){state.allCmsSections=sections.data||[];state.homeSections=state.allCmsSections.filter(x=>x.page_slug==="home");}else console.warn("site_sections",sections.error.message);
  if(!settings.error)state.storeSettings=Object.fromEntries((settings.data||[]).map(x=>[x.key,settingValue(x.value)]));else console.warn("store_settings",settings.error.message);
  if(!payments.error)state.paymentSettings=payments.data||null;else console.warn("payment_settings",payments.error.message);
}
function storeValue(key,fallback="") { const v=state.storeSettings?.[key]; return v===null||v===undefined||v===""?fallback:v; }
async function checkAdmin() {
  state.isAdmin=false;state.adminError="";
  if(!supabase||!state.user)return false;
  const {data,error}=await supabase.from("admin_users").select("user_id").eq("user_id",state.user.id).maybeSingle();
  if(error){state.adminError=error.message;return false;}
  state.isAdmin=!!data;return state.isAdmin;
}
async function init() {
  if(!SUPABASE_READY){setCloud("Add Supabase settings","err");}
  else {
    setCloud("Connecting to Supabase…");
    try {
      const {data,error}=await supabase.auth.getSession();
      if(error)throw error;
      state.user=data.session?.user||null;
      setCloud("Store connected","ok");
      await Promise.all([loadContent(),loadStoreCMS(),loadProducts()]);
      if(state.user)await checkAdmin();
      supabase.auth.onAuthStateChange((_event,session)=>{
        state.user=session?.user||null;state.isAdmin=null;
        queueMicrotask(async()=>{if(state.user&&location.pathname.replace(/\/$/,"")==="/admin")await checkAdmin();render();});
      });
    } catch(e) { setCloud("Connection issue","err");console.warn(e); }
  }
  await render();
}

function headerHTML() {
  const quick=["apparel","uniforms","bags","home","kitchen","gifting"];
  const grouped=groups.map(g=>`<div class="mega-group"><h3>${g.icon} ${esc(g.name)}</h3>${categoryRows.filter(c=>c.group===g.id).map(c=>routeLink(categoryPath(c),esc(c.name))).join("")}</div>`).join("");
  return `
  <div class="site-header">
    <div class="topline"><div class="container topline-in"><span>${esc(storeValue("store_tagline","WHOLESALE · RETAIL · BUSINESS SUPPLY"))}</span><div class="topline-links"><a href="/live-stock-board" data-nav class="topline-hide">Live stock board</a><a href="/my-orders" data-nav>Track order</a><a href="/contact-us" data-nav>Help & support</a></div></div></div>
    <div class="container header-main">
      ${routeLink("/",`${storeValue("logo_url")?`<img class="brand-image" src="${esc(storeValue("logo_url"))}" alt="${esc(storeValue("store_name","JRT Mart"))}">`:`<span class="brand-mark">J</span>`}<span class="brand-copy">${esc(storeValue("store_name","JRT Mart"))}<small>${esc(storeValue("store_tagline","WHOLESALE • RETAIL • BUSINESS"))}</small></span>`,"brand")}
      <form class="search-form" id="header-search"><select name="category" aria-label="Search category"><option value="">All categories</option>${categoryRows.map(c=>`<option value="${esc(c.slug)}">${esc(c.name)}</option>`).join("")}</select><input name="q" type="search" placeholder="Search t-shirts, uniforms, bags, gifting…" aria-label="Search products"><button aria-label="Search" type="submit">⌕</button></form>
      <div class="header-actions"><a class="header-action account" href="${state.user?"/my-account":"/login"}" data-nav><small>${state.user?"Signed in":"Welcome"}</small><strong>${state.user?esc((state.user.email||"Account").split("@")[0]):"Account"}</strong></a><a class="header-action cart" href="/cart" data-nav aria-label="Shopping cart"><span class="cart-icon">🛒</span><span class="cart-count" data-cart-count>${cartCount()}</span><strong>Cart</strong></a><button class="mobile-toggle" type="button" data-action="mobile-toggle" aria-expanded="${state.mobileMenuOpen}">☰ Menu</button></div>
    </div>
    <nav class="main-nav" aria-label="Main navigation"><div class="container nav-row">
      <div class="mega-wrap"><button class="mega-toggle" type="button" data-action="mega-toggle" aria-expanded="${state.megaOpen}">☷ All ${categoryRows.length} categories ▾</button><div class="mega-panel" ${state.megaOpen?"":"hidden"}>${grouped}</div></div>
      ${quick.map(id=>routeLink(`/products?group=${id}`,esc(groupLabel(id)),"nav-link")).join("")}
      ${routeLink("/contract-manufacturing","Contract manufacturing","nav-link")}
      <span class="nav-spacer"></span><a class="moq-pill" href="/products?avail=ready" data-nav>Order from 1 piece</a>
    </div></nav>
    <div class="mobile-nav ${state.mobileMenuOpen?"open":""}"><div class="container"><div class="mobile-links">${routeLink("/products","All products")}${routeLink("/get-quote","Get a bulk quote")}${routeLink("/about-us","About JRT Mart")}${routeLink("/contact-us","Contact")}${routeLink("/my-account","My account")}${routeLink("/admin.html","Store admin")}</div><div class="mobile-category-list">${categoryRows.map(c=>routeLink(categoryPath(c),esc(c.name))).join("")}</div></div></div>
  </div>
  ${state.content.announcement?`<div class="announcement">${esc(state.content.announcement)}</div>`:""}`;
}
function footerHTML() {
  const links=(arr)=>arr.map(([label,path])=>routeLink(path,esc(label))).join("");
  const email=String(storeValue("support_email",CONFIG.supportEmail||""));
  const phone=String(storeValue("support_phone",CONFIG.supportPhone||""));
  const address=String(storeValue("business_address",""));
  const storeName=String(storeValue("store_name","JRT Mart"));
  const socials=[["Facebook","facebook_url"],["Instagram","instagram_url"],["LinkedIn","linkedin_url"],["YouTube","youtube_url"]].filter(([,key])=>/^https:\/\//i.test(String(storeValue(key,""))));
  const socialLinks=socials.map(([label,key])=>`<a href="${esc(storeValue(key,""))}" target="_blank" rel="noopener noreferrer">${label}</a>`).join(" · ");
  return `<footer class="site-footer"><div class="container footer-main"><div class="footer-about"><a class="brand" href="/" data-nav>${storeValue("logo_url")?`<img class="brand-image" src="${esc(storeValue("logo_url"))}" alt="${esc(storeName)}">`:`<span class="brand-mark">J</span>`}<span class="brand-copy">${esc(storeName)}<small>${esc(storeValue("store_tagline","WHOLESALE • RETAIL • BUSINESS"))}</small></span></a><p>${esc(storeValue("footer_text","One destination for wholesale products, business essentials, custom manufacturing and corporate supply."))}</p>${address?`<p>${esc(address)}</p>`:""}${email?`<p><a href="mailto:${esc(email)}">${esc(email)}</a></p>`:""}${phone?`<p><a href="tel:${esc(phone.replace(/[^+0-9]/g,""))}">${esc(phone)}</a></p>`:""}${socialLinks?`<p class="footer-socials">${socialLinks}</p>`:""}<a class="btn small" href="/get-quote" data-nav>Request a bulk quote ↗</a></div>
  <div class="footer-col"><h3>Shop categories</h3>${links([["Apparel","/products?group=apparel"],["Uniforms","/products?group=uniforms"],["Bags & travel","/products?group=bags"],["Home & textiles","/products?group=home"],["Kitchen & dining","/products?group=kitchen"],["Corporate gifting","/products?group=gifting"]])}</div>
  <div class="footer-col"><h3>Business solutions</h3>${links([["Contract manufacturing","/contract-manufacturing"],["Bulk order quote","/get-quote"],["Live stock board","/live-stock-board"],["About JRT Mart","/about-us"],["Experience centres","/experience-centres"],["Launch your store","/launch-your-store"],["Client showcase","/clients"],["Careers","/career"],["Contact us","/contact-us"]])}</div>
  <div class="footer-col"><h3>Customer support</h3>${links([["My account","/my-account"],["Orders & tracking","/my-orders"],["Shipping policy","/shipping-policy"],["Returns & refunds","/warranty-and-refund-policy"],["Pricing & payments","/pricing-and-payments-policy"],["Privacy policy","/privacy-policy"],["Terms & conditions","/terms-and-conditions"],["Store admin","/admin.html"]])}</div></div>
  <div class="container footer-bottom"><span>© ${new Date().getFullYear()} ${esc(storeName)}. All rights reserved.</span><span>${esc(storeValue("tax_note","Product availability, GST and shipping are confirmed at order review."))}</span></div></footer>`;
}
function shell(content) {
  return `${headerHTML()}<main id="main" tabindex="-1">${content}</main>${footerHTML()}<div class="cloud-chip ${state.cloudKind}">${esc(state.cloudStatus)}</div>`;
}
function breadcrumb(items) { return `<div class="breadcrumbs">${items.map((x,i)=>`${i?"<span>›</span>":""}${x.path?routeLink(x.path,esc(x.label)): `<span aria-current="page">${esc(x.label)}</span>`}`).join("")}</div>`; }
function pageHero(title,desc="",crumbs=[]) { return `<section class="page-hero"><div class="container">${breadcrumb([{label:"Home",path:"/"},...crumbs,{label:title}])}<h1>${esc(title)}</h1>${desc?`<p>${esc(desc)}</p>`:""}</div></section>`; }
function categoryTiles(limit=16) {
  const ids=[...new Set([...groups.map(g=>g.id),...categoryRows.map(c=>c.group)])];
  return `<div class="category-grid">${ids.slice(0,limit).map(id=>{const g=groups.find(x=>x.id===id)||{id,name:id,icon:"📦",desc:"Browse products"};const items=categoryRows.filter(c=>c.group===id);const image=items.find(c=>c.image_url)?.image_url;return routeLink(`/products?group=${encodeURIComponent(id)}`,`${image?`<img class="category-image" src="${esc(safeImage(image,g.name))}" alt="" loading="lazy">`:`<span class="cat-icon">${esc(g.icon||"📦")}</span>`}<b>${esc(g.name)}</b><small>${items.length} product categories</small><span class="arrow">↗</span>` ,"category-card");}).join("")}</div>`;
}
function cmsHref(url,label,className="text-link") {
  const href=String(url||"").trim();if(!href)return "";
  if(/^https:\/\//i.test(href))return `<a class="${className}" href="${esc(href)}" target="_blank" rel="noopener noreferrer">${label}</a>`;
  return routeLink(href.startsWith("/")?href:`/${href}`,label,className);
}
function cmsSectionHTML(section) {
  const c=section.content||{};const title=section.title?`<h2>${esc(section.title)}</h2>`:"";const eyebrow=section.eyebrow?`<span class="eyebrow">${esc(section.eyebrow)}</span>`:"";const body=section.body?`<p>${esc(section.body).replace(/\n/g,"<br>")}</p>`:"";
  const sectionHead=`<div class="section-head"><div>${eyebrow}${title}${body}</div>${section.cta_label?cmsHref(section.cta_url,esc(section.cta_label),"text-link"):""}</div>`;
  const items=Array.isArray(c.items)?c.items:[];
  const cards=Array.isArray(c.cards)?c.cards:[];
  const buttons=Array.isArray(c.buttons)?c.buttons:[];
  const buttonHTML=buttons.map(b=>cmsHref(b.url,`${esc(b.label||"Learn more")} ↗`,"btn secondary")).join("");
  switch(section.section_type){
    case "hero": return `<section class="hero cms-hero"><div class="container hero-grid"><div class="hero-copy">${eyebrow}<h1>${esc(section.title||"Wholesale products for every business.")}</h1><p>${esc(section.body||"")}</p><div class="hero-actions">${section.cta_label?cmsHref(section.cta_url,`${esc(section.cta_label)} ↗`,"btn"):""}${buttonHTML}</div></div><div class="hero-art">${section.image_url?`<img src="${esc(safeImage(section.image_url,"JRT Mart"))}" alt="${esc(section.title)}">`:`<div class="hero-card"><div class="hero-card-top"><span>JRT MART · BUSINESS SUPPLY</span><span>● LIVE CATALOGUE</span></div><div class="hero-card-big">Source smarter.<br>Scale faster.</div><div class="hero-card-sub">Wholesale · Retail · Custom manufacturing</div><div class="hero-stack"><div>👕<small>APPAREL</small></div><div>🎒<small>BAGS</small></div><div>🎁<small>GIFTING</small></div></div></div>`}</div></div></section>`;
    case "trust_strip": return `<section class="trust-strip"><div class="container trust-grid">${items.map((x,i)=>`<div class="trust-item"><span class="trust-icon">${esc(x.icon||["✓","📦","🏭","🤝"][i%4])}</span><span><b>${esc(x.title||x.label||"")}</b>${esc(x.body||x.description||"")}</span></div>`).join("")}</div></section>`;
    case "category_grid": return `<section class="section"><div class="container">${sectionHead}${categoryTiles(16)}</div></section>`;
    case "manufacturing": return `<section class="section soft"><div class="container">${sectionHead}<div class="feature-grid">${(c.steps||[]).map((x,i)=>`<article class="feature-card"><span class="number">${esc(x.number||String(i+1).padStart(2,"0"))}</span><h3>${esc(x.title||"")}</h3><p>${esc(x.body||x.description||"")}</p></article>`).join("")}</div>${buttonHTML?`<div class="hero-actions" style="margin-top:22px">${buttonHTML}</div>`:""}</div></section>`;
    case "clients": case "logo_strip": return `<section class="section"><div class="container">${sectionHead}<div class="client-logo-grid">${(c.logos||items).map(x=>`<div class="client-logo">${x.image_url?`<img src="${esc(safeImage(x.image_url,x.name||"Client"))}" alt="${esc(x.name||"Client logo")}" loading="lazy">`:`<b>${esc(x.name||x.title||"")}</b>`}</div>`).join("")}</div></div></section>`;
    case "offerings": case "credentials": case "values": case "media": return `<section class="section ${section.section_type==="media"?"soft":""}"><div class="container">${sectionHead}<div class="feature-grid">${cards.concat(items).map((x,i)=>`<article class="feature-card">${x.image_url?`<img src="${esc(safeImage(x.image_url,x.title||"JRT Mart"))}" alt="${esc(x.title||"")}" loading="lazy" class="cms-card-image">`: `<span class="number">${esc(x.number||x.icon||String(i+1).padStart(2,"0"))}</span>`}<h3>${esc(x.title||x.name||"")}</h3><p>${esc(x.body||x.description||"")}</p>${x.url?cmsHref(x.url,"Learn more →"):""}</article>`).join("")}</div></div></section>`;
    case "faq": return `<section class="section soft"><div class="container cms-faq">${sectionHead}${items.map(x=>`<details class="cms-faq-item"><summary>${esc(x.question||x.title||"")}</summary><div class="answer-body">${esc(x.answer||x.body||"").replace(/\n\n/g,"</p><p>").replace(/\n/g,"<br>")}</div></details>`).join("")}</div></section>`;
    case "cta": return `<section class="section"><div class="container"><div class="cta-band"><div>${eyebrow}${title}${body}</div>${section.cta_label?cmsHref(section.cta_url,`${esc(section.cta_label)} ↗`,"btn"):buttonHTML}</div></div></section>`;
    case "stats": return `<section class="section"><div class="container">${sectionHead}<div class="stats-grid">${items.map(x=>`<div class="stat-card"><b>${esc(x.value||x.number||"")}</b><span>${esc(x.label||x.title||"")}</span></div>`).join("")}</div></div></section>`;
    case "image_text": return `<section class="section"><div class="container image-text-grid">${section.image_url?`<img src="${esc(safeImage(section.image_url,section.title||"JRT Mart"))}" alt="${esc(section.title||"")}" loading="lazy">`:""}<div>${eyebrow}${title}${body}${section.cta_label?cmsHref(section.cta_url,`${esc(section.cta_label)} ↗`,"btn"):""}</div></div></section>`;
    case "product_grid": return `<section class="section"><div class="container">${sectionHead}${productGrid(state.products.filter(x=>x.featured).slice(0,8))}</div></section>`;
    case "rich_text": default: return `<section class="section"><div class="container cms-rich">${sectionHead}${section.image_url?`<img src="${esc(safeImage(section.image_url,section.title||"JRT Mart"))}" alt="${esc(section.title||"")}" loading="lazy">`:""}</div></section>`;
  }
}

function productCard(p) {
  const img=safeImage(p.image_url,p.name||"JRT Mart product");
  const slug=p.slug||slugify(p.name);
  const moq=Math.max(1,Number(p.moq||1));
  return `<article class="product-card"><a class="product-media" href="/product/${esc(slug)}" data-nav><img src="${esc(img)}" alt="${esc(p.name)}" loading="lazy">${p.featured?`<span class="product-tag">Featured</span>`:""}</a><div class="product-info"><span class="category">${esc(p.category||"General")}</span><h3>${routeLink(`/product/${slug}`,esc(p.name))}</h3><p class="product-desc">${esc(p.short_description||p.description||"Quality products and business supply from JRT Mart.").slice(0,95)}</p><div class="product-price"><strong>${money(p.price)}</strong>${Number(p.compare_at_price)>Number(p.price)?`<del>${money(p.compare_at_price)}</del>`:""}</div><div class="product-actions"><button class="btn small" data-action="add-cart" data-product="${esc(p.id)}" data-qty="${moq}">Add to cart</button><a class="btn small secondary" href="/product/${esc(slug)}" data-nav>Details</a></div><p class="muted" style="font-size:10px;margin:8px 0 0">Minimum order: ${moq}${Array.isArray(p.price_tiers)&&p.price_tiers.length?` · ${p.price_tiers.length} bulk price tiers`:""}</p></div></article>`;
}
function productGrid(items) { return items.length?`<div class="product-grid">${items.map(productCard).join("")}</div>`:`<div class="empty-state"><div class="empty-icon">📦</div><h3>Products are being prepared</h3><p>There are no published products in this selection yet. Send us your requirement and our team can help with stock, bulk rates and custom options.</p><a class="btn" href="/get-quote" data-nav>Request a quote</a></div>`; }
function trustStrip() { return `<div class="trust-strip"><div class="container trust-grid"><div class="trust-item"><span class="trust-icon">📦</span><span><b>Ready-stock supply</b>Order available items from 1 piece</span></div><div class="trust-item"><span class="trust-icon">🏭</span><span><b>Custom manufacturing</b>Made to your requirements</span></div><div class="trust-item"><span class="trust-icon">✓</span><span><b>Quality checkpoints</b>Sample and production checks</span></div><div class="trust-item"><span class="trust-icon">🤝</span><span><b>Business support</b>One team for your order</span></div></div></div>`; }

async function homePage() {
  const products=await loadProducts();
  if(state.homeSections?.length){
    const sections=[...state.homeSections].filter(x=>x.is_visible).sort((a,b)=>Number(a.sort_order)-Number(b.sort_order));
    const html=sections.map(cmsSectionHTML).join("");
    return {title:storeValue("seo_title","JRT Mart | Wholesale, Retail & Business Supply"),description:storeValue("seo_description","Wholesale products, business supplies and custom manufacturing from JRT Mart."),html};
  }
  const heroTitle=esc(state.content.hero_title||"Everything your business needs. One supply partner.");
  const heroDescription=esc(state.content.hero_description||"Shop ready-to-ship products, source in bulk, or build a custom order with JRT Mart’s manufacturing and fulfilment network.");
  return {title:"JRT Mart | Wholesale, Retail & Business Supply",description:"Wholesale products, business supplies and custom manufacturing from JRT Mart.",html:`<section class="hero"><div class="container hero-grid"><div class="hero-copy"><span class="eyebrow">A smarter way to source</span><h1>${heroTitle}</h1><p>${heroDescription}</p><div class="hero-actions"><a class="btn" href="/products" data-nav>Explore the catalogue ↗</a><a class="btn secondary" href="/get-quote" data-nav>Get a bulk quote</a></div><div class="hero-trust"><span>Ready stock from 1 piece</span><span>Bulk supply programmes</span><span>Custom branding & manufacturing</span></div></div><div class="hero-art"><div class="hero-card"><div class="hero-card-top"><span>JRT MART · BUSINESS SUPPLY</span><span>● LIVE CATALOGUE</span></div><div class="hero-card-big">Source smarter.<br>Scale faster.</div><div class="hero-card-sub">Wholesale · Retail · Custom manufacturing</div><div class="hero-stack"><div>👕<small>APPAREL</small></div><div>🎒<small>BAGS</small></div><div>🎁<small>GIFTING</small></div></div></div></div></div></section>${trustStrip()}<section class="section"><div class="container"><div class="section-head"><div><span class="eyebrow">Explore our range</span><h2>Shop by category</h2><p>Browse the main product families and find the right supply for your business, team or institution.</p></div>${routeLink("/products","View all products →","text-link")}</div>${categoryTiles()}</div></section><section class="section soft"><div class="container"><div class="section-head"><div><span class="eyebrow">From the catalogue</span><h2>Featured products</h2><p>Current products published by the JRT Mart store team.</p></div>${routeLink("/products","Browse catalogue →","text-link")}</div>${products.length?productGrid(products.filter(p=>p.featured).slice(0,8).length?products.filter(p=>p.featured).slice(0,8):products.slice(0,8)):`<div class="empty-state"><div class="empty-icon">🛍️</div><h3>Our catalogue is being updated</h3><p>Product listings and live prices will appear here as soon as the store team publishes them. You can still request a bulk quote now.</p><a class="btn" href="/get-quote" data-nav>Talk to our team</a></div>`}</div></section><section class="section"><div class="container"><div class="section-head"><div><span class="eyebrow">One integrated platform</span><h2>Three ways to work with JRT Mart</h2><p>Choose a supply model that fits the stage and scale of your business.</p></div></div><div class="feature-grid"><article class="feature-card"><span class="number">01</span><h3>Ready-to-ship supply</h3><p>Source available products for business, retail, institutions and teams. Stock and minimum quantities are shown on each live product listing.</p></article><article class="feature-card"><span class="number">02</span><h3>Contract manufacturing</h3><p>Develop custom products, private-label ranges and branded merchandise through a managed production and quality workflow.</p><a class="text-link" href="/contract-manufacturing" data-nav>Explore manufacturing →</a></article><article class="feature-card"><span class="number">03</span><h3>Business & bulk programmes</h3><p>Plan repeat purchasing, custom specifications and multi-location supply with one point of contact.</p><a class="text-link" href="/get-quote" data-nav>Start an enquiry →</a></article></div></div></section><section class="section soft"><div class="container"><div class="cta-band"><div><h2>Have a volume or custom requirement?</h2><p>Tell us what you need, how many pieces and when you need them.</p></div><a class="btn" href="/get-quote" data-nav>Request a quote ↗</a></div></div></section>`};
}

async function catalogPage(url) {
  const all=await loadProducts();const params=new URLSearchParams(url.search);const q=(params.get("q")||"").trim().toLowerCase();const group=params.get("group")||"";const categorySlug=params.get("category")||"";const cat=categorySlug?findCategory(categorySlug):null;const sort=params.get("sort")||"featured";
  let products=all.filter(p=>{
    const catMatch=!cat||String(p.category||"").toLowerCase()===cat.name.toLowerCase()||slugify(p.category)===cat.slug;
    const grpMatch=!group||group==="all"||categoryRows.some(c=>c.group===group&&c.name.toLowerCase()===String(p.category||"").toLowerCase())||slugify(p.category)===group;
    const textMatch=!q||[p.name,p.category,p.description,p.sku].some(v=>String(v||"").toLowerCase().includes(q));
    const readyMatch=params.get("avail")!=="ready"||(Number(p.moq||1)<=1&&(p.stock_qty===null||p.stock_qty===undefined||Number(p.stock_qty)>0));
    return catMatch&&grpMatch&&textMatch&&readyMatch;
  });
  if(sort==="price-low")products.sort((a,b)=>Number(a.price)-Number(b.price));
  if(sort==="price-high")products.sort((a,b)=>Number(b.price)-Number(a.price));
  if(sort==="name")products.sort((a,b)=>String(a.name).localeCompare(String(b.name)));
  const title=cat?.name||(group?groupLabel(group):(q?`Search results for “${q}”`:"All products"));
  const sidebar=`<aside class="filter-panel"><h3>Shop categories</h3>${routeLink("/products","All products",!cat&&!group?"active":"")}${groups.map(g=>routeLink(`/products?group=${g.id}`,esc(g.name),group===g.id?"active":"")).join("")}<hr style="border:0;border-top:1px solid var(--line);margin:13px 0"><h3>Popular categories</h3>${categoryRows.slice(0,28).map(c=>routeLink(`/products?category=${c.slug}`,esc(c.name),cat?.id===c.id?"active":"")).join("")}</aside>`;
  return {title:`${title} | JRT Mart`,description:`Browse ${title} at JRT Mart. Wholesale, retail and business supply.`,html:`${pageHero(title,cat?`Browse products in ${cat.name}. For bulk quantities, custom specifications or branding, request a quote.`:q?`Matching products and categories from the JRT Mart catalogue.`:`Explore live products across apparel, uniforms, bags, home, kitchen, appliances and gifting.`,[{label:"Products",path:"/products"}])}<section class="section"><div class="container catalog-layout">${sidebar}<div><div class="catalog-toolbar"><p>${products.length} product${products.length===1?"":"s"} found${q?` for “${esc(q)}”`:""}</p><select id="catalog-sort" aria-label="Sort products"><option value="featured" ${sort==="featured"?"selected":""}>Featured first</option><option value="price-low" ${sort==="price-low"?"selected":""}>Price: low to high</option><option value="price-high" ${sort==="price-high"?"selected":""}>Price: high to low</option><option value="name" ${sort==="name"?"selected":""}>Name: A to Z</option></select></div>${state.productLoadError?`<div class="notice">The live catalogue could not be loaded: ${esc(state.productLoadError)}. Check the Supabase setup and table policies.</div>`:""}${productGrid(products)}</div></div></section>`};
}
async function productPage(slug) {
  const products=await loadProducts();const product=products.find(p=>(p.slug||slugify(p.name))===slug||String(p.id)===slug);
  if(!product)return {title:"Product not found | JRT Mart",html:`${pageHero("Product not found","This product may have been unpublished or its link may have changed.")}<section class="section"><div class="container"><div class="empty-state"><div class="empty-icon">🔎</div><h3>We couldn't find that product</h3><p>Return to the catalogue or send our team your requirement.</p><a class="btn" href="/products" data-nav>Browse products</a></div></div></section>`};
  const category=findCategory(slugify(product.category))||categoryRows.find(c=>c.name.toLowerCase()===String(product.category||"").toLowerCase());const min=Math.max(1,Number(product.moq||1));
  const gallery=[product.image_url,...(Array.isArray(product.gallery_urls)?product.gallery_urls:[])].filter(Boolean);
  const specs=product.specifications&&typeof product.specifications==="object"?Object.entries(product.specifications):[];
  const variants=Array.isArray(product.variants)?product.variants:[];const tiers=Array.isArray(product.price_tiers)?[...product.price_tiers].sort((a,b)=>Number(a.min_qty)-Number(b.min_qty)):[];
  const galleryHTML=gallery.length?`<div class="product-gallery"><img class="product-main-image" src="${esc(safeImage(gallery[0],product.name))}" alt="${esc(product.name)}">${gallery.length>1?`<div class="product-thumbs">${gallery.map((x,i)=>`<button type="button" class="product-thumb" data-action="gallery-image" data-image="${esc(x)}" aria-label="Show product image ${i+1}"><img src="${esc(safeImage(x,product.name))}" alt=""></button>`).join("")}</div>`:""}</div>`:`<div class="product-detail-image"><img src="${esc(safeImage(null,product.name))}" alt="${esc(product.name)}"></div>`;
  return {title:`${product.meta_title||product.name} | JRT Mart`,description:String(product.meta_description||product.short_description||product.description||product.name).slice(0,155),html:`${pageHero(product.name,product.category||"JRT Mart product",[{label:"Products",path:"/products"},...(category?[{label:category.name,path:`/products?category=${category.slug}`}]:[])])}<section class="section"><div class="container"><div class="product-detail">${galleryHTML}<div class="product-detail-copy"><span class="eyebrow">${esc(product.category||"General")}</span><h1>${esc(product.name)}</h1><div class="price-large">${money(product.price)} <small>per ${esc(product.unit_name||"piece")}</small> ${Number(product.compare_at_price)>Number(product.price)?`<del>${money(product.compare_at_price)}</del>`:""}</div><p class="muted">${esc(product.short_description||product.description||"Quality product from JRT Mart.")}</p><div class="detail-meta"><div>Minimum order<b>${min} ${esc(product.unit_name||"unit")}${min===1?"":"s"}</b></div><div>SKU<b>${esc(product.sku||"Available on request")}</b></div><div>Availability<b>${product.stock_qty===null||product.stock_qty===undefined?"Available on request":Number(product.stock_qty)>0?`${Number(product.stock_qty)} in stock`:"Out of stock"}</b></div><div>Category<b>${esc(product.category||"General")}</b></div></div>${tiers.length?`<div class="price-tier-block"><h3>Bulk pricing</h3><div class="price-tier-table"><div class="price-tier-row header"><b>Quantity</b><b>Price / ${esc(product.unit_name||"unit")}</b></div>${tiers.map(t=>`<div class="price-tier-row"><span>${Number(t.min_qty)}+</span><b>${money(t.price)}</b></div>`).join("")}</div><small class="muted">Displayed tiers apply when the order is created. Final taxes and delivery are calculated separately.</small></div>`:""}${variants.length?`<div class="spec-block"><h3>Available options</h3>${variants.map(v=>`<p><b>${esc(v.name||"Option")}:</b> ${esc((v.options||[]).join(", "))}</p>`).join("")}</div>`:""}${specs.length?`<div class="spec-block"><h3>Specifications</h3><dl class="spec-list">${specs.map(([k,v])=>`<div><dt>${esc(k)}</dt><dd>${esc(Array.isArray(v)?v.join(", "):typeof v==="object"?JSON.stringify(v):v)}</dd></div>`).join("")}</dl></div>`:""}<div class="detail-qty"><label for="detail-qty"><b>Quantity</b></label><div class="qty-control"><button type="button" data-action="detail-qty" data-delta="-1">−</button><input id="detail-qty" type="number" min="${min}" value="${min}" step="1"><button type="button" data-action="detail-qty" data-delta="1">+</button></div></div><div class="hero-actions" style="margin-top:0"><button class="btn" data-action="add-detail-cart" data-product="${esc(product.id)}">Add to cart</button><a class="btn secondary" href="/get-quote?product=${encodeURIComponent(product.name)}" data-nav>Request bulk quote</a></div><div class="detail-copy">${esc(product.description||"For larger quantities, private labelling or custom specifications, contact our team. We will confirm the current specification, production lead time, GST and delivery options before payment.").replace(/\n/g,"<br>")}</div></div></div></div></section>`};
}

function cartPage() {
  const items=getCartItems();
  if(!items.length)return {title:"Your cart | JRT Mart",html:`${pageHero("Your cart","Your cart is ready when you are.")}<section class="section"><div class="container"><div class="empty-state"><div class="empty-icon">🛒</div><h3>Your cart is empty</h3><p>Browse the catalogue and add the products you need. For bulk or custom orders, send us a quote request.</p><a class="btn" href="/products" data-nav>Explore products</a></div></div></section>`};
  return {title:"Your cart | JRT Mart",html:`${pageHero("Your shopping cart","Review quantities before placing your order request.")}<section class="section"><div class="container cart-layout"><div class="cart-list">${items.map(x=>`<div class="cart-row"><img src="${esc(safeImage(x.product.image_url,x.product.name))}" alt="${esc(x.product.name)}"><div><h3>${esc(x.product.name)}</h3><p>${esc(x.product.category||"General")} · MOQ ${Math.max(1,Number(x.product.moq||1))}</p><p>${money(unitPriceFor(x.product,x.qty))} each${Array.isArray(x.product.price_tiers)&&x.product.price_tiers.length?" · quantity tier applied":""}</p></div><div class="row-end"><b>${money(unitPriceFor(x.product,x.qty)*x.qty)}</b><div class="qty-control" style="margin-top:8px"><button data-action="cart-qty" data-product="${esc(x.product.id)}" data-delta="-1">−</button><input value="${x.qty}" readonly aria-label="Quantity"><button data-action="cart-qty" data-product="${esc(x.product.id)}" data-delta="1">+</button></div><button class="text-link" style="border:0;background:none;margin-top:6px;font-size:11px" data-action="cart-remove" data-product="${esc(x.product.id)}">Remove</button></div></div>`).join("")}</div><aside class="summary-card"><h3>Order summary</h3><div class="summary-line"><span>Items (${cartCount()})</span><b>${money(cartSubtotal())}</b></div><div class="summary-line"><span>Estimated GST</span><b>${money(cartTaxEstimate())}</b></div><div class="summary-line"><span>Shipping</span><span>${esc(shippingEstimate().label)}</span></div><div class="summary-line total"><span>Estimated total</span><span>${money(cartSubtotal()+cartTaxEstimate()+(shippingEstimate().amount||0))}</span></div><p class="muted" style="font-size:11px">${esc(storeValue("shipping_note","The database recalculates product tiers, tax and configured shipping when you place the order. Courier/freight quotes remain manual when shipping mode is set to quote."))}</p><a class="btn" href="/checkout" data-nav>Continue to checkout →</a><a class="btn secondary" href="/products" data-nav style="margin-top:8px">Continue shopping</a></aside></div></section>`};
}
function checkoutPage() {
  const items=getCartItems();if(!items.length)return {title:"Checkout | JRT Mart",html:`${pageHero("Checkout","Add items to your cart before checkout.")}<section class="section"><div class="container"><div class="empty-state"><div class="empty-icon">🛍️</div><h3>Your cart is empty</h3><a class="btn" href="/products" data-nav>Browse products</a></div></div></section>`};
  const gatewayReady=!!(state.user&&state.paymentSettings?.gateway_enabled&&state.paymentSettings?.provider==="razorpay"&&String(state.paymentSettings?.currency||"INR").toUpperCase()==="INR"&&String(storeValue("shipping_mode","quote"))!=="quote");
  const offlineReady=state.paymentSettings?.manual_payment_enabled!==false;
  const bankInfo=offlineReady&&state.paymentSettings?`<div class="payment-instructions">${state.paymentSettings.instructions?`<p>${esc(state.paymentSettings.instructions)}</p>`:""}${state.paymentSettings.upi_id?`<p><b>UPI ID:</b> ${esc(state.paymentSettings.upi_id)}</p>`:""}${state.paymentSettings.bank_account_name?`<p><b>Account name:</b> ${esc(state.paymentSettings.bank_account_name)}</p>`:""}${state.paymentSettings.bank_name?`<p><b>Bank:</b> ${esc(state.paymentSettings.bank_name)}</p>`:""}${state.paymentSettings.bank_account_number?`<p><b>Account number:</b> ${esc(state.paymentSettings.bank_account_number)}</p>`:""}${state.paymentSettings.bank_ifsc?`<p><b>IFSC:</b> ${esc(state.paymentSettings.bank_ifsc)}</p>`:""}</div>`:"";
  return {title:"Checkout | JRT Mart",html:`${pageHero("Checkout","Share your delivery details and choose an available payment method.")}<section class="section"><div class="container cart-layout"><form id="checkout-form" class="form-card"><h2>Contact and delivery details</h2><div class="field-grid"><div class="field"><label for="co-name">Full name *</label><input id="co-name" name="name" required autocomplete="name" value="${esc(state.user?.user_metadata?.full_name||"")}"></div><div class="field"><label for="co-email">Email *</label><input id="co-email" name="email" type="email" required autocomplete="email" value="${esc(state.user?.email||"")}"></div><div class="field"><label for="co-phone">Phone number *</label><input id="co-phone" name="phone" type="tel" required autocomplete="tel" minlength="8" maxlength="18"></div><div class="field"><label for="co-company">Company / organisation</label><input id="co-company" name="company" autocomplete="organization"></div><div class="field full"><label for="co-address">Street address *</label><textarea id="co-address" name="address" required autocomplete="street-address"></textarea></div><div class="field"><label for="co-city">City *</label><input id="co-city" name="city" required autocomplete="address-level2"></div><div class="field"><label for="co-state">State *</label><input id="co-state" name="state" required autocomplete="address-level1"></div><div class="field"><label for="co-pin">PIN code *</label><input id="co-pin" name="pincode" required inputmode="numeric" pattern="[0-9]{6}" maxlength="6" autocomplete="postal-code"></div><div class="field"><label for="co-country">Country</label><input id="co-country" name="country" value="India" required autocomplete="country-name"></div></div><h2 style="margin-top:16px">Payment method</h2>${gatewayReady?`<label class="radio-line"><input type="radio" name="payment_method" value="razorpay" checked><span><b>Pay securely with Razorpay</b><small>UPI, cards, netbanking and supported payment methods. Payment status is verified by the server.</small></span></label>`:state.paymentSettings?.gateway_enabled&&String(storeValue("shipping_mode","quote"))==="quote"?`<div class="notice">Online payment is temporarily unavailable because delivery freight is confirmed after order review. Choose bank transfer or pay after confirmation; staff can finalise freight before taking payment.</div>`:state.paymentSettings?.gateway_enabled&&!state.user?`<div class="notice">Online payments require a signed-in customer account. ${routeLink("/login?next=/checkout","Sign in or create an account","text-link")} to use Razorpay.</div>`:""}${offlineReady?`<label class="radio-line"><input type="radio" name="payment_method" value="bank_transfer" ${gatewayReady?"":"checked"}><span><b>Bank transfer / UPI against order</b><small>Use the confirmed proforma invoice and payment details below, where available.</small></span></label>`:""}<label class="radio-line"><input type="radio" name="payment_method" value="pay_after_confirmation" ${(gatewayReady||offlineReady)?"":"checked"}><span><b>Pay after order confirmation</b><small>Our team will confirm stock, taxes, freight and payment instructions before collecting payment.</small></span></label>${bankInfo}<div class="field"><label for="co-notes">Order notes</label><textarea id="co-notes" name="notes" placeholder="GSTIN, delivery instructions, branding details or preferred delivery date"></textarea></div><div class="notice">Product quantities and current catalogue prices are validated by the database at order submission. Applicable GST is calculated from the product tax rate. Shipping is confirmed separately.</div><p id="checkout-message" class="form-message" aria-live="polite"></p><button class="btn" type="submit">${gatewayReady?"Continue to secure checkout / place order":"Place order request"} →</button></form><aside class="summary-card"><h3>Order summary</h3>${items.map(x=>`<div class="summary-line"><span>${esc(x.product.name)} × ${x.qty}</span><b>${money(unitPriceFor(x.product,x.qty)*x.qty)}</b></div>`).join("")}<div class="summary-line"><span>Estimated subtotal</span><b>${money(cartSubtotal())}</b></div><div class="summary-line"><span>Estimated GST</span><b>${money(cartTaxEstimate())}</b></div><div class="summary-line"><span>Shipping</span><b>${esc(shippingEstimate().label)}</b></div><div class="summary-line total"><span>Estimated order total</span><span>${money(cartSubtotal()+cartTaxEstimate()+(shippingEstimate().amount||0))}</span></div><p class="muted" style="font-size:11px">${esc(storeValue("shipping_note","Quantity tiers, tax and configured shipping are recalculated by the database when the order is created. Courier/freight remains manual when set to quotation."))}</p></aside></div></section>`};
}

function confirmationPage(url) {
  const num=url.searchParams.get("order")||state.lastOrder?.order_number||"";
  const orderId=state.lastOrder?.order_id||"";
  const paid=url.searchParams.get("paid")==="1";
  const pending=state.lastOrder?.payment_method==="razorpay"&&!paid;
  return {title:"Order received | JRT Mart",html:`${pageHero(paid?"Payment confirmed":"Order request received",paid?"Your payment was verified by the JRT Mart payment server.":"Your request has been submitted. Review the order reference below.")}<section class="section"><div class="container"><div class="empty-state"><div class="empty-icon">${paid?"✅":"📦"}</div><h3>${paid?"Payment recorded successfully":"Your order is recorded"}</h3><p>${pending?"Payment has not yet been confirmed. You can complete or retry it from your customer order history.":"Keep this reference for your records. The store team will review your order and contact you with any remaining delivery or payment details."}</p>${num?`<div style="margin:14px auto;padding:13px 18px;border-radius:9px;background:#f1f5f9;width:max-content;max-width:100%"><small class="muted">Order reference</small><div style="font:800 22px Manrope;color:var(--navy)">${esc(num)}</div></div>`:""}${pending&&orderId?`<button class="btn" data-action="retry-payment" data-order="${esc(orderId)}" data-order-number="${esc(num)}">Pay now with Razorpay</button>`:""}<div class="hero-actions" style="justify-content:center;margin-top:12px"><a class="btn secondary" href="/my-orders" data-nav>View my orders</a><a class="btn secondary" href="/products" data-nav>Continue shopping</a></div></div></div></section>`};
}

function quotePage(url) {
  const product=url.searchParams.get("product")||"";
  return {title:"Get a bulk quote | JRT Mart",description:"Request a wholesale or custom manufacturing quote from JRT Mart.",html:`${pageHero("Let's plan your order","Share the product, quantity and specifications. The team will prepare an itemised quotation.")}<section class="section"><div class="container" style="display:grid;grid-template-columns:minmax(0,1.1fr) minmax(260px,.7fr);gap:28px;align-items:start">${inquiryFormHTML(product)}<div><div class="info-card" style="padding:22px"><span class="eyebrow">Bulk & custom orders</span><h2 style="margin:10px 0;font:800 23px Manrope;color:var(--navy)">From requirement to delivery</h2><p class="muted">A typical order moves through clear steps so specifications and expectations are agreed before production starts.</p><div style="display:grid;gap:13px;margin-top:20px"><div><b>01 · Requirement</b><div class="muted" style="font-size:12px">Product, quantity, specification and deadline.</div></div><div><b>02 · Quotation</b><div class="muted" style="font-size:12px">Pricing, taxes, branding, freight and lead time.</div></div><div><b>03 · Sample approval</b><div class="muted" style="font-size:12px">Agree the reference before bulk production.</div></div><div><b>04 · Production & delivery</b><div class="muted" style="font-size:12px">Quality checks and dispatch updates.</div></div></div></div></div></div></section>`};
}
function standardPage(title,desc,sections) {
  return {title:`${title} | JRT Mart`,description:desc,html:`${pageHero(title,desc)}<section class="section"><div class="container" style="max-width:900px">${sections}</div></section>`};
}
function aboutPage() {
  return standardPage("About JRT Mart","Wholesale, retail and business supply connected by a manufacturing and fulfilment network.",`<div class="feature-grid"><article class="feature-card"><span class="number">01</span><h3>Ready-stock products</h3><p>Products for businesses, retail buyers, teams, institutions and entrepreneurs.</p></article><article class="feature-card"><span class="number">02</span><h3>Contract manufacturing</h3><p>Custom specification, private label and branded production managed against an approved sample.</p></article><article class="feature-card"><span class="number">03</span><h3>Business supply</h3><p>Support for recurring procurement, bulk programmes and multi-product sourcing.</p></article></div><div style="margin-top:28px"><h2 class="admin-panel-title">A practical sourcing partner</h2><p class="muted">JRT Mart brings product sourcing, production coordination and fulfilment together. The aim is to make business purchasing easier to plan, verify and repeat — whether the requirement is a small ready-stock order or a larger custom programme.</p><p class="muted">For custom manufacturing, the process begins with the requirement and specification, followed by a quotation, sample approval, purchase order, production checks and quality-checked delivery. Timelines and minimum quantities depend on the product, material, branding and final specification.</p><a class="btn" href="/get-quote" data-nav>Discuss a requirement</a></div>`);
}
function manufacturingPage() {
  return standardPage("Contract manufacturing","Custom manufacturing and private-label programmes for brands, businesses and institutions.",`<h2 class="admin-panel-title">From your brief to a finished product</h2><p class="muted">JRT Mart coordinates custom product programmes across partner manufacturing capabilities. Product, material, colour, size ratio, branding, packaging, quantity and delivery date are agreed before production.</p><div class="feature-grid" style="margin:24px 0"><article class="feature-card"><span class="number">01</span><h3>Specification</h3><p>Share a tech pack, sample, reference image or a clear description.</p></article><article class="feature-card"><span class="number">02</span><h3>Sample & costing</h3><p>Review the sample, fabric/build, branding and itemised quote.</p></article><article class="feature-card"><span class="number">03</span><h3>Production</h3><p>Approve the purchase order and artwork, then track production and inspection.</p></article></div><div class="notice">Minimum quantity and production lead time are product-specific. The JRT Mart team confirms feasibility in the quotation; do not assume every category can be manufactured at the same MOQ.</div><div style="margin-top:24px"><a class="btn" href="/get-quote" data-nav>Start a manufacturing enquiry</a></div>`);
}
function contactPage() {
  return {title:"Contact JRT Mart",description:"Contact JRT Mart for product, bulk supply and custom manufacturing enquiries.",html:`${pageHero("Contact JRT Mart","Send your question or requirement and the team will follow up.")}<section class="section"><div class="container" style="max-width:760px">${inquiryFormHTML()}</div></section>`};
}
function policyPage(path) {
  path=path.replace(/\/+$/,"");
  const pages={
    "/shipping-policy":["Shipping policy","Delivery options, charges and dispatch timelines are confirmed for each order.",`<h2 class="admin-panel-title">Dispatch and delivery</h2><p class="muted">Available-stock products are dispatched after order and payment confirmation. Custom and bulk orders are dispatched after production and final quality checks. Actual delivery time depends on stock availability, order quantity, destination, carrier and any customisation.</p><h2 class="admin-panel-title">Shipping charges</h2><p class="muted">Shipping and handling charges are not automatically calculated in this storefront. The team confirms freight and any applicable taxes in the quotation or proforma invoice before payment.</p><h2 class="admin-panel-title">Delivery address</h2><p class="muted">Please provide a complete address, PIN code and reachable phone number at checkout. Contact the team promptly if the address or delivery contact needs to change.</p>`],
    "/warranty-and-refund-policy":["Returns, refunds & warranty","How product issues and returns are reviewed by JRT Mart.",`<h2 class="admin-panel-title">Report an issue</h2><p class="muted">Contact JRT Mart with the order reference, product details, photos where useful and a description of the issue. Report shortages, transit damage or specification concerns as soon as possible after delivery.</p><h2 class="admin-panel-title">Review and resolution</h2><p class="muted">The team reviews the order specification, approved sample (where relevant), inspection records and delivery evidence. Any replacement, repair, credit or refund is agreed based on the product, order terms and applicable law.</p><div class="notice">This starter policy page is a template and must be reviewed against JRT Mart's actual commercial terms, statutory obligations and product warranty arrangements before publication.</div><p><a class="btn" href="/contact-us" data-nav>Contact support</a></p>`],
    "/pricing-and-payments-policy":["Pricing & payments","How pricing, taxes and payment instructions are confirmed.",`<h2 class="admin-panel-title">Prices and quotations</h2><p class="muted">Prices displayed in the catalogue are indicative of the current product record. Final price can depend on quantity, specification, branding, packaging, taxes and delivery. The confirmed quotation or proforma invoice governs the payable amount.</p><h2 class="admin-panel-title">Payment</h2><p class="muted">For new orders, payment instructions are shared after stock and order details have been reviewed. Bank transfer details, advance requirements and any agreed credit terms are provided in writing on the proforma invoice or contract.</p><h2 class="admin-panel-title">Online payments</h2><p class="muted">The current website starter supports order requests and manual payment follow-up. It does not capture card, UPI or wallet payments. Do not show a payment-completed status until a payment gateway and server-side payment verification have been configured.</p>`],
    "/privacy-policy":["Privacy policy","How customer data is used when contacting or ordering from JRT Mart.",`<h2 class="admin-panel-title">Information submitted</h2><p class="muted">The store may collect contact details, company name, delivery address, product requirements, order details and messages submitted through forms or checkout.</p><h2 class="admin-panel-title">Use of information</h2><p class="muted">Information is used to respond to enquiries, prepare quotations, process order requests, coordinate delivery and provide customer support. Access should be limited to authorised personnel who need it to fulfil these purposes.</p><h2 class="admin-panel-title">Your responsibilities</h2><p class="muted">Before publication, add JRT Mart's legal entity details, privacy contact, retention periods, applicable processors, cookie/analytics disclosure and any rights and processes required by the laws that apply to your business.</p><div class="notice">This is a starter template, not legal advice. Have the final policy reviewed before launch.</div>`],
    "/terms-and-conditions":["Terms & conditions","Terms for using this JRT Mart storefront and placing order requests.",`<h2 class="admin-panel-title">Catalogue information</h2><p class="muted">Product specifications, availability and displayed prices may change. The final quotation, proforma invoice or written purchase order confirmation records the agreed specification and price.</p><h2 class="admin-panel-title">Orders</h2><p class="muted">Submitting an order request does not mean that stock, a delivery date or payment has been finally accepted. JRT Mart confirms those details after review.</p><h2 class="admin-panel-title">Custom orders</h2><p class="muted">Custom production begins only after the specification, sample, artwork, quantity, commercial terms and purchase order are approved in writing.</p><div class="notice">This is a starter template. Replace it with JRT Mart's approved legal terms before publication.</div>`]
  };
  const x=pages[path];return x?standardPage(x[0],x[1],x[2]):null;
}
function informationPage(path) {
  path=path.replace(/\/+$/,"");
  const pages={
    "/live-stock-board":["Live stock board","Check the current products available in the public catalogue.",`<p class="muted">The live catalogue shows the stock quantity set by the JRT Mart store team. For large orders, stock should be reconfirmed before payment because inventory can change between browsing and order review.</p><a class="btn" href="/products" data-nav>Browse available products</a>`],
    "/helpdesk":["Help & support","Get help with products, quotations and orders.",`<p class="muted">For order tracking, sign in to your account. For product questions, delivery issues or a bulk requirement, send an enquiry and include your order reference where applicable.</p><div class="hero-actions"><a class="btn" href="/my-orders" data-nav>My orders</a><a class="btn secondary" href="/contact-us" data-nav>Contact support</a></div>`],
    "/make-a-payment":["Make a payment","Payment information is issued with an approved quotation or proforma invoice.",`<div class="notice">Do not transfer money to a bank account or UPI ID received from an unverified source. Confirm payment details against an official JRT Mart proforma invoice before making a transfer.</div><p class="muted">When online payments are enabled, signed-in customers can use the secure Razorpay checkout. Bank/UPI details configured by JRT Mart are shown with the order instructions.</p><a class="btn" href="/contact-us" data-nav>Ask for payment instructions</a>`]
  };
  const x=pages[path];return x?standardPage(x[0],x[1],x[2]):null;
}

function authPage() {
  if(state.user)return {title:"Your account | JRT Mart",html:`${pageHero("Your account",`Signed in as ${state.user.email||"customer"}.`)}<section class="section"><div class="container" style="max-width:850px"><div class="feature-grid"><article class="feature-card"><span class="number">👤</span><h3>Account</h3><p>${esc(state.user.email||"")}</p><button class="btn secondary small" data-action="sign-out">Sign out</button></article><article class="feature-card"><span class="number">📦</span><h3>Orders</h3><p>Review order requests placed while signed in.</p><a class="text-link" href="/my-orders" data-nav>View orders →</a></article><article class="feature-card"><span class="number">🛍️</span><h3>Continue shopping</h3><p>Browse current product listings and add to cart.</p><a class="text-link" href="/products" data-nav>Browse products →</a></article></div></div></section>`};
  return {title:"Sign in | JRT Mart",html:`${pageHero("Welcome back","Sign in to see your account and order history.")}<section class="section"><div class="container" style="max-width:500px"><div class="form-card"><h2>Customer sign in</h2><form id="customer-login-form"><div class="field"><label>Email address *</label><input type="email" name="email" required autocomplete="username"></div><div class="field"><label>Password *</label><input type="password" name="password" required autocomplete="current-password"></div><p id="auth-message" class="form-message" aria-live="polite"></p><button class="btn" type="submit">Sign in</button></form><p class="muted" style="font-size:13px">${routeLink("/reset-password","Forgot your password?","text-link")}</p><p class="muted" style="margin-bottom:0;font-size:13px">New to JRT Mart? ${routeLink("/register","Create an account","text-link")}</p></div></div></section>`};
}
function registerPage() {
  return {title:"Create account | JRT Mart",html:`${pageHero("Create your account","Register to keep your customer details and view signed-in orders.")}<section class="section"><div class="container" style="max-width:500px"><div class="form-card"><h2>Customer registration</h2><form id="customer-register-form"><div class="field"><label>Full name *</label><input name="name" required autocomplete="name"></div><div class="field"><label>Email address *</label><input name="email" type="email" required autocomplete="email"></div><div class="field"><label>Password *</label><input name="password" type="password" required minlength="8" autocomplete="new-password"><small class="muted">Use at least 8 characters.</small></div><p id="auth-message" class="form-message" aria-live="polite"></p><button class="btn" type="submit">Create account</button></form><p class="muted" style="margin-bottom:0;font-size:13px">Already have an account? ${routeLink("/login","Sign in","text-link")}</p></div></div></section>`};
}
function resetPasswordPage() {
  if (state.user) return {title:"Set a new password | JRT Mart",html:`${pageHero("Set a new password","Choose a strong password for your JRT Mart account.")}<section class="section"><div class="container" style="max-width:500px"><div class="form-card"><h2>Update password</h2><form id="password-update-form"><div class="field"><label>New password *</label><input name="password" type="password" required minlength="8" autocomplete="new-password"></div><div class="field"><label>Confirm new password *</label><input name="confirm_password" type="password" required minlength="8" autocomplete="new-password"></div><p id="password-message" class="form-message" aria-live="polite"></p><button class="btn" type="submit">Save new password</button></form></div></div></section>`};
  return {title:"Reset password | JRT Mart",html:`${pageHero("Reset your password","Enter your account email and we will send a secure password reset link.")}<section class="section"><div class="container" style="max-width:500px"><div class="form-card"><h2>Password recovery</h2><form id="password-request-form"><div class="field"><label>Email address *</label><input name="email" type="email" required autocomplete="email"></div><p id="password-message" class="form-message" aria-live="polite"></p><button class="btn" type="submit">Send reset link</button></form><p class="muted" style="font-size:13px;margin-bottom:0">Remembered your password? ${routeLink("/login","Return to sign in","text-link")}</p></div></div></section>`};
}
async function myOrdersPage() {
  if(!state.user)return {title:"My orders | JRT Mart",html:`${pageHero("My orders","Sign in to review orders placed with your customer account.")}<section class="section"><div class="container"><div class="empty-state"><div class="empty-icon">🔐</div><h3>Sign in to view your orders</h3><a class="btn" href="/login" data-nav>Sign in</a></div></div></section>`};
  if(!supabase)return {title:"My orders | JRT Mart",html:`${pageHero("My orders","Account services are not configured.")}<div class="container"><div class="notice">Supabase is not configured.</div></div>`};
  const {data,error}=await supabase.from("orders").select("id,order_number,status,payment_status,payment_method,total,created_at,order_items(id,product_name,quantity,unit_price)").eq("customer_id",state.user.id).order("created_at",{ascending:false}).limit(100);
  if(error)return {title:"My orders | JRT Mart",html:`${pageHero("My orders","Your signed-in orders.")}<section class="section"><div class="container"><div class="danger">Could not load orders: ${esc(error.message)}</div></div></section>`};
  const rows=(data||[]).map(o=>`<tr><td><b>${esc(o.order_number)}</b><br><small class="muted">${new Date(o.created_at).toLocaleDateString(LOCALE)}</small></td><td>${(o.order_items||[]).map(i=>`${esc(i.product_name)} × ${i.quantity}`).join("<br>")}</td><td>${esc(o.status)}</td><td>${esc(o.payment_status)}</td><td><b>${money(o.total)}</b>${o.payment_method==="razorpay"&&o.payment_status!=="paid"?`<br><button class="btn small" data-action="retry-payment" data-order="${esc(o.id)}" data-order-number="${esc(o.order_number)}">Pay now</button>`:""}</td></tr>`).join("");
  return {title:"My orders | JRT Mart",html:`${pageHero("My orders","Order requests placed while signed in.")}<section class="section"><div class="container">${rows?`<div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>Order</th><th>Items</th><th>Status</th><th>Payment</th><th>Total</th></tr></thead><tbody>${rows}</tbody></table></div>`:`<div class="empty-state"><div class="empty-icon">📦</div><h3>No orders yet</h3><p>When you place an order while signed in, it will appear here.</p><a class="btn" href="/products" data-nav>Start shopping</a></div>`}</div></section>`};
}

async function adminPage() {
  if(state.user&&state.isAdmin===null)await checkAdmin();
  if(!state.user||!state.isAdmin)return {title:"Store admin | JRT Mart",html:`${pageHero("Store administration","Authorised JRT Mart staff only.")}<section class="section"><div class="container admin-login-wrap"><a class="brand" href="/" data-nav><span class="brand-mark">J</span><span class="brand-copy">JRT <b>MART</b><small>STORE ADMIN</small></span></a><div class="form-card"><h2>Admin sign in</h2><p class="muted" style="font-size:12px">Use the email/password of an account explicitly added to the Supabase <code>admin_users</code> table. Customer accounts do not receive admin access.</p><form id="admin-login-form"><div class="field"><label>Email address *</label><input name="email" type="email" required autocomplete="username"></div><div class="field"><label>Password *</label><input name="password" type="password" required autocomplete="current-password"></div><p class="form-message" id="admin-login-message" aria-live="polite">${state.adminError?esc(state.adminError):""}</p><button type="submit" class="btn">Sign in to admin</button></form><p class="muted" style="font-size:13px">${routeLink("/reset-password","Forgot your password?","text-link")}</p></div></div></section>`};
  let dataHTML="";
  if(state.adminTab==="products"){
    const {data,error}=await supabase.from("products").select("*").order("created_at",{ascending:false}).limit(300);state.adminProducts=data||[];
    dataHTML=error?`<div class="danger">${esc(error.message)}</div>`:adminProductsHTML(data||[]);
  } else if(state.adminTab==="orders"){
    const {data,error}=await supabase.from("orders").select("*,order_items(*)").order("created_at",{ascending:false}).limit(250);state.adminOrders=data||[];
    dataHTML=error?`<div class="danger">${esc(error.message)}</div>`:adminOrdersHTML(data||[]);
  } else if(state.adminTab==="inquiries"){
    const {data,error}=await supabase.from("inquiries").select("*").order("created_at",{ascending:false}).limit(250);state.adminInquiries=data||[];
    dataHTML=error?`<div class="danger">${esc(error.message)}</div>`:adminInquiriesHTML(data||[]);
  } else if(state.adminTab==="content"){
    await loadContent();dataHTML=adminContentHTML();
  } else {
    const [{count:productCount},{count:orderCount},{count:inquiryCount}] = await Promise.all([
      supabase.from("products").select("id",{count:"exact",head:true}),
      supabase.from("orders").select("id",{count:"exact",head:true}),
      supabase.from("inquiries").select("id",{count:"exact",head:true})
    ]);
    dataHTML=`<div class="admin-stats"><div class="stat-card"><small>Products</small><strong>${Number(productCount||0)}</strong></div><div class="stat-card"><small>Orders</small><strong>${Number(orderCount||0)}</strong></div><div class="stat-card"><small>Enquiries</small><strong>${Number(inquiryCount||0)}</strong></div></div><div class="info-card" style="padding:20px"><h3 style="margin-top:0">Store is ready for content</h3><p class="muted">Add your products, upload product photographs, publish catalogue listings, review orders and respond to enquiries from the administration sections.</p><div class="hero-actions"><button class="btn" data-admin-tab="products">Manage products</button><button class="btn secondary" data-admin-tab="orders">Review orders</button></div></div>`;
  }
  return {title:"Store admin | JRT Mart",html:`${pageHero("JRT Mart administration",`Signed in as ${state.user.email||"admin"}.`)}<section class="section"><div class="container"><div class="admin-shell"><aside class="admin-side"><h3>STORE ADMIN</h3>${[["overview","Overview"],["products","Products"],["orders","Orders"],["inquiries","Enquiries"],["content","Site content"]].map(([id,label])=>`<button class="${state.adminTab===id?"active":""}" data-admin-tab="${id}">${label}</button>`).join("")}<button data-action="sign-out">Sign out</button></aside><div class="admin-main"><div class="admin-top"><h2>${esc(state.adminTab.charAt(0).toUpperCase()+state.adminTab.slice(1))}</h2><span class="muted" style="font-size:12px">Admin access verified</span></div>${dataHTML}</div></div></div></section>`};
}
function adminProductsHTML(products) {
  return `<div class="admin-product-form"><h3>${state.editingProduct?"Edit product":"Add a new product"}</h3><form id="admin-product-form"><input type="hidden" name="id" value="${esc(state.editingProduct?.id||"")}"><div class="field-grid"><div class="field"><label>Product name *</label><input name="name" required value="${esc(state.editingProduct?.name||"")}"></div><div class="field"><label>Category *</label><select name="category" required><option value="">Choose category</option>${groups.map(g=>`<optgroup label="${esc(g.name)}">${categoryRows.filter(c=>c.group===g.id).map(c=>`<option ${state.editingProduct?.category===c.name?"selected":""}>${esc(c.name)}</option>`).join("")}</optgroup>`).join("")}</select></div><div class="field"><label>SKU</label><input name="sku" value="${esc(state.editingProduct?.sku||"")}"></div><div class="field"><label>Price (₹) *</label><input name="price" type="number" min="0" step="0.01" required value="${esc(state.editingProduct?.price??"")}"></div><div class="field"><label>Compare-at price (₹)</label><input name="compare_at_price" type="number" min="0" step="0.01" value="${esc(state.editingProduct?.compare_at_price??"")}"></div><div class="field"><label>Minimum order quantity *</label><input name="moq" type="number" min="1" step="1" required value="${esc(state.editingProduct?.moq||1)}"></div><div class="field"><label>Available stock (blank = not tracked)</label><input name="stock_qty" type="number" min="0" step="1" value="${esc(state.editingProduct?.stock_qty??"")}"></div><div class="field"><label>Product image</label><input name="image" type="file" accept="image/png,image/jpeg,image/webp"></div><div class="field full"><label>Or image URL</label><input name="image_url" type="url" placeholder="https://…" value="${esc(state.editingProduct?.image_url||"")}"></div><div class="field full"><label>Short description</label><input name="short_description" maxlength="180" value="${esc(state.editingProduct?.short_description||"")}"></div><div class="field full"><label>Full description</label><textarea name="description">${esc(state.editingProduct?.description||"")}</textarea></div></div><label class="radio-line"><input type="checkbox" name="featured" ${state.editingProduct?.featured?"checked":""}><span><b>Feature this product on the homepage</b></span></label><label class="radio-line"><input type="checkbox" name="is_active" ${state.editingProduct?.is_active!==false?"checked":""}><span><b>Publish product in the public catalogue</b></span></label><div class="admin-actions"><button class="btn" type="submit">${state.editingProduct?"Save changes":"Create product"}</button>${state.editingProduct?`<button class="btn secondary" type="button" data-action="cancel-edit">Cancel edit</button>`:""}</div><p class="form-message" id="admin-product-message" aria-live="polite"></p></form></div><h3 class="admin-panel-title">Current products (${products.length})</h3>${products.length?`<div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>Product</th><th>Price</th><th>MOQ / Stock</th><th>State</th><th>Actions</th></tr></thead><tbody>${products.map(p=>`<tr><td><b>${esc(p.name)}</b><br><small class="muted">${esc(p.category||"")} · ${esc(p.sku||"No SKU")}</small></td><td>${money(p.price)}</td><td>${Number(p.moq||1)} / ${p.stock_qty===null||p.stock_qty===undefined?"Not tracked":Number(p.stock_qty)}</td><td>${p.is_active?"Published":"Draft"}</td><td><div class="admin-actions"><button class="btn secondary small" data-edit-product="${esc(p.id)}">Edit</button><button class="btn small" style="background:#9f2924" data-delete-product="${esc(p.id)}">Delete</button></div></td></tr>`).join("")}</tbody></table></div>`:`<div class="empty-state"><div class="empty-icon">📦</div><h3>No products added</h3><p>Add the first real catalogue product using the form above.</p></div>`}`;
}
function adminOrdersHTML(orders) {
  const statuses=["pending_confirmation","confirmed","processing","shipped","delivered","cancelled"];
  const paymentStatuses=["awaiting_confirmation","awaiting_payment","paid","failed","refunded"];
  return orders.length?`<div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>Order / date</th><th>Customer & delivery</th><th>Items</th><th>Total</th><th>Payment</th><th>Order status</th></tr></thead><tbody>${orders.map(o=>{
    const a=o.shipping_address||{};
    const address=[a.line1,a.line2,a.city,a.state,a.pincode,a.country].filter(Boolean).map(esc).join(", ");
    return `<tr><td><b>${esc(o.order_number)}</b><br><small class="muted">${new Date(o.created_at).toLocaleString(LOCALE)}</small></td><td><b>${esc(o.customer_name)}</b><br>${esc(o.customer_email)}<br>${esc(o.customer_phone||"")}<br><small class="muted">${address||"No delivery address"}</small></td><td>${(o.order_items||[]).map(i=>`${esc(i.product_name)} × ${Number(i.quantity)}`).join("<br>")}</td><td><b>${money(o.total)}</b></td><td><small>${esc(o.payment_method)}</small><select aria-label="Payment status for ${esc(o.order_number)}" data-payment-status="${esc(o.id)}">${paymentStatuses.map(s=>`<option value="${s}" ${o.payment_status===s?"selected":""}>${s.replaceAll("_"," ")}</option>`).join("")}</select></td><td><select aria-label="Order status for ${esc(o.order_number)}" data-order-status="${esc(o.id)}">${statuses.map(s=>`<option value="${s}" ${o.status===s?"selected":""}>${s.replaceAll("_"," ")}</option>`).join("")}</select></td></tr>`;
  }).join("")}</tbody></table></div>`:`<div class="empty-state"><div class="empty-icon">🧾</div><h3>No orders yet</h3><p>Customer order requests will appear here.</p></div>`;
}
function adminInquiriesHTML(items) {
  return items.length?`<div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>Customer</th><th>Requirement</th><th>Contact</th><th>Date</th><th>State</th></tr></thead><tbody>${items.map(x=>`<tr><td><b>${esc(x.name)}</b><br>${esc(x.company||"")}</td><td>${esc(x.product)}<br>Qty: ${esc(x.quantity||"—")}<br>${esc(x.message||"")}</td><td>${esc(x.email)}<br>${esc(x.phone||"")}</td><td>${new Date(x.created_at).toLocaleDateString(LOCALE)}</td><td><select data-inquiry-status="${esc(x.id)}"><option value="new" ${x.status==="new"?"selected":""}>New</option><option value="contacted" ${x.status==="contacted"?"selected":""}>Contacted</option><option value="closed" ${x.status==="closed"?"selected":""}>Closed</option></select></td></tr>`).join("")}</tbody></table></div>`:`<div class="empty-state"><div class="empty-icon">✉️</div><h3>No enquiries yet</h3><p>Website quote and contact forms will appear here.</p></div>`;
}
function adminContentHTML() {
  return `<div class="form-card"><form id="admin-content-form"><div class="field"><label>Homepage hero heading</label><input name="hero_title" value="${esc(state.content.hero_title||"Everything your business needs. One supply partner.")}"></div><div class="field"><label>Homepage hero supporting text</label><textarea name="hero_description">${esc(state.content.hero_description||"Shop ready-to-ship products, source in bulk, or build a custom order with JRT Mart.")}</textarea></div><div class="field"><label>Announcement bar (leave blank to hide)</label><input name="announcement" value="${esc(state.content.announcement||"")}"></div><p id="admin-content-message" class="form-message" aria-live="polite"></p><button class="btn" type="submit">Save homepage content</button></form></div>`;
}


function cmsPageForPath(path) {
  const slug=String(path||"").replace(/^\/+|\/+$/g,"")||"home";
  const page=state.cmsPages.find(x=>x.slug===slug&&x.is_published);
  if(!page)return null;
  const sections=(state.allCmsSections||[]).filter(x=>x.page_slug===slug&&x.is_visible).sort((a,b)=>Number(a.sort_order)-Number(b.sort_order));
  const html=sections.length?sections.map(cmsSectionHTML).join(""):`${pageHero(page.title,page.meta_description||"")}<section class="section"><div class="container"><div class="empty-state"><h3>Page content is ready to be added</h3><p>This page is published. Store administrators can add its sections in the admin console.</p></div></div></section>`;
  return {title:page.meta_title||`${page.title} | JRT Mart`,description:page.meta_description||"",html};
}

async function buildPage(url) {
  const cleanPath=url.pathname.replace(/\/+$/,"");
  const path=cleanPath ? `${cleanPath}/` : "/";
  if(path==="/")return homePage();
  if(path==="/products/"||path==="/search/")return catalogPage(url);
  if(path==="/cart/") {await loadProducts();return cartPage();}
  if(path==="/checkout/") {await loadProducts();return checkoutPage();}
  if(path==="/order-confirmation/")return confirmationPage(url);
  if(path==="/get-quote/")return quotePage(url);
  const managedPage=cmsPageForPath(path);if(managedPage)return managedPage;
  if(path==="/about-us/")return aboutPage();
  if(path==="/contract-manufacturing/")return manufacturingPage();
  if(path==="/contact-us/")return contactPage();
  if(path==="/login/"||path==="/my-account/")return authPage();
  if(path==="/register/")return registerPage();
  if(path==="/reset-password/")return resetPasswordPage();
  if(path==="/my-orders/")return myOrdersPage();
  if(path==="/admin/"){location.replace("/admin.html");return {title:"Opening store administration | JRT Mart",html:`<section class="section"><div class="container"><p>Opening secure admin… <a href="/admin.html">Continue</a></p></div></section>`};}
  const policy=policyPage(path);if(policy)return policy;
  const info=informationPage(path);if(info)return info;
  if(path==="/user-agreement/")return policyPage("/terms-and-conditions");
  if(path==="/bags/")return catalogPage(new URL(url.origin+"/products?group=bags"));
  if(path==="/career/")return standardPage("Careers","Explore opportunities to work with the JRT Mart team.",`<p class="muted">Career opportunities and openings are shared directly by the JRT Mart team. For current vacancies, internships or partnership opportunities, send an enquiry with your profile and area of interest.</p><a class="btn" href="/contact-us" data-nav>Contact JRT Mart</a>`);
  if(path==="/experience-centres/")return standardPage("Experience centres","Arrange a product sample review or discuss a visit with the JRT Mart team.",`<p class="muted">Product samples and visit arrangements depend on the product, location and availability. Contact the team with the products you would like to review and your preferred date. The team will confirm whether an in-person sample review or experience-centre visit can be arranged.</p><a class="btn" href="/get-quote" data-nav>Arrange a sample review</a>`);
  if(path==="/launch-your-store/")return standardPage("Launch your store","Discuss a branded online store using a connected product catalogue and fulfilment workflow.",`<p class="muted">JRT Mart's uploaded site describes a retailing/store-launch offering. The scope, domain, catalogue, payment gateway, integrations and commercial terms should be confirmed with the team before a launch commitment is made.</p><div class="notice">A store-launch project can connect its catalogue, checkout, customer accounts and payment gateway after the domain, commercial terms and server-side payment credentials are provisioned and tested.</div><a class="btn" href="/get-quote" data-nav>Enquire about store launch</a>`);
  if(path==="/clients/"||path.startsWith("/clients/"))return standardPage("Client showcase","A page for JRT Mart's approved client stories and project references.",`<p class="muted">The uploaded site contains a client-logo strip. Client names, logos and case-study permissions should be confirmed by JRT Mart before they are republished on this new storefront. Contact the team for relevant business references.</p><a class="btn" href="/contact-us" data-nav>Ask about business supply</a>`);
  if(path==="/sitemap/")return standardPage("Sitemap","Browse the main pages and all product categories available on JRT Mart.",`<div class="feature-grid" style="margin-bottom:24px">${[["Home","/"],["All products","/products"],["Bulk quote","/get-quote"],["About","/about-us"],["Contract manufacturing","/contract-manufacturing"],["Contact","/contact-us"],["Cart","/cart"],["Account","/my-account"],["Admin","/admin.html"]].map(([label,path])=>`<article class="feature-card"><a class="text-link" href="${path}" ${path === "/admin.html" ? "" : "data-nav"}>${label} →</a></article>`).join("")}</div><h2 class="admin-panel-title">All product categories</h2><div class="category-grid">${categoryRows.map(c=>routeLink(categoryPath(c),`<span class="cat-icon">${groups.find(g=>g.id===c.group)?.icon||"📦"}</span><b>${esc(c.name)}</b><span class="arrow">↗</span>`,"category-card")).join("")}</div>`);
  if(path==="/bengaluru-karnataka-india-ec01/")return informationPage("/helpdesk");
  if(path.startsWith("/product/"))return productPage(decodeURIComponent(path.slice("/product/".length).replace(/\/$/,"")));
  if(path.startsWith("/category/")){
    const c=findCategory(path.slice("/category/".length).replace(/\/$/,""));
    if(c){url.searchParams.set("category",c.slug);return catalogPage(url);}
  }
  const legacy=findCategory(path.slice(1).replace(/\/$/,""));if(legacy){url.searchParams.set("category",legacy.slug);return catalogPage(url);}
  return {title:"Page not found | JRT Mart",html:`${pageHero("Page not found","The page you are looking for may have moved.")}<section class="section"><div class="container"><div class="empty-state"><div class="empty-icon">🧭</div><h3>Let's get you back on track</h3><p>Browse the catalogue or return to the home page.</p><div class="hero-actions" style="justify-content:center"><a class="btn" href="/products" data-nav>Browse products</a><a class="btn secondary" href="/" data-nav>Home</a></div></div></div></section>`};
}
async function render() {
  const id=++state.renderId;const url=new URL(location.href);
  try {
    const page=await buildPage(url);if(id!==state.renderId)return;
    app.innerHTML=shell(page.html);
    document.title=page.title||"JRT Mart";
    const meta=document.querySelector('meta[name="description"]');if(meta&&page.description)meta.content=page.description;
    updateHeaderCartCount();
  } catch(e) {
    console.error(e);if(id!==state.renderId)return;
    app.innerHTML=shell(`${pageHero("Something went wrong","Please refresh the page or return to the catalogue.")}<section class="section"><div class="container"><div class="danger">${esc(e.message||"Unexpected application error")}</div></div></section>`);
  }
}
function navigate(path) {
  state.mobileMenuOpen=false;state.megaOpen=false;
  history.pushState({},"",path);window.scrollTo({top:0,behavior:"auto"});render();
}

// Navigation and button actions
app.addEventListener("click",async e=>{
  const nav=e.target.closest("a[data-nav]");
  if(nav&&!e.metaKey&&!e.ctrlKey&&!e.shiftKey&&nav.target!=="_blank") {e.preventDefault();navigate(nav.getAttribute("href"));return;}
  const btn=e.target.closest("button,[data-action]");if(!btn)return;
  const action=btn.dataset.action;
  if(action==="mobile-toggle"){state.mobileMenuOpen=!state.mobileMenuOpen;state.megaOpen=false;render();return;}
  if(action==="mega-toggle"){state.megaOpen=!state.megaOpen;state.mobileMenuOpen=false;render();return;}
  if(action==="add-cart"){addToCart(btn.dataset.product,Number(btn.dataset.qty||1));return;}
  if(action==="add-detail-cart"){addToCart(btn.dataset.product,Number(document.getElementById("detail-qty")?.value||1));return;}
  if(action==="cart-qty"){changeCart(btn.dataset.product,Number(btn.dataset.delta));return;}
  if(action==="cart-remove"){removeCart(btn.dataset.product);return;}
  if(action==="detail-qty"){const input=document.getElementById("detail-qty");if(input){const min=Number(input.min||1);input.value=Math.max(min,Number(input.value||min)+Number(btn.dataset.delta||0));}return;}
  if(action==="gallery-image"){const image=app.querySelector(".product-main-image");if(image){image.src=safeImage(btn.dataset.image);app.querySelectorAll(".product-thumb").forEach(x=>x.classList.toggle("active",x===btn));}return;}
  if(action==="retry-payment"){await payExistingOrder(btn.dataset.order,btn.dataset.orderNumber);return;}
  if(action==="sign-out"){if(supabase)await supabase.auth.signOut();state.user=null;state.isAdmin=false;toast("You have signed out.","ok");navigate("/");return;}
  if(btn.dataset.adminTab){state.adminTab=btn.dataset.adminTab;state.editingProduct=null;render();return;}
  if(action==="cancel-edit"){state.editingProduct=null;render();return;}
  if(btn.dataset.editProduct){state.editingProduct=state.adminProducts.find(p=>String(p.id)===btn.dataset.editProduct)||null;render();return;}
  if(btn.dataset.deleteProduct){if(!confirm("Delete this product from the catalogue?"))return;const {error}=await supabase.from("products").delete().eq("id",btn.dataset.deleteProduct);if(error)toast(error.message,"error");else{state.productsLoadedAt=0;toast("Product deleted.","ok");render();}return;}
});
window.addEventListener("popstate",()=>{state.mobileMenuOpen=false;state.megaOpen=false;render();});
app.addEventListener("submit",async e=>{
  const form=e.target;if(!(form instanceof HTMLFormElement))return;
  if(form.id==="header-search"){
    e.preventDefault();const f=new FormData(form);const q=String(f.get("q")||"").trim();const c=String(f.get("category")||"");navigate(`/products?${new URLSearchParams({...(q?{q}:{}),...(c?{category:c}:{})})}`);return;
  }
  if(form.id==="customer-login-form"){
    e.preventDefault();const f=new FormData(form);const message=document.getElementById("auth-message");message.textContent="Signing in…";
    if(!supabase){message.textContent="Store authentication is not configured.";return;}
    const {data,error}=await supabase.auth.signInWithPassword({email:String(f.get("email")).trim(),password:String(f.get("password"))});
    if(error){message.textContent=error.message;return;}state.user=data.user;toast("Welcome back.","ok");const next=new URLSearchParams(location.search).get("next");navigate(next&&next.startsWith("/")&&!next.startsWith("//")?next:"/my-account");return;
  }
  if(form.id==="password-request-form"){
    e.preventDefault();const f=new FormData(form);const message=document.getElementById("password-message");message.textContent="Sending reset link…";
    if(!supabase){message.textContent="Store authentication is not configured.";return;}
    const email=String(f.get("email")||"").trim();const {error}=await supabase.auth.resetPasswordForEmail(email,{redirectTo:`${location.origin}/reset-password`});
    message.textContent=error?error.message:"If an account exists for that email, a password reset link has been sent. Check your inbox.";return;
  }
  if(form.id==="password-update-form"){
    e.preventDefault();const f=new FormData(form);const message=document.getElementById("password-message");const password=String(f.get("password")||"");
    if(password.length<8||password!==String(f.get("confirm_password")||"")){message.textContent="Passwords must match and contain at least 8 characters.";return;}
    if(!supabase||!state.user){message.textContent="Your password reset session has expired. Request a new link.";return;}
    message.textContent="Updating password…";const {error}=await supabase.auth.updateUser({password});
    if(error){message.textContent=error.message;return;}toast("Password updated successfully.","ok");navigate("/my-account");return;
  }
  if(form.id==="customer-register-form"){
    e.preventDefault();const f=new FormData(form);const message=document.getElementById("auth-message");message.textContent="Creating your account…";
    if(!supabase){message.textContent="Store authentication is not configured.";return;}
    const {data,error}=await supabase.auth.signUp({email:String(f.get("email")).trim(),password:String(f.get("password")),options:{data:{full_name:String(f.get("name")||"").trim()},emailRedirectTo:`${location.origin}${(()=>{const n=new URLSearchParams(location.search).get("next");return n&&n.startsWith("/")&&!n.startsWith("//")?n:"/my-account";})()}`}});
    if(error){message.textContent=error.message;return;}message.textContent=data.session?"Account created. You are signed in.":"Account created. Check your email to confirm your address, then sign in.";return;
  }
  if(form.id==="admin-login-form"){
    e.preventDefault();const f=new FormData(form);const message=document.getElementById("admin-login-message");message.textContent="Checking admin access…";
    if(!supabase){message.textContent="Supabase is not configured.";return;}
    const {data,error}=await supabase.auth.signInWithPassword({email:String(f.get("email")).trim(),password:String(f.get("password"))});
    if(error){message.textContent=error.message;return;}state.user=data.user;
    const ok=await checkAdmin();if(!ok){await supabase.auth.signOut();state.user=null;message.textContent="This account is not authorised for store administration. Add its Auth user ID to public.admin_users in Supabase.";return;}
    state.adminTab="overview";toast("Admin access verified.","ok");render();return;
  }
  if(form.id==="quote-form"){
    e.preventDefault();await submitInquiry(form);return;
  }
  if(form.id==="checkout-form"){
    e.preventDefault();await submitOrder(form);return;
  }
  if(form.id==="admin-product-form"){
    e.preventDefault();await saveProduct(form);return;
  }
  if(form.id==="admin-content-form"){
    e.preventDefault();await saveContent(form);return;
  }
});
app.addEventListener("change",async e=>{
  const el=e.target;
  if(el.id==="catalog-sort"){
    const url=new URL(location.href);url.searchParams.set("sort",el.value);navigate(url.pathname+url.search);return;
  }
  if(el.matches("[data-order-status]")){
    const {error}=await supabase.from("orders").update({status:el.value,updated_at:new Date().toISOString()}).eq("id",el.dataset.orderStatus);
    if(error)toast(error.message,"error");else toast("Order status updated.","ok");return;
  }
  if(el.matches("[data-payment-status]")){
    const {error}=await supabase.from("orders").update({payment_status:el.value,updated_at:new Date().toISOString()}).eq("id",el.dataset.paymentStatus);
    if(error)toast(error.message,"error");else toast("Payment status updated. Only mark an order paid after verifying cleared funds.","ok");return;
  }
  if(el.matches("[data-inquiry-status]")){
    const {error}=await supabase.from("inquiries").update({status:el.value}).eq("id",el.dataset.inquiryStatus);
    if(error)toast(error.message,"error");else toast("Enquiry status updated.","ok");return;
  }
});

async function submitInquiry(form) {
  const msg=document.getElementById("quote-message");msg.textContent="Sending enquiry…";
  if(!supabase){msg.textContent="The store database is not configured. Please try again later.";return;}
  const f=new FormData(form);const payload={name:String(f.get("name")||"").trim(),company:String(f.get("company")||"").trim(),email:String(f.get("email")||"").trim(),phone:String(f.get("phone")||"").trim(),product:String(f.get("product")||"").trim(),quantity:Number(f.get("quantity")||0)||null,message:String(f.get("message")||"").trim(),status:"new"};
  try {const {error}=await supabase.from("inquiries").insert(payload);if(error)throw error;form.reset();msg.textContent="Thank you. Your enquiry has been received.";toast("Enquiry sent successfully.","ok");}
  catch(e){msg.textContent=`Could not send the enquiry: ${e.message}`;}
}
let razorpayScriptPromise=null;
function loadRazorpayCheckout(){
  if(window.Razorpay)return Promise.resolve();
  if(razorpayScriptPromise)return razorpayScriptPromise;
  razorpayScriptPromise=new Promise((resolve,reject)=>{const script=document.createElement("script");script.src="https://checkout.razorpay.com/v1/checkout.js";script.async=true;script.onload=()=>resolve();script.onerror=()=>reject(new Error("Could not load the Razorpay checkout library. Check the network and retry."));document.head.appendChild(script);});
  return razorpayScriptPromise;
}
async function payExistingOrder(orderId,orderNumber=""){
  if(!supabase||!state.user){toast("Sign in with the account used for this order before paying online.","error");return;}
  try{
    toast("Preparing secure payment…");
    const {data,error}=await supabase.functions.invoke("razorpay-create-order",{body:{order_id:orderId}});
    if(error)throw error;if(!data?.razorpay_order_id||!data?.key_id)throw new Error(data?.error||"The payment gateway did not return a valid order.");
    await loadRazorpayCheckout();
    const options={key:data.key_id,amount:data.amount,currency:data.currency,name:data.name||storeValue("store_name","JRT Mart"),description:data.description||`Order ${orderNumber||data.order_number||""}`,order_id:data.razorpay_order_id,prefill:data.prefill||{},theme:{color:"#d71920"},modal:{ondismiss:()=>toast("Payment window closed. Your order remains available in My Orders.","error")},
      handler:async response=>{
        try{
          const {data:verification,error:verifyError}=await supabase.functions.invoke("razorpay-verify-payment",{body:{order_id:orderId,razorpay_order_id:response.razorpay_order_id,razorpay_payment_id:response.razorpay_payment_id,razorpay_signature:response.razorpay_signature}});
          if(verifyError)throw verifyError;if(!verification?.paid){toast(verification?.message||"Payment is not captured yet. Your order will update when the verified webhook arrives.","error");return;}
          state.lastOrder={...(state.lastOrder||{}),order_id:orderId,order_number:verification.order_number||orderNumber,payment_method:"razorpay"};navigate(`/order-confirmation?order=${encodeURIComponent(verification.order_number||orderNumber)}&paid=1`);
        }catch(err){toast(`Payment submitted but verification is pending: ${err.message||"Check My Orders before retrying."}`,"error");}
      }};
    const checkout=new window.Razorpay(options);
    checkout.on("payment.failed",response=>{const description=response?.error?.description||"Payment was not completed.";toast(description,"error");});
    checkout.open();
  }catch(error){toast(error.message||"Unable to start payment. Your order remains saved in My Orders.","error");}
}
async function submitOrder(form) {
  const msg=document.getElementById("checkout-message");const items=getCartItems();
  if(!supabase){msg.textContent="The store database is not configured.";return;}
  if(!items.length){msg.textContent="Your cart is empty.";return;}
  const f=new FormData(form);const method=String(f.get("payment_method")||"pay_after_confirmation");
  if(method==="razorpay"&&!state.user){msg.textContent="Sign in or create a customer account before using secure online payment.";return;}
  if(method==="razorpay"&&(!state.paymentSettings?.gateway_enabled||state.paymentSettings?.provider!=="razorpay")){msg.textContent="Online payment is not enabled by the store administrator. Choose an offline option.";return;}
  msg.textContent="Validating product prices, quantities and stock…";
  const payload={p_customer_name:String(f.get("name")||"").trim(),p_customer_email:String(f.get("email")||"").trim(),p_customer_phone:String(f.get("phone")||"").trim(),p_company:String(f.get("company")||"").trim(),p_address:{line1:String(f.get("address")||"").trim(),city:String(f.get("city")||"").trim(),state:String(f.get("state")||"").trim(),pincode:String(f.get("pincode")||"").trim(),country:String(f.get("country")||"India").trim()},p_notes:String(f.get("notes")||"").trim(),p_payment_method:method,p_items:items.map(x=>({product_id:x.product.id,quantity:x.qty}))};
  try {
    const {data,error}=await supabase.rpc("create_order",payload);if(error)throw error;
    const result=Array.isArray(data)?data[0]:data;if(!result?.order_number||!result?.order_id)throw new Error("Order was submitted but the confirmation reference was not returned. Contact support before placing it again.");
    state.lastOrder={...result,payment_method:method};state.cart=[];writeCart();
    if(method==="razorpay"){
      navigate(`/order-confirmation?order=${encodeURIComponent(result.order_number)}`);
      await payExistingOrder(result.order_id,result.order_number);
    } else navigate(`/order-confirmation?order=${encodeURIComponent(result.order_number)}`);
  } catch(e) {msg.textContent=e.message||"Could not place the order request.";}
}

async function uploadProductImage(file) {
  if(!file)return null;
  if(!file.type.startsWith("image/"))throw new Error("Choose an image file.");
  if(file.size>6*1024*1024)throw new Error("Image must be 6 MB or smaller.");
  const ext=(file.name.split(".").pop()||"jpg").toLowerCase().replace(/[^a-z0-9]/g,"");
  const path=`products/${crypto.randomUUID()}.${ext}`;
  const {error}=await supabase.storage.from("jrt-product-images").upload(path,file,{upsert:false,contentType:file.type});if(error)throw error;
  return supabase.storage.from("jrt-product-images").getPublicUrl(path).data.publicUrl;
}
async function saveProduct(form) {
  const msg=document.getElementById("admin-product-message");msg.textContent="Saving product…";
  if(!state.isAdmin){msg.textContent="Admin sign-in required.";return;}
  const f=new FormData(form);const name=String(f.get("name")||"").trim();const category=String(f.get("category")||"").trim();
  const price=Number(f.get("price"));const moq=Math.max(1,Math.floor(Number(f.get("moq")||1)));const rawStock=String(f.get("stock_qty")||"").trim();const stock=rawStock?Math.max(0,Math.floor(Number(rawStock))):null;
  if(!name||!category||!Number.isFinite(price)||price<0){msg.textContent="Enter a product name, category and valid price.";return;}
  try {
    const file=f.get("image");let imageUrl=String(f.get("image_url")||"").trim();if(file instanceof File&&file.size)imageUrl=await uploadProductImage(file);
    const payload={name,slug:slugify(name),category,sku:String(f.get("sku")||"").trim()||null,price,compare_at_price:Number(f.get("compare_at_price")||0)||null,moq,stock_qty:stock,image_url:imageUrl||null,short_description:String(f.get("short_description")||"").trim(),description:String(f.get("description")||"").trim(),featured:f.get("featured")==="on",is_active:f.get("is_active")==="on",updated_at:new Date().toISOString()};
    const id=String(f.get("id")||"");const result=id?await supabase.from("products").update(payload).eq("id",id):await supabase.from("products").insert(payload);
    if(result.error)throw result.error;state.productsLoadedAt=0;state.editingProduct=null;state.adminTab="products";toast("Product saved.","ok");render();
  } catch(e){msg.textContent=e.message||"Could not save product.";}
}
async function saveContent(form) {
  const msg=document.getElementById("admin-content-message");msg.textContent="Saving…";const f=new FormData(form);
  const rows=["hero_title","hero_description","announcement"].map(key=>({key,value:String(f.get(key)||"").trim(),updated_at:new Date().toISOString()}));
  const {error}=await supabase.from("site_content").upsert(rows,{onConflict:"key"});if(error){msg.textContent=error.message;return;}
  state.content=Object.fromEntries(rows.map(x=>[x.key,x.value]));toast("Homepage content saved.","ok");render();
}

init();
