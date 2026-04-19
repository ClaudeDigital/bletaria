import SpinningGlobe from './SpinningGlobe'

export default function PageLoader({ size = 200 }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '320px',
      width: '100%',
    }}>
      <SpinningGlobe size={size} />
    </div>
  )
}
