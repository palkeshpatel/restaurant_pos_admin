import { useState, useEffect } from 'react'
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
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from '@mui/material'
import { Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material'
import api from '../../services/api'

export default function Modifiers() {
  const [modifiers, setModifiers] = useState([])
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [total, setTotal] = useState(0)
  const [openDialog, setOpenDialog] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [formData, setFormData] = useState({
    group_id: '',
    name: '',
    additional_price: 0,
  })
  const [error, setError] = useState('')

  useEffect(() => {
    fetchModifiers()
    fetchGroups()
  }, [page, rowsPerPage])

  const fetchModifiers = async () => {
    setLoading(true)
    try {
      const response = await api.get('/admin/modifiers', {
        params: {
          page: page + 1,
          per_page: rowsPerPage,
        },
      })
      console.log('Modifiers API Response:', response.data)
      // API returns { success: true, data: [...] }
      const data = response.data.data || []
      setModifiers(Array.isArray(data) ? data : [])
      setTotal(Array.isArray(data) ? data.length : 0)
    } catch (error) {
      console.error('Error fetching modifiers:', error)
      console.error('Error details:', error.response?.data)
      setModifiers([])
      setTotal(0)
      if (error.response?.status === 404) {
        alert('Modifiers endpoint not found. Please check the API route.')
      }
    } finally {
      setLoading(false)
    }
  }

  const fetchGroups = async () => {
    try {
      const response = await api.get('/admin/modifier-groups')
      const data = response.data.data || []
      setGroups(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error fetching modifier groups:', error)
      setGroups([])
    }
  }

  const handleOpenAdd = () => {
    setEditingItem(null)
    setFormData({ group_id: '', name: '', additional_price: 0 })
    setError('')
    setOpenDialog(true)
  }

  const handleOpenEdit = (item) => {
    setEditingItem(item)
    setFormData({
      group_id: item.group_id || '',
      name: item.name || '',
      additional_price: item.additional_price || 0,
    })
    setError('')
    setOpenDialog(true)
  }

  const handleClose = () => {
    setOpenDialog(false)
    setEditingItem(null)
    setFormData({ group_id: '', name: '', additional_price: 0 })
    setError('')
  }

  const handleSubmit = async () => {
    setError('')
    try {
      if (editingItem) {
        await api.put(`/admin/modifiers/${editingItem.id}`, formData)
      } else {
        await api.post('/admin/modifiers', formData)
      }
      handleClose()
      fetchModifiers()
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred')
    }
  }

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this modifier?')) {
      try {
        await api.delete(`/admin/modifiers/${id}`)
        fetchModifiers()
      } catch (error) {
        console.error('Error deleting modifier:', error)
        alert('Failed to delete modifier')
      }
    }
  }

  if (!modifiers && loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4">Modifiers</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenAdd}>
          Add New Modifier
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Group</TableCell>
              <TableCell>Additional Price</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : modifiers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  No modifiers found
                </TableCell>
              </TableRow>
            ) : (
              modifiers.map((modifier) => (
                <TableRow key={modifier.id}>
                  <TableCell>{modifier.id}</TableCell>
                  <TableCell>{modifier.name}</TableCell>
                  <TableCell>{modifier.group?.name || 'N/A'}</TableCell>
                  <TableCell>${modifier.additional_price?.toFixed(2) || '0.00'}</TableCell>
                  <TableCell>
                    <IconButton size="small" onClick={() => handleOpenEdit(modifier)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleDelete(modifier.id)} color="error">
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
        <DialogTitle>{editingItem ? 'Edit' : 'Add'} Modifier</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <FormControl fullWidth sx={{ mb: 2, mt: 2 }}>
            <InputLabel>Modifier Group</InputLabel>
            <Select
              value={formData.group_id}
              label="Modifier Group"
              onChange={(e) => setFormData({ ...formData, group_id: e.target.value })}
              required
            >
              {groups.map((group) => (
                <MenuItem key={group.id} value={group.id}>
                  {group.name}
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
            label="Additional Price"
            type="number"
            fullWidth
            variant="outlined"
            value={formData.additional_price}
            onChange={(e) =>
              setFormData({ ...formData, additional_price: parseFloat(e.target.value) })
            }
            inputProps={{ step: '0.01', min: '0' }}
            sx={{ mb: 2 }}
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

