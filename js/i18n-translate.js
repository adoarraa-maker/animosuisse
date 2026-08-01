/**
 * Sélecteur de langue AnimoSuisse + Google Translate Widget (caché).
 * Langues : Français (source), Deutsch, Italiano, English.
 */
(function () {
  const PAGE_LANG = 'fr';
  const LABELS = {
    fr: 'FR',
    de: 'DE',
    it: 'IT',
    en: 'EN',
  };

  function getCookie(name) {
    const match = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/([.$?*|{}()[\]\\/+^])/g, '\\$1') + '=([^;]*)'));
    return match ? decodeURIComponent(match[1]) : '';
  }

  function setCookie(name, value, days) {
    const maxAge = typeof days === 'number' ? `; max-age=${days * 24 * 60 * 60}` : '';
    const secure = location.protocol === 'https:' ? '; Secure' : '';
    document.cookie = `${name}=${encodeURIComponent(value)}; path=/${maxAge}; SameSite=Lax${secure}`;
    // Certains navigateurs exigent aussi le cookie sur le domaine courant
    try {
      const host = location.hostname;
      if (host && host.indexOf('.') !== -1) {
        document.cookie = `${name}=${encodeURIComponent(value)}; path=/; domain=.${host}${maxAge}; SameSite=Lax${secure}`;
      }
    } catch (e) {
      /* ignore */
    }
  }

  function clearGoogTransCookies() {
    const expire = 'Thu, 01 Jan 1970 00:00:00 GMT';
    document.cookie = `googtrans=; expires=${expire}; path=/`;
    try {
      const host = location.hostname;
      if (host) {
        document.cookie = `googtrans=; expires=${expire}; path=/; domain=${host}`;
        document.cookie = `googtrans=; expires=${expire}; path=/; domain=.${host}`;
      }
    } catch (e) {
      /* ignore */
    }
  }

  function readCurrentLang() {
    const raw = getCookie('googtrans') || '';
    // Formats: /fr/de  ou  /auto/de
    const parts = raw.split('/').filter(Boolean);
    if (parts.length >= 2) {
      const target = parts[parts.length - 1];
      if (LABELS[target]) return target;
    }
    const hash = (location.hash || '').match(/googtrans\((?:[a-z-]+)\|([a-z-]+)\)/i);
    if (hash && LABELS[hash[1]]) return hash[1];
    return PAGE_LANG;
  }

  function triggerGoogleCombo(lang) {
    const select = document.querySelector('select.goog-te-combo');
    if (!select) return false;
    select.value = lang === PAGE_LANG ? '' : lang;
    select.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  }

  function applyLanguage(lang) {
    const next = LABELS[lang] ? lang : PAGE_LANG;

    if (next === PAGE_LANG) {
      clearGoogTransCookies();
      if (location.hash && /googtrans/i.test(location.hash)) {
        history.replaceState(null, '', location.pathname + location.search);
      }
      // Retour FR : rechargement pour retirer la traduction
      location.reload();
      return;
    }

    setCookie('googtrans', `/${PAGE_LANG}/${next}`, 365);
    // Essai sans rechargement si le widget est prêt
    if (triggerGoogleCombo(next)) {
      updateSwitcherUI(next);
      return;
    }
    location.reload();
  }

  function updateSwitcherUI(lang) {
    document.querySelectorAll('[data-lang-switcher]').forEach((root) => {
      const label = root.querySelector('[data-lang-label]');
      if (label) label.textContent = LABELS[lang] || 'FR';
      root.querySelectorAll('[data-lang]').forEach((btn) => {
        const active = btn.getAttribute('data-lang') === lang;
        btn.classList.toggle('is-active', active);
        btn.setAttribute('aria-selected', active ? 'true' : 'false');
      });
    });
  }

  function closeMenus(except) {
    document.querySelectorAll('[data-lang-switcher]').forEach((root) => {
      if (except && root === except) return;
      const menu = root.querySelector('.lang-switcher-menu');
      const btn = root.querySelector('.lang-switcher-btn');
      if (menu) menu.hidden = true;
      if (btn) btn.setAttribute('aria-expanded', 'false');
      root.classList.remove('is-open');
    });
  }

  function initSwitcher() {
    const current = readCurrentLang();
    updateSwitcherUI(current);

    document.querySelectorAll('[data-lang-switcher]').forEach((root) => {
      const btn = root.querySelector('.lang-switcher-btn');
      const menu = root.querySelector('.lang-switcher-menu');
      if (!btn || !menu) return;

      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const open = menu.hidden;
        closeMenus();
        if (open) {
          menu.hidden = false;
          btn.setAttribute('aria-expanded', 'true');
          root.classList.add('is-open');
        }
      });

      menu.querySelectorAll('[data-lang]').forEach((item) => {
        item.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          const lang = item.getAttribute('data-lang') || PAGE_LANG;
          closeMenus();
          if (lang === readCurrentLang()) return;
          applyLanguage(lang);
        });
      });
    });

    document.addEventListener('click', () => closeMenus());
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeMenus();
    });
  }

  window.googleTranslateElementInit = function googleTranslateElementInit() {
    if (!window.google || !google.translate || !google.translate.TranslateElement) return;
    new google.translate.TranslateElement(
      {
        pageLanguage: PAGE_LANG,
        includedLanguages: 'fr,de,it,en',
        autoDisplay: false,
        layout: google.translate.TranslateElement.InlineLayout.SIMPLE,
      },
      'google_translate_element',
    );

    // Si un cookie de langue est déjà présent, synchroniser le combo
    const current = readCurrentLang();
    if (current && current !== PAGE_LANG) {
      setTimeout(() => triggerGoogleCombo(current), 400);
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSwitcher);
  } else {
    initSwitcher();
  }
})();
