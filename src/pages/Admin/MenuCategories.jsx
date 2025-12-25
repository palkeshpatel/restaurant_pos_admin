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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  TablePagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  Switch,
  FormControlLabel,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from '@mui/material'
import { Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material'
import api from '../../services/api'

export default function MenuCategories() {
  const [categories, setCategories] = useState([])
  const [allCategories, setAllCategories] = useState([])
  const [menus, setMenus] = useState([])
  const [selectedMenuId, setSelectedMenuId] = useState('')
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [total, setTotal] = useState(0)
  const [openDialog, setOpenDialog] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [formData, setFormData] = useState({
    menu_id: '',
    parent_id: '',
    name: '',
    description: '',
    image: '',
    icon_image: '',
    is_active: true,
  })
  const [error, setError] = useState('')
  const isMountedRef = useRef(true)
  const fetchCategoriesInProgressRef = useRef(false)
  const fetchMenusInProgressRef = useRef(false)

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  // Filter categories based on selected menu
  useEffect(() => {
    if (selectedMenuId) {
      const filtered = allCategories.filter((cat) => cat.menu_id == selectedMenuId)
      setCategories(filtered)
      setTotal(filtered.length)
    } else {
      setCategories(allCategories)
      setTotal(allCategories.length)
    }
  }, [selectedMenuId, allCategories])

  const fetchCategories = async () => {
    if (fetchCategoriesInProgressRef.current) {
      return
    }
    
    fetchCategoriesInProgressRef.current = true
    setLoading(true)
    try {
      const response = await api.get('/admin/menu-categories')
      const data = response.data.data || []
      const categoriesArray = Array.isArray(data) ? data : []
      
      if (isMountedRef.current) {
        setAllCategories(categoriesArray)
        
        // Apply filter if menu is selected
        if (selectedMenuId) {
          const filtered = categoriesArray.filter((cat) => cat.menu_id == selectedMenuId)
          setCategories(filtered)
          setTotal(filtered.length)
        } else {
          setCategories(categoriesArray)
          setTotal(categoriesArray.length)
        }
      }
    } catch (error) {
      console.error('Error fetching menu categories:', error)
      if (isMountedRef.current) {
        setAllCategories([])
        setCategories([])
        setTotal(0)
      }
    } finally {
      fetchCategoriesInProgressRef.current = false
      if (isMountedRef.current) {
        setLoading(false)
      }
    }
  }

  const fetchMenus = async () => {
    if (fetchMenusInProgressRef.current) {
      return
    }
    
    fetchMenusInProgressRef.current = true
    try {
      const response = await api.get('/admin/menus')
      const data = response.data.data || []
      if (isMountedRef.current) {
        setMenus(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error('Error fetching menus:', error)
      if (isMountedRef.current) {
        setMenus([])
      }
    } finally {
      fetchMenusInProgressRef.current = false
    }
  }

  useEffect(() => {
    if (isMountedRef.current && !fetchCategoriesInProgressRef.current) {
      fetchCategories()
    }
    if (isMountedRef.current && !fetchMenusInProgressRef.current) {
      fetchMenus()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, rowsPerPage, selectedMenuId])

  // Get parent categories for the selected menu
  const getParentCategories = () => {
    if (!formData.menu_id) return []
    return allCategories.filter(
      (cat) => cat.menu_id == formData.menu_id && (!editingItem || cat.id !== editingItem.id)
    )
  }

  const handleOpenAdd = () => {
    setEditingItem(null)
    setFormData({
      menu_id: selectedMenuId || '',
      parent_id: '',
      name: '',
      description: '',
      image: '',
      icon_image: '',
      is_active: true,
    })
    setError('')
    setOpenDialog(true)
  }

  const handleOpenEdit = (item) => {
    setEditingItem(item)
    setFormData({
      menu_id: item.menu_id || '',
      parent_id: item.parent_id || '',
      name: item.name || '',
      description: item.description || '',
      image: item.image || '',
      icon_image: item.icon_image || '',
      is_active: item.is_active !== undefined ? item.is_active : true,
    })
    setError('')
    setOpenDialog(true)
  }

  const handleClose = () => {
    setOpenDialog(false)
    setEditingItem(null)
    setFormData({
      menu_id: selectedMenuId || '',
      parent_id: '',
      name: '',
      description: '',
      image: '',
      icon_image: '',
      is_active: true,
    })
    setError('')
  }

  const handleMenuChange = (menuId) => {
    setFormData({ ...formData, menu_id: menuId, parent_id: '' }) // Reset parent when menu changes
  }

  const handleSubmit = async () => {
    setError('')
    try {
      const submitData = {
        ...formData,
        parent_id: formData.parent_id || null, // Convert empty string to null
      }
      
      if (editingItem) {
        await api.put(`/admin/menu-categories/${editingItem.id}`, submitData)
      } else {
        await api.post('/admin/menu-categories', submitData)
      }
      handleClose()
      fetchCategories()
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred')
    }
  }

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this menu category?')) {
      try {
        await api.delete(`/admin/menu-categories/${id}`)
        fetchCategories()
      } catch (error) {
        console.error('Error deleting menu category:', error)
        alert('Failed to delete menu category')
      }
    }
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4">Menu Categories</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenAdd}>
          Add New Category
        </Button>
      </Box>

      {/* Menu Filter Dropdown */}
      <Box sx={{ mb: 2 }}>
        <FormControl sx={{ minWidth: 250 }}>
          <InputLabel>Filter by Menu</InputLabel>
          <Select
            value={selectedMenuId}
            label="Filter by Menu"
            onChange={(e) => setSelectedMenuId(e.target.value)}
          >
            <MenuItem value="">All Menus</MenuItem>
            {menus.map((menu) => (
              <MenuItem key={menu.id} value={menu.id}>
                {menu.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Menu</TableCell>
              <TableCell>Parent Category</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Active</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : categories.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  {selectedMenuId ? 'No categories found for selected menu' : 'No categories found'}
                </TableCell>
              </TableRow>
            ) : (
              categories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell>{category.id}</TableCell>
                  <TableCell>{category.name}</TableCell>
                  <TableCell>{category.menu?.name || 'N/A'}</TableCell>
                  <TableCell>{category.parent?.name || 'None (Main Category)'}</TableCell>
                  <TableCell>{category.description || 'N/A'}</TableCell>
                  <TableCell>{category.is_active ? 'Yes' : 'No'}</TableCell>
                  <TableCell>
                    <IconButton size="small" onClick={() => handleOpenEdit(category)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(category.id)}
                      color="error"
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

      <TablePagination
        component="div"
        count={total}
        page={page}
        onPageChange={(e, newPage) => setPage(newPage)}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={(e) => {
          setRowsPerPage(parseInt(e.target.value, 10))
          setPage(0)
        }}
        rowsPerPageOptions={[5, 10, 25, 50]}
      />

      <Dialog open={openDialog} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>{editingItem ? 'Edit' : 'Add'} Menu Category</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <FormControl fullWidth sx={{ mb: 2, mt: 2 }}>
            <InputLabel>Menu *</InputLabel>
            <Select
              value={formData.menu_id}
              label="Menu *"
              onChange={(e) => handleMenuChange(e.target.value)}
              required
            >
              {menus.map((menu) => (
                <MenuItem key={menu.id} value={menu.id}>
                  {menu.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Parent Category (Optional)</InputLabel>
            <Select
              value={formData.parent_id}
              label="Parent Category (Optional)"
              onChange={(e) => setFormData({ ...formData, parent_id: e.target.value })}
              disabled={!formData.menu_id}
            >
              <MenuItem value="">None (Main Category)</MenuItem>
              {getParentCategories().map((category) => (
                <MenuItem key={category.id} value={category.id}>
                  {category.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            margin="dense"
            label="Name"
            fullWidth
            variant="outlined"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Description"
            fullWidth
            variant="outlined"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            multiline
            rows={3}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Image URL"
            fullWidth
            variant="outlined"
            value={formData.image}
            onChange={(e) => setFormData({ ...formData, image: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Icon Image URL"
            fullWidth
            variant="outlined"
            value={formData.icon_image}
            onChange={(e) => setFormData({ ...formData, icon_image: e.target.value })}
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
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingItem ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

