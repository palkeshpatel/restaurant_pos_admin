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
} from '@mui/material'
import { Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material'
import api from '../../services/api'

export default function Tables() {
  const [tables, setTables] = useState([])
  const [floors, setFloors] = useState([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [total, setTotal] = useState(0)
  const [openDialog, setOpenDialog] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [formData, setFormData] = useState({
    floor_id: '',
    name: '',
    size: 'medium',
    capacity: 4,
    status: 'available',
  })
  const [error, setError] = useState('')
  const isMountedRef = useRef(true)
  const fetchTablesInProgressRef = useRef(false)
  const fetchFloorsInProgressRef = useRef(false)

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  const fetchTables = async () => {
    if (fetchTablesInProgressRef.current) {
      return
    }
    
    fetchTablesInProgressRef.current = true
    setLoading(true)
    try {
      const response = await api.get('/admin/tables', {
        params: {
          page: page + 1,
          per_page: rowsPerPage,
        },
      })
      if (isMountedRef.current) {
        setTables(response.data.data?.data || response.data.data || [])
        setTotal(response.data.data?.total || response.data.data?.length || 0)
      }
    } catch (error) {
      console.error('Error fetching tables:', error)
    } finally {
      fetchTablesInProgressRef.current = false
      if (isMountedRef.current) {
        setLoading(false)
      }
    }
  }

  const fetchFloors = async () => {
    if (fetchFloorsInProgressRef.current) {
      return
    }
    
    fetchFloorsInProgressRef.current = true
    try {
      const response = await api.get('/admin/floors')
      if (isMountedRef.current) {
        setFloors(response.data.data?.data || response.data.data || [])
      }
    } catch (error) {
      console.error('Error fetching floors:', error)
    } finally {
      fetchFloorsInProgressRef.current = false
    }
  }

  useEffect(() => {
    if (isMountedRef.current && !fetchTablesInProgressRef.current) {
      fetchTables()
    }
    if (isMountedRef.current && !fetchFloorsInProgressRef.current) {
      fetchFloors()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, rowsPerPage])

  const handleOpenAdd = () => {
    setEditingItem(null)
    setFormData({
      floor_id: '',
      name: '',
      size: 'medium',
      capacity: 4,
      status: 'available',
    })
    setError('')
    setOpenDialog(true)
  }

  const handleOpenEdit = (item) => {
    setEditingItem(item)
    setFormData({
      floor_id: item.floor_id || '',
      name: item.name || '',
      size: item.size || 'medium',
      capacity: item.capacity || 4,
      status: item.status || 'available',
    })
    setError('')
    setOpenDialog(true)
  }

  const handleClose = () => {
    setOpenDialog(false)
    setEditingItem(null)
    setFormData({
      floor_id: '',
      name: '',
      size: 'medium',
      capacity: 4,
      status: 'available',
    })
    setError('')
  }

  const handleSubmit = async () => {
    setError('')
    try {
      if (editingItem) {
        await api.put(`/admin/tables/${editingItem.id}`, formData)
      } else {
        await api.post('/admin/tables', formData)
      }
      handleClose()
      fetchTables()
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred')
    }
  }

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this table?')) {
      try {
        await api.delete(`/admin/tables/${id}`)
        fetchTables()
      } catch (error) {
        console.error('Error deleting table:', error)
        alert('Failed to delete table')
      }
    }
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4">Tables</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenAdd}>
          Add New Table
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Floor</TableCell>
              <TableCell>Size</TableCell>
              <TableCell>Capacity</TableCell>
              <TableCell>Status</TableCell>
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
            ) : tables.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  No tables found
                </TableCell>
              </TableRow>
            ) : (
              tables.map((table) => (
                <TableRow key={table.id}>
                  <TableCell>{table.id}</TableCell>
                  <TableCell>{table.name}</TableCell>
                  <TableCell>{table.floor?.name || 'N/A'}</TableCell>
                  <TableCell>{table.size}</TableCell>
                  <TableCell>{table.capacity}</TableCell>
                  <TableCell>{table.status}</TableCell>
                  <TableCell>
                    <IconButton size="small" onClick={() => handleOpenEdit(table)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleDelete(table.id)} color="error">
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
        <DialogTitle>{editingItem ? 'Edit' : 'Add'} Table</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <FormControl fullWidth sx={{ mb: 2, mt: 2 }}>
            <InputLabel>Floor</InputLabel>
            <Select
              value={formData.floor_id}
              label="Floor"
              onChange={(e) => setFormData({ ...formData, floor_id: e.target.value })}
              required
            >
              {floors.map((floor) => (
                <MenuItem key={floor.id} value={floor.id}>
                  {floor.name}
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
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Size</InputLabel>
            <Select
              value={formData.size}
              label="Size"
              onChange={(e) => setFormData({ ...formData, size: e.target.value })}
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
            value={formData.capacity}
            onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
            sx={{ mb: 2 }}
          />
          <FormControl fullWidth>
            <InputLabel>Status</InputLabel>
            <Select
              value={formData.status}
              label="Status"
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            >
              <MenuItem value="available">Available</MenuItem>
              <MenuItem value="occupied">Occupied</MenuItem>
              <MenuItem value="reserved">Reserved</MenuItem>
            </Select>
          </FormControl>
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



