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
  useMediaQuery,
  useTheme,
  InputAdornment,
  Avatar,
  Snackbar,
  Fade,
  Grow,
  Backdrop,
} from '@mui/material'
import { Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon, Visibility, VisibilityOff, Warning as WarningIcon } from '@mui/icons-material'
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
  const [showPin, setShowPin] = useState(false)
  const [avatarFile, setAvatarFile] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState('')
  const [error, setError] = useState('')
  const [submitLoading, setSubmitLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [employeeToDelete, setEmployeeToDelete] = useState(null)
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' })
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
    setAvatarFile(null)
    setAvatarPreview('')
    setShowPin(false)
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
      image: item.image || item.avatar || '',
      is_active: item.is_active !== undefined ? item.is_active : true,
    })
    setAvatarFile(null)
    setAvatarPreview(item.avatar || item.image || '')
    setShowPin(false)
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
    setAvatarFile(null)
    setAvatarPreview('')
    setShowPin(false)
    setError('')
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setAvatarFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setAvatarPreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async () => {
    setError('')
    setSubmitLoading(true)
    try {
      // If there's a file, upload it separately first (like floor background upload)
      if (avatarFile) {
        try {
          const formDataUpload = new FormData()
          formDataUpload.append('avatar', avatarFile)
          
          if (editingItem) {
            // Upload avatar for existing employee - this updates the avatar directly
            await api.post(`/admin/employees/${editingItem.id}/avatar`, formDataUpload, {
              headers: {
                'Content-Type': 'multipart/form-data',
              },
            })
            // Avatar is already uploaded and saved, no need to send it in update
          }
        } catch (uploadErr) {
          setError(uploadErr.response?.data?.message || 'Failed to upload avatar')
          setSnackbar({ open: true, message: uploadErr.response?.data?.message || 'Failed to upload avatar', severity: 'error' })
          setSubmitLoading(false)
          return
        }
      }
      
      // Prepare employee data (without avatar if file was uploaded, or with URL if provided)
      const submitData = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        is_active: formData.is_active,
      }
      
      // Only include pin4 if it has a value (when editing, don't send empty PIN)
      if (formData.pin4 && formData.pin4.trim() !== '') {
        submitData.pin4 = formData.pin4
      }
      
      // Only include avatar URL if:
      // 1. No file was uploaded (we're using URL from formData.image)
      // 2. AND we have a valid URL string
      if (!avatarFile && formData.image && typeof formData.image === 'string' && formData.image.trim() !== '') {
        submitData.avatar = formData.image.trim()
      }
      // If avatarFile was uploaded, don't send avatar in update - it's already uploaded separately

      let employeeId = null
      if (editingItem) {
        // Update existing employee (avatar already uploaded separately if file was provided)
        await api.put(`/admin/employees/${editingItem.id}`, submitData)
        employeeId = editingItem.id
      } else {
        // Create new employee
        const createResponse = await api.post('/admin/employees', submitData)
        employeeId = createResponse.data.data?.id || createResponse.data.id
        
        // If we have a file for new employee, upload it now
        if (avatarFile && employeeId) {
          try {
            const formDataUpload = new FormData()
            formDataUpload.append('avatar', avatarFile)
            await api.post(`/admin/employees/${employeeId}/avatar`, formDataUpload, {
              headers: {
                'Content-Type': 'multipart/form-data',
              },
            })
          } catch (uploadErr) {
            console.error('Failed to upload avatar after creation:', uploadErr)
            // Don't fail the whole operation, just log the error
          }
        }
      }
      
      setSnackbar({ open: true, message: editingItem ? 'Employee updated successfully!' : 'Employee created successfully!', severity: 'success' })
      handleClose()
      fetchEmployees()
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred')
      setSnackbar({ open: true, message: err.response?.data?.message || 'An error occurred', severity: 'error' })
    } finally {
      setSubmitLoading(false)
    }
  }

  const handleDeleteClick = (employee) => {
    setEmployeeToDelete(employee)
    setDeleteConfirmOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!employeeToDelete) return
    
    setDeleteLoading(true)
    setDeleteConfirmOpen(false)
    try {
      await api.delete(`/admin/employees/${employeeToDelete.id}`)
      setSnackbar({ open: true, message: 'Employee deleted successfully!', severity: 'success' })
      fetchEmployees()
    } catch (error) {
      console.error('Error deleting employee:', error)
      setSnackbar({ open: true, message: 'Failed to delete employee', severity: 'error' })
    } finally {
      setDeleteLoading(false)
      setEmployeeToDelete(null)
    }
  }

  const handleDeleteCancel = () => {
    setDeleteConfirmOpen(false)
    setEmployeeToDelete(null)
  }

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false })
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
                Avatar
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
                <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                  <CircularProgress size={40} />
                  <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary' }}>
                    Loading employees...
                  </Typography>
                </TableCell>
              </TableRow>
            ) : employees.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  No employees found
                </TableCell>
              </TableRow>
            ) : (
              employees.map((employee, index) => (
                <TableRow 
                  key={employee.id}
                  sx={{
                    animation: `fadeIn 0.3s ease-out ${index * 0.05}s both`,
                    '@keyframes fadeIn': {
                      from: {
                        opacity: 0,
                        transform: 'translateY(10px)',
                      },
                      to: {
                        opacity: 1,
                        transform: 'translateY(0)',
                      },
                    },
                    '&:hover': {
                      backgroundColor: 'action.hover',
                      transition: 'background-color 0.2s ease-in-out',
                    },
                  }}
                >
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
                    <Avatar 
                      src={employee.avatar || employee.image || ''} 
                      alt={`${employee.first_name} ${employee.last_name}`}
                      sx={{ 
                        width: 40, 
                        height: 40,
                        transition: 'transform 0.2s ease-in-out',
                        '&:hover': {
                          transform: 'scale(1.1)',
                        },
                      }}
                    >
                      {employee.first_name?.[0]?.toUpperCase() || 'N'}
                    </Avatar>
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
                        sx={{ 
                          padding: { xs: '4px', sm: '8px' },
                          transition: 'transform 0.2s ease-in-out',
                          '&:hover': {
                            transform: 'scale(1.1)',
                          }
                        }}
                      >
                        <EditIcon fontSize={isMobile ? "small" : "medium"} />
                      </IconButton>
                      <IconButton
                        size={isMobile ? "small" : "medium"}
                        onClick={() => handleDeleteClick(employee)}
                        color="error"
                        disabled={deleteLoading}
                        sx={{ 
                          padding: { xs: '4px', sm: '8px' },
                          transition: 'transform 0.2s ease-in-out',
                          '&:hover': {
                            transform: 'scale(1.1)',
                          }
                        }}
                      >
                        {deleteLoading && employee.id === employeeToDelete?.id ? (
                          <CircularProgress size={20} color="error" />
                        ) : (
                          <DeleteIcon fontSize={isMobile ? "small" : "medium"} />
                        )}
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
        TransitionComponent={Fade}
        TransitionProps={{ timeout: 300 }}
        PaperProps={{
          sx: {
            animation: 'slideIn 0.3s ease-out',
            '@keyframes slideIn': {
              from: {
                opacity: 0,
                transform: 'translateY(-20px) scale(0.95)',
              },
              to: {
                opacity: 1,
                transform: 'translateY(0) scale(1)',
              },
            },
          },
        }}
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
            type={showPin ? 'text' : 'password'}
            value={formData.pin4}
            onChange={(e) => setFormData({ ...formData, pin4: e.target.value })}
            inputProps={{ maxLength: 4 }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle password visibility"
                    onClick={() => setShowPin(!showPin)}
                    edge="end"
                  >
                    {showPin ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{ mb: 2 }}
          />
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" sx={{ mb: 1 }}>
              Profile Photo
            </Typography>
            {avatarPreview && (
              <Avatar 
                src={avatarPreview} 
                alt="Avatar preview"
                sx={{ width: 80, height: 80, mb: 2 }}
              />
            )}
            <Button
              variant="outlined"
              component="label"
              fullWidth
              sx={{ mb: 1 }}
            >
              {avatarFile ? 'Change Photo' : 'Upload Photo'}
              <input
                type="file"
                hidden
                accept="image/*"
                onChange={handleFileChange}
              />
            </Button>
            {!avatarFile && formData.image && (
              <TextField
                margin="dense"
                label="Or enter Image URL"
                fullWidth
                variant="outlined"
                value={formData.image}
                onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                size="small"
              />
            )}
          </Box>
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
            disabled={submitLoading}
            sx={{ minWidth: { xs: '80px', sm: '100px' } }}
          >
            {submitLoading ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              editingItem ? 'Update' : 'Create'
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={handleDeleteCancel}
        TransitionComponent={Fade}
        TransitionProps={{ timeout: 200 }}
        PaperProps={{
          sx: {
            borderRadius: 2,
            minWidth: { xs: '280px', sm: '400px' },
          },
        }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, pb: 1 }}>
          <WarningIcon color="error" />
          <Typography variant="h6" component="span">
            Confirm Delete
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete <strong>{employeeToDelete?.first_name} {employeeToDelete?.last_name}</strong>? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button 
            onClick={handleDeleteCancel}
            disabled={deleteLoading}
            sx={{ minWidth: '100px' }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleDeleteConfirm}
            variant="contained"
            color="error"
            disabled={deleteLoading}
            sx={{ minWidth: '100px' }}
          >
            {deleteLoading ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              'Delete'
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        TransitionComponent={Grow}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          variant="filled"
          sx={{ 
            minWidth: '300px',
            animation: 'slideInRight 0.3s ease-out',
            '@keyframes slideInRight': {
              from: {
                transform: 'translateX(100%)',
                opacity: 0,
              },
              to: {
                transform: 'translateX(0)',
                opacity: 1,
              },
            },
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Backdrop loader for delete operations */}
      <Backdrop
        sx={{ 
          color: '#fff', 
          zIndex: (theme) => theme.zIndex.drawer + 1,
          backdropFilter: 'blur(4px)',
        }}
        open={deleteLoading}
      >
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress color="inherit" size={60} />
          <Typography variant="h6" sx={{ mt: 2 }}>
            Deleting employee...
          </Typography>
        </Box>
      </Backdrop>
    </Box>
  )
}



