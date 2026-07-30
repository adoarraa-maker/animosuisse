/**
 * Configuration Stripe AnimoSuisse (chargée AVANT js/main.js).
 *
 * GitHub Pages ne peut PAS exécuter Netlify Functions.
 * Deux options pour que « Commander maintenant » ouvre Stripe :
 *
 * A) Payment Links (recommandé sur GitHub Pages)
 *    Dashboard Stripe → Produits / Payment Links → créer 1 lien par article
 *    puis coller les URL buy.stripe.com ci-dessous.
 *
 * B) API Checkout Session (Netlify)
 *    Déployer ce repo sur Netlify, ajouter STRIPE_SECRET_KEY (sk_live_…),
 *    puis renseigner ANIMO_STRIPE_CHECKOUT_URL avec l’URL de la fonction.
 */
window.ANIMO_STRIPE_PAYMENT_LINKS = window.ANIMO_STRIPE_PAYMENT_LINKS || {
  // Exemple : 'https://buy.stripe.com/xxxx'
  'brosse-vapeur': '',
  'gourde-chien-3en1': '',
  'jouet-chat-interactif': '',
};

// Exemple Netlify : 'https://VOTRE-SITE.netlify.app/.netlify/functions/create-checkout-session'
window.ANIMO_STRIPE_CHECKOUT_URL = window.ANIMO_STRIPE_CHECKOUT_URL || '';
