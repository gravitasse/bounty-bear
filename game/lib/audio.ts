let audioCtx: AudioContext | null = null
let bearVoice: SpeechSynthesisVoice | null = null
let voicesLoaded = false
let voiceMuted = false

export function setVoiceMuted(muted: boolean) {
  voiceMuted = muted
  if (muted && typeof window !== 'undefined') window.speechSynthesis.cancel()
}

export function getVoiceMuted() { return voiceMuted }

// Pre-load voices as soon as possible (async in most browsers)
if (typeof window !== 'undefined') {
  const loadVoices = () => {
    const voices = window.speechSynthesis.getVoices()
    if (voices.length === 0) return
    bearVoice =
      voices.find(v => v.name.includes('Daniel')) ||
      voices.find(v => v.name.includes('Alex')) ||
      voices.find(v => v.name.includes('Fred')) ||
      voices.find(v => v.name.includes('David')) ||
      voices.find(v => v.name.includes('Mark')) ||
      voices.find(v => v.lang === 'en-US') ||
      voices[0]
    voicesLoaded = true
  }
  loadVoices()
  if (window.speechSynthesis.onvoiceschanged !== undefined) {
    window.speechSynthesis.onvoiceschanged = loadVoices
  }
}

export function initAudio() {
  if (audioCtx) return
  audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
  // Also try loading voices on first user interaction
  if (!voicesLoaded) {
    const voices = window.speechSynthesis.getVoices()
    if (voices.length > 0) {
      bearVoice =
        voices.find(v => v.name.includes('Daniel')) ||
        voices.find(v => v.name.includes('Alex')) ||
        voices.find(v => v.name.includes('Fred')) ||
        voices.find(v => v.name.includes('David')) ||
        voices.find(v => v.lang === 'en-US') ||
        voices[0]
      voicesLoaded = true
    }
  }
}

export function playChaChing() {
  if (!audioCtx) return
  const osc1 = audioCtx.createOscillator()
  const osc2 = audioCtx.createOscillator()
  const gain = audioCtx.createGain()

  osc1.frequency.setValueAtTime(880, audioCtx.currentTime)
  osc1.frequency.exponentialRampToValueAtTime(1760, audioCtx.currentTime + 0.1)
  osc2.frequency.setValueAtTime(1320, audioCtx.currentTime)

  gain.gain.setValueAtTime(0.1, audioCtx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5)

  osc1.connect(gain)
  osc2.connect(gain)
  gain.connect(audioCtx.destination)

  osc1.start()
  osc2.start()
  osc1.stop(audioCtx.currentTime + 0.5)
  osc2.stop(audioCtx.currentTime + 0.5)
}

// Queued speech — does NOT cancel previous lines, lets them play in sequence
export function speakQueued(text: string) {
  if (typeof window === 'undefined') return
  const synth = window.speechSynthesis
  if (!synth) return

  if (voiceMuted) return

  const utt = new SpeechSynthesisUtterance(text)
  utt.rate = 1.0
  utt.pitch = 0.8
  utt.volume = 1.0
  if (bearVoice) utt.voice = bearVoice

  synth.speak(utt)
}

export function playBlip() {
  if (!audioCtx) return
  const osc = audioCtx.createOscillator()
  const gain = audioCtx.createGain()
  osc.frequency.setValueAtTime(660, audioCtx.currentTime)
  gain.gain.setValueAtTime(0.05, audioCtx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.08)
  osc.connect(gain)
  gain.connect(audioCtx.destination)
  osc.start()
  osc.stop(audioCtx.currentTime + 0.08)
}

export function playImSearchingMp3() {
  if (typeof window === 'undefined') return
  const audio = new Audio('/demo/audio/im-searching.mp3')
  audio.volume = 0.8
  audio.play().catch(() => {})
}
