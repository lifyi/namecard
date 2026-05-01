import { useState, useRef, useCallback } from 'react'

export default function useSpeech(onTranscript) {
  const [listening, setListening] = useState(false)
  const [supported] = useState(() => 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window)
  const recognitionRef = useRef(null)

  const start = useCallback(() => {
    if (!supported) return

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    const recognition = new SR()
    recognition.continuous = true
    recognition.interimResults = false
    recognition.lang = 'en-US'

    recognition.onresult = (e) => {
      const transcript = Array.from(e.results)
        .map((r) => r[0].transcript)
        .join(' ')
        .trim()
      if (transcript) onTranscript(transcript)
    }

    recognition.onerror = () => setListening(false)
    recognition.onend = () => setListening(false)

    recognitionRef.current = recognition
    recognition.start()
    setListening(true)
  }, [supported, onTranscript])

  const stop = useCallback(() => {
    recognitionRef.current?.stop()
    setListening(false)
  }, [])

  const toggle = useCallback(() => {
    if (listening) stop()
    else start()
  }, [listening, start, stop])

  return { listening, supported, toggle, start, stop }
}
