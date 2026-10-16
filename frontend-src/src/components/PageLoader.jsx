export default function PageLoader({ label = 'Duke ngarkuar…' }) {
  return (
    <div className="loading-center" role="status">
      <div className="spinner" />
      <span className="visually-hidden">{label}</span>
    </div>
  )
}
