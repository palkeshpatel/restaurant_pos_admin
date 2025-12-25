'use client'

import { createContext, useContext, useState, useEffect, useMemo } from 'react'
import { createTheme } from '@mui/material/styles'

export const themes = {
  orange: {
    name: 'Orange',
    primary: {
      main: '#FF9900',
      dark: '#F08700',
      light: '#FFB340',
    },
  },
  blue: {
    name: 'Blue',
    primary: {
      main: '#1976d2',
      dark: '#1565c0',
      light: '#42a5f5',
    },
  },
  green: {
    name: 'Green',
    primary: {
      main: '#2e7d32',
      dark: '#1b5e20',
      light: '#4caf50',
    },
  },
  purple: {
    name: 'Purple',
    primary: {
      main: '#7b1fa2',
      dark: '#6a1b9a',
      light: '#ab47bc',
    },
  },
  teal: {
    name: 'Teal',
    primary: {
      main: '#00897b',
      dark: '#00695c',
      light: '#26a69a',
    },
  },
  red: {
    name: 'Red',
    primary: {
      main: '#d32f2f',
      dark: '#c62828',
      light: '#ef5350',
    },
  },
}

const ThemeContext = createContext({
  themeName: 'orange',
  setThemeName: () => {},
  themes: {},
  muiTheme: null,
})

export const useThemeContext = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useThemeContext must be used within a ThemeProvider')
  }
  return context
}

export const ThemeProvider = ({ children }) => {
  const [themeName, setThemeNameState] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('adminTheme') || 'orange'
    }
    return 'orange'
  })

  const setThemeName = (name) => {
    setThemeNameState(name)
    if (typeof window !== 'undefined') {
      localStorage.setItem('adminTheme', name)
    }
  }

  const selectedTheme = themes[themeName] || themes.orange

  const muiTheme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: 'light',
          primary: selectedTheme.primary,
          secondary: {
            main: '#dc004e',
          },
        },
      }),
    [selectedTheme]
  )

  const value = {
    themeName,
    setThemeName,
    themes,
    muiTheme,
  }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

