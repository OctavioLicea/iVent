// Página: LiveBoard — app/src/pages/LiveBoard.jsx
// Cambio: el título ya no hereda config.typography.title.color (pensado para fondos claros de la portada) — el LiveBoard siempre tiene fondo oscuro, así que usa un color claro fijo (#EDE0CB) para que nunca se pierda sin importar la paleta del evento
// 2026-06-19 19:15

import { useEffect, useState, useRef, useCallback } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { supabase } from "../lib/supabase"

const SPEED      = 0.6
const LOAD_LIMIT = 300

function getNumCols() {
  const vw = window.innerWidth
  return vw < 480 ? 2 : vw < 768 ? 3 : 4
}
const ROTS = [-1.8, 0.9, -0.6, 1.4, 0, -1.2, 0.7, -0.4]
function rndRot(ci) {
  const b = ROTS[ci % ROTS.length]
  return b + (Math.random() * 0.6 - 0.3)
}

export default function LiveBoard() {
  const { eventId } = useParams()
  const navigate    = useNavigate()

  const [eventTitle, setEventTitle] = useState("")
  const [titleFont, setTitleFont]   = useState("Great Vibes")
  const [titleColor, setTitleColor] = useState("#EDE0CB")
  const [count, setCount]           = useState(0)
  const [autoScroll, setAutoScroll] = useState(true)
  const [selected, setSelected]     = useState(new Map())
  const [loading, setLoading]       = useState(true)

  const wrapRef   = useRef(null)
  const canvasRef = useRef(null)
  const colsRef   = useRef([])
  const placedIds = useRef(new Set())
  const scrollYRef = useRef(0)
  const autoRef   = useRef(true)
  const rafRef    = useRef(null)

  useEffect(() => { autoRef.current = autoScroll }, [autoScroll])

  // Init columnas
  useEffect(() => {
    if (!canvasRef.current) return
    const NUM_COLS = getNumCols()
    canvasRef.current.innerHTML = ""
    colsRef.current = []
    for (let i = 0; i < NUM_COLS; i++) {
      const col = document.createElement("div")
      col.style.cssText = "flex:1;display:flex;flex-direction:column;gap:6px"
      canvasRef.current.appendChild(col)
      colsRef.current.push({ el: col, height: 0 })
    }
  }, [])

  // Cargar título + tipografía del evento
  useEffect(() => {
    async function loadEvent() {
      const { data } = await supabase
        .from("events").select("title, config").eq("id", eventId).single()
      if (data) {
        setEventTitle(data.title || "Collage en vivo")
        const typo = data.config?.typography?.title
        if (typo?.font) setTitleFont(typo.font)
        // NOTA: el color del título NO se hereda del config — config.typography.title.color
        // está pensado para fondos claros (la portada). El LiveBoard siempre tiene fondo
        // oscuro por diseño, así que el título usa siempre el color claro fijo (titleColor state).
        // cargar google font dinámicamente
        const font = typo?.font || "Great Vibes"
        const id = 'lb-gfont'
        let link = document.getElementById(id)
        if (!link) { link = document.createElement('link'); link.id = id; link.rel = 'stylesheet'; document.head.appendChild(link) }
        link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(font)}:wght@400;700&display=swap`
      }
    }
    loadEvent()
  }, [eventId])

  // Colocar foto en columna masonry
  const placePhoto = useCallback((row, prepend = false) => {
    if (placedIds.current.has(row.id) || row.hidden) return
    placedIds.current.add(row.id)
    setCount(c => c + 1)

    const cols     = colsRef.current
    const NUM_COLS = cols.length
    const VW       = window.innerWidth
    const isVideo  = row.type === "video"
    const colIdx   = prepend ? 0 : cols.reduce((min, col, i) => col.height < cols[min].height ? i : min, 0)
    const rot      = rndRot(colIdx)

    const el = document.createElement("div")
    el.dataset.id = row.id
    el.style.cssText = `
      position:relative;border-radius:4px;overflow:hidden;
      border:3px solid rgba(255,255,255,0.12);
      box-shadow:0 2px 12px rgba(0,0,0,.5);
      cursor:pointer;flex-shrink:0;
      transform:rotate(${rot}deg);
      transition:transform .25s,box-shadow .25s,border-color .25s;
    `
    const media = isVideo
      ? `<video src="${row.url}" muted loop autoplay playsinline style="width:100%;display:block;aspect-ratio:9/16;background:#000;object-fit:cover"></video>`
      : `<img src="${row.url}" alt="" loading="lazy" style="width:100%;display:block;object-fit:cover;min-height:120px">`
    const nameTag = row.name
      ? `<div style="position:absolute;bottom:0;left:0;right:0;background:linear-gradient(transparent,rgba(26,17,13,.75));color:rgba(237,224,203,.9);font-size:10px;text-align:center;padding:12px 6px 5px;font-family:DM Sans,sans-serif">${row.name}</div>`
      : ""
    el.innerHTML = media + nameTag

    el.addEventListener("click", () => {
      if (!autoRef.current) {
        setSelected(prev => {
          const next = new Map(prev)
          if (next.has(row.id)) {
            next.delete(row.id)
            el.style.outline = ""
          } else {
            next.set(row.id, row.url)
            el.style.outline = "3px solid #4A7C59"
            el.style.outlineOffset = "2px"
          }
          return next
        })
      }
    })

    if (prepend) cols[0].el.insertBefore(el, cols[0].el.firstChild)
    else cols[colIdx].el.appendChild(el)

    const colW    = VW / NUM_COLS
    const approxH = isVideo ? colW * (16 / 9) : colW * (4 / 3)
    cols[colIdx].height += approxH + 6
    const mediaEl = el.querySelector("img,video")
    if (mediaEl) {
      const upd = () => {
        const real = el.offsetHeight
        if (real > 0) cols[colIdx].height += real - approxH
      }
      if (isVideo) mediaEl.addEventListener("loadedmetadata", upd, { once: true })
      else mediaEl.addEventListener("load", upd, { once: true })
    }
  }, [])

  // Cargar fotos iniciales
  useEffect(() => {
    if (colsRef.current.length === 0) return
    async function loadPhotos() {
      const { data, error } = await supabase
        .from("photos")
        .select("id, url, name, type, hidden, created_at")
        .eq("event_id", eventId)
        .eq("hidden", false)
        .in("type", ["image", "video"])
        .order("created_at", { ascending: false })
        .limit(LOAD_LIMIT)
      if (!error && data) data.forEach(row => placePhoto(row, false))
      setLoading(false)
    }
    loadPhotos()
  }, [eventId, placePhoto])

  // Realtime
  useEffect(() => {
    const channel = supabase
      .channel(`liveboard-${eventId}`)
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: "photos",
        filter: `event_id=eq.${eventId}`,
      }, (payload) => {
        const row = payload.new
        if (row.hidden || !["image", "video"].includes(row.type)) return
        placePhoto(row, true)
        setTimeout(() => {
          if (autoRef.current) {
            scrollYRef.current = 0
            if (canvasRef.current) canvasRef.current.style.transform = "translateY(0)"
          } else {
            wrapRef.current?.scrollTo({ top: 0, behavior: "smooth" })
          }
        }, 150)
      })
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [eventId, placePhoto])

  // Autoscroll RAF loop
  useEffect(() => {
    function loop() {
      if (autoRef.current && canvasRef.current) {
        const maxScroll = canvasRef.current.scrollHeight - window.innerHeight
        if (maxScroll > 0) {
          scrollYRef.current += SPEED
          if (scrollYRef.current >= maxScroll) scrollYRef.current = 0
          canvasRef.current.style.transform = `translateY(-${scrollYRef.current}px)`
        }
      }
      rafRef.current = requestAnimationFrame(loop)
    }
    rafRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(rafRef.current)
  }, [])

  // Toggle autoscroll
  function toggleScroll() {
    const next = !autoScroll
    setAutoScroll(next)
    if (next) {
      scrollYRef.current = wrapRef.current?.scrollTop || 0
      if (wrapRef.current) wrapRef.current.style.overflowY = "hidden"
    } else {
      if (wrapRef.current) {
        wrapRef.current.style.overflowY = "auto"
        wrapRef.current.scrollTop = scrollYRef.current
      }
      if (canvasRef.current) canvasRef.current.style.transform = "none"
    }
  }

  // Descarga múltiple
  async function downloadSelected() {
    if (selected.size === 0) return
    for (const [id, url] of selected) {
      try {
        const res  = await fetch(url)
        const blob = await res.blob()
        const ext  = blob.type.includes("video") ? "mp4" : "jpg"
        const a    = document.createElement("a")
        a.href     = URL.createObjectURL(blob)
        a.download = `foto-${id}.${ext}`
        document.body.appendChild(a); a.click()
        setTimeout(() => { URL.revokeObjectURL(a.href); a.remove() }, 1000)
        await new Promise(r => setTimeout(r, 400))
      } catch (e) { console.error("dl error", id, e) }
    }
    setSelected(new Map())
  }

  // URL de la portada — mismo destino que usa el QR de EventFrontPage
  const frontPageUrl = `${window.location.origin}/e/${eventId}`
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(frontPageUrl)}`

  return (
    <div style={{ width: "100vw", height: "100vh", overflow: "hidden", background: "linear-gradient(160deg,#0a0a0f 0%,#0f0d14 50%,#0a0c10 100%)", position: "relative" }}>

      {/* Wrap con scroll */}
      <div
        ref={wrapRef}
        style={{ width: "100%", height: "100%", overflowY: autoScroll ? "hidden" : "auto", position: "relative" }}
      >
        {/* Header overlay */}
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, zIndex: 10,
          textAlign: "center", padding: "28px 24px 40px",
          background: "linear-gradient(to bottom,rgba(26,17,13,0.92) 40%,transparent)",
          pointerEvents: "none",
        }}>
          <div style={{
            fontFamily: `'${titleFont}',cursive,serif`,
            fontSize: 56,
            color: titleColor,
            lineHeight: 1,
            textShadow: "0 2px 12px rgba(0,0,0,.6), 0 1px 3px rgba(0,0,0,.8)",
          }}>
            {eventTitle}
          </div>
        </div>

        {/* Canvas masonry */}
        <div
          ref={canvasRef}
          style={{
            position: autoScroll ? "absolute" : "relative",
            left: 0, right: 0, top: 0,
            display: "flex", gap: 6, padding: 6,
            alignItems: "flex-start",
            willChange: autoScroll ? "transform" : "auto",
          }}
        />

        {/* Fade bottom */}
        <div style={{
          position: "fixed", bottom: 0, left: 0, right: 0, height: 100, zIndex: 9,
          background: "linear-gradient(to top,rgba(26,17,13,0.95) 20%,transparent)",
          pointerEvents: "none",
        }} />
      </div>

      {/* Botón volver */}
      <button onClick={() => navigate(`/e/${eventId}`)} style={{
        position: "fixed", top: 16, left: 16, zIndex: 20,
        display: "flex", alignItems: "center", gap: 7,
        background: "rgba(26,17,13,.75)", color: "#EDE0CB",
        border: "0.5px solid rgba(237,224,203,.2)", borderRadius: 30,
        padding: "7px 14px", fontFamily: "DM Sans,sans-serif", fontSize: 13, cursor: "pointer",
      }}>
        ← Inicio
      </button>

      {/* Live dot */}
      <div style={{
        position: "fixed", top: 16, right: 16, zIndex: 20,
        display: "flex", alignItems: "center", gap: 6,
        background: "rgba(26,17,13,.75)", color: "#EDE0CB",
        fontSize: 11, padding: "5px 12px", borderRadius: 20,
        fontFamily: "DM Sans,sans-serif", border: "0.5px solid rgba(237,224,203,.2)",
      }}>
        <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#c0392b", animation: "blink 1.2s infinite" }} />
        en vivo
      </div>

      {/* Contador */}
      <div style={{
        position: "fixed", bottom: 20, left: "50%", transform: "translateX(-50%)", zIndex: 20,
        background: "rgba(26,17,13,.75)", color: "#EDE0CB",
        padding: "8px 24px", borderRadius: 20, textAlign: "center",
        fontFamily: "DM Sans,sans-serif", border: "0.5px solid rgba(237,224,203,.2)",
      }}>
        <div style={{ fontFamily: "Cormorant Garamond,serif", fontSize: 28, lineHeight: 1 }}>{count}</div>
        <div style={{ fontSize: 11, opacity: 0.6 }}>fotos</div>
      </div>

      {/* Toggle autoscroll */}
      <div onClick={toggleScroll} style={{
        position: "fixed", bottom: 20, left: 16, zIndex: 20,
        display: "flex", alignItems: "center", gap: 8,
        background: "rgba(26,17,13,.75)", color: "#EDE0CB",
        padding: "8px 14px", borderRadius: 20,
        fontFamily: "DM Sans,sans-serif", fontSize: 12, cursor: "pointer",
        border: "0.5px solid rgba(237,224,203,.2)", userSelect: "none",
      }}>
        <div style={{
          width: 28, height: 16, borderRadius: 8, position: "relative", flexShrink: 0,
          background: autoScroll ? "#4A7C59" : "rgba(237,224,203,.25)", transition: "background .2s",
        }}>
          <div style={{
            position: "absolute", width: 12, height: 12, borderRadius: "50%",
            background: "#EDE0CB", top: 2, left: 2,
            transform: autoScroll ? "translateX(12px)" : "none", transition: "transform .2s",
          }} />
        </div>
        Auto
      </div>

      {/* QR flotante — lleva a la portada del evento (mismo patrón de generación que EventFrontPage) */}
      <a
        href={frontPageUrl}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          position: "fixed", bottom: 20, right: 16, zIndex: 20,
          display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
          background: "rgba(26,17,13,.85)", padding: "10px 10px 8px",
          borderRadius: 14, border: "0.5px solid rgba(237,224,203,.2)",
          textDecoration: "none", boxShadow: "0 4px 16px rgba(0,0,0,.4)",
        }}
      >
        <div style={{
          width: 76, height: 76, borderRadius: 8, background: "#fff",
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: 5, overflow: "hidden",
        }}>
          <img src={qrSrc} alt="QR de la portada" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
        </div>
        <span style={{
          fontFamily: "DM Sans,sans-serif", fontSize: 10, color: "rgba(237,224,203,.85)",
          letterSpacing: ".02em", whiteSpace: "nowrap",
        }}>
          Sube tu foto
        </span>
      </a>

      {/* Barra de descarga */}
      {selected.size > 0 && (
        <div style={{
          position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 25,
          background: "rgba(26,17,13,.95)", borderTop: "0.5px solid rgba(237,224,203,.15)",
          padding: "12px 16px", display: "flex", alignItems: "center", gap: 10,
        }}>
          <div style={{ flex: 1, fontFamily: "DM Sans,sans-serif", fontSize: 13, color: "rgba(237,224,203,.7)" }}>
            <strong style={{ color: "#EDE0CB" }}>{selected.size}</strong> foto(s) seleccionada(s)
          </div>
          <button onClick={() => setSelected(new Map())} style={{
            background: "rgba(237,224,203,.1)", color: "rgba(237,224,203,.7)",
            border: "0.5px solid rgba(237,224,203,.2)", padding: "10px 14px",
            borderRadius: 20, fontFamily: "DM Sans,sans-serif", fontSize: 13, cursor: "pointer",
          }}>Limpiar</button>
          <button onClick={downloadSelected} style={{
            background: "#4A7C59", color: "#fff", border: "none",
            padding: "10px 20px", borderRadius: 20,
            fontFamily: "DM Sans,sans-serif", fontSize: 13, fontWeight: 500, cursor: "pointer",
          }}>↓ Descargar</button>
        </div>
      )}

      {/* Loading overlay */}
      {loading && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 50, background: "#0a0a0f",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <p style={{ color: "#9C8878", fontFamily: "DM Sans,sans-serif" }}>Cargando collage…</p>
        </div>
      )}

      <style>{`
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:.2} }
      `}</style>
    </div>
  )
}
