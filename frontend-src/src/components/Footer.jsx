import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Footer() {
  const { isAdmin } = useAuth()
  return (
    <footer className="site-footer">
      <div className="container site-footer-inner">
        <span>© {new Date().getFullYear()} Bletaria ime. Ditari i bletarit, në telefon.</span>
        <nav aria-label="Lidhje të fundit">
          <Link to="/community">Komuniteti</Link>
          <Link to="/marketplace">Tregu</Link>
          {!isAdmin && <Link to="/donate">Mbështet</Link>}
          <a href="mailto:info@bletariaime.al">Kontakt</a>
        </nav>
      </div>
    </footer>
  )
}
