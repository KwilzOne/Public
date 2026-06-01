// ==UserScript==
// @name           Kinopoisk Watch
// @namespace      kinopoisk
// @version        1.1
// @description    Adds a movie watch button without all that crap
// @author         Kwilz
// @homepageURL    https://github.com/KwilzOne/Public
// @updateURL      https://raw.githubusercontent.com/KwilzOne/Public/refs/heads/whitewolf/tampermonkey/kinopoisk.user.js
// @downloadURL    https://raw.githubusercontent.com/KwilzOne/Public/refs/heads/whitewolf/tampermonkey/kinopoisk.user.js
// @match          *://*.kinopoisk.ru/*
// @icon           https://www.google.com/s2/favicons?sz=64&domain=kinopoisk.ru
// @grant          none
// ==/UserScript==

(function(){"use strict";function w(s){return new Promise(resolve=>{const x=document.querySelector(s);if(x)return resolve(x);const o=new MutationObserver(()=>{const e=document.querySelector(s);if(e){resolve(e);o.disconnect()}});o.observe(document.body,{childList:!0,subtree:!0})})};function b(){const t=document.querySelector('h1[itemprop="name"]');if(!t)return;if(t.querySelector('a[href*="kinokino.vip"]'))return;const n=document.createElement("a");n.href=window.location.href.replace("kinopoisk.ru","kinokino.vip");n.textContent="Смотреть сейчас";n.style.fontSize="16px";n.style.padding="4px";n.style.backgroundColor="#ff5722";n.style.color="white";n.style.borderRadius="0 12px";n.style.textDecoration="none";n.style.float="right";t.appendChild(n)};w('h1[itemprop="name"]').then(b);const o=new MutationObserver(m=>m.forEach(()=>{if(document.querySelector('h1[itemprop="name"]'))b()}));o.observe(document.body,{childList:!0,subtree:!0})})()