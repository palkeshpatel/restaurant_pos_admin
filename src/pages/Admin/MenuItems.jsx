import { useState, useEffect, useRef } from 'react'
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
  useMediaQuery,
  useTheme,
} from '@mui/material'
import { Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material'
import api from '../../services/api'

export default function MenuItems() {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const [menuItems, setMenuItems] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [total, setTotal] = useState(0)
  const [openDialog, setOpenDialog] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [formData, setFormData] = useState({
    menu_category_id: '',
    name: '',
    price_cash: 0,
    price_card: 0,
    image: '',
    icon_image: '',
    is_active: true,
  })
  const [error, setError] = useState('')
  const isMountedRef = useRef(true)
  const fetchMenuItemsInProgressRef = useRef(false)
  const fetchCategoriesInProgressRef = useRef(false)

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  const fetchMenuItems = async () => {
    if (fetchMenuItemsInProgressRef.current) {
      return
    }
    
    fetchMenuItemsInProgressRef.current = true
    setLoading(true)
    try {
      const response = await api.get('/admin/menu-items', {
        params: {
          page: page + 1,
          per_page: rowsPerPage,
        },
      })
      console.log('Menu Items API Response:', response.data)
      const data = response.data.data || []
      if (isMountedRef.current) {
        setMenuItems(Array.isArray(data) ? data : [])
        setTotal(Array.isArray(data) ? data.length : 0)
      }
    } catch (error) {
      console.error('Error fetching menu items:', error)
      console.error('Error details:', error.response?.data)
      if (isMountedRef.current) {
        setMenuItems([])
        setTotal(0)
      }
      if (error.response?.status === 404) {
        alert('Menu items endpoint not found. Please check the API route.')
      }
    } finally {
      fetchMenuItemsInProgressRef.current = false
      if (isMountedRef.current) {
        setLoading(false)
      }
    }
  }

  const fetchCategories = async () => {
    if (fetchCategoriesInProgressRef.current) {
      return
    }
    
    fetchCategoriesInProgressRef.current = true
    try {
      const response = await api.get('/admin/menu-categories')
      const data = response.data.data || []
      if (isMountedRef.current) {
        setCategories(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
      if (isMountedRef.current) {
        setCategories([])
      }
    } finally {
      fetchCategoriesInProgressRef.current = false
    }
  }

  useEffect(() => {
    if (isMountedRef.current && !fetchMenuItemsInProgressRef.current) {
      fetchMenuItems()
    }
    if (isMountedRef.current && !fetchCategoriesInProgressRef.current) {
      fetchCategories()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, rowsPerPage])

  const handleOpenAdd = () => {
    setEditingItem(null)
    setFormData({
      menu_category_id: '',
      name: '',
      price_cash: 0,
      price_card: 0,
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
      menu_category_id: item.menu_category_id || '',
      name: item.name || '',
      price_cash: item.price_cash || 0,
      price_card: item.price_card || 0,
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
      menu_category_id: '',
      name: '',
      price_cash: 0,
      price_card: 0,
      image: '',
      icon_image: '',
      is_active: true,
    })
    setError('')
  }

  const handleSubmit = async () => {
    setError('')
    try {
      if (editingItem) {
        await api.put(`/admin/menu-items/${editingItem.id}`, formData)
      } else {
        await api.post('/admin/menu-items', formData)
      }
      handleClose()
      fetchMenuItems()
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred')
    }
  }

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this menu item?')) {
      try {
        await api.delete(`/admin/menu-items/${id}`)
        fetchMenuItems()
      } catch (error) {
        console.error('Error deleting menu item:', error)
        alert('Failed to delete menu item')
      }
    }
  }

  if (!menuItems && loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4">Menu Items</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenAdd}>
          Add New Menu Item
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Price (Cash)</TableCell>
              <TableCell>Price (Card)</TableCell>
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
            ) : menuItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  No menu items found
                </TableCell>
              </TableRow>
            ) : (
              menuItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.id}</TableCell>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>{item.menu_category?.name || 'N/A'}</TableCell>
                  <TableCell>${item.price_cash?.toFixed(2) || '0.00'}</TableCell>
                  <TableCell>${item.price_card?.toFixed(2) || '0.00'}</TableCell>
                  <TableCell>{item.is_active ? 'Yes' : 'No'}</TableCell>
                  <TableCell>
                    <IconButton size="small" onClick={() => handleOpenEdit(item)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleDelete(item.id)} color="error">
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

      <Dialog 
        open={openDialog} 
        onClose={handleClose} 
        maxWidth="sm" 
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle>{editingItem ? 'Edit' : 'Add'} Menu Item</DialogTitle>
        <DialogContent sx={{ pt: { xs: 2, sm: 3 } }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <FormControl fullWidth sx={{ mb: 2, mt: 2 }}>
            <InputLabel>Category</InputLabel>
            <Select
              value={formData.menu_category_id}
              label="Category"
              onChange={(e) => setFormData({ ...formData, menu_category_id: e.target.value })}
              required
            >
              {categories.map((category) => (
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
            label="Price (Cash)"
            type="number"
            fullWidth
            variant="outlined"
            value={formData.price_cash}
            onChange={(e) => setFormData({ ...formData, price_cash: parseFloat(e.target.value) })}
            inputProps={{ step: '0.01', min: '0' }}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Price (Card)"
            type="number"
            fullWidth
            variant="outlined"
            value={formData.price_card}
            onChange={(e) => setFormData({ ...formData, price_card: parseFloat(e.target.value) })}
            inputProps={{ step: '0.01', min: '0' }}
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
        <DialogActions sx={{ 
          px: { xs: 2, sm: 3 },
          pb: { xs: 2, sm: 3 },
          gap: { xs: 1, sm: 2 }
        }}>
          <Button 
            onClick={handleClose}
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
    </Box>
  )
}

