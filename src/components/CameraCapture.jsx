import { useRef, useEffect, useState, useCallback } from 'react'
import Button from './Button.jsx'

export default function CameraCapture({ onCapture, onCancel, title }) {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)
  const [ready, setReady] = useState(false)
  const [flash, setFlash] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    startCamera()
    return () => stopCamera()
  }, [])

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play()
          setReady(true)
        }
      }
    } catch (err) {
      setError('Camera access denied. Please allow camera access and try again.')
    }
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach((t) => t.stop())
  }

  function capture() {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    ctx.drawImage(video, 0, 0)

    setFlash(true)
    setTimeout(() => setFlash(false), 400)

    canvas.toBlob(
      (blob) => {
        const file = new File([blob], `card-${Date.now()}.jpg`, { type: 'image/jpeg' })
        const preview = canvas.toDataURL('image/jpeg', 0.85)
        stopCamera()
        onCapture(file, preview)
      },
      'image/jpeg',
      0.85,
    )
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-[#0a0a0a] z-50 flex flex-col items-center justify-center p-6 gap-4">
        <div className="text-[#e05c5c] text-center text-[14px]">{error}</div>
        <Button variant="secondary" onClick={onCancel}>Cancel</Button>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Flash overlay */}
      {flash && (
        <div className="absolute inset-0 bg-white z-10 pointer-events-none shutter-flash" />
      )}

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between px-4 pt-safe pt-4 pb-3">
        <button
          onClick={() => { stopCamera(); onCancel() }}
          className="text-white/70 text-[14px] hover:text-white transition-colors"
        >
          Cancel
        </button>
        <span className="text-white/80 text-[14px] font-medium">{title}</span>
        <div className="w-16" />
      </div>

      {/* Viewfinder */}
      <div className="flex-1 relative overflow-hidden">
        <video
          ref={videoRef}
          playsInline
          muted
          autoPlay
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Card frame guide */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="border-2 border-white/30 rounded-[12px]"
            style={{ width: '85vw', height: '52vw', maxWidth: 480, maxHeight: 295 }}
          >
            <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-white rounded-tl-[10px]" />
            <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-white rounded-tr-[10px]" />
            <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-white rounded-bl-[10px]" />
            <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-white rounded-br-[10px]" />
          </div>
        </div>

        {!ready && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-white/50 text-[14px]">Starting camera…</div>
          </div>
        )}
      </div>

      {/* Shutter */}
      <div className="pb-safe pb-8 pt-6 flex items-center justify-center">
        <button
          onClick={capture}
          disabled={!ready}
          className="w-18 h-18 rounded-full border-4 border-white/30 flex items-center justify-center
            active:scale-90 transition-all disabled:opacity-30"
          style={{ width: 72, height: 72 }}
        >
          <div className="w-14 h-14 rounded-full bg-white" style={{ width: 56, height: 56 }} />
        </button>
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  )
}
