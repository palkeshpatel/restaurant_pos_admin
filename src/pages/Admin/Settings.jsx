'use client'

import { useState, useEffect, useRef } from 'react'
import {
  Box,
  Typography,
  Button,
  TextField,
  Paper,
  Alert,
  CircularProgress,
  Grid,
  Card,
  CardContent,
  InputAdornment,
  IconButton,
  CardActions,
} from '@mui/material'
import { Save as SaveIcon, Edit as EditIcon, Cancel as CancelIcon } from '@mui/icons-material'
import api from '../../services/api'

export default function Settings() {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState({ tax: false, fee: false, gratuity: false })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [editing, setEditing] = useState({ tax: false, fee: false, gratuity: false })
  const [config, setConfig] = useState({
    tax: { value: '0.00' },
    fee: { value: '0.00' },
    gratuity: { value: '0.00' },
  })
  const [formData, setFormData] = useState({
    tax_value: '0.00',
    fee_value: '0.00',
    gratuity_value: '0.00',
  })
  const [originalValues, setOriginalValues] = useState({
    tax_value: '0.00',
    fee_value: '0.00',
    gratuity_value: '0.00',
  })
  const isMountedRef = useRef(true)
  const fetchInProgressRef = useRef(false)

  useEffect(() => {
    isMountedRef.current = true
    fetchConfig()
    return () => {
      isMountedRef.current = false
    }
  }, [])

  const fetchConfig = async () => {
    if (fetchInProgressRef.current) {
      return
    }

    fetchInProgressRef.current = true
    setLoading(true)
    setError('')
    try {
      const response = await api.get('/admin/settings/config')
      if (isMountedRef.current) {
        const data = response.data.data || response.data
        setConfig(data)
        const newFormData = {
          tax_value: data.tax?.value || '0.00',
          fee_value: data.fee?.value || '0.00',
          gratuity_value: data.gratuity?.value || '0.00',
        }
        setFormData(newFormData)
        setOriginalValues(newFormData)
      }
    } catch (error) {
      console.error('Error fetching config:', error)
      if (isMountedRef.current) {
        setError(error.response?.data?.message || 'Failed to load configuration')
      }
    } finally {
      fetchInProgressRef.current = false
      if (isMountedRef.current) {
        setLoading(false)
      }
    }
  }

  const handleInputChange = (field, value) => {
    // Allow only numbers and one decimal point
    const numericValue = value.replace(/[^0-9.]/g, '')
    // Ensure only one decimal point
    const parts = numericValue.split('.')
    const formattedValue = parts.length > 2 
      ? parts[0] + '.' + parts.slice(1).join('')
      : numericValue

    setFormData((prev) => ({
      ...prev,
      [field]: formattedValue,
    }))
  }

  const handleEdit = (field) => {
    setEditing((prev) => ({ ...prev, [field]: true }))
    setOriginalValues((prev) => ({ ...prev, [`${field}_value`]: formData[`${field}_value`] }))
  }

  const handleCancel = (field) => {
    setEditing((prev) => ({ ...prev, [field]: false }))
    setFormData((prev) => ({
      ...prev,
      [`${field}_value`]: originalValues[`${field}_value`],
    }))
  }

  const handleSaveField = async (field) => {
    setSaving((prev) => ({ ...prev, [field]: true }))
    setError('')
    setSuccess('')

    try {
      const fieldValue = parseFloat(formData[`${field}_value`])

      // Validate based on field type
      if (field === 'tax') {
        if (isNaN(fieldValue) || fieldValue < 0 || fieldValue > 100) {
          setError('Tax value must be between 0 and 100')
          setSaving((prev) => ({ ...prev, [field]: false }))
          return
        }
      } else {
        if (isNaN(fieldValue) || fieldValue < 0) {
          setError(`${field.charAt(0).toUpperCase() + field.slice(1)} value must be 0 or greater`)
          setSaving((prev) => ({ ...prev, [field]: false }))
          return
        }
      }

      // Get current config values
      const currentConfig = {
        tax_value: field === 'tax' ? fieldValue : parseFloat(config.tax?.value || '0.00'),
        fee_value: field === 'fee' ? fieldValue : parseFloat(config.fee?.value || '0.00'),
        gratuity_value: field === 'gratuity' ? fieldValue : parseFloat(config.gratuity?.value || '0.00'),
      }

      const response = await api.put('/admin/settings/config', currentConfig)

      if (isMountedRef.current) {
        const data = response.data.data || response.data
        setConfig(data)
        const newFormData = {
          tax_value: data.tax?.value || '0.00',
          fee_value: data.fee?.value || '0.00',
          gratuity_value: data.gratuity?.value || '0.00',
        }
        setFormData(newFormData)
        setOriginalValues(newFormData)
        setEditing((prev) => ({ ...prev, [field]: false }))
        setSuccess(`${field.charAt(0).toUpperCase() + field.slice(1)} updated successfully!`)
        setTimeout(() => setSuccess(''), 3000)
      }
    } catch (error) {
      console.error(`Error updating ${field}:`, error)
      if (isMountedRef.current) {
        setError(error.response?.data?.message || `Failed to update ${field}`)
      }
    } finally {
      if (isMountedRef.current) {
        setSaving((prev) => ({ ...prev, [field]: false }))
      }
    }
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    )
  }

  const renderCard = (field, title, description, label, helperText, adornment, adornmentPosition = 'end') => {
    const isEditing = editing[field]
    const isSaving = saving[field]

    return (
      <Grid item xs={12} md={4} key={field}>
        <Card elevation={2}>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
              <Typography variant="h6" fontWeight="bold" color="primary">
                {title}
              </Typography>
              {!isEditing && (
                <IconButton
                  color="primary"
                  onClick={() => handleEdit(field)}
                  size="small"
                  aria-label={`Edit ${title}`}
                >
                  <EditIcon />
                </IconButton>
              )}
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {description}
            </Typography>
            <TextField
              fullWidth
              label={label}
              value={formData[`${field}_value`]}
              onChange={(e) => handleInputChange(`${field}_value`, e.target.value)}
              disabled={!isEditing}
              InputProps={{
                [adornmentPosition === 'start' ? 'startAdornment' : 'endAdornment']: (
                  <InputAdornment position={adornmentPosition}>{adornment}</InputAdornment>
                ),
              }}
              type="text"
              inputProps={{
                inputMode: 'decimal',
                pattern: '[0-9]*\\.?[0-9]*',
              }}
              helperText={helperText}
            />
          </CardContent>
          {isEditing && (
            <CardActions sx={{ justifyContent: 'flex-end', px: 2, pb: 2 }}>
              <IconButton
                color="default"
                onClick={() => handleCancel(field)}
                disabled={isSaving}
                aria-label="Cancel"
              >
                <CancelIcon />
              </IconButton>
              <IconButton
                color="primary"
                onClick={() => handleSaveField(field)}
                disabled={isSaving}
                aria-label="Save"
              >
                {isSaving ? (
                  <CircularProgress size={20} color="primary" />
                ) : (
                  <SaveIcon />
                )}
              </IconButton>
            </CardActions>
          )}
        </Card>
      </Grid>
    )
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1" fontWeight="bold">
          Settings
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      <Grid container spacing={3}>
        {renderCard(
          'tax',
          'Tax Value',
          'Tax rate percentage for food items (0-100%)',
          'Tax Rate (%)',
          'Enter tax percentage (e.g., 5.00 for 5%)',
          '%',
          'end'
        )}
        {renderCard(
          'fee',
          'Fee Value',
          'Fixed fee amount applied to orders',
          'Fee Amount',
          'Enter fee amount (e.g., 2.00)',
          '$',
          'start'
        )}
        {renderCard(
          'gratuity',
          'Gratuity Value',
          'Gratuity percentage applied to orders',
          'Gratuity Rate (%)',
          'Enter gratuity percentage (e.g., 10.00 for 10%)',
          '%',
          'end'
        )}
      </Grid>
    </Box>
  )
}

