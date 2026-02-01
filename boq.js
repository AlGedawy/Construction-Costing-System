// BOQ Engine and persistence (plain JS)
const BOQ = (function () {
    const STORAGE_KEY = 'boq_projects_v1';

    // Helper: uid
    function uid(prefix = 'id') {
        return prefix + '_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 7);
    }

    // Helper: deep clone
    function clone(obj) { return JSON.parse(JSON.stringify(obj)); }

    // Default empty project
    function newProject(name = 'Untitled Project') {
        return {
            id: uid('proj'),
            name,
            taxPercent: 0,
            sections: [
                { id: uid('sec'), title: 'Section 1', rows: [ newRow() ] }
            ]
        };
    }
    function newRow() {
        return { id: uid('row'), description: '', quantity: 0, unit: '', rate: 0 };
    }

    // State
    let projects = loadAllProjects();
    let current = projects.length ? clone(projects[0]) : newProject();

    // STORAGE
    function loadAllProjects() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            return raw ? JSON.parse(raw) : [];
        } catch (e) {
            console.error('Failed to parse projects from localStorage', e);
            return [];
        }
    }
    function persistProjects(list) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(list || []));
    }

    // Project CRUD
    function saveCurrentProject() {
        projects = loadAllProjects();
        const idx = projects.findIndex(p => p.id === current.id);
        if (idx >= 0) projects[idx] = clone(current);
        else projects.push(clone(current));
        persistProjects(projects);
        render(); // refresh UI to update project list
    }
    function deleteProjectById(id) {
        projects = loadAllProjects().filter(p => p.id !== id);
        persistProjects(projects);
        // if current project was deleted, switch to another or new
        if (current.id === id) {
            projects = loadAllProjects();
            current = projects.length ? clone(projects[0]) : newProject();
        }
        render();
    }
    function loadProjectById(id) {
        const p = loadAllProjects().find(x => x.id === id);
        if (p) {
            current = clone(p);
            render();
        }
    }
    function createNewProject() {
        current = newProject();
        render();
    }

    // Calculations
    function rowTotal(row) {
        const q = parseFloat(row.quantity) || 0;
        const r = parseFloat(row.rate) || 0;
        return round(q * r);
    }
    function sectionSubtotal(section) {
        return round(section.rows.reduce((s, r) => s + rowTotal(r), 0));
    }
    function totals() {
        const subtotal = current.sections.reduce((s, sec) => s + sectionSubtotal(sec), 0);
        const taxPercent = parseFloat(current.taxPercent) || 0;
        const taxAmount = round(subtotal * (taxPercent / 100));
        const grand = round(subtotal + taxAmount);
        return { subtotal, taxAmount, grand };
    }

    function round(n) { return Math.round((n + Number.EPSILON) * 100) / 100; }

    // Render
    function render() {
        const container = document.getElementById('main-content');
        container.innerHTML = renderMain();
        attachHandlers(container);
        updateTotalsInDOM();
        // update plan-related UI (disable buttons when limits reached)
        updatePlanControls(container);
    }

    // Build HTML
    function renderMain() {
        const t = k => (window.I18N ? I18N.t(k) : k);
        const projOptions = loadAllProjects().map(p => `<option value="${p.id}" ${p.id===current.id ? 'selected' : ''}>${escapeHtml(p.name)}</option>`).join('');
        return `
            <div class="card">
                <div class="project-toolbar toolbar">
                    <div class="project-selector inline">
                        <input class="input" id="project-name" value="${escapeHtml(current.name)}" style="min-width:220px" />
                        <select id="project-list" class="input small">
                            <option value="">${escapeHtml(t('project.savedProjectsPlaceholder') || '-- Saved projects --')}</option>
                            ${projOptions}
                        </select>
                        <button class="btn" id="btn-load">${escapeHtml(t('project.load') || 'Load')}</button>
                        <button class="btn btn-danger" id="btn-delete">${escapeHtml(t('project.delete') || 'Delete')}</button>
                    </div>
                    <div class="margin-left-auto inline">
                        <button class="btn" id="btn-new">${escapeHtml(t('project.new') || 'New')}</button>
                        <button class="btn btn-primary" id="btn-save">${escapeHtml(t('project.save') || 'Save')}</button>
                        <div class="inline" style="margin-left:12px;gap:6px">
                            <button class="btn" id="btn-export-pdf">${escapeHtml(t('export.pdf') || 'Export PDF')}</button>
                            <button class="btn" id="btn-export-xlsx">${escapeHtml(t('export.xlsx') || 'Export XLSX')}</button>
                            <button class="btn" id="btn-export-csv">${escapeHtml(t('export.csv') || 'Export CSV')}</button>
                            <label class="btn btn-ghost" style="cursor:pointer">${escapeHtml(t('import.label') || 'Import')}
                                <input id="import-file" type="file" accept=".xlsx,.xls,.csv" style="display:none" />
                            </label>
                        </div>
                    </div>
                </div>

                <div class="toolbar" style="margin-top:12px;gap:16px;align-items:center;">
                    <button class="btn" id="btn-add-section">${escapeHtml(t('add.section') || '+ Add Section')}</button>
                    <div class="inline small muted">${escapeHtml(t('tax.label') || 'Tax')}: <input id="tax-percent" class="input small" value="${escapeHtml(String(current.taxPercent))}" style="width:72px;margin-left:8px" /> %</div>
                </div>
            </div>

            ${current.sections.map(s => renderSection(s)).join('')}

            <div class="card">
                <table class="table" aria-hidden="false">
                    <tbody>
                        <tr><td class="muted">${escapeHtml(t('totals.subtotal') || 'Subtotal')}</td><td class="right num" id="subtotal-val">0.00</td></tr>
                        <tr><td class="muted">${escapeHtml(t('totals.tax') || 'Tax')} (${escapeHtml(String(current.taxPercent))}%)</td><td class="right num" id="tax-val">0.00</td></tr>
                        <tr><td class="muted">${escapeHtml(t('totals.grand') || 'Grand Total')}</td><td class="right num" id="grand-val">0.00</td></tr>
                    </tbody>
                </table>
            </div>
        `;
    }

    function renderSection(section) {
        const t = k => (window.I18N ? I18N.t(k) : k);
        return `
        <div class="card section" data-section-id="${section.id}">
            <div class="section-header">
                <div class="inline">
                    <input class="input section-title" data-action="edit-section-title" data-section-id="${section.id}" value="${escapeHtml(section.title)}" />
                    <button class="btn btn-ghost" data-action="add-row" data-section-id="${section.id}">${escapeHtml(t('add.row') || '+ Row')}</button>
                </div>
                <div class="section-actions">
                    <div class="small muted">${escapeHtml(t('section.subtotal') || 'Section Subtotal')}: <strong id="sec-sub-${section.id}">0.00</strong></div>
                    <button class="btn btn-danger" data-action="delete-section" data-section-id="${section.id}">${escapeHtml(t('section.delete') || 'Delete Section')}</button>
                </div>
            </div>
            <table class="table" data-section-id="${section.id}">
                <thead>
                    <tr><th style="width:36%">${escapeHtml(t('table.description') || 'Item description')}</th><th>${escapeHtml(t('table.quantity') || 'Quantity')}</th><th>${escapeHtml(t('table.unit') || 'Unit')}</th><th>${escapeHtml(t('table.rate') || 'Rate')}</th><th class="num">${escapeHtml(t('table.total') || 'Total')}</th><th class="center">${escapeHtml(t('table.actions') || 'Actions')}</th></tr>
                </thead>
                <tbody>
                    ${section.rows.map(r => renderRow(section.id, r)).join('')}
                </tbody>
            </table>
        </div>
        `;
    }

    function renderRow(sectionId, row) {
        const t = k => (window.I18N ? I18N.t(k) : k);
        return `
            <tr data-row-id="${row.id}" data-section-id="${sectionId}">
                <td><input class="input" data-action="edit-row" data-section-id="${sectionId}" data-row-id="${row.id}" data-field="description" value="${escapeHtml(row.description)}" /></td>
                <td><input class="input small" type="number" min="0" data-action="edit-row" data-section-id="${sectionId}" data-row-id="${row.id}" data-field="quantity" value="${escapeHtml(String(row.quantity))}" /></td>
                <td><input class="input small" data-action="edit-row" data-section-id="${sectionId}" data-row-id="${row.id}" data-field="unit" value="${escapeHtml(row.unit)}" /></td>
                <td><input class="input small" type="number" min="0" step="0.01" data-action="edit-row" data-section-id="${sectionId}" data-row-id="${row.id}" data-field="rate" value="${escapeHtml(String(row.rate))}" /></td>
                <td class="num"><span class="row-total" id="row-total-${row.id}">${formatNumber(rowTotal(row))}</span></td>
                <td class="center">
                    <button class="btn" data-action="duplicate-row" data-section-id="${sectionId}" data-row-id="${row.id}">${escapeHtml(t('row.copy') || 'Copy')}</button>
                    <button class="btn btn-danger" data-action="delete-row" data-section-id="${sectionId}" data-row-id="${row.id}">${escapeHtml(t('row.delete') || 'Delete')}</button>
                </td>
            </tr>
        `;
    }

    // Event wiring using delegation
    function attachHandlers(container) {
        // Project toolbar buttons
        container.querySelector('#btn-new').addEventListener('click', e => {
            const existing = loadAllProjects().length;
            if (window.PlanConfig && !PlanConfig.canCreateProject(existing)) {
                // show upgrade modal
                if (window.PlanUI && typeof PlanUI.showUpgradeModal === 'function') PlanUI.showUpgradeModal('projects');
                showToast(window.I18N ? I18N.t('paywall.projectsReached') : 'Project limit reached — upgrade to Pro.', true);
                return;
            }
            createNewProject();
        });
        container.querySelector('#btn-save').addEventListener('click', e => { saveCurrentProject(); showToast(window.I18N ? I18N.t('toast.saved') : 'Saved project'); });
        container.querySelector('#btn-load').addEventListener('click', e => {
            const sel = container.querySelector('#project-list');
            if (sel && sel.value) loadProjectById(sel.value);
        });
        container.querySelector('#btn-delete').addEventListener('click', e => {
            const sel = container.querySelector('#project-list');
            if (sel && sel.value) {
                if (confirm(window.I18N ? I18N.t('confirm.deleteProject') : 'Delete selected project?')) {
                    deleteProjectById(sel.value);
                    showToast(window.I18N ? I18N.t('toast.deleted') : 'Project deleted');
                }
            } else {
                showToast(window.I18N ? I18N.t('project.chooseSaved') : 'Choose a saved project first', true);
            }
        });

        container.querySelector('#project-list').addEventListener('change', e => {
            // no auto-load; user clicks Load
        });

        // tax input
        const taxEl = container.querySelector('#tax-percent');
        taxEl.addEventListener('input', e => {
            const v = parseFloat(e.target.value) || 0;
            current.taxPercent = round(v);
            updateTotalsInDOM();
        });

        // project name
        const pname = container.querySelector('#project-name');
        pname.addEventListener('input', e => {
            current.name = e.target.value;
            // update select label if exists
            renderProjectOptions(); // cheap update
        });

        // add section
        container.querySelector('#btn-add-section').addEventListener('click', e => {
            // adding a section implicitly adds an item; check item limits
            if (window.PlanConfig && !PlanConfig.canAddItemToProject(current)) {
                if (window.PlanUI && typeof PlanUI.showUpgradeModal === 'function') PlanUI.showUpgradeModal('items');
                showToast(window.I18N ? I18N.t('paywall.itemsReached') : 'Item limit reached — upgrade to Pro.', true);
                return;
            }
            current.sections.push({ id: uid('sec'), title: 'New Section', rows: [ newRow() ] });
            render();
        });

        // export / import handlers
        const btnExportPdf = container.querySelector('#btn-export-pdf');
        if (btnExportPdf) btnExportPdf.addEventListener('click', exportPDF);
        const btnExportXlsx = container.querySelector('#btn-export-xlsx');
        if (btnExportXlsx) btnExportXlsx.addEventListener('click', exportExcel);
        const btnExportCsv = container.querySelector('#btn-export-csv');
        if (btnExportCsv) btnExportCsv.addEventListener('click', exportCSV);
        const importFileEl = container.querySelector('#import-file');
        if (importFileEl) importFileEl.addEventListener('change', handleImport);

        // Delegated events for section/row actions and input edits
        container.addEventListener('click', e => {
            const a = e.target.closest('button');
            if (!a) return;
            const action = a.dataset.action;
            if (!action) return;

            const sectionId = a.dataset.sectionId;
            const rowId = a.dataset.rowId;
            if (action === 'add-row') {
                const sec = current.sections.find(s => s.id === sectionId);
                if (sec) {
                    if (window.PlanConfig && !PlanConfig.canAddItemToProject(current)) {
                        if (window.PlanUI && typeof PlanUI.showUpgradeModal === 'function') PlanUI.showUpgradeModal('items');
                        showToast(window.I18N ? I18N.t('paywall.itemsReached') : 'Item limit reached — upgrade to Pro.', true);
                        return;
                    }
                    sec.rows.push(newRow()); render();
                }
            } else if (action === 'delete-row') {
                const sec = current.sections.find(s => s.id === sectionId);
                if (sec) { sec.rows = sec.rows.filter(r => r.id !== rowId); render(); }
            } else if (action === 'delete-section') {
                current.sections = current.sections.filter(s => s.id !== sectionId);
                if (!current.sections.length) current.sections.push({ id: uid('sec'), title: 'Section 1', rows: [ newRow() ] });
                render();
            } else if (action === 'duplicate-row') {
                const sec = current.sections.find(s => s.id === sectionId);
                if (sec) {
                    const row = sec.rows.find(r => r.id === rowId);
                    if (row) {
                        const copy = clone(row); copy.id = uid('row');
                        sec.rows.push(copy);
                        render();
                    }
                }
            }
        });

        // inputs (edit section title, row fields)
        container.addEventListener('input', e => {
            const target = e.target;
            const action = target.dataset.action;
            if (!action) return;
            const sectionId = target.dataset.sectionId;
            const rowId = target.dataset.rowId;
            const field = target.dataset.field;

            if (action === 'edit-section-title') {
                const sec = current.sections.find(s => s.id === target.dataset.sectionId);
                if (sec) sec.title = target.value;
                renderProjectOptions(); // keep project list up to date
            } else if (action === 'edit-row') {
                const sec = current.sections.find(s => s.id === sectionId);
                if (!sec) return;
                const row = sec.rows.find(r => r.id === rowId);
                if (!row) return;
                if (field === 'quantity' || field === 'rate') {
                    row[field] = target.value === '' ? 0 : Number(target.value);
                } else {
                    row[field] = target.value;
                }
                // update only affected row total and section subtotal and totals
                updateRowAndSectionTotals(row, sec);
            }
        });
    }

    // Update only DOM totals (not re-render entire UI)
    function updateRowAndSectionTotals(row, section) {
        const rowSum = rowTotal(row);
        const rowEl = document.getElementById('row-total-' + row.id);
        if (rowEl) rowEl.textContent = formatNumber(rowSum);
        const secSubEl = document.getElementById('sec-sub-' + section.id);
        if (secSubEl) secSubEl.textContent = formatNumber(sectionSubtotal(section));
        updateTotalsInDOM();
        // after changes, update plan controls too (limits may be reached)
        updatePlanControls(document.getElementById('main-content'));
    }

    function updateTotalsInDOM() {
        const t = totals();
        document.getElementById('subtotal-val').textContent = formatNumber(t.subtotal);
        document.getElementById('tax-val').textContent = formatNumber(t.taxAmount);
        document.getElementById('grand-val').textContent = formatNumber(t.grand);

        // update per-section subtotals
        current.sections.forEach(s => {
            const el = document.getElementById('sec-sub-' + s.id);
            if (el) el.textContent = formatNumber(sectionSubtotal(s));
        });
    }

    function renderProjectOptions() {
        // update the select options (used when project name changes)
        const sel = document.getElementById('project-list');
        if (!sel) return;
        const list = loadAllProjects();
        const placeholder = (window.I18N ? I18N.t('project.savedProjectsPlaceholder') : '-- Saved projects --');
        sel.innerHTML = `<option value="">${escapeHtml(placeholder)}</option>` + list.map(p => `<option value="${p.id}" ${p.id===current.id ? 'selected' : ''}>${escapeHtml(p.name)}</option>`).join('');
        // update the New button enabled state
        updatePlanControls(document.getElementById('main-content'));
    }

    // Export / Import helpers
    function exportPDF() {
        if (!window.jspdf || !window.jspdf.jsPDF) { showToast('jsPDF is not loaded', true); return; }
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ unit: 'pt', format: 'a4' });
        let y = 40;
        doc.setFontSize(14);
        doc.text(`${current.name} - BOQ`, 40, y); y += 20;
        doc.setFontSize(10);
        doc.text(`Date: ${new Date().toLocaleString()}`, 40, y); y += 20;
        current.sections.forEach(section => {
            if (y > 740) { doc.addPage(); y = 40; }
            const t = k => (window.I18N ? I18N.t(k) : k);
            doc.setFontSize(12);
            doc.text(section.title, 40, y); y += 16;
            doc.setFontSize(9);
            doc.text(t('table.description'), 42, y);
            doc.text(t('table.quantity'), 300, y);
            doc.text(t('table.unit'), 350, y);
            doc.text(t('table.rate'), 400, y);
            doc.text(t('table.total'), 470, y);
            y += 12;
            section.rows.forEach(row => {
                if (y > 740) { doc.addPage(); y = 40; }
                doc.text(truncate(row.description || '', 70), 42, y);
                doc.text(String(row.quantity || 0), 300, y);
                doc.text(String(row.unit || ''), 350, y);
                doc.text(String(row.rate || 0), 400, y);
                doc.text(formatNumber(rowTotal(row)), 470, y);
                y += 12;
            });
            doc.setFontSize(10);
            doc.text(`${t('section.subtotal')}: ${formatNumber(sectionSubtotal(section))}`, 42, y); y += 18;
        });
        const t = totals();
        doc.setFontSize(11);
        doc.text(`Subtotal: ${formatNumber(t.subtotal)}`, 40, y); y += 12;
        doc.text(`Tax (${current.taxPercent}%): ${formatNumber(t.taxAmount)}`, 40, y); y += 12;
        doc.text(`Grand Total: ${formatNumber(t.grand)}`, 40, y); y += 12;
        const filename = `${(current.name||'project').replace(/[^a-z0-9_-]/ig,'_')}_BOQ.pdf`;
        doc.save(filename);
        showToast((window.I18N ? I18N.t('export.pdf') : 'Export PDF') + ' · ' + (window.I18N ? I18N.t('export.done') : 'Downloaded'));
    }

    function exportExcel() {
        if (!window.XLSX) { showToast('SheetJS (XLSX) not loaded', true); return; }
        const wb = XLSX.utils.book_new();
        current.sections.forEach(section => {
            const data = [];
            data.push(['Description','Quantity','Unit','Rate','Total']);
            section.rows.forEach(r => data.push([r.description, r.quantity, r.unit, r.rate, rowTotal(r)]));
            data.push([]);
            data.push([ (window.I18N ? I18N.t('section.subtotal') : 'Section Subtotal'), '', '', '', '', sectionSubtotal(section) ]);
            const ws = XLSX.utils.aoa_to_sheet(data);
            XLSX.utils.book_append_sheet(wb, ws, sanitizeSheetName(section.title));
        });
        // Summary sheet
        const t = totals();
        const summary = [[ (window.I18N ? I18N.t('totals.subtotal') : 'Subtotal'), t.subtotal], [ (window.I18N ? I18N.t('totals.tax') : 'Tax (%)'), current.taxPercent], [ (window.I18N ? I18N.t('totals.tax') : 'Tax amount'), t.taxAmount], [ (window.I18N ? I18N.t('totals.grand') : 'Grand total'), t.grand ]];
        const wsSum = XLSX.utils.aoa_to_sheet(summary);
        XLSX.utils.book_append_sheet(wb, wsSum, 'Summary');
        const filename = `${(current.name||'project').replace(/[^a-z0-9_-]/ig,'_')}_BOQ.xlsx`;
        XLSX.writeFile(wb, filename);
        showToast((window.I18N ? I18N.t('export.xlsx') : 'Export XLSX') + ' · ' + (window.I18N ? I18N.t('export.done') : 'Downloaded'));
    }

    function exportCSV() {
        if (!window.XLSX) { showToast('SheetJS (XLSX) not loaded', true); return; }
        const rows = [];
        rows.push(['Section','Description','Quantity','Unit','Rate','Total']);
        current.sections.forEach(section => {
            section.rows.forEach(r => {
                rows.push([section.title, r.description, r.quantity, r.unit, r.rate, rowTotal(r)]);
            });
        });
        const ws = XLSX.utils.aoa_to_sheet(rows);
        const csv = XLSX.utils.sheet_to_csv(ws);
        downloadBlob(new Blob([csv], {type: 'text/csv;charset=utf-8;'}), `${(current.name||'project').replace(/[^a-z0-9_-]/ig,'_')}_BOQ.csv`);
        showToast((window.I18N ? I18N.t('export.csv') : 'Export CSV') + ' · ' + (window.I18N ? I18N.t('export.done') : 'Downloaded'));
    }

    function handleImport(e) {
        const f = e.target.files[0];
        if (!f) return;
        if (!window.XLSX) { showToast('SheetJS (XLSX) not loaded', true); e.target.value=''; return; }
        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                const data = ev.target.result;
                const wb = XLSX.read(data, { type: 'array' });
                wb.SheetNames.forEach(sheetName => {
                    const ws = wb.Sheets[sheetName];
                    const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
                    const sectionRows = [];
                    for (let i=0;i<rows.length;i++) {
                        const row = rows[i];
                        if (!row || row.length === 0) continue;
                        // skip header if it looks like header
                        if (i===0 && row.some(c => typeof c === 'string' && /description|desc|item/i.test(String(c)))) continue;
                        const desc = row[0] || '';
                        const qty = Number(row[1]) || 0;
                        const unit = row[2] || '';
                        const rate = Number(row[3]) || 0;
                        if (!desc && !qty && !rate) continue;
                        sectionRows.push({ id: uid('row'), description: String(desc), quantity: qty, unit: unit, rate: rate });
                    }
                    if (sectionRows.length) current.sections.push({ id: uid('sec'), title: `Imported - ${sheetName}`, rows: sectionRows });
                });
                render();
                showToast(window.I18N ? I18N.t('import.complete') : 'Import complete');
            } catch(err) {
                console.error(err);
                showToast(window.I18N ? I18N.t('import.failed') : 'Import failed', true);
            }
            e.target.value = '';
        };
        reader.readAsArrayBuffer(f);
    }

    function sanitizeSheetName(name) {
        return String(name).replace(/[\\/?*\\[\\]:]/g, ' ').slice(0, 31);
    }

    function truncate(s, len) {
        s = s || '';
        return s.length <= len ? s : s.slice(0, len-1) + '…';
    }

    function downloadBlob(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1500);
    }

    // Plan-related UI updates
    function updatePlanControls(container) {
        if (!container || !window.PlanConfig) return;
        // Disable New project button if limit reached
        const btnNew = container.querySelector('#btn-new');
        const existing = loadAllProjects().length;
        if (btnNew) {
            if (!PlanConfig.canCreateProject(existing)) {
                btnNew.disabled = true;
                btnNew.title = window.I18N ? I18N.t('paywall.projectsReached') : 'Project limit reached';
            } else {
                btnNew.disabled = false;
                btnNew.title = '';
            }
        }
        // For add-row buttons, disable if item limit reached
        const addRowButtons = container.querySelectorAll('button[data-action="add-row"]');
        addRowButtons.forEach(b => {
            if (!PlanConfig.canAddItemToProject(current)) {
                b.disabled = true;
                b.title = window.I18N ? I18N.t('paywall.itemsReached') : 'Item limit reached';
            } else {
                b.disabled = false;
                b.title = '';
            }
        });
        // update plan status in header (in case changed externally)
        if (window.PlanUI && typeof PlanUI.updateStatus === 'function') PlanUI.updateStatus();
    }

    // Utils
    function formatNumber(n) { return (n === undefined || n === null) ? '0.00' : n.toFixed(2); }
    function escapeHtml(s) {
        return String(s)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    // small toast
    function showToast(text, isError = false) {
        const existing = document.getElementById('boq-toast');
        if (existing) existing.remove();
        const div = document.createElement('div');
        div.id = 'boq-toast';
        div.textContent = text;
        div.style.position = 'fixed';
        div.style.right = '18px';
        div.style.bottom = '18px';
        div.style.background = isError ? '#fee2e2' : '#e6f0ff';
        div.style.color = '#0b1f3b';
        div.style.border = '1px solid #cfe0ff';
        div.style.padding = '10px 12px';
        div.style.borderRadius = '8px';
        div.style.boxShadow = '0 8px 20px rgba(2,6,23,0.08)';
        document.body.appendChild(div);
        setTimeout(() => div.remove(), 2200);
    }

    // Public API
    return {
        render,
        saveCurrentProject,
        loadAllProjects
    };
})();