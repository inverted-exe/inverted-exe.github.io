// Initialize current language from localStorage (persists across page navigation)
let currentLanguage = localStorage.getItem('selectedLanguage') || 'en';

document.addEventListener('DOMContentLoaded', ()=> {
  const burger = document.getElementById('burger');
  const mobileNav = document.getElementById('mobileNav');
  const header = document.querySelector('.site-header');

  // Check if on landing page
  const isLandingPage = document.querySelector('.landing-page') !== null;

  // (no body class manipulation) Leave DOM classes unchanged here

  // Build mobile nav menu
  let mobileMenuHTML = '';
  if (isLandingPage) {
    // On landing page, don't show landing menu
    mobileMenuHTML = `
      <a href="/shop" class="mobile-link" data-i18n="shop">shop</a>
      <a href="/archive" class="mobile-link" data-i18n="archive">.archive</a>
      <a href="/gallery" class="mobile-link" data-i18n="gallery">gallery</a>
      <a href="/inverted.exe" class="mobile-link" data-i18n="inverted.exe">inverted.exe</a>
    `;
  } else {
    // On other pages, show all menus
    mobileMenuHTML = `
      <a href="/shop" class="mobile-link" data-i18n="shop">shop</a>
      <a href="/archive" class="mobile-link" data-i18n="archive">.archive</a>
      <a href="/gallery" class="mobile-link" data-i18n="gallery">gallery</a>
      <a href="/inverted.exe" class="mobile-link" data-i18n="inverted.exe">inverted.exe</a>
    `;
  }
  mobileNav.innerHTML = mobileMenuHTML;

  // Burger menu toggle
  burger && burger.addEventListener('click', (e) => {
    burger.classList.toggle('open');
    mobileNav.classList.toggle('open');
    document.body.classList.toggle('mobile-nav-open');
    header.classList.toggle('mobile-nav-active');
    e.stopPropagation();
  });

  // Close mobile nav on link click
  document.querySelectorAll('.mobile-link').forEach(link => {
    link.addEventListener('click', () => {
      burger.classList.remove('open');
      mobileNav.classList.remove('open');
      document.body.classList.remove('mobile-nav-open');
      header.classList.remove('mobile-nav-active');
    });
  });

  // Scroll detection for header styling (on landing page)
  if (isLandingPage) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 100) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    });
  }

  // Pre-set currentLanguage when clicking brand/logo to avoid blinking on navigation
  const brandLink = document.querySelector('.brand a');
  if (brandLink) {
    brandLink.addEventListener('click', () => {
      // No need to pre-set, localStorage will handle it
    });
  }

  // Pre-set currentLanguage when clicking nav links to avoid blinking on navigation
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      // No need to pre-set, localStorage will handle it
    });
  });

  // Close mobile nav on outside click
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.mobile-nav-overlay') && !e.target.closest('.burger')) {
      burger.classList.remove('open');
      mobileNav.classList.remove('open');
      document.body.classList.remove('mobile-nav-open');
      header.classList.remove('mobile-nav-active');
    }
  });

  // Language toggle functionality
  const langBtns = document.querySelectorAll('.lang-btn');
  
  function reattachMobileListeners() {
    // Re-attach click event listeners to mobile links
    document.querySelectorAll('.mobile-link').forEach(link => {
      // Remove old listeners by cloning
      const newLink = link.cloneNode(true);
      link.parentNode.replaceChild(newLink, link);
      
      // Add new listener
      newLink.addEventListener('click', () => {
        burger.classList.remove('open');
        mobileNav.classList.remove('open');
      });
    });
  }
  
  function translatePage(lang) {
    // Skip translation if already in this language
    if (currentLanguage === lang) return;
    
    currentLanguage = lang;
    const elements = document.querySelectorAll('[data-i18n]');
    elements.forEach(el => {
      const key = el.dataset.i18n;
      if (translations && translations[lang] && translations[lang][key]) {
        // For links and elements with text nodes only
        if (el.tagName === 'A' || el.tagName === 'BUTTON' || !el.querySelector('*')) {
          el.textContent = translations[lang][key];
        } else {
          // For elements with child elements, only update the direct text
          el.textContent = translations[lang][key];
        }
      }
    });
    // Reattach mobile link listeners after translation
    reattachMobileListeners();
  }
  
  langBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const lang = btn.dataset.lang;
      
      // Remove active class from all buttons
      langBtns.forEach(b => b.classList.remove('active'));
      
      // Add active class to clicked button
      btn.classList.add('active');
      
      // Store language preference
      localStorage.setItem('selectedLanguage', lang);
      
      // Translate the page
      translatePage(lang);
      
      // Dispatch custom event for language change
      document.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang } }));
    });
  });

  // Load saved language preference and translate on page load
  const savedLang = localStorage.getItem('selectedLanguage') || 'en';
  const savedBtn = document.querySelector(`.lang-btn[data-lang="${savedLang}"]`);
  
  // Set active button
  langBtns.forEach(b => b.classList.remove('active'));
  if (savedBtn) {
    savedBtn.classList.add('active');
  } else {
    // Find English button as fallback
    const enBtn = document.querySelector(`.lang-btn[data-lang="en"]`);
    if (enBtn) enBtn.classList.add('active');
  }
  
  // Always translate on page load to ensure language is applied
  // Reset currentLanguage to null to force translation
  currentLanguage = null;
  translatePage(savedLang);
});