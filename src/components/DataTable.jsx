import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  TablePagination,
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import { Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material'
import { useState } from 'react'

export default function DataTable({
  title,
  columns,
  data,
  loading,
  onAdd,
  onEdit,
  onDelete,
  onPageChange,
  onRowsPerPageChange,
  page,
  rowsPerPage,
  total,
  renderRow,
  formFields,
  initialFormData,
}) {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const [openDialog, setOpenDialog] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [formData, setFormData] = useState(initialFormData || {})
  const [error, setError] = useState('')

  const handleOpenAdd = () => {
    setEditingItem(null)
    setFormData(initialFormData || {})
    setError('')
    setOpenDialog(true)
  }

  const handleOpenEdit = (item) => {
    setEditingItem(item)
    setFormData(item)
    setError('')
    setOpenDialog(true)
  }

  const handleClose = () => {
    setOpenDialog(false)
    setEditingItem(null)
    setFormData(initialFormData || {})
    setError('')
  }

  const handleSubmit = async () => {
    setError('')
    try {
      if (editingItem) {
        await onEdit(editingItem.id, formData)
      } else {
        await onAdd(formData)
      }
      handleClose()
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred')
    }
  }

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
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
          component="h2"
          sx={{ 
            fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' },
            fontWeight: { xs: 600, sm: 700 }
          }}
        >
          {title}
        </Typography>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />} 
          onClick={handleOpenAdd}
          fullWidth={isMobile}
          size={isMobile ? "medium" : "large"}
        >
          Add New
        </Button>
      </Box>

      <TableContainer 
        component={Paper}
        sx={{
          overflowX: 'auto',
          maxWidth: '100%',
          '&::-webkit-scrollbar': {
            height: '8px',
          },
          '&::-webkit-scrollbar-track': {
            backgroundColor: 'rgba(0,0,0,0.1)',
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: 'rgba(0,0,0,0.3)',
            borderRadius: '4px',
          },
        }}
      >
        <Table sx={{ minWidth: { xs: 600, sm: 650 } }}>
          <TableHead>
            <TableRow>
              {columns.map((col) => (
                <TableCell 
                  key={col.field} 
                  sx={{ 
                    whiteSpace: { xs: 'nowrap', sm: 'normal' },
                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                    fontWeight: 600,
                    py: { xs: 1, sm: 1.5 }
                  }}
                >
                  {col.label}
                </TableCell>
              ))}
              <TableCell 
                sx={{ 
                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                  fontWeight: 600,
                  py: { xs: 1, sm: 1.5 }
                }}
              >
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={columns.length + 1} align="center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length + 1} align="center">
                  No data available
                </TableCell>
              </TableRow>
            ) : (
              data.map((item) => (
                <TableRow key={item.id}>
                  {renderRow ? (
                    renderRow(item)
                  ) : (
                    columns.map((col) => (
                      <TableCell 
                        key={col.field}
                        sx={{ 
                          fontSize: { xs: '0.75rem', sm: '0.875rem' },
                          py: { xs: 1, sm: 1.5 }
                        }}
                      >
                        {col.render ? col.render(item[col.field], item) : item[col.field]}
                      </TableCell>
                    ))
                  )}
                  <TableCell sx={{ py: { xs: 1, sm: 1.5 } }}>
                    <Box sx={{ display: 'flex', gap: { xs: 0.5, sm: 1 } }}>
                      <IconButton 
                        size={isMobile ? "small" : "medium"} 
                        onClick={() => handleOpenEdit(item)}
                        aria-label="edit"
                        sx={{ 
                          padding: { xs: '4px', sm: '8px' }
                        }}
                      >
                        <EditIcon fontSize={isMobile ? "small" : "medium"} />
                      </IconButton>
                      <IconButton 
                        size={isMobile ? "small" : "medium"} 
                        onClick={() => onDelete(item.id)} 
                        color="error"
                        aria-label="delete"
                        sx={{ 
                          padding: { xs: '4px', sm: '8px' }
                        }}
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
        onPageChange={(e, newPage) => onPageChange(newPage)}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={(e) => onRowsPerPageChange(parseInt(e.target.value, 10))}
        rowsPerPageOptions={[5, 10, 25, 50]}
        labelRowsPerPage={isMobile ? "Rows:" : "Rows per page:"}
        sx={{
          overflowX: 'auto',
          '& .MuiTablePagination-toolbar': {
            flexWrap: { xs: 'wrap', sm: 'nowrap' },
          },
        }}
      />

      <Dialog 
        open={openDialog} 
        onClose={handleClose} 
        maxWidth="sm" 
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle>{editingItem ? 'Edit' : 'Add'} {title}</DialogTitle>
        <DialogContent sx={{ pt: { xs: 2, sm: 3 } }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          {formFields.map((field) => (
            <TextField
              key={field.name}
              margin="dense"
              label={field.label}
              type={field.type || 'text'}
              fullWidth
              variant="outlined"
              value={formData[field.name] || ''}
              onChange={(e) => handleChange(field.name, e.target.value)}
              required={field.required}
              select={field.type === 'select'}
              multiline={field.multiline}
              rows={field.rows}
              sx={{ 
                mb: 2,
                '& .MuiInputBase-root': {
                  fontSize: { xs: '0.875rem', sm: '1rem' }
                }
              }}
            >
              {field.options?.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </TextField>
          ))}
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


