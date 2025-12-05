import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Users, 
  UserPlus, 
  Calendar, 
  TrendingUp, 
  Shield, 
  Activity,
  BarChart3,
  PieChart,
  LineChart,
  LogOut,
  Eye,
  User,
  FileText,
  Heart,
  GraduationCap,
  Home,
  Clock,
  DollarSign,
  RefreshCw
} from 'lucide-react'
import { apiFetch } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { useToast } from '@/hooks/use-toast'
import { RejectionDialog } from '@/components/RejectionDialog'
import { ThemeToggle } from '@/components/ThemeToggle'
import { Logo } from '@/components/Logo'

// Lightweight charts (no external deps)
function DonutChart({ segments, size = 140, thickness = 22, centerLabel, onSegmentClick }: {
  segments: { color: string; value: number; id?: string }[]
  size?: number
  thickness?: number
  centerLabel?: { top?: string; bottom?: string }
  onSegmentClick?: (segmentId: string | number, event: React.MouseEvent<SVGPathElement>) => void
}) {
  // Filter out segments with zero values and ensure we have valid data
  const validSegments = segments.filter(seg => seg.value > 0)
  const total = validSegments.reduce((s, seg) => s + seg.value, 0)
  
  // Debug logging
  console.log('DonutChart input segments:', segments)
  console.log('DonutChart valid segments:', validSegments)
  console.log('DonutChart total:', total)
  
  // If no valid segments, show empty chart
  if (total === 0) {
    const canvas = size + thickness + 10
    const radius = canvas / 2
    const r = Math.max(0, radius - thickness / 2 - 2)
    
    return (
      <div className="relative inline-block" style={{ width: canvas, height: canvas }}>
        <svg width={canvas} height={canvas} style={{ overflow: 'visible' }}>
          <circle cx={radius} cy={radius} r={r} stroke="#e5e7eb" strokeWidth={thickness} fill="none" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          {centerLabel?.top && <div className="text-xs text-muted-foreground">{centerLabel.top}</div>}
          {centerLabel?.bottom && <div className="text-base font-semibold">{centerLabel.bottom}</div>}
        </div>
      </div>
    )
  }
  
  let current = 0
  // Expand canvas to ensure no clipping even with round caps
  const canvas = size + thickness + 10
  const radius = canvas / 2
  // Use stroke radius inset by half thickness + small padding
  const r = Math.max(0, radius - thickness / 2 - 2)

  const describeArc = (start: number, end: number) => {
    const startAngle = (start / total) * 2 * Math.PI - Math.PI / 2
    const endAngle = (end / total) * 2 * Math.PI - Math.PI / 2
    const x1 = radius + r * Math.cos(startAngle)
    const y1 = radius + r * Math.sin(startAngle)
    const x2 = radius + r * Math.cos(endAngle)
    const y2 = radius + r * Math.sin(endAngle)
    
    // For full circle, use a different approach
    if (Math.abs(end - start - total) < 0.001) {
      return `M ${x1} ${y1} A ${r} ${r} 0 1 1 ${x1} ${y1}`
    }
    
    const largeArc = end - start > total / 2 ? 1 : 0
    return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`
  }

  return (
    <div className="relative inline-block" style={{ width: canvas, height: canvas }}>
      <svg width={canvas} height={canvas} style={{ overflow: 'visible' }}>
        {/* Track */}
        <circle cx={radius} cy={radius} r={r} stroke="#e5e7eb" strokeWidth={thickness} fill="none" />
        {validSegments.length === 1 ? (
          <circle
            cx={radius}
            cy={radius}
            r={r}
            stroke={validSegments[0].color}
            strokeWidth={thickness}
            fill="none"
            strokeLinecap="round"
            onClick={onSegmentClick ? (e) => onSegmentClick(validSegments[0].id ?? 0, e as any) : undefined}
            style={{ cursor: onSegmentClick ? 'pointer' as const : 'default' }}
          />
        ) : validSegments.map((seg, idx) => {
          const start = current
          const segLen = seg.value
          current += segLen
          
          // For single segment, ensure it covers the full circle
          let end
          if (validSegments.length === 1) {
            end = total // Full circle for single segment
          } else {
            // Add a tiny overlap except on the last segment to avoid visible seams
            const epsilon = total * 0.002
            end = Math.min(total, start + segLen + (idx < validSegments.length - 1 ? epsilon : 0))
          }
          
          return (
            <path
              key={idx}
              d={describeArc(start, end)}
              stroke={seg.color}
              strokeWidth={thickness}
              fill="none"
              strokeLinecap="round"
              onClick={onSegmentClick ? (e) => onSegmentClick(seg.id ?? idx, e) : undefined}
              style={{ cursor: onSegmentClick ? 'pointer' as const : 'default' }}
            />
          )
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
        {centerLabel?.top && <div className="text-xs text-muted-foreground">{centerLabel.top}</div>}
        {centerLabel?.bottom && <div className="text-base font-semibold">{centerLabel.bottom}</div>}
      </div>
    </div>
  )
}

function MiniBarChart({ data, height = 160 }: { data: { label: string; value: number }[]; height?: number }) {
  const max = Math.max(1, ...data.map(d => d.value))
  const barArea = Math.max(60, height - 32) // leave room for labels
  return (
    <div className="w-full" style={{ height }}>
      <div className="relative" style={{ height: barArea }}>
        <div className="absolute inset-0 flex items-end gap-3 px-2">
          {data.map((d, i) => (
            <div key={i} className="flex-1 flex flex-col items-center justify-end">
              <div
                className="w-full bg-primary/20 rounded-t"
                style={{ 
                  height: `${(d.value / max) * 100}%`, 
                  minHeight: d.value > 0 ? '6px' : undefined 
                }}
                title={`${d.label}: ${d.value}`}
              />
              <div className="-mt-5 text-[10px] font-medium select-none">
                {d.value}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="flex gap-3 px-2 mt-2">
        {data.map((d, i) => (
          <div key={i} className="flex-1 text-xs text-muted-foreground truncate text-center">
            {d.label}
          </div>
        ))}
      </div>
    </div>
  )
}

interface UserStats {
  totalUsers: number
  totalAdmins: number
  totalRegularUsers: number
  usersThisMonth: number
  usersThisWeek: number
  recentRegistrations: Array<{
    id: string
    username: string
    email: string
    role: string
    createdAt: string
  }>
}

interface UserProfile {
  id: string
  username: string
  email: string
  role: string
  createdAt: string
  profile?: {
    personalDetails?: any
    family?: any
    education?: any
    medical?: any
    others?: any
    leaveData?: any
    salaryData?: any
    updatedAt?: string
  }
}

// Admin request rows shown in Requests tab
interface AdminRequestRow {
  id: string
  type: 'LEAVE' | 'OUTPASS' | 'SALARY' | 'PROFILE_UPDATE'
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  data: any
  adminRemark?: string
  managerResponse?: string
  createdAt: string
  updatedAt: string
  requester?: { id: string; username: string; email: string; role: string }
  targetUser?: { id: string; username: string; email: string; armyNumber?: string; role: string } | null
}

// Pretty summary for request payloads (no raw JSON)
function RequestSummary({ r }: { r: AdminRequestRow }) {
  const d = r.data || {}
  
  return (
    <div className="space-y-2">
      {r.targetUser && (
        <div className="text-xs bg-blue-500/10 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 px-2 py-1 rounded border border-blue-500/30 dark:border-blue-500/50">
          <strong>Request for:</strong> {r.targetUser.username} 
          {r.targetUser.armyNumber && ` • Army Number: ${r.targetUser.armyNumber}`}
        </div>
      )}
      
      {r.status === 'REJECTED' && r.adminRemark && (
        <div className="text-xs bg-destructive/10 dark:bg-destructive/20 text-destructive dark:text-destructive-foreground px-2 py-1 rounded border border-destructive/30 dark:border-destructive/50">
          <strong>Admin Remark:</strong> {r.adminRemark}
        </div>
      )}
      
      {r.status === 'PENDING' && r.managerResponse && (
        <div className="text-xs bg-blue-500/10 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 px-2 py-1 rounded border border-blue-500/30 dark:border-blue-500/50">
          <strong>Manager Response:</strong> {r.managerResponse}
        </div>
      )}
      
      <div>
        {(() => {
          switch (r.type) {
    case 'LEAVE': {
      const leave = d.leave || d
      
      // Calculate days between start and end dates
      const calculateDays = () => {
        if (leave.startDate && leave.endDate) {
          const start = new Date(leave.startDate)
          const end = new Date(leave.endDate)
          const diffTime = end.getTime() - start.getTime()
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1 // +1 to include both start and end days
          return diffDays
        }
        return null
      }
      
      const days = leave.days ?? leave.duration ?? calculateDays()
      
      return (
        <ul className="text-sm leading-6 list-disc list-inside">
          <li>Reason: {leave.reason || '—'}</li>
          <li>Days: {days || '—'}</li>
          {leave.startDate && <li>From: {new Date(leave.startDate).toLocaleDateString()}</li>}
          {leave.endDate && <li>To: {new Date(leave.endDate).toLocaleDateString()}</li>}
        </ul>
      )
    }
    case 'OUTPASS': {
      const out = d.outpass || d
      return (
        <ul className="text-sm leading-6 list-disc list-inside">
          <li>Purpose: {out.purpose || '—'}</li>
          {out.hours != null && <li>Hours: {out.hours}</li>}
          {out.from && <li>From: {out.from}</li>}
          {out.to && <li>To: {out.to}</li>}
        </ul>
      )
    }
    case 'SALARY': {
      const s = d.salary || d
      return (
        <ul className="text-sm leading-6 list-disc list-inside">
          {s.basic != null && <li>Basic: ₹{s.basic}</li>}
          {s.allowance != null && <li>Allowance: ₹{s.allowance}</li>}
          {s.bonus != null && <li>Bonus: ₹{s.bonus}</li>}
        </ul>
      )
    }
    case 'PROFILE_UPDATE': {
      return (
        <ul className="text-sm leading-6 list-disc list-inside">
          <li>Section: {d.section || '—'}</li>
          {d.data && (
            <li>Changes: {Object.keys(d.data).map(k => `${k}: ${String(d.data[k])}`).join(', ')}</li>
          )}
        </ul>
      )
    }
    default:
      return <div className="text-sm text-muted-foreground">No details</div>
  }
        })()}
      </div>
    </div>
  )
}

export default function AdminDashboard() {
  const { toast } = useToast()
  const [stats, setStats] = useState<UserStats | null>(null)
  const [users, setUsers] = useState<UserProfile[]>([])
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null)
  const [activeTab, setActiveTab] = useState("overview")
  const [loading, setLoading] = useState(true)
  const [usersLoading, setUsersLoading] = useState(false)
  const [requests, setRequests] = useState<AdminRequestRow[]>([])
  const [requestsLoading, setRequestsLoading] = useState(false)
  const [allRequests, setAllRequests] = useState<AdminRequestRow[]>([])
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState(Date.now())
  const [segmentModal, setSegmentModal] = useState<{ open: boolean; title: string; users: Array<{ name: string; armyNumber?: string | null }> }>({ open: false, title: '', users: [] })
  const [rejectionDialog, setRejectionDialog] = useState<{ open: boolean; requestId: string | null }>({ open: false, requestId: null })
  const { logout } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    const initializeData = async () => {
      try {
        setLoading(true)
        setError(null)
        // Run all fetches in parallel but handle errors gracefully
        const results = await Promise.allSettled([
          fetchStats(),
          fetchUsers(),
          fetchRequests(),
          fetchAllRequests()
        ])
        
        // Check for any failures
        const failedResults = results.filter(result => result.status === 'rejected')
        if (failedResults.length > 0) {
          console.error('Some API calls failed:', failedResults)
          setError('Some data failed to load. Please refresh the page.')
        }
      } catch (error) {
        console.error('Failed to initialize admin dashboard:', error)
        setError('Failed to load admin dashboard. Please check your connection.')
      } finally {
        setLoading(false)
      }
    }
    
    initializeData()
  }, [])

  const fetchStats = async () => {
    try {
      const data = await apiFetch<UserStats>('/api/admin/stats')
      setStats(data)
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchUsers = async () => {
    setUsersLoading(true)
    try {
      const data = await apiFetch<UserProfile[]>('/api/admin/users')
      setUsers(data)
    } catch (error) {
      console.error('Failed to fetch users:', error)
    } finally {
      setUsersLoading(false)
    }
  }

  // Admin: Requests list
  const fetchRequests = async () => {
    setRequestsLoading(true)
    try {
      const res = await apiFetch<{ ok: boolean; requests: AdminRequestRow[] }>(`/api/admin/requests?status=PENDING`)
      setRequests(res.requests || [])
    } catch (e) {
      console.error('Failed to fetch requests:', e)
    } finally {
      setRequestsLoading(false)
    }
  }

  // All requests (any status) for analytics
  const fetchAllRequests = async () => {
    try {
      const res = await apiFetch<{ ok: boolean; requests: AdminRequestRow[] }>(`/api/admin/requests`)
      setAllRequests(res.requests || [])
    } catch (e) {
      console.error('Failed to fetch all requests:', e)
    }
  }

  useEffect(() => {
    fetchRequests()
  }, [])

  const approveRequest = async (id: string) => {
    try {
      setRefreshing(true)
      
      // Optimistic update - remove from pending requests immediately
      setRequests(prev => prev.filter(r => r.id !== id))
      
      // Show success message immediately
      toast({
        title: "Success!",
        description: "Request approved successfully",
      })
      
      // Make the API call
      await apiFetch(`/api/admin/requests/${id}/approve`, { method: 'POST' })
      
      console.log('Request approved, refreshing data...')
      
      // Refresh all data immediately for real-time updates
      const [requestsResult, statsResult, allRequestsResult] = await Promise.all([
        fetchRequests(),
        fetchStats(),
        fetchAllRequests()
      ])
      
      console.log('Data refresh completed:', {
        requests: requestsResult,
        stats: statsResult,
        allRequests: allRequestsResult
      })
      
      // Force a re-render by updating a timestamp
      setLastUpdate(Date.now())
      setRefreshing(false)
      
    } catch (e) {
      console.error('Approve failed', e)
      // Revert optimistic update on error
      await fetchRequests()
      toast({
        title: "Error",
        description: "Failed to approve request",
        variant: "destructive",
      })
    } finally {
      setRefreshing(false)
    }
  }

  const rejectRequest = async (id: string) => {
    setRejectionDialog({ open: true, requestId: id })
  }

  const handleRejectWithRemark = async (remark: string) => {
    const requestId = rejectionDialog.requestId
    if (!requestId) return

    try {
      setRefreshing(true)
      
      // Optimistic update - remove from pending requests immediately
      setRequests(prev => prev.filter(r => r.id !== requestId))
      
      // Show success message immediately
      toast({
        title: "Success!",
        description: "Request rejected successfully",
      })
      
      // Make the API call
      await apiFetch(`/api/admin/requests/${requestId}/reject`, { method: 'POST', body: JSON.stringify({ remark }) })
      
      console.log('Request rejected, refreshing data...')
      
      // Refresh all data immediately for real-time updates
      const [requestsResult, statsResult, allRequestsResult] = await Promise.all([
        fetchRequests(),
        fetchStats(),
        fetchAllRequests()
      ])
      
      console.log('Data refresh completed:', {
        requests: requestsResult,
        stats: statsResult,
        allRequests: allRequestsResult
      })
      
      // Force a re-render by updating a timestamp
      setLastUpdate(Date.now())
      setRefreshing(false)
      
      // Close the dialog
      setRejectionDialog({ open: false, requestId: null })
      
    } catch (e) {
      console.error('Reject failed', e)
      // Revert optimistic update on error
      await fetchRequests()
      toast({
        title: "Error",
        description: "Failed to reject request",
        variant: "destructive",
      })
    } finally {
      setRefreshing(false)
    }
  }

  const handleLogout = async () => {
    try {
      await logout()
      navigate('/login')
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const hasProfileData = (user: UserProfile) => {
    if (!user.profile) return false
    return Object.values(user.profile).some(value => value !== null && value !== undefined)
  }

  const getProfileSummary = (user: UserProfile) => {
    if (!user.profile) return 'No profile data'
    
    const sections = []
    if (user.profile.personalDetails) sections.push('Personal')
    if (user.profile.family) sections.push('Family')
    if (user.profile.education) sections.push('Education')
    if (user.profile.medical) sections.push('Medical')
    if (user.profile.others) sections.push('Others')
    if (user.profile.leaveData) sections.push('Leave')
    if (user.profile.salaryData) sections.push('Salary')
    
    return sections.length > 0 ? sections.join(', ') : 'No profile data'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <div className="text-lg">Loading admin dashboard...</div>
          {error && (
            <div className="mt-4 p-3 bg-destructive/10 dark:bg-destructive/20 border border-destructive/30 dark:border-destructive/50 rounded-lg">
              <div className="text-destructive dark:text-destructive-foreground text-sm">{error}</div>
              <button 
                onClick={() => window.location.reload()} 
                className="mt-2 text-destructive dark:text-destructive-foreground hover:opacity-80 underline text-sm"
              >
                Click here to retry
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-destructive dark:text-destructive-foreground">Failed to load dashboard data</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="p-6 max-w-7xl mx-auto">
        <div className="space-y-6">
          {/* Header with Logout Button */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Logo size="lg" />
              <div className="h-8 w-px bg-border"></div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
                <p className="text-muted-foreground">System overview and user analytics</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <Button 
                onClick={async () => {
                  setRefreshing(true)
                  await Promise.all([
                    fetchRequests(),
                    fetchStats(),
                    fetchAllRequests()
                  ])
                  setLastUpdate(Date.now())
                  setRefreshing(false)
                  toast({
                    title: "Success!",
                    description: "Data refreshed successfully",
                  })
                }}
                variant="outline"
                className="flex items-center gap-2"
                disabled={refreshing}
              >
                {refreshing ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                ) : (
                  <div className="h-4 w-4">🔄</div>
                )}
                {refreshing ? 'Refreshing...' : 'Refresh Data'}
              </Button>
              <Button 
                onClick={handleLogout}
                variant="outline"
                className="flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>

          {/* Rejected Requests with Manager Responses Notification */}
          {(() => {
            const resubmittedRequests = requests.filter(req => 
              req.status === 'PENDING' && req.adminRemark && req.managerResponse
            )
            return resubmittedRequests.length > 0 ? (
              <Card className="border-blue-500/30 dark:border-blue-500/50 bg-blue-500/10 dark:bg-blue-500/20">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                    Resubmitted Requests Pending Review
                    <span className="ml-auto bg-blue-500/20 dark:bg-blue-500/30 text-blue-600 dark:text-blue-400 px-2 py-1 rounded-full text-sm font-medium">
                      {resubmittedRequests.length}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    The following requests were resubmitted by managers with responses to your remarks:
                  </p>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {resubmittedRequests.map((req) => (
                      <div key={req.id} className="flex items-start justify-between p-3 bg-card border border-blue-500/30 dark:border-blue-500/50 rounded-lg">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-blue-600 dark:text-blue-400">{req.type}</span>
                            <span className="text-xs text-blue-600 dark:text-blue-400 bg-blue-500/20 dark:bg-blue-500/30 px-2 py-1 rounded">
                              {new Date(req.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="text-sm text-blue-700 dark:text-blue-300 mb-2">
                            <strong>Your Remark:</strong> {req.adminRemark}
                          </div>
                          <div className="text-sm text-blue-700 dark:text-blue-300 mb-2">
                            <strong>Manager Response:</strong> {req.managerResponse}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Request ID: {req.id}
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 ml-3 flex-shrink-0">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-green-600 dark:text-green-400 border-green-300 dark:border-green-700 hover:bg-green-50 dark:hover:bg-green-950"
                            onClick={() => handleApprove(req.id)}
                            disabled={refreshing}
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 dark:text-red-400 border-red-300 dark:border-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                            onClick={() => setRejectionDialog({ open: true, requestId: req.id })}
                            disabled={refreshing}
                          >
                            Reject Again
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : null
          })()}

          {/* Charts Summary removed per request */}

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="users">User List</TabsTrigger>
              <TabsTrigger value="requests">Requests</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              {refreshing && (
                <div className="flex items-center justify-center p-4 bg-blue-500/10 dark:bg-blue-500/20 border border-blue-500/30 dark:border-blue-500/50 rounded-lg">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 dark:border-blue-400 mr-2"></div>
                  <span className="text-blue-600 dark:text-blue-400 text-sm">Refreshing data...</span>
                </div>
              )}
              
              {/* First-row bar graphs removed per request */}

              {/* Requests Analytics: four pies and bars */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {(['LEAVE','OUTPASS','SALARY','PROFILE_UPDATE'] as const).map((typeKey) => {
                  const byType = allRequests.filter(r => r.type === typeKey)
                  const statusCount = (s: 'PENDING'|'APPROVED'|'REJECTED') => byType.filter(r => r.status === s).length
                  
                  const segments = [
                    { id: 'PENDING', color: '#9ca3af', value: statusCount('PENDING') },
                    { id: 'APPROVED', color: '#22c55e', value: statusCount('APPROVED') },
                    { id: 'REJECTED', color: '#ef4444', value: statusCount('REJECTED') },
                  ]
                  
                  // Debug logging for salary chart
                  if (typeKey === 'SALARY') {
                    console.log('Salary requests:', byType.length)
                    console.log('Salary status counts:', {
                      pending: statusCount('PENDING'),
                      approved: statusCount('APPROVED'),
                      rejected: statusCount('REJECTED')
                    })
                    console.log('Salary segments:', segments)
                    console.log('Valid segments:', segments.filter(s => s.value > 0))
                  }
                  // Last 6 months buckets
                  const now = new Date()
                  const months = Array.from({ length: 6 }).map((_, i) => {
                    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
                    const label = d.toLocaleDateString('en-US', { month: 'short' })
                    const value = byType.filter(r => {
                      const rd = new Date(r.createdAt)
                      return rd.getFullYear() === d.getFullYear() && rd.getMonth() === d.getMonth()
                    }).length
                    return { label, value }
                  })

                  const titleMap: Record<typeof typeKey, string> = {
                    LEAVE: 'Leave',
                    OUTPASS: 'Outpass',
                    SALARY: 'Salary',
                    PROFILE_UPDATE: 'Profile Updates'
                  }

                  return (
                    <Card key={typeKey}>
                      <CardHeader>
                        <CardTitle className="text-sm font-medium">{titleMap[typeKey]}</CardTitle>
                        <CardDescription>Requests breakdown</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-4">
                          {byType.length > 0 ? (
                            <DonutChart
                              size={120}
                              thickness={18}
                              segments={segments}
                              centerLabel={{ top: 'Total', bottom: String(byType.length) }}
                              onSegmentClick={(segId) => {
                                const status = String(segId) as 'PENDING'|'APPROVED'|'REJECTED'
                                const usersInSegment = byType
                                  .filter(r => r.status === status)
                                  .map(r => ({
                                    name: r.targetUser?.username || r.requester?.username || 'Unknown',
                                    armyNumber: r.targetUser?.armyNumber ?? null,
                                  }))
                                setSegmentModal({
                                  open: true,
                                  title: `${titleMap[typeKey]} · ${status.charAt(0)}${status.slice(1).toLowerCase()}`,
                                  users: usersInSegment,
                                })
                              }}
                            />
                          ) : (
                            <div className="w-[120px] h-[120px] flex items-center justify-center text-muted-foreground text-sm">
                              No data
                            </div>
                          )}
                          <div className="space-y-2 text-xs">
                            <div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-sm bg-[#9ca3af]"></span> Pending: <span className="font-medium">{statusCount('PENDING')}</span></div>
                            <div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-sm bg-[#22c55e]"></span> Approved: <span className="font-medium">{statusCount('APPROVED')}</span></div>
                            <div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-sm bg-[#ef4444]"></span> Rejected: <span className="font-medium">{statusCount('REJECTED')}</span></div>
                          </div>
                        </div>
                        <div className="mt-4">
                          <MiniBarChart data={months} />
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </TabsContent>

            {/* Segment Users Modal */}
            <Dialog open={segmentModal.open} onOpenChange={(open) => setSegmentModal(prev => ({ ...prev, open }))}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{segmentModal.title}</DialogTitle>
                </DialogHeader>
                {segmentModal.users.length === 0 ? (
                  <div className="text-sm text-muted-foreground">No users found in this segment.</div>
                ) : (
                  <div className="max-h-80 overflow-auto divide-y">
                    {segmentModal.users.map((u, i) => (
                      <div key={i} className="py-2 flex justify-between text-sm">
                        <span className="font-medium">{u.name}</span>
                        <span className="text-muted-foreground">{u.armyNumber ? `Army No: ${u.armyNumber}` : '—'}</span>
                      </div>
                    ))}
                  </div>
                )}
              </DialogContent>
            </Dialog>

            {/* Requests Tab */}
            <TabsContent value="requests" className="space-y-4">
              {refreshing && (
                <div className="flex items-center justify-center p-4 bg-blue-500/10 dark:bg-blue-500/20 border border-blue-500/30 dark:border-blue-500/50 rounded-lg mb-4">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 dark:border-blue-400 mr-2"></div>
                  <span className="text-blue-600 dark:text-blue-400 text-sm">Refreshing data...</span>
                </div>
              )}
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Pending Requests
                  </CardTitle>
                  <CardDescription>Approve or reject manager-submitted requests</CardDescription>
                </CardHeader>
                <CardContent>
                  {requestsLoading ? (
                    <div>Loading...</div>
                  ) : requests.length === 0 ? (
                    <div className="text-sm text-muted-foreground">No pending requests.</div>
                  ) : (
                    <div className="space-y-3">
                      {requests.map((r) => (
                        <div key={r.id} className="border rounded p-3">
                          <div className="flex items-center justify-between">
                            <div className="space-y-1">
                              <div className="text-sm font-medium">{r.type} · {r.status}</div>
                              <div className="text-xs text-muted-foreground">Created {new Date(r.createdAt).toLocaleString()}</div>
                              {r.targetUser && (
                                <div className="text-xs font-medium text-blue-600">
                                  For: {r.targetUser.username} 
                                  {r.targetUser.armyNumber && ` (${r.targetUser.armyNumber})`}
                                </div>
                              )}
                              {r.requester && (
                                <div className="text-xs text-muted-foreground">Submitted by: {r.requester.username} ({r.requester.email})</div>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => approveRequest(r.id)}
                                disabled={refreshing}
                              >
                                {refreshing ? 'Processing...' : 'Approve'}
                              </Button>
                              <Button 
                                size="sm" 
                                variant="destructive" 
                                onClick={() => rejectRequest(r.id)}
                                disabled={refreshing}
                              >
                                {refreshing ? 'Processing...' : 'Reject'}
                              </Button>
                            </div>
                          </div>
                          <div className="mt-2">
                            <RequestSummary r={r} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="users" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    All Users ({users.length})
                  </CardTitle>
                  <CardDescription>Complete list of registered users with profile status</CardDescription>
                </CardHeader>
                <CardContent>
                  {usersLoading ? (
                    <div className="flex items-center justify-center h-32">
                      <div className="text-lg">Loading users...</div>
                    </div>
                  ) : selectedUser ? (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg">
                        <div>
                          <h3 className="font-semibold mb-2">Basic Information</h3>
                          <div className="space-y-1 text-sm">
                            <div><span className="font-medium">Username:</span> {selectedUser.username}</div>
                            <div><span className="font-medium">Email:</span> {selectedUser.email}</div>
                            <div><span className="font-medium">Role:</span>
                              <Badge variant={selectedUser.role === 'ADMIN' ? 'destructive' : 'secondary'} className="ml-2">
                                {selectedUser.role}
                              </Badge>
                            </div>
                            <div><span className="font-medium">Registered:</span> {formatDate(selectedUser.createdAt)}</div>
                            {selectedUser.profile?.updatedAt && (
                              <div><span className="font-medium">Last Updated:</span> {formatDate(selectedUser.profile.updatedAt)}</div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center justify-center">
                          <Button
                            variant="outline"
                            onClick={() => setSelectedUser(null)}
                            className="flex items-center gap-2"
                          >
                            <Users className="h-4 w-4" />
                            Back to Users
                          </Button>
                        </div>
                      </div>

                      {selectedUser.profile && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {selectedUser.profile.personalDetails && (
                            <Card>
                              <CardHeader className="pb-3">
                                <CardTitle className="text-lg flex items-center gap-2">
                                  <User className="h-4 w-4" />
                                  Personal Details
                                </CardTitle>
                              </CardHeader>
                              <CardContent className="space-y-2 text-sm">
                                {Object.entries(selectedUser.profile.personalDetails).map(([key, value]) => (
                                  <div key={key} className="flex justify-between">
                                    <span className="font-medium capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                                    <span className="text-muted-foreground">{String(value) || 'Not specified'}</span>
                                  </div>
                                ))}
                              </CardContent>
                            </Card>
                          )}

                          {selectedUser.profile.family && (
                            <Card>
                              <CardHeader className="pb-3">
                                <CardTitle className="text-lg flex items-center gap-2">
                                  <Home className="h-4 w-4" />
                                  Family Details
                                </CardTitle>
                              </CardHeader>
                              <CardContent className="space-y-2 text-sm">
                                {selectedUser.profile.family.members?.map((member: any, index: number) => (
                                  <div key={index} className="p-2 border rounded">
                                    <div className="font-medium mb-1">Member {index + 1}</div>
                                    {Object.entries(member).map(([key, value]) => (
                                      <div key={key} className="flex justify-between text-xs">
                                        <span className="font-medium capitalize">{key}:</span>
                                        <span className="text-muted-foreground">{String(value) || 'Not specified'}</span>
                                      </div>
                                    ))}
                                  </div>
                                ))}
                              </CardContent>
                            </Card>
                          )}

                          {selectedUser.profile.education && (
                            <Card>
                              <CardHeader className="pb-3">
                                
                              </CardHeader>
                              <CardContent className="space-y-2 text-sm">
                                {Object.entries(selectedUser.profile.education).map(([key, value]) => (
                                  <div key={key} className="flex justify-between">
                                    <span className="font-medium capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                                    <span className="text-muted-foreground">{String(value) || 'Not specified'}</span>
                                  </div>
                                ))}                              
             </CardContent>
                            </Card>
                          )}

                          {selectedUser.profile.medical && (
                            <Card>
                              <CardHeader className="pb-3">
                                <CardTitle className="text-lg flex items-center gap-2">
                                  <Heart className="h-4 w-4" />
                                  Medical Details
                                </CardTitle>
                              </CardHeader>
                              <CardContent className="space-y-2 text-sm">
                                {Object.entries(selectedUser.profile.medical).map(([key, value]) => (
                                  <div key={key} className="flex justify-between">
                                    <span className="font-medium capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                                    <span className="text-muted-foreground">{String(value) || 'Not specified'}</span>
                                  </div>
                                ))}
                              </CardContent>
                            </Card>
                          )}

                          {selectedUser.profile.others && (
                            <Card>
                              <CardHeader className="pb-3">
                                <CardTitle className="text-lg flex items-center gap-2">
                                  <FileText className="h-4 w-4" />
                                  Other Details
                                </CardTitle>
                              </CardHeader>
                              <CardContent className="space-y-2 text-sm">
                                {Object.entries(selectedUser.profile.others).map(([key, value]) => (
                                  <div key={key} className="flex justify-between">
                                    <span className="font-medium capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                                    <span className="text-muted-foreground">{String(value) || 'Not specified'}</span>
                                  </div>
                                ))}
                              </CardContent>
                            </Card>
                          )}

                          {selectedUser.profile.leaveData && (
                            <Card>
                              <CardHeader className="pb-3">
                                <CardTitle className="text-lg flex items-center gap-2">
                                  <Clock className="h-4 w-4" />
                                  Leave Details
                                </CardTitle>
                              </CardHeader>
                              <CardContent className="space-y-2 text-sm">
                                {Object.entries(selectedUser.profile.leaveData).map(([key, value]) => (
                                  <div key={key} className="flex justify-between">
                                    <span className="font-medium capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                                    <span className="text-muted-foreground">{String(value) || 'Not specified'}</span>
                                  </div>
                                ))}
                              </CardContent>
                            </Card>
                          )}

                          {selectedUser.profile.salaryData && (
                            <Card>
                              <CardHeader className="pb-3">
                                <CardTitle className="text-lg flex items-center gap-2">
                                  <DollarSign className="h-4 w-4" />
                                  Salary Details
                                </CardTitle>
                              </CardHeader>
                              <CardContent className="space-y-2 text-sm">
                                {Object.entries(selectedUser.profile.salaryData).map(([key, value]) => (
                                  <div key={key} className="flex justify-between">
                                    <span className="font-medium capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                                    <span className="text-muted-foreground">{String(value) || 'Not specified'}</span>
                                  </div>
                                ))}
                              </CardContent>
                            </Card>
                          )}
                        </div>
                      )}

                      {!selectedUser.profile && (
                        <div className="text-center py-8 text-muted-foreground">
                          <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>No profile data has been submitted yet.</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {users.map((user) => (
                        <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                              <User className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <div className="font-medium">{user.username}</div>
                              <div className="text-sm text-muted-foreground">{user.email}</div>
                              <div className="text-xs text-muted-foreground">
                                Profile: {getProfileSummary(user)}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge variant={user.role === 'ADMIN' ? 'destructive' : 'secondary'}>
                              {user.role}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {formatDate(user.createdAt)}
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedUser(user)}
                              className="flex items-center gap-2"
                            >
                              <Eye className="h-4 w-4" />
                              View Details
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <RejectionDialog
        open={rejectionDialog.open}
        onOpenChange={(open) => setRejectionDialog({ open, requestId: rejectionDialog.requestId })}
        onReject={handleRejectWithRemark}
        loading={refreshing}
      />
    </div>
  )
}
