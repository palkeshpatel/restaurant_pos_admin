'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Box,
  Button,
  IconButton,
  Typography,
  CircularProgress,
  Alert,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Tooltip,
  Paper,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Switch,
  FormControlLabel,
  Divider,
  Snackbar,
} from '@mui/material'
import {
  Close as CloseIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  CloudUpload as CloudUploadIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  ZoomOutMap as ZoomOutMapIcon,
  GridOn as GridOnIcon,
  GridOff as GridOffIcon,
  ContentCopy as ContentCopyIcon,
  DeleteOutline as DeleteOutlineIcon,
} from '@mui/icons-material'
import api from '../services/api'

const TABLE_SIZES = {
  small: { width: 50, height: 50 },
  medium: { width: 70, height: 70 },
  large: { width: 90, height: 90 },
}


export default function FloorPlanEditor({ open, onClose, floor, onSave }) {
  const [tables, setTables] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedTable, setSelectedTable] = useState(null)
  const [backgroundImageUrl, setBackgroundImageUrl] = useState(null)
  const [imageLoading, setImageLoading] = useState(false)
  const [showAddTableDialog, setShowAddTableDialog] = useState(false)
  const [showEditTableDialog, setShowEditTableDialog] = useState(false)
  const [showDeleteBackgroundDialog, setShowDeleteBackgroundDialog] = useState(false)
  const [showDeleteTableDialog, setShowDeleteTableDialog] = useState(false)
  const [tableToDelete, setTableToDelete] = useState(null)
  const [newTableData, setNewTableData] = useState({
    name: '',
    size: 'medium',
    capacity: 4,
  })
  const [editTableData, setEditTableData] = useState({
    id: null,
    name: '',
    size: 'medium',
    capacity: 4,
  })
  const [draggingTable, setDraggingTable] = useState(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(100)
  const [showGrid, setShowGrid] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [showSuccessSnackbar, setShowSuccessSnackbar] = useState(false)
  const canvasRef = useRef(null)
  const backgroundImageRef = useRef(null)
  const imageKeyRef = useRef(0)
  
  // Fixed canvas dimensions - not based on image
  const CANVAS_WIDTH = 800
  const CANVAS_HEIGHT = 1200

  // Load floor data and tables
  useEffect(() => {
    if (open && floor) {
      loadFloorData()
    }
  }, [open, floor])

  const loadFloorData = async () => {
    if (!floor) return

    setLoading(true)
    setError('')
    try {
      // Load floor with background image
      const floorResponse = await api.get(`/admin/floors/${floor.id}`)
      const floorData = floorResponse.data.data

      if (floorData.background_image_url) {
        let imageUrl = floorData.background_image_url
        if (!imageUrl.startsWith('http')) {
          const baseUrl = api.defaults.baseURL.replace('/api', '')
          imageUrl = baseUrl + (imageUrl.startsWith('/') ? imageUrl : '/' + imageUrl)
        }
        setBackgroundImageUrl(imageUrl)
      } else {
        setBackgroundImageUrl(null)
      }

      // Load tables for this floor
      const tablesResponse = await api.get('/admin/tables', {
        params: { per_page: 1000 },
      })
      const allTables = tablesResponse.data.data?.data || tablesResponse.data.data || []
      const floorTables = allTables.filter((t) => String(t.floor_id) === String(floor.id))
      setTables(floorTables)
    } catch (err) {
      console.error('Error loading floor data:', err)
      setError(err.response?.data?.message || 'Failed to load floor data')
    } finally {
      setLoading(false)
    }
  }

  // Handle background image load - just store reference, no scaling
  const handleImageLoad = (e) => {
    backgroundImageRef.current = e.target
  }

  // Handle background image upload - accepts any image type
  const handleImageUpload = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    // Basic check - accept any file that browser recognizes as image
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (PNG, JPG, GIF, WEBP, etc.)')
      return
    }

    // Check file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      setError('Image file is too large. Maximum size is 10MB.')
      return
    }

    setImageLoading(true)
    setError('')

    try {
      const formData = new FormData()
      formData.append('background_image', file)

      const uploadResponse = await api.post(`/admin/floors/${floor.id}/background`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      const imageUrl = uploadResponse.data.data?.background_image_url || uploadResponse.data.background_image_url
      if (imageUrl) {
        // Force image reload by adding a key/timestamp to the URL
        const timestamp = new Date().getTime()
        const urlWithKey = `${imageUrl}${imageUrl.includes('?') ? '&' : '?'}t=${timestamp}`
        imageKeyRef.current += 1
        setBackgroundImageUrl(urlWithKey)
      }
    } catch (err) {
      console.error('Error uploading image:', err)
      setError(err.response?.data?.message || 'Failed to upload image. Please try again.')
    } finally {
      setImageLoading(false)
      // Reset file input
      event.target.value = ''
    }
  }


  const saveTablePosition = useCallback(async (tableId, x, y) => {
    try {
      await api.put(`/admin/tables/${tableId}`, {
        x_coordinates: Math.round(x),
        y_coordinates: Math.round(y),
      })
      // Update local state and get table name for success message
      let tableName = 'Table'
      setTables((prev) => {
        const updated = prev.map((t) => {
          if (t.id === tableId) {
            tableName = t.name
            return { ...t, x_coordinates: x, y_coordinates: y }
          }
          return t
        })
        return updated
      })
      // Show success message
      setSuccessMessage(`Table "${tableName}" position updated successfully`)
      setShowSuccessSnackbar(true)
    } catch (err) {
      console.error('Error saving table position:', err)
      setError(err.response?.data?.message || 'Failed to save table position')
    }
  }, [])

  // Handle double click on table (open edit dialog)
  const handleTableDoubleClick = (e, table) => {
    e.preventDefault()
    e.stopPropagation()
    
    setEditTableData({
      id: table.id,
      name: table.name,
      size: table.size,
      capacity: table.capacity,
    })
    setShowEditTableDialog(true)
    setSelectedTable(table)
  }

  // Handle mouse down on table (start drag)
  const handleTableMouseDown = (e, table) => {
    e.preventDefault()
    e.stopPropagation()
    
    const canvasArea = canvasRef.current?.querySelector('.canvas-area')
    if (!canvasArea) return

    const rect = canvasArea.getBoundingClientRect()
    const canvasX = e.clientX - rect.left
    const canvasY = e.clientY - rect.top

    // Get current stored position of the table
    const storedX = table.x_coordinates || 0
    const storedY = table.y_coordinates || 0

    // Calculate offset from mouse to table position
    const offsetX = canvasX - storedX
    const offsetY = canvasY - storedY

    setDraggingTable(table)
    setDragOffset({ x: offsetX, y: offsetY })
    setSelectedTable(table)
  }

  // Handle mouse move (during drag)
  useEffect(() => {
    if (!draggingTable) return

    const handleMouseMove = (e) => {
      const canvasArea = canvasRef.current?.querySelector('.canvas-area')
      if (!canvasArea || !draggingTable) return

      const rect = canvasArea.getBoundingClientRect()
      const canvasX = e.clientX - rect.left
      const canvasY = e.clientY - rect.top

      const tableSize = TABLE_SIZES[draggingTable.size] || TABLE_SIZES.medium
      const tableWidth = tableSize.width
      const tableHeight = tableSize.height

      // Calculate new position directly in canvas coordinates
      let newX = canvasX - dragOffset.x
      let newY = canvasY - dragOffset.y

      // Constrain within fixed canvas boundaries
      const maxX = Math.max(0, CANVAS_WIDTH - tableWidth)
      const maxY = Math.max(0, CANVAS_HEIGHT - tableHeight)
      
      newX = Math.max(0, Math.min(newX, maxX))
      newY = Math.max(0, Math.min(newY, maxY))

      // Update table position in state immediately for smooth dragging
      setTables((prev) =>
        prev.map((t) =>
          t.id === draggingTable.id
            ? { ...t, x_coordinates: Math.round(newX), y_coordinates: Math.round(newY) }
            : t
        )
      )
    }

    const handleMouseUp = (e) => {
      if (!draggingTable) return

      const canvasArea = canvasRef.current?.querySelector('.canvas-area')
      if (canvasArea) {
        const rect = canvasArea.getBoundingClientRect()
        const canvasX = e.clientX - rect.left
        const canvasY = e.clientY - rect.top

        const tableSize = TABLE_SIZES[draggingTable.size] || TABLE_SIZES.medium
        const tableWidth = tableSize.width
        const tableHeight = tableSize.height

        // Calculate new position directly in canvas coordinates
        let newX = canvasX - dragOffset.x
        let newY = canvasY - dragOffset.y

        // Constrain within fixed canvas boundaries
        const maxX = Math.max(0, CANVAS_WIDTH - tableWidth)
        const maxY = Math.max(0, CANVAS_HEIGHT - tableHeight)
        
        newX = Math.max(0, Math.min(newX, maxX))
        newY = Math.max(0, Math.min(newY, maxY))

        // Save to backend - round coordinates to integers
        saveTablePosition(draggingTable.id, Math.round(newX), Math.round(newY))
      }

      setDraggingTable(null)
      setDragOffset({ x: 0, y: 0 })
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [draggingTable, dragOffset, saveTablePosition])

  const handleAddTable = async () => {
    if (!newTableData.name) {
      setError('Please enter table name')
      return
    }

    try {
      const tableSize = TABLE_SIZES[newTableData.size] || TABLE_SIZES.medium
      const x = 100
      const y = 100

      const response = await api.post('/admin/tables', {
        floor_id: floor.id,
        name: newTableData.name,
        size: newTableData.size,
        capacity: newTableData.capacity,
        status: 'available',
        x_coordinates: Math.round(x),
        y_coordinates: Math.round(y),
      })

      const newTable = response.data.data
      setTables((prev) => [...prev, newTable])
      setShowAddTableDialog(false)
      setNewTableData({ name: '', size: 'medium', capacity: 4 })
      setSuccessMessage(`Table "${newTable.name}" added successfully`)
      setShowSuccessSnackbar(true)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add table')
    }
  }

  const handleUpdateTable = async () => {
    if (!editTableData.name) {
      setError('Please enter table name')
      return
    }

    try {
      const response = await api.put(`/admin/tables/${editTableData.id}`, {
        name: editTableData.name,
        size: editTableData.size,
        capacity: editTableData.capacity,
      })

      setTables((prev) =>
        prev.map((t) => (t.id === editTableData.id ? response.data.data : t))
      )
      setSelectedTable(response.data.data)
      setShowEditTableDialog(false)
      setSuccessMessage(`Table "${editTableData.name}" updated successfully`)
      setShowSuccessSnackbar(true)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update table')
    }
  }

  const handleDeleteTable = async (tableId) => {
    try {
      await api.delete(`/admin/tables/${tableId}`)
      setTables((prev) => prev.filter((t) => t.id !== tableId))
      setSelectedTable(null)
      setShowDeleteTableDialog(false)
      setTableToDelete(null)
      setSuccessMessage('Table deleted successfully')
      setShowSuccessSnackbar(true)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete table')
      setShowDeleteTableDialog(false)
      setTableToDelete(null)
    }
  }

  const handleDeleteTableClick = (tableId) => {
    setTableToDelete(tableId)
    setShowDeleteTableDialog(true)
  }

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 10, 200))
  }

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 10, 50))
  }

  const handleResetZoom = () => {
    setZoom(100)
  }

  const handleDuplicateTable = async () => {
    if (!selectedTable) return

    try {
      const response = await api.post('/admin/tables', {
        name: `${selectedTable.name} (Copy)`,
        size: selectedTable.size,
        capacity: selectedTable.capacity,
        floor_id: floor.id,
        x_coordinates: Math.round((selectedTable.x_coordinates || 0) + 50),
        y_coordinates: Math.round((selectedTable.y_coordinates || 0) + 50),
      })
      setTables((prev) => [...prev, response.data.data])
      setSelectedTable(response.data.data)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to duplicate table')
    }
  }

  const handleRemoveBackground = async () => {
    try {
      await api.delete(`/admin/floors/${floor.id}/background-image`)
      setBackgroundImageUrl(null)
      imageKeyRef.current += 1
      setShowDeleteBackgroundDialog(false)
      setSuccessMessage('Background image removed successfully')
      setShowSuccessSnackbar(true)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to remove background image')
      setShowDeleteBackgroundDialog(false)
    }
  }



  if (!open || !floor) return null

  return (
    <Box
      sx={{
        width: '100%',
        mt: 3,
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        overflow: 'hidden',
        bgcolor: 'background.paper',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 2,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          bgcolor: 'primary.main',
          color: 'primary.contrastText',
        }}
      >
        <Typography variant="h5" fontWeight="bold">
          Design Floor Plan: {floor.name}
        </Typography>
        <IconButton onClick={onClose} sx={{ color: 'inherit' }}>
            <CloseIcon />
          </IconButton>
        </Box>

      {/* Content */}
      <Box sx={{ position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {error && (
          <Alert severity="error" sx={{ m: 2, zIndex: 1001 }}>
            {error}
          </Alert>
        )}

        {/* Top Toolbar */}
        <Paper
          sx={{
            p: 1.5,
            display: 'flex',
            flexDirection: 'row',
            gap: 1.5,
            alignItems: 'center',
            flexWrap: 'wrap',
            bgcolor: 'rgba(255, 255, 255, 0.98)',
            borderBottom: '1px solid',
            borderColor: 'divider',
            position: 'sticky',
            top: 0,
            zIndex: 1000,
          }}
        >
          <input
            accept="image/*"
            style={{ display: 'none' }}
            id="background-image-upload"
            type="file"
            onChange={handleImageUpload}
            key={`upload-input-${imageKeyRef.current}`}
          />
          <label htmlFor="background-image-upload">
            <Button
              component="span"
              variant="contained"
              size="small"
              startIcon={imageLoading ? <CircularProgress size={16} color="inherit" /> : <CloudUploadIcon />}
              disabled={imageLoading || loading}
            >
              {imageLoading ? 'Uploading...' : 'Upload Background'}
            </Button>
          </label>

          <Button
            variant="contained"
            color="primary"
            size="small"
            startIcon={<AddIcon />}
            onClick={() => setShowAddTableDialog(true)}
            disabled={!backgroundImageUrl || loading}
          >
            Add Table
          </Button>

          <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

          {/* Zoom Controls */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Tooltip title="Zoom Out">
              <IconButton size="small" onClick={handleZoomOut} disabled={zoom <= 50}>
                <ZoomOutIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Typography variant="caption" sx={{ minWidth: 45, textAlign: 'center' }}>
              {zoom}%
            </Typography>
            <Tooltip title="Zoom In">
              <IconButton size="small" onClick={handleZoomIn} disabled={zoom >= 200}>
                <ZoomInIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Reset Zoom">
              <IconButton size="small" onClick={handleResetZoom}>
                <ZoomOutMapIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>

          <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

          {/* View Options */}
          <FormControlLabel
            control={
              <Switch
                size="small"
                checked={showGrid}
                onChange={(e) => setShowGrid(e.target.checked)}
              />
            }
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                {showGrid ? <GridOnIcon fontSize="small" /> : <GridOffIcon fontSize="small" />}
                <Typography variant="caption">Grid</Typography>
              </Box>
            }
            sx={{ m: 0 }}
          />
          {backgroundImageUrl && (
            <Button
              variant="outlined"
              color="error"
              size="small"
              startIcon={<DeleteOutlineIcon />}
              onClick={() => setShowDeleteBackgroundDialog(true)}
            >
              Remove Background
            </Button>
          )}

          <Box sx={{ flex: 1 }} />

          {/* Table Actions */}
          {selectedTable && (
            <>
              <Button
                variant="outlined"
                  size="small"
                startIcon={<ContentCopyIcon />}
                onClick={handleDuplicateTable}
              >
                Duplicate
              </Button>
              <Button
                variant="outlined"
                  color="error"
                size="small"
                startIcon={<DeleteIcon />}
                  onClick={() => handleDeleteTableClick(selectedTable.id)}
                >
                Delete
              </Button>
            </>
          )}

          {backgroundImageUrl && (
            <Chip
              label={`${tables.length} Table${tables.length !== 1 ? 's' : ''}`}
              size="small"
              variant="outlined"
            />
          )}

          {selectedTable && (
            <Chip
              label={`Selected: ${selectedTable.name} (${selectedTable.capacity} seats)`}
              color="primary"
              onDelete={() => setSelectedTable(null)}
            />
          )}
        </Paper>

        {/* Canvas Area */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', height: 'calc(100vh - 300px)' }}>
        {/* Floor Plan Canvas Area */}
        <Box
          ref={canvasRef}
          sx={{
            width: '100%',
              flex: 1,
            overflow: 'auto',
            position: 'relative',
            bgcolor: '#f5f5f5',
            padding: '20px',
            cursor: draggingTable ? 'grabbing' : 'default',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-start',
              minHeight: '400px',
          }}
        >
          {loading ? (
            <Box
              display="flex"
              justifyContent="center"
              alignItems="center"
              height="100%"
              width="100%"
            >
              <CircularProgress />
            </Box>
          ) : (
            <Box
                  className="canvas-area"
              sx={{
                position: 'relative',
                    width: `${CANVAS_WIDTH}px`,
                    height: `${CANVAS_HEIGHT}px`,
                    backgroundColor: '#f0f0f0',
                    border: '2px solid #ddd',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    margin: '0 auto',
                    transform: `scale(${zoom / 100})`,
                    transformOrigin: 'top center',
                    backgroundImage: showGrid
                      ? `linear-gradient(to right, rgba(0,0,0,0.1) 1px, transparent 1px),
                         linear-gradient(to bottom, rgba(0,0,0,0.1) 1px, transparent 1px)`
                      : 'none',
                    backgroundSize: showGrid ? '20px 20px' : 'auto',
              }}
            >
                {/* Background Image - Just visual layer, doesn't affect coordinates */}
              {backgroundImageUrl && (
                <img
                      key={`floor-image-${imageKeyRef.current}`}
                  ref={backgroundImageRef}
                  src={backgroundImageUrl}
                  alt="Floor background"
                  onLoad={handleImageLoad}
                  style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                    width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                    userSelect: 'none',
                    pointerEvents: 'none',
                  }}
                />
              )}

                {/* Render Tables as Draggable Elements - Fixed coordinates */}
              {tables.map((table) => {
                const tableSize = TABLE_SIZES[table.size] || TABLE_SIZES.medium
                const storedX = table.x_coordinates || 0
                const storedY = table.y_coordinates || 0
                
                const isSelected = selectedTable?.id === table.id
                const isDragging = draggingTable?.id === table.id

                  // Constrain within fixed canvas boundaries
                  const maxX = Math.max(0, CANVAS_WIDTH - tableSize.width)
                  const maxY = Math.max(0, CANVAS_HEIGHT - tableSize.height)
                  const constrainedX = Math.max(0, Math.min(storedX, maxX))
                  const constrainedY = Math.max(0, Math.min(storedY, maxY))

                return (
                  <Box
                    key={table.id}
                    onMouseDown={(e) => handleTableMouseDown(e, table)}
                    onDoubleClick={(e) => handleTableDoubleClick(e, table)}
                    sx={{
                      position: 'absolute',
                      left: `${constrainedX}px`,
                      top: `${constrainedY}px`,
                      width: `${tableSize.width}px`,
                      height: `${tableSize.height}px`,
                      backgroundColor: '#ffffff',
                      border: isSelected
                        ? '3px solid #000'
                        : '2px solid rgba(0,0,0,0.3)',
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'grab',
                      userSelect: 'none',
                      boxShadow: isSelected
                        ? '0 4px 8px rgba(0,0,0,0.4)'
                        : '0 2px 4px rgba(0,0,0,0.2)',
                      transition: isDragging ? 'none' : 'box-shadow 0.2s, left 0.1s, top 0.1s',
                      zIndex: isSelected ? 10 : 1,
                      '&:hover': {
                        boxShadow: '0 4px 8px rgba(0,0,0,0.4)',
                        transform: 'scale(1.1)',
                      },
                      transform: isDragging ? 'scale(1.15)' : 'scale(1)',
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{
                        color: '#000000',
                        fontWeight: 'bold',
                        fontSize: table.size === 'small' ? '0.7rem' : table.size === 'large' ? '0.9rem' : '0.8rem',
                      }}
                    >
                      {table.name}
                    </Typography>
                  </Box>
                )
              })}

              {/* Empty State */}
              {!backgroundImageUrl && !loading && (
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '400px',
                    color: 'text.secondary',
                  }}
                >
                  <CloudUploadIcon sx={{ fontSize: 64, mb: 2, opacity: 0.5 }} />
                  <Typography variant="h6" gutterBottom>
                    Upload a background image to start designing
                  </Typography>
                  <Typography variant="body2">
                    Click "Upload Background" button above to add a floor plan image
                  </Typography>
                </Box>
              )}
            </Box>
          )}
        </Box>

        {/* Instructions */}
        <Paper sx={{ p: 1.5, m: 1.5, bgcolor: 'info.light', color: 'info.contrastText' }}>
          <Typography variant="caption" component="div">
            <strong>💡 Instructions:</strong> Upload a background image, then add tables. Click and drag tables to position them on the floor plan. Coordinates are automatically saved when you release the mouse.
          </Typography>
        </Paper>
        </Box>
      </Box>

      {/* Add Table Dialog */}
      <Dialog open={showAddTableDialog} onClose={() => setShowAddTableDialog(false)}>
        <DialogTitle>Add New Table</DialogTitle>
        <DialogContent>
          <TextField
            margin="dense"
            label="Table Name"
            fullWidth
            value={newTableData.name}
            onChange={(e) => setNewTableData({ ...newTableData, name: e.target.value })}
            sx={{ mb: 2, mt: 2 }}
          />
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Size</InputLabel>
            <Select
              value={newTableData.size}
              onChange={(e) => setNewTableData({ ...newTableData, size: e.target.value })}
              label="Size"
            >
              <MenuItem value="small">Small</MenuItem>
              <MenuItem value="medium">Medium</MenuItem>
              <MenuItem value="large">Large</MenuItem>
            </Select>
          </FormControl>
          <TextField
            margin="dense"
            label="Capacity"
            type="number"
            fullWidth
            value={newTableData.capacity}
            onChange={(e) =>
              setNewTableData({ ...newTableData, capacity: parseInt(e.target.value) || 4 })
            }
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAddTableDialog(false)}>Cancel</Button>
          <Button onClick={handleAddTable} variant="contained">
            Add
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Table Dialog */}
      <Dialog open={showEditTableDialog} onClose={() => setShowEditTableDialog(false)}>
        <DialogTitle>Edit Table</DialogTitle>
        <DialogContent>
          <TextField
            margin="dense"
            label="Table Name"
            fullWidth
            value={editTableData.name}
            onChange={(e) => setEditTableData({ ...editTableData, name: e.target.value })}
            sx={{ mb: 2, mt: 2 }}
          />
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Size</InputLabel>
            <Select
              value={editTableData.size}
              onChange={(e) => setEditTableData({ ...editTableData, size: e.target.value })}
              label="Size"
            >
              <MenuItem value="small">Small</MenuItem>
              <MenuItem value="medium">Medium</MenuItem>
              <MenuItem value="large">Large</MenuItem>
            </Select>
          </FormControl>
          <TextField
            margin="dense"
            label="Capacity"
            type="number"
            fullWidth
            value={editTableData.capacity}
            onChange={(e) =>
              setEditTableData({ ...editTableData, capacity: parseInt(e.target.value) || 4 })
            }
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowEditTableDialog(false)}>Cancel</Button>
          <Button onClick={handleUpdateTable} variant="contained">
            Update
          </Button>
        </DialogActions>
    </Dialog>

      {/* Delete Background Confirmation Dialog */}
      <Dialog open={showDeleteBackgroundDialog} onClose={() => setShowDeleteBackgroundDialog(false)}>
        <DialogTitle>Remove Background Image</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to remove the background image? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDeleteBackgroundDialog(false)}>Cancel</Button>
          <Button onClick={handleRemoveBackground} variant="contained" color="error">
            Remove
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Table Confirmation Dialog */}
      <Dialog open={showDeleteTableDialog} onClose={() => setShowDeleteTableDialog(false)}>
        <DialogTitle>Delete Table</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this table? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDeleteTableDialog(false)}>Cancel</Button>
          <Button 
            onClick={() => tableToDelete && handleDeleteTable(tableToDelete)} 
            variant="contained" 
            color="error"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success Snackbar */}
      <Snackbar
        open={showSuccessSnackbar}
        autoHideDuration={3000}
        onClose={() => setShowSuccessSnackbar(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setShowSuccessSnackbar(false)}
          severity="success"
          sx={{ width: '100%' }}
        >
          {successMessage}
        </Alert>
      </Snackbar>
    </Box>
  )
}

