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
  useMediaQuery,
  useTheme,
} from '@mui/material'
import { Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material'
import api from '../../services/api'

export default function Employees() {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [total, setTotal] = useState(0)
  const [openDialog, setOpenDialog] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    pin4: '',
    image: '',
    is_active: true,
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

  const fetchEmployees = async () => {
    if (fetchInProgressRef.current) {
      return // Prevent duplicate calls
    }
    
    fetchInProgressRef.current = true
    setLoading(true)
    try {
      // Use the latest page and rowsPerPage values from state
      const currentPage = page
      const currentRowsPerPage = rowsPerPage
      
      const response = await api.get('/admin/employees', {
        params: {
          page: currentPage + 1,
          per_page: currentRowsPerPage,
        },
      })
      if (isMountedRef.current) {
        setEmployees(response.data.data?.data || response.data.data || [])
        setTotal(response.data.data?.total || response.data.data?.length || 0)
      }
    } catch (error) {
      console.error('Error fetching employees:', error)
    } finally {
      fetchInProgressRef.current = false
      if (isMountedRef.current) {
        setLoading(false)
      }
    }
  }

  useEffect(() => {
    if (isMountedRef.current) {
      // Reset fetch flag when page/rowsPerPage changes to allow new fetch
      fetchInProgressRef.current = false
      fetchEmployees()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, rowsPerPage])

  const handleOpenAdd = () => {
    setEditingItem(null)
    setFormData({
      first_name: '',
      last_name: '',
      email: '',
      pin4: '',
      image: '',
      is_active: true,
    })
    setError('')
    setOpenDialog(true)
  }

  const handleOpenEdit = (item) => {
    setEditingItem(item)
    setFormData({
      first_name: item.first_name || '',
      last_name: item.last_name || '',
      email: item.email || '',
      pin4: item.pin4 || '',
      image: item.image || '',
      is_active: item.is_active !== undefined ? item.is_active : true,
    })
    setError('')
    setOpenDialog(true)
  }

  const handleClose = () => {
    setOpenDialog(false)
    setEditingItem(null)
    setFormData({
      first_name: '',
      last_name: '',
      email: '',
      pin4: '',
      image: '',
      is_active: true,
    })
    setError('')
  }

  const handleSubmit = async () => {
    setError('')
    try {
      if (editingItem) {
        await api.put(`/admin/employees/${editingItem.id}`, formData)
      } else {
        await api.post('/admin/employees', formData)
      }
      handleClose()
      fetchEmployees()
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred')
    }
  }

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this employee?')) {
      try {
        await api.delete(`/admin/employees/${id}`)
        fetchEmployees()
      } catch (error) {
        console.error('Error deleting employee:', error)
        alert('Failed to delete employee')
      }
    }
  }

  return (
    <Box>
      <Box 
        sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between', 
          alignItems: { xs: 'flex-start', sm: 'center' }, 
          mb: { xs: 2, sm: 3 },
          gap: { xs: 2, sm: 0 }
        }}
      >
        <Typography 
          variant="h4"
          sx={{ 
            fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' },
            fontWeight: { xs: 600, sm: 700 }
          }}
        >
          Employees
        </Typography>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />} 
          onClick={handleOpenAdd}
          fullWidth={isMobile}
          size={isMobile ? "medium" : "large"}
        >
          Add New Employee
        </Button>
      </Box>

      <TableContainer 
        component={Paper}
        sx={{
          overflowX: 'auto',
          maxWidth: '100%',
        }}
      >
        <Table sx={{ minWidth: { xs: 600, sm: 650 } }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ 
                fontSize: { xs: '0.75rem', sm: '0.875rem' },
                fontWeight: 600,
                py: { xs: 1, sm: 1.5 }
              }}>
                ID
              </TableCell>
              <TableCell sx={{ 
                fontSize: { xs: '0.75rem', sm: '0.875rem' },
                fontWeight: 600,
                py: { xs: 1, sm: 1.5 }
              }}>
                Name
              </TableCell>
              <TableCell sx={{ 
                fontSize: { xs: '0.75rem', sm: '0.875rem' },
                fontWeight: 600,
                py: { xs: 1, sm: 1.5 }
              }}>
                Email
              </TableCell>
              <TableCell sx={{ 
                fontSize: { xs: '0.75rem', sm: '0.875rem' },
                fontWeight: 600,
                py: { xs: 1, sm: 1.5 }
              }}>
                PIN
              </TableCell>
              <TableCell sx={{ 
                fontSize: { xs: '0.75rem', sm: '0.875rem' },
                fontWeight: 600,
                py: { xs: 1, sm: 1.5 }
              }}>
                Active
              </TableCell>
              <TableCell sx={{ 
                fontSize: { xs: '0.75rem', sm: '0.875rem' },
                fontWeight: 600,
                py: { xs: 1, sm: 1.5 }
              }}>
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : employees.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  No employees found
                </TableCell>
              </TableRow>
            ) : (
              employees.map((employee) => (
                <TableRow key={employee.id}>
                  <TableCell sx={{ 
                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                    py: { xs: 1, sm: 1.5 }
                  }}>
                    {employee.id}
                  </TableCell>
                  <TableCell sx={{ 
                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                    py: { xs: 1, sm: 1.5 }
                  }}>
                    {employee.first_name} {employee.last_name}
                  </TableCell>
                  <TableCell sx={{ 
                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                    py: { xs: 1, sm: 1.5 }
                  }}>
                    {employee.email}
                  </TableCell>
                  <TableCell sx={{ 
                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                    py: { xs: 1, sm: 1.5 }
                  }}>
                    {employee.pin4 || 'N/A'}
                  </TableCell>
                  <TableCell sx={{ 
                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                    py: { xs: 1, sm: 1.5 }
                  }}>
                    {employee.is_active ? 'Yes' : 'No'}
                  </TableCell>
                  <TableCell sx={{ py: { xs: 1, sm: 1.5 } }}>
                    <Box sx={{ display: 'flex', gap: { xs: 0.5, sm: 1 } }}>
                      <IconButton 
                        size={isMobile ? "small" : "medium"} 
                        onClick={() => handleOpenEdit(employee)}
                        sx={{ padding: { xs: '4px', sm: '8px' } }}
                      >
                        <EditIcon fontSize={isMobile ? "small" : "medium"} />
                      </IconButton>
                      <IconButton
                        size={isMobile ? "small" : "medium"}
                        onClick={() => handleDelete(employee.id)}
                        color="error"
                        sx={{ padding: { xs: '4px', sm: '8px' } }}
                      >
                        <DeleteIcon fontSize={isMobile ? "small" : "medium"} />
                      </IconButton>
                    </Box>
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
        <DialogTitle>{editingItem ? 'Edit' : 'Add'} Employee</DialogTitle>
        <DialogContent sx={{ pt: { xs: 2, sm: 3 } }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <TextField
            margin="dense"
            label="First Name"
            fullWidth
            variant="outlined"
            value={formData.first_name}
            onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
            required
            sx={{ 
              mb: 2,
              '& .MuiInputBase-root': {
                fontSize: { xs: '0.875rem', sm: '1rem' }
              }
            }}
          />
          <TextField
            margin="dense"
            label="Last Name"
            fullWidth
            variant="outlined"
            value={formData.last_name}
            onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
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
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="PIN (4 digits)"
            fullWidth
            variant="outlined"
            value={formData.pin4}
            onChange={(e) => setFormData({ ...formData, pin4: e.target.value })}
            inputProps={{ maxLength: 4 }}
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


