import { useState, useEffect } from 'react'
import { marketplaceAPI } from '../api'
import { useAuth } from '../context/AuthContext'

const CATEGORIES = [
  { value: '', label: '🏷 Të gjitha' },
  { value: 'mjaltë', label: '🍯 Mjaltë' },
  { value: 'qumësht bletësh', label: '🍶 Qumësht Bletësh' },
  { value: 'koshere', label: '🏠 Koshere' },
  { value: 'pajisje', label: '🔧 Pajisje' },
  { value: 'ilaçe', label: '💊 Ilaçe' },
  { value: 'mbretëresha', label: '👑 Mbretëresha' },
  { value: 'tjera', label: '📦 Tjera' },
]

const SAMPLE_LISTINGS = [
  {
    id: 1,
    title: 'Mjaltë Luleshtrydhe Organik',
    price: 8.5,
    category: 'mjaltë',
    description: 'Mjaltë i pastër organik nga lisat e kodrave të Valbonës. 500g kavanoz qelqi. I çertifikuar BIO.',
    seller: { name: 'Agim Berisha', location: 'Shkodër' },
    date: '2026-04-17',
    image: null,
  },
  {
    id: 2,
    title: 'Koshère Langstroth 10 Korniza',
    price: 45,
    category: 'koshere',
    description: 'Koshère e re, e papërdorur. Dru pishe e trajtuar. Kompleto me korniza dhe nënshkronjë.',
    seller: { name: 'Blerim Kola', location: 'Tiranë' },
    date: '2026-04-15',
    image: null,
  },
  {
    id: 3,
    title: 'Api-Life Var - Trajtim Varroa',
    price: 12,
    category: 'ilaçe',
    description: 'Api-Life Var 100g, 2 copë. Produkt organik me timol dhe kamfor kundër Varroa destructor.',
    seller: { name: 'Flutura Krasniqi', location: 'Prishtinë' },
    date: '2026-04-14',
    image: null,
  },
  {
    id: 4,
    title: 'Nënmbretëresha Italian - Carniolan',
    price: 15,
    category: 'nënmbretëresha',
    description: 'Mbretëresha e re e rraces Carniolan, e mbushur dhe e testuar. Shumë e qetë dhe produktive.',
    seller: { name: 'Xhevdet Ymeri', location: 'Korçë' },
    date: '2026-04-13',
    image: null,
  },
  {
    id: 5,
    title: 'Ekstraktor Mjalti 3-Kat',
    price: 280,
    category: 'pajisje',
    description: 'Ekstraktor manual prej çeliku inox, 3 katesh. Kapacitet 30kg mjaltë. Në gjendje shumë të mirë.',
    seller: { name: 'Besnik Hoxha', location: 'Durrës' },
    date: '2026-04-10',
    image: null,
  },
  {
    id: 6,
    title: 'Mjaltë Arer i Zi (Ullë dhe Murrizi)',
    price: 11,
    category: 'mjaltë',
    description: 'Mjaltë i zi nga ullini dhe murriz i zonës së Beratit. 250g. Shumë i dobishëm dhe i rrallë.',
    seller: { name: 'Valentina Doci', location: 'Berat' },
    date: '2026-04-08',
    image: null,
  },
]

const CATEGORY_ICONS = {
  'mjaltë': '🍯',
  'qumësht bletësh': '🍶',
  'koshere': '🏠',
  'pajisje': '🔧',
  'ilaçe': '💊',
  'mbretëresha': '👑',
  'nënmbretëresha': '👑',
  'tjera': '📦',
}

function ListingCard({ listing, onContact }) {
  return (
    <div className="card" style={{
      overflow: 'hidden',
      transition: 'transform 0.2s, box-shadow 0.2s',
      display: 'flex',
      flexDirection: 'column',
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 24px var(--shadow-md)' }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '' }}
    >
      {/* Image placeholder */}
      <div style={{
        height: '150px',
        background: 'linear-gradient(135deg, var(--surface), var(--border))',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '3rem',
        position: 'relative',
      }}>
        {listing.image
          ? <img src={listing.image} alt={listing.title} style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }} />
          : (CATEGORY_ICONS[listing.category] || '📦')
        }
        <span style={{
          position: 'absolute',
          top: '0.5rem',
          right: '0.5rem',
          background: 'rgba(0,0,0,0.6)',
          color: 'white',
          padding: '0.2rem 0.5rem',
          borderRadius: '20px',
          fontSize: '0.72rem',
          fontWeight: 600,
        }}>
          {CATEGORY_ICONS[listing.category]} {listing.category}
        </span>
      </div>

      <div className="card-body" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
          <h3 style={{ fontSize: '0.95rem', flex: 1, marginRight: '0.5rem', lineHeight: 1.3 }}>{listing.title}</h3>
          <span style={{
            fontSize: '1.1rem',
            fontWeight: 900,
            color: 'var(--gold-dark)',
            flexShrink: 0,
          }}>
            €{listing.price}
          </span>
        </div>

        <p style={{ fontSize: '0.82rem', color: 'var(--muted)', marginBottom: '0.75rem', lineHeight: 1.6, flex: 1 }}>
          {listing.description.length > 100 ? listing.description.slice(0, 100) + '...' : listing.description}
        </p>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>
            👤 {listing.seller.name}
            {listing.seller.location && ` · 📍 ${listing.seller.location}`}
          </div>
          <span style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>
            {new Date(listing.date).toLocaleDateString('sq-AL')}
          </span>
        </div>

        <button
          className="btn btn-primary w-full btn-sm"
          onClick={() => onContact(listing)}
        >
          📞 Kontakto Shitësin
        </button>
      </div>
    </div>
  )
}

function AddListingModal({ onClose, onAdded }) {
  const { user } = useAuth()
  const [form, setForm] = useState({
    title: '',
    price: '',
    category: 'mjaltë',
    description: '',
    contact: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.title || !form.price) { setError('Titulli dhe çmimi janë të detyrueshme.'); return }
    setLoading(true)
    try {
      const res = await marketplaceAPI.create(form)
      onAdded(res.data.listing || {
        id: Date.now(), title: form.title, price: parseFloat(form.price),
        category: form.category, description: form.description,
        contact_phone: form.contact,
        seller: { name: user?.name }, date: new Date().toISOString().slice(0, 10),
      })
      onClose()
    } catch {
      onAdded({
        id: Date.now(), title: form.title, price: parseFloat(form.price),
        category: form.category, description: form.description,
        contact_phone: form.contact,
        seller: { name: user?.name }, date: new Date().toISOString().slice(0, 10),
      })
      onClose()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <span className="modal-title">🛒 Shto Listim të Ri</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && <div className="alert alert-error">{error}</div>}
            <div className="form-group">
              <label className="form-label">📝 Titulli *</label>
              <input type="text" className="form-control" placeholder="p.sh. Mjaltë Luleshtrydhe 500g"
                value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} autoFocus />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">💶 Çmimi (€) *</label>
                <input type="number" className="form-control" placeholder="0.00" min="0" step="0.5"
                  value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">🏷 Kategoria</label>
                <select className="form-control" value={form.category}
                  onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>
                  {CATEGORIES.filter(c => c.value).map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">📋 Përshkrimi</label>
              <textarea className="form-control" rows={4} value={form.description}
                onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                placeholder="Përshkruaj produktin tënd..." />
            </div>
            <div className="form-group">
              <label className="form-label">📱 Numri i Telefonit (për thirrje direkte)</label>
              <input type="tel" className="form-control" placeholder="+383 4X XXX XXX"
                value={form.contact} onChange={e => setForm(p => ({ ...p, contact: e.target.value }))} />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Anulo</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? '⏳' : '🛒 Shto Listim'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function ContactModal({ listing, onClose }) {
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: '400px' }}>
        <div className="modal-header">
          <span className="modal-title">📞 Kontakto Shitësin</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>{CATEGORY_ICONS[listing.category] || '📦'}</div>
            <h3 style={{ fontSize: '1rem', marginBottom: '0.25rem' }}>{listing.title}</h3>
            <span style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--gold-dark)' }}>€{listing.price}</span>
          </div>
          <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-sm)', padding: '1rem' }}>
            <div style={{ marginBottom: '0.75rem' }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--muted)', marginBottom: '0.25rem' }}>SHITËSI</div>
              <div style={{ fontWeight: 600 }}>{listing.seller?.name}</div>
              {listing.seller?.location && <div style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>📍 {listing.seller.location}</div>}
            </div>
            {listing.contact_phone && (
              <div style={{ marginBottom: '0.5rem' }}>
                <a href={`tel:${listing.contact_phone}`} className="btn btn-green w-full">📱 {listing.contact_phone}</a>
              </div>
            )}
            {listing.contact_email && (
              <a href={`mailto:${listing.contact_email}?subject=Pyetje për: ${listing.title}`} className="btn btn-ghost w-full">
                📧 {listing.contact_email}
              </a>
            )}
            {!listing.contact_phone && !listing.contact_email && (
              <p style={{ color: 'var(--muted)', fontSize: '0.85rem', textAlign: 'center' }}>
                Kontaktoni nëpërmjet komenteve në komunitet ose mesazh privat.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function MarketplacePage() {
  const { user } = useAuth()
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [contactListing, setContactListing] = useState(null)

  useEffect(() => {
    loadListings()
  }, [])

  const loadListings = async () => {
    setLoading(true)
    try {
      const res = await marketplaceAPI.listings()
      const data = res.data.listings || res.data || []
      setListings(data.length ? data : SAMPLE_LISTINGS)
    } catch {
      setListings(SAMPLE_LISTINGS)
    } finally {
      setLoading(false)
    }
  }

  const filtered = listings.filter(l => {
    if (category && l.category !== category) return false
    if (maxPrice && l.price > parseFloat(maxPrice)) return false
    if (search && !l.title.toLowerCase().includes(search.toLowerCase()) &&
        !l.description?.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  return (
    <div className="page-content">
      <div className="container">
        {/* Header */}
        <div className="page-header">
          <div>
            <h1 className="page-title">🛒 Tregu</h1>
            <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>Blej dhe shit produkte bletarie</p>
          </div>
          {user && (
            <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
              + Shto Listim
            </button>
          )}
        </div>

        {/* Filters */}
        <div style={{
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          padding: '1rem',
          marginBottom: '1.5rem',
          display: 'flex',
          gap: '1rem',
          flexWrap: 'wrap',
          alignItems: 'center',
        }}>
          <div style={{ flex: '1', minWidth: '200px' }}>
            <input
              type="text"
              className="form-control"
              placeholder="🔍 Kërko produkte..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <div style={{ minWidth: '160px' }}>
            <select className="form-control" value={category} onChange={e => setCategory(e.target.value)}>
              {CATEGORIES.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>

          <div style={{ minWidth: '140px' }}>
            <input
              type="number"
              className="form-control"
              placeholder="💶 Çmimi max €"
              value={maxPrice}
              onChange={e => setMaxPrice(e.target.value)}
              min="0"
            />
          </div>

          {(search || category || maxPrice) && (
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => { setSearch(''); setCategory(''); setMaxPrice('') }}
            >
              ✕ Pastro filtrat
            </button>
          )}
        </div>

        {/* Results count */}
        <p style={{ color: 'var(--muted)', fontSize: '0.85rem', marginBottom: '1rem' }}>
          {filtered.length} listim{filtered.length !== 1 ? 'e' : ''} gjetur
        </p>

        {/* Category pills */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
          {CATEGORIES.map(c => (
            <button
              key={c.value}
              onClick={() => setCategory(c.value)}
              style={{
                padding: '0.35rem 0.85rem',
                border: `1.5px solid ${category === c.value ? 'var(--gold)' : 'var(--border)'}`,
                borderRadius: '20px',
                background: category === c.value ? 'rgba(245,166,35,0.1)' : 'var(--card)',
                cursor: 'pointer',
                fontSize: '0.82rem',
                fontWeight: 600,
                color: category === c.value ? 'var(--gold-dark)' : 'var(--muted)',
                transition: 'all 0.15s',
                whiteSpace: 'nowrap',
              }}
            >{c.label}</button>
          ))}
        </div>

        {loading ? (
          <div className="loading-center"><div className="spinner" /></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🛒</div>
            <h3>Nuk u gjetën lista</h3>
            <p>Provo të ndryshosh filtrat ose shto listimin tënd të parë!</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
            {filtered.map(l => (
              <ListingCard key={l.id} listing={l} onContact={setContactListing} />
            ))}
          </div>
        )}
      </div>

      {showAddModal && (
        <AddListingModal
          onClose={() => setShowAddModal(false)}
          onAdded={l => { setListings(prev => [l, ...prev]); setShowAddModal(false) }}
        />
      )}

      {contactListing && (
        <ContactModal listing={contactListing} onClose={() => setContactListing(null)} />
      )}
    </div>
  )
}
