
function setLanguage() {
    const lang = document.getElementById('language').value;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    localStorage.setItem('language', lang);
}
document.addEventListener('DOMContentLoaded', () => {
    const savedLang = localStorage.getItem('language') || 'en';
    document.getElementById('language').value = savedLang;
    setLanguage();
    document.getElementById('language').addEventListener('change', setLanguage);
});
