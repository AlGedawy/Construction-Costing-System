function viewDiagnostics() {
    const t = (k) => (window.I18N ? I18N.t(k) : k);
    const info = (window.Analytics && window.Analytics.getRuntimeInfo()) || { appVersion: 'unknown', environment: 'unknown'};
    const plausibleLoaded = (window.Analytics && window.Analytics.isPlausibleLoaded()) ? t('diag.checking') : t('diag.checking');
    const clarityLoaded  = (window.Analytics && window.Analytics.isClarityLoaded()) ? t('diag.checking') : t('diag.checking');

    document.getElementById('main-content').innerHTML = `
        <div class="card">
            <h2>${escapeHtml(t('diag.title') || 'Analytics & Diagnostics')}</h2>
            <div class="small muted">Quick health and telemetry checks.</div>

            <div style="margin-top:12px">
                <table class="table">
                    <tbody>
                        <tr><td>${escapeHtml(t('diag.appVersion') || 'App version')}</td><td class="right num">${escapeHtml(info.appVersion)}</td></tr>
                        <tr><td>${escapeHtml(t('diag.environment') || 'Environment')}</td><td class="right num">${escapeHtml(info.environment)}</td></tr>
                        <tr><td>${escapeHtml(t('diag.plausible') || 'Plausible')}</td><td class="right num">${escapeHtml(isPlausible() ? 'Loaded' : 'Not loaded')}</td></tr>
                        <tr><td>${escapeHtml(t('diag.clarity') || 'Microsoft Clarity')}</td><td class="right num">${escapeHtml(isClarity() ? 'Loaded' : 'Not loaded')}</td></tr>
                        <tr><td>${escapeHtml(t('diag.userAgent') || 'User Agent')}</td><td class="right small">${escapeHtml(navigator.userAgent)}</td></tr>
                    </tbody>
                </table>
            </div>

            <div style="margin-top:12px;display:flex;gap:8px;align-items:center">
                <button class="btn" id="btn-check-plausible">${escapeHtml(t('diag.plausible') || 'Check Plausible')}</button>
                <button class="btn" id="btn-check-clarity">${escapeHtml(t('diag.clarity') || 'Check Clarity')}</button>
                <button class="btn btn-danger" id="btn-trigger-error">${escapeHtml(t('diag.triggerError') || 'Trigger test error')}</button>
            </div>

            <div id="diag-output" style="margin-top:12px" class="small muted"></div>
        </div>
    `;

    function isPlausible(){ return (window.Analytics && window.Analytics.isPlausibleLoaded()); }
    function isClarity(){ return (window.Analytics && window.Analytics.isClarityLoaded()); }

    document.getElementById('btn-check-plausible').addEventListener('click', () => {
        const ok = isPlausible();
        const el = document.getElementById('diag-output');
        el.textContent = 'Plausible loaded: ' + (ok ? 'Yes' : 'No');
    });
    document.getElementById('btn-check-clarity').addEventListener('click', () => {
        const ok = isClarity();
        const el = document.getElementById('diag-output');
        el.textContent = 'Clarity loaded: ' + (ok ? 'Yes' : 'No');
    });

    document.getElementById('btn-trigger-error').addEventListener('click', () => {
        // Trigger a test error to exercise error handlers (caught by window.onerror)
        try {
            // create a reference error
            nonExistentFunctionCall();
        } catch (e) {
            // intentionally rethrow to hit global handlers
            setTimeout(() => { throw e; }, 0);
        }
    });
}

// small helper used in this file; bring in from BOQ utils (but avoid coupling)
function escapeHtml(s) {
    return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}