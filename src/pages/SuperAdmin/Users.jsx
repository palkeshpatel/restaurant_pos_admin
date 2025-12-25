'use client'

import { useState, useEffect } from 'react'

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
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import { Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material'
import api from '../../services/api'

export default function Users() {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const [users, setUsers] = useState([])
  const [businesses, setBusinesses] = useState([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [total, setTotal] = useState(0)
  const [openDialog, setOpenDialog] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    business_id: '',
    is_super_admin: false,
  })
  const [error, setError] = useState('')

  useEffect(() => {
    fetchUsers()
    fetchBusinesses()
  }, [page, rowsPerPage])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const response = await api.get('/super-admin/users', {
        params: {
          page: page + 1,
          per_page: rowsPerPage,
        },
      })
      setUsers(response.data.data?.data || response.data.data || [])
      setTotal(response.data.data?.total || response.data.data?.length || 0)
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchBusinesses = async () => {
    try {
      const response = await api.get('/super-admin/businesses')
      setBusinesses(response.data.data?.data || response.data.data || [])
    } catch (error) {
      console.error('Error fetching businesses:', error)
    }
  }

  const handleOpenAdd = () => {
    setEditingItem(null)
    setFormData({
      name: '',
      email: '',
      password: '',
      business_id: '',
      is_super_admin: false,
    })
    setError('')
    setOpenDialog(true)
  }

  const handleOpenEdit = (item) => {
    setEditingItem(item)
    setFormData({
      name: item.name || '',
      email: item.email || '',
      password: '',
      business_id: item.business_id || '',
      is_super_admin: item.is_super_admin || false,
    })
    setError('')
    setOpenDialog(true)
  }

  const handleClose = () => {
    setOpenDialog(false)
    setEditingItem(null)
    setFormData({
      name: '',
      email: '',
      password: '',
      business_id: '',
      is_super_admin: false,
    })
    setError('')
  }

  const handleSubmit = async () => {
    setError('')
    try {
      const submitData = { ...formData }
      if (!submitData.password) {
        delete submitData.password
      }
      if (editingItem) {
        await api.put(`/super-admin/users/${editingItem.id}`, submitData)
      } else {
        await api.post('/super-admin/users', submitData)
      }
      handleClose()
      fetchUsers()
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred')
    }
  }

  const handleDelete = async (id) => {
    const userToDelete = users.find((u) => u.id === id)
    if (userToDelete?.is_super_admin) {
      alert('Cannot delete super admin user')
      return
    }
    
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await api.delete(`/super-admin/users/${id}`)
        fetchUsers()
      } catch (error) {
        console.error('Error deleting user:', error)
        alert('Failed to delete user')
      }
    }
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4">Users</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenAdd}>
          Add New User
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Business</TableCell>
              <TableCell>Super Admin</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.id}</TableCell>
                  <TableCell>{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.business?.name || 'N/A'}</TableCell>
                  <TableCell>{user.is_super_admin ? 'Yes' : 'No'}</TableCell>
                  <TableCell>
                    <IconButton size="small" onClick={() => handleOpenEdit(user)}>
                      <EditIcon />
                    </IconButton>
                    {!user.is_super_admin && (
                      <IconButton size="small" onClick={() => handleDelete(user.id)} color="error">
                        <DeleteIcon />
                      </IconButton>
                    )}
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
        <DialogTitle>{editingItem ? 'Edit' : 'Add'} User</DialogTitle>
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
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Email"
            type="email"
            fullWidth
            variant="outlined"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label={editingItem ? 'New Password (leave blank to keep current)' : 'Password'}
            type="password"
            fullWidth
            variant="outlined"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required={!editingItem}
            sx={{ mb: 2 }}
          />
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Business</InputLabel>
            <Select
              value={formData.business_id}
              label="Business"
              onChange={(e) => setFormData({ ...formData, business_id: e.target.value })}
            >
              <MenuItem value="">None</MenuItem>
              {businesses.map((business) => (
                <MenuItem key={business.id} value={business.id}>
                  {business.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel>Super Admin</InputLabel>
            <Select
              value={formData.is_super_admin ? '1' : '0'}
              label="Super Admin"
              onChange={(e) =>
                setFormData({ ...formData, is_super_admin: e.target.value === '1' })
              }
            >
              <MenuItem value="0">No</MenuItem>
              <MenuItem value="1">Yes</MenuItem>
            </Select>
          </FormControl>
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


