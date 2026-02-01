
function viewDashboard() {
    const title = (window.I18N && typeof I18N.t === 'function') ? I18N.t('nav.dashboard') : 'Dashboard';
    const welcome = (window.I18N && typeof I18N.t === 'function') ? I18N.t('dashboard.welcome') : 'Welcome to your BOQ SaaS Dashboard.';
    document.getElementById('main-content').innerHTML = `
        <div class="card">
            <h2>${title}</h2>
            <p class="small muted">${welcome}</p>
        </div>
    `;
}
