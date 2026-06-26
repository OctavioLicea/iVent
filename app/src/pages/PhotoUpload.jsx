// Página: PhotoUpload — app/src/pages/PhotoUpload.jsx
// Razón: Capa 4 — adoptar estilo oscuro DARK_CANVAS para coherencia visual con LiveBoard
// 2026-06-25 19:45

import { useEffect, useState, useRef } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { supabase } from "../lib/supabase"
import { useEventTheme } from '../hooks/useEventTheme'
import { resolveTypography } from "../lib/eventHelpers"
import { DARK_CANVAS as DC } from "../lib/constants"
import LoadingScreen from "../components/LoadingScreen"
import ErrorScreen from "../components/ErrorScreen"

const MAX_VIDEO_MB = 30
const MAX_FILES    = 10
const BUCKET       = "event-assets"

function CameraIcon({ color, size = 32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/>
      <circle cx="12" cy="13" r="3"/>
    </svg>
  )
}

export default function PhotoUpload() {
  const { eventId } = useParams()
  const navigate    = useNavigate()

  const { event, config, loading, error } = useEventTheme(eventId)

  const [guestName, setGuestName] = useState("")
  const [files,     setFiles]     = useState([])
  const [uploading, setUploading] = useState(false)
  const [progress,  setProgress]  = useState({ current: 0, total: 0, label: "" })
  const [toast,     setToast]     = useState(null)
  const [dragOver,  setDragOver]  = useState(false)

  const fileInputRef   = useRef(null)
  const cameraInputRef = useRef(null)

  useEffect(() => {
    return () => files.forEach(f => URL.revokeObjectURL(f.previewUrl))
  }, [])

  // ── Tokens tipográficos del evento ────────────────────────────────────
  // Colores y fondo vienen de DARK_CANVAS — fuentes y tipografía del evento
  const typo       = config ? resolveTypography(config) : null
  const titleFont  = typo?.title?.font || 'Cormorant Garamond'
  const eventTitle = event?.title || event?.name || ""

  // ── Compresión ────────────────────────────────────────────────────────
  function compressImage(file, maxPx = 1920, quality = 0.82) {
    return new Promise(resolve => {
      if (!file.type.startsWith("image/")) { resolve(file); return }
      const img = new Image()
      const url = URL.createObjectURL(file)
      img.onload = () => {
        URL.revokeObjectURL(url)
        let { width, height } = img
        if (width > maxPx || height > maxPx) {
          if (width > height) { height = Math.round(height * maxPx / width); width = maxPx }
          else { width = Math.round(width * maxPx / height); height = maxPx }
        }
        const canvas = document.createElement("canvas")
        canvas.width = width; canvas.height = height
        canvas.getContext("2d").drawImage(img, 0, 0, width, height)
        canvas.toBlob(blob => {
          if (!blob || blob.size >= file.size) { resolve(file); return }
          resolve(new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), { type: "image/jpeg" }))
        }, "image/jpeg", quality)
      }
      img.onerror = () => { URL.revokeObjectURL(url); resolve(file) }
      img.src = url
    })
  }

  function addFiles(newFiles) {
    const rejected = []
    const valid = newFiles.filter(f => {
      if (f.type.startsWith("video/") && f.size > MAX_VIDEO_MB * 1024 * 1024) {
        rejected.push(f.name); return false
      }
      return f.type.startsWith("image/") || f.type.startsWith("video/")
    })
    if (rejected.length) showToast(`Video muy pesado (máx ${MAX_VIDEO_MB} MB)`, "err")
    const combined = [...files, ...valid.map(f => ({
      file: f,
      previewUrl: URL.createObjectURL(f),
      type: f.type.startsWith("video/") ? "video" : "image",
    }))].slice(0, MAX_FILES)
    setFiles(combined)
  }

  function removeFile(i) {
    URL.revokeObjectURL(files[i].previewUrl)
    setFiles(files.filter((_, idx) => idx !== i))
  }

  async function handleUpload() {
    if (files.length === 0 || uploading) return
    setUploading(true)
    let ok = 0

    for (let i = 0; i < files.length; i++) {
      const { file, type } = files[i]
      setProgress({ current: i + 1, total: files.length, label: `Preparando ${i + 1} de ${files.length}…` })

      const processed   = type === "image" ? await compressImage(file) : file
      const ext         = processed.type === "image/jpeg" ? "jpg" : file.name.split(".").pop()
      const filename    = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}.${ext}`
      const storagePath = `${eventId}/fotos/${filename}`

      setProgress(p => ({ ...p, label: `Subiendo ${i + 1} de ${files.length}…` }))

      const { error: storageErr } = await supabase.storage
        .from(BUCKET).upload(storagePath, processed, { upsert: true })
      if (storageErr) { console.error("Storage error:", storageErr); continue }

      const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(storagePath)
      const { error: dbErr }  = await supabase.from("photos").insert({
        event_id: eventId, path: storagePath,
        url: urlData.publicUrl,
        name: guestName.trim() || "Invitado",
        type, hidden: false,
      })
      if (!dbErr) ok++
    }

    setUploading(false)
    setFiles([])
    setProgress({ current: 0, total: 0, label: "" })

    if (ok > 0) {
      showToast(`✓ ${ok} foto${ok > 1 ? "s" : ""} compartida${ok > 1 ? "s" : ""}`, "ok")
      setTimeout(() => navigate(`/e/${eventId}/liveboard`), 1500)
    } else {
      showToast("Error al subir. Intenta de nuevo.", "err")
    }
  }

  function showToast(msg, type = "ok") {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const progressPct = progress.total > 0 ? (progress.current / progress.total) * 100 : 0

  if (loading) return <LoadingScreen msg="Cargando…" />
  if (error || !event) return <ErrorScreen msg="Evento no encontrado." onRetry={() => window.location.reload()} />

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      fontFamily: "DM Sans, sans-serif",
      background: DC.bg,
      color: DC.text,
    }}>

      {/* ── Topbar ── */}
      <div style={{
        background: DC.overlayDeep,
        borderBottom: DC.border,
        padding: "0 16px",
        height: 54,
        display: "flex", alignItems: "center", gap: 12, flexShrink: 0,
      }}>
        <button onClick={() => navigate(`/e/${eventId}`)} style={{
          background: DC.surface,
          color: DC.text,
          border: DC.border,
          borderRadius: 20,
          padding: "5px 14px",
          fontFamily: "DM Sans, sans-serif",
          fontSize: 12, cursor: "pointer", flexShrink: 0,
        }}>← Invitación</button>

        <div style={{ flex: 1, textAlign: "center" }}>
          <div style={{
            fontFamily: `'${titleFont}', serif`,
            fontSize: 18, fontWeight: 600,
            color: DC.text,
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
          }}>{eventTitle}</div>
        </div>

        <div style={{ width: 86, flexShrink: 0 }} />
      </div>

      {/* ── Contenido ── */}
      <div style={{
        flex: 1, display: "flex", flexDirection: "column", gap: 14,
        padding: "24px 16px 48px", maxWidth: 480, width: "100%", margin: "0 auto",
      }}>

        {/* Nombre */}
        <input
          type="text"
          placeholder="Tu nombre (opcional)"
          value={guestName}
          onChange={e => setGuestName(e.target.value)}
          style={{
            width: "100%", padding: "13px 16px", borderRadius: 12,
            border: DC.border,
            background: DC.surface,
            fontSize: 14, fontFamily: "DM Sans, sans-serif",
            color: DC.text, outline: "none",
            boxSizing: "border-box",
          }}
        />

        {/* ── Drop zone ── */}
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => { e.preventDefault(); setDragOver(false); addFiles([...e.dataTransfer.files]) }}
          style={{
            borderRadius: 20,
            padding: "44px 24px",
            display: "flex", flexDirection: "column",
            alignItems: "center", gap: 16,
            cursor: "pointer",
            background: dragOver ? DC.surfaceHover : DC.surface,
            border: dragOver ? `1.5px solid ${DC.accent}` : DC.border,
            transition: "background 0.2s, border 0.2s",
          }}
        >
          <div style={{
            width: 72, height: 72, borderRadius: "50%",
            background: `rgba(201,168,76,0.12)`,
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: `0 4px 20px rgba(201,168,76,0.15)`,
          }}>
            <CameraIcon color={DC.accent} size={34} />
          </div>

          <div style={{ textAlign: "center" }}>
            <p style={{
              fontFamily: `'${titleFont}', serif`,
              fontSize: 20, fontWeight: 600,
              color: DC.text, margin: 0, lineHeight: 1.2,
            }}>
              Toca para subir fotos
            </p>
            <p style={{ fontSize: 12, color: DC.textMute, margin: "6px 0 0", lineHeight: 1.5 }}>
              Fotos y videos · máx {MAX_FILES} archivos
            </p>
          </div>
        </div>

        <input ref={fileInputRef} type="file" accept="image/*,video/*" multiple
          style={{ display: "none" }} onChange={e => addFiles([...e.target.files])} />
        <input ref={cameraInputRef} type="file" accept="image/*" capture="environment"
          style={{ display: "none" }} onChange={e => addFiles([...e.target.files])} />

        {/* Botón cámara */}
        <button onClick={() => cameraInputRef.current?.click()} style={{
          width: "100%", padding: "14px",
          borderRadius: 12,
          border: DC.border,
          background: DC.surface,
          fontSize: 15, fontFamily: `'${titleFont}', serif`,
          fontWeight: 600, cursor: "pointer", color: DC.text,
          display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
        }}>
          <CameraIcon color={DC.text} size={18} />
          Tomar foto
        </button>

        {/* Preview grid */}
        {files.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
            {files.map((f, i) => (
              <div key={i} style={{
                position: "relative", aspectRatio: "1", borderRadius: 12,
                overflow: "hidden", background: DC.surface, border: DC.border,
              }}>
                {f.type === "video"
                  ? <video src={f.previewUrl} style={{ width: "100%", height: "100%", objectFit: "cover" }} muted playsInline />
                  : <img src={f.previewUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                }
                <button onClick={() => removeFile(i)} style={{
                  position: "absolute", top: 5, right: 5,
                  background: DC.overlay, color: DC.text,
                  border: "none", borderRadius: "50%", width: 22, height: 22,
                  fontSize: 11, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>✕</button>
              </div>
            ))}
          </div>
        )}

        {/* Progress */}
        {uploading && (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ height: 4, background: `rgba(201,168,76,0.20)`, borderRadius: 2, overflow: "hidden" }}>
              <div style={{
                height: "100%", background: DC.accent,
                borderRadius: 2, width: `${progressPct}%`,
                transition: "width 0.3s ease",
              }} />
            </div>
            <p style={{ fontSize: 12, color: DC.textMute, textAlign: "center" }}>{progress.label}</p>
          </div>
        )}

        {/* Botón compartir */}
        <button
          onClick={handleUpload}
          disabled={files.length === 0 || uploading}
          style={{
            width: "100%", padding: "17px",
            borderRadius: 14, border: "none",
            background: files.length === 0 || uploading
              ? `rgba(201,168,76,0.20)`
              : `linear-gradient(135deg, #A8832A 0%, ${DC.accent} 100%)`,
            color: files.length === 0 || uploading ? DC.textMute : '#0a0a0f',
            fontSize: 16,
            fontFamily: `'${titleFont}', serif`, fontWeight: 600,
            letterSpacing: "0.04em",
            cursor: files.length === 0 || uploading ? "default" : "pointer",
            boxShadow: files.length > 0 && !uploading
              ? `0 6px 24px rgba(201,168,76,0.30)`
              : "none",
            transition: "box-shadow 0.2s, background 0.2s",
          }}
        >
          {uploading ? "Subiendo…" : files.length > 0 ? `Compartir (${files.length})` : "Compartir"}
        </button>

      </div>

      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)",
          color: toast.type === "ok" ? '#0a0a0f' : "#fff",
          background: toast.type === "ok"
            ? `linear-gradient(135deg, #A8832A, ${DC.accent})`
            : "#C0392B",
          padding: "11px 26px", borderRadius: 24, fontSize: 13,
          fontFamily: "DM Sans, sans-serif", whiteSpace: "nowrap", zIndex: 100,
          boxShadow: "0 4px 20px rgba(0,0,0,0.40)",
        }}>{toast.msg}</div>
      )}
    </div>
  )
}
