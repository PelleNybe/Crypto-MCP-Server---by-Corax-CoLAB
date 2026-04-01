import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { ToastProvider } from './components/NeonToasts'
import { ActivePortfolioSymbolProvider } from './hooks/useActivePortfolioSymbol'
import './styles.css'

createRoot(document.getElementById('root')!).render(
  <ToastProvider>
    <ActivePortfolioSymbolProvider>
      <App />
    </ActivePortfolioSymbolProvider>
  </ToastProvider>
)
