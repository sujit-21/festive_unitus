import { StrictMode } from 'react'
import 'bootstrap/dist/css/bootstrap.min.css'
import { AuthProvider } from './context/AuthContext'
import { FestivalProvider } from './context/FestivalContext'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <FestivalProvider>
        <App />
      </FestivalProvider>
    </AuthProvider>
  </StrictMode>,

)
