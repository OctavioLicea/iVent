// Página: PhotoUpload — app/src/pages/PhotoUpload.jsx
// Cambio: agregar botón "← Inicio" para volver a /e/:eventId
// 2026-06-12 17:20

import { useEffect, useState, useRef } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { supabase } from "../lib/supabase"
import { useEventTheme } from '../hooks/useEventTheme'

const MAX_VIDEO_MB = 30
const MAX_FILES = 10
const BUCKET = "event-assets"

export default function PhotoUpload() {
  const { eventId } = useParams()
  const navigate = useNavigate()
  const { event: themeEvent } = useEventTheme(eventId)

  const [event, setEvent] = useState(null)
  const [guestName, setGuestName] = useState("")
  const [files, setFiles] = useState([])
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState({ current: 0, total: 0, label: "" })
  const [toast, setToast] = useState(null)
  const [loading, setLoading] = useState(true)

  const fileInputRef = useRef(null)
  const cameraInputRef = useRef(null)

  useEffect(() => {
    loadEvent()
    return () => files.forEach((f) => URL.revokeObjectURL(f.previewUrl))
  }, [eventId])

  async function loadEvent() {
    const { data } = await supabase
      .from("events")
      .select("id, title, subtitle, config")
      .eq("id", eventId)
      .single()
    setEvent(data)
    setLoading(false)
  }

  function compressImage(file, maxPx = 1920, quality = 0.82) {
    return new Promise((resolve) => {
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
        canvas.toBlob((blob) => {
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
    const valid = newFiles.filter((f) => {
      if (f.type.startsWith("video/") && f.size > MAX_VIDEO_MB * 1024 * 1024) {
        rejected.push(f.name); return false
      }
      return f.type.startsWith("image/") || f.type.startsWith("video/")
    })
    if (rejected.length) showToast(`Video muy pesado (máx ${MAX_VIDEO_MB} MB)`, "err")
    const combined = [...files, ...valid.map((f) => ({
      file: f,
      previewUrl: URL.createObjectURL(f),
      type: f.type.startsWith("video/") ? "video" : "image",
    }))].slice(0, MAX_FILES)
    setFiles(combined)
  }

  function removeFile(index) {
    URL.revokeObjectURL(files[index].previewUrl)
    setFiles(files.filter((_, i) => i !== index))
  }

  async function handleUpload() {
    if (files.length === 0 || uploading) return
    setUploading(true)
    let ok = 0

    for (let i = 0; i < files.length; i++) {
      const { file, type } = files[i]
      setProgress({ current: i + 1, total: files.length, label: `Preparando ${i + 1} de ${files.length}…` })

      const processed = type === "image" ? await compressImage(file) : file
      const ext = processed.type === "image/jpeg" ? "jpg" : file.name.split(".").pop()
      const filename = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}.${ext}`
      const storagePath = `${eventId}/fotos/${filename}`

      setProgress((p) => ({ ...p, label: `Subiendo ${i + 1} de ${files.length}…` }))

      const { error: storageErr } = await supabase.storage
        .from(BUCKET)
        .upload(storagePath, processed, { upsert: true })

      if (storageErr) { console.error("Storage error:", storageErr); continue }

      const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(storagePath)

      const { error: dbErr } = await supabase.from("photos").insert({
        event_id: eventId,
        path: storagePath,
        url: urlData.publicUrl,
        name: guestName || "Invitado",
        type,
        hidden: false,
      })

      if (!dbErr) ok++
    }

    setUploading(false)
    setFiles([])
    setProgress({ current: 0, total: 0, label: "" })

    if (ok > 0) showToast(`✓ ${ok} foto${ok > 1 ? "s" : ""} subida${ok > 1 ? "s" : ""} con éxito`, "ok")
    else showToast("Error al subir. Intenta de nuevo.", "err")
  }

  function showToast(msg, type = "ok") {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  function onDragOver(e) { e.preventDefault() }
  function onDrop(e) {
    e.preventDefault()
    addFiles([...e.dataTransfer.files])
  }

  if (loading) {
    return <div style={styles.centered}><p style={styles.muted}>Cargando…</p></div>
  }

  const progressPct = progress.total > 0 ? (progress.current / progress.total) * 100 : 0

  return (
    <div style={{
      ...styles.page,
      background: themeEvent?.bg_url
        ? `url("${themeEvent.bg_url}") center/cover no-repeat fixed`
        : 'var(--color-surface, #FAF7F2)',
    }}>
      {/* Topbar */}
      <div style={styles.topbar}>
        <button onClick={() => navigate(`/e/${eventId}`)} style={styles.backBtn}>← Inicio</button>
        <span style={styles.topbarTitle}>{event?.title || "Sube tus fotos"}</span>
      </div>

      <div style={styles.content}>
        <input
          type="text"
          placeholder="Tu nombre (opcional)"
          value={guestName}
          onChange={(e) => setGuestName(e.target.value)}
          style={styles.nameInput}
        />

        <div
          style={styles.dropZone}
          onDragOver={onDragOver}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <span style={styles.dropIcon}>📷</span>
          <p style={styles.dropText}>Toca para seleccionar fotos</p>
          <p style={styles.dropSub}>o arrastra aquí · máx {MAX_FILES} archivos</p>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          multiple
          style={{ display: "none" }}
          onChange={(e) => addFiles([...e.target.files])}
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          style={{ display: "none" }}
          onChange={(e) => addFiles([...e.target.files])}
        />

        <button
          style={styles.cameraBtn}
          onClick={() => cameraInputRef.current?.click()}
        >
          📷 Tomar foto
        </button>

        {files.length > 0 && (
          <div style={styles.previewGrid}>
            {files.map((f, i) => (
              <div key={i} style={styles.previewItem}>
                {f.type === "video"
                  ? <video src={f.previewUrl} style={styles.previewMedia} muted playsInline />
                  : <img src={f.previewUrl} alt="" style={styles.previewMedia} />
                }
                <button style={styles.removeBtn} onClick={() => removeFile(i)}>✕</button>
              </div>
            ))}
          </div>
        )}

        {uploading && (
          <div style={styles.progressWrap}>
            <div style={styles.progressBar}>
              <div style={{ ...styles.progressFill, width: `${progressPct}%` }} />
            </div>
            <p style={styles.progressLabel}>{progress.label}</p>
          </div>
        )}

        <button
          style={{
            ...styles.uploadBtn,
            opacity: files.length === 0 || uploading ? 0.5 : 1,
          }}
          disabled={files.length === 0 || uploading}
          onClick={handleUpload}
        >
          {uploading ? "Subiendo…" : `Compartir ${files.length > 0 ? `(${files.length})` : ""}`}
        </button>
      </div>

      {toast && (
        <div style={{
          ...styles.toast,
          background: toast.type === "ok" ? "#1A1714" : "#7D2935",
        }}>
          {toast.msg}
        </div>
      )}
    </div>
  )
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    fontFamily: "DM Sans, sans-serif",
    color: "#2A1F1A",
  },
  centered: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  muted: { color: "#9C8878", fontSize: 14 },
  topbar: {
    background: "#1A1714",
    color: "#EDE0CB",
    padding: "14px 20px",
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  backBtn: {
    background: "rgba(237,224,203,.08)",
    color: "#EDE0CB",
    border: "0.5px solid rgba(237,224,203,.2)",
    borderRadius: 20,
    padding: "5px 12px",
    fontFamily: "DM Sans, sans-serif",
    fontSize: 12,
    cursor: "pointer",
    flexShrink: 0,
  },
  topbarTitle: {
    fontFamily: "Cormorant Garamond, serif",
    fontSize: 18,
    fontWeight: 600,
  },
  content: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: 14,
    padding: "20px 16px 40px",
    maxWidth: 480,
    width: "100%",
    margin: "0 auto",
  },
  nameInput: {
    width: "100%",
    padding: "12px 14px",
    borderRadius: 10,
    border: "0.5px solid rgba(90,50,30,0.22)",
    background: "#fff",
    fontSize: 14,
    fontFamily: "DM Sans, sans-serif",
    color: "#2A1F1A",
    outline: "none",
  },
  dropZone: {
    border: "1.5px dashed rgba(90,50,30,0.3)",
    borderRadius: 14,
    padding: "32px 20px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 8,
    cursor: "pointer",
    background: "rgba(255,255,255,0.85)",
  },
  dropIcon: { fontSize: 32 },
  dropText: { fontSize: 15, fontWeight: 500, color: "#2A1F1A" },
  dropSub: { fontSize: 12, color: "#9C8878" },
  cameraBtn: {
    width: "100%",
    padding: "13px",
    borderRadius: 12,
    border: "0.5px solid rgba(90,50,30,0.22)",
    background: "rgba(255,255,255,0.85)",
    fontSize: 15,
    fontFamily: "Cormorant Garamond, serif",
    fontWeight: 600,
    cursor: "pointer",
    color: "#2A1F1A",
  },
  previewGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 8,
  },
  previewItem: {
    position: "relative",
    aspectRatio: "1",
    borderRadius: 8,
    overflow: "hidden",
    background: "#EDE0CB",
  },
  previewMedia: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
  },
  removeBtn: {
    position: "absolute",
    top: 4,
    right: 4,
    background: "rgba(0,0,0,0.6)",
    color: "#fff",
    border: "none",
    borderRadius: "50%",
    width: 22,
    height: 22,
    fontSize: 11,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  progressWrap: { display: "flex", flexDirection: "column", gap: 6 },
  progressBar: {
    height: 4,
    background: "rgba(90,50,30,0.12)",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    background: "#9C6B2E",
    borderRadius: 2,
    transition: "width 0.3s ease",
  },
  progressLabel: { fontSize: 12, color: "#9C8878", textAlign: "center" },
  uploadBtn: {
    width: "100%",
    padding: "15px",
    borderRadius: 12,
    border: "none",
    background: "#561820",
    color: "#fff",
    fontSize: 16,
    fontFamily: "Cormorant Garamond, serif",
    fontWeight: 600,
    letterSpacing: "0.04em",
    cursor: "pointer",
    transition: "opacity 0.15s",
  },
  toast: {
    position: "fixed",
    bottom: 24,
    left: "50%",
    transform: "translateX(-50%)",
    color: "#fff",
    padding: "10px 20px",
    borderRadius: 20,
    fontSize: 13,
    fontFamily: "DM Sans, sans-serif",
    whiteSpace: "nowrap",
    zIndex: 100,
  },
}
