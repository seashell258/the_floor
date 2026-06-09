import { ref } from 'vue'

export const isMuted = ref(false)

let ctx: AudioContext | null = null
let masterGain: GainNode | null = null

function getCtx(): AudioContext {
  if (!ctx) {
    ctx = new AudioContext()
    masterGain = ctx.createGain()
    masterGain.gain.value = 1
    masterGain.connect(ctx.destination)
  }
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}

function master(): GainNode {
  getCtx()
  return masterGain!
}

export function toggleMute() {
  isMuted.value = !isMuted.value
  if (masterGain) {
    masterGain.gain.setTargetAtTime(isMuted.value ? 0 : 1, getCtx().currentTime, 0.05)
  }
}

// ─── BGM ──────────────────────────────────────────────────

let bgmActive = false
let bgmOscillators: OscillatorNode[] = []
let beatTimer: number | null = null
let nextBeat = 0
const BPM = 140

export function startBattleMusic() {
  if (bgmActive) return
  bgmActive = true
  const ac = getCtx()

  // Bass drone – square wave A2 + lowpass + LFO pulse
  const bassOut = ac.createGain()
  bassOut.gain.value = 0.13
  bassOut.connect(master())

  const bass = ac.createOscillator()
  bass.type = 'square'
  bass.frequency.value = 110

  const bassFilter = ac.createBiquadFilter()
  bassFilter.type = 'lowpass'
  bassFilter.frequency.value = 280

  const bassLFO = ac.createOscillator()
  const bassLFOGain = ac.createGain()
  bassLFO.frequency.value = BPM / 60
  bassLFOGain.gain.value = 0.07
  bassLFO.connect(bassLFOGain)
  bassLFOGain.connect(bassOut.gain)

  bass.connect(bassFilter)
  bassFilter.connect(bassOut)
  bass.start()
  bassLFO.start()

  // Tension pad – detuned sawtooth pair with slow filter sweep
  const padOut = ac.createGain()
  padOut.gain.value = 0.055
  padOut.connect(master())

  const pad1 = ac.createOscillator()
  pad1.type = 'sawtooth'
  pad1.frequency.value = 220

  const pad2 = ac.createOscillator()
  pad2.type = 'sawtooth'
  pad2.frequency.value = 220 * 1.006

  const padFilter = ac.createBiquadFilter()
  padFilter.type = 'bandpass'
  padFilter.frequency.value = 650
  padFilter.Q.value = 2.5

  const sweepLFO = ac.createOscillator()
  const sweepGain = ac.createGain()
  sweepLFO.frequency.value = 0.07
  sweepGain.gain.value = 320
  sweepLFO.connect(sweepGain)
  sweepGain.connect(padFilter.frequency)

  pad1.connect(padFilter)
  pad2.connect(padFilter)
  padFilter.connect(padOut)
  pad1.start()
  pad2.start()
  sweepLFO.start()

  bgmOscillators = [bass, bassLFO, pad1, pad2, sweepLFO]

  nextBeat = ac.currentTime + 0.05
  scheduleBeat()
}

function scheduleBeat() {
  if (!bgmActive) return
  const ac = getCtx()
  const beatDur = 60 / BPM

  while (nextBeat < ac.currentTime + 0.18) {
    kick(ac, nextBeat)
    hihat(ac, nextBeat + beatDur * 0.5)
    nextBeat += beatDur
  }
  beatTimer = window.setTimeout(scheduleBeat, 30)
}

function kick(ac: AudioContext, t: number) {
  const osc = ac.createOscillator()
  const gain = ac.createGain()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(180, t)
  osc.frequency.exponentialRampToValueAtTime(38, t + 0.09)
  gain.gain.setValueAtTime(0.32, t)
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.11)
  osc.connect(gain)
  gain.connect(master())
  osc.start(t)
  osc.stop(t + 0.12)
}

function hihat(ac: AudioContext, t: number) {
  const bufSize = Math.ceil(ac.sampleRate * 0.035)
  const buf = ac.createBuffer(1, bufSize, ac.sampleRate)
  const d = buf.getChannelData(0)
  for (let i = 0; i < bufSize; i++) d[i] = Math.random() * 2 - 1

  const src = ac.createBufferSource()
  src.buffer = buf
  const f = ac.createBiquadFilter()
  f.type = 'highpass'
  f.frequency.value = 9500
  const gain = ac.createGain()
  gain.gain.setValueAtTime(0.07, t)
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.035)
  src.connect(f)
  f.connect(gain)
  gain.connect(master())
  src.start(t)
}

export function stopBattleMusic() {
  if (!bgmActive) return
  bgmActive = false

  if (beatTimer !== null) {
    clearTimeout(beatTimer)
    beatTimer = null
  }

  const ac = getCtx()
  const fadeEnd = ac.currentTime + 0.4
  bgmOscillators.forEach(osc => {
    try { osc.stop(fadeEnd) } catch {}
  })
  bgmOscillators = []
}

// ─── SFX ──────────────────────────────────────────────────

export function playNextSFX() {
  const ac = getCtx();
  [[523, 0], [784, 0.075]].forEach(([freq, delay]) => {
    const osc = ac.createOscillator()
    const gain = ac.createGain()
    const t = ac.currentTime + delay
    osc.type = 'sine'
    osc.frequency.value = freq
    gain.gain.setValueAtTime(0, t)
    gain.gain.linearRampToValueAtTime(0.22, t + 0.012)
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14)
    osc.connect(gain)
    gain.connect(master())
    osc.start(t)
    osc.stop(t + 0.15)
  })
}

export function playSkipSFX() {
  const ac = getCtx()
  const osc = ac.createOscillator()
  const dist = ac.createWaveShaper()
  const gain = ac.createGain()

  const curve = new Float32Array(128)
  for (let i = 0; i < 128; i++) {
    const x = (i * 2) / 128 - 1
    curve[i] = (Math.PI + 100) * x / (Math.PI + 100 * Math.abs(x))
  }
  dist.curve = curve

  osc.type = 'sawtooth'
  osc.frequency.setValueAtTime(380, ac.currentTime)
  osc.frequency.exponentialRampToValueAtTime(55, ac.currentTime + 0.2)
  gain.gain.setValueAtTime(0.12, ac.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.24)

  osc.connect(dist)
  dist.connect(gain)
  gain.connect(master())
  osc.start()
  osc.stop(ac.currentTime + 0.25)
}

function createReverb(ac: AudioContext, duration: number, decay: number): ConvolverNode {
  const len = Math.ceil(ac.sampleRate * duration)
  const buf = ac.createBuffer(2, len, ac.sampleRate)
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch)
    for (let i = 0; i < len; i++) {
      d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay)
    }
  }
  const convolver = ac.createConvolver()
  convolver.buffer = buf
  return convolver
}

export function playWinnerSFX() {
  const ac = getCtx()
  const now = ac.currentTime

  const reverb = createReverb(ac, 6.0, 1.5)
  const reverbGain = ac.createGain()
  reverbGain.gain.value = 0.85
  reverb.connect(reverbGain)
  reverbGain.connect(master())

  // Bell partials: fundamental C3 + inharmonic overtones
  const partials = [
    { freq: 65.4,          peak: 0.62, decay: 7.5 },  // C2 fundamental
    { freq: 130.8,         peak: 0.28, decay: 5.0 },  // C3 octave — carries the body
    { freq: 65.4 * 2.756,  peak: 0.14, decay: 2.8 },  // inharmonic
    { freq: 65.4 * 5.404,  peak: 0.05, decay: 1.2 },  // inharmonic high
  ]

  partials.forEach(({ freq, peak, decay }) => {
    const osc = ac.createOscillator()
    const gain = ac.createGain()
    osc.type = 'sine'
    osc.frequency.value = freq
    gain.gain.setValueAtTime(0, now)
    gain.gain.linearRampToValueAtTime(peak, now + 0.004)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + decay)
    osc.connect(gain)
    gain.connect(master())
    gain.connect(reverb)
    osc.start(now)
    osc.stop(now + decay + 0.5)
  })

}
