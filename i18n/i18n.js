(function(){
    window.I18N = (function(){
        const STORAGE_KEY = 'language';
        let lang = 'en';
        let resources = window.I18N_LOCALES || {};

        function init() {
            lang = localStorage.getItem(STORAGE_KEY) || 'en';
            apply();
            // wire language selector if exists
            const sel = document.getElementById('language');
            if (sel) {
                sel.value = lang;
                sel.addEventListener('change', e => setLanguage(e.target.value));
            }
        }

        function setLanguage(l) {
            if (!resources[l]) {
                console.warn('Language not found:', l);
                return;
            }
            lang = l;
            localStorage.setItem(STORAGE_KEY, lang);
            document.documentElement.lang = lang;
            document.documentElement.dir = (lang === 'ar') ? 'rtl' : 'ltr';
            apply();
            window.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang } }));
        }

        function t(key) {
            if (!key) return '';
            return (((resources[lang] || {})[key]) || key);
        }

        function apply() {
            // static translations: data-i18n -> textContent
            document.querySelectorAll('[data-i18n]').forEach(el => {
                const k = el.getAttribute('data-i18n');
                const v = t(k);
                if (el.tagName.toLowerCase() === 'input' || el.tagName.toLowerCase() === 'textarea') {
                    // placeholder or value
                    const placeholderKey = el.getAttribute('data-i18n-placeholder');
                    if (placeholderKey) el.placeholder = t(placeholderKey);
                    else el.value = v;
                } else if (el.tagName.toLowerCase() === 'option') {
                    el.textContent = v;
                } else {
                    el.textContent = v;
                }
            });

            // attributes support (data-i18n-title, data-i18n-placeholder)
            document.querySelectorAll('[data-i18n-title]').forEach(el => el.title = t(el.getAttribute('data-i18n-title')));
            document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
                if ('placeholder' in el) el.placeholder = t(el.getAttribute('data-i18n-placeholder'));
            });
        }

        // allow dynamic addition of resources (e.g., late-loaded language files)
        function addResources(obj) {
            resources = Object.assign({}, resources, obj || {});
        }

        return { init, setLanguage, t, addResources };
    })();
})();