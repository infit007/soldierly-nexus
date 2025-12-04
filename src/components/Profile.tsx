import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Edit3, Save, X } from 'lucide-react'

export default function Profile() {
  const { user, updateArmyNumber } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [newArmyNumber, setNewArmyNumber] = useState(user?.armyNumber || '')
  const [isLoading, setIsLoading] = useState(false)

  const handleSave = async () => {
    if (!newArmyNumber.trim()) return
    
    setIsLoading(true)
    try {
      await updateArmyNumber(newArmyNumber.trim())
      setIsEditing(false)
    } catch (error) {
      console.error('Failed to update army number:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    setNewArmyNumber(user?.armyNumber || '')
    setIsEditing(false)
  }

  if (!user) return null

  return (
    <div className="max-w-2xl mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Manage your account information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Username</Label>
              <p className="text-sm">{user.username}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Email</Label>
              <p className="text-sm">{user.email}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Role</Label>
              <p className="text-sm capitalize">{user.role.toLowerCase()}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Army Number</Label>
              {isEditing ? (
                <div className="flex items-center gap-2 mt-1">
                  <Input
                    value={newArmyNumber}
                    onChange={(e) => setNewArmyNumber(e.target.value)}
                    placeholder="Enter army number"
                    className="text-sm"
                  />
                  <Button
                    size="sm"
                    onClick={handleSave}
                    disabled={isLoading}
                    className="h-8 px-2"
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCancel}
                    className="h-8 px-2"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-sm">{user.armyNumber || 'Not set'}</p>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setIsEditing(true)}
                    className="h-6 px-2"
                  >
                    <Edit3 className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
