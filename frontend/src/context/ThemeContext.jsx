import React, { createContext, useContext, useState, useEffect } from 'react'
import { preferencesApi } from '../api'
import { useAuth } from './AuthContext'

const ThemeContext = createContext(null)

function buildBgStyle(pref) {
  if (!pref || pref.backgroundType === 'default') return {}
  if (pref.backgroundType === 'color') return { backgroundColor: pref.backgroundColor || '#f9fafb' }
  if (pref.backgroundType === 'gradient') return {
    background: `linear-gradient(${pref.gradientAngle ?? 135}deg, ${pref.gradientFrom || '#667eea'}, ${pref.gradientTo || '#764ba2'})`,
  }
  if (pref.backgroundType === 'image' && pref.backgroundImage) return {
    backgroundImage: `url(${pref.backgroundImage})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundAttachment: 'fixed',
  }
  return {}
}

export function ThemeProvider({ children }) {
  const { user } = useAuth()
  const [pref, setPref] = useState(null)

  const load = () => {
    if (user) preferencesApi.get().then(setPref).catch(() => {})
    else setPref(null)
  }

  useEffect(() => { load() }, [user?.id])

  // Inject custom CSS into <head>
  useEffect(() => {
    const id = 'user-custom-css'
    let el = document.getElementById(id)
    if (pref?.customCss) {
      if (!el) { el = document.createElement('style'); el.id = id; document.head.appendChild(el) }
      el.textContent = pref.customCss
    } else if (el) {
      el.textContent = ''
    }
  }, [pref?.customCss])

  return (
    <ThemeContext.Provider value={{ pref, reload: load, bgStyle: buildBgStyle(pref) }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
