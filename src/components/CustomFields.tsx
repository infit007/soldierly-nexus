import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Plus, Trash2 } from 'lucide-react'

export type CustomField = { label: string; value: string }

interface CustomFieldsProps {
  value: CustomField[]
  onChange: (next: CustomField[]) => void
  title?: string
  description?: string
}

export function CustomFields({ value, onChange, title = 'Additional Fields', description = 'Add any extra information as label/value pairs' }: CustomFieldsProps) {
  const [fields, setFields] = useState<CustomField[]>(value || [])

  const commit = (next: CustomField[]) => {
    setFields(next)
    onChange(next)
  }

  const addField = () => {
    commit([...(fields || []), { label: '', value: '' }])
  }

  const updateField = (idx: number, key: keyof CustomField, val: string) => {
    const next = fields.map((f, i) => (i === idx ? { ...f, [key]: val } : f))
    commit(next)
  }

  const removeField = (idx: number) => {
    const next = fields.filter((_, i) => i !== idx)
    commit(next)
  }

  return (
    <Card className="shadow-soft">
      <CardHeader className="bg-gradient-card rounded-t-lg">
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 pt-6">
        {fields && fields.length > 0 && (
          <div className="space-y-3">
            {fields.map((f, idx) => (
              <div key={idx} className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-3 items-center">
                <Input
                  placeholder="Field title (e.g., Alternate Phone)"
                  value={f.label}
                  onChange={(e) => updateField(idx, 'label', e.target.value)}
                />
                <Input
                  placeholder="Field value (e.g., +91 98765 43210)"
                  value={f.value}
                  onChange={(e) => updateField(idx, 'value', e.target.value)}
                />
                <Button type="button" variant="outline" className="text-red-600 hover:text-red-700" onClick={() => removeField(idx)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
        <Button type="button" variant="secondary" onClick={addField}>
          <Plus className="h-4 w-4 mr-2" />
          Add Field
        </Button>
      </CardContent>
    </Card>
  )
}

