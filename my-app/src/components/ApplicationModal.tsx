import React, { useState } from 'react'
import { toast } from 'react-toastify'
import { applyToStudentRequest } from '../api/applications'

interface ApplicationModalProps {
  isOpen: boolean
  onClose: () => void
  requestId: number
  onSuccess?: () => void
}

export function ApplicationModal({ isOpen, onClose, requestId, onSuccess }: ApplicationModalProps) {
  const [introduction, setIntroduction] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!introduction.trim()) {
      toast.error('Vui lòng nhập thư giới thiệu')
      return
    }

    if (introduction.trim().length < 20) {
      toast.error('Thư giới thiệu phải có ít nhất 20 ký tự')
      return
    }

    setIsSubmitting(true)
    try {
      await applyToStudentRequest({
        studentRequestId: requestId,
        introduction: introduction.trim(),
      })

      toast.success('Ứng tuyển thành công!')
      setIntroduction('')
      onClose()
      onSuccess?.()
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || 'Ứng tuyển thất bại'
      toast.error(errorMessage)
      console.error('Error applying:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-900">Ứng tuyển</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-2xl"
            disabled={isSubmitting}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-900 mb-2">
              Thư giới thiệu *
            </label>
            <textarea
              value={introduction}
              onChange={(e) => setIntroduction(e.target.value)}
              placeholder="Giới thiệu bản thân, kinh nghiệm, lý do bạn phù hợp cho vị trí này..."
              rows={6}
              className="w-full border border-slate-300 rounded-lg px-4 py-3 text-slate-700 placeholder-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 resize-none"
              disabled={isSubmitting}
            />
            <p className="text-xs text-slate-500 mt-1">
              Tối thiểu 20 ký tự. Hiện tại: {introduction.length} ký tự
            </p>
          </div>

          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-50 transition-colors disabled:opacity-50"
              disabled={isSubmitting}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  Đang ứng tuyển...
                </span>
              ) : (
                'Ứng tuyển'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
