/**
 * Configuration Stripe AnimoSuisse (chargée AVANT js/main.js).
 *
 * Panier multi-articles :
 * - 1 type d’article → Payment Link (avec ?quantity=) sur GitHub Pages
 * - plusieurs types → Checkout Session via Netlify (ANIMO_STRIPE_CHECKOUT_URL)
 *
 * Payment Links buy.stripe.com :
 */
window.ANIMO_STRIPE_PAYMENT_LINKS = window.ANIMO_STRIPE_PAYMENT_LINKS || {
  'brosse-vapeur': 'https://buy.stripe.com/dRm28sc3783efAHgn9cAo07',
  'gourde-chien-3en1': 'https://buy.stripe.com/5kQ8wQd7berC74b2wjcAo05',
  'jouet-chat-interactif': 'https://buy.stripe.com/dRm28sc3783efAHgn9cAo07',
  'jouet-chat-cable': 'https://buy.stripe.com/bJe14o1ot4R20FN7QDcAo08',
};

// Ex. : 'https://VOTRE-SITE.netlify.app/.netlify/functions/create-checkout-session'
window.ANIMO_STRIPE_CHECKOUT_URL = window.ANIMO_STRIPE_CHECKOUT_URL || '';
