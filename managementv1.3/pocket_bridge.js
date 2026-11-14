(function () {
    'use strict';

    let lastSentBalance = 0;

    window.addEventListener('message', (event) => {
        if (!event.data || event.data.source !== 'KABUTO_APP') return;
        const { type, amount, direction } = event.data;

        if (type === 'SET_STAKE') injectStake(amount);
        if (type === 'EXECUTE_TRADE') {
            injectStake(amount);
            setTimeout(() => clickTradeButton(direction), 400);
        }
    });

    function findElementDeep(selector, root = document) {
        let el = root.querySelector(selector);
        if (el) return el;
        const iframes = root.querySelectorAll('iframe');
        for (let iframe of iframes) {
            try {
                const doc = iframe.contentDocument || iframe.contentWindow.document;
                if (doc) { el = findElementDeep(selector, doc); if (el) return el; }
            } catch (e) {}
        }
        const all = root.querySelectorAll('*');
        for (let elem of all) {
            if (elem.shadowRoot) {
                el = findElementDeep(selector, elem.shadowRoot);
                if (el) return el;
            }
        }
        return null;
    }

    function injectStake(amount) {
        const selectors = ['input[type="number"]', 'input[name="amount"]', '.deal-amount input'];
        for (let sel of selectors) {
            const input = findElementDeep(sel);
            if (input) {
                const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
                setter.call(input, amount.toFixed(2));
                input.dispatchEvent(new Event('input', { bubbles: true }));
                input.dispatchEvent(new Event('change', { bubbles: true }));
                return;
            }
        }
    }

    function clickTradeButton(direction) {
        let buttons = [];
        const findButtons = (root) => {
            root.querySelectorAll('button, [role="button"]').forEach(b => buttons.push(b));
            root.querySelectorAll('iframe').forEach(iframe => {
                try { findButtons(iframe.contentDocument || iframe.contentWindow.document); } catch(e){}
            });
        };
        findButtons(document);

        for (let btn of buttons) {
            const text = (btn.innerText || "").toLowerCase();
            if (direction === 'CALL' && (text.includes('buy') || text.includes('higher') || text.includes('acheter'))) {
                btn.click(); return;
            }
            if (direction === 'PUT' && (text.includes('sell') || text.includes('lower') || text.includes('vendre'))) {
                btn.click(); return;
            }
        }
    }

    // CIBLAGE EXACT DU SOLDE : On cherche uniquement en haut à droite
    function pollBalance() {
        try {
            // Le solde est souvent dans un span avec un style spécifique ou à côté de "TOP UP"
            const balanceEl = document.querySelector('.cabinet-header__balance, .header-balance, .user-balance, .balance');
            
            if (balanceEl) {
                const text = balanceEl.innerText.replace(/[^0-9.]/g, '');
                const val = parseFloat(text);
                // On vérifie que c'est un montant réaliste (entre 1 et 1 million)
                if (!isNaN(val) && val > 1 && val < 1000000 && val !== lastSentBalance) {
                    lastSentBalance = val;
                    window.postMessage({ source: 'POCKET_BRIDGE', type: 'BALANCE_UPDATE', balance: val }, '*');
                }
            }
        } catch (e) {}
    }

    setInterval(pollBalance, 2000);
    console.log('[KABUTO] Bridge activé (Ciblage strict).');
})();