/**
 * Crée une Stripe Checkout Session avec le montant exact du panier.
 *
 * Variables d'environnement Netlify (Site settings → Environment variables) :
 *   STRIPE_SECRET_KEY = sk_live_... ou sk_test_...
 *
 * Les prix unitaires sont recalculés côté serveur (jamais ceux du navigateur).
 * Aucune dépendance npm : appelle l'API Stripe en HTTPS natif.
 */

const CATALOG = {
  getzner: {
    name: 'Bazin Getzner (Lot de 5 yards)',
    unitAmountCents: 8000,
  },
  meches: {
    name: 'Mèches X-Pression Ultra Braid',
    unitAmountCents: 500,
  },
  'brosse-vapeur': {
    name: 'Brosse Vapeur 3-en-1 pour Chats et Chiens',
    unitAmountCents: 2490,
    supplierSku: 'ANIMO-BROSSE-VAPEUR-3EN1',
    supplier: 'AnimoSuisse',
  },
  'gourde-chien-3en1': {
    name: 'Gourde Multifonction 3-en-1 pour Chien (Eau, Croquettes & Sacs)',
    unitAmountCents: 2990,
    supplierSku: 'CJMY179795809IR',
    supplier: 'CJ Dropshipping',
    supplierVariant: '300ml Garbage Bag / Cherry Blossom Pink',
  },
  'jouet-chat-interactif': {
    name: 'Jouet Électrique Interactif Cache-Cache pour Chat',
    unitAmountCents: 1990,
    supplierSku: 'CJJCWMY00152',
    supplier: 'CJ Dropshipping / Yiwu Renfan Trading Co., Ltd.',
  },
  'jouet-chat-cable': {
    name: "Câble d'alimentation dédié (Jouet Chat)",
    unitAmountCents: 990,
    supplierSku: 'CJJJCWMY00152-Dedicated power cord',
    supplier: 'CJ Dropshipping / Yiwu Renfan Trading Co., Ltd.',
  },
  'laisse-retractable-led': {
    name: 'Laisse de promenade automatique rétractable 3-en-1 (avec Lampe LED)',
    unitAmountCents: 2990,
    supplierSku: 'ANIMO-LAISSE-RETRACTABLE-LED',
    supplier: 'AnimoSuisse',
  },
  'laisse-course-mains-libres': {
    name: 'Laisse de course mains libres avec sac banane',
    unitAmountCents: 2990,
    supplierSku: 'ANIMO-LAISSE-COURSE-MAINS-LIBRES',
    supplier: 'AnimoSuisse',
  },
};

const SHIPPING = {
  suisse: { label: 'Suisse — Gratuit', amountCents: 0 },
  europe: { label: 'Europe', amountCents: 990 },
  monde: { label: 'Reste du monde', amountCents: 1500 },
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(statusCode, body) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
    body: JSON.stringify(body),
  };
}

function sanitizeText(value, max = 200) {
  return String(value || '')
    .replace(/[\r\n\t]+/g, ' ')
    .trim()
    .slice(0, max);
}

function validateStripeSecretKey(secret) {
  const key = String(secret || '').trim();
  if (!key) {
    return {
      ok: false,
      error:
        'STRIPE_SECRET_KEY manquante. Ajoutez-la dans Netlify → Site configuration → Environment variables.',
    };
  }
  if (key.startsWith('pk_')) {
    return {
      ok: false,
      error:
        'Mauvaise clé Stripe : une clé publique (pk_live_/pk_test_) a été configurée. Remplacez STRIPE_SECRET_KEY par la clé secrète (sk_live_… ou sk_test_…) dans Netlify, puis redéployez.',
    };
  }
  if (!key.startsWith('sk_live_') && !key.startsWith('sk_test_')) {
    return {
      ok: false,
      error:
        'STRIPE_SECRET_KEY invalide. Elle doit commencer par sk_live_ ou sk_test_ (Dashboard Stripe → Développeurs → Clés API).',
    };
  }
  return { ok: true, key };
}

function mapStripeError(data) {
  const message = data?.error?.message || '';
  if (/Invalid API Key/i.test(message) || /api key/i.test(message)) {
    return 'Clé Stripe invalide. Vérifiez que STRIPE_SECRET_KEY est bien une clé secrète sk_live_… (pas pk_live_…) dans Netlify.';
  }
  return message || 'Impossible de créer la session Stripe';
}

function resolveOrigin(event, body) {
  const fromBody = sanitizeText(body.origin, 300);
  if (fromBody.startsWith('http://') || fromBody.startsWith('https://')) {
    return fromBody.replace(/\/$/, '');
  }
  const proto = event.headers['x-forwarded-proto'] || 'https';
  const host = event.headers['x-forwarded-host'] || event.headers.host || '';
  if (host) return `${proto}://${host}`.replace(/\/$/, '');
  return 'https://adoarraa-maker.github.io/animosuisse';
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders, body: '' };
  }

  // Diagnostic sans exposer la clé : GET → { keyType: 'secret' | 'publishable' | ... }
  if (event.httpMethod === 'GET') {
    const raw = String(process.env.STRIPE_SECRET_KEY || '').trim();
    let keyType = 'missing';
    if (raw.startsWith('sk_live_') || raw.startsWith('sk_test_')) keyType = 'secret';
    else if (raw.startsWith('pk_live_') || raw.startsWith('pk_test_')) keyType = 'publishable';
    else if (raw) keyType = 'invalid';
    return json(200, {
      ok: keyType === 'secret',
      keyType,
      hint:
        keyType === 'secret'
          ? 'Clé secrète détectée.'
          : 'STRIPE_SECRET_KEY doit être sk_live_… ou sk_test_… (pas pk_…). Modifiez la variable puis Trigger deploy.',
    });
  }

  if (event.httpMethod !== 'POST') {
    return json(405, { error: 'Méthode non autorisée' });
  }

  const keyCheck = validateStripeSecretKey(process.env.STRIPE_SECRET_KEY);
  if (!keyCheck.ok) {
    return json(500, { error: keyCheck.error });
  }
  const secret = keyCheck.key;

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return json(400, { error: 'JSON invalide' });
  }

  const items = Array.isArray(body.items) ? body.items : [];
  if (items.length === 0) {
    return json(400, { error: 'Panier vide' });
  }

  const email = sanitizeText(body.email, 254);
  const name = sanitizeText(body.name, 120);
  const phone = sanitizeText(body.phone, 40);
  const address = sanitizeText(body.address, 400);
  const shippingKey = sanitizeText(body.shipping, 20) || 'suisse';
  const shippingOption = SHIPPING[shippingKey] || SHIPPING.suisse;
  const origin = resolveOrigin(event, body);

  const params = new URLSearchParams();
  params.set('mode', 'payment');
  params.set('locale', 'fr');
  params.set('success_url', `${origin}/commande-merci.html?paid=1&session_id={CHECKOUT_SESSION_ID}`);
  params.set('cancel_url', `${origin}/index.html?checkout=cancel`);
  params.set('phone_number_collection[enabled]', 'true');
  params.set('billing_address_collection', 'auto');
  if (body.express || body.collectShippingAddress) {
    ['CH', 'FR', 'DE', 'IT', 'AT', 'BE', 'LU', 'LI'].forEach((country) => {
      params.append('shipping_address_collection[allowed_countries][]', country);
    });
  }
  if (email) params.set('customer_email', email);
  if (name) params.set('metadata[customer_name]', name);
  if (phone) params.set('metadata[customer_phone]', phone);
  if (address) params.set('metadata[customer_address]', address);
  params.set('metadata[shipping]', shippingKey);
  params.set('metadata[checkout_mode]', body.express ? 'express' : 'cart');
  params.set(
    'metadata[product_names]',
    sanitizeText(
      items
        .map((raw) => {
          const key = sanitizeText(raw.productKey, 40);
          return CATALOG[key]?.name || key;
        })
        .join(' | '),
      480
    )
  );
  if (name) params.set('payment_intent_data[metadata][customer_name]', name);
  if (phone) params.set('payment_intent_data[metadata][customer_phone]', phone);
  params.set('payment_intent_data[metadata][shipping]', shippingKey);

  let itemCount = 0;
  let lineIndex = 0;
  const supplierSkuLines = [];

  for (const raw of items) {
    const productKey = sanitizeText(raw.productKey, 40);
    const catalogItem = CATALOG[productKey];
    if (!catalogItem) {
      return json(400, { error: `Produit non autorisé : ${productKey || '?'}` });
    }

    const quantity = Math.min(99, Math.max(1, Math.round(Number(raw.quantity) || 0)));
    if (!quantity) {
      return json(400, { error: `Quantité invalide pour ${productKey}` });
    }

    itemCount += quantity;
    const variantLabel = sanitizeText(
      raw.variantLabel || catalogItem.supplierVariant,
      120
    );
    const productName = variantLabel
      ? `${catalogItem.name} — ${variantLabel}`
      : catalogItem.name;
    const supplierSku = sanitizeText(catalogItem.supplierSku || raw.supplierSku, 120);
    const supplier = sanitizeText(catalogItem.supplier || raw.supplier, 160);
    if (supplierSku) {
      supplierSkuLines.push(
        `${productName} → ${supplierSku}${variantLabel ? ` [${variantLabel}]` : ''} × ${quantity}`
      );
    }

    params.set(`line_items[${lineIndex}][quantity]`, String(quantity));
    params.set(`line_items[${lineIndex}][price_data][currency]`, 'chf');
    params.set(
      `line_items[${lineIndex}][price_data][unit_amount]`,
      String(catalogItem.unitAmountCents)
    );
    params.set(`line_items[${lineIndex}][price_data][product_data][name]`, productName);
    params.set(
      `line_items[${lineIndex}][price_data][product_data][metadata][product_key]`,
      productKey
    );
    if (supplierSku) {
      params.set(
        `line_items[${lineIndex}][price_data][product_data][metadata][supplier_sku]`,
        supplierSku
      );
      params.set(
        `line_items[${lineIndex}][price_data][product_data][metadata][cj_sku]`,
        supplierSku
      );
    }
    if (supplier) {
      params.set(
        `line_items[${lineIndex}][price_data][product_data][metadata][supplier]`,
        supplier
      );
    }
    if (variantLabel) {
      params.set(
        `line_items[${lineIndex}][price_data][product_data][metadata][variant]`,
        variantLabel
      );
    }
    lineIndex += 1;
  }

  let shippingCents = shippingOption.amountCents;
  if (shippingOption.freeFromItems && itemCount >= shippingOption.freeFromItems) {
    shippingCents = 0;
  }

  if (shippingCents > 0) {
    params.set(`line_items[${lineIndex}][quantity]`, '1');
    params.set(`line_items[${lineIndex}][price_data][currency]`, 'chf');
    params.set(`line_items[${lineIndex}][price_data][unit_amount]`, String(shippingCents));
    params.set(
      `line_items[${lineIndex}][price_data][product_data][name]`,
      shippingOption.label
    );
    params.set(
      `line_items[${lineIndex}][price_data][product_data][metadata][product_key]`,
      'shipping'
    );
  }

  params.set('metadata[item_count]', String(itemCount));
  if (supplierSkuLines.length) {
    const skuSummary = sanitizeText(supplierSkuLines.join(' | '), 480);
    params.set('metadata[supplier_skus]', skuSummary);
    params.set('metadata[cj_skus]', skuSummary);
    params.set('payment_intent_data[metadata][supplier_skus]', skuSummary);
    params.set('payment_intent_data[metadata][cj_skus]', skuSummary);
  }

  try {
    const stripeRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secret}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    const data = await stripeRes.json();
    if (!stripeRes.ok || !data.url) {
      console.error('stripe session error', data);
      return json(500, {
        error: mapStripeError(data),
      });
    }

    return json(200, {
      id: data.id,
      url: data.url,
      amountTotal: data.amount_total,
      currency: data.currency,
      itemCount: itemCount,
    });
  } catch (error) {
    console.error('create-checkout-session', error);
    return json(500, {
      error: error.message || 'Impossible de créer la session Stripe',
    });
  }
};
