/**
 * Configuration Stripe AnimoSuisse (chargée AVANT js/main.js).
 *
 * GitHub Pages : utiliser les Payment Links buy.stripe.com ci-dessous.
 * Option Netlify : ANIMO_STRIPE_CHECKOUT_URL + STRIPE_SECRET_KEY.
 */
window.ANIMO_STRIPE_PAYMENT_LINKS = window.ANIMO_STRIPE_PAYMENT_LINKS || {
  // Brosse : coller le Payment Link dès qu'il est créé dans le Dashboard Stripe
  'brosse-vapeur': '',
  'gourde-chien-3en1': 'https://buy.stripe.com/fZueVe4AF83e4W31sfcAo06',
  'jouet-chat-interactif': '',
};

window.ANIMO_STRIPE_CHECKOUT_URL = window.ANIMO_STRIPE_CHECKOUT_URL || '';
