/**
 * Configuration Stripe AnimoSuisse (chargée AVANT js/main.js).
 *
 * Panier multi-produits (mode Live uniquement) :
 * 1) Checkout Session via Netlify → ANIMO_STRIPE_CHECKOUT_URL
 *    (Netlify doit avoir STRIPE_SECRET_KEY=sk_live_… — jamais sk_test_)
 * 2) Fallback Payment Link Live si 1 seul type d’article dans le panier
 *
 * Clé publique navigateur : pk_live_… uniquement.
 */
window.ANIMO_STRIPE_PUBLISHABLE_KEY =
  window.ANIMO_STRIPE_PUBLISHABLE_KEY ||
  'pk_live_51Tw2q6K6svF9shFXO1pIjOZQgAZq99RLQdYRlGTIIKsekBhypU47kubdTR3elHKZPLwle0v2fyvCWRhJXgNMJC4r00boub0901';

window.ANIMO_STRIPE_PAYMENT_LINKS = window.ANIMO_STRIPE_PAYMENT_LINKS || {
  'brosse-vapeur': 'https://buy.stripe.com/dRm28sc3783efAHgn9cAo07',
  'gourde-chien-3en1': 'https://buy.stripe.com/5kQ8wQd7berC74b2wjcAo05',
  'jouet-chat-interactif': 'https://buy.stripe.com/dRm28sc3783efAHgn9cAo07',
  'jouet-chat-cable': 'https://buy.stripe.com/bJe14o1ot4R20FN7QDcAo08',
  'laisse-retractable-led': 'https://buy.stripe.com/bJe4gA4AFcjugELef1cAo09',
  'laisse-course-mains-libres': 'https://buy.stripe.com/fZueVe4AF83e4W31sfcAo06',
  'collier-gps-4g': 'https://buy.stripe.com/dRm3cw0kp0AM3RZgn9cAo0d',
  'laisse-double-360': 'https://buy.stripe.com/4gM7sM8QVdnybkr8UHcAo0e',
};

// Netlify Checkout Session (panier multi-produits, Live)
window.ANIMO_STRIPE_CHECKOUT_URL =
  window.ANIMO_STRIPE_CHECKOUT_URL ||
  'https://phenomenal-crumble-63c3b0.netlify.app/.netlify/functions/create-checkout-session';
