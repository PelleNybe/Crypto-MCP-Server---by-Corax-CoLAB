import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { ToastProvider } from './context/ToastProvider'
import { ActivePortfolioSymbolProvider } from './context/ActivePortfolioSymbolProvider'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <ToastProvider>
      <ActivePortfolioSymbolProvider>
        <App />
      </ActivePortfolioSymbolProvider>
    </ToastProvider>
  </React.StrictMode>,
)
