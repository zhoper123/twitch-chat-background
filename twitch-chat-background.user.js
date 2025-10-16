// ==UserScript==
// @name         Twitch Chat Background Image
// @namespace    http://tampermonkey.net/
// @version      3.0
// @description  Задник для чата твича
// @author       You
// @match        https://www.twitch.tv/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    //URL картинки или GIF
    const imageUrl = "https://i.redd.it/hear-me-out-v0-sodlstmdd0if1.jpg?width=640&format=pjpg&auto=webp&s=14eada2455ad5bae91d58c8a6a6c90b322f6b63b";

    //масштабирование
    let scale = 2.45;
    //смещение
    let offsetX = 50;
    let offsetY = 50;
    //затемнение
    let darkness = 0.75;

    function insertBackground() {
        const chatSection = document.querySelector('section[data-test-selector="chat-room-component-layout"]');
        if (!chatSection) return;

        if (!chatSection.querySelector('.tm-chat-background-container')) {
            const bgWrapper = document.createElement('div');
            bgWrapper.className = 'tm-chat-background-container';
            bgWrapper.style.position = 'absolute';
            bgWrapper.style.top = '0';
            bgWrapper.style.left = '0';
            bgWrapper.style.width = '100%';
            bgWrapper.style.height = '100%';
            bgWrapper.style.zIndex = '0';
            bgWrapper.style.pointerEvents = 'none';

            const bgDiv = document.createElement('div');
            bgDiv.className = 'tm-background-layer';
            bgDiv.style.position = 'absolute';
            bgDiv.style.top = '0';
            bgDiv.style.left = '0';
            bgDiv.style.width = '100%';
            bgDiv.style.height = '100%';
            bgDiv.style.backgroundImage = `url('${imageUrl}')`;
            bgDiv.style.backgroundRepeat = 'no-repeat';
            bgDiv.style.backgroundSize = `${scale*100}%`;
            bgDiv.style.backgroundPosition = `${offsetX}% ${offsetY}%`;
            bgDiv.style.zIndex = '0';
            bgDiv.style.pointerEvents = 'none';

            const overlayDiv = document.createElement('div');
            overlayDiv.className = 'tm-background-overlay';
            overlayDiv.style.position = 'absolute';
            overlayDiv.style.top = '0';
            overlayDiv.style.left = '0';
            overlayDiv.style.width = '100%';
            overlayDiv.style.height = '100%';
            overlayDiv.style.background = `rgba(0,0,0,${darkness})`;
            overlayDiv.style.zIndex = '1';
            overlayDiv.style.pointerEvents = 'none';

            bgWrapper.appendChild(bgDiv);
            bgWrapper.appendChild(overlayDiv);

            chatSection.style.position = 'relative';
            chatSection.prepend(bgWrapper);
        }
    }

    function updateBackground() {
        const bgDiv = document.querySelector('.tm-background-layer');
        const overlayDiv = document.querySelector('.tm-background-overlay');
        if (!bgDiv || !overlayDiv) return;

        bgDiv.style.backgroundSize = `${scale*100}%`;
        bgDiv.style.backgroundPosition = `${offsetX}% ${offsetY}%`;
        overlayDiv.style.background = `rgba(0,0,0,${darkness})`;
    }

    const observer = new MutationObserver(() => {
        insertBackground();
        updateBackground();
    });
    observer.observe(document.body, { childList: true, subtree: true });

    window.addEventListener('resize', updateBackground);

    setTimeout(() => {
        insertBackground();
        updateBackground();
    }, 1000);

    window.setChatBackground = function(newScale, newOffsetX, newOffsetY, newDarkness) {
        if (newScale) scale = newScale;
        if (newOffsetX !== undefined) offsetX = newOffsetX;
        if (newOffsetY !== undefined) offsetY = newOffsetY;
        if (newDarkness !== undefined) darkness = newDarkness;
        updateBackground();
    }

    console.log("Twitch chat background ready. Используй setChatBackground(scale, offsetX, offsetY, darkness) для настройки.");
})();
