import { useState, useEffect, useRef } from 'react'
import { communityAPI } from '../api'
import { useAuth } from '../context/AuthContext'

const SAMPLE_POSTS = [
  {
    id: 1,
    author: { name: 'Agim Berisha', avatar: 'A', location: 'Shkodër' },
    content: 'Sot bëra vizitën e parë të pranverës! Koshereat janë në gjendje të shkëlqyer. 15 nga 18 koshere me mbretëreshë aktive. 🐝🍯',
    date: '2026-04-17T10:30:00Z',
    likes: 24,
    liked: false,
    comment_count: 5,
    image: null,
  },
  {
    id: 2,
    author: { name: 'Flutura Krasniqi', avatar: 'F', location: 'Prishtinë' },
    content: 'Çfarë mendoni, a duhet të filloj me trajtimin e Varroas tani në pranverë apo të pres deri në verë? Kopshti im ka ~60 koshere.',
    date: '2026-04-16T15:45:00Z',
    likes: 18,
    liked: false,
    comment_count: 12,
    image: null,
  },
  {
    id: 3,
    author: { name: 'Besnik Hoxha', avatar: 'B', location: 'Durrës' },
    content: '🍯 Vendosa mjaltën e para të vitit! Luleshtrydhe dhe limon - aroma e jashtëzakonshme. 40 kg nga 8 koshere. Ky vit po fillon mirë!',
    date: '2026-04-15T09:00:00Z',
    likes: 47,
    liked: true,
    comment_count: 8,
    image: null,
  },
]

const SAMPLE_COMMENTS = {
  1: [
    { id: 1, author: { name: 'Rexhep Gashi', avatar: 'R' }, content: 'Bukur! Sa kopshte ke gjithsej?', date: '2026-04-17T11:00:00Z' },
    { id: 2, author: { name: 'Zana Berisha', avatar: 'Z' }, content: 'Edhe unë kam rezultate të mira! Pranvera 2026 nisi mirë për bletarinë.', date: '2026-04-17T12:00:00Z' },
  ],
  2: [
    { id: 3, author: { name: 'Agim Berisha', avatar: 'A' }, content: 'Trajtimi i Varroas duhet të bëhet menjëherë pas blerjes së mjaltës. Prit derisa kosherat të kenë pak zile.', date: '2026-04-16T16:30:00Z' },
  ],
  3: [],
}

function PostCard({ post, onLike, onCommentAdded }) {
  const { user } = useAuth()
  const [showComments, setShowComments] = useState(false)
  const [comments, setComments] = useState(null)
  const [newComment, setNewComment] = useState('')
  const [loadingComments, setLoadingComments] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [localLiked, setLocalLiked] = useState(post.liked)
  const [localLikes, setLocalLikes] = useState(post.likes || 0)

  const loadComments = async () => {
    if (comments !== null) return
    setLoadingComments(true)
    try {
      const res = await communityAPI.comments(post.id)
      setComments(res.data.comments || res.data || [])
    } catch {
      setComments(SAMPLE_COMMENTS[post.id] || [])
    } finally {
      setLoadingComments(false)
    }
  }

  const toggleComments = () => {
    setShowComments(!showComments)
    if (!showComments && comments === null) loadComments()
  }

  const handleLike = async () => {
    const wasLiked = localLiked
    setLocalLiked(!wasLiked)
    setLocalLikes(prev => wasLiked ? prev - 1 : prev + 1)
    try {
      await communityAPI.likePost(post.id)
    } catch {
      setLocalLiked(wasLiked)
      setLocalLikes(prev => wasLiked ? prev + 1 : prev - 1)
    }
  }

  const handleAddComment = async (e) => {
    e.preventDefault()
    if (!newComment.trim() || !user) return
    setSubmitting(true)
    try {
      const res = await communityAPI.addComment(post.id, { content: newComment })
      const newC = res.data.comment || { id: Date.now(), author: { name: user.name, avatar: user.name?.charAt(0) }, content: newComment, date: new Date().toISOString() }
      setComments(prev => [...(prev || []), newC])
      setNewComment('')
    } catch {
      const fallback = { id: Date.now(), author: { name: user.name, avatar: user.name?.charAt(0) }, content: newComment, date: new Date().toISOString() }
      setComments(prev => [...(prev || []), fallback])
      setNewComment('')
    } finally {
      setSubmitting(false)
    }
  }

  const timeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime()
    const h = Math.floor(diff / 3600000)
    const d = Math.floor(h / 24)
    if (d > 0) return `${d} ditë më parë`
    if (h > 0) return `${h} orë më parë`
    return 'Tani'
  }

  return (
    <div className="card" style={{ marginBottom: '1rem', overflow: 'hidden' }}>
      <div className="card-body">
        {/* Author */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div className="avatar" style={{ width: '42px', height: '42px', fontSize: '1.1rem' }}>
              {post.author?.avatar || post.author?.name?.charAt(0) || '?'}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{post.author?.name}</div>
              {post.author?.location && (
                <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>📍 {post.author.location}</div>
              )}
            </div>
          </div>
          <span style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>{timeAgo(post.date)}</span>
        </div>

        {/* Content */}
        <p style={{ fontSize: '0.92rem', color: 'var(--text)', lineHeight: 1.7, marginBottom: '0.85rem', whiteSpace: 'pre-wrap' }}>
          {post.content}
        </p>

        {/* Image */}
        {post.image && (
          <img src={post.image} alt="" style={{ width: '100%', borderRadius: 'var(--radius-sm)', marginBottom: '0.85rem', maxHeight: '300px', objectFit: 'cover' }} />
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: '1rem', borderTop: '1px solid var(--border)', paddingTop: '0.75rem' }}>
          <button
            onClick={handleLike}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: 600,
              color: localLiked ? 'var(--red)' : 'var(--muted)',
              padding: '0.3rem 0.5rem',
              borderRadius: 'var(--radius-sm)',
              transition: 'all 0.15s',
            }}
          >
            {localLiked ? '❤️' : '🤍'} {localLikes}
          </button>

          <button
            onClick={toggleComments}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: 600,
              color: showComments ? 'var(--gold)' : 'var(--muted)',
              padding: '0.3rem 0.5rem',
              borderRadius: 'var(--radius-sm)',
              transition: 'all 0.15s',
            }}
          >
            💬 {post.comment_count || 0} komente
          </button>
        </div>

        {/* Comments */}
        {showComments && (
          <div style={{ marginTop: '0.75rem', borderTop: '1px solid var(--border)', paddingTop: '0.75rem' }}>
            {loadingComments ? (
              <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--muted)' }}>
                <div className="spinner" style={{ width: '24px', height: '24px', margin: '0 auto' }} />
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginBottom: '0.75rem' }}>
                {(comments || []).map(c => (
                  <div key={c.id} style={{ display: 'flex', gap: '0.5rem' }}>
                    <div className="avatar" style={{ width: '30px', height: '30px', fontSize: '0.75rem', flexShrink: 0 }}>
                      {c.author?.avatar || c.author?.name?.charAt(0) || '?'}
                    </div>
                    <div style={{ flex: 1, background: 'var(--surface)', padding: '0.5rem 0.75rem', borderRadius: '0 var(--radius-sm) var(--radius-sm) var(--radius-sm)', fontSize: '0.85rem' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.8rem' }}>{c.author?.name}</span>
                      <span style={{ color: 'var(--muted)', fontSize: '0.72rem', marginLeft: '0.5rem' }}>{timeAgo(c.date)}</span>
                      <p style={{ margin: '0.15rem 0 0', color: 'var(--text)', lineHeight: 1.5 }}>{c.content}</p>
                    </div>
                  </div>
                ))}
                {(comments || []).length === 0 && (
                  <p style={{ color: 'var(--muted)', fontSize: '0.82rem', textAlign: 'center' }}>Nuk ka komente ende.</p>
                )}
              </div>
            )}

            {user && (
              <form onSubmit={handleAddComment} style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
                <div className="avatar" style={{ width: '30px', height: '30px', fontSize: '0.75rem', flexShrink: 0 }}>
                  {user.name?.charAt(0)}
                </div>
                <input
                  className="form-control"
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                  placeholder="Shto koment..."
                  style={{ flex: 1, padding: '0.45rem 0.75rem', fontSize: '0.85rem' }}
                />
                <button type="submit" className="btn btn-primary btn-sm" disabled={submitting || !newComment.trim()}>
                  {submitting ? '⏳' : '→'}
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function AddPostModal({ onClose, onAdded }) {
  const { user } = useAuth()
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!content.trim()) { setError('Shkruaj diçka para se të postosh.'); return }
    setLoading(true)
    try {
      const res = await communityAPI.createPost({ content })
      const post = res.data.post || {
        id: Date.now(),
        author: { name: user?.name, avatar: user?.name?.charAt(0), location: user?.location },
        content,
        date: new Date().toISOString(),
        likes: 0,
        liked: false,
        comment_count: 0,
      }
      onAdded(post)
      onClose()
    } catch {
      const fallback = {
        id: Date.now(),
        author: { name: user?.name, avatar: user?.name?.charAt(0), location: user?.location },
        content,
        date: new Date().toISOString(),
        likes: 0,
        liked: false,
        comment_count: 0,
      }
      onAdded(fallback)
      onClose()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <span className="modal-title">📝 Postim i Ri</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && <div className="alert alert-error">{error}</div>}
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <div className="avatar" style={{ flexShrink: 0 }}>{user?.name?.charAt(0)}</div>
              <div style={{ flex: 1, color: 'var(--muted)', fontSize: '0.85rem', alignSelf: 'center' }}>
                {user?.name}
              </div>
            </div>
            <textarea
              className="form-control"
              rows={5}
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="Çfarë ndodh në kopshtin tënd? Ndaj eksperiencën tënde me komunitetin... 🐝"
              autoFocus
            />
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Anulo</button>
            <button type="submit" className="btn btn-primary" disabled={loading || !content.trim()}>
              {loading ? '⏳' : '📢 Posto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function CommunityPage() {
  const { user } = useAuth()
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)

  useEffect(() => {
    loadPosts(1)
  }, [])

  const loadPosts = async (pg) => {
    setLoading(true)
    try {
      const res = await communityAPI.posts(pg)
      const data = res.data.posts || res.data || []
      if (pg === 1) {
        setPosts(data.length ? data : SAMPLE_POSTS)
      } else {
        setPosts(prev => [...prev, ...data])
      }
      setHasMore(data.length === 10)
      setPage(pg)
    } catch {
      if (pg === 1) setPosts(SAMPLE_POSTS)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-content">
      <div className="container" style={{ maxWidth: '700px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              💬 Komuniteti
            </h1>
            <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>Ndaj eksperiencën tënde me bletarët e tjerë</p>
          </div>
          {user && (
            <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
              📝 Shto Postim
            </button>
          )}
        </div>

        {loading && page === 1 ? (
          <div className="loading-center"><div className="spinner" /></div>
        ) : (
          <div>
            {posts.map(post => (
              <PostCard
                key={post.id}
                post={post}
                onLike={() => {}}
              />
            ))}

            {posts.length === 0 && (
              <div className="empty-state">
                <div className="empty-state-icon">💬</div>
                <h3>Nuk ka postime ende</h3>
                <p>Ji i pari që poston!</p>
              </div>
            )}

            {hasMore && !loading && (
              <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
                <button
                  className="btn btn-ghost"
                  onClick={() => loadPosts(page + 1)}
                  disabled={loading}
                >
                  {loading ? '⏳ Duke ngarkuar...' : '⬇ Ngarko më shumë'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {showAddModal && (
        <AddPostModal
          onClose={() => setShowAddModal(false)}
          onAdded={post => setPosts(prev => [post, ...prev])}
        />
      )}
    </div>
  )
}
