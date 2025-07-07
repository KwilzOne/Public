// ==UserScript==
// @name           Kinopoisk Watch
// @namespace      kinopoisk
// @version        1.0
// @description    Adds a movie watch button without all that crap
// @author         Kwilz
// @homepageURL    https://github.com/KwilzOne/Public
// @updateURL      https://raw.githubusercontent.com/KwilzOne/Public/refs/heads/whitewolf/tampermonkey/kinopoisk.user.js
// @downloadURL    https://raw.githubusercontent.com/KwilzOne/Public/refs/heads/whitewolf/tampermonkey/kinopoisk.user.js
// @match          *://*.kinopoisk.ru/*
// @icon           https://www.google.com/s2/favicons?sz=64&domain=kinopoisk.ru
// @grant          none
// ==/UserScript==

function b(c,d){const e=a();return b=function(f,g){f=f-0x82;let h=e[f];return h;},b(c,d);}function a(){const o=['fontSize','4px','2753390GveKYb','12pgUUag','Смотреть\x20сейчас','h1[itemprop=\x22name\x22]','textDecoration','appendChild','a[href*=\x22.film\x22]','body','698619JJVhcG','26228ATSGva','0\x2012px','then','location','observe','disconnect','borderRadius','float','none','16px','5327368BSRmjR','forEach','.ru','1435950TmhjFA','padding','replace','3AVSWEZ','href','color','querySelector','right','1258370lLujRN','textContent','4841529KicuOQ','backgroundColor','9zPZFCA','style'];a=function(){return o;};return a();}(function(c,d){const i=b,e=c();while(!![]){try{const f=-parseInt(i(0x92))/0x1*(parseInt(i(0x82))/0x2)+parseInt(i(0xa7))/0x3*(-parseInt(i(0xa0))/0x4)+parseInt(i(0x97))/0x5+-parseInt(i(0x8f))/0x6+parseInt(i(0x99))/0x7+parseInt(i(0x8c))/0x8+parseInt(i(0x9b))/0x9*(-parseInt(i(0x9f))/0xa);if(f===d)break;else e['push'](e['shift']());}catch(g){e['push'](e['shift']());}}}(a,0x57109));;(function(){'use strict';const m=b;function c(f){return new Promise(g=>{const j=b;if(document[j(0x95)](f))return g(document['querySelector'](f));const h=new MutationObserver(()=>{const k=j;document[k(0x95)](f)&&(g(document['querySelector'](f)),h[k(0x87)]());});h[j(0x86)](document['body'],{'childList':!![],'subtree':!![]});});}function d(){const l=b,f=document[l(0x95)]('h1[itemprop=\x22name\x22]');if(!f)return;const g=f['querySelector'](l(0xa5));if(g)return;const h=document['createElement']('a');h[l(0x93)]=window[l(0x85)][l(0x93)][l(0x91)](l(0x8e),'.film'),h[l(0x98)]=l(0xa1),h[l(0x9c)][l(0x89)]=l(0x96),h[l(0x9c)][l(0x90)]=l(0x83),h[l(0x9c)][l(0x9a)]='#ff5722',h[l(0x9c)][l(0x94)]='white',h[l(0x9c)][l(0x88)]=l(0x9e),h[l(0x9c)][l(0xa3)]=l(0x8a),h['style'][l(0x9d)]=l(0x8b),f[l(0xa4)](h);}c(m(0xa2))[m(0x84)](d);const e=new MutationObserver(f=>{const n=m;f[n(0x8d)](()=>{if(document['querySelector']('h1[itemprop=\x22name\x22]'))d();});});e[m(0x86)](document[m(0xa6)],{'childList':!![],'subtree':!![]});}());