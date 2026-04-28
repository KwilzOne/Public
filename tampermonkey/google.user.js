// ==UserScript==
// @name         Old-fashioned Dark Google
// @namespace    Google
// @version      1.3
// @description  Make Google a natural, old-fashioned blue and really dark
// @author       Kwilz
// @homepageURL  https://github.com/KwilzOne/Public
// @updateURL    https://raw.githubusercontent.com/KwilzOne/Public/refs/heads/whitewolf/tampermonkey/google.user.js
// @downloadURL  https://raw.githubusercontent.com/KwilzOne/Public/refs/heads/whitewolf/tampermonkey/google.user.js
// @match        *://www.google.com/*
// @match        drive.usercontent.google.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=google.com
// @grant        none
// @run-at       document-start
// ==/UserScript==

;(function () {
	"use strict"
	const style = document.createElement("style")
	style.textContent = `
:root {
	--TyVYld: #8ab4f8 !important;
	--TMYS9: #8ab4f8 !important;
	--JKqx2: #8ab4f8 !important;
	--rrJJUc: #8ab4f8 !important;
}

:root body,
:root .c93Gbe,
:root .f6F9Be,
:root .VHFyob .CvDJxb {
	background: #161616 !important;
}

:root .RNNXgb {
	background: #292929;
}

:root .RNNXgb:hover,
:root .emcav .RNNXgb,
:root .BgPPrc .RNNXgb,
:root .emcav .RNNXgb:hover,
:root .sbfc.emcav .RNNXgb,
:root .BgPPrc .RNNXgb:hover,
:root .aajZCb {
	background: #2e2e2e;
}

/* Скрыть кнопку, которой не должно быть */
[aria-label="Экранная клавиатура"] {
	display: none !important;
}

/* Searchbar input btn's & AI mode */
:root .lJ9FBc,
:root .plR5qb {
	display: none;
}

/* Кнопки в баре поиска */
a[href*="udm=50"] {
	display: none !important;
}

/* Скрываем Покупки (udm=28) */
a[href*="udm=28"] {
	display: none !important;
}

/* Скрываем Новости (tbm=nws) */
a[href*="tbm=nws"] {
	display: none !important;
}

/* Скрываем Короткие видео (udm=39) */
a[href*="udm=39"] {
	display: none !important;
}

/* Скрыть мусор в футере */
:root .ynRric,
:root .Ye4jfc,
:root .WzNHm,
:root .kEjm2c.fbar {
	display: none;
}
:root .erkvQe {
	padding-bottom: 0;
}
:root .b2hzT {
	border-bottom: unset;
}

/* Скрыть мусорную анимацию кнопки AI */
:root .AOIKH .aSjwGd {
	animation: unset;
}
:root .aSjwGd {
	background: unset;
}

/* Фон не адаптивных картинок */
:root .tMetr {
	background: #28292a;
}
/* Captcha page */
:root [style="font-size:13px; line-break: anywhere;"],
:root [style="font-size:13px;"] {
	color: #bababa;
}

// Google Drive
body:has(.uc-main) {
	background: #161616 !important;
}

body:has(.uc-main) .uc-error-caption,
body:has(.uc-main) .uc-warning-caption,
body:has(.uc-main) .uc-warning-subcaption {
	color: #bababa;
}

body:has(.uc-main) #uc-text {
	position: absolute;
	top: 50%;
	right: 50%;
	transform: translate(50%, -50%);
}

body:has(.uc-main) .uc-footer {
	display: none;
}

body:has(.uc-main) #download-form {
	display: flex;
	justify-content: center;
	flex-direction: column;
}

body:has(.uc-main) #uc-download-link {
	color: #fff;
	background-color: #282828;
	font-weight: 500;
	border-radius: 0.5rem;
	font-size: 16px;
	padding: 10px 14px;
	cursor: pointer;
	text-align: center;
	border: none;
}

body:has(.uc-main) #uc-download-link:hover {
	color: #eee;
	background-color: #2f2f2f;
}`
	document.documentElement.appendChild(style)
})()
