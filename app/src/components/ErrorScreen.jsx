// Componente: ErrorScreen — app/src/components/ErrorScreen.jsx
// Razón: Capa 4 — estado de error compartido para páginas del invitado
// 2026-06-25 19:20

export default function ErrorScreen({ msg = "Algo salió mal.", onRetry }) {
  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: 14,
      background: "#FAF7F2",
      fontFamily: "DM Sans, sans-serif",
      padding: "24px",
      textAlign: "center",
    }}>
      <div style={{
        width: 44,
        height: 44,
        borderRadius: "50%",
        background: "#FDF0EF",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 22,
      }}>
        ⚠️
      </div>
      <p style={{ color: "#C0392B", fontSize: 14, margin: 0, maxWidth: 260 }}>{msg}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          style={{
            marginTop: 4,
            background: "transparent",
            border: "1px solid #C0392B",
            color: "#C0392B",
            borderRadius: 20,
            padding: "8px 20px",
            fontSize: 13,
            fontFamily: "DM Sans, sans-serif",
            cursor: "pointer",
          }}
        >
          Reintentar
        </button>
      )}
    </div>
  )
}
