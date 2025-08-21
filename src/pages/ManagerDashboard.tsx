import { useEffect, useMemo, useState } from 'react'
import { apiFetch } from '../lib/api'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Textarea } from '../components/ui/textarea'
import { PersonalDetails, Family, Education, MedicalRecord, Others } from '../types/profile'
import { Check, ChevronsUpDown, Search } from 'lucide-react'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '../components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover'
import { cn } from '../lib/utils'
import { useToast } from '../hooks/use-toast'
import { ResubmissionDialog } from '../components/ResubmissionDialog'

// Types
type UserRow = { id: string; username: string; email: string; role: string; armyNumber?: string }

type UserProfile = {
  personalDetails?: any
  family?: any
  education?: any
  medical?: any
  others?: any
  leaveData?: any
  salaryData?: any
  updatedAt?: string
}

type UserWithProfile = {
  id: string
  username: string
  email: string
  role: string
  armyNumber?: string
  profile: UserProfile | null
}

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
  const [users, setUsers] = useState<UserRow[]>([])
  const [selectedUserId, setSelectedUserId] = useState<string>('')
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Profile edit state
  const [section, setSection] = useState<'personal'|'family'|'education'|'medical'|'others'>('personal')
  const [sectionJson, setSectionJson] = useState<string>('{}')
  const fillTemplate = () => {
    let template: PersonalDetails | Family | Education | MedicalRecord | Others = {}
    switch (section) {
      case 'personal':
        template = {
          fullName: selectedUser?.username || '',
          rank: '',
          serviceNumber: '',
          phone: '',
          address: '',
          email: selectedUser?.email || ''
        } as PersonalDetails
        break
      case 'family':
        template = {
          members: [
            { name: '', relation: 'Spouse' },
            { name: '', relation: 'Child' }
          ],
          dependentsCount: 0
        } as Family
        break
      case 'education':
        template = {
          highestQualification: '',
          entries: [
            { institution: '', degree: '', fieldOfStudy: '', startYear: 0, endYear: 0 }
          ]
        } as Education
        break
      case 'medical':
        template = {
          conditions: [],
          medications: [],
          allergies: [],
          lastCheckupDate: ''
        } as MedicalRecord
        break
      case 'others':
        template = { notes: '' } as Others
        break
    }
    setSectionJson(JSON.stringify(template, null, 2))
  }

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
  const [selectedUserProfile, setSelectedUserProfile] = useState<UserWithProfile | null>(null)
  const [loadingProfile, setLoadingProfile] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [userComboboxOpen, setUserComboboxOpen] = useState(false)

  useEffect(() => {
    const load = async () => {
      setLoadingUsers(true)
      try {
        const rows = await apiFetch<UserRow[]>('/api/manager/users')
        setUsers(rows)
        if (rows.length && !selectedUserId) setSelectedUserId(rows[0].id)
      } catch (e) {
        console.error(e)
      } finally {
        setLoadingUsers(false)
      }
    }
    load()
  }, [])

  const selectedUser = useMemo(() => users.find(u => u.id === selectedUserId), [users, selectedUserId])
  
  const filteredUsers = useMemo(() => {
    if (!searchTerm) return users
    const term = searchTerm.toLowerCase().trim()
    
    // Enhanced search with multiple criteria
    return users.filter(user => {
      // Search by army number (exact or partial)
      if (user.armyNumber && user.armyNumber.toLowerCase().includes(term)) {
        return true
      }
      
      // Search by username (exact or partial)
      if (user.username.toLowerCase().includes(term)) {
        return true
      }
      
      // Search by email (exact or partial)
      if (user.email.toLowerCase().includes(term)) {
        return true
      }
      
      // Search by role (exact match)
      if (user.role.toLowerCase() === term) {
        return true
      }
      
      // Search by partial army number (e.g., "1001" for "ARMY-2025-1001")
      if (user.armyNumber && user.armyNumber.includes(term)) {
        return true
      }
      
      return false
    })
  }, [users, searchTerm])

  // Fetch live profile of the selected user so manager sees latest user-panel updates
  const fetchProfile = async () => {
    if (!selectedUserId) return
    setLoadingProfile(true)
    try {
      const data = await apiFetch<UserWithProfile>(`/api/manager/users/${selectedUserId}/profile`)
      setSelectedUserProfile(data)
    } catch (e) {
      console.error(e)
      setSelectedUserProfile(null)
    } finally {
      setLoadingProfile(false)
    }
  }

  useEffect(() => {
    fetchProfile()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedUserId])

  const reloadRequests = async () => {
    setLoadingReqs(true)
    try {
      const res = await apiFetch<{ ok: boolean; requests: ReqRow[] }>(`/api/manager/requests`)
      setRequests(res.requests)
    } catch (e) {
      console.error(e)
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

  const ensureUser = () => {
    if (!selectedUserId) throw new Error('Please select a user')
  }

  const submitProfileEdit = async () => {
    setSubmitting(true)
    try {
      ensureUser()
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
    setSubmitting(true)
    try {
      ensureUser()
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
    setSubmitting(true)
    try {
      ensureUser()
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
    setSubmitting(true)
    try {
      ensureUser()
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

  // Get rejected requests for notification
  const rejectedRequests = useMemo(() => {
    return requests.filter(req => req.status === 'REJECTED' && req.adminRemark)
  }, [requests])

  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-semibold">Manager Dashboard</h1>

      {/* Rejected Requests Notification */}
      {rejectedRequests.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-red-800">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              Rejected Requests Requiring Response
              <span className="ml-auto bg-red-100 text-red-800 px-2 py-1 rounded-full text-sm font-medium">
                {rejectedRequests.length}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-red-700">
              The following requests were rejected by admin and require your response:
            </p>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {rejectedRequests.map((req) => (
                <div key={req.id} className="flex items-start justify-between p-3 bg-white rounded-lg border border-red-200">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-red-800">{req.type}</span>
                      <span className="text-xs text-red-600 bg-red-100 px-2 py-1 rounded">
                        {new Date(req.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="text-sm text-red-700 mb-2">
                      <strong>Admin Remark:</strong> {req.adminRemark}
                    </div>
                    <div className="text-xs text-red-600">
                      Request ID: {req.id}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-red-700 border-red-300 hover:bg-red-100 ml-3 flex-shrink-0"
                    onClick={() => setResubmissionDialog({ open: true, request: req })}
                  >
                    Respond & Resubmit
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

      {/* All Users with Army Numbers */}
      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Enhanced Search Section */}
          <div className="mb-6 space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Label htmlFor="search-users" className="text-sm font-medium mb-2 block">
                  Search Users
                </Label>
                <Input
                  id="search-users"
                  placeholder="Search by army number, username, or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full max-w-lg"
                />
              </div>
              {searchTerm && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSearchTerm('')}
                  className="mt-6"
                >
                  Clear Search
                </Button>
              )}
            </div>
            
            {/* Search Results Summary */}
            {searchTerm && (
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <span>🔍</span>
                  <span>Search results for: <strong>"{searchTerm}"</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <span>📊</span>
                  <span>Showing {filteredUsers.length} of {users.length} users</span>
                </div>
                {filteredUsers.length === 0 && (
                  <div className="text-amber-600 font-medium">
                    No users found matching your search
                  </div>
                )}
              </div>
            )}
            
            {/* Quick Search Examples */}
            {!searchTerm && (
              <div className="text-xs text-muted-foreground">
                💡 <strong>Quick search examples:</strong> Try searching by army number (e.g., "ARMY-2025-1001"), 
                username (e.g., "john.smith"), or email domain (e.g., "@army.mil")
              </div>
            )}
            
            {/* Quick Filters */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant={searchTerm === '' ? "default" : "outline"}
                size="sm"
                onClick={() => setSearchTerm('')}
              >
                All Users ({users.length})
              </Button>
              <Button
                variant={searchTerm === 'user' ? "default" : "outline"}
                size="sm"
                onClick={() => setSearchTerm('user')}
              >
                Regular Users ({users.filter(u => u.role === 'USER').length})
              </Button>
              <Button
                variant={searchTerm === 'manager' ? "default" : "outline"}
                size="sm"
                onClick={() => setSearchTerm('manager')}
              >
                Managers ({users.filter(u => u.role === 'MANAGER').length})
              </Button>
              <Button
                variant={searchTerm === 'admin' ? "default" : "outline"}
                size="sm"
                onClick={() => setSearchTerm('admin')}
              >
                Admins ({users.filter(u => u.role === 'ADMIN').length})
              </Button>
            </div>
          </div>
          {loadingUsers ? (
            <div>Loading users...</div>
          ) : (
            <div className="overflow-x-auto">
              {filteredUsers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <div className="text-lg mb-2">🔍 No users found</div>
                  <div className="text-sm">
                    {searchTerm ? `No users match "${searchTerm}"` : 'No users available'}
                  </div>
                  {searchTerm && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSearchTerm('')}
                      className="mt-3"
                    >
                      Clear Search
                    </Button>
                  )}
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/30">
                      <th className="text-left p-3 font-medium">Username</th>
                      <th className="text-left p-3 font-medium">Email</th>
                      <th className="text-left p-3 font-medium">Role</th>
                      <th className="text-left p-3 font-medium">Army Number</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map(user => (
                      <tr key={user.id} className="border-b hover:bg-muted/30 transition-colors">
                        <td className="p-3 font-medium">{user.username}</td>
                        <td className="p-3">{user.email}</td>
                        <td className="p-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            user.role === 'ADMIN' ? 'bg-red-100 text-red-800' :
                            user.role === 'MANAGER' ? 'bg-blue-100 text-blue-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {user.role.toLowerCase()}
                          </span>
                        </td>
                        <td className="p-3">
                          {user.armyNumber ? (
                            <span className="font-mono bg-muted px-2 py-1 rounded text-xs">
                              {user.armyNumber}
                            </span>
                          ) : (
                            <span className="text-muted-foreground italic text-xs">Not assigned</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Selected User Profile</CardTitle>
            <Button variant="outline" size="sm" onClick={fetchProfile} disabled={loadingProfile || !selectedUserId}>
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {!selectedUserId && <div className="text-sm text-muted-foreground">Select a user to view their profile.</div>}
          {selectedUserId && (
            <div className="space-y-2">
              {loadingProfile ? (
                <div>Loading profile...</div>
              ) : selectedUserProfile ? (
                <div className="space-y-2">
                  <div className="text-sm">
                    {selectedUserProfile.username} ({selectedUserProfile.email})
                    {selectedUserProfile.armyNumber && (
                      <span className="ml-10 text-muted-foreground">• Army: {selectedUserProfile.armyNumber}</span>
                    )}
                  </div>
                  {selectedUserProfile.profile ? (
                    <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-72">{JSON.stringify(selectedUserProfile.profile, null, 2)}</pre>
                  ) : (
                    <div className="text-sm text-muted-foreground">No profile data yet.</div>
                  )}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">Unable to load profile.</div>
              )}
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
              {requests.length === 0 && <div className="text-sm text-muted-foreground">No requests yet.</div>}
              {requests.map(r => (
                <div key={r.id} className="text-sm border rounded p-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{r.type} · {r.status}</div>
                      <div className="text-xs text-muted-foreground">{new Date(r.createdAt).toLocaleString()}</div>
                    </div>
                    {r.status === 'REJECTED' && r.adminRemark && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setResubmissionDialog({ open: true, request: r })}
                        disabled={submitting}
                      >
                        Respond & Resubmit
                      </Button>
                    )}
                  </div>
                  
                  {r.status === 'REJECTED' && r.adminRemark && (
                    <div className="bg-red-50 border border-red-200 rounded p-3">
                      <div className="font-medium text-red-800 mb-1">Admin Remark:</div>
                      <div className="text-red-700">{r.adminRemark}</div>
                    </div>
                  )}
                  
                  {r.status === 'PENDING' && r.managerResponse && (
                    <div className="bg-blue-50 border border-blue-200 rounded p-3">
                      <div className="font-medium text-blue-800 mb-1">Your Response:</div>
                      <div className="text-blue-700">{r.managerResponse}</div>
                    </div>
                  )}
                  
                  <pre className="text-xs max-w-full overflow-auto bg-muted p-2 rounded">{JSON.stringify(r.data, null, 2)}</pre>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

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
