export default function PageLoader({ size = 48 }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '320px',
      width: '100%',
    }}>
      <div style={{
        width: size,
        height: size,
        border: '4px solid rgba(245,166,35,0.2)',
        borderTop: '4px solid #F5A623',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
