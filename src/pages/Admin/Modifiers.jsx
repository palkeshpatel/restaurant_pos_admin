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
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import { Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material'
import api from '../../services/api'

export default function Modifiers() {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
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
  const isMountedRef = useRef(true)
  const fetchModifiersInProgressRef = useRef(false)
  const fetchGroupsInProgressRef = useRef(false)

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  const fetchModifiers = async () => {
    if (fetchModifiersInProgressRef.current) {
      return
    }
    
    fetchModifiersInProgressRef.current = true
    setLoading(true)
    try {
      const response = await api.get('/admin/modifiers', {
        params: {
          page: page + 1,
          per_page: rowsPerPage,
        },
      })
      console.log('Modifiers API Response:', response.data)
      const data = response.data.data || []
      if (isMountedRef.current) {
        setModifiers(Array.isArray(data) ? data : [])
        setTotal(Array.isArray(data) ? data.length : 0)
      }
    } catch (error) {
      console.error('Error fetching modifiers:', error)
      console.error('Error details:', error.response?.data)
      if (isMountedRef.current) {
        setModifiers([])
        setTotal(0)
      }
      if (error.response?.status === 404) {
        alert('Modifiers endpoint not found. Please check the API route.')
      }
    } finally {
      fetchModifiersInProgressRef.current = false
      if (isMountedRef.current) {
        setLoading(false)
      }
    }
  }

  const fetchGroups = async () => {
    if (fetchGroupsInProgressRef.current) {
      return
    }
    
    fetchGroupsInProgressRef.current = true
    try {
      const response = await api.get('/admin/modifier-groups')
      const data = response.data.data || []
      if (isMountedRef.current) {
        setGroups(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error('Error fetching modifier groups:', error)
      if (isMountedRef.current) {
        setGroups([])
      }
    } finally {
      fetchGroupsInProgressRef.current = false
    }
  }

  useEffect(() => {
    if (isMountedRef.current && !fetchModifiersInProgressRef.current) {
      fetchModifiers()
    }
    if (isMountedRef.current && !fetchGroupsInProgressRef.current) {
      fetchGroups()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, rowsPerPage])

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

      <Dialog 
        open={openDialog} 
        onClose={handleClose} 
        maxWidth="sm" 
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle>{editingItem ? 'Edit' : 'Add'} Modifier</DialogTitle>
        <DialogContent sx={{ pt: { xs: 2, sm: 3 } }}>
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

