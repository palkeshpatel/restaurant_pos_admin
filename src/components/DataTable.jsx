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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <h2>{title}</h2>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenAdd}>
          Add New
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              {columns.map((col) => (
                <TableCell key={col.field}>{col.label}</TableCell>
              ))}
              <TableCell>Actions</TableCell>
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
                      <TableCell key={col.field}>
                        {col.render ? col.render(item[col.field], item) : item[col.field]}
                      </TableCell>
                    ))
                  )}
                  <TableCell>
                    <IconButton size="small" onClick={() => handleOpenEdit(item)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton size="small" onClick={() => onDelete(item.id)} color="error">
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
        onPageChange={(e, newPage) => onPageChange(newPage)}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={(e) => onRowsPerPageChange(parseInt(e.target.value, 10))}
        rowsPerPageOptions={[5, 10, 25, 50]}
      />

      <Dialog open={openDialog} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>{editingItem ? 'Edit' : 'Add'} {title}</DialogTitle>
        <DialogContent>
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
              sx={{ mb: 2 }}
            >
              {field.options?.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </TextField>
          ))}
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


