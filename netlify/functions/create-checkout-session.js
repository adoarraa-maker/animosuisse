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
  return 'https://adoarraa-maker.github.io/marteder-textile';
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
  if (email) params.set('customer_email', email);
  params.set('metadata[customer_name]', name);
  params.set('metadata[customer_phone]', phone);
  params.set('metadata[customer_address]', address);
  params.set('metadata[shipping]', shippingKey);
  params.set('payment_intent_data[metadata][customer_name]', name);
  params.set('payment_intent_data[metadata][customer_phone]', phone);
  params.set('payment_intent_data[metadata][shipping]', shippingKey);

  let itemCount = 0;
  let lineIndex = 0;

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
    const variantLabel = sanitizeText(raw.variantLabel, 120);
    const productName = variantLabel
      ? `${catalogItem.name} — ${variantLabel}`
      : catalogItem.name;

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
