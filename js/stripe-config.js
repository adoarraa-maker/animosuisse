/**
 * Configuration Stripe AnimoSuisse (chargée AVANT js/main.js).
 *
 * Achat direct produit par produit via Payment Links buy.stripe.com
 * (GitHub Pages — pas besoin de Netlify Functions).
 */
window.ANIMO_STRIPE_PAYMENT_LINKS = window.ANIMO_STRIPE_PAYMENT_LINKS || {
  'brosse-vapeur': 'https://buy.stripe.com/dRm28sc3783efAHgn9cAo07',
  'gourde-chien-3en1': 'https://buy.stripe.com/5kQ8wQd7berC74b2wjcAo05',
  'jouet-chat-interactif': 'https://buy.stripe.com/dRm28sc3783efAHgn9cAo07',
  'jouet-chat-cable': 'https://buy.stripe.com/bJe14o1ot4R20FN7QDcAo08',
  'laisse-retractable-led': 'https://buy.stripe.com/bJe4gA4AFcjugELef1cAo09',
  'laisse-course-mains-libres': 'https://buy.stripe.com/4gM5kE4AFabmagn6MzcAo0a',
};

// Optionnel : API Checkout Session (Netlify) — non requis pour l’achat direct
window.ANIMO_STRIPE_CHECKOUT_URL = window.ANIMO_STRIPE_CHECKOUT_URL || '';
