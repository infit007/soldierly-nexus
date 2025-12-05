import { useState } from 'react'
import { Button } from './ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog'
import { Textarea } from './ui/textarea'
import { Label } from './ui/label'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'

interface ResubmissionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onResubmit: (response: string, updatedData?: any) => void
  loading?: boolean
  adminRemark: string
  requestType: string
  requestData: any
}

export function ResubmissionDialog({ 
  open, 
  onOpenChange, 
  onResubmit, 
  loading = false, 
  adminRemark, 
  requestType, 
  requestData 
}: ResubmissionDialogProps) {
  const [response, setResponse] = useState('')
  const [updatedData, setUpdatedData] = useState<any>(null)

  const handleResubmit = () => {
    if (response.trim()) {
      onResubmit(response.trim(), updatedData)
      setResponse('')
      setUpdatedData(null)
    }
  }

  const handleCancel = () => {
    setResponse('')
    setUpdatedData(null)
    onOpenChange(false)
  }

  const renderRequestData = () => {
    switch (requestType) {
      case 'LEAVE':
        const leave = requestData?.leave || requestData
        return (
          <div className="space-y-2">
            <div><strong>Reason:</strong> {leave.reason || '—'}</div>
            <div><strong>Days:</strong> {leave.days || leave.duration || '—'}</div>
            {leave.startDate && <div><strong>From:</strong> {new Date(leave.startDate).toLocaleDateString()}</div>}
            {leave.endDate && <div><strong>To:</strong> {new Date(leave.endDate).toLocaleDateString()}</div>}
          </div>
        )
      case 'OUTPASS':
        const outpass = requestData?.outpass || requestData
        return (
          <div className="space-y-2">
            <div><strong>Purpose:</strong> {outpass.purpose || '—'}</div>
            {outpass.hours != null && <div><strong>Hours:</strong> {outpass.hours}</div>}
            {outpass.from && <div><strong>From:</strong> {outpass.from}</div>}
            {outpass.to && <div><strong>To:</strong> {outpass.to}</div>}
          </div>
        )
      case 'SALARY':
        const salary = requestData?.salary || requestData
        return (
          <div className="space-y-2">
            <div><strong>Base:</strong> {salary.base || '—'}</div>
            <div><strong>Allowance:</strong> {salary.allowance || '—'}</div>
            <div><strong>Bonus:</strong> {salary.bonus || '—'}</div>
          </div>
        )
      default:
        return <pre className="text-xs bg-muted p-2 rounded overflow-auto">{JSON.stringify(requestData, null, 2)}</pre>
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Respond to Admin Remark</DialogTitle>
          <DialogDescription>
            Review the admin's feedback and provide your response. You can also update the request data if needed.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Badge variant="destructive">Admin Remark</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm bg-destructive/10 dark:bg-destructive/20 border border-destructive/30 dark:border-destructive/50 text-destructive dark:text-destructive-foreground rounded p-3">{adminRemark}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Badge variant="secondary">Original Request</Badge>
                {requestType}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {renderRequestData()}
            </CardContent>
          </Card>

          <div className="grid gap-2">
            <Label htmlFor="response">Your Response to Admin *</Label>
            <Textarea
              id="response"
              placeholder="Explain how you've addressed the admin's concerns..."
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              rows={4}
              required
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleCancel} disabled={loading}>
            Cancel
          </Button>
          <Button 
            onClick={handleResubmit} 
            disabled={loading || !response.trim()}
          >
            {loading ? 'Resubmitting...' : 'Resubmit Request'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
