/**
 * Configuration Stripe AnimoSuisse (chargée AVANT js/main.js).
 * Payment Links buy.stripe.com → redirection directe depuis « Commander maintenant ».
 */
window.ANIMO_STRIPE_PAYMENT_LINKS = window.ANIMO_STRIPE_PAYMENT_LINKS || {
  'brosse-vapeur': 'https://buy.stripe.com/dRm28sc3783efAHgn9cAo07',
  'gourde-chien-3en1': 'https://buy.stripe.com/5kQ8wQd7berC74b2wjcAo05',
  'jouet-chat-interactif': 'https://buy.stripe.com/dRm28sc3783efAHgn9cAo07',
};

window.ANIMO_STRIPE_CHECKOUT_URL = window.ANIMO_STRIPE_CHECKOUT_URL || '';
