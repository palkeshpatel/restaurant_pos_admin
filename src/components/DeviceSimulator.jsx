'use client'

import { Box } from '@mui/material'

export const TABLET_PRESETS = {
  'ipad': {
    name: 'iPad',
    width: 768,
    height: 1024,
    borderRadius: 24,
    screenPadding: { top: 16, left: 16, right: 16, bottom: 16 },
    camera: { width: 140, height: 25, top: 15, isNotch: true },
    homeButton: { width: 120, height: 4, bottom: 8, isIndicator: true },
  },
  'ipad-pro': {
    name: 'iPad Pro',
    width: 1024,
    height: 1366,
    borderRadius: 32,
    screenPadding: { top: 20, left: 20, right: 20, bottom: 20 },
    camera: { width: 180, height: 30, top: 20, isNotch: true },
    homeButton: { width: 150, height: 5, bottom: 12, isIndicator: true },
  },
  'tablet-large': {
    name: 'Large Tablet',
    width: 800,
    height: 1100,
    borderRadius: 32,
    screenPadding: { top: 18, left: 18, right: 18, bottom: 18 },
    camera: { width: 180, height: 30, top: 20, isNotch: true },
    homeButton: { width: 150, height: 5, bottom: 12, isIndicator: true },
  },
  'tablet-medium': {
    name: 'Medium Tablet',
    width: 600,
    height: 800,
    borderRadius: 24,
    screenPadding: { top: 14, left: 14, right: 14, bottom: 14 },
    camera: { width: 140, height: 25, top: 15, isNotch: true },
    homeButton: { width: 120, height: 4, bottom: 8, isIndicator: true },
  },
  'tablet-small': {
    name: 'Small Tablet',
    width: 480,
    height: 640,
    borderRadius: 20,
    screenPadding: { top: 12, left: 12, right: 12, bottom: 12 },
    camera: { width: 100, height: 20, top: 12, isNotch: true },
    homeButton: { width: 100, height: 3, bottom: 6, isIndicator: true },
  },
}

export default function DeviceSimulator({ children, viewMode = 'desktop', tabletSize = 'tablet-large' }) {
  const device = TABLET_PRESETS[tabletSize] || TABLET_PRESETS['tablet-large']

  if (viewMode === 'desktop') {
    return <Box sx={{ width: '100%', height: '100%' }}>{children}</Box>
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100%',
        bgcolor: 'linear-gradient(45deg, #1a1a2e, #16213e)',
        background: 'linear-gradient(45deg, #1a1a2e, #16213e)',
        p: 3,
        position: 'relative',
      }}
    >

      {/* Device Frame */}
      <Box
        sx={{
          width: device.width,
          height: device.height,
          background: '#000',
          borderRadius: `${device.borderRadius}px`,
          position: 'relative',
          boxShadow: `
            0 0 0 8px #222,
            0 0 0 10px #333,
            0 0 0 12px #444,
            0 20px 40px rgba(0, 0, 0, 0.8),
            inset 0 0 20px rgba(255, 255, 255, 0.05)
          `,
          overflow: 'hidden',
        }}
      >
        {/* Metal Frame Effect */}
        <Box
          sx={{
            position: 'absolute',
            top: '8px',
            left: '8px',
            right: '8px',
            bottom: '8px',
            borderRadius: `${device.borderRadius - 6}px`,
            background: 'linear-gradient(145deg, #0a0a0a, #1a1a1a)',
            zIndex: 1,
            pointerEvents: 'none',
          }}
        />


        {/* Camera Notch (Tablet) */}
        {device.camera?.isNotch && (
          <Box
            sx={{
              width: device.camera.width,
              height: device.camera.height,
              background: '#111',
              borderRadius: '0 0 15px 15px',
              position: 'absolute',
              top: `${device.camera.top}px`,
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 3,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <Box
              sx={{
                width: '10px',
                height: '10px',
                background: '#333',
                borderRadius: '50%',
              }}
            />
            <Box
              sx={{
                width: '18px',
                height: '18px',
                background: '#222',
                border: '2px solid #444',
                borderRadius: '50%',
              }}
            />
            <Box
              sx={{
                width: '10px',
                height: '10px',
                background: '#333',
                borderRadius: '50%',
              }}
            />
          </Box>
        )}


        {/* Physical Buttons - Tablet */}
        {viewMode === 'tablet' && (
          <>
            {/* Power Button */}
            <Box
              sx={{
                position: 'absolute',
                right: '-4px',
                top: '150px',
                width: '4px',
                height: '60px',
                background: '#555',
                borderRadius: '0 2px 2px 0',
                zIndex: 1,
              }}
            />
            {/* Volume Buttons */}
            <Box
              sx={{
                position: 'absolute',
                left: '-4px',
                top: '150px',
                height: '100px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                zIndex: 1,
              }}
            >
              <Box
                sx={{
                  width: '4px',
                  height: '30px',
                  background: '#555',
                  borderRadius: '2px 0 0 2px',
                }}
              />
              <Box
                sx={{
                  width: '4px',
                  height: '30px',
                  background: '#555',
                  borderRadius: '2px 0 0 2px',
                }}
              />
            </Box>
          </>
        )}



        {/* Home Button / Indicator */}
        {device.homeButton && (
          <Box
            sx={{
              width: device.homeButton.width,
              height: device.homeButton.height,
              ...(device.homeButton.isIndicator
                ? {
                    background: 'rgba(255, 255, 255, 0.8)',
                    borderRadius: '2px',
                  }
                : {
                    border: '4px solid #333',
                    borderRadius: '50%',
                    background: 'transparent',
                  }),
              position: 'absolute',
              bottom: `${device.homeButton.bottom}px`,
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 3,
            }}
          />
        )}

        {/* Screen Area - Where Canvas Content Goes */}
        <Box
          sx={{
            position: 'absolute',
            top: `${device.screenPadding.top}px`,
            left: `${device.screenPadding.left}px`,
            right: `${device.screenPadding.right}px`,
            bottom: `${device.screenPadding.bottom}px`,
            background: '#000',
            borderRadius: '12px',
            overflow: 'auto',
            zIndex: 2,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  )
}

