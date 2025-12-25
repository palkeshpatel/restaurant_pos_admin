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

export default function Decisions() {
  const [decisions, setDecisions] = useState([])
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
  })
  const [error, setError] = useState('')
  const isMountedRef = useRef(true)
  const fetchDecisionsInProgressRef = useRef(false)
  const fetchGroupsInProgressRef = useRef(false)

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  const fetchDecisions = async () => {
    if (fetchDecisionsInProgressRef.current) {
      return
    }
    
    fetchDecisionsInProgressRef.current = true
    setLoading(true)
    try {
      const response = await api.get('/admin/decisions', {
        params: {
          page: page + 1,
          per_page: rowsPerPage,
        },
      })
      const data = response.data.data || []
      if (isMountedRef.current) {
        setDecisions(Array.isArray(data) ? data : [])
        setTotal(Array.isArray(data) ? data.length : 0)
      }
    } catch (error) {
      console.error('Error fetching decisions:', error)
      if (isMountedRef.current) {
        setDecisions([])
        setTotal(0)
      }
    } finally {
      fetchDecisionsInProgressRef.current = false
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
      const response = await api.get('/admin/decision-groups')
      const data = response.data.data || []
      if (isMountedRef.current) {
        setGroups(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error('Error fetching decision groups:', error)
      if (isMountedRef.current) {
        setGroups([])
      }
    } finally {
      fetchGroupsInProgressRef.current = false
    }
  }

  useEffect(() => {
    if (isMountedRef.current && !fetchDecisionsInProgressRef.current) {
      fetchDecisions()
    }
    if (isMountedRef.current && !fetchGroupsInProgressRef.current) {
      fetchGroups()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, rowsPerPage])

  const handleOpenAdd = () => {
    setEditingItem(null)
    setFormData({ group_id: '', name: '' })
    setError('')
    setOpenDialog(true)
  }

  const handleOpenEdit = (item) => {
    setEditingItem(item)
    setFormData({
      group_id: item.group_id || '',
      name: item.name || '',
    })
    setError('')
    setOpenDialog(true)
  }

  const handleClose = () => {
    setOpenDialog(false)
    setEditingItem(null)
    setFormData({ group_id: '', name: '' })
    setError('')
  }

  const handleSubmit = async () => {
    setError('')
    try {
      if (editingItem) {
        await api.put(`/admin/decisions/${editingItem.id}`, formData)
      } else {
        await api.post('/admin/decisions', formData)
      }
      handleClose()
      fetchDecisions()
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred')
    }
  }

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this decision?')) {
      try {
        await api.delete(`/admin/decisions/${id}`)
        fetchDecisions()
      } catch (error) {
        console.error('Error deleting decision:', error)
        alert('Failed to delete decision')
      }
    }
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4">Decisions</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenAdd}>
          Add New Decision
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Group</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : decisions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  No decisions found
                </TableCell>
              </TableRow>
            ) : (
              decisions.map((decision) => (
                <TableRow key={decision.id}>
                  <TableCell>{decision.id}</TableCell>
                  <TableCell>{decision.name}</TableCell>
                  <TableCell>{decision.group?.name || 'N/A'}</TableCell>
                  <TableCell>
                    <IconButton size="small" onClick={() => handleOpenEdit(decision)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleDelete(decision.id)} color="error">
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
        <DialogTitle>{editingItem ? 'Edit' : 'Add'} Decision</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <FormControl fullWidth sx={{ mb: 2, mt: 2 }}>
            <InputLabel>Decision Group</InputLabel>
            <Select
              value={formData.group_id}
              label="Decision Group"
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

