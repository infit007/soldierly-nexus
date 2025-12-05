import { useEffect, useMemo, useState } from 'react'
import { apiFetch } from '../lib/api'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Textarea } from '../components/ui/textarea'
import { Check, ChevronsUpDown, Search } from 'lucide-react'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '../components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog'
import { cn } from '../lib/utils'
import { useToast } from '../hooks/use-toast'
import { ResubmissionDialog } from '../components/ResubmissionDialog'
import { useAuth } from '../context/AuthContext'
import { Logo } from '../components/Logo'

// Interactive Pie Chart Component
function PieChart({ data, size = 200, onSegmentClick }: { 
  data: { label: string; value: number; color: string; status: string }[]
  size?: number
  onSegmentClick?: (status: string) => void
}) {
  const total = data.reduce((sum, item) => sum + item.value, 0)
  if (total === 0) {
    return (
      <div className="flex items-center justify-center" style={{ width: size, height: size }}>
        <div className="text-center text-muted-foreground">
          <div className="text-sm">No data</div>
        </div>
      </div>
    )
  }

  let currentAngle = 0
  const radius = size / 2 - 10

  const handleSegmentClick = (status: string, label: string, value: number) => {
    console.log('Pie chart segment clicked:', status, value, label)
    if (onSegmentClick) {
      onSegmentClick(status)
    }
  }

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {data.map((item, index) => {
          const percentage = item.value / total
          const angle = percentage * 360
          const startAngle = currentAngle
          currentAngle += angle

          const x1 = size / 2 + radius * Math.cos((startAngle * Math.PI) / 180)
          const y1 = size / 2 + radius * Math.sin((startAngle * Math.PI) / 180)
          const x2 = size / 2 + radius * Math.cos((currentAngle * Math.PI) / 180)
          const y2 = size / 2 + radius * Math.sin((currentAngle * Math.PI) / 180)

          const largeArcFlag = angle > 180 ? 1 : 0

          return (
            <g key={index}>
              <path
                d={`M ${size / 2} ${size / 2} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`}
                fill={item.color}
                stroke="white"
                strokeWidth="2"
                style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}
              />
              <path
                d={`M ${size / 2} ${size / 2} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`}
                fill="transparent"
                stroke="transparent"
                strokeWidth="0"
                className="cursor-pointer"
                onClick={() => handleSegmentClick(item.status, item.label, item.value)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = '0.8'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = '1'
                }}
              />
            </g>
          )
        })}
      </svg>
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="text-center">
          <div className="text-2xl font-bold">{total}</div>
          <div className="text-sm text-muted-foreground">Total</div>
        </div>
      </div>
    </div>
  )
}

// Types
type UserRow = { id: string; username: string; email: string; role: string; armyNumber?: string }

type ReqRow = {
  id: string
  type: 'LEAVE' | 'OUTPASS' | 'SALARY' | 'PROFILE_UPDATE'
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  data: any
  adminRemark?: string
  managerResponse?: string
  createdAt: string
  updatedAt: string
}

export default function ManagerDashboard() {
  const { toast } = useToast()
  const { user: authUser } = useAuth()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // User selection state
  const [users, setUsers] = useState<UserRow[]>([])
  const [selectedUserId, setSelectedUserId] = useState<string>('')
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [userComboboxOpen, setUserComboboxOpen] = useState(false)

  // Profile edit state
  const [section, setSection] = useState<'personal'|'family'|'education'|'medical'|'others'>('personal')
  const [sectionJson, setSectionJson] = useState<string>('{}')

  // Leave
  const [leaveReason, setLeaveReason] = useState('')
  const [leaveStart, setLeaveStart] = useState('')
  const [leaveEnd, setLeaveEnd] = useState('')

  // Outpass
  const [outpassPurpose, setOutpassPurpose] = useState('')
  const [outpassFrom, setOutpassFrom] = useState('')
  const [outpassTo, setOutpassTo] = useState('')

  // Salary
  const [salaryBase, setSalaryBase] = useState('')
  const [salaryAllowance, setSalaryAllowance] = useState('')
  const [salaryBonus, setSalaryBonus] = useState('')

  // Requests list
  const [requests, setRequests] = useState<ReqRow[]>([])
  const [loadingReqs, setLoadingReqs] = useState(false)
  const [resubmissionDialog, setResubmissionDialog] = useState<{ open: boolean; request: ReqRow | null }>({ open: false, request: null })

  // Load users on component mount
  useEffect(() => {
    const load = async () => {
      setLoadingUsers(true)
      setError(null)
      try {
        console.log('🔍 Loading users for manager...')
        const rows = await apiFetch<UserRow[]>('/api/manager/users')
        console.log('✅ Users loaded:', rows.length)
        setUsers(rows || [])
        if (rows && rows.length && !selectedUserId) setSelectedUserId(rows[0].id)
      } catch (e: any) {
        console.error('❌ Failed to load users:', e)
        const errorMessage = e?.message || 'Failed to load users'
        setError(errorMessage)
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        })
      } finally {
        setLoadingUsers(false)
      }
    }
    load()
  }, [])

  const selectedUser = useMemo(() => users.find(u => u.id === selectedUserId), [users, selectedUserId])
  
  // Notification tracking
  const [seenNotifications, setSeenNotifications] = useState<Set<string>>(new Set())



  const reloadRequests = async () => {
    setLoadingReqs(true)
    setError(null)
    try {
      console.log('🔍 Loading requests for manager...')
      const res = await apiFetch<{ ok: boolean; requests: ReqRow[] }>(`/api/manager/requests`)
      console.log('✅ Requests loaded:', res.requests?.length || 0)
      setRequests(res.requests || [])
    } catch (e: any) {
      console.error('❌ Failed to load requests:', e)
      const errorMessage = e?.message || 'Failed to load requests'
      setError(errorMessage)
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setLoadingReqs(false)
    }
  }

  const handleResubmit = async (response: string, updatedData?: any) => {
    const request = resubmissionDialog.request
    if (!request) return

    try {
      setSubmitting(true)
      
      await apiFetch(`/api/manager/requests/${request.id}/resubmit`, {
        method: 'POST',
        body: JSON.stringify({ response, updatedData })
      })

      toast({
        title: "Success!",
        description: "Request resubmitted successfully",
      })

      await reloadRequests()
      setResubmissionDialog({ open: false, request: null })
      
    } catch (e) {
      console.error('Resubmit failed', e)
      toast({
        title: "Error",
        description: "Failed to resubmit request",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  useEffect(() => {
    reloadRequests()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Debug: Log auth user
  useEffect(() => {
    console.log('🔍 Manager Dashboard - Auth User:', authUser)
    if (authUser && authUser.role !== 'MANAGER') {
      console.warn('⚠️ User is not a MANAGER:', authUser.role)
    }
  }, [authUser])



  // Get rejected requests for notification (excluding seen ones)
  const rejectedRequests = useMemo(() => {
    if (!requests || !Array.isArray(requests)) return []
    return requests.filter(req => 
      req.status === 'REJECTED' && 
      req.adminRemark && 
      !seenNotifications.has(req.id)
    )
  }, [requests, seenNotifications])

  // Mark notification as seen
  const markNotificationAsSeen = (requestId: string) => {
    setSeenNotifications(prev => new Set([...prev, requestId]))
  }

  // Mark all notifications as seen
  const markAllNotificationsAsSeen = () => {
    const newSeenSet = new Set(seenNotifications)
    rejectedRequests.forEach(req => newSeenSet.add(req.id))
    setSeenNotifications(newSeenSet)
  }

  // Calculate request statistics for pie chart
  const requestStats = useMemo(() => {
    if (!requests || !Array.isArray(requests)) {
      return [
        { label: 'Approved', value: 0, color: '#10b981', status: 'APPROVED' },
        { label: 'Rejected', value: 0, color: '#ef4444', status: 'REJECTED' },
        { label: 'Pending', value: 0, color: '#f59e0b', status: 'PENDING' }
      ]
    }
    const approved = requests.filter(req => req.status === 'APPROVED').length
    const rejected = requests.filter(req => req.status === 'REJECTED').length
    const pending = requests.filter(req => req.status === 'PENDING').length

    return [
      { label: 'Approved', value: approved, color: '#10b981', status: 'APPROVED' }, // green
      { label: 'Rejected', value: rejected, color: '#ef4444', status: 'REJECTED' }, // red
      { label: 'Pending', value: pending, color: '#f59e0b', status: 'PENDING' }   // amber
    ]
  }, [requests])

  // State for showing request details modal
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null)
  const [showRequestDetails, setShowRequestDetails] = useState(false)

  // Handle pie chart segment click
  const handleSegmentClick = (status: string) => {
    console.log('handleSegmentClick called with status:', status)
    setSelectedStatus(status)
    setShowRequestDetails(true)
  }

  // Helper functions
  const fillTemplate = () => {
    let template: any = {}
    switch (section) {
      case 'personal':
        template = {
          fullName: selectedUser?.username || '',
          rank: '',
          serviceNumber: '',
          phone: '',
          address: '',
          email: selectedUser?.email || ''
        }
        break
      case 'family':
        template = {
          members: [
            { name: '', relation: 'Spouse' },
            { name: '', relation: 'Child' }
          ],
          dependentsCount: 0
        }
        break
      case 'education':
        template = {
          highestQualification: '',
          entries: [
            { institution: '', degree: '', fieldOfStudy: '', startYear: 0, endYear: 0 }
          ]
        }
        break
      case 'medical':
        template = {
          conditions: [],
          medications: [],
          allergies: [],
          lastCheckupDate: ''
        }
        break
      case 'others':
        template = { notes: '' }
        break
    }
    setSectionJson(JSON.stringify(template, null, 2))
  }

  const submitProfileEdit = async () => {
    if (!selectedUserId) {
      toast({
        title: "Error",
        description: "Please select a user first",
        variant: "destructive",
      })
      return
    }
    
    setSubmitting(true)
    try {
      let parsed: any = {}
      try { parsed = sectionJson ? JSON.parse(sectionJson) : {} } catch {
        throw new Error('Profile data must be valid JSON')
      }
      await apiFetch('/api/manager/requests/profile-edit', {
        method: 'POST',
        body: JSON.stringify({ userId: selectedUserId, section, data: parsed })
      })
      await reloadRequests()
      toast({
        title: "Success!",
        description: "Profile edit request created successfully",
      })
    } catch (e: any) {
      toast({
        title: "Error",
        description: e?.message || 'Failed to create profile edit request',
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const submitLeave = async () => {
    if (!selectedUserId) {
      toast({
        title: "Error",
        description: "Please select a user first",
        variant: "destructive",
      })
      return
    }
    
    setSubmitting(true)
    try {
      await apiFetch('/api/manager/requests/leave', {
        method: 'POST',
        body: JSON.stringify({ userId: selectedUserId, leave: { reason: leaveReason, startDate: leaveStart, endDate: leaveEnd } })
      })
      await reloadRequests()
      toast({
        title: "Success!",
        description: "Leave request created successfully",
      })
    } catch (e: any) {
      toast({
        title: "Error",
        description: e?.message || 'Failed to create leave request',
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const submitOutpass = async () => {
    if (!selectedUserId) {
      toast({
        title: "Error",
        description: "Please select a user first",
        variant: "destructive",
      })
      return
    }
    
    setSubmitting(true)
    try {
      await apiFetch('/api/manager/requests/outpass', {
        method: 'POST',
        body: JSON.stringify({ userId: selectedUserId, outpass: { purpose: outpassPurpose, from: outpassFrom, to: outpassTo } })
      })
      await reloadRequests()
      toast({
        title: "Success!",
        description: "Outpass request created successfully",
      })
    } catch (e: any) {
      toast({
        title: "Error",
        description: e?.message || 'Failed to create outpass request',
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const submitSalary = async () => {
    if (!selectedUserId) {
      toast({
        title: "Error",
        description: "Please select a user first",
        variant: "destructive",
      })
      return
    }
    
    setSubmitting(true)
    try {
      const base = salaryBase ? Number(salaryBase) : undefined
      const allowance = salaryAllowance ? Number(salaryAllowance) : undefined
      const bonus = salaryBonus ? Number(salaryBonus) : undefined
      await apiFetch('/api/manager/requests/salary', {
        method: 'POST',
        body: JSON.stringify({ userId: selectedUserId, salary: { base, allowance, bonus } })
      })
      await reloadRequests()
      toast({
        title: "Success!",
        description: "Salary update request created successfully",
      })
    } catch (e: any) {
      toast({
        title: "Error",
        description: e?.message || 'Failed to create salary request',
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
      }
    }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex items-center gap-4 mb-2">
        <Logo size="lg" />
        <div className="h-10 w-px bg-border"></div>
        <div>
          <h1 className="text-2xl font-semibold">Manager Dashboard</h1>
          <p className="text-sm text-muted-foreground">Manage requests and user information</p>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <Card className="border-destructive bg-destructive/10">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-destructive font-medium">Error loading data</p>
                <p className="text-sm text-muted-foreground mt-1">{error}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setError(null)
                  window.location.reload()
                }}
              >
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {(loadingUsers || loadingReqs) && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
              <span className="text-sm text-muted-foreground">
                {loadingUsers ? 'Loading users...' : 'Loading requests...'}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Rejected Requests Notification */}
      {rejectedRequests.length > 0 && (
        <Card className="border-destructive/50 bg-destructive/10 dark:bg-destructive/20">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-destructive dark:text-destructive-foreground">
              <div className="w-2 h-2 bg-destructive rounded-full animate-pulse"></div>
              New Rejected Requests
              <span className="ml-auto bg-destructive/20 dark:bg-destructive/30 text-destructive dark:text-destructive-foreground px-2 py-1 rounded-full text-sm font-medium">
                {rejectedRequests.length}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-destructive/90 dark:text-destructive-foreground/90">
                The following requests were rejected by admin and require your attention:
              </p>
              <Button
                size="sm"
                variant="outline"
                className="text-destructive border-destructive/50 hover:bg-destructive/10 dark:hover:bg-destructive/20"
                onClick={markAllNotificationsAsSeen}
              >
                Mark All as Seen
              </Button>
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {rejectedRequests.map((req) => (
                <div key={req.id} className="flex items-start justify-between p-3 bg-card border border-destructive/30 dark:border-destructive/50 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-destructive dark:text-destructive-foreground">{req.type}</span>
                      <span className="text-xs text-destructive/80 dark:text-destructive-foreground/80 bg-destructive/10 dark:bg-destructive/20 px-2 py-1 rounded">
                        {new Date(req.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="text-sm text-destructive/90 dark:text-destructive-foreground/90 mb-2">
                      <strong>Admin Remark:</strong> {req.adminRemark}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Request ID: {req.id}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-destructive border-destructive/50 hover:bg-destructive/10 dark:hover:bg-destructive/20 ml-3 flex-shrink-0"
                    onClick={() => markNotificationAsSeen(req.id)}
                  >
                    Mark as Seen
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{users.length}</div>
            <div className="text-sm text-muted-foreground">Total Users</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">
              {users.filter(u => u.armyNumber).length}
            </div>
            <div className="text-sm text-muted-foreground">With Army Numbers</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">
              {users.filter(u => !u.armyNumber).length}
            </div>
            <div className="text-sm text-muted-foreground">Without Army Numbers</div>
          </CardContent>
        </Card>
      </div>

      {/* Request Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Request Statistics</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center p-6">
            {loadingReqs ? (
              <div className="flex flex-col items-center gap-2">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <p className="text-sm text-muted-foreground">Loading requests...</p>
              </div>
            ) : requests.length === 0 ? (
              <div className="flex flex-col items-center gap-2 text-center">
                <p className="text-muted-foreground">No requests yet</p>
                <p className="text-sm text-muted-foreground">
                  Create a leave request, outpass, or salary update to see statistics here.
                </p>
              </div>
            ) : (
              <>
                <PieChart data={requestStats} size={250} onSegmentClick={handleSegmentClick} />
                <div className="mt-4 text-center">
              <p className="text-sm text-muted-foreground mb-2">💡 Click on pie chart segments to see details</p>
              <div className="flex items-center justify-center gap-4 text-xs mb-3">
                {requestStats.map((stat) => (
                  <div key={stat.status} className="flex items-center gap-1">
                    <div 
                      className="w-3 h-3 rounded-full cursor-pointer hover:scale-110 transition-transform"
                      style={{ backgroundColor: stat.color }}
                      onClick={() => handleSegmentClick(stat.status)}
                    />
                    <span className="text-muted-foreground">{stat.label}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-center gap-2 text-xs">
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => handleSegmentClick('APPROVED')}
                  className="text-green-600 dark:text-green-400 border-green-300 dark:border-green-700 hover:bg-green-50 dark:hover:bg-green-950"
                >
                  Test Approved
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => handleSegmentClick('REJECTED')}
                  className="text-red-600 dark:text-red-400 border-red-300 dark:border-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                >
                  Test Rejected
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => handleSegmentClick('PENDING')}
                  className="text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950"
                >
                  Test Pending
                </Button>
              </div>
            </div>
              </>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Request Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {loadingReqs ? (
              <div className="flex flex-col items-center gap-2 py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <p className="text-sm text-muted-foreground">Loading requests...</p>
              </div>
            ) : requests.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8 text-center">
                <p className="text-muted-foreground">No requests yet</p>
                <p className="text-sm text-muted-foreground">
                  Create a leave request, outpass, or salary update to see summary here.
                </p>
              </div>
            ) : (
              <>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {requestStats.find(s => s.label === 'Approved')?.value || 0}
                </div>
                <div className="text-sm text-muted-foreground">Approved</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {requestStats.find(s => s.label === 'Rejected')?.value || 0}
                </div>
                <div className="text-sm text-muted-foreground">Rejected</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                  {requestStats.find(s => s.label === 'Pending')?.value || 0}
                </div>
                <div className="text-sm text-muted-foreground">Pending</div>
              </div>
            </div>
            <div className="pt-4 border-t">
              <div className="text-center">
                <div className="text-3xl font-bold">
                  {requests && Array.isArray(requests) ? requests.length : 0}
                </div>
                <div className="text-sm text-muted-foreground">Total Requests</div>
              </div>
            </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Select a User */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Select a User</CardTitle>
            <div className="text-sm text-muted-foreground">
              💡 Type to search • Click to select
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 min-w-0">
              <Label className="text-sm font-medium mb-2 block">User</Label>
              <Popover open={userComboboxOpen} onOpenChange={setUserComboboxOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={userComboboxOpen}
                    className="w-full justify-between h-10 px-3"
                    disabled={loadingUsers}
                  >
                    {loadingUsers ? (
                      'Loading users...'
                    ) : selectedUserId ? (
                      <>
                        {selectedUser?.username} ({selectedUser?.email})
                        {selectedUser?.armyNumber && ` • ${selectedUser.armyNumber}`}
                      </>
                    ) : (
                      'Select user...'
                    )}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[500px] p-0" align="start">
                  <Command>
                    <CommandInput 
                      placeholder="Search users by name, email, or army number..." 
                      className="h-10 border-0 focus:ring-0"
                    />
                    <CommandList className="max-h-[300px]">
                      <CommandEmpty>
                        <div className="text-center py-6">
                          <Search className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                          <p className="text-sm text-muted-foreground">No users found</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Try searching by username, email, or army number
                          </p>
                        </div>
                      </CommandEmpty>
                      <CommandGroup>
                        <div className="px-3 py-2 text-xs text-muted-foreground border-b bg-muted/30">
                          {users.length} users available • Use ↑↓ to navigate, Enter to select
                        </div>
                        {users.map((user) => (
                          <CommandItem
                            key={user.id}
                            value={`${user.username} ${user.email} ${user.armyNumber || ''}`}
                            onSelect={() => {
                              setSelectedUserId(user.id)
                              setUserComboboxOpen(false)
                            }}
                            className="cursor-pointer px-3 py-2"
                          >
                            <Check
                              className={cn(
                                "mr-3 h-4 w-4",
                                selectedUserId === user.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            <div className="flex flex-col flex-1 min-w-0">
                              <span className="font-medium truncate">
                                {user.username}
                              </span>
                              <span className="text-xs text-muted-foreground truncate">
                                {user.email}
                              </span>
                              {user.armyNumber && (
                                <span className="text-xs text-muted-foreground font-mono bg-muted px-2 py-1 rounded mt-1 inline-block">
                                  {user.armyNumber}
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground capitalize ml-2">
                              {user.role}
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          </div>
          {selectedUser && (
            <div className="flex items-start gap-2 p-3 bg-muted/30 rounded-lg border">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-1.5 flex-shrink-0"></div>
              <div className="text-sm min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1">
                  <span className="font-medium">Selected:</span> 
                  <span className="truncate">{selectedUser.username}</span>
                  <span>•</span>
                  <span className="truncate">{selectedUser.email}</span>
                </div>
                {selectedUser.armyNumber && (
                  <div className="mt-1">
                    <span className="font-mono text-xs bg-background px-2 py-1 rounded border">
                      {selectedUser.armyNumber}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>







      <div className="grid md:grid-cols-2 gap-6">
        {/* Profile/Registration Edit */}
        <Card>
          <CardHeader>
            <CardTitle>Registration/Profile Edit</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label>Section</Label>
              <Select value={section} onValueChange={(v)=>setSection(v as any)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select section" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="personal">Personal</SelectItem>
                  <SelectItem value="family">Family</SelectItem>
                  <SelectItem value="education">Education</SelectItem>
                  <SelectItem value="medical">Medical</SelectItem>
                  <SelectItem value="others">Others</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Data (JSON)</Label>
              <Textarea value={sectionJson} onChange={e=>setSectionJson(e.target.value)} rows={10} placeholder={'{\n  "key": "value"\n}'} />
              <div>
                <Button type="button" variant="outline" size="sm" onClick={fillTemplate}>Use Template</Button>
              </div>
            </div>
            <Button disabled={submitting} onClick={submitProfileEdit}>Submit Profile Edit</Button>
          </CardContent>
        </Card>

        {/* Leave */}
        <Card>
          <CardHeader>
            <CardTitle>Create Leave Request</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            <div>
              <Label>Reason</Label>
              <Input value={leaveReason} onChange={e=>setLeaveReason(e.target.value)} placeholder="Reason" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Start Date</Label>
                <Input type="date" value={leaveStart} onChange={e=>setLeaveStart(e.target.value)} />
              </div>
              <div>
                <Label>End Date</Label>
                <Input type="date" value={leaveEnd} onChange={e=>setLeaveEnd(e.target.value)} />
              </div>
            </div>
            <Button disabled={submitting} onClick={submitLeave}>Create Leave</Button>
          </CardContent>
        </Card>

        {/* Outpass */}
        <Card>
          <CardHeader>
            <CardTitle>Create Outpass</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            <div>
              <Label>Purpose</Label>
              <Input value={outpassPurpose} onChange={e=>setOutpassPurpose(e.target.value)} placeholder="Purpose" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>From</Label>
                <Input type="datetime-local" value={outpassFrom} onChange={e=>setOutpassFrom(e.target.value)} />
              </div>
              <div>
                <Label>To</Label>
                <Input type="datetime-local" value={outpassTo} onChange={e=>setOutpassTo(e.target.value)} />
              </div>
            </div>
            <Button disabled={submitting} onClick={submitOutpass}>Create Outpass</Button>
          </CardContent>
        </Card>

        {/* Salary */}
        <Card>
          <CardHeader>
            <CardTitle>Salary Update</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Base</Label>
                <Input type="number" value={salaryBase} onChange={e=>setSalaryBase(e.target.value)} placeholder="0" />
              </div>
              <div>
                <Label>Allowance</Label>
                <Input type="number" value={salaryAllowance} onChange={e=>setSalaryAllowance(e.target.value)} placeholder="0" />
              </div>
              <div>
                <Label>Bonus</Label>
                <Input type="number" value={salaryBonus} onChange={e=>setSalaryBonus(e.target.value)} placeholder="0" />
              </div>
            </div>
            <Button disabled={submitting} onClick={submitSalary}>Propose Salary Update</Button>
          </CardContent>
        </Card>
      </div>

      {/* Requests list */}
      <Card>
        <CardHeader>
          <CardTitle>Your Requests</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingReqs ? (
            <div>Loading...</div>
          ) : (
            <div className="space-y-2">
              {(!requests || requests.length === 0) && <div className="text-sm text-muted-foreground">No requests yet.</div>}
              {requests && requests.map(r => (
                <div key={r.id} className={`text-sm border rounded p-3 space-y-3 ${
                  r.status === 'REJECTED' && r.adminRemark && !seenNotifications.has(r.id) 
                    ? 'border-destructive/50 bg-destructive/10 dark:bg-destructive/20' 
                    : ''
                }`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium flex items-center gap-2">
                        {r.type} · {r.status}
                        {r.status === 'REJECTED' && r.adminRemark && !seenNotifications.has(r.id) && (
                          <span className="text-xs bg-destructive/20 dark:bg-destructive/30 text-destructive dark:text-destructive-foreground px-2 py-1 rounded-full">
                            New
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">{new Date(r.createdAt).toLocaleString()}</div>
                    </div>
                  </div>
                  
                  {r.status === 'REJECTED' && r.adminRemark && (
                    <div className="bg-destructive/10 dark:bg-destructive/20 border border-destructive/30 dark:border-destructive/50 rounded p-3">
                      <div className="font-medium text-destructive dark:text-destructive-foreground mb-1">Admin Remark:</div>
                      <div className="text-destructive/90 dark:text-destructive-foreground/90">{r.adminRemark}</div>
                    </div>
                  )}
                  
                  {r.status === 'PENDING' && r.managerResponse && (
                    <div className="bg-blue-500/10 dark:bg-blue-500/20 border border-blue-500/30 dark:border-blue-500/50 rounded p-3">
                      <div className="font-medium text-blue-600 dark:text-blue-400 mb-1">Your Response:</div>
                      <div className="text-blue-700 dark:text-blue-300">{r.managerResponse}</div>
                    </div>
                  )}
                  
                  <pre className="text-xs max-w-full overflow-auto bg-muted p-2 rounded">{JSON.stringify(r.data, null, 2)}</pre>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Request Details Modal */}
      <Dialog open={showRequestDetails} onOpenChange={setShowRequestDetails}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${
                selectedStatus === 'APPROVED' ? 'bg-green-500' :
                selectedStatus === 'REJECTED' ? 'bg-red-500' :
                'bg-amber-500'
              }`}></div>
              {selectedStatus} Requests
              <span className="ml-auto text-sm text-muted-foreground">
                {requests && Array.isArray(requests) ? requests.filter(req => req.status === selectedStatus).length : 0} requests
              </span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            {selectedStatus && requests && Array.isArray(requests) && requests.filter(req => req.status === selectedStatus).map((req) => (
              <Card key={req.id} className="border-l-4" style={{
                borderLeftColor: selectedStatus === 'APPROVED' ? '#10b981' :
                                selectedStatus === 'REJECTED' ? '#ef4444' : '#f59e0b'
              }}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{req.type}</div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(req.createdAt).toLocaleString()}
                      </div>
                    </div>
                                         <div className="text-right">
                       <div className="text-sm font-medium">
                         {req.data?.userId ? 
                           users.find(u => u.id === req.data.userId)?.username || 'Unknown User' :
                           'System Request'
                         }
                       </div>
                       <div className="text-xs text-muted-foreground">
                         {req.data?.userId ? 
                           users.find(u => u.id === req.data.userId)?.email || 'No email' :
                           'No user associated'
                         }
                       </div>
                       {req.data?.userId && users.find(u => u.id === req.data.userId)?.armyNumber && (
                         <div className="text-xs font-mono bg-muted px-2 py-1 rounded mt-1">
                           {users.find(u => u.id === req.data.userId)?.armyNumber}
                         </div>
                       )}
                     </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {req.adminRemark && (
                    <div className="mb-3 p-3 bg-destructive/10 dark:bg-destructive/20 border border-destructive/30 dark:border-destructive/50 rounded">
                      <div className="font-medium text-destructive dark:text-destructive-foreground mb-1">Admin Remark:</div>
                      <div className="text-destructive/90 dark:text-destructive-foreground/90">{req.adminRemark}</div>
                    </div>
                  )}
                  {req.managerResponse && (
                    <div className="mb-3 p-3 bg-blue-500/10 dark:bg-blue-500/20 border border-blue-500/30 dark:border-blue-500/50 rounded">
                      <div className="font-medium text-blue-600 dark:text-blue-400 mb-1">Manager Response:</div>
                      <div className="text-blue-700 dark:text-blue-300">{req.managerResponse}</div>
                    </div>
                  )}
                  <div className="text-xs bg-muted p-3 rounded font-mono overflow-auto">
                    {JSON.stringify(req.data, null, 2)}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <ResubmissionDialog
        open={resubmissionDialog.open}
        onOpenChange={(open) => setResubmissionDialog({ open, request: resubmissionDialog.request })}
        onResubmit={handleResubmit}
        loading={submitting}
        adminRemark={resubmissionDialog.request?.adminRemark || ''}
        requestType={resubmissionDialog.request?.type || ''}
        requestData={resubmissionDialog.request?.data || {}}
      />
    </div>
  )
}
