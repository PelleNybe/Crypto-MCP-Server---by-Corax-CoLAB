import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { ToastProvider } from './context/ToastProvider'
import { ActivePortfolioSymbolProvider } from './context/ActivePortfolioSymbolProvider'
import './styles.css'

createRoot(document.getElementById('root')!).render(
  <ToastProvider>
    <ActivePortfolioSymbolProvider>
      <App />
    </ActivePortfolioSymbolProvider>
  </ToastProvider>
)
