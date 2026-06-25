import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Evitar que el scroll modifique inputs numéricos
document.addEventListener('wheel', (e) => {
  const el = e.target as HTMLElement;
  if (el instanceof HTMLInputElement && el.type === 'number') {
    el.blur();
  }
}, { passive: true });

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
