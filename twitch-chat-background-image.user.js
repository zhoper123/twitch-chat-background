// ==UserScript==
// @name         Twitch Chat Background Image
// @namespace    http://tampermonkey.net/
// @version      4.0
// @description  Илья
// @author       zhopapopapisya
// @match        https://www.twitch.tv/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const DEFAULTS = {
        scale: 2.42,
        offsetX: 55,
        offsetY: 50,
        darkness: 0.75,
        vignette: 1,
        vignetteRadius: 15,
        imageUrl: "https://i.redd.it/hear-me-out-v0-sodlstmdd0if1.jpg?width=640&format=pjpg&auto=webp&s=14eada2455ad5bae91d58c8a6a6c90b322f6b63b"
    };

    const STORAGE_KEY = 'tm_chat_bg_settings_v6';
    let settings = loadSettings();

    function loadSettings() {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            return stored ? Object.assign({}, DEFAULTS, JSON.parse(stored)) : {...DEFAULTS};
        } catch (e) { return {...DEFAULTS}; }
    }
    function saveSettings() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
        showToast('Настройки сохранены');
    }
    function resetSettings() {
        settings = {...DEFAULTS};
        saveSettings();
        fillPanelValues();
        updateBackground();
        showToast('Сброшено к значениям по умолчанию');
    }

    function insertBackground() {
        const chatSection = document.querySelector('section[data-test-selector="chat-room-component-layout"]');
        if (!chatSection) return;
        if (!chatSection.querySelector('.tm-chat-background-container')) {
            const bgWrapper = document.createElement('div');
            bgWrapper.className = 'tm-chat-background-container';
            Object.assign(bgWrapper.style, {
                position: 'absolute', top: '0', left: '0', width: '100%',
                height: '100%', zIndex: '0', pointerEvents: 'none'
            });

            const bgDiv = document.createElement('div');
            bgDiv.className = 'tm-background-layer';
            Object.assign(bgDiv.style, {
                position: 'absolute', top: '0', left: '0',
                width: '100%', height: '100%',
                backgroundRepeat: 'no-repeat',
                zIndex: '0', pointerEvents: 'none'
            });

            const overlayDiv = document.createElement('div');
            overlayDiv.className = 'tm-background-overlay';
            Object.assign(overlayDiv.style, {
                position: 'absolute', top: '0', left: '0',
                width: '100%', height: '100%',
                zIndex: '1', pointerEvents: 'none'
            });

            bgWrapper.appendChild(bgDiv);
            bgWrapper.appendChild(overlayDiv);
            const prevPosition = getComputedStyle(chatSection).position;
            if (!prevPosition || prevPosition === 'static') chatSection.style.position = 'relative';
            chatSection.prepend(bgWrapper);
        }
        updateBackground();
    }

    function getVignetteBackground() {
        return `
            linear-gradient(to top, rgba(0,0,0,${settings.vignette}) 0%, rgba(0,0,0,0) ${settings.vignetteRadius}%),
            linear-gradient(to bottom, rgba(0,0,0,${settings.vignette}) 0%, rgba(0,0,0,0) ${settings.vignetteRadius}%),
            linear-gradient(to left, rgba(0,0,0,${settings.vignette}) 0%, rgba(0,0,0,0) ${settings.vignetteRadius}%),
            linear-gradient(to right, rgba(0,0,0,${settings.vignette}) 0%, rgba(0,0,0,0) ${settings.vignetteRadius}%),
            rgba(0,0,0,${settings.darkness})
        `;
    }

    function updateBackground() {
        const bgDiv = document.querySelector('.tm-background-layer');
        const overlayDiv = document.querySelector('.tm-background-overlay');
        if (!bgDiv || !overlayDiv) return;
        try {
            bgDiv.style.backgroundImage = `url('${settings.imageUrl}')`;
        } catch(e){}
        bgDiv.style.backgroundSize = `${settings.scale*100}%`;
        bgDiv.style.backgroundPosition = `${settings.offsetX}% ${settings.offsetY}%`;
        overlayDiv.style.background = getVignetteBackground();
    }

    function showToast(text) {
        let t = document.querySelector('#tm-bg-toast');
        if (!t) {
            t = document.createElement('div');
            t.id = 'tm-bg-toast';
            Object.assign(t.style, {
                position: 'fixed', right: '12px', bottom: '12px',
                background: 'rgba(0,0,0,0.8)', color: 'white',
                padding: '8px 10px', borderRadius: '6px', zIndex: 2147483647,
                fontSize: '13px', fontFamily: 'Arial, sans-serif'
            });
            document.body.appendChild(t);
        }
        t.textContent = text;
        t.style.opacity = '1';
        clearTimeout(t._hideTO);
        t._hideTO = setTimeout(()=> t.style.opacity = '0', 1800);
    }

    function createControlPanel() {
        if (document.getElementById('tm-bg-panel')) return;
        const panel = document.createElement('div');
        panel.id = 'tm-bg-panel';
        panel.style.cssText = `
            position: fixed; bottom: 60px; right: 415px;
            min-width: 300px; max-width: 90vw; padding: 12px;
            background: rgba(18,18,18,0.98); color: white; z-index: 2147483647;
            font-family: Arial, sans-serif; border-radius: 10px;
            box-shadow: 0 6px 18px rgba(0,0,0,0.6);
            user-select: none; display: none;
        `;
        panel.innerHTML = `
            <div id="tm-bg-panel-header" style="cursor: move; display:flex; align-items:center; justify-content:space-between; margin-bottom:8px;">
                <div style="font-weight:700">Параметры фона</div>
                <button id="tm-hide-btn" style="cursor:pointer;border:0;background:transparent;color:#aaa;font-size:16px;">✕</button>
            </div>
            ${createRangeInput('масштабирование','scale',0.5,5,0.01)}
            ${createRangeInput('смещение по X','offsetX',-100,100,1)}
            ${createRangeInput('смещение по Y','offsetY',-100,100,1)}
            ${createRangeInput('затемнение','darkness',0,1,0.01)}
            ${createRangeInput('затемнение по краям','vignette',0,1,0.01)}
            ${createRangeInput('зона затемнения','vignetteRadius',0,50,1)}
            <div style="font-size:12px;margin-bottom:8px;">
                <label>ссылка на изображение:</label>
                <input id="imageUrl" type="text" style="width:100%;padding:6px;margin-top:6px;border-radius:6px;border:1px solid #444;background:#0f0f0f;color:#eee;">
            </div>
            <div style="display:flex; gap:8px; justify-content:space-between; margin-top:8px;">
                <button id="tm-save-btn">Сохранить</button>
                <button id="tm-reset-btn">Сброс</button>
            </div>
        `;
        document.body.appendChild(panel);

        const elems = {
            scale: panel.querySelector('#scale'),
            offsetX: panel.querySelector('#offsetX'),
            offsetY: panel.querySelector('#offsetY'),
            darkness: panel.querySelector('#darkness'),
            vignette: panel.querySelector('#vignette'),
            vignetteRadius: panel.querySelector('#vignetteRadius'),
            imageUrl: panel.querySelector('#imageUrl'),
            saveBtn: panel.querySelector('#tm-save-btn'),
            resetBtn: panel.querySelector('#tm-reset-btn'),
            hideBtn: panel.querySelector('#tm-hide-btn'),
            header: panel.querySelector('#tm-bg-panel-header')
        };

        fillPanelValues();

        ['scale','offsetX','offsetY','darkness','vignette','vignetteRadius'].forEach(id=>{
            elems[id].addEventListener('input', e => {
                settings[id] = parseFloat(e.target.value);
                const valEl = panel.querySelector(`#${id}Val`);
                if (valEl) valEl.textContent = settings[id];
                updateBackground();
            });
        });

        elems.imageUrl.addEventListener('change', e=>{
            settings.imageUrl = e.target.value.trim() || DEFAULTS.imageUrl;
            updateBackground();
        });

        elems.saveBtn.addEventListener('click', saveSettings);
        elems.resetBtn.addEventListener('click', resetSettings);
        elems.hideBtn.addEventListener('click', ()=> panel.style.display='none');
        makeDraggable(panel, elems.header);
    }

    function createRangeInput(label, id, min, max, step) {
        return `
        <div style="font-size:12px;margin-bottom:6px; display:flex; align-items:center; gap:6px;">
            <label style="flex:1;">${label}: <span id="${id}Val"></span></label>
            <input id="${id}" type="range" min="${min}" max="${max}" step="${step}" style="flex:2; accent-color: #9147ff;">
        </div>`;
    }

    function fillPanelValues() {
        const panel = document.querySelector('#tm-bg-panel');
        if (!panel) return;
        ['scale','offsetX','offsetY','darkness','vignette','vignetteRadius'].forEach(id=>{
            const input = panel.querySelector(`#${id}`);
            if (!input) return;
            input.value = settings[id];
            const valSpan = panel.querySelector(`#${id}Val`);
            if (valSpan) valSpan.textContent = settings[id];
        });
        const iu = panel.querySelector('#imageUrl');
        if (iu) iu.value = settings.imageUrl;
    }

    function makeDraggable(panel, handle) {
        let isDown=false,startX=0,startY=0,startLeft=0,startTop=0;
        handle.addEventListener('mousedown',e=>{
            isDown=true; startX=e.clientX; startY=e.clientY;
            const r=panel.getBoundingClientRect();
            startLeft=r.left; startTop=r.top;
            document.body.style.userSelect = 'none';
        });
        document.addEventListener('mousemove',e=>{
            if(!isDown) return;
            panel.style.left = (startLeft + (e.clientX-startX)) + 'px';
            panel.style.top = (startTop + (e.clientY-startY)) + 'px';
            panel.style.position='fixed';
            panel.style.right='auto';
            panel.style.bottom='auto';
        });
        document.addEventListener('mouseup',()=>{ isDown=false; document.body.style.userSelect=''; });
    }

    const BTN_SELECTOR = 'button[data-a-target="chat-settings"], button[aria-label*="Настройки чата"], button[aria-label*="Chat Settings"]';

    document.addEventListener('click', e=>{
        const btn = e.target.closest ? e.target.closest(BTN_SELECTOR) : null;
        if (btn) {
            createControlPanel();
            const panel = document.querySelector('#tm-bg-panel');
            if (!panel) return;
            panel.style.display = panel.style.display === 'block' ? 'none' : 'block';
        }
    }, true);

    const bgObserver = new MutationObserver(()=>insertBackground());
    bgObserver.observe(document.body, {childList:true, subtree:true});

    function init() {
        removeLegacyShowButton();
        insertBackground();
        createControlPanel();
        updateBackground();
    }

    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        setTimeout(init, 600);
    } else {
        window.addEventListener('DOMContentLoaded', ()=>setTimeout(init, 600), {once:true});
        setTimeout(()=>{ if (!document.body) return; init(); }, 1600);
    }

    window.addEventListener('resize', updateBackground);

})();

