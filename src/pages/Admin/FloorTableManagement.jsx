'use client'

import { useState, useEffect, useRef } from 'react'

// Force dynamic rendering - prevent static generation
export async function getServerSideProps() {
  return {
    props: {},
  }
}
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  Chip,
  Collapse,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Paper,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  ExpandMore,
  ExpandLess,
  Business as BusinessIcon,
  TableRestaurant as TableIcon,
  DesignServices as DesignIcon,
} from '@mui/icons-material'
import api from '../../services/api'
import FloorPlanEditor from '../../components/FloorPlanEditor'

export default function FloorTableManagement() {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const [floors, setFloors] = useState([])
  const [tables, setTables] = useState([])
  const [loading, setLoading] = useState(false)
  const [expandedFloors, setExpandedFloors] = useState({})
  const [openDialog, setOpenDialog] = useState(false)
  const [dialogType, setDialogType] = useState(null) // 'floor' or 'table'
  const [editingItem, setEditingItem] = useState(null)
  const [formData, setFormData] = useState({})
  const [error, setError] = useState('')

  const isMountedRef = useRef(true)
  const fetchInProgressRef = useRef(false)

  useEffect(() => {
    isMountedRef.current = true
    fetchAllData()
    return () => {
      isMountedRef.current = false
    }
  }, [])

  const fetchAllData = async () => {
    if (fetchInProgressRef.current) return
    fetchInProgressRef.current = true
    setLoading(true)
    try {
      const [floorsRes, tablesRes] = await Promise.all([
        api.get('/admin/floors', { params: { per_page: 1000 } }).catch(() => ({ data: { data: { data: [] } } })),
        api.get('/admin/tables', { params: { per_page: 1000 } }).catch(() => ({ data: { data: { data: [] } } })),
      ])

      if (isMountedRef.current) {
        // Handle paginated responses
        const floorsData = floorsRes.data.data?.data || floorsRes.data.data || []
        const tablesData = tablesRes.data.data?.data || tablesRes.data.data || []

        setFloors(Array.isArray(floorsData) ? floorsData : [])
        setTables(Array.isArray(tablesData) ? tablesData : [])
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      setError('Failed to fetch data.')
    } finally {
      fetchInProgressRef.current = false
      if (isMountedRef.current) {
        setLoading(false)
      }
    }
  }

  const toggleFloor = (floorId) => {
    setExpandedFloors((prev) => ({
      ...prev,
      [floorId]: !prev[floorId],
    }))
  }

  const getTablesForFloor = (floorId) => {
    if (!Array.isArray(tables)) return []
    return tables.filter((table) => String(table.floor_id) === String(floorId))
  }

  const handleOpenDialog = (type, item = null, parentData = {}) => {
    setDialogType(type)
    setEditingItem(item)
    setError('')

    if (type === 'floor') {
      setFormData(
        item
          ? { ...item }
          : { name: '', floor_type: 'indoor', width_px: 800, height_px: 600 }
      )
    } else if (type === 'table') {
      setFormData(
        item
          ? { ...item }
          : {
              floor_id: parentData.floorId || '',
              name: '',
              size: 'medium',
              capacity: 4,
              status: 'available',
            }
      )
    }

    setOpenDialog(true)
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
    setDialogType(null)
    setEditingItem(null)
    setFormData({})
    setError('')
  }

  const handleSubmit = async () => {
    setError('')
    try {
      let endpoint = ''
      let method = 'POST'
      let payload = { ...formData }

      const isEditMode = editingItem && dialogType !== null

      if (dialogType === 'floor') {
        endpoint = isEditMode ? `/admin/floors/${editingItem.id}` : '/admin/floors'
        method = isEditMode ? 'PUT' : 'POST'
      } else if (dialogType === 'table') {
        endpoint = isEditMode ? `/admin/tables/${editingItem.id}` : '/admin/tables'
        method = isEditMode ? 'PUT' : 'POST'
      }

      let response
      if (method === 'PUT') {
        response = await api.put(endpoint, payload)
      } else {
        response = await api.post(endpoint, payload)
      }

      handleCloseDialog()
      fetchAllData()
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred')
    }
  }

  const handleDelete = async (type, id) => {
    if (!window.confirm(`Are you sure you want to delete this ${type}?`)) return

    try {
      let endpoint = ''
      if (type === 'floor') endpoint = `/admin/floors/${id}`
      else if (type === 'table') endpoint = `/admin/tables/${id}`

      await api.delete(endpoint)
      fetchAllData()
    } catch (error) {
      console.error('Error deleting:', error)
      alert('Failed to delete')
    }
  }

  const renderFloorTree = () => {
    if (loading) {
      return (
        <Box display="flex" justifyContent="center" p={3}>
          <CircularProgress />
        </Box>
      )
    }

    if (!Array.isArray(floors) || floors.length === 0) {
      return (
        <Card>
          <CardContent>
            <Typography variant="body1" color="text.secondary" align="center" py={3}>
              No floors found. Create your first floor to get started!
            </Typography>
            <Box display="flex" justifyContent="center">
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => handleOpenDialog('floor')}
              >
                Add Floor
              </Button>
            </Box>
          </CardContent>
        </Card>
      )
    }

    return floors.map((floor) => {
      const floorTables = getTablesForFloor(floor.id)
      const isExpanded = expandedFloors[floor.id]

      return (
        <Card key={floor.id} sx={{ mb: 2 }}>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Box display="flex" alignItems="center" gap={1} flex={1}>
                <IconButton size="small" onClick={() => toggleFloor(floor.id)}>
                  {isExpanded ? <ExpandLess /> : <ExpandMore />}
                </IconButton>
                <BusinessIcon color="primary" />
                <Typography variant="h6">{floor.name}</Typography>
                <Chip
                  label={floor.floor_type}
                  size="small"
                  color={floor.floor_type === 'outdoor' ? 'success' : 'primary'}
                  variant="outlined"
                />
                {floorTables.length > 0 && (
                  <Chip
                    label={`${floorTables.length} tables`}
                    size="small"
                    variant="outlined"
                  />
                )}
              </Box>
              <Box>
                <IconButton size="small" onClick={() => handleOpenDialog('floor', floor)}>
                  <EditIcon />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={() => handleDelete('floor', floor.id)}
                  color="error"
                >
                  <DeleteIcon />
                </IconButton>
                <Button
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={() => handleOpenDialog('table', null, { floorId: floor.id })}
                  sx={{ ml: 1 }}
                  variant="outlined"
                >
                  Add Table
                </Button>
              </Box>
            </Box>

            <Collapse in={isExpanded}>
              <Box sx={{ mt: 2 }}>
                <FloorPlanEditor
                  open={isExpanded}
                  onClose={() => toggleFloor(floor.id)}
                  floor={floor}
                  onSave={(type, data) => {
                    if (type === 'tables' || type === 'floor') {
                      fetchAllData()
                    }
                  }}
                />
              </Box>
            </Collapse>
          </CardContent>
        </Card>
      )
    })
  }

  const renderDialog = () => {
    const getTitle = () => {
      const action = editingItem ? 'Edit' : 'Add'
      const typeMap = {
        floor: 'Floor',
        table: 'Table',
      }
      return `${action} ${typeMap[dialogType]}`
    }

    return (
      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog} 
        maxWidth="sm" 
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle>{getTitle()}</DialogTitle>
        <DialogContent sx={{ pt: { xs: 2, sm: 3 } }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {dialogType === 'floor' && (
            <>
              <TextField
                margin="dense"
                label="Floor Name"
                fullWidth
                variant="outlined"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                sx={{ mb: 2 }}
              />
              <FormControl fullWidth margin="dense" sx={{ mb: 2 }}>
                <InputLabel>Floor Type</InputLabel>
                <Select
                  value={formData.floor_type || 'indoor'}
                  onChange={(e) => setFormData({ ...formData, floor_type: e.target.value })}
                  label="Floor Type"
                >
                  <MenuItem value="indoor">Indoor</MenuItem>
                  <MenuItem value="outdoor">Outdoor</MenuItem>
                  <MenuItem value="bar">Bar</MenuItem>
                </Select>
              </FormControl>
              <TextField
                margin="dense"
                label="Width (px)"
                type="number"
                fullWidth
                variant="outlined"
                value={formData.width_px || 800}
                onChange={(e) =>
                  setFormData({ ...formData, width_px: parseInt(e.target.value) || 800 })
                }
                sx={{ mb: 2 }}
              />
              <TextField
                margin="dense"
                label="Height (px)"
                type="number"
                fullWidth
                variant="outlined"
                value={formData.height_px || 600}
                onChange={(e) =>
                  setFormData({ ...formData, height_px: parseInt(e.target.value) || 600 })
                }
              />
            </>
          )}

          {dialogType === 'table' && (
            <>
              <FormControl fullWidth margin="dense" sx={{ mb: 2 }}>
                <InputLabel>Floor</InputLabel>
                <Select
                  value={formData.floor_id || ''}
                  onChange={(e) => setFormData({ ...formData, floor_id: e.target.value })}
                  label="Floor"
                  required
                >
                  {Array.isArray(floors) &&
                    floors.map((floor) => (
                      <MenuItem key={floor.id} value={floor.id}>
                        {floor.name}
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
              <TextField
                margin="dense"
                label="Table Name"
                fullWidth
                variant="outlined"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                sx={{ mb: 2 }}
              />
              <FormControl fullWidth margin="dense" sx={{ mb: 2 }}>
                <InputLabel>Size</InputLabel>
                <Select
                  value={formData.size || 'medium'}
                  onChange={(e) => setFormData({ ...formData, size: e.target.value })}
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
                variant="outlined"
                value={formData.capacity || 4}
                onChange={(e) =>
                  setFormData({ ...formData, capacity: parseInt(e.target.value) || 4 })
                }
                sx={{ mb: 2 }}
              />
              <FormControl fullWidth margin="dense">
                <InputLabel>Status</InputLabel>
                <Select
                  value={formData.status || 'available'}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  label="Status"
                >
                  <MenuItem value="available">Available</MenuItem>
                  <MenuItem value="occupied">Occupied</MenuItem>
                  <MenuItem value="reserved">Reserved</MenuItem>
                  <MenuItem value="out_of_order">Out of Order</MenuItem>
                </Select>
              </FormControl>
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ 
          px: { xs: 2, sm: 3 },
          pb: { xs: 2, sm: 3 },
          gap: { xs: 1, sm: 2 }
        }}>
          <Button 
            onClick={handleCloseDialog}
            size={isMobile ? "medium" : "large"}
            sx={{ minWidth: { xs: '80px', sm: '100px' } }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained"
            size={isMobile ? "medium" : "large"}
            sx={{ minWidth: { xs: '80px', sm: '100px' } }}
          >
            {editingItem ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    )
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold">
          Floor & Table Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog('floor')}
        >
          + ADD FLOOR
        </Button>
      </Box>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="body2" color="text.secondary">
          Manage your restaurant floors and tables. Expand a floor to see and manage its tables.
        </Typography>
      </Paper>

      {renderFloorTree()}

      {renderDialog()}
    </Box>
  )
}

