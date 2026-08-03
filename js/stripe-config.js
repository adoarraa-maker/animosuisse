/**
 * Configuration Stripe AnimoSuisse (chargée AVANT js/main.js).
 *
 * Achat direct : chaque bouton produit redirige vers son Payment Link Live.
 * (Plus de panier / Checkout Session Netlify côté site.)
 */
// Clé publique Stripe Live (pk_live_…). La clé secrète sk_live_ reste uniquement dans le Dashboard Stripe / Netlify si besoin.
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
};

// Panier multi-produits désactivé (achat direct via Payment Links).
window.ANIMO_STRIPE_CHECKOUT_URL = window.ANIMO_STRIPE_CHECKOUT_URL || '';
