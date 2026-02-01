
function viewBOQ() {
    // BOQ module exposes a render() function
    if (window.BOQ && typeof BOQ.render === 'function') {
        BOQ.render();
    } else {
        const msg = (window.I18N && typeof I18N.t === 'function') ? I18N.t('boq.notLoaded') : 'BOQ engine not loaded.';
        document.getElementById('main-content').innerHTML = `<div class="card"><p class="small muted">${msg}</p></div>`;
    }
}
