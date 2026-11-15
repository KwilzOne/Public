// ==UserScript==
// @name         Faceit
// @namespace    Faceit
// @version      1.0
// @description  Make Faceit a natural
// @author       Kwilz
// @homepageURL  https://github.com/KwilzOne/Public
// @updateURL    https://raw.githubusercontent.com/KwilzOne/Public/refs/heads/whitewolf/tampermonkey/faceit.user.js
// @downloadURL  https://raw.githubusercontent.com/KwilzOne/Public/refs/heads/whitewolf/tampermonkey/faceit.user.js
// @match        *://www.faceit.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=faceit.com
// @grant        none
// @run-at       document-start
// ==/UserScript==

;(function () {
	"use strict"
	const style = document.createElement("style")
	style.textContent = `
:root {
    --wolf-accent: #d05da6;
    --wolf-background: transparent;
    --background-image: url(https://kwilz.s3.eu-central-2.s4.mega.io/zcoa2jn2zbllz2ntlhbfiiw4eeninrgzluvi6/discord.jpg);
    --background-position: center;
    --background-size: cover;
    --background-brightness: 0.6;
    --background-overlay: rgba(0, 0, 0, 0.4);
}

:root body {
	/* background-color: var(--wolf-background) !important; */
	background-image: linear-gradient(rgba(0, 0, 0, var(--background-brightness)), rgba(0, 0, 0, var(--background-brightness))), var(--background-image) !important;
	background-position: var(--background-position) !important;
	background-size: var(--background-size) !important;
	background-repeat: no-repeat !important;
	background-attachment: fixed !important;
}


/* Мусор в меню */
:root [class^="VoiceControls__Holder"],
:root [class^="Ladders__HeaderContainer"],
:root [class^="Ladders__Container"] {
   display: none !important;
}

/* Кнопки навигации слева внизу */
:root a[aria-label="Магазин"],
:root a[aria-label="Премиум"] {
   display: none !important;
}

/* Кнопка итоги сезона */
:root div[class*="styles__Banners-"] > button[type="button"][class*="styles__Card-"]:has(> div[class*="styles__TitleCol-"] > span[class*="styles__RecapOverline-"]):has(> svg > use[href*="#arrowRight"]) {
    display: none !important;
}

/* Кнопка подарка подписки */
:root div[class*="styles__Banners-"] > div[class*="styles__Container-"]:has(svg > use[href*="#gift"]):has(> button[class*="ButtonBase__Wrapper-"]) {
    display: none !important;
}

/* Блок хайлайтов в профиле */
:root div[class*="styles__Container-"]:has(> div[class*="styles__HighlightsGrid-"]) {
    display: none !important;
}

/* Премиум баннер сверху */
:root div[class*="style__Banner-"]:has(span[class*="style__PremiumText-"]):has(> div > button[class*="style__ResponsiveButton-"]) {
    display: none !important;
}

/* Баннер магазина */
:root div[class*="FullContent__FullContentStyle-"]:has(> div[class*="styles__BannerWrapper-"] > div[class*="styles__BannerGrid-"] > div[class*="styles__ItemsContainer-"]) {
    display: none !important;
}

:root [data-slot="canvas"],
:root .hygAjt {
    border: none !important;
}

/* Блоки фона */
:root #__next,
:root .fQqiRk,
:root .eyXDmm,
:root .leYtuY,
:root .fcjkEe,
:root .ceMbfT,
:root .bJTloQ,
:root .kJdgxh,
:root .byrYlj,
:root .ijQsYD,
:root .fZoWfi,
:root .esOsQT:disabled {
    background: transparent !important;
}

/* Блоки разные */
:root .dFdvIO,
:root .fCjjPU,
:root .ffNbCb,
:root .dfmmXy,
:root .qGzDw,
:root .hwkqJN,
:root .bNQgfF,
:root .bGJXhn,
:root .jAJSSs,
:root .eZCSHS,
:root .hQbKPW,
:root .gSMfdt,
:root .fJvHhn,
:root .jJIYxE,
:root .daVVzJ,
:root .kCRsYJ,
:root .cQCmzl,
:root .inrJCf.statPerformance {
    background: rgba(0, 0, 0, 0.4) !important;
}

/* Блоки меню выпадающих */
:root .oQEnX {
    background: rgba(0, 0, 0, 0.4) !important;
    backdrop-filter: brightness(0.6) blur(2px);
}`
	document.documentElement.appendChild(style)
})()
