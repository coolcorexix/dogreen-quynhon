import React, { useState } from 'react'
import { LoginForm } from './LoginForm'
import { SignupForm } from './SignupForm'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  initialMode?: 'login' | 'signup'
}

export const AuthModal: React.FC<AuthModalProps> = ({ 
  isOpen, 
  onClose, 
  initialMode = 'login' 
}) => {
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode)

  if (!isOpen) return null

  return (
    <>
      {mode === 'login' ? (
        <LoginForm 
          onSwitchToSignup={() => setMode('signup')} 
          onClose={onClose} 
        />
      ) : (
        <SignupForm 
          onSwitchToLogin={() => setMode('login')} 
          onClose={onClose} 
        />
      )}
    </>
  )
}
