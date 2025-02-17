import { Badge } from "@/components/ui/badge"

interface VariableTagProps {
  isVariable?: boolean
  variableMode?: 'variable' | 'fixed'
  className?: string
}

export function VariableTag({ 
  isVariable, 
  variableMode 
}: VariableTagProps) {
  if (!isVariable) {
    return <Badge variant="outline">Static</Badge>
  }

  return (
    <Badge 
      variant={variableMode === 'variable' ? 'default' : 'secondary'}
      className={variableMode === 'variable' ? 'bg-blue-500' : ''}
    >
      {variableMode === 'variable' ? 'Variable' : 'Static Instance'}
    </Badge>
  )
} 