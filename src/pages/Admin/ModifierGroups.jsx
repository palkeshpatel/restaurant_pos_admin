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
} from '@mui/material'
import { Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material'
import api from '../../services/api'

export default function ModifierGroups() {
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [total, setTotal] = useState(0)
  const [openDialog, setOpenDialog] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    min_select: 1,
    max_select: 1,
  })
  const [error, setError] = useState('')

  useEffect(() => {
    fetchGroups()
  }, [page, rowsPerPage])

  const fetchGroups = async () => {
    setLoading(true)
    try {
      const response = await api.get('/admin/modifier-groups', {
        params: {
          page: page + 1,
          per_page: rowsPerPage,
        },
      })
      setGroups(response.data.data?.data || response.data.data || [])
      setTotal(response.data.data?.total || response.data.data?.length || 0)
    } catch (error) {
      console.error('Error fetching modifier groups:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenAdd = () => {
    setEditingItem(null)
    setFormData({ name: '', min_select: 1, max_select: 1 })
    setError('')
    setOpenDialog(true)
  }

  const handleOpenEdit = (item) => {
    setEditingItem(item)
    setFormData({
      name: item.name || '',
      min_select: item.min_select || 1,
      max_select: item.max_select || 1,
    })
    setError('')
    setOpenDialog(true)
  }

  const handleClose = () => {
    setOpenDialog(false)
    setEditingItem(null)
    setFormData({ name: '', min_select: 1, max_select: 1 })
    setError('')
  }

  const handleSubmit = async () => {
    setError('')
    try {
      if (editingItem) {
        await api.put(`/admin/modifier-groups/${editingItem.id}`, formData)
      } else {
        await api.post('/admin/modifier-groups', formData)
      }
      handleClose()
      fetchGroups()
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred')
    }
  }

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this modifier group?')) {
      try {
        await api.delete(`/admin/modifier-groups/${id}`)
        fetchGroups()
      } catch (error) {
        console.error('Error deleting modifier group:', error)
        alert('Failed to delete modifier group')
      }
    }
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4">Modifier Groups</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenAdd}>
          Add New Modifier Group
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Min Select</TableCell>
              <TableCell>Max Select</TableCell>
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
            ) : groups.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  No modifier groups found
                </TableCell>
              </TableRow>
            ) : (
              groups.map((group) => (
                <TableRow key={group.id}>
                  <TableCell>{group.id}</TableCell>
                  <TableCell>{group.name}</TableCell>
                  <TableCell>{group.min_select}</TableCell>
                  <TableCell>{group.max_select}</TableCell>
                  <TableCell>
                    <IconButton size="small" onClick={() => handleOpenEdit(group)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleDelete(group.id)} color="error">
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
        <DialogTitle>{editingItem ? 'Edit' : 'Add'} Modifier Group</DialogTitle>
        <DialogContent>
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
            label="Min Select"
            type="number"
            fullWidth
            variant="outlined"
            value={formData.min_select}
            onChange={(e) => setFormData({ ...formData, min_select: parseInt(e.target.value) })}
            inputProps={{ min: '0' }}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Max Select"
            type="number"
            fullWidth
            variant="outlined"
            value={formData.max_select}
            onChange={(e) => setFormData({ ...formData, max_select: parseInt(e.target.value) })}
            inputProps={{ min: '1' }}
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

