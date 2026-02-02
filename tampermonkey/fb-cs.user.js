// ==UserScript==
// @name         FB-CS Utils
// @namespace    FB-CS
// @version      1.1
// @description  Tools for fb-cs.ru
// @author       Kwilz
// @homepageURL  https://github.com/KwilzOne/Public
// @updateURL    https://raw.githubusercontent.com/KwilzOne/Public/refs/heads/whitewolf/tampermonkey/fb-cs.user.js
// @downloadURL  https://raw.githubusercontent.com/KwilzOne/Public/refs/heads/whitewolf/tampermonkey/fb-cs.user.js
// @match        *://fb-cs.ru/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=fb-cs.ru
// @grant        none
// ==/UserScript==

;(function () {
	"use strict"
	const DEFAULT_SETTINGS = {
		enabled: false,
		showSid: true,
		volume: 0.05,
		customSound: "",
		ignoreList: "",
		filters: {
			irvjXF: { name: "Красное", maxPrice: 10000, active: false },
			bnXJGC: { name: "Розовое", maxPrice: 20000, active: false },
			bOqyVa: { name: "Желтое", maxPrice: 30000, active: false }
		}
	}
	let settings = JSON.parse(localStorage.getItem("fb_utils_settings")) || DEFAULT_SETTINGS
	const processedItems = new WeakSet()
	const saveSettings = () => localStorage.setItem("fb_utils_settings", JSON.stringify(settings))
	const style = document.createElement("style")
	style.textContent = `
        .fb-modal { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: #1a1a1a; color: white; border: 1px solid #333; padding: 10px 18px 18px 18px; z-index: 10002; border-radius: 16px; display: none; width: 360px; box-shadow: 0px 2px 16px 2px rgba(0, 0, 0, 0.7); font-family: sans-serif; font-size: 14px; max-height: 90vh; overflow-y: auto; }
        .fb-modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }
        .fb-modal-header h2 { margin: 0; font-size: 18px; color: #1e91e4; }
        .fb-close-x { cursor: pointer; font-size: 24px; color: #666; transition: 0.2s; }
        .fb-close-x:hover { color: #fff; }
        .fb-modal-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; background: #222; padding: 10px 15px; border-radius: 10px; }
        .fb-switch { position: relative; display: inline-block; width: 40px; height: 22px; }
        .fb-switch input { opacity: 0; width: 0; height: 0; }
        .fb-slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #444; transition: .4s; border-radius: 34px; }
        .fb-slider:before { position: absolute; content: ""; height: 16px; width: 16px; left: 3px; bottom: 3px; background-color: white; transition: .4s; border-radius: 50%; }
        input:checked + .fb-slider { background-color: #1e91e4; }
        input:checked + .fb-slider:before { transform: translateX(18px); }
        .fb-input-num { width: 90px; background: #333; border: 1px solid #444; color: #00ff00; padding: 6px; border-radius: 6px; text-align: center; font-weight: bold; outline: none; }
        .fb-range { -webkit-appearance: none; width: 100%; height: 6px; background: #444; border-radius: 5px; outline: none; }
        .fb-range::-webkit-slider-thumb { -webkit-appearance: none; width: 18px; height: 18px; background: #1e91e4; border-radius: 50%; cursor: pointer; }
        .fb-textarea { width: 100%; background: #222; border: 1px solid #333; color: #ccc; border-radius: 10px; padding: 10px; box-sizing: border-box; resize: vertical; font-size: 12px; margin-top: 5px; outline: none; }
        .fb-textarea-hidden { resize: none; }
        .fb-save-btn { background: #1e91e4; color: white; border: none; padding: 12px; width: 100%; border-radius: 10px; cursor: pointer; margin-top: 15px; font-weight: bold; font-size: 16px; transition: 0.3s; }
        .fb-save-btn:hover { background: #15639a; transform: translateY(-2px); }
        .fb-label-small { display: block; margin-top: 10px; color: #888; font-size: 11px; text-transform: uppercase; }
        .fb-sid-badge { position: absolute; top: 8px; left: 8px; background: rgba(0,0,0,0.6); padding: 2px 6px; border-radius: 4px; font-size: 11px; font-weight: bold; color: #aaa; z-index: 5; pointer-events: none; }
        .fb-sid-lucky { color: #00ff00 !important; text-shadow: 0 0 8px #00ff00; }
    `
	document.head.appendChild(style)
	const modal = document.createElement("div")
	modal.className = "fb-modal"
	document.body.appendChild(modal)
	const openSettings = () => {
		const filtersHtml = Object.entries(settings.filters)
			.map(
				([id, f]) => `
            <div class="fb-modal-row">
                <span style="font-weight:bold">${f.name}</span>
                <div style="display:flex; align-items:center; gap:10px">
                    <input type="number" data-id="${id}" class="f-prc fb-input-num" value="${f.maxPrice}">
                    <label class="fb-switch">
                        <input type="checkbox" data-id="${id}" class="f-act" ${f.active ? "checked" : ""}>
                        <span class="fb-slider"></span>
                    </label>
                </div>
            </div>
        `
			)
			.join("")
		modal.innerHTML = `
            <div class="fb-modal-header">
                <h2>Настройки</h2>
                <span class="fb-close-x">&times;</span>
            </div>
            <div class="fb-modal-row">
                <span>Автозакуп</span>
                <label class="fb-switch">
                    <input type="checkbox" id="fb-master" ${settings.enabled ? "checked" : ""}>
                    <span class="fb-slider"></span>
                </label>
            </div>
            <div class="fb-modal-row">
                <span>Отображать SID</span>
                <label class="fb-switch">
                    <input type="checkbox" id="fb-show-sid" ${settings.showSid ? "checked" : ""}>
                    <span class="fb-slider"></span>
                </label>
            </div>
            <div style="margin-bottom:15px">
                <div style="display:flex; justify-content:space-between; margin-bottom:8px; font-size:13px">
                    <span>Громкость уведомления</span>
                    <span id="vol-val">${Math.round(settings.volume * 100)}%</span>
                </div>
                <input type="range" id="fb-vol" class="fb-range" min="0" max="1" step="0.001" value="${settings.volume}">
            </div>
            ${filtersHtml}
            <span class="fb-label-small">Звук (URL или Base64)</span>
            <textarea id="fb-sound-data" class="fb-textarea fb-textarea-hidden" placeholder="Стандартный звук" rows="1">${settings.customSound || ""}</textarea>
            <span class="fb-label-small">Игнорировать (каждый с новой строки)</span>
            <textarea id="fb-ignore-data" class="fb-textarea" placeholder="Название товара..." rows="5">${settings.ignoreList || ""}</textarea>
            <button class="fb-save-btn">Применить</button>
        `
		modal.querySelector(".fb-close-x").onclick = () => (modal.style.display = "none")
		modal.querySelector("#fb-vol").oninput = e => (modal.querySelector("#vol-val").textContent = Math.round(e.target.value * 100) + "%")
		modal.querySelector(".fb-save-btn").onclick = () => {
			settings.enabled = modal.querySelector("#fb-master").checked
			settings.showSid = modal.querySelector("#fb-show-sid").checked
			settings.volume = parseFloat(modal.querySelector("#fb-vol").value)
			settings.customSound = modal.querySelector("#fb-sound-data").value.trim()
			settings.ignoreList = modal.querySelector("#fb-ignore-data").value.trim()
			modal.querySelectorAll(".f-act").forEach(el => (settings.filters[el.dataset.id].active = el.checked))
			modal.querySelectorAll(".f-prc").forEach(el => (settings.filters[el.dataset.id].maxPrice = parseInt(el.value)))
			saveSettings()
			location.reload()
		}
		modal.style.display = "block"
	}
	const replaceTopUpButton = () => {
		const topUpBtn = Array.from(document.querySelectorAll("button")).find(b => b.textContent.includes("Пополнить"))
		if (topUpBtn && !topUpBtn.dataset.fbHandled) {
			topUpBtn.dataset.fbHandled = "true"
			topUpBtn.innerHTML = `
                <svg width="1.6rem" height="1.6rem" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <span class="sc-hGYSAu jNXFQR">Настройки</span>
            `
			topUpBtn.onclick = e => {
				e.preventDefault()
				e.stopPropagation()
				openSettings()
			}
		}
	}
	const playSound = () => {
		const src = settings.customSound || "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3",
			audio = new Audio(src)
		audio.volume = settings.volume
		audio.play().catch(() => {})
	}
	const getPrice = card => {
		const priceEl = card.querySelector(".sc-bfyqmL.bLtkdH") || card.querySelector(".sc-kZGvTt.dOzkEm div") || card.querySelector(".sc-kZGvTt")
		return priceEl ? parseInt(priceEl.textContent.replace(/[^\d]/g, "")) : null
	}
	const injectSidBadge = card => {
		if (!settings.showSid || card.querySelector(".fb-sid-badge")) return
		const textNodes = Array.from(card.querySelectorAll("span"))
		const sidNode = textNodes.find(n => n.textContent.includes("SID:"))
		if (sidNode) {
			const sidValue = sidNode.textContent.replace("SID:", "").trim()
			const badge = document.createElement("div")
			badge.className = "fb-sid-badge"
			badge.textContent = `SID: ${sidValue}`
			const match = sidValue.match(/\.(\d)(\1)(\1)/)
			if (match) badge.classList.add("fb-sid-lucky")
			card.style.position = "relative"
			card.appendChild(badge)
		}
	}
	const attemptPurchase = (card, colorId) => {
		if (!settings.enabled || processedItems.has(card)) return
		const cardText = card.innerText.toLowerCase()
		if (settings.ignoreList) {
			const ignores = settings.ignoreList
				.split("\n")
				.map(s => s.trim().toLowerCase())
				.filter(s => s.length > 0)
			if (ignores.some(ignore => cardText.includes(ignore))) return
		}
		const price = getPrice(card)
		const filter = settings.filters[colorId]
		if (price && filter?.active && price <= filter.maxPrice) {
			processedItems.add(card)
			playSound()
			card.click()
			let found = false
			const buyObserver = new MutationObserver((_, obs) => {
				const buyBtn = Array.from(document.querySelectorAll("button")).find(b => b.textContent.includes("Купить снаряжение"))
				if (buyBtn && !found) {
					found = true
					buyBtn.click()
					obs.disconnect()
				}
			})
			buyObserver.observe(document.body, { childList: true, subtree: true })
			setTimeout(() => buyObserver.disconnect(), 3000)
		}
	}
	const checkNode = node => {
		if (!node || node.nodeType !== 1) return
		replaceTopUpButton()
		const cards = node.matches('[class*="sc-jOdwRd"]') ? [node] : node.querySelectorAll('[class*="sc-jOdwRd"]')
		cards.forEach(card => {
			injectSidBadge(card)
			for (const colorId in settings.filters) {
				if (card.classList.contains(colorId)) {
					attemptPurchase(card, colorId)
					break
				}
			}
		})
	}
	const o = new MutationObserver(i => {
		for (const n of i) n.addedNodes.forEach(node => checkNode(node))
	})
	o.observe(document.body, { childList: true, subtree: true })
	checkNode(document.body)
})()
