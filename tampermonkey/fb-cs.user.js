// ==UserScript==
// @name         FB-CS Utils
// @namespace    FB-CS
// @version      1.5
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
		showSid: false,
		volume: 0.05,
		customSound: "",
		ignoreList: "",
		delayEnabled: false,
		delayMin: 100,
		delayMax: 1100,
		filters: {
			bBlawa: { name: "Ширпотреб", maxPrice: 1000, active: false },
			XoqHe: { name: "Промышленное качество", maxPrice: 1000, active: false },
			hOWJvf: { name: "Армейское качество", maxPrice: 1000, active: false },
			jlUihS: { name: "Запрещённое", maxPrice: 5000, active: false },
			bnXJGC: { name: "Засекреченное", maxPrice: 10000, active: false },
			irvjXF: { name: "Тайное", maxPrice: 20000, active: false },
			bOqyVa: { name: "Ножи", maxPrice: 30000, active: false },
			gloves: { name: "Перчатки", maxPrice: 35000, active: false }
		}
	}
	const GLOVE_NAMES = ["Сломанный клык", "Бладхаунд", "Гидра", "Обмотки рук", "Мотоциклетные", "Спецназа", "Спортивные", "Водительские"]
	let saved = JSON.parse(localStorage.getItem("fb_utils_settings")) || {}
	let settings = { ...DEFAULT_SETTINGS, ...saved }
	const cleanFilters = {}
	for (const key in DEFAULT_SETTINGS.filters) {
		cleanFilters[key] = {
			...DEFAULT_SETTINGS.filters[key],
			...(saved.filters && saved.filters[key] ? saved.filters[key] : {})
		}
	}
	settings.filters = cleanFilters
	const processedItems = new WeakSet()
	let isModalOpen = false
	const saveSettings = () => localStorage.setItem("fb_utils_settings", JSON.stringify(settings))
	const style = document.createElement("style")
	style.textContent = `.fb-modal{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:#1a1a1a;color:white;border:1px solid #333;padding:10px 18px 18px 18px;z-index:10002;border-radius:16px;display:none;width:450px;box-shadow:0 2px 16px 2px rgba(0,0,0,.7);font-family:sans-serif;font-size:14px;max-height:90vh;overflow-y:auto}.fb-modal-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:15px}.fb-modal-header h2{margin:0;font-size:18px;color:#1e91e4}.fb-close-x{cursor:pointer;font-size:24px;color:#666}.fb-modal-row{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;background:#222;padding:10px 15px;border-radius:10px}.fb-switch{position:relative;display:inline-block;width:40px;height:22px}.fb-switch input{opacity:0;width:0;height:0}.fb-slider{position:absolute;cursor:pointer;top:0;left:0;right:0;bottom:0;background-color:#444;transition:.4s;border-radius:34px}.fb-slider:before{position:absolute;content:"";height:16px;width:16px;left:3px;bottom:3px;background-color:white;transition:.4s;border-radius:50%}input:checked + .fb-slider{background-color:#1e91e4}input:checked + .fb-slider:before{transform:translateX(18px)}.fb-input-num{width:75px;background:#333;border:1px solid #444;color:#0f0;padding:6px;border-radius:6px;text-align:center;font-weight:700}.fb-range{width:100%;cursor:pointer}.fb-textarea{width:100%;background:#222;border:1px solid #333;color:#ccc;border-radius:10px;padding:10px;box-sizing:border-box;resize:vertical;font-size:12px;margin-top:5px;outline:none}.fb-label-small{display:block;margin-top:10px;color:#888;font-size:11px;text-transform:uppercase}.fb-save-btn{background:#1e91e4;color:white;border:none;padding:12px;width:100%;border-radius:10px;cursor:pointer;margin-top:15px;font-weight:700}.fb-sid-badge{position:absolute;top:8px;left:8px;background:rgba(0,0,0,.6);padding:2px 6px;border-radius:4px;font-size:11px;font-weight:700;color:#aaa;z-index:5;pointer-events:none}.fb-sid-lucky{color:#00ff00!important;text-shadow:0 0 8px #0f0}`
	document.head.appendChild(style)
	const modal = document.createElement("div")
	modal.className = "fb-modal"
	document.body.appendChild(modal)
	const openSettings = () => {
		if (isModalOpen) return
		isModalOpen = true
		const filtersHtml = Object.entries(settings.filters).map(([id, f]) =>`<div class="fb-modal-row"><span style="font-weight:bold">${f.name}</span><div style="display:flex; align-items:center; gap:10px"><input type="number" data-id="${id}" class="f-prc fb-input-num" value="${f.maxPrice}"><label class="fb-switch"><input type="checkbox" data-id="${id}" class="f-act" ${f.active ? "checked" : ""}><span class="fb-slider"></span></label></div></div>`).join("")
		modal.innerHTML = `<div class="fb-modal-header"><h2>Настройки</h2><span class="fb-close-x">&times;</span></div><div class="fb-modal-row"><span>Автозакупка</span><label class="fb-switch"><input type="checkbox" id="fb-master" ${settings.enabled ? "checked" : ""}><span class="fb-slider"></span></label></div><div class="fb-modal-row"><span>Использовать задержку</span><label class="fb-switch"><input type="checkbox" id="fb-delay-en" ${settings.delayEnabled ? "checked" : ""}><span class="fb-slider"></span></label></div><div class="fb-modal-row"><span>Минимум/Максимум в мс</span><div style="display:flex; gap:5px"><input type="number" id="fb-delay-min" class="fb-input-num" value="${settings.delayMin || 100}"><input type="number" id="fb-delay-max" class="fb-input-num" value="${settings.delayMax || 1100}"></div></div><div class="fb-modal-row"><span>Показывать SID</span><label class="fb-switch"><input type="checkbox" id="fb-show-sid" ${settings.showSid ? "checked" : ""}><span class="fb-slider"></span></label></div><div style="margin-bottom:15px"><div style="display:flex; justify-content:space-between; margin-bottom:5px"><span>Громкость</span><span id="vol-val">${Math.round(settings.volume * 100)}%</span></div><input type="range" id="fb-vol" class="fb-range" min="0" max="1" step="0.01" value="${settings.volume}"></div> ${filtersHtml} <span class="fb-label-small">Звук (URL или Base64)</span><textarea id="fb-sound-data" class="fb-textarea" placeholder="Стандартный звук" rows="1">${settings.customSound || ""}</textarea><span class="fb-label-small">Игнорировать (с новой строки)</span><textarea id="fb-ignore-data" class="fb-textarea" placeholder="Название товара.." rows="3">${settings.ignoreList || ""}</textarea><button class="fb-save-btn">Применить</button>`
		modal.querySelector(".fb-close-x").onclick = () => {
			modal.style.display = "none"
			isModalOpen = false
		}
		modal.querySelector("#fb-vol").oninput = e => (modal.querySelector("#vol-val").textContent = Math.round(e.target.value * 100) + "%")
		modal.querySelector(".fb-save-btn").onclick = () => {
			settings.enabled = modal.querySelector("#fb-master").checked
			settings.delayEnabled = modal.querySelector("#fb-delay-en").checked
			settings.delayMin = parseInt(modal.querySelector("#fb-delay-min").value)
			settings.delayMax = parseInt(modal.querySelector("#fb-delay-max").value)
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
		const btns = document.getElementsByTagName("button")
		for (let b of btns) {
			if (b.textContent.includes("Пополнить") && !b.dataset.fbHandled) {
				b.dataset.fbHandled = "true"
				b.innerHTML = `<svg width="1.6rem" height="1.6rem" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg><span class="sc-hGYSAu jNXFQR">Настройки</span>`
				b.onclick = e => {
					e.preventDefault()
					e.stopPropagation()
					openSettings()
				}
				break
			}
		}
	}
	const playSound = () => {
		const audio = new Audio(settings.customSound || "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3")
		audio.volume = settings.volume
		audio.play().catch(() => {})
	}
	const getPrice = card => {
		const el = card.querySelector(".sc-bfyqmL.bLtkdH, .sc-kZGvTt.dOzkEm div, .sc-kZGvTt")
		return el ? parseInt(el.textContent.replace(/[^\d]/g, "")) : null
	}
	const attemptPurchase = (card, filterId) => {
		if (!settings.enabled || processedItems.has(card)) return
		if (settings.ignoreList) {
			const text = card.innerText.toLowerCase()
			const ignores = settings.ignoreList.toLowerCase().split("\n").map(s => s.trim()).filter(s => s)
			if (ignores.some(i => text.includes(i))) return
		}
		const price = getPrice(card)
		const filter = settings.filters[filterId]
		if (price && filter?.active && price <= filter.maxPrice) {
			processedItems.add(card)
			const delay = settings.delayEnabled ? Math.floor(Math.random() * (settings.delayMax - settings.delayMin + 1)) + settings.delayMin : 0
			setTimeout(() => {
				if (!document.body.contains(card)) return
				playSound()
				card.click()
				let findAttempts = 0
				const interval = setInterval(() => {
					const buyBtn = Array.from(document.getElementsByTagName("button")).find(b => b.textContent.toLowerCase().includes("купить снаряжение"))
					if (buyBtn) {
						buyBtn.click()
						clearInterval(interval)
					}
					if (++findAttempts > 20) clearInterval(interval)
				}, 100)
			}, delay)
		}
	}
	const checkNode = node => {
		if (!node || node.nodeType !== 1) return
		requestAnimationFrame(() => {
			replaceTopUpButton()
			const cards = node.querySelectorAll('[class*="sc-jOdwRd"]')
			if (node.className && node.className.includes && node.className.includes("sc-jOdwRd")) processCard(node)
			cards.forEach(processCard)
		})
	}
	const processCard = card => {
		if (processedItems.has(card)) return
		if (settings.showSid && !card.querySelector(".fb-sid-badge")) {
			const spans = card.getElementsByTagName("span")
			for (let s of spans) {
				if (s.textContent.includes("SID:")) {
					const sid = s.textContent.replace("SID:", "").trim()
					const badge = document.createElement("div")
					badge.className = "fb-sid-badge"
					badge.textContent = `SID: ${sid}`
					if (sid.match(/\.(\d)(\1)(\1)/)) badge.classList.add("fb-sid-lucky")
					card.style.position = "relative"
					card.appendChild(badge)
					break
				}
			}
		}
		const weaponNameEl = card.querySelector(".sc-jbvGK")
		const weaponName = weaponNameEl ? weaponNameEl.textContent.trim() : ""
		const isGlove = GLOVE_NAMES.some(name => weaponName.includes(name))
		if (isGlove) {
			attemptPurchase(card, "gloves")
			return
		}
		for (const colorId in settings.filters) {
			if (colorId === "gloves") continue
			if (card.classList.contains(colorId)) {
				attemptPurchase(card, colorId)
				break
			}
		}
	}
	const observer = new MutationObserver(mutations => {
		for (let m of mutations) for (let n of m.addedNodes) checkNode(n)
	})
	observer.observe(document.body, { childList: true, subtree: true })
	checkNode(document.body)
})()
