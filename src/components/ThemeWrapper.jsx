'use client'

import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { useThemeContext } from '../contexts/ThemeContext'

export default function ThemeWrapper({ children }) {
  const { muiTheme } = useThemeContext()

  return (
    <MuiThemeProvider theme={muiTheme}>
      <CssBaseline />
      {children}
    </MuiThemeProvider>
  )
}

