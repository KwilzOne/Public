// ==UserScript==
// @name         Master Volume Limiter
// @namespace    mvll
// @version      1.0
// @description  Limits the volume of all sounds on all websites
// @author       Kwilz
// @homepageURL  https://github.com/KwilzOne/Public
// @updateURL    https://raw.githubusercontent.com/KwilzOne/Public/refs/heads/whitewolf/tampermonkey/volume.user.js
// @downloadURL  https://raw.githubusercontent.com/KwilzOne/Public/refs/heads/whitewolf/tampermonkey/volume.user.js
// @match        *://*/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=freesound.org
// @run-at       document-start
// @grant        none
// ==/UserScript==

;(function () {
	"use strict"
	const MAX_VOLUME = 0.35 // 35%
	const mediaProto = HTMLMediaElement.prototype
	let volDesc = null
	let curr = mediaProto
	while (curr && !volDesc) {
		volDesc = Object.getOwnPropertyDescriptor(curr, "volume")
		curr = Object.getPrototypeOf(curr)
	}
	if (volDesc && volDesc.set) {
		Object.defineProperty(mediaProto, "volume", {
			get() {
				return volDesc.get.call(this)
			},
			set(v) {
				volDesc.set.call(this, Math.min(Number(v), MAX_VOLUME))
			},
			configurable: true,
			enumerable: true
		})
	}
	const enforceMediaVolume = media => {
		try {
			if (media && media.volume > MAX_VOLUME) {
				media.volume = MAX_VOLUME
			}
		} catch {}
	}
	const origPlay = mediaProto.play
	mediaProto.play = function () {
		enforceMediaVolume(this)
		return origPlay.apply(this, arguments)
	}
	window.addEventListener(
		"play",
		e => {
			if (e.target instanceof HTMLMediaElement) {
				enforceMediaVolume(e.target)
			}
		},
		true
	)
	const patchContextConstructor = ctxName => {
		const OrigContext = window[ctxName]
		if (typeof OrigContext !== "function") return
		class PatchedContext {
			constructor(...args) {
				const ctx = new OrigContext(...args)
				try {
					const masterGain = ctx.createGain()
					masterGain.gain.value = MAX_VOLUME
					const realDestination = ctx.destination
					AudioNode.prototype.connect.call(masterGain, realDestination)
					Object.defineProperty(ctx, "destination", {
						get() {
							return masterGain
						},
						configurable: true,
						enumerable: true
					})
				} catch {}
				return ctx
			}
		}
		PatchedContext.prototype = OrigContext.prototype
		window[ctxName] = PatchedContext
	}
	patchContextConstructor("AudioContext")
	patchContextConstructor("webkitAudioContext")
})()
