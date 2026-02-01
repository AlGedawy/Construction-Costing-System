(function(){
    window.PlanUI = (function(){
        let modal = null;
        function init() {
            // wire header button
            const btn = document.getElementById('btn-plans');
            updateStatus();
            if (btn) btn.addEventListener('click', e => openModal());
            window.addEventListener('planChanged', () => updateStatus());
        }
        function updateStatus() {
            const el = document.getElementById('plan-status');
            if (!el || !window.PlanConfig) return;
            const p = PlanConfig.getPlan();
            const info = PlanConfig.getPlanInfo();
            el.textContent = (p === 'pro') ? `${info.name} plan (unlocked)` : `${info.name} plan`;
            el.classList.toggle('plan-pro', p === 'pro');
        }
        function openModal() {
            if (!modal) buildModal();
            modal.classList.add('open');
        }
        function closeModal() { if (modal) modal.classList.remove('open'); }

        function buildModal() {
            modal = document.createElement('div');
            modal.className = 'plan-modal';
            modal.innerHTML = `
                <div class="plan-modal-card card">
                    <button class="btn btn-ghost plan-modal-close" aria-label="Close">×</button>
                    <h3>Plans & Pricing</h3>
                    <p class="small muted">Compare Free and Pro plans.</p>
                    <div class="plans-grid">
                        <div class="plan-card card">
                            <h4>Free</h4>
                            <ul class="small">
                                <li>Up to <strong>${PlanConfig.PLANS.free.maxProjects}</strong> projects</li>
                                <li>Up to <strong>${PlanConfig.PLANS.free.maxItemsPerProject}</strong> items / project</li>
                            </ul>
                            <div class="small muted">Suitable for small tests and evaluation.</div>
                            <div style="margin-top:8px">
                                <button class="btn" data-action="simulate-free">Use Free</button>
                            </div>
                        </div>
                        <div class="plan-card card">
                            <h4>Pro</h4>
                            <ul class="small">
                                <li>Unlimited projects</li>
                                <li>Unlimited items</li>
                                <li>Priority support</li>
                            </ul>
                            <div class="small muted">Ideal for professionals and teams.</div>
                            <div style="margin-top:8px;display:flex;gap:8px;align-items:center">
                                <a class="btn btn-primary" href="#" data-action="checkout">Upgrade to Pro</a>
                                <button class="btn" data-action="simulate-pro">Simulate Upgrade</button>
                            </div>
                            <div class="small muted" style="margin-top:8px">TODO: Replace Upgrade link with real checkout URL (Gumroad / LemonSqueezy)</div>
                        </div>
                    </div>
                    <div style="margin-top:12px;text-align:right">
                        <button class="btn btn-ghost" data-action="close">Close</button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);

            // handlers
            modal.querySelector('[data-action="simulate-pro"]').addEventListener('click', e => {
                PlanConfig.setPlan('pro');
                showModalMessage('Upgraded to Pro (simulated)');
                updateStatus();
            });
            modal.querySelector('[data-action="simulate-free"]').addEventListener('click', e => {
                PlanConfig.setPlan('free');
                showModalMessage('Switched to Free');
                updateStatus();
            });
            // checkout opens a dummy URL; keep it placeholder
            modal.querySelector('[data-action="checkout"]').addEventListener('click', e => {
                e.preventDefault();
                // TODO: replace with real checkout link (Gumroad / LemonSqueezy)
                const checkoutUrl = 'https://example.com/checkout?provider=placeholder';
                window.open(checkoutUrl, '_blank');
            });
            modal.querySelector('[data-action="close"]').addEventListener('click', closeModal);
            modal.querySelector('.plan-modal-close').addEventListener('click', closeModal);
        }

        function showModalMessage(text) {
            const notice = document.createElement('div');
            notice.className = 'small muted';
            notice.textContent = text;
            const card = modal.querySelector('.plan-modal-card');
            card.appendChild(notice);
            setTimeout(() => notice.remove(), 2200);
        }

        function showUpgradeModal(reason) {
            if (!modal) buildModal();
            openModal();
            // optionally show reason
            if (reason) showModalMessage(reason === 'projects' ? 'Project limit reached — upgrade to Pro.' : 'Item limit reached — upgrade to Pro.');
        }

        return { init, openModal, closeModal, updateStatus, showUpgradeModal };
    })();
})();