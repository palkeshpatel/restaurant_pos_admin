import { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Paper,
  Button,
  Grid,
  CircularProgress,
  Alert,
} from '@mui/material'
import { Visibility as ViewIcon, Download as DownloadIcon } from '@mui/icons-material'
import DatePicker from '../../components/DatePicker'
import api from '../../services/api'

export default function DailySummaryReport() {
  const [selectedDate, setSelectedDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [reportData, setReportData] = useState(null)

  const fetchReport = async () => {
    if (!selectedDate) return
    
    setLoading(true)
    setError(null)
    try {
      const response = await api.get('/admin/reports/daily-summary', {
        params: {
          date: selectedDate,
          format: 'json',
        },
      })
      setReportData(response.data.data)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch report')
      console.error('Error fetching report:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadPDF = async () => {
    if (!selectedDate) return
    
    try {
      setLoading(true)
      const response = await api.get('/admin/reports/daily-summary', {
        params: {
          date: selectedDate,
          format: 'pdf',
        },
        responseType: 'blob',
      })
      
      // Create blob link to download
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `daily-summary-report-${selectedDate}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      setError('Failed to download PDF')
      console.error('Error downloading PDF:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDateChange = (e) => {
    setSelectedDate(e.target.value)
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Daily Summary Report
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2} alignItems="stretch">
          <Grid item xs={12} sm={4}>
            <DatePicker
              label="Select Date"
              value={selectedDate}
              onChange={handleDateChange}
              fullWidth
              maxDate={(() => {
                const today = new Date()
                const year = today.getFullYear()
                const month = String(today.getMonth() + 1).padStart(2, '0')
                const day = String(today.getDate()).padStart(2, '0')
                return `${year}-${month}-${day}`
              })()}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <Button
              variant="contained"
              onClick={fetchReport}
              disabled={loading || !selectedDate}
              fullWidth
              size="large"
              startIcon={loading ? <CircularProgress size={20} /> : <ViewIcon />}
              sx={{ height: '100%' }}
            >
              {loading ? 'Loading...' : 'View Report'}
            </Button>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Button
              variant="outlined"
              onClick={handleDownloadPDF}
              disabled={loading || !selectedDate}
              fullWidth
              size="large"
              startIcon={<DownloadIcon />}
              sx={{ height: '100%' }}
            >
              Download PDF
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}


      {reportData && (
        <Paper sx={{ p: 3 }}>
          {!reportData.has_activity ? (
            <Box
              sx={{
                textAlign: 'center',
                py: 8,
                px: 2,
              }}
            >
              <Typography
                variant="h6"
                sx={{
                  color: 'text.secondary',
                  mb: 1,
                  fontWeight: 500,
                }}
              >
                No orders completed on that day
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: 'text.disabled',
                }}
              >
                Please select a different date to view the report.
              </Typography>
            </Box>
          ) : reportData.html_view ? (
            <Box
              dangerouslySetInnerHTML={{ __html: reportData.html_view }}
              sx={{
                '& table': {
                  width: '100%',
                  borderCollapse: 'collapse',
                },
                '& th, & td': {
                  border: '1px solid #ddd',
                  padding: '8px',
                  textAlign: 'left',
                },
                '& th': {
                  backgroundColor: '#f0f0f0',
                  fontWeight: 'bold',
                },
              }}
            />
          ) : (
            <Typography>No report data available</Typography>
          )}
        </Paper>
      )}
    </Box>
  )
}

