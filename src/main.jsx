import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import ThemeWrapper from './components/ThemeWrapper'
import App from './App'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <ThemeWrapper>
          <AuthProvider>
            <App />
          </AuthProvider>
        </ThemeWrapper>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>,
)

