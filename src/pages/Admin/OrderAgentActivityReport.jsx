import { useState, useEffect, useRef } from 'react'
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

// Load Chart.js script
const loadChartJS = () => {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('Window is not defined'))
      return
    }

    if (window.Chart) {
      resolve(window.Chart)
      return
    }

    const script = document.createElement('script')
    script.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js'
    script.async = true
    script.onload = () => {
      if (window.Chart) {
        resolve(window.Chart)
      } else {
        reject(new Error('Chart.js failed to load'))
      }
    }
    script.onerror = () => reject(new Error('Failed to load Chart.js'))
    document.head.appendChild(script)
  })
}

export default function OrderAgentActivityReport() {
  const [selectedDate, setSelectedDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [reportData, setReportData] = useState(null)
  const chartInstanceRef = useRef(null)
  const chartContainerRef = useRef(null)

  const fetchReport = async () => {
    if (!selectedDate) return
    
    setLoading(true)
    setError(null)
    try {
      const response = await api.get('/admin/reports/order-agent-activity', {
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
      const response = await api.get('/admin/reports/order-agent-activity', {
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
      link.setAttribute('download', `order-agent-activity-report-${selectedDate}.pdf`)
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

  // Initialize chart after HTML is rendered
  useEffect(() => {
    if (!reportData || !reportData.has_activity || !reportData.employee_activity) {
      return
    }

    const initChart = async () => {
      try {
        const Chart = await loadChartJS()
        
        // Destroy existing chart if any
        if (chartInstanceRef.current) {
          chartInstanceRef.current.destroy()
          chartInstanceRef.current = null
        }

        // Wait a bit for the HTML to be rendered
        setTimeout(() => {
          const canvas = document.getElementById('timeSpentChart')
          if (!canvas) {
            console.error('Canvas element not found')
            return
          }

          const employeeData = reportData.employee_activity
          if (!employeeData || employeeData.length === 0) {
            return
          }

          const chartLabels = employeeData.map(emp => emp.employee_name)
          const chartData = employeeData.map(emp => parseFloat(emp.total_time_minutes) || 0)

          const colors = [
            '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
            '#FF9F40', '#FF6384', '#C9CBCF', '#4BC0C0', '#FF6384'
          ]
          const backgroundColors = chartLabels.map((_, index) => colors[index % colors.length])

          const ctx = canvas.getContext('2d')
          chartInstanceRef.current = new Chart(ctx, {
            type: 'pie',
            data: {
              labels: chartLabels,
              datasets: [{
                data: chartData,
                backgroundColor: backgroundColors,
                borderColor: '#fff',
                borderWidth: 2
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                title: {
                  display: true,
                  text: 'Time Spent by Employee (Minutes)',
                  font: {
                    size: 14,
                    weight: 'bold'
                  }
                },
                legend: {
                  position: 'right',
                  labels: {
                    font: {
                      size: 11
                    },
                    generateLabels: function(chart) {
                      const data = chart.data
                      if (data.labels.length && data.datasets.length) {
                        return data.labels.map((label, i) => {
                          const value = data.datasets[0].data[i]
                          const total = data.datasets[0].data.reduce((a, b) => a + b, 0)
                          const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0
                          return {
                            text: label + ' (' + percentage + '%)',
                            fillStyle: data.datasets[0].backgroundColor[i],
                            hidden: false,
                            index: i
                          }
                        })
                      }
                      return []
                    }
                  }
                },
                tooltip: {
                  callbacks: {
                    label: function(context) {
                      const label = context.label || ''
                      const value = context.parsed || 0
                      const total = context.dataset.data.reduce((a, b) => a + b, 0)
                      const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0
                      const hours = (value / 60).toFixed(2)
                      return label + ': ' + value + ' min (' + hours + ' hrs) - ' + percentage + '%'
                    }
                  }
                }
              }
            }
          })
        }, 500)
      } catch (err) {
        console.error('Error initializing chart:', err)
      }
    }

    initChart()

    // Cleanup on unmount
    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy()
        chartInstanceRef.current = null
      }
    }
  }, [reportData])

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Order Agent Activity Summary Report
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
                No order activity found for that day
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

