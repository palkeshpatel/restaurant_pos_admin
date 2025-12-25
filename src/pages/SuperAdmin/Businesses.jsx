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
  useTheme,
  useMediaQuery,
} from '@mui/material'
import { Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material'
import api from '../../services/api'

export default function Businesses() {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const [businesses, setBusinesses] = useState([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [total, setTotal] = useState(0)
  const [openDialog, setOpenDialog] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    llc_name: '',
    address: '',
    logo_url: '',
    timezone: 'Asia/Kolkata',
    auto_gratuity_percent: 18.0,
    auto_gratuity_min_guests: 8,
    cc_fee_percent: 3.5,
  })
  const [error, setError] = useState('')

  useEffect(() => {
    fetchBusinesses()
  }, [page, rowsPerPage])

  const fetchBusinesses = async () => {
    setLoading(true)
    try {
      const response = await api.get('/super-admin/businesses', {
        params: {
          page: page + 1,
          per_page: rowsPerPage,
        },
      })
      setBusinesses(response.data.data?.data || response.data.data || [])
      setTotal(response.data.data?.total || response.data.data?.length || 0)
    } catch (error) {
      console.error('Error fetching businesses:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenAdd = () => {
    setEditingItem(null)
    setFormData({
      name: '',
      llc_name: '',
      address: '',
      logo_url: '',
      timezone: 'Asia/Kolkata',
      auto_gratuity_percent: 18.0,
      auto_gratuity_min_guests: 8,
      cc_fee_percent: 3.5,
    })
    setError('')
    setOpenDialog(true)
  }

  const handleOpenEdit = (item) => {
    setEditingItem(item)
    setFormData({
      name: item.name || '',
      llc_name: item.llc_name || '',
      address: item.address || '',
      logo_url: item.logo_url || '',
      timezone: item.timezone || 'Asia/Kolkata',
      auto_gratuity_percent: item.auto_gratuity_percent || 18.0,
      auto_gratuity_min_guests: item.auto_gratuity_min_guests || 8,
      cc_fee_percent: item.cc_fee_percent || 3.5,
    })
    setError('')
    setOpenDialog(true)
  }

  const handleClose = () => {
    setOpenDialog(false)
    setEditingItem(null)
    setFormData({
      name: '',
      llc_name: '',
      address: '',
      logo_url: '',
      timezone: 'Asia/Kolkata',
      auto_gratuity_percent: 18.0,
      auto_gratuity_min_guests: 8,
      cc_fee_percent: 3.5,
    })
    setError('')
  }

  const handleSubmit = async () => {
    setError('')
    try {
      if (editingItem) {
        await api.put(`/super-admin/businesses/${editingItem.id}`, formData)
      } else {
        await api.post('/super-admin/businesses', formData)
      }
      handleClose()
      fetchBusinesses()
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred')
    }
  }

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this business?')) {
      try {
        await api.delete(`/super-admin/businesses/${id}`)
        fetchBusinesses()
      } catch (error) {
        console.error('Error deleting business:', error)
        alert('Failed to delete business')
      }
    }
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4">Businesses</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenAdd}>
          Add New Business
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>LLC Name</TableCell>
              <TableCell>Address</TableCell>
              <TableCell>Timezone</TableCell>
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
            ) : businesses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  No businesses found
                </TableCell>
              </TableRow>
            ) : (
              businesses.map((business) => (
                <TableRow key={business.id}>
                  <TableCell>{business.id}</TableCell>
                  <TableCell>{business.name}</TableCell>
                  <TableCell>{business.llc_name || 'N/A'}</TableCell>
                  <TableCell>{business.address || 'N/A'}</TableCell>
                  <TableCell>{business.timezone || 'N/A'}</TableCell>
                  <TableCell>
                    <IconButton size="small" onClick={() => handleOpenEdit(business)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleDelete(business.id)} color="error">
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
        <DialogTitle>{editingItem ? 'Edit' : 'Add'} Business</DialogTitle>
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
            label="LLC Name"
            fullWidth
            variant="outlined"
            value={formData.llc_name}
            onChange={(e) => setFormData({ ...formData, llc_name: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Address"
            fullWidth
            variant="outlined"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            multiline
            rows={2}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Logo URL"
            fullWidth
            variant="outlined"
            value={formData.logo_url}
            onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Timezone"
            fullWidth
            variant="outlined"
            value={formData.timezone}
            onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
            placeholder="Asia/Kolkata"
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Auto Gratuity (%)"
            type="number"
            fullWidth
            variant="outlined"
            value={formData.auto_gratuity_percent}
            onChange={(e) =>
              setFormData({ ...formData, auto_gratuity_percent: parseFloat(e.target.value) })
            }
            inputProps={{ step: '0.01', min: '0', max: '100' }}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Auto Gratuity Min Guests"
            type="number"
            fullWidth
            variant="outlined"
            value={formData.auto_gratuity_min_guests}
            onChange={(e) =>
              setFormData({ ...formData, auto_gratuity_min_guests: parseInt(e.target.value) })
            }
            inputProps={{ min: '1' }}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="CC Fee (%)"
            type="number"
            fullWidth
            variant="outlined"
            value={formData.cc_fee_percent}
            onChange={(e) =>
              setFormData({ ...formData, cc_fee_percent: parseFloat(e.target.value) })
            }
            inputProps={{ step: '0.01', min: '0', max: '100' }}
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


