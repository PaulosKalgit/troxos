import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Resolve the background image against the deploy base path (works on
// GitHub Pages' /troxos/ subpath as well as local root).
document.documentElement.style.setProperty(
  '--board-bg',
  `url(${import.meta.env.BASE_URL}board-bg.png)`
)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
