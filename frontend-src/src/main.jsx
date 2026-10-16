import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)

// Escape mbyll modalin e sipërm (modalet mbyllen kur klikohet sfondi)
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return
  const overlays = document.querySelectorAll('.modal-overlay')
  overlays[overlays.length - 1]?.click()
})
