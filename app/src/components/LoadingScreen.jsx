// Componente: LoadingScreen — app/src/components/LoadingScreen.jsx
// Razón: Capa 4 — estado de carga compartido para páginas del invitado
// 2026-06-25 19:20

export default function LoadingScreen({ msg = "Cargando…" }) {
  return (
    <>
      <style>{`@keyframes iv-spin { to { transform: rotate(360deg) } }`}</style>
      <div style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 14,
        background: "#FAF7F2",
        fontFamily: "DM Sans, sans-serif",
      }}>
        <div style={{
          width: 30,
          height: 30,
          borderRadius: "50%",
          border: "2.5px solid rgba(0,0,0,0.08)",
          borderTopColor: "#C9A84C",
          animation: "iv-spin 0.8s linear infinite",
        }} />
        <p style={{ color: "#9C8878", fontSize: 14, margin: 0 }}>{msg}</p>
      </div>
    </>
  )
}
