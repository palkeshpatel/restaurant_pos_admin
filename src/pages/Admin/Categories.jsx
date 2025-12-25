'use client'

import { useState, useEffect, useRef } from 'react'
import {
  Box,
  Typography,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  Chip,
  Switch,
  FormControlLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import { Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material'
import api from '../../services/api'

export default function Categories() {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(false)
  const [updatingAutoFire, setUpdatingAutoFire] = useState({})
  const [openDialog, setOpenDialog] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    is_active: true,
  })
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
      const response = await api.get('/admin/menu-types', { params: { per_page: 1000 } }).catch(() => ({ data: { data: { data: [] } } }))

      if (isMountedRef.current) {
        const categoriesData = response.data.data?.data || response.data.data || []
        setCategories(Array.isArray(categoriesData) ? categoriesData : [])
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    } finally {
      fetchInProgressRef.current = false
      if (isMountedRef.current) {
        setLoading(false)
      }
    }
  }

  const handleOpenAdd = () => {
    setEditingCategory(null)
    setFormData({ name: '', description: '', is_active: true })
    setError('')
    setOpenDialog(true)
  }

  const handleOpenEdit = (category) => {
    setEditingCategory(category)
    setFormData({
      name: category.name || '',
      description: category.description || '',
      is_active: category.is_active !== undefined ? category.is_active : true,
    })
    setError('')
    setOpenDialog(true)
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
    setEditingCategory(null)
    setFormData({ name: '', description: '', is_active: true })
    setError('')
  }

  const handleSubmit = async () => {
    setError('')
    
    // Validate description
    if (!formData.description || formData.description.trim() === '') {
      setError('Description is required')
      return
    }
    
    try {
      if (editingCategory) {
        await api.put(`/admin/menu-types/${editingCategory.id}`, formData)
      } else {
        await api.post('/admin/menu-types', formData)
      }
      handleCloseDialog()
      fetchAllData()
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred')
    }
  }

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this category? This action cannot be undone.')) {
      try {
        await api.delete(`/admin/menu-types/${id}`)
        fetchAllData()
      } catch (error) {
        console.error('Error deleting category:', error)
        const errorMessage = error.response?.data?.message || 'Failed to delete category'
        alert(errorMessage)
      }
    }
  }

  // Check if all menu items have is_auto_fire = 1
  const getAutoFireStatus = (category) => {
    if (!category.menu_items || category.menu_items.length === 0) {
      return false
    }
    // Check if all items have is_auto_fire = 1
    return category.menu_items.every(item => item.is_auto_fire === 1 || item.is_auto_fire === true)
  }

  // Get count of items with auto fire enabled
  const getAutoFireCount = (category) => {
    if (!category.menu_items || category.menu_items.length === 0) {
      return 0
    }
    return category.menu_items.filter(item => item.is_auto_fire === 1 || item.is_auto_fire === true).length
  }


  const handleAutoFireToggle = async (category, newValue) => {
    setUpdatingAutoFire({ ...updatingAutoFire, [category.id]: true })
    try {
      await api.post(`/admin/menu-types/${category.id}/update-auto-fire`, {
        is_auto_fire: newValue
      })
      // Refresh data to get updated menu items
      await fetchAllData()
    } catch (error) {
      console.error('Error updating auto fire:', error)
      const errorMessage = error.response?.data?.message || 'Failed to update auto fire'
      alert(errorMessage)
    } finally {
      setUpdatingAutoFire({ ...updatingAutoFire, [category.id]: false })
    }
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight="bold">
          Categories
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenAdd}>
          Add Category
        </Button>
      </Box>

      {loading ? (
        <Box display="flex" justifyContent="center" p={4}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>Name</strong></TableCell>
                <TableCell><strong>Description</strong></TableCell>
                <TableCell><strong>Auto fire</strong></TableCell>
                <TableCell><strong>Status</strong></TableCell>
                <TableCell align="right"><strong>Actions</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {categories.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                      No categories found
                    </Typography>
                    <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenAdd}>
                      Add Your First Category
                    </Button>
                  </TableCell>
                </TableRow>
              ) : (
                categories.map((category) => (
                  <TableRow key={category.id} hover>
                    <TableCell>
                      <Typography variant="body1" fontWeight="medium">
                        {category.name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {category.description || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, alignItems: 'flex-start' }}>
                        {updatingAutoFire[category.id] ? (
                          <CircularProgress size={20} />
                        ) : (
                          <FormControlLabel
                            control={
                              <Switch
                                checked={getAutoFireStatus(category)}
                                onChange={(e) => handleAutoFireToggle(category, e.target.checked)}
                                disabled={!category.menu_items || category.menu_items.length === 0}
                              />
                            }
                            label={getAutoFireStatus(category) ? 'Yes' : 'No'}
                          />
                        )}
                        {getAutoFireCount(category) > 0 && (
                          <Chip
                            label={`${getAutoFireCount(category)} item${getAutoFireCount(category) !== 1 ? 's' : ''} in auto fire mode`}
                            color="primary"
                            variant="outlined"
                          />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={category.is_active ? 'Active' : 'Inactive'}
                        color={category.is_active ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        onClick={() => handleOpenEdit(category)}
                        title="Edit Category"
                        color="primary"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(category.id)}
                        color="error"
                        title="Delete Category"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle>{editingCategory ? 'Edit' : 'Add'} Category</DialogTitle>
        <DialogContent sx={{ pt: { xs: 2, sm: 3 } }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <TextField
            margin="dense"
            label="Name"
            fullWidth
            variant="outlined"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            sx={{ mb: 2, mt: 2 }}
          />
          <TextField
            margin="dense"
            label="Description *"
            fullWidth
            variant="outlined"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            multiline
            rows={3}
            required
            sx={{ mb: 2 }}
          />
          <FormControlLabel
            control={
              <Switch
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              />
            }
            label="Active"
            sx={{ mb: 2 }}
          />
        </DialogContent>
        <DialogActions
          sx={{
            px: { xs: 2, sm: 3 },
            pb: { xs: 2, sm: 3 },
            gap: { xs: 1, sm: 2 },
          }}
        >
          <Button
            onClick={handleCloseDialog}
            size={isMobile ? 'medium' : 'large'}
            sx={{ minWidth: { xs: '80px', sm: '100px' } }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            size={isMobile ? 'medium' : 'large'}
            sx={{ minWidth: { xs: '80px', sm: '100px' } }}
          >
            {editingCategory ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

