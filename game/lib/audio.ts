let audioCtx: AudioContext | null = null

export function initAudio() {
  if (audioCtx) return
  audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
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

// Queued speech — does NOT cancel previous lines, lets them play in sequence like the demo
export function speakQueued(text: string) {
  if (typeof window === 'undefined') return
  const synth = window.speechSynthesis
  if (!synth) return

  const utt = new SpeechSynthesisUtterance(text)
  utt.rate = 1.0
  utt.pitch = 0.8
  utt.volume = 1.0

  const voices = synth.getVoices()
  const voice =
    voices.find(v => v.name.includes('Daniel')) ||
    voices.find(v => v.name.includes('Alex')) ||
    voices.find(v => v.name.includes('Fred')) ||
    voices.find(v => v.name.includes('David')) ||
    voices.find(v => v.name.includes('Mark')) ||
    voices.find(v => v.lang === 'en-US') ||
    voices[0]
  if (voice) utt.voice = voice

  synth.speak(utt) // queues automatically — no cancel = no cutoff
}

// Play the im-searching MP3 in the background (same as demo)
export function playImSearchingMp3() {
  if (typeof window === 'undefined') return
  const audio = new Audio('/demo/audio/im-searching.mp3')
  audio.volume = 0.8
  audio.play().catch(() => {}) // silently ignore autoplay blocks
}
