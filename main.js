
function setLanguage() {
    const lang = document.getElementById('language').value;
    if (window.I18N && typeof I18N.setLanguage === 'function') {
        I18N.setLanguage(lang);
    } else {
        document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
        localStorage.setItem('language', lang);
    }
}
document.addEventListener('DOMContentLoaded', () => {
    // Initialize i18n first (if available)
    if (window.I18N && typeof I18N.init === 'function') I18N.init();

    // Initialize plan UI (monetization)
    if (window.PlanUI && typeof PlanUI.init === 'function') PlanUI.init();

    // Ensure language selector is in sync
    const savedLang = localStorage.getItem('language') || 'en';
    document.getElementById('language').value = savedLang;
    document.getElementById('language').addEventListener('change', setLanguage);

    // re-render dynamic views when language changes
    window.addEventListener('languageChanged', () => {
        if (window.BOQ && typeof BOQ.render === 'function') BOQ.render();
        if (document.getElementById('main-content') && document.getElementById('main-content').children.length === 0) viewDashboard();
    });

    // re-check plan display when plan changes
    window.addEventListener('planChanged', () => { if (window.BOQ && typeof BOQ.render === 'function') BOQ.render(); });

    // Render dashboard by default
    viewDashboard();
});
