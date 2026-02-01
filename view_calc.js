
function viewCalc() {
    const title = (window.I18N && typeof I18N.t === 'function') ? I18N.t('nav.calc') : 'Calculations';
    const desc = (window.I18N && typeof I18N.t === 'function') ? I18N.t('calc.description') : 'All totals are calculated automatically based on input data.';
    document.getElementById('main-content').innerHTML = `
        <div class="card">
            <h2>${title}</h2>
            <p class="small muted">${desc}</p>
        </div>
    `;
}
