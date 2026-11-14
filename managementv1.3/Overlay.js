(function () {
    // Éviter la double injection
    if (document.getElementById('kabuto-floating-wrapper')) return;

    // Création du conteneur flottant principal
    const wrapper = document.createElement('div');
    wrapper.id = 'kabuto-floating-wrapper';
    Object.assign(wrapper.style, {
        position: 'fixed',
        top: '70px',
        right: '20px',
        width: '440px',
        height: '640px',
        zIndex: '2147483640',
        backgroundColor: '#0b1120',
        border: '1px solid #24324d',
        borderRadius: '14px',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.75)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        resize: 'both',
        minWidth: '340px',
        minHeight: '260px'
    });

    // Barre de titre
    const dragBar = document.createElement('div');
    Object.assign(dragBar.style, {
        backgroundColor: '#131c31',
        borderBottom: '1px solid #24324d',
        padding: '8px 12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        cursor: 'move',
        userSelect: 'none',
        color: '#f1f5f9',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontSize: '12px',
        fontWeight: '700'
    });

    dragBar.innerHTML = `
        <span style="display:flex;align-items:center;gap:6px;">
            <span style="width:8px;height:8px;border-radius:50%;background:#10b981;display:inline-block;"></span>
            KABUTO'S System (Overlay)
        </span>
        <div style="display:flex;gap:6px;">
            <button id="kabuto-btn-compact" style="background:#090e1a;border:1px solid #24324d;color:#94a3b8;border-radius:6px;padding:2px 8px;cursor:pointer;font-size:11px;">Petit Carré</button>
            <button id="kabuto-btn-minimize" style="background:#090e1a;border:1px solid #24324d;color:#f1f5f9;border-radius:6px;padding:2px 8px;cursor:pointer;font-size:11px;">—</button>
        </div>
    `;

    // Iframe
    const iframe = document.createElement('iframe');
    iframe.id = 'kabuto-app-frame';
    iframe.src = chrome.runtime.getURL('index.html');
    Object.assign(iframe.style, {
        width: '100%',
        height: '100%',
        border: 'none',
        flexGrow: '1',
        backgroundColor: '#0b1120'
    });

    wrapper.appendChild(dragBar);
    wrapper.appendChild(iframe);
    document.body.appendChild(wrapper);

    /* =========================================================
       LE PONT DE COMMUNICATION (CORRECTION MAJEURE)
       ========================================================= */
       
    // A. De l'App (iframe) vers Pocket Option (page)
    window.addEventListener('message', (event) => {
        // On vérifie que le message vient de notre iframe
        if (event.data && event.data.source === 'KABUTO_APP') {
            // On le relaie à la page parente pour que pocket_bridge.js le capte
            window.postMessage(event.data, '*');
        }
    });

    // B. De Pocket Option (page) vers l'App (iframe)
    window.addEventListener('message', (event) => {
        // On vérifie que le message vient du bridge
        if (event.data && event.data.source === 'POCKET_BRIDGE') {
            // On le relaie à l'iframe
            if (iframe.contentWindow) {
                iframe.contentWindow.postMessage(event.data, '*');
            }
        }
    });

    /* =========================================================
       FIN DU PONT DE COMMUNICATION
       ========================================================= */

    // Logique de déplacement (Drag)
    let isDragging = false, offsetX = 0, offsetY = 0;
    dragBar.addEventListener('mousedown', (e) => {
        if (e.target.tagName === 'BUTTON') return;
        isDragging = true;
        offsetX = e.clientX - wrapper.getBoundingClientRect().left;
        offsetY = e.clientY - wrapper.getBoundingClientRect().top;
        iframe.style.pointerEvents = 'none';
    });

    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        wrapper.style.left = `${Math.max(0, e.clientX - offsetX)}px`;
        wrapper.style.top = `${Math.max(0, e.clientY - offsetY)}px`;
        wrapper.style.right = 'auto';
    });

    document.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            iframe.style.pointerEvents = 'auto';
        }
    });

    // Bouton Réduire
    let isMinimized = false;
    let savedHeight = '640px';
    document.getElementById('kabuto-btn-minimize').addEventListener('click', (e) => {
        isMinimized = !isMinimized;
        if (isMinimized) {
            savedHeight = wrapper.style.height;
            iframe.style.display = 'none';
            wrapper.style.height = '36px';
            wrapper.style.minHeight = '36px';
            wrapper.style.resize = 'none';
            e.target.innerText = '▢';
        } else {
            iframe.style.display = 'block';
            wrapper.style.height = savedHeight;
            wrapper.style.minHeight = '260px';
            wrapper.style.resize = 'both';
            e.target.innerText = '—';
        }
    });

    // Bouton Compact/Large
    let isCompact = true;
    document.getElementById('kabuto-btn-compact').addEventListener('click', (e) => {
        isCompact = !isCompact;
        if (isCompact) {
            wrapper.style.width = '440px';
            wrapper.style.height = '640px';
            e.target.innerText = 'Vue Large';
        } else {
            wrapper.style.width = '980px';
            wrapper.style.height = '720px';
            e.target.innerText = 'Petit Carré';
        }
    });

    // Écoute pour le mode Blocage
    window.addEventListener('message', (event) => {
        if (!event.data || event.data.source !== 'KABUTO_APP') return;

        if (event.data.type === 'SET_BLOCKER_MODE') {
            if (event.data.blocked) {
                Object.assign(wrapper.style, {
                    top: '0px', left: '0px', right: '0px', bottom: '0px',
                    width: '100vw', height: '100vh',
                    borderRadius: '0px', resize: 'none'
                });
                dragBar.style.display = 'none';
                iframe.style.display = 'block';
            } else {
                Object.assign(wrapper.style, {
                    top: '70px', left: 'auto', right: '20px', bottom: 'auto',
                    width: '440px', height: '640px',
                    borderRadius: '14px', resize: 'both'
                });
                dragBar.style.display = 'flex';
            }
        }
    });
})();