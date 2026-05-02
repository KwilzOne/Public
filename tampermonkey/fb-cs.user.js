// ==UserScript==
// @name         FB-CS Utils
// @namespace    FB-CS
// @version      2.6
// @description  Tools for fb-cs.ru
// @author       Kwilz
// @homepageURL  https://github.com/KwilzOne/Public
// @updateURL    https://raw.githubusercontent.com/KwilzOne/Public/refs/heads/whitewolf/tampermonkey/fb-cs.user.js
// @downloadURL  https://raw.githubusercontent.com/KwilzOne/Public/refs/heads/whitewolf/tampermonkey/fb-cs.user.js
// @match        *://fb-cs.ru/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=fb-cs.ru
// @grant        none
// @run-at       document-start
// ==/UserScript==

;(function () {
	"use strict"
	const DEFAULT_SETTINGS = {
		pos: { x: 50, y: 50, unit: "%" },
		chatPos: { x: 50, y: 50, unit: "%" },
		chatSize: { width: 350, height: 650, unit: "px" },
		enabled: false,
		showSid: false,
		showStatTrak: false,
		showID: false,
		showAllID: false,
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
		},
		compactCards: false,
		compactChat: false,
		floatingChat: false,
		accentColor: "#1e91e4",
		bgColor: "#091221",
		bgBrightness: 0.0,
		bgImage: "",
		bgImageEnabled: false,
		itemsPerPage: 50,
		showAvgPrice: "NONE"
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
	let isModalOpen = false
	let processedItems = new WeakSet()
	const _pendingAvgRequests = new Map()
	const saveSettings = () => localStorage.setItem("fb_utils_settings", JSON.stringify(settings))
	const getAvgPrice = async idObj => {
		if (!idObj || typeof idObj !== "object") return null
		let interval, period
		switch (settings.showAvgPrice) {
			case "DAY":
				interval = "HOUR"
				period = 1
				break
			case "WEEK":
				interval = "WEEK"
				period = 1
				break
			case "MONTH":
				interval = "MONTH"
				period = 1
				break
			case "YEAR":
				interval = "YEAR"
				period = 12
				break
			default:
				return null
		}
		const cacheKey = `fb_avg_${idObj.type}_${idObj.val}_${interval}_${period}`
		const cached = localStorage.getItem(cacheKey)
		if (cached) {
			try {
				const parsed = JSON.parse(cached)
				if (Date.now() - parsed.time < 1000 * 60 * 60 * 2) return parsed.price
			} catch (e) {}
		}
		if (_pendingAvgRequests.has(cacheKey)) return _pendingAvgRequests.get(cacheKey)
		const promise = (async () => {
			try {
				const res = await fetch(`https://api.fb-cs.ru/market/stats?${idObj.type}=${idObj.val}&interval=${interval}&period=${period}`)
				const data = await res.json()
				if (Array.isArray(data) && data.length > 0) {
					let sum = 0,
						count = 0
					data.forEach(item => {
						if (item.avgPrice) {
							sum += item.avgPrice
							count++
						}
					})
					const avg = count > 0 ? Math.round(sum / count) : 0
					if (avg > 0) {
						localStorage.setItem(cacheKey, JSON.stringify({ price: avg, time: Date.now() }))
						return avg
					}
				}
			} catch (e) {}
			return null
		})()
		_pendingAvgRequests.set(cacheKey, promise)
		const result = await promise
		_pendingAvgRequests.delete(cacheKey)
		return result
	}
	window._lastRealCount = 0
	const originalXHROpen = XMLHttpRequest.prototype.open
	XMLHttpRequest.prototype.open = function (method, url, ...rest) {
		this._fbOriginalUrl = url
		if (typeof url === "string" && (url.includes("api.fb-cs.ru/market") || url.includes("api.fb-cs.ru/profile/"))) {
			this._fbIntercepted = true
			try {
				const urlStr = url.startsWith("/") ? location.origin + url : url
				const urlObj = new URL(urlStr)
				if (urlObj.searchParams.has("limit") && urlObj.searchParams.has("offset")) {
					let newLimit = settings.itemsPerPage || 50
					let originalOffset = parseInt(urlObj.searchParams.get("offset"))
					if (window._fbForceOriginalOffset !== undefined) {
						originalOffset = window._fbForceOriginalOffset
						window._fbForceOriginalOffset = undefined
					}
					const page = Math.floor(originalOffset / 50)
					const newOffset = page * newLimit
					urlObj.searchParams.set("limit", newLimit.toString())
					urlObj.searchParams.set("offset", newOffset.toString())
					if (url.startsWith("/")) {
						url = urlObj.pathname + urlObj.search
					} else url = urlObj.toString()
					this._fbNewLimit = newLimit
				}
			} catch (e) {}
		}
		return originalXHROpen.call(this, method, url, ...rest)
	}
	const originalXHRResponseText = Object.getOwnPropertyDescriptor(XMLHttpRequest.prototype, "responseText")
	if (originalXHRResponseText) {
		Object.defineProperty(XMLHttpRequest.prototype, "responseText", {
			get: function () {
				const text = originalXHRResponseText.get.call(this)
				if (this._fbIntercepted && text) {
					try {
						const data = JSON.parse(text)
						let modified = false
						if (data && data.count !== undefined && this._fbNewLimit) {
							window._lastRealCount = data.count
							const realPages = Math.ceil(data.count / this._fbNewLimit)
							data.count = Math.max(1, realPages) * 50
							modified = true
						}
						if (data && data.items && Array.isArray(data.items)) {
							window._fbSkinIds = window._fbSkinIds || {}
							data.items.forEach(it => {
								if (it.skinInfo) {
									let idObj = null
									if (it.skinInfo.item) idObj = { type: "skinId", val: it.skinInfo.item }
									else if (it.skinInfo.group) idObj = { type: "itemId", val: it.skinInfo.group }
									if (idObj) {
										if (it.id) window._fbSkinIds[it.id] = idObj
										if (it.itemId) window._fbSkinIds[it.itemId] = idObj
									}
								}
							})
						}
						if (modified) return JSON.stringify(data)
					} catch (e) {}
				}
				return text
			}
		})
	}
	const fastForward = async direction => {
		if (!window._lastRealCount) return
		const newLimit = settings.itemsPerPage || 50
		const totalPages = Math.ceil(window._lastRealCount / newLimit)
		const targetPage = direction === "end" ? Math.max(0, totalPages - 1) : 0
		const pageItems = Array.from(document.querySelectorAll(".page-item"))
		if (!pageItems.length) return
		let handled = false
		for (let el of pageItems) {
			const fiberKey = Object.keys(el).find(k => k.startsWith("__reactFiber$"))
			if (!fiberKey) continue
			let curr = el[fiberKey]
			while (curr) {
				const props = curr.memoizedProps
				if (props) {
					if (typeof props.onPageChange === "function") {
						props.onPageChange({ selected: targetPage })
						handled = true
						break
					} else if (typeof props.onChange === "function" && typeof props.current === "number") {
						props.onChange(targetPage + 1)
						handled = true
						break
					} else if (typeof props.setPage === "function") {
						props.setPage(targetPage + 1)
						handled = true
						break
					} else if (typeof props.onPageClick === "function") {
						props.onPageClick(targetPage + 1)
						handled = true
						break
					}
				}
				curr = curr.return
			}
			if (handled) break
		}
		if (!handled) {
			window._fbForceOriginalOffset = targetPage * 50
			const activeBtn = document.querySelector(".page-item.active") || pageItems[0]
			if (activeBtn) activeBtn.click()
		}
	}
	const style = document.createElement("style")
	style.textContent = `.fb-modal{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:#1a1a1a;color:white;border:1px solid #333;padding:10px 18px 18px 18px;z-index:10002;border-radius:16px;display:none;width:450px;box-shadow:0 2px 16px 2px rgba(0,0,0,.7);font-family:sans-serif;font-size:14px;max-height:90vh;overflow-y:auto}.fb-modal-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:15px;user-select:none}.fb-modal-header h2{margin:0;font-size:18px;color:var(--fb-accent)}.fb-close-x{cursor:pointer;font-size:24px;color:#666}.fb-modal-row{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;background:#222;padding:10px 15px;border-radius:10px}.fb-switch{position:relative;display:inline-block;width:40px;height:22px}.fb-switch input{opacity:0;width:0;height:0}.fb-range{-webkit-appearance:none;width:100%;background:transparent;margin:10px 0}.fb-range::-webkit-slider-runnable-track{width:100%;height:6px;cursor:pointer;background:#333;border-radius:3px}.fb-range::-webkit-slider-thumb{height:14px;width:14px;border-radius:50%;background:var(--fb-accent);cursor:pointer;-webkit-appearance:none;margin-top:-5px;box-shadow:0 0 10px rgba(0,0,0,.5);transition:transform 0.1s ease}.fb-range:active::-webkit-slider-thumb{transform:scale(1.18)}input[type="color"]{-webkit-appearance:none;border:none;width:28px;height:28px;background:none;cursor:pointer;padding:0}input[type="color"]::-webkit-color-swatch-wrapper{padding:0}input[type="color"]::-webkit-color-swatch{border:2px solid #444;border-radius:12px;box-shadow:inset 0 0 5px rgba(0,0,0,.5)}input[type="color"]:hover::-webkit-color-swatch{border-color:var(--fb-accent)}.fb-slider{position:absolute;cursor:pointer;top:0;left:0;right:0;bottom:0;background-color:#444;transition:0.4s;border-radius:34px}.fb-slider:before{position:absolute;content:"";height:16px;width:16px;left:3px;bottom:3px;background-color:white;transition:0.4s;border-radius:50%}input:checked + .fb-slider{background-color:var(--fb-accent)}input:checked + .fb-slider:before{transform:translateX(18px)}.fb-input-num{width:75px;background:#333;border:1px solid #444;color:#0f0;padding:6px;border-radius:6px;text-align:center;font-weight:700}.fb-range{width:100%;cursor:pointer}.fb-textarea{width:100%;background:#222;border:1px solid #333;color:#ccc;border-radius:10px;padding:10px;box-sizing:border-box;resize:vertical;font-size:12px;margin-top:5px;outline:none}.fb-label-small{display:block;margin-top:10px;color:#888;font-size:11px;text-transform:uppercase}.fb-save-btn{background:var(--fb-accent);color:white;border:none;padding:12px;width:100%;border-radius:10px;cursor:pointer;margin-top:15px;font-weight:700}.fb-badges-container{position:absolute;top:8px;left:8px;z-index:5;display:flex;flex-direction:column;align-items:flex-start;gap:4px;pointer-events:none}.fb-sid-badge{position:static;background:rgba(0,0,0,.7);border:1px solid rgba(169,169,169,.3);padding:1px 6px;border-radius:4px;font-size:11px;font-weight:700;color:#bebebe;z-index:5;pointer-events:none;backdrop-filter:contrast(.35)}.fb-st-badge{position:static;background:rgba(70,40,0,.7);border:1px solid rgba(255,140,40,.3);padding:1px 6px;border-radius:4px;font-size:11px;font-weight:700;color:#ff9600d4;z-index:5;pointer-events:none;backdrop-filter:contrast(.35)}.fb-id-badge{position:static;background:rgba(0,60,60,.7);border:1px solid rgba(40,255,255,.3);padding:1px 6px;border-radius:4px;font-size:11px;font-weight:700;color:#00dbff;z-index:5;pointer-events:none;backdrop-filter:contrast(.35)}.fb-sid-lucky{color:#39d639!important;text-shadow:0 0 8px #0f0}.fb-filters-spoiler{margin-top:10px;background:#222;border-radius:10px;overflow:hidden}.fb-filters-spoiler summary{padding:12px;cursor:pointer;background:#2a2a2a;font-weight:700;color:var(--fb-accent);list-style:none}.fb-filters-spoiler summary::-webkit-details-marker{display:none}.fb-filters-content{padding:10px;border-top:1px solid #333}.fb-filters-content .fb-modal-row{margin-bottom:8px;background:#1a1a1a}.fb-modal::-webkit-scrollbar{height:.4rem;width:.4rem;border:.1rem solid transparent}.fb-modal::-webkit-scrollbar-thumb{background:var(--fb-accent)!important;border-radius:0.5rem!important}.fb-modal::-webkit-scrollbar-track{background:rgba(255,255,255,.1)!important}.fb-avg-badge{position:static;background:rgba(60,60,0,.7);border:1px solid rgba(255,255,40,.3);padding:1px 6px;border-radius:4px;font-size:11px;font-weight:700;color:#ffff00;z-index:5;pointer-events:none;backdrop-filter:contrast(.35)}`
	style.textContent += `:root{--fb-accent:${settings.accentColor};--fb-background:${settings.bgColor};--background-image:url(${settings.bgImage});--background-position:center;--background-size:cover;--background-brightness:${settings.bgBrightness}}:root .jVwgVQ,:root .YplaL,:root .eszHOG,:root .hDQSqz,:root .kgjPgA,:root .fpnERy,:root .hZDqe,:root .itxNGN,:root .ecVLrf.active{background:var(--fb-accent)!important}:root .bLtkdH,:root .ergKwa,:root .qhXYW,:root .ihiiiW,:root .hRcvNs,:root .hpPCQj,:root .gJkUif,:root .lnczUT,:root .hMfnat,:root .YjtWz.active{color:var(--fb-accent)!important}:root .ihiiiW,:root .gJkUif,:root .lnczUT,:root .hMfnat{border:1px solid var(--fb-accent)!important}:root .qhXYW{text-shadow:var(--fb-accent) 0 0 25px!important}:root g[clip-path="url(#clip0_3743_56040)"] path,:root g[clip-path="url(#clip0_3743_56063)"] path{fill:var(--fb-accent)!important}:root .dKqNmC::before{background:linear-gradient(90deg,transparent,var(--fb-accent),rgba(255,255,255,.2),transparent) 0% 0% / 300% 100%!important}path[stroke="#1E91E4"],path[stroke="#1e92e4dc"]{stroke:var(--fb-accent)!important}path[fill="#1E91E4"],path[fill="#379FEA"]{fill:var(--fb-accent)!important}path[fill="url(#colorUv)"]{fill:color-mix(in srgb,var(--fb-accent),transparent 95%)!important}:root .fsUcvf{background:color-mix(in srgb,var(--fb-background),transparent 20%)!important}:root .hEMMQK{background:color-mix(in srgb,var(--fb-background),transparent 10%)!important}:root .jQFJeY{background-color:rgb(255,255,255,.03)!important}:root html::-webkit-scrollbar-thumb,:root body::-webkit-scrollbar-thumb,:root .jXtyNN::-webkit-scrollbar-thumb{background:var(--fb-accent)!important}:root html,:root body,:root .fcFCsI{background-color:var(--fb-background)!important;background-image:linear-gradient(rgba(0,0,0,var(--background-brightness)),rgba(0,0,0,var(--background-brightness))),var(--background-image)!important;background-position:var(--background-position)!important;background-size:var(--background-size)!important;background-repeat:no-repeat!important;background-attachment:fixed!important}`
	style.textContent += `html{overflow:auto!important;padding-right:0!important}body.fb-compact-chat .sc-bgqpqT.fcFCsI.active{background:color-mix(in srgb,var(--fb-accent),transparent 95%)!important;border-radius:10px!important;gap:unset!important}body.fb-compact-chat .sc-czZcoD.jtHNsi{color:var(--fb-accent)!important}body.fb-compact-chat .sc-czZcoD.jtHNsi svg{display:none!important}body.fb-compact-chat .jXtyNN{gap:1.2rem!important}body.fb-compact-chat .jHEDrN{background:transparent!important;padding:0!important;border-radius:0!important;gap:0!important}body.fb-compact-chat .edPMpk{height:auto!important;font-size:1.3rem!important;line-height:normal!important}body.fb-compact-chat .jzYtOE{font-size:1.5rem!important;line-height:normal!important}body.fb-compact-chat .sc-bZPPFW.ecKAZE{height:50px!important}body.fb-compact-chat .hqATVU{right:2rem!important;top:1rem!important}body.fb-compact-chat .SCILI{width:14px!important;margin-right:2rem!important;margin-bottom:1rem!important}body.fb-floating-chat .sc-TlkDZ.kncvPL{position:fixed!important;top:50%;left:50%;transform:translate(-50%,-50%);z-index:9999;height:650px;width:350px;overflow:hidden;resize:both;min-width:250px;min-height:400px;border-radius:16px;border:1px solid #333;background:#1a1a1a9e;box-shadow:0 2px 16px 2px rgba(0,0,0,.7)!important;transition:unset!important}body.fb-floating-chat .gGUzDV{width:auto!important}body.fb-floating-chat .sc-TlkDZ.kncvPL,body.fb-floating-chat .dwwhoN,body.fb-floating-chat .fcFCsI,body.fb-floating-chat .hkULFZ{transition:unset!important}body.fb-floating-chat .fcFCsI{max-height:100vh;max-width:100vw}body.fb-floating-chat .sc-TlkDZ.kncvPL>form{height:100%}body.fb-floating-chat .sc-TlkDZ.hkULFZ:has(form.sc-bgqpqT.dwwhoN.none){pointer-events:none}body.fb-floating-chat .sc-icLIcW.jQFJeY{pointer-events:auto!important}body.fb-floating-chat form.sc-bgqpqT.dwwhoN.none{display:none!important}body.fb-compact-cards .cRqJDn,body.fb-compact-cards .huPTcR{grid-template-columns:repeat(auto-fill,minmax(23rem,1fr))!important}body.fb-compact-cards .bBlawa,body.fb-compact-cards .XoqHe,body.fb-compact-cards .hOWJvf,body.fb-compact-cards .jlUihS,body.fb-compact-cards .bnXJGC,body.fb-compact-cards .irvjXF,body.fb-compact-cards .bOqyVa{border-radius:10px!important;height:18rem!important;width:auto!important}body.fb-compact-cards .bBlawa img,body.fb-compact-cards .XoqHe img,body.fb-compact-cards .hOWJvf img,body.fb-compact-cards .jlUihS img,body.fb-compact-cards .bnXJGC img,body.fb-compact-cards .irvjXF img,body.fb-compact-cards .bOqyVa img{align-self:self-end!important;object-fit:contain!important}body.fb-compact-cards .irvkdq,body.fb-compact-cards .hOWJtk,body.fb-compact-cards .XoqDZ,body.fb-compact-cards .jlUihl,body.fb-compact-cards .bBlasV,body.fb-compact-cards .bOqyPp,body.fb-compact-cards .bnXJAR{border-radius:10px!important;height:18rem!important;width:auto!important}body.fb-compact-cards .irvkdq img,body.fb-compact-cards .hOWJtk img,body.fb-compact-cards .XoqDZ img,body.fb-compact-cards .jlUihl img,body.fb-compact-cards .bBlasV img,body.fb-compact-cards .bOqyPp img,body.fb-compact-cards .bnXJAR img{align-self:self-end!important;object-fit:contain!important}body.fb-compact-cards .keAbTU{background:transparent!important;transform:translateY(-66px);transition:none!important}body.fb-compact-cards .fUCZtT{box-shadow:0 0 7px 3px rgba(81,142,197,.5)}body.fb-compact-cards .bFtebR{box-shadow:0 0 7px 3px rgba(202,176,92,.5)}body.fb-compact-cards .klEIsy{outline:none!important}body.fb-compact-cards .csdRkI{font-size:0!important;line-height:0!important}body.fb-compact-cards .dHBPpg{display:none!important}`
	document.head.appendChild(style)
	const modal = document.createElement("div")
	modal.className = "fb-modal"
	const applyTheme = () => {
		const root = document.documentElement
		root.style.setProperty("--fb-accent", settings.accentColor)
		root.style.setProperty("--fb-background", settings.bgColor)
		root.style.setProperty("--background-brightness", settings.bgBrightness)
		const imgValue = settings.bgImageEnabled && settings.bgImage.trim() ? `url(${settings.bgImage})` : "none"
		root.style.setProperty("--background-image", imgValue)
	}
	const applyExtraStyles = () => {
		if (settings.compactCards) {
			document.body.classList.add("fb-compact-cards")
		} else document.body.classList.remove("fb-compact-cards")
		if (settings.compactChat) {
			document.body.classList.add("fb-compact-chat")
		} else document.body.classList.remove("fb-compact-chat")
		if (settings.floatingChat) {
			document.body.classList.add("fb-floating-chat")
		} else {
			document.body.classList.remove("fb-floating-chat")
			const chatEl = document.querySelector(".sc-TlkDZ")
			if (chatEl) {
				chatEl.style.cssText = ""
				delete chatEl.dataset.fbDraggable
				const chatForm = chatEl.querySelector("form")
				if (chatForm) delete chatForm.dataset.dragInit
			}
		}
	}
	const makeDraggable = (el, settingsKey, handleSelector = null) => {
		const handle = handleSelector ? el.querySelector(handleSelector) : el
		if (!handle || handle.dataset.dragInit) return
		handle.dataset.dragInit = "true"
		handle.style.cursor = "move"
		handle.addEventListener("mousedown", e => {
			if (e.target.closest("button, input, textarea")) return
			const rect = el.getBoundingClientRect()
			const startX = e.clientX - rect.left
			const startY = e.clientY - rect.top
			const onMouseMove = e => {
				let x = e.clientX - startX
				let y = e.clientY - startY
				const maxX = window.innerWidth - el.offsetWidth
				const maxY = window.innerHeight - el.offsetHeight
				el.style.left = Math.max(0, Math.min(x, maxX)) + "px"
				el.style.top = Math.max(0, Math.min(y, maxY)) + "px"
				el.style.transform = "none"
				el.style.margin = "0"
			}
			const onMouseUp = () => {
				document.removeEventListener("mousemove", onMouseMove)
				document.removeEventListener("mouseup", onMouseUp)
				settings[settingsKey] = { x: el.style.left, y: el.style.top, unit: "px" }
				saveSettings()
			}
			document.addEventListener("mousemove", onMouseMove)
			document.addEventListener("mouseup", onMouseUp)
		})
		if (settingsKey === "chatPos") {
			const ro = new ResizeObserver(entries => {
				for (let entry of entries) {
					if (entry.contentRect.width > 50) {
						settings.chatSize = {
							width: Math.round(entry.contentRect.width),
							height: Math.round(entry.contentRect.height)
						}
						saveSettings()
					}
				}
			})
			ro.observe(el)
		}
	}
	const openSettings = () => {
		if (isModalOpen) return
		isModalOpen = true
		const filtersHtml = Object.entries(settings.filters)
			.map(
				([id, f]) =>
					`<div class="fb-modal-row"><span style="font-weight:bold">${f.name}</span><div style="display:flex; align-items:center; gap:10px"><input type="number" data-id="${id}" class="f-prc fb-input-num" value="${f.maxPrice}"><label class="fb-switch"><input type="checkbox" data-id="${id}" class="f-act" ${f.active ? "checked" : ""}><span class="fb-slider"></span></label></div></div>`
			)
			.join("")
		modal.innerHTML = `<div class="fb-modal-header">
			<h2>Настройки</h2>
			<span class="fb-close-x">&times;</span>
		</div>
		<div class="fb-modal-row">
			<span>Автозакупка</span><label class="fb-switch"><input type="checkbox" id="fb-master" ${settings.enabled ? "checked" : ""} /><span class="fb-slider"></span></label>
		</div>
		<div class="fb-modal-row">
			<span>Использовать задержку</span><label class="fb-switch"><input type="checkbox" id="fb-delay-en" ${settings.delayEnabled ? "checked" : ""} /><span class="fb-slider"></span></label>
		</div>
		<div class="fb-modal-row">
			<span>Задержка (от/до) в мс</span>
			<div style="display: flex; gap: 5px">
				<input type="number" id="fb-delay-min" class="fb-input-num" value="${settings.delayMin || 100}" /><input type="number" id="fb-delay-max" class="fb-input-num" value="${settings.delayMax || 1100}" />
			</div>
		</div>
		<div style="margin-bottom: 15px">
			<div style="display: flex; justify-content: space-between; margin-bottom: 5px"><span>Громкость</span><span id="vol-val">${Math.round(settings.volume * 100)}%</span></div>
			<input type="range" id="fb-vol" class="fb-range" min="0" max="1" step="0.01" value="${settings.volume}" />
		</div>
		<details class="fb-filters-spoiler">
			<summary>Фильтры покупки по качеству и стоимости</summary>
			<div class="fb-filters-content">${filtersHtml}</div>
		</details>
		<details class="fb-filters-spoiler">
			<summary>Кастомизация</summary>
			<div class="fb-filters-content">
				<div class="fb-modal-row">
					<span>Компактный стиль чата</span>
					<label class="fb-switch"><input type="checkbox" id="fb-compact-chat" ${settings.compactChat ? "checked" : ""} /><span class="fb-slider"></span></label>
				</div>
				<div class="fb-modal-row">
					<span>Плавающий контейнер чата</span>
					<label class="fb-switch"><input type="checkbox" id="fb-floating-chat" ${settings.floatingChat ? "checked" : ""} /><span class="fb-slider"></span></label>
				</div>
				<div class="fb-modal-row">
					<span>Новый стиль карточек</span>
					<label class="fb-switch"><input type="checkbox" id="fb-compact-cards" ${settings.compactCards ? "checked" : ""} /><span class="fb-slider"></span></label>
				</div>
				<div class="fb-modal-row">
					<span>Цвет акцента</span>
					<input type="color" id="fb-clr-accent" value="${settings.accentColor}">
				</div>
				<div class="fb-modal-row">
					<span>Цвет фона</span>
					<input type="color" id="fb-clr-bg" value="${settings.bgColor}">
				</div>
				<div class="fb-modal-row">
					<span>Яркость фона</span>
					<input type="range" id="fb-bg-bright" class="fb-range" min="0" max="1" step="0.1" value="${settings.bgBrightness}" style="width: 100px;">
				</div>
				<div class="fb-modal-row">
					<input type="text" id="fb-bg-url" class="fb-textarea" style="margin-top:0; width:70%" placeholder="Фоновое изображение (URL)" value="${settings.bgImage}">
					<label class="fb-switch"><input type="checkbox" id="fb-bg-en" ${settings.bgImageEnabled ? "checked" : ""}><span class="fb-slider"></span></label>
				</div>
			</div>
		</details>
		<details class="fb-filters-spoiler">
			<summary>Утилиты</summary>
			<div class="fb-filters-content">
				<div class="fb-modal-row">
					<span>Показывать ID</span>
					<div style="display:flex; align-items:center; gap:15px">
						<label style="display:flex; align-items:center; gap:8px; font-size:12px; font-family: 'Gotham Pro'; cursor:pointer;">
							Красивые
							<div class="fb-switch"><input type="checkbox" id="fb-show-id" ${settings.showID ? "checked" : ""} /><span class="fb-slider"></span></div>
						</label>
						<label style="display:flex; align-items:center; gap:8px; font-size:12px; font-family: 'Gotham Pro'; cursor:pointer;">
							Все
							<div class="fb-switch"><input type="checkbox" id="fb-show-all-id" ${settings.showAllID ? "checked" : ""} /><span class="fb-slider"></span></div>
						</label>
					</div>
				</div>
				<div class="fb-modal-row">
					<span>Показывать SID</span>
					<label class="fb-switch"><input type="checkbox" id="fb-show-sid" ${settings.showSid ? "checked" : ""} /><span class="fb-slider"></span></label>
				</div>
				<div class="fb-modal-row">
					<span>Показывать StatTrak™</span>
					<label class="fb-switch"><input type="checkbox" id="fb-show-stattrak" ${settings.showStatTrak ? "checked" : ""} /><span class="fb-slider"></span></label>
				</div>
				<div class="fb-modal-row">
					<span>Показывать среднюю стоимость</span>
					<select id="fb-avg-price-sel" class="fb-input-num" style="width: 100px; font-size: 12px; cursor: pointer; padding: 2px;">
						<option value="NONE" ${settings.showAvgPrice === "NONE" ? "selected" : ""}>Нет</option>
						<option value="DAY" ${settings.showAvgPrice === "DAY" ? "selected" : ""}>День</option>
						<option value="WEEK" ${settings.showAvgPrice === "WEEK" ? "selected" : ""}>Неделю</option>
						<option value="MONTH" ${settings.showAvgPrice === "MONTH" ? "selected" : ""}>Месяц</option>
						<option value="YEAR" ${settings.showAvgPrice === "YEAR" ? "selected" : ""}>Год</option>
					</select>
				</div>
				<div class="fb-modal-row">
					<span>Хранилище кэша средней стоимости</span>
					<button id="fb-clear-avg-cache" style="background:var(--fb-accent);color:white;border:none;padding:6px 12px;border-radius:6px;cursor:pointer;font-weight:700;">Очистить</button>
				</div>
				<div class="fb-modal-row">
					<span>Лимит предметов на страницу</span>
					<div style="display:flex; align-items:center; gap:10px">
						<input type="range" id="fb-items-page" class="fb-range" min="10" max="200" step="5" value="${settings.itemsPerPage || 50}" style="width: 100px;">
						<span id="fb-items-val" style="width: 30px; text-align: right;">${settings.itemsPerPage || 50}</span>
					</div>
				</div>
			</div>
		</details>
		<span class="fb-label-small">Звук (URL или Base64)</span><textarea id="fb-sound-data" class="fb-textarea" placeholder="Стандартный звук" rows="1">${settings.customSound || ""}</textarea
		><span class="fb-label-small">Игнорировать (с новой строки)</span><textarea id="fb-ignore-data" class="fb-textarea" placeholder="Название товара.." rows="3">${settings.ignoreList || ""}</textarea
		><button class="fb-save-btn">Применить</button>`
		modal.querySelector(".fb-close-x").onclick = () => {
			modal.style.display = "none"
			isModalOpen = false
		}
		modal.querySelector("#fb-clear-avg-cache").onclick = () => {
			let count = 0
			Object.keys(localStorage).forEach(key => {
				if (key.startsWith("fb_avg_")) {
					localStorage.removeItem(key)
					count++
				}
			})
			showToast(`Очищено ${count} записей кэша`)
		}
		modal.querySelector("#fb-vol").oninput = e => (modal.querySelector("#vol-val").textContent = Math.round(e.target.value * 100) + "%")
		modal.querySelector("#fb-items-page").oninput = e => (modal.querySelector("#fb-items-val").textContent = e.target.value)
		modal.querySelector(".fb-save-btn").onclick = () => {
			const oldLimit = settings.itemsPerPage || 50
			const oldAvgPrice = settings.showAvgPrice
			settings.enabled = modal.querySelector("#fb-master").checked
			settings.delayEnabled = modal.querySelector("#fb-delay-en").checked
			settings.delayMin = parseInt(modal.querySelector("#fb-delay-min").value)
			settings.delayMax = parseInt(modal.querySelector("#fb-delay-max").value)
			settings.showSid = modal.querySelector("#fb-show-sid").checked
			settings.showStatTrak = modal.querySelector("#fb-show-stattrak").checked
			settings.showID = modal.querySelector("#fb-show-id").checked
			settings.showAllID = modal.querySelector("#fb-show-all-id").checked
			settings.compactChat = modal.querySelector("#fb-compact-chat").checked
			settings.floatingChat = modal.querySelector("#fb-floating-chat").checked
			settings.compactCards = modal.querySelector("#fb-compact-cards").checked
			settings.volume = parseFloat(modal.querySelector("#fb-vol").value)
			settings.customSound = modal.querySelector("#fb-sound-data").value.trim()
			settings.ignoreList = modal.querySelector("#fb-ignore-data").value.trim()
			settings.accentColor = modal.querySelector("#fb-clr-accent").value
			settings.bgColor = modal.querySelector("#fb-clr-bg").value
			settings.bgBrightness = modal.querySelector("#fb-bg-bright").value
			settings.bgImage = modal.querySelector("#fb-bg-url").value
			settings.bgImageEnabled = modal.querySelector("#fb-bg-en").checked
			settings.itemsPerPage = parseInt(modal.querySelector("#fb-items-page").value)
			settings.showAvgPrice = modal.querySelector("#fb-avg-price-sel").value
			modal.querySelectorAll(".f-act").forEach(el => (settings.filters[el.dataset.id].active = el.checked))
			modal.querySelectorAll(".f-prc").forEach(el => (settings.filters[el.dataset.id].maxPrice = parseInt(el.value)))
			modal.style.display = "none"
			isModalOpen = false
			applyTheme()
			applyExtraStyles()
			saveSettings()
			processedItems = new WeakSet()
			if (!settings.showSid) document.querySelectorAll(".fb-sid-badge").forEach(el => el.remove())
			if (!settings.showStatTrak) document.querySelectorAll(".fb-st-badge").forEach(el => el.remove())
			if (!settings.showID && !settings.showAllID) document.querySelectorAll(".fb-id-badge").forEach(el => el.remove())
			document.querySelectorAll('[class*="sc-jOdwRd"]').forEach(c => processCard(c, !!document.querySelector(".sc-QSnow.cRqJDn")))
			if (oldLimit !== settings.itemsPerPage || oldAvgPrice !== settings.showAvgPrice) {
				location.reload()
			} else showToast("Настройки успешно применены")
		}
		if (settings.pos && settings.pos.unit === "px") {
			modal.style.transform = "none"
			modal.style.margin = "0"
			modal.style.display = "block"
			modal.style.visibility = "hidden"
			let savedX = parseInt(settings.pos.x)
			let savedY = parseInt(settings.pos.y)
			const maxX = window.innerWidth - modal.offsetWidth
			const maxY = window.innerHeight - modal.offsetHeight
			modal.style.left = Math.max(0, Math.min(savedX, maxX)) + "px"
			modal.style.top = Math.max(0, Math.min(savedY, maxY)) + "px"
			modal.style.visibility = "visible"
		} else modal.style.display = "block"
		makeDraggable(modal, "pos", ".fb-modal-header")
		const liveInputs = {
			accentColor: "#fb-clr-accent",
			bgColor: "#fb-clr-bg",
			bgBrightness: "#fb-bg-bright",
			bgImage: "#fb-bg-url",
			bgImageEnabled: "#fb-bg-en"
		}
		Object.entries(liveInputs).forEach(([key, selector]) => {
			const input = modal.querySelector(selector)
			input.addEventListener("input", () => {
				settings[key] = input.type === "checkbox" ? input.checked : input.value
				applyTheme()
			})
		})
	}
	const playSound = () => {
		const audio = new Audio(settings.customSound || "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3")
		audio.volume = settings.volume
		audio.play().catch(() => {})
	}
	const showToast = (message = "", duration = 3000) => {
		const root = document.querySelector(".Toastify")
		if (!root) return
		let container = root.querySelector(".Toastify__toast-container")
		if (!container) {
			container = document.createElement("div")
			container.className = "Toastify__toast-container Toastify__toast-container--bottom-center"
			root.appendChild(container)
		}
		const toast = document.createElement("div")
		toast.id = Date.now().toString()
		toast.className = "Toastify__toast Toastify__toast-theme--dark Toastify__toast--success Toastify__toast--close-on-click Toastify--animate Toastify__slide-enter--bottom-center"
		toast.style = "--nth: 1; --len: 1;"
		toast.innerHTML = `<div role="alert" class="Toastify__toast-body toast-body"><div class="Toastify__toast-icon Toastify--animate-icon Toastify__zoom-enter"><svg viewBox="0 0 24 24" width="100%" height="100%" fill="var(--toastify-icon-color-success)"><path d="M12 0a12 12 0 1012 12A12.014 12.014 0 0012 0zm6.927 8.2l-6.845 9.289a1.011 1.011 0 01-1.43.188l-4.888-3.908a1 1 0 111.25-1.562l4.076 3.261 6.227-8.451a1 1 0 111.61 1.183z"></path></svg></div><div>${message}</div></div><div role="progressbar" aria-hidden="false" aria-label="notification timer" class="Toastify__progress-bar Toastify__progress-bar--animated Toastify__progress-bar-theme--dark Toastify__progress-bar--success" style="animation-duration: ${duration}ms; animation-play-state: running;"></div>`
		const removeToast = () => {
			toast.classList.replace("Toastify__slide-enter--bottom-center", "Toastify__slide-exit--bottom-center")
			setTimeout(() => toast.remove(), 400)
		}
		toast.onclick = removeToast
		container.appendChild(toast)
		setTimeout(removeToast, duration)
	}
	const getPrice = card => {
		const el = card.querySelector(".sc-bfyqmL.bLtkdH, .sc-kZGvTt.dOzkEm div, .sc-kZGvTt")
		return el ? parseInt(el.textContent.replace(/[^\d]/g, "")) : null
	}
	const humanClick = element => {
		if (!element) return
		const eventTypes = ["mouseenter", "mouseover", "mousedown", "mouseup", "click"]
		eventTypes.forEach(type => {
			const event = new MouseEvent(type, {
				bubbles: true,
				cancelable: true,
				view: window,
				buttons: 1
			})
			setTimeout(() => {
				element.dispatchEvent(event)
			}, Math.random() * 15)
		})
	}
	const attemptPurchase = (card, filterId, weaponName) => {
		if (settings.ignoreList) {
			const text = card.innerText.toLowerCase()
			const ignores = settings.ignoreList
				.toLowerCase()
				.split("\n")
				.map(s => s.trim())
				.filter(s => s)
			if (ignores.some(i => text.includes(i))) return
		}
		const price = getPrice(card)
		const filter = settings.filters[filterId]
		const isValid = () => {
			const currentName = card.querySelector(".sc-jbvGK")?.textContent.trim()
			return currentName === weaponName && getPrice(card) === price
		}
		if (price && filter?.active && price <= filter.maxPrice) {
			processedItems.add(card)
			const initialDelay = settings.delayEnabled ? Math.floor(Math.random() * (settings.delayMax - settings.delayMin + 1)) + settings.delayMin : Math.floor(Math.random() * 200) + 100
			setTimeout(() => {
				if (!document.body.contains(card) || !isValid()) return
				playSound()
				humanClick(card)
				let findAttempts = 0
				const interval = setInterval(() => {
					const container = document.getElementById("modal-scroll")
					if (!container) {
						if (++findAttempts > 30) clearInterval(interval)
						return
					}
					const buyBtn = Array.from(container.getElementsByTagName("button")).find(b => b.textContent.includes("Купить снаряжение"))
					if (buyBtn) {
						clearInterval(interval)
						const reactionDelay = Math.floor(Math.random() * 151) + 100
						setTimeout(() => {
							if (document.body.contains(buyBtn) && isValid()) {
								humanClick(buyBtn)
								showToast(`${weaponName} куплен (${initialDelay}ms (${reactionDelay}ms))`, 3500)
							}
							document.querySelector(".sc-dxroEu.IYosJ")?.click()
						}, reactionDelay)
					}
					if (++findAttempts > 30) clearInterval(interval)
				}, 150)
			}, initialDelay)
		}
	}
	const processCard = (card, canBuy = false) => {
		const infoContainer = card.querySelector(".sc-dbvMr")
		if (!infoContainer) return
		let badgesWrapper = card.querySelector(".fb-badges-container")
		if (!badgesWrapper) {
			badgesWrapper = document.createElement("div")
			badgesWrapper.className = "fb-badges-container"
			card.style.position = "relative"
			card.appendChild(badgesWrapper)
		}
		const spans = infoContainer.getElementsByTagName("span")
		let sidText = ""
		let isStatTrak = false
		let idText = ""
		for (let s of spans) {
			const text = s.textContent.trim()
			if (text.includes("SID:")) sidText = text.replace("SID:", "").trim()
			if (text.includes("StatTrak™") && text.includes("✓")) isStatTrak = true
			if (text.startsWith("ID:")) idText = text.replace("ID:", "").trim()
		}
		let sidBadge = card.querySelector(".fb-sid-badge")
		if (settings.showSid && sidText) {
			if (!sidBadge) {
				sidBadge = document.createElement("div")
				sidBadge.className = "fb-sid-badge"
				badgesWrapper.appendChild(sidBadge)
			}
			const displayValue = `SID: ${sidText}`
			if (sidBadge.textContent !== displayValue) {
				sidBadge.textContent = displayValue
				sidBadge.classList.remove("fb-sid-lucky")
				if (sidText.match(/\.(\d)(\1)(\1)/)) {
					sidBadge.classList.add("fb-sid-lucky")
				}
			}
		} else if (sidBadge) sidBadge.remove()
		let stBadge = card.querySelector(".fb-st-badge")
		if (settings.showStatTrak && isStatTrak) {
			if (!stBadge) {
				stBadge = document.createElement("div")
				stBadge.className = "fb-st-badge"
				stBadge.textContent = "StatTrak™"
				badgesWrapper.appendChild(stBadge)
			}
		} else if (stBadge) stBadge.remove()
		let idBadge = card.querySelector(".fb-id-badge")
		if ((settings.showID || settings.showAllID) && idText) {
			const isBeautiful = id => {
				if (!id) return false
				const n = parseInt(id)
				if (n <= 100000) return true
				if (/^(\d)\1+$/.test(id)) return true
				if (id.slice(-3) === "000") return true
				if (id.length >= 6 && id.slice(0, 3) === id.slice(3, 6)) return true
				if (/(\d)(\d)\1\2\1\2/.test(id)) return true
				return false
			}
			if (settings.showAllID || isBeautiful(idText)) {
				if (!idBadge) {
					idBadge = document.createElement("div")
					idBadge.className = "fb-id-badge"
					badgesWrapper.appendChild(idBadge)
				}
				idBadge.textContent = `ID: ${idText}`
			} else if (idBadge) idBadge.remove()
		} else if (idBadge) idBadge.remove()
		let avgBadge = card.querySelector(".fb-avg-badge")
		if (settings.showAvgPrice && settings.showAvgPrice !== "NONE" && idText) {
			const idObj = window._fbSkinIds ? window._fbSkinIds[idText] : null
			if (idObj) {
				if (!avgBadge) {
					avgBadge = document.createElement("div")
					avgBadge.className = "fb-avg-badge"
					avgBadge.style.order = "99"
					avgBadge.textContent = "Средняя: н/Д"
					badgesWrapper.appendChild(avgBadge)
					getAvgPrice(idObj).then(price => {
						if (price && avgBadge && document.body.contains(avgBadge)) {
							avgBadge.textContent = `Средняя: ${new Intl.NumberFormat("ru-RU").format(price)}`
						} else if (avgBadge && !price) avgBadge.textContent = `Средняя: Н/Д`
					})
				}
			} else if (avgBadge) avgBadge.remove()
		} else if (avgBadge) avgBadge.remove()
		if (!canBuy || !settings.enabled || processedItems.has(card)) return
		const weaponName = card.querySelector(".sc-jbvGK")?.textContent.trim()
		if (weaponName && GLOVE_NAMES.some(name => weaponName.includes(name))) {
			attemptPurchase(card, "gloves", weaponName)
			return
		}
		for (const colorId in settings.filters) {
			if (colorId === "gloves") continue
			if (weaponName && card.classList.contains(colorId)) {
				attemptPurchase(card, colorId, weaponName)
				break
			}
		}
	}
	const setupContainer = (selector, allowPurchase) => {
		const container = document.querySelector(selector)
		if (container && !container.dataset.fbObserved) {
			container.dataset.fbObserved = "true"
			const observer = new MutationObserver(mutations => {
				for (let m of mutations) {
					if (m.type === "childList") {
						m.addedNodes.forEach(n => {
							if (n.nodeType === 1) {
								if (n.matches?.('[class*="sc-jOdwRd"]')) processCard(n, allowPurchase)
								n.querySelectorAll?.('[class*="sc-jOdwRd"]').forEach(c => processCard(c, allowPurchase))
							}
						})
					}
					if (m.type === "characterData") {
						const card = m.target.parentElement?.closest('[class*="sc-jOdwRd"]')
						if (card) processCard(card, allowPurchase)
					}
				}
			})
			observer.observe(container, { childList: true, subtree: true, characterData: true })
			container.querySelectorAll('[class*="sc-jOdwRd"]').forEach(c => processCard(c, allowPurchase))
		}
	}
	const globalObserver = new MutationObserver(() => {
		const topUpBtn = document.querySelector("button.sc-blLsxD.YplaL")
		if (topUpBtn && !topUpBtn.dataset.fbHandled) {
			topUpBtn.dataset.fbHandled = "true"
			topUpBtn.innerHTML = `<svg width="1.6rem" height="1.6rem" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg><span class="sc-hGYSAu jNXFQR">Настройки</span>`
			topUpBtn.onclick = e => {
				e.preventDefault()
				e.stopPropagation()
				openSettings()
			}
		}
		const logo = document.querySelector(".sc-izcLQY.jqEPYj img.sc-dmqHEX.cBZJXK")
		if (logo && !logo.dataset.fbHandled) {
			logo.dataset.fbHandled = "true"
			logo.outerHTML = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="51px" height="56px" viewBox="0 0 51 55" version="1.1"> <path style="fill: var(--fb-accent);" d="M 44.179688 -0.0625 C 44.222656 -0.0625 44.265625 -0.0625 44.304688 -0.0625 C 44.328125 1.828125 44.304688 3.722656 44.242188 5.613281 C 41.078125 8.746094 37.910156 11.878906 34.742188 15.011719 C 27.5625 15.074219 20.378906 15.09375 13.195312 15.074219 C 13.195312 17.597656 13.195312 20.121094 13.195312 22.644531 C 17.785156 22.621094 22.375 22.644531 26.964844 22.707031 C 23.777344 25.859375 20.589844 29.015625 17.402344 32.167969 C 16 32.230469 14.597656 32.25 13.195312 32.230469 C 13.21875 33.617188 13.195312 35.007812 13.132812 36.394531 C 8.75 40.75 4.351562 45.082031 -0.0625 49.386719 C -0.0625 34.753906 -0.0625 20.121094 -0.0625 5.488281 C 12.855469 5.507812 25.777344 5.488281 38.695312 5.425781 C 40.550781 3.613281 42.378906 1.78125 44.179688 -0.0625 Z M 44.179688 -0.0625 "></path> <path style="fill: color-mix(in srgb, var(--fb-accent), transparent 30%);" d="M 50.9375 16.839844 C 50.9375 18.773438 50.9375 20.710938 50.9375 22.644531 C 50.085938 22.644531 49.234375 22.644531 48.386719 22.644531 C 48.386719 25.839844 48.386719 29.035156 48.386719 32.230469 C 49.234375 32.230469 50.085938 32.230469 50.9375 32.230469 C 50.9375 34.164062 50.9375 36.097656 50.9375 38.035156 C 50.015625 43.003906 47.210938 46.515625 42.519531 48.566406 C 41.53125 48.9375 40.511719 49.191406 39.460938 49.324219 C 30.367188 49.367188 21.269531 49.40625 12.175781 49.449219 C 10.324219 51.261719 8.496094 53.089844 6.695312 54.9375 C 6.652344 54.9375 6.609375 54.9375 6.566406 54.9375 C 6.546875 53.042969 6.566406 51.152344 6.628906 49.261719 C 9.796875 46.128906 12.960938 42.996094 16.128906 39.863281 C 23.3125 39.800781 30.492188 39.777344 37.675781 39.800781 C 37.675781 37.277344 37.675781 34.753906 37.675781 32.230469 C 33.085938 32.25 28.496094 32.230469 23.90625 32.167969 C 27.09375 29.015625 30.28125 25.859375 33.46875 22.707031 C 34.871094 22.644531 36.273438 22.621094 37.675781 22.644531 C 37.65625 21.253906 37.675781 19.867188 37.738281 18.480469 C 40.84375 15.410156 43.945312 12.339844 47.046875 9.273438 C 49.191406 11.371094 50.488281 13.894531 50.9375 16.839844 Z M 50.9375 16.839844"></path></svg>`
		}
		if (settings.floatingChat) {
			const chatEl = document.querySelector(".sc-TlkDZ")
			if (chatEl) {
				if (settings.chatPos && settings.chatPos.unit === "px") {
					chatEl.style.transform = "none"
					chatEl.style.margin = "0"
					chatEl.style.left = settings.chatPos.x
					chatEl.style.top = settings.chatPos.y
				}
				const chatForm = chatEl.querySelector("form")
				if (chatForm && !chatForm.classList.contains("none")) {
					if (settings.chatSize && settings.chatSize.width > 0) {
						chatEl.style.width = settings.chatSize.width + "px"
						chatEl.style.height = settings.chatSize.height + "px"
					}
					makeDraggable(chatEl, "chatPos", ".sc-lcZdiQ.hxptMx")
				}
			}
		}
		setupContainer(".sc-QSnow.cRqJDn", true) // Маркет
		setupContainer(".sc-gMYzyK.huPTcR", false) // Инвентари
		setupContainer(".sc-AbJVB.fDspQT", false) // Улучшения
		const pageItem = document.querySelector(".page-item")
		if (pageItem) {
			const pagination = pageItem.parentElement
			if (pagination && !pagination.dataset.fbHandled) {
				pagination.dataset.fbHandled = "true"
				const addExtraButtons = () => {
					if (pagination.querySelector(".fb-page-start")) return
					const firstBtn = document.createElement("li")
					firstBtn.className = "sc-dDGttY iEChOI page-item fb-page-start"
					firstBtn.textContent = "<<"
					firstBtn.onclick = () => fastForward("start")
					const lastBtn = document.createElement("li")
					lastBtn.className = "sc-dDGttY iEChOI page-item fb-page-end"
					lastBtn.textContent = ">>"
					lastBtn.onclick = () => fastForward("end")
					pagination.insertBefore(firstBtn, pagination.firstChild)
					pagination.appendChild(lastBtn)
				}
				addExtraButtons()
				const pagObserver = new MutationObserver(() => {
					addExtraButtons()
				})
				pagObserver.observe(pagination, { childList: true })
			}
		}
	})
	window.addEventListener("load", () => {
		globalObserver.observe(document.body, { childList: true, subtree: true })
		document.body.appendChild(modal)
		applyTheme()
		applyExtraStyles()
		showToast("Скрипт успешно загружен", 1500)
	})
})()
