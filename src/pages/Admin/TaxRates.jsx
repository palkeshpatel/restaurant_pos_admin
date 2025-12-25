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

export default function TaxRates() {
  const [taxRates, setTaxRates] = useState([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [total, setTotal] = useState(0)
  const [openDialog, setOpenDialog] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    rate_percent: 0,
    applies_to: 'food',
  })
  const [error, setError] = useState('')
  const isMountedRef = useRef(true)
  const fetchInProgressRef = useRef(false)

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  const fetchTaxRates = async () => {
    if (fetchInProgressRef.current) {
      return
    }
    
    fetchInProgressRef.current = true
    setLoading(true)
    try {
      const response = await api.get('/admin/taxes', {
        params: {
          page: page + 1,
          per_page: rowsPerPage,
        },
      })
      if (isMountedRef.current) {
        setTaxRates(response.data.data?.data || response.data.data || [])
        setTotal(response.data.data?.total || response.data.data?.length || 0)
      }
    } catch (error) {
      console.error('Error fetching tax rates:', error)
    } finally {
      fetchInProgressRef.current = false
      if (isMountedRef.current) {
        setLoading(false)
      }
    }
  }

  useEffect(() => {
    if (isMountedRef.current && !fetchInProgressRef.current) {
      fetchTaxRates()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, rowsPerPage])

  const handleOpenAdd = () => {
    setEditingItem(null)
    setFormData({ name: '', rate_percent: 0, applies_to: 'food' })
    setError('')
    setOpenDialog(true)
  }

  const handleOpenEdit = (item) => {
    setEditingItem(item)
    setFormData({
      name: item.name || '',
      rate_percent: item.rate_percent || 0,
      applies_to: item.applies_to || 'food',
    })
    setError('')
    setOpenDialog(true)
  }

  const handleClose = () => {
    setOpenDialog(false)
    setEditingItem(null)
    setFormData({ name: '', rate_percent: 0, applies_to: 'food' })
    setError('')
  }

  const handleSubmit = async () => {
    setError('')
    try {
      if (editingItem) {
        await api.put(`/admin/taxes/${editingItem.id}`, formData)
      } else {
        await api.post('/admin/taxes', formData)
      }
      handleClose()
      fetchTaxRates()
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred')
    }
  }

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this tax rate?')) {
      try {
        await api.delete(`/admin/taxes/${id}`)
        fetchTaxRates()
      } catch (error) {
        console.error('Error deleting tax rate:', error)
        alert('Failed to delete tax rate')
      }
    }
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4">Tax Rates</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenAdd}>
          Add New Tax Rate
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Rate (%)</TableCell>
              <TableCell>Applies To</TableCell>
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
            ) : taxRates.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  No tax rates found
                </TableCell>
              </TableRow>
            ) : (
              taxRates.map((tax) => (
                <TableRow key={tax.id}>
                  <TableCell>{tax.id}</TableCell>
                  <TableCell>{tax.name}</TableCell>
                  <TableCell>{tax.rate_percent}%</TableCell>
                  <TableCell>{tax.applies_to}</TableCell>
                  <TableCell>
                    <IconButton size="small" onClick={() => handleOpenEdit(tax)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleDelete(tax.id)} color="error">
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
        <DialogTitle>{editingItem ? 'Edit' : 'Add'} Tax Rate</DialogTitle>
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
            label="Rate (%)"
            type="number"
            fullWidth
            variant="outlined"
            value={formData.rate_percent}
            onChange={(e) => setFormData({ ...formData, rate_percent: parseFloat(e.target.value) })}
            inputProps={{ step: '0.01', min: '0', max: '100' }}
            sx={{ mb: 2 }}
          />
          <FormControl fullWidth>
            <InputLabel>Applies To</InputLabel>
            <Select
              value={formData.applies_to}
              label="Applies To"
              onChange={(e) => setFormData({ ...formData, applies_to: e.target.value })}
            >
              <MenuItem value="food">Food</MenuItem>
              <MenuItem value="beverage">Beverage</MenuItem>
              <MenuItem value="all">All</MenuItem>
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

