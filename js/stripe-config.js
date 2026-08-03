/**
 * Configuration Stripe AnimoSuisse (chargée AVANT js/main.js).
 *
 * Panier multi-produits :
 * 1) Checkout Session via Netlify (recommandé) → ANIMO_STRIPE_CHECKOUT_URL
 * 2) Fallback Payment Link si 1 seul type d’article dans le panier
 *
 * Après déploiement Netlify, remplacez l’URL ci-dessous par votre site :
 *   'https://VOTRE-SITE.netlify.app/.netlify/functions/create-checkout-session'
 * Si le site est servi UNIQUEMENT depuis Netlify, laissez '' (chemins relatifs).
 */
window.ANIMO_STRIPE_PAYMENT_LINKS = window.ANIMO_STRIPE_PAYMENT_LINKS || {
  'brosse-vapeur': 'https://buy.stripe.com/dRm28sc3783efAHgn9cAo07',
  'gourde-chien-3en1': 'https://buy.stripe.com/5kQ8wQd7berC74b2wjcAo05',
  'jouet-chat-interactif': 'https://buy.stripe.com/dRm28sc3783efAHgn9cAo07',
  'jouet-chat-cable': 'https://buy.stripe.com/bJe14o1ot4R20FN7QDcAo08',
  'laisse-retractable-led': 'https://buy.stripe.com/bJe4gA4AFcjugELef1cAo09',
  'laisse-course-mains-libres': 'https://buy.stripe.com/fZueVe4AF83e4W31sfcAo06',
};

// Netlify Checkout Session (panier multi-produits)
window.ANIMO_STRIPE_CHECKOUT_URL =
  window.ANIMO_STRIPE_CHECKOUT_URL ||
  'https://phenomenal-crumble-63c3b0.netlify.app/.netlify/functions/create-checkout-session';
