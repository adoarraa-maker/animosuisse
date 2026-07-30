const STORE_EMAIL = 'Adoarraa@gmail.com';
const FORMSUBMIT_URL = `https://formsubmit.co/ajax/${STORE_EMAIL}`;
const CART_STORAGE_KEY = 'animosuisse-cart';

const OUT_OF_STOCK_PRODUCT_IDS = new Set();
const OUT_OF_STOCK_NAMES = [];

function isOutOfStockProduct(productId, productName) {
  if (productId != null && OUT_OF_STOCK_PRODUCT_IDS.has(String(productId))) return true;
  if (!productName) return false;
  return OUT_OF_STOCK_NAMES.some((name) => productName === name || productName.startsWith(name));
}

function purgeOutOfStockFromCart() {
  const before = cart.length;
  cart = cart.filter((item) => !isOutOfStockProduct(null, item.name));
  if (cart.length !== before) saveCart();
}

const products = {
  'brosse-vapeur': { name: 'Brosse Vapeur 3-en-1 pour Chats et Chiens', price: 24.9 },
  'gourde-multifonction': { name: 'Gourde Multifonction 3-en-1 (Eau, Croquettes & Sacs)', price: 19 },
  'accessoire-chien-1': { name: 'Laisse Mains Libres avec Sac Banane (Poche Téléphone)', price: 29.9 },
  'accessoire-chien-2': { name: 'Accessoire Chien - Modèle 2', price: 24.9 },
};

const STRIPE_PRODUCTS = {
  getzner: {
    unitPrice: 80,
    label: 'Bazin Getzner',
  },
  meches: {
    unitPrice: 5,
    label: 'Mèches X-Pression Ultra Braid',
  },
};

/**
 * URL de l'API qui crée la Checkout Session Stripe.
 * - Sur Netlify : chemins relatifs ci-dessous.
 * - Sinon : définir window.MARTEDER_STRIPE_CHECKOUT_URL avant main.js.
 */
const STRIPE_CHECKOUT_API_URL =
  window.MARTEDER_STRIPE_CHECKOUT_URL ||
  '/.netlify/functions/create-checkout-session';

const STRIPE_CHECKOUT_API_FALLBACKS = [
  STRIPE_CHECKOUT_API_URL,
  '/api/create-checkout-session',
  '/.netlify/functions/create-checkout-session',
].filter((url, index, list) => url && list.indexOf(url) === index);

const STRIPE_PENDING_KEY = 'marteder-stripe-pending';
const TWINT_NUMBER = '+41 76 842 96 83';
const WHATSAPP_ORDER = '41765761672';
const WHATSAPP_ORDER_MESSAGE = 'Bonjour, je souhaite commander un article sur AnimoSuisse';

const SHIPPING_OPTIONS = {
  suisse: {
    label: 'Suisse — Gratuit',
    shortLabel: 'Suisse',
    baseCost: 0,
  },
  europe: {
    label: 'Europe',
    shortLabel: 'Europe',
    baseCost: 9.9,
  },
  monde: {
    label: 'Reste du monde',
    shortLabel: 'Reste du monde',
    baseCost: 15,
  },
};

function formatMoneyCHF(amount) {
  return `${Number(amount).toFixed(2)} CHF`;
}

function getWhatsAppOrderUrl(message = WHATSAPP_ORDER_MESSAGE) {
  return `https://wa.me/${WHATSAPP_ORDER}?text=${encodeURIComponent(message)}`;
}

function openWhatsAppOrder(message = WHATSAPP_ORDER_MESSAGE) {
  window.open(getWhatsAppOrderUrl(message), '_blank', 'noopener,noreferrer');
}

function getShippingCostForZone(zoneKey, itemCount = 1) {
  const option = SHIPPING_OPTIONS[zoneKey] || SHIPPING_OPTIONS.suisse;
  if (option.freeFromItems && itemCount >= option.freeFromItems) return 0;
  return option.baseCost;
}

function buildProductWhatsAppMessage(card) {
  const name = card.dataset.productName || card.querySelector('.product-name')?.textContent?.trim() || 'Article AnimoSuisse';
  const price = parseFloat(card.dataset.productPrice || '0') || 0;
  const select = card.querySelector('[data-shipping-select]');
  const zoneKey = select?.value || 'suisse';
  const zone = SHIPPING_OPTIONS[zoneKey] || SHIPPING_OPTIONS.suisse;
  const shipping = getShippingCostForZone(zoneKey, 1);
  const total = price + shipping;
  const shippingText = shipping === 0 ? 'Gratuite (0.00 CHF)' : formatMoneyCHF(shipping);

  return [
    'Bonjour, je souhaite commander sur AnimoSuisse :',
    '',
    `Article : ${name} — ${formatMoneyCHF(price)}`,
    `Livraison : ${zone.shortLabel || zone.label} — ${shippingText}`,
    `Total : ${formatMoneyCHF(total)}`,
  ].join('\n');
}

function updateProductOrderSummary(card) {
  const summary = card.querySelector('[data-order-summary]');
  if (!summary) return;
  const price = parseFloat(card.dataset.productPrice || '0') || 0;
  const select = card.querySelector('[data-shipping-select]');
  const zoneKey = select?.value || 'suisse';
  const shipping = getShippingCostForZone(zoneKey, 1);
  const total = price + shipping;
  summary.innerHTML = `Produit ${formatMoneyCHF(price)} + livraison ${formatMoneyCHF(shipping)} = <strong>Total ${formatMoneyCHF(total)}</strong>`;
}

function initWhatsAppProductOrders() {
  document.querySelectorAll('.product-card[data-product-price]').forEach((card) => {
    updateProductOrderSummary(card);
    const select = card.querySelector('[data-shipping-select]');
    select?.addEventListener('change', () => updateProductOrderSummary(card));
  });

  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.btn-order-whatsapp');
    if (!btn) return;
    e.preventDefault();
    const card = btn.closest('.product-card');
    if (!card) return;
    openWhatsAppOrder(buildProductWhatsAppMessage(card));
  });
}

const TISSUS_SCHWER = 'images/tissus';

const schwerLocal = {
  violet: `${TISSUS_SCHWER}/violet.jpg`,
  'vert-clair': `${TISSUS_SCHWER}/vert-clair.jpg`,
  blanc: `${TISSUS_SCHWER}/blanc.jpg`,
  'beige-dore': `${TISSUS_SCHWER}/beige-dore.jpg`,
};

const schwerFallback = {
  violet: 'https://images.unsplash.com/photo-1607300110843-b3994a493d98?w=800&q=85',
  'vert-clair': 'https://images.unsplash.com/photo-1527167598984-8802d8028eea?w=800&q=85',
  blanc: 'https://images.unsplash.com/photo-1744502671977-702d9105533d?w=800&q=85',
  'beige-dore': 'https://images.unsplash.com/photo-1631663027473-3671aa7c4503?w=800&q=85',
};

const fabricProducts = {
  'marteder-getzner': {
    baseName: 'Création exclusive Marteder',
    price: 80,
    packNote: 'Par coupon de 5 yards',
    previewPrefix: 'Couleur sélectionnée',
    defaultVariant: '0',
    stripeProduct: 'getzner',
    variants: {
      '0': {
        label: "Vert d'eau / Vert menthe pastel",
        image: 'getzner-ab.jpg',
        alt: "Création exclusive Marteder — Vert d'eau / Vert menthe pastel",
      },
      '1': {
        label: 'Blanc éclatant / Argenté',
        image: 'getzner-blanc.png',
        alt: 'Création exclusive Marteder — Blanc éclatant / Argenté',
      },
      '2': {
        label: 'Bleu turquoise / Turquoise lumineux',
        image: 'getzner-turquoise.png',
        alt: 'Création exclusive Marteder — Bleu turquoise',
      },
      '3': {
        label: 'Vert sapin / Vert émeraude',
        image: 'getzner-vert-sapin.png',
        alt: 'Création exclusive Marteder — Vert sapin',
      },
      '4': {
        label: 'Rouge royal / Fuchsia',
        image: 'getzner-fuchsia.png',
        alt: 'Création exclusive Marteder — Rouge royal / Fuchsia',
      },
      '5': {
        label: 'Bleu nuit / Bleu roi',
        image: 'getzner-bleu-outremer.png',
        alt: 'Création exclusive Marteder — Bleu nuit',
      },
    },
  },
  1: {
    baseName: 'Bazin Riche Getzner Authentique (Schwer) – Lot de 5 Yards',
    price: 80,
    packNote: 'Vendu en lot de 5 yards',
    previewPrefix: 'Couleur sélectionnée',
    defaultVariant: 'beige-dore',
    stripeProduct: 'getzner',
    variants: {
      violet: {
        label: 'Getzner Schwer — Violet',
        image: schwerFallback.violet,
        localImage: schwerLocal.violet,
        alt: 'Bazin Getzner Schwer violet améthyste',
      },
      'vert-clair': {
        label: 'Getzner Schwer — Vert Clair',
        image: schwerFallback['vert-clair'],
        localImage: schwerLocal['vert-clair'],
        alt: 'Bazin Getzner Schwer vert clair',
      },
      blanc: {
        label: 'Getzner Schwer — Blanc',
        image: schwerFallback.blanc,
        localImage: schwerLocal.blanc,
        alt: 'Bazin Getzner Schwer blanc',
      },
      'beige-dore': {
        label: 'Getzner Schwer — Beige / Doré',
        image: schwerFallback['beige-dore'],
        localImage: schwerLocal['beige-dore'],
        alt: 'Bazin Getzner Schwer beige doré',
      },
    },
  },
  2: {
    baseName: 'Bazin riche doré brodé',
    price: 120,
    packNote: 'Vendu par lot de 3 pagnes',
    previewPrefix: 'Modèle sélectionné',
    defaultVariant: 'or-classique',
    variants: {
      'or-classique': {
        label: 'Or classique brodé',
        image: 'https://images.unsplash.com/photo-1707569620487-1fcff5e22f9f?w=800&q=85',
        alt: 'Bazin doré brodé or classique',
      },
      'or-rose': {
        label: 'Or rose brodé',
        image: 'https://images.unsplash.com/photo-1777148783728-510bbeeba075?w=800&q=85',
        alt: 'Bazin doré brodé or rose',
      },
    },
  },
  3: {
    baseName: 'Wax hollandais Vlisco',
    price: 45,
    packNote: 'Vendu par lot de 3 pagnes',
    previewPrefix: 'Motif sélectionné',
    defaultVariant: 'classique',
    variants: {
      classique: {
        label: 'Motif classique',
        image: 'https://images.unsplash.com/photo-1768212565426-58b089b6386d?w=800&q=85',
        alt: 'Wax hollandais Vlisco motif classique',
      },
      indigo: {
        label: 'Motif indigo',
        image: 'https://images.unsplash.com/photo-1630084305900-b297cff3a608?w=800&q=85',
        alt: 'Wax hollandais Vlisco motif indigo',
      },
      floral: {
        label: 'Motif floral',
        image: 'https://images.unsplash.com/photo-1768212565424-efa3a3852b81?w=800&q=85',
        alt: 'Wax hollandais Vlisco motif floral',
      },
    },
  },
  4: {
    baseName: 'Wax super wax motifs géométriques',
    price: 38,
    packNote: 'Vendu par lot de 3 pagnes',
    previewPrefix: 'Motif sélectionné',
    defaultVariant: 'geo-noir',
    variants: {
      'geo-noir': {
        label: 'Géométrique noir & or',
        image: 'https://images.unsplash.com/photo-1630084305900-b297cff3a608?w=800&q=85',
        alt: 'Wax super wax géométrique noir et or',
      },
      'geo-rouge': {
        label: 'Géométrique rouge',
        image: 'https://images.unsplash.com/photo-1768212566108-4ce4f329e4d2?w=800&q=85',
        alt: 'Wax super wax géométrique rouge',
      },
      'geo-bleu': {
        label: 'Géométrique bleu',
        image: 'https://images.unsplash.com/photo-1768212565426-58b089b6386d?w=800&q=85',
        alt: 'Wax super wax géométrique bleu',
      },
    },
  },
  6: {
    baseName: 'Pagne wax premium multicolore',
    price: 42,
    packNote: 'Vendu par lot de 3 pagnes',
    previewPrefix: 'Modèle sélectionné',
    defaultVariant: 'multi-vif',
    variants: {
      'multi-vif': {
        label: 'Multicolore vif',
        image: 'https://images.unsplash.com/photo-1768212565424-efa3a3852b81?w=800&q=85',
        alt: 'Pagne wax premium multicolore vif',
      },
      'multi-terre': {
        label: 'Tons terre',
        image: 'https://images.unsplash.com/photo-1768212566108-4ce4f329e4d2?w=800&q=85',
        alt: 'Pagne wax premium tons terre',
      },
      'multi-sunset': {
        label: 'Sunset orange',
        image: 'https://images.unsplash.com/photo-1768212565426-58b089b6386d?w=800&q=85',
        alt: 'Pagne wax premium sunset orange',
      },
    },
  },
  7: {
    baseName: 'Bazin Riche Getzner Brodé de Luxe',
    price: 165,
    packNote: null,
    previewPrefix: 'Modèle sélectionné',
    defaultVariant: 'brode-or',
    variants: {
      'brode-or': {
        label: 'Broderie or',
        image: 'https://images.unsplash.com/photo-1777148783728-510bbeeba075?w=800&q=85',
        alt: 'Bazin Getzner brodé de luxe or',
      },
      'brode-blanc': {
        label: 'Broderie blanc & or',
        image: 'https://images.unsplash.com/photo-1744502671977-702d9105533d?w=800&q=85',
        alt: 'Bazin Getzner brodé de luxe blanc et or',
      },
      'brode-violet': {
        label: 'Broderie violet',
        image: 'https://images.unsplash.com/photo-1607300110843-b3994a493d98?w=800&q=85',
        alt: 'Bazin Getzner brodé de luxe violet',
      },
    },
  },
};

const mecheProductName = 'X-Pression Ultra Braid';

const mecheImages = {
  clean: {
    src: 'xpression-paquets-propres.png?v=20260721-gallery',
    alt: 'Trois paquets propres de mèches X-Pression Ultra Braid',
  },
  portrait: {
    src: 'https://images.unsplash.com/photo-1763256377889-c4e85bdd1a6c?w=1200&q=90',
    alt: 'X-Pression Ultra Braid — modèle avec coiffure portée',
  },
  closeup: {
    src: 'https://images.unsplash.com/photo-1759756655332-d66200497312?w=1200&q=90',
    alt: 'X-Pression Ultra Braid — gros plan sur les mèches',
  },
  pack1b: {
    src: 'images/meches/xpression-pack-1b.jpg',
    alt: 'Paquets X-Pression Ultra Braid — teinte 1B Noir naturel',
  },
  pack350: {
    src: 'images/meches/xpression-pack-350.jpg',
    alt: 'Paquet X-Pression Ultra Braid — teinte 350 Cuivré Roux',
  },
  pack2: {
    src: 'images/meches/xpression-pack-2-brun.jpg',
    alt: 'Paquet X-Pression Ultra Braid — teinte 2 Brun foncé',
  },
  color1: {
    src: 'xpression-color-1.png',
    alt: 'Coque de mèches X-Pression — Color 1',
  },
  color1b: {
    src: 'xpression-color-1b.png',
    alt: 'Coque de mèches X-Pression — Color 1B',
  },
};

const mecheVariants = {
  '1b': {
    label: 'Teinte 1B (Noir naturel)',
    shortLabel: '1B — Noir naturel',
    imageKey: 'clean',
    price: 5,
    stripeProduct: 'meches',
  },
  '350': {
    label: 'Teinte 350 (Cuivré / Roux)',
    shortLabel: '350 — Cuivré / Roux',
    imageKey: 'pack350',
    price: 5,
    stripeProduct: 'meches',
  },
};

let cart = loadCart();

function loadCart() {
  try {
    const saved = localStorage.getItem(CART_STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

function saveCart() {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  } catch {
    /* stockage indisponible */
  }
}

function formatCartSummary() {
  return cart.map((item) => {
    const variant = item.variantLabel ? ` (${item.variantLabel})` : '';
    return `- ${item.displayName || item.name}${variant} × ${item.quantity} — ${formatPrice(item.price * item.quantity)}`;
  }).join('\n');
}

function formatPrice(price) {
  return new Intl.NumberFormat('fr-CH', {
    style: 'currency',
    currency: 'CHF',
    minimumFractionDigits: 0,
  }).format(price);
}

function filterProducts(category) {
  const cards = document.querySelectorAll('#productsGrid .product-card');
  cards.forEach((card) => {
    const match = category === 'all' || card.dataset.category === category;
    card.classList.toggle('hidden', !match);
  });
}

function getCartItemCount() {
  return cart.reduce((sum, item) => sum + item.quantity, 0);
}

function getCartSubtotal() {
  return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

function getCartTotal() {
  return getCartSubtotal() + getShippingCost();
}

function getSelectedShippingKey() {
  const select = document.getElementById('checkoutShipping');
  return select?.value || 'suisse';
}

function getShippingCost(key = getSelectedShippingKey()) {
  const option = SHIPPING_OPTIONS[key];
  if (!option) return 0;
  if (option.freeFromItems && getCartItemCount() >= option.freeFromItems) return 0;
  return option.baseCost;
}

function getShippingLabel(key = getSelectedShippingKey()) {
  const option = SHIPPING_OPTIONS[key];
  if (!option) return 'Suisse — Gratuit';
  const cost = getShippingCost(key);
  if (cost === 0) {
    return `${option.label}`;
  }
  return `${option.label} — ${formatPrice(cost)}`;
}

function updateShippingSelectLabels() {
  const select = document.getElementById('checkoutShipping');
  const hint = document.getElementById('cartShippingHint');
  if (!select) return;

  const labels = {
    suisse: 'Suisse — Gratuit (0.00 CHF)',
    europe: 'Europe — 9.90 CHF',
    monde: 'Reste du monde — 15.00 CHF',
  };

  Array.from(select.options).forEach((option) => {
    if (labels[option.value]) option.textContent = labels[option.value];
  });

  if (hint) {
    if (select.value === 'suisse') {
      hint.textContent = 'Livraison offerte en Suisse.';
    } else {
      hint.textContent = '';
    }
  }
}

function normalizeCartItem(item) {
  if (item.stripeProduct) return item;
  if (item.stripeEligible && item.price === 80) {
    return { ...item, stripeProduct: 'getzner' };
  }
  if (item.name === mecheProductName || item.price === 5) {
    return { ...item, stripeProduct: 'meches' };
  }
  return { ...item, stripeProduct: null };
}

function getStripeGroups() {
  const groups = {};
  cart.forEach((rawItem) => {
    const item = normalizeCartItem(rawItem);
    const key = item.stripeProduct;
    if (!key || !STRIPE_PRODUCTS[key]) return;
    if (!groups[key]) {
      groups[key] = {
        key,
        label: STRIPE_PRODUCTS[key].label,
        unitPrice: STRIPE_PRODUCTS[key].unitPrice,
        quantity: 0,
        amount: 0,
      };
    }
    groups[key].quantity += item.quantity;
    groups[key].amount += item.price * item.quantity;
  });
  return Object.values(groups);
}

function getStripePaymentPlan() {
  const subtotal = getCartSubtotal();
  const shipping = getShippingCost();
  const total = subtotal + shipping;
  const stripeGroups = getStripeGroups();
  const hasNonStripe = cart.some((item) => !normalizeCartItem(item).stripeProduct);

  if (cart.length === 0) {
    return {
      mode: 'empty',
      payments: [],
      subtotal: 0,
      shipping: 0,
      total: 0,
      buttonLabel: 'Payer par carte (Stripe)',
      note: 'Ajoutez des articles pour payer.',
      canCheckout: false,
    };
  }

  const payLabel = `Payer par carte (Stripe) — ${formatPrice(total)}`;

  if (hasNonStripe) {
    return {
      mode: 'manual',
      payments: stripeGroups,
      subtotal,
      shipping,
      total,
      buttonLabel: payLabel,
      note: `Certains articles ne sont pas payables en ligne. Livraison : ${getShippingLabel()}.`,
      canCheckout: false,
    };
  }

  if (stripeGroups.length === 0) {
    return {
      mode: 'manual',
      payments: [],
      subtotal,
      shipping,
      total,
      buttonLabel: payLabel,
      note: `Commande enregistrée. Livraison : ${getShippingLabel()}.`,
      canCheckout: false,
    };
  }

  return {
    mode: 'checkout',
    payments: stripeGroups,
    subtotal,
    shipping,
    total,
    buttonLabel: payLabel,
    note: `Paiement Stripe sécurisé du montant exact. Livraison : ${getShippingLabel()}.`,
    canCheckout: true,
  };
}

function getCheckoutEmail() {
  return document.getElementById('checkoutEmail')?.value?.trim() || '';
}

function getCheckoutCustomer() {
  return {
    name: document.getElementById('checkoutName')?.value?.trim() || '',
    email: getCheckoutEmail(),
    phone: document.getElementById('checkoutPhone')?.value?.trim() || '',
    address: document.getElementById('checkoutAddress')?.value?.trim() || '',
    shipping: getSelectedShippingKey(),
  };
}

function validateCheckoutForm() {
  const customer = getCheckoutCustomer();
  if (!customer.name) return 'Indiquez votre nom complet.';
  if (!customer.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email)) {
    return 'Indiquez un e-mail valide.';
  }
  if (!customer.phone) return 'Indiquez votre téléphone.';
  if (!customer.address) return 'Indiquez votre adresse de livraison.';
  if (!customer.shipping) return 'Choisissez un mode de livraison.';
  return '';
}

function buildCheckoutSessionPayload() {
  const customer = getCheckoutCustomer();
  const items = cart
    .map((rawItem) => {
      const item = normalizeCartItem(rawItem);
      return {
        productKey: item.stripeProduct,
        quantity: item.quantity,
        variantLabel: item.variantLabel || '',
        name: item.displayName || item.name,
      };
    })
    .filter((item) => item.productKey && STRIPE_PRODUCTS[item.productKey]);

  return {
    items,
    email: customer.email,
    name: customer.name,
    phone: customer.phone,
    address: customer.address,
    shipping: customer.shipping,
    origin: getSiteOriginPath(),
  };
}

function getSiteOriginPath() {
  try {
    const { origin, pathname } = window.location;
    // GitHub Pages project site: /marteder-textile/index.html → /marteder-textile
    if (pathname.endsWith('.html')) {
      return origin + pathname.replace(/\/[^/]*$/, '');
    }
    return origin + pathname.replace(/\/$/, '');
  } catch {
    return window.location.origin;
  }
}

async function createStripeCheckoutSession() {
  const plan = getStripePaymentPlan();
  if (!plan.canCheckout) {
    throw new Error(plan.note || 'Paiement Stripe indisponible pour ce panier.');
  }

  const formError = validateCheckoutForm();
  if (formError) throw new Error(formError);

  const payload = buildCheckoutSessionPayload();
  if (!payload.items.length) {
    throw new Error('Aucun article payable en ligne dans le panier.');
  }

  // Garde une copie locale pour la page de confirmation
  try {
    sessionStorage.setItem(
      'marteder-last-order',
      JSON.stringify({
        totalLabel: formatPrice(plan.total),
        shippingLabel: getShippingLabel(),
        order: formatCartSummary(),
      })
    );
    sessionStorage.removeItem(STRIPE_PENDING_KEY);
  } catch (error) {
    console.error('sessionStorage order', error);
  }

  let lastError = 'Impossible de créer le paiement Stripe.';

  for (const endpoint of STRIPE_CHECKOUT_API_FALLBACKS) {
    let response;
    try {
      response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(payload),
      });
    } catch (error) {
      lastError = 'Réseau indisponible. Vérifiez votre connexion puis réessayez.';
      console.error('checkout fetch', endpoint, error);
      continue;
    }

    let data = {};
    try {
      data = await response.json();
    } catch {
      data = {};
    }

    if (response.ok && data.url) {
      return data;
    }

    if (response.status === 404) {
      lastError = 'API de paiement introuvable sur ce déploiement.';
      continue;
    }

    lastError =
      data.error ||
      (response.status === 500
        ? 'Erreur serveur Stripe. Vérifiez STRIPE_SECRET_KEY (sk_live_…) sur Netlify.'
        : 'Impossible de créer le paiement Stripe.');
    // Erreur métier / config : inutile d'essayer un autre endpoint
    break;
  }

  throw new Error(lastError);
}

function notifyOrderInBackground(payload) {
  try {
    fetch(FORMSUBMIT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(() => {
      /* ne bloque jamais le paiement Stripe */
    });
  } catch (error) {
    console.error('notifyOrderInBackground', error);
  }
}

function redirectToStripe(payUrl) {
  const url = payUrl;
  if (!url) return;
  try {
    window.location.assign(url);
  } catch (error) {
    console.error('redirectToStripe', error);
    window.location.href = url;
  }
}

function updateStripeQtyHint(plan) {
  const hint = document.getElementById('cartStripeQtyHint');
  if (!hint) return;

  if (!plan?.canCheckout || plan.total <= 0) {
    hint.hidden = true;
    hint.textContent = '';
    return;
  }

  const details = (plan.payments || [])
    .map((payment) => `${payment.quantity} × ${payment.label} = ${formatPrice(payment.amount)}`)
    .join(' · ');

  hint.hidden = false;
  hint.innerHTML =
    `<strong>Total Stripe :</strong> ${formatPrice(plan.total)}` +
    (details ? ` (${details}` + (plan.shipping > 0 ? ` + livraison ${formatPrice(plan.shipping)}` : '') + ')' : '') +
    '. Le montant exact sera prérempli sur la page de paiement.';
}

function updateStripePayLink() {
  const link = document.getElementById('cartStripePayLink');
  if (!link) return;

  const plan = getStripePaymentPlan();
  const empty = cart.length === 0 || !plan.canCheckout;

  link.textContent = plan.buttonLabel || 'Payer par carte (Stripe)';
  link.classList.toggle('is-disabled', empty);
  if (empty) {
    link.setAttribute('aria-disabled', 'true');
    link.setAttribute('disabled', 'disabled');
  } else {
    link.removeAttribute('aria-disabled');
    link.removeAttribute('disabled');
  }

  updateStripeQtyHint(plan);
}

function updateCheckoutButton() {
  updateShippingSelectLabels();
  updateStripePayLink();

  const checkoutBtn = document.getElementById('cartCheckoutBtn');
  const note = document.querySelector('.cart-checkout-note');
  const cartSubtotal = document.getElementById('cartSubtotal');
  const cartShipping = document.getElementById('cartShipping');
  const cartTotal = document.getElementById('cartTotal');
  const cartFinalTotal = document.getElementById('cartFinalTotal');
  const plan = getStripePaymentPlan();

  if (cartSubtotal) cartSubtotal.textContent = formatPrice(plan.subtotal);
  if (cartShipping) {
    cartShipping.textContent = plan.shipping > 0 ? formatPrice(plan.shipping) : 'Gratuit';
  }
  if (cartTotal) cartTotal.textContent = formatPrice(plan.total);
  if (cartFinalTotal) cartFinalTotal.textContent = formatPrice(plan.total);

  if (checkoutBtn) {
    checkoutBtn.disabled = cart.length === 0;
    checkoutBtn.textContent = 'Continuer vers le paiement';
  }
  if (note && !note.classList.contains('hidden')) {
    note.textContent = plan.note;
  }
}

function renderCart() {
  const cartList = document.getElementById('cartList');
  const cartCountEls = document.querySelectorAll('.cart-count');

  if (!cartList) return;

  if (cart.length === 0) {
    cartList.innerHTML = '<p class="cart-empty">Votre panier est vide.</p>';
  } else {
    cartList.innerHTML = cart.map((item, index) => `
      <div class="cart-item">
        <div class="cart-item-info">
          <p class="cart-item-name">${item.name}</p>
          ${item.variantLabel ? `<p class="cart-item-variant">${item.variantType || 'Variante'} : <strong>${item.variantLabel}</strong></p>` : ''}
          ${item.packNote ? `<p class="cart-item-note">${item.packNote}</p>` : ''}
        </div>
        <div class="cart-item-meta">
          <span class="cart-item-price">${formatPrice(item.price * item.quantity)}</span>
          <div class="cart-item-qty-controls">
            <button type="button" class="cart-qty-btn" data-qty-delta="-1" data-index="${index}" aria-label="Diminuer la quantité">−</button>
            <span class="cart-item-qty">${item.quantity}</span>
            <button type="button" class="cart-qty-btn" data-qty-delta="1" data-index="${index}" aria-label="Augmenter la quantité">+</button>
          </div>
        </div>
        <button type="button" class="cart-item-remove" data-index="${index}" aria-label="Retirer du panier">&times;</button>
      </div>
    `).join('');
  }

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  cartCountEls.forEach((el) => {
    el.textContent = String(totalItems);
  });
  document.querySelectorAll('.cart-btn').forEach((btn) => {
    btn.classList.toggle('has-items', totalItems > 0);
  });

  updateCheckoutButton();
}

function addToCart(item) {
  const existing = cart.find(
    (entry) => entry.name === item.name && entry.variantKey === item.variantKey,
  );

  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({ ...item, quantity: 1 });
  }

  renderCart();
  saveCart();
  openCartPanel();
  showToast(`« ${item.displayName} » ajouté au panier`);
}

function getFabricVariantKey(card) {
  const activeSwatch = card.querySelector('.fabric-swatch.active');
  if (activeSwatch) return activeSwatch.dataset.variant;

  const select = card.querySelector('.fabric-variant-select');
  return select?.value;
}

function initCart() {
  document.body.addEventListener('click', (e) => {
    const qtyBtn = e.target.closest('.cart-qty-btn');
    if (qtyBtn) {
      const index = parseInt(qtyBtn.dataset.index, 10);
      const delta = parseInt(qtyBtn.dataset.qtyDelta, 10);
      const item = cart[index];
      if (!item) return;
      item.quantity += delta;
      if (item.quantity <= 0) cart.splice(index, 1);
      renderCart();
      saveCart();
      return;
    }

    const removeBtn = e.target.closest('.cart-item-remove');
    if (removeBtn) {
      const index = parseInt(removeBtn.dataset.index, 10);
      cart.splice(index, 1);
      renderCart();
      saveCart();
      return;
    }

    const mecheBtn = e.target.closest('.add-cart-meche');
    if (mecheBtn) {
      e.preventDefault();
      const select = document.getElementById('mecheVariantSelect');
      const variant = mecheVariants[select.value];
      if (!variant) return;

      addToCart({
        name: mecheProductName,
        displayName: `${mecheProductName} — ${variant.label}`,
        variantKey: select.value,
        variantLabel: variant.label,
        variantType: 'Teinte',
        packNote: '5 CHF le paquet',
        price: variant.price,
        stripeProduct: 'meches',
      });
      return;
    }

    const fabricBtn = e.target.closest('.add-cart-fabric');
    if (fabricBtn) {
      e.preventDefault();
      const productId = fabricBtn.dataset.id;
      if (isOutOfStockProduct(productId)) {
        showToast('Ce produit est en rupture de stock.');
        return;
      }
      const fabric = fabricProducts[productId];
      const card = fabricBtn.closest('.product-card') || fabricBtn.closest('.getzner-product-details');
      if (!fabric) return;

      let variantKey = card ? getFabricVariantKey(card) : fabric.defaultVariant;
      if (productId === 'marteder-getzner') {
        const martederSelect = document.querySelector('[data-marteder-select]');
        if (martederSelect) variantKey = martederSelect.value;
      }
      const variant = fabric.variants[variantKey] || fabric.variants[fabric.defaultVariant];
      if (!variant) return;

      addToCart({
        name: fabric.baseName,
        displayName: `${fabric.baseName} — ${variant.label}`,
        variantKey: `${productId}:${variantKey}`,
        variantLabel: variant.label,
        variantType: fabric.previewPrefix.replace(' sélectionné', '').replace(' sélectionnée', ''),
        packNote: fabric.packNote,
        price: fabric.price,
        stripeProduct: fabric.stripeProduct || null,
      });
      return;
    }

    const btn = e.target.closest('.add-cart');
    if (!btn) return;

    e.preventDefault();
    openWhatsAppOrder(WHATSAPP_ORDER_MESSAGE);
  });
}

function openCartPanel() {
  const panel = document.getElementById('cartPanel');
  const toggle = document.getElementById('cartToggle');
  if (!panel) return;
  panel.classList.add('open');
  panel.setAttribute('aria-hidden', 'false');
  if (toggle) toggle.setAttribute('aria-expanded', 'true');
  document.body.style.overflow = 'hidden';
}

function closeCartPanel() {
  const panel = document.getElementById('cartPanel');
  const toggle = document.getElementById('cartToggle');
  if (!panel) return;
  panel.classList.remove('open');
  panel.setAttribute('aria-hidden', 'true');
  if (toggle) toggle.setAttribute('aria-expanded', 'false');
  document.body.style.overflow = '';
}

function initCartPanel() {
  const toggle = document.getElementById('cartToggle');
  const close = document.getElementById('cartClose');
  const backdrop = document.getElementById('cartBackdrop');

  toggle?.addEventListener('click', () => {
    const panel = document.getElementById('cartPanel');
    if (panel?.classList.contains('open')) {
      closeCartPanel();
    } else {
      renderCart();
      openCartPanel();
    }
  });

  close?.addEventListener('click', closeCartPanel);
  backdrop?.addEventListener('click', closeCartPanel);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeCartPanel();
  });
}

function setFabricImage(img, variant) {
  if (!img || !variant) return;

  img.alt = variant.alt;
  img.src = variant.image;

  if (!variant.localImage) return;

  const probe = new Image();
  probe.onload = () => {
    img.src = variant.localImage;
  };
  probe.src = variant.localImage;
}

function syncFabricSwatchImages(card, fabric) {
  Object.entries(fabric.variants).forEach(([variantKey, variant]) => {
    const swatchImg = card.querySelector(`.fabric-swatch[data-variant="${variantKey}"] img`);
    if (swatchImg) setFabricImage(swatchImg, variant);
  });
}

function updateFabricCard(card, variantKey) {
  const productId = card.dataset.productId;
  const fabric = fabricProducts[productId];
  if (!fabric) return;

  const variant = fabric.variants[variantKey];
  if (!variant) return;

  const image = card.querySelector('.product-image');
  const preview = card.querySelector('.fabric-variant-preview');
  const select = card.querySelector('.fabric-variant-select');
  const swatches = card.querySelectorAll('.fabric-swatch');

  if (image) setFabricImage(image, variant);

  if (select) select.value = variantKey;

  swatches.forEach((swatch) => {
    swatch.classList.toggle('active', swatch.dataset.variant === variantKey);
  });

  if (preview) {
    preview.innerHTML = `${fabric.previewPrefix} : <strong>${variant.label}</strong>`;
  }
}

function initFabricVariants() {
  document.querySelectorAll('.product-card[data-product-id]').forEach((card) => {
    const productId = card.dataset.productId;
    const fabric = fabricProducts[productId];
    if (!fabric) return;
    // La galerie Marteder gère ses propres variantes
    if (card.querySelector('[data-marteder-gallery]')) return;

    const select = card.querySelector('.fabric-variant-select');
    const swatches = card.querySelectorAll('.fabric-swatch');

    const applyVariant = (variantKey) => {
      updateFabricCard(card, variantKey);
    };

    select?.addEventListener('change', () => {
      applyVariant(select.value);
    });

    swatches.forEach((swatch) => {
      swatch.addEventListener('click', () => applyVariant(swatch.dataset.variant));
    });

    syncFabricSwatchImages(card, fabric);
    applyVariant(fabric.defaultVariant);
  });
}

function initMecheVariant() {
  const select = document.getElementById('mecheVariantSelect');
  const image = document.getElementById('mecheVariantImage');
  const preview = document.getElementById('mecheVariantPreview');
  const thumbs = document.querySelectorAll('.meche-thumb');

  if (!select || !image) return;

  const setMainImage = (imageKey, updateThumbs = true) => {
    const photo = mecheImages[imageKey];
    if (!photo) return;

    image.src = photo.src;
    image.alt = photo.alt;
    const isProductShot = imageKey === 'clean'
      || imageKey.startsWith('pack')
      || imageKey.startsWith('color');
    image.classList.toggle('is-pack-shot', isProductShot);

    if (updateThumbs) {
      thumbs.forEach((thumb) => {
        thumb.classList.toggle('active', thumb.dataset.imageKey === imageKey);
      });
    }
  };

  const updateFromVariant = () => {
    const variant = mecheVariants[select.value];
    if (!variant) return;

    setMainImage(variant.imageKey);

    if (preview) {
      preview.innerHTML = `Teinte sélectionnée : <strong>${variant.label}</strong>`;
    }
  };

  select.addEventListener('change', updateFromVariant);

  thumbs.forEach((thumb) => {
    thumb.addEventListener('click', () => {
      setMainImage(thumb.dataset.imageKey);
    });
  });

  updateFromVariant();
}

function showToast(message) {
  let toast = document.querySelector('.toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}

function initFilters() {
  document.querySelectorAll('.filter-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');

      const scrollTarget = btn.dataset.scroll;
      if (scrollTarget) {
        document.querySelector(scrollTarget)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }

      filterProducts(btn.dataset.filter);
    });
  });
}

function initNav() {
  const header = document.getElementById('header');
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');

  window.addEventListener('scroll', () => {
    header.classList.toggle('scrolled', window.scrollY > 20);
  });

  navToggle.addEventListener('click', () => {
    navLinks.classList.toggle('open');
  });

  navLinks.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => navLinks.classList.remove('open'));
  });
}

function initBackToTop() {
  const button = document.getElementById('backToTop');
  if (!button) return;

  const toggleVisibility = () => {
    const scrolled = window.scrollY || document.documentElement.scrollTop;
    button.hidden = scrolled <= 300;
  };

  window.addEventListener('scroll', toggleVisibility, { passive: true });
  toggleVisibility();

  button.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

function initCartCheckout() {
  const checkoutBtn = document.getElementById('cartCheckoutBtn');
  const checkoutForm = document.getElementById('cartCheckoutForm');
  const cancelBtn = document.getElementById('cartCheckoutCancel');
  const stripePayLink = document.getElementById('cartStripePayLink');

  if (!checkoutBtn || !checkoutForm) return;

  const showCheckoutForm = (show) => {
    checkoutForm.classList.toggle('hidden', !show);
    checkoutBtn.classList.toggle('hidden', show);
    document.querySelector('.cart-checkout-note')?.classList.toggle('hidden', show);
    updateCheckoutButton();
    if (show) {
      const scroller = document.querySelector('.cart-panel-scroll');
      if (scroller) {
        scroller.scrollTo({
          top: scroller.scrollHeight,
          behavior: 'smooth',
        });
      }
    }
  };

  document.getElementById('checkoutShipping')?.addEventListener('change', () => {
    updateCheckoutButton();
  });

  checkoutBtn.addEventListener('click', () => {
    if (cart.length === 0) return;
    updateCheckoutButton();
    showCheckoutForm(true);
  });

  cancelBtn?.addEventListener('click', () => showCheckoutForm(false));

  // Bouton Stripe → Checkout Session (montant exact du panier)
  updateStripePayLink();

  stripePayLink?.addEventListener('click', async (e) => {
    e.preventDefault();
    if (cart.length === 0 || stripePayLink.classList.contains('is-disabled')) return;

    const formError = validateCheckoutForm();
    if (formError) {
      showToast(formError);
      return;
    }

    const previousLabel = stripePayLink.textContent;
    stripePayLink.classList.add('is-disabled');
    stripePayLink.setAttribute('disabled', 'disabled');
    stripePayLink.textContent = 'Redirection vers Stripe…';

    try {
      const customer = getCheckoutCustomer();
      const plan = getStripePaymentPlan();
      const session = await createStripeCheckoutSession();

      // Notification boutique seulement après création réussie de la session
      notifyOrderInBackground({
        _subject: `Commande Marteder — ${formatPrice(plan.total)}`,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        address: customer.address,
        shipping: getShippingLabel(),
        order: formatCartSummary(),
        total: formatPrice(plan.total),
        payment: 'Stripe Checkout Session',
        stripe_session_id: session.id || '',
      });

      redirectToStripe(session.url);
    } catch (error) {
      console.error('stripe checkout', error);
      showToast(error.message || 'Paiement Stripe indisponible. Réessayez ou contactez-nous.');
      stripePayLink.textContent = previousLabel;
      updateStripePayLink();
    }
  });

  checkoutForm.addEventListener('submit', (e) => {
    e.preventDefault();
    stripePayLink?.click();
  });
}

function initContactForm() {
  const form = document.getElementById('contactForm');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    openWhatsAppOrder(WHATSAPP_ORDER_MESSAGE);
  });

  const contactSubmit = form.querySelector('.contact-submit-btn');
  if (contactSubmit) {
    contactSubmit.addEventListener('click', (e) => {
      e.preventDefault();
      openWhatsAppOrder(WHATSAPP_ORDER_MESSAGE);
    });
  }
}

function initNewsletter() {
  const form = document.getElementById('newsletterForm');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const input = e.target.querySelector('input');
    showToast('Merci pour votre inscription !');
    input.value = '';
  });
}

function initMartederGallery() {
  const gallery = document.querySelector('[data-marteder-gallery]');
  const lightbox = document.getElementById('martederLightbox');
  if (!gallery || !lightbox) return;

  const mainImage = gallery.querySelector('[data-marteder-main]');
  const labelEl = gallery.querySelector('[data-marteder-label]');
  const previewEl = document.querySelector('[data-marteder-preview]');
  const colorSelect = document.querySelector('[data-marteder-select]');
  const thumbs = Array.from(gallery.querySelectorAll('.marteder-thumb'));
  const zoomBtn = gallery.querySelector('[data-marteder-zoom]');
  const lightboxImage = document.getElementById('martederLightboxImage');
  const lightboxLabel = document.getElementById('martederLightboxLabel');
  let index = 0;

  const getSlide = (i) => {
    const thumb = thumbs[i];
    return {
      src: thumb.dataset.src,
      label: thumb.dataset.label,
    };
  };

  const showSlide = (i) => {
    index = (i + thumbs.length) % thumbs.length;
    const slide = getSlide(index);
    mainImage.src = slide.src;
    mainImage.alt = `Création exclusive Marteder — ${slide.label}`;
    if (labelEl) labelEl.textContent = slide.label;
    if (previewEl) {
      previewEl.innerHTML = `Couleur sélectionnée : <strong>${slide.label}</strong>`;
    }
    if (colorSelect) colorSelect.value = String(index);
    thumbs.forEach((thumb, thumbIndex) => {
      const active = thumbIndex === index;
      thumb.classList.toggle('active', active);
      thumb.setAttribute('aria-selected', active ? 'true' : 'false');
    });
  };

  const syncLightbox = () => {
    const slide = getSlide(index);
    lightboxImage.src = slide.src;
    lightboxImage.alt = `Création exclusive Marteder — ${slide.label}`;
    lightboxLabel.textContent = slide.label;
  };

  const openLightbox = () => {
    syncLightbox();
    lightbox.hidden = false;
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  };

  const closeLightbox = () => {
    lightbox.hidden = true;
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  };

  gallery.querySelector('.marteder-gallery-prev')?.addEventListener('click', () => showSlide(index - 1));
  gallery.querySelector('.marteder-gallery-next')?.addEventListener('click', () => showSlide(index + 1));
  thumbs.forEach((thumb) => {
    thumb.addEventListener('click', () => showSlide(Number(thumb.dataset.index)));
  });
  colorSelect?.addEventListener('change', () => {
    showSlide(Number(colorSelect.value));
  });
  zoomBtn?.addEventListener('click', openLightbox);

  lightbox.querySelectorAll('[data-marteder-close]').forEach((el) => {
    el.addEventListener('click', closeLightbox);
  });
  lightbox.querySelector('.marteder-lightbox-prev')?.addEventListener('click', () => {
    showSlide(index - 1);
    syncLightbox();
  });
  lightbox.querySelector('.marteder-lightbox-next')?.addEventListener('click', () => {
    showSlide(index + 1);
    syncLightbox();
  });

  document.addEventListener('keydown', (e) => {
    if (!lightbox.hidden) {
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') {
        showSlide(index - 1);
        syncLightbox();
      }
      if (e.key === 'ArrowRight') {
        showSlide(index + 1);
        syncLightbox();
      }
    }
  });

  showSlide(0);
}

function initDNutrimecGallery() {
  const mainImage = document.getElementById('dnutrimecMainImage');
  const mainTrigger = mainImage?.closest('[data-product-zoom]');
  const thumbs = Array.from(document.querySelectorAll('[data-dnutrimec-thumb]'));
  if (!mainImage || !mainTrigger || thumbs.length === 0) return;

  const showImage = (thumb) => {
    mainImage.src = thumb.dataset.src;
    mainImage.alt = thumb.dataset.alt;
    mainTrigger.dataset.caption = thumb.dataset.caption;
    mainTrigger.dataset.galleryStartIndex = thumb.dataset.galleryIndex;
    thumbs.forEach((item) => item.classList.toggle('active', item === thumb));
  };

  thumbs.forEach((thumb) => {
    thumb.addEventListener('click', () => showImage(thumb));
  });

  showImage(thumbs[0]);
}

function initOkadyGallery() {
  const mainImage = document.getElementById('okadyMainImage');
  const mainTrigger = document.getElementById('okadyMainTrigger');
  const mainCaption = document.getElementById('okadyMainCaption');
  const productTriggers = Array.from(document.querySelectorAll('[data-okady-product]'));
  if (!mainImage || !mainTrigger || !mainCaption || productTriggers.length === 0) return;

  const showProduct = (trigger) => {
    const sourceImage = trigger.querySelector('img');
    if (!sourceImage) return;

    const card = trigger.closest('.cosmetique-card');
    const productName = card?.querySelector('.cosmetique-name')?.textContent?.trim()
      || trigger.dataset.caption;
    const selectedIndex = trigger.dataset.galleryStartIndex
      ?? trigger.dataset.galleryIndex
      ?? '0';

    mainImage.src = sourceImage.currentSrc || sourceImage.src;
    mainImage.alt = sourceImage.alt;
    mainCaption.textContent = productName;
    mainTrigger.dataset.caption = trigger.dataset.caption || productName;
    mainTrigger.dataset.galleryStartIndex = selectedIndex;

    productTriggers.forEach((item) => {
      item.closest('.cosmetique-card')?.classList.toggle('okady-selected', item === trigger);
    });
  };

  productTriggers.forEach((trigger) => {
    trigger.addEventListener('click', () => showProduct(trigger));
  });

  showProduct(productTriggers[0]);
}

function initProductLightbox() {
  const lightbox = document.getElementById('productLightbox');
  const image = document.getElementById('productLightboxImage');
  const caption = document.getElementById('productLightboxCaption');
  const triggers = Array.from(document.querySelectorAll('[data-product-zoom]'));
  const galleryItems = Array.from(document.querySelectorAll('[data-product-gallery]'));
  if (!lightbox || !image || !caption || triggers.length === 0) return;

  const closeButton = lightbox.querySelector('.marteder-lightbox-close');
  const previousButton = lightbox.querySelector('[data-product-lightbox-prev]');
  const nextButton = lightbox.querySelector('[data-product-lightbox-next]');
  let lastTrigger = null;
  let galleryTriggers = [];
  let galleryIndex = 0;

  const showTrigger = (trigger) => {
    const sourceImage = trigger.querySelector('img')
      || trigger.closest('.product-zoom-wrap')?.querySelector('img');
    if (!sourceImage) return;

    const galleryPhoto = trigger.dataset.imageKey
      ? mecheImages[trigger.dataset.imageKey]
      : null;
    image.src = galleryPhoto?.src || sourceImage.currentSrc || sourceImage.src;
    image.alt = galleryPhoto?.alt || sourceImage.alt;
    caption.textContent = trigger.dataset.caption || sourceImage.alt;
  };

  const openLightbox = (trigger) => {
    lastTrigger = trigger;

    const galleryName = trigger.dataset.productGallery;
    galleryTriggers = galleryName
      ? galleryItems
        .filter((item) => (
          item.dataset.productGallery === galleryName
          && !item.hasAttribute('data-gallery-exclude')
        ))
        .sort((a, b) => Number(a.dataset.galleryIndex) - Number(b.dataset.galleryIndex))
      : [trigger];

    const requestedIndex = trigger.dataset.galleryStartIndex;
    const requestedPosition = requestedIndex === undefined
      ? galleryTriggers.indexOf(trigger)
      : galleryTriggers.findIndex((item) => item.dataset.galleryIndex === requestedIndex);
    galleryIndex = Math.max(0, requestedPosition);

    showTrigger(galleryTriggers[galleryIndex]);
    const hasNavigation = galleryTriggers.length > 1;
    if (previousButton) previousButton.hidden = !hasNavigation;
    if (nextButton) nextButton.hidden = !hasNavigation;
    lightbox.hidden = false;
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    closeButton?.focus();
  };

  const navigateGallery = (direction) => {
    if (galleryTriggers.length < 2) return;
    galleryIndex = (galleryIndex + direction + galleryTriggers.length) % galleryTriggers.length;
    showTrigger(galleryTriggers[galleryIndex]);
  };

  const closeLightbox = () => {
    lightbox.hidden = true;
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    lastTrigger?.focus();
  };

  triggers.forEach((trigger) => {
    trigger.addEventListener('click', () => openLightbox(trigger));
  });

  lightbox.querySelectorAll('[data-product-lightbox-close]').forEach((element) => {
    element.addEventListener('click', closeLightbox);
  });
  previousButton?.addEventListener('click', () => navigateGallery(-1));
  nextButton?.addEventListener('click', () => navigateGallery(1));

  document.addEventListener('keydown', (event) => {
    if (lightbox.hidden) return;
    if (event.key === 'Escape') closeLightbox();
    if (event.key === 'ArrowLeft') navigateGallery(-1);
    if (event.key === 'ArrowRight') navigateGallery(1);
  });
}

function initHeroCoverSlideshow() {
  const slides = Array.from(document.querySelectorAll('.hero-cover-slide'));
  if (slides.length < 2) return;
  let index = slides.findIndex((slide) => slide.classList.contains('is-active'));
  if (index < 0) index = 0;

  setInterval(() => {
    slides[index].classList.remove('is-active');
    index = (index + 1) % slides.length;
    slides[index].classList.add('is-active');
  }, 5500);
}

document.addEventListener('DOMContentLoaded', () => {
  purgeOutOfStockFromCart();
  renderCart();
  initCart();
  initCartPanel();
  initCartCheckout();
  initWhatsAppProductOrders();
  initContactForm();
  initFabricVariants();
  initMecheVariant();
  initMartederGallery();
  initDNutrimecGallery();
  initOkadyGallery();
  initProductLightbox();
  initFilters();
  initNav();
  initBackToTop();
  initNewsletter();
  initHeroCoverSlideshow();

  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get('checkout') === 'cancel') {
      showToast('Paiement annulé. Votre panier est toujours disponible.');
      params.delete('checkout');
      const clean = `${window.location.pathname}${params.toString() ? `?${params}` : ''}${window.location.hash}`;
      window.history.replaceState({}, '', clean);
    }
  } catch (error) {
    /* ignore */
  }
});
