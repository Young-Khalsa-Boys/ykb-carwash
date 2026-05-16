'use client'

import Modal from './Modal'

interface AlertModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  message: string
  type?: 'success' | 'error' | 'info'
}

export default function AlertModal({ isOpen, onClose, title, message, type = 'info' }: AlertModalProps) {
  const colorClass = type === 'success' ? 'text-green-600' : type === 'error' ? 'text-red-600' : 'text-primary'

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="space-y-4">
        <p className={`text-sm ${colorClass} font-medium`}>{message}</p>
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-primary text-white rounded-lg font-bold hover:bg-opacity-90 transition-all"
          >
            OK
          </button>
        </div>
      </div>
    </Modal>
  )
}
