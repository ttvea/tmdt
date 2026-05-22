import { useState, useEffect } from 'react'
import { AdminLayout } from '../../components/AdminLayout'
import {
  adminGetAllClasses, adminReviewClass,
  type ClassResponse, type ApprovalStatus,
} from '../../api/classApi'
import { getAllSubjects, type SubjectOption } from '../../api/tutorProfile'
import api from '../../api/axios'

type TabKey = 'all' | 'pending' | 'recruiting' | 'teaching' | 'completed' | 'rejected'

const TABS: { key: TabKey; label: string }[] = [
  { key: 'all',        label: 'Tất cả' },
  { key: 'pending',    label: 'Chờ phê duyệt' },
  { key: 'recruiting', label: 'Đang tuyển sinh' },
  { key: 'teaching',   label: 'Đang dạy' },
  { key: 'completed',  label: 'Đã hoàn thành' },
  { key: 'rejected',   label: 'Đã từ chối' },
]

const TAB_FILTER: Record<TabKey, { approval: ApprovalStatus | null; status?: string }> = {
  all:        { approval: null },
  pending:    { approval: 'PENDING' },
  recruiting: { approval: 'APPROVED', status: 'OPEN' },
  teaching:   { approval: 'APPROVED', status: 'CLOSED' },
  completed:  { approval: 'APPROVED', status: 'COMPLETED' },
  rejected:   { approval: 'REJECTED' },
}

function getStatusBadge(cls: ClassResponse) {
  if (cls.approvalStatus === 'PENDING')  return { label: 'Chờ duyệt',      cls: 'bg-yellow-100 text-yellow-700' }
  if (cls.approvalStatus === 'REJECTED') return { label: 'Từ chối',         cls: 'bg-red-100 text-red-600' }
  if (cls.status === 'OPEN')             return { label: 'Đang tuyển sinh', cls: 'bg-blue-100 text-blue-700' }
  if (cls.status === 'CLOSED')           return { label: 'Đang dạy',        cls: 'bg-green-100 text-green-700' }
  if (cls.status === 'COMPLETED')        return { label: 'Hoàn thành',      cls: 'bg-slate-100 text-slate-500' }
  return { label: '—', cls: 'bg-slate-100 text-slate-500' }
}

const PAGE_SIZE = 5

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('vi-VN')
}

export function AdminClasses() {
  const [tab, setTab] = useState<TabKey>('all')
  const [classes, setClasses] = useState<ClassResponse[]>([])
  const [totalElements, setTotalElements] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [subjectFilter, setSubjectFilter] = useState('')
  const [subjectMap, setSubjectMap] = useState<Record<number, string>>({})
  const [allSubjects, setAllSubjects] = useState<SubjectOption[]>([])
  const [tutorMap, setTutorMap] = useState<Record<number, { name: string; avatar: string | null }>>({})
  const [confirmModal, setConfirmModal] = useState<{ id: number; action: 'approve' | 'reject' } | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  const [stats, setStats] = useState({ all: 0, pending: 0, recruiting: 0, teaching: 0, completed: 0 })

  useEffect(() => {
    getAllSubjects().then(data => {
      const m: Record<number, string> = {}
      data.forEach((s: SubjectOption) => { m[s.id] = s.name })
      setSubjectMap(m)
      setAllSubjects(data)
    }).catch(() => {})

    Promise.all([
      adminGetAllClasses(null, 0, 1),
      adminGetAllClasses('PENDING', 0, 1),
      adminGetAllClasses('APPROVED', 0, 1000),
    ]).then(([all, pending, approved]) => {
      const teaching   = approved.content.filter(c => c.status === 'CLOSED').length
      const recruiting = approved.content.filter(c => c.status === 'OPEN').length
      const completed  = approved.content.filter(c => c.status === 'COMPLETED').length
      setStats({
        all: all.totalElements,
        pending: pending.totalElements,
        recruiting,
        teaching,
        completed,
      })
    }).catch(() => {})
  }, [])

  useEffect(() => {
    setPage(0)
  }, [tab, search, subjectFilter])

  useEffect(() => {
    setLoading(true)
    const { approval } = TAB_FILTER[tab]
    const statusFilter = TAB_FILTER[tab].status
    const shouldClientPaginate = Boolean(statusFilter || search.trim() || subjectFilter)

    adminGetAllClasses(approval, shouldClientPaginate ? 0 : page, shouldClientPaginate ? 1000 : PAGE_SIZE)
      .then(async data => {
        let filtered = data.content

        if (statusFilter) {
          filtered = filtered.filter(c => c.status === statusFilter)
        }

        if (search.trim()) {
          const q = search.toLowerCase()
          filtered = filtered.filter(c => c.title.toLowerCase().includes(q))
        }

        if (subjectFilter) {
          filtered = filtered.filter(c => String(c.subjectId) === subjectFilter)
        }

        const tutorIds = [...new Set(filtered.map(c => c.tutorId))]
        const newTutorMap: Record<number, { name: string; avatar: string | null }> = { ...tutorMap }
        await Promise.all(
          tutorIds
            .filter(id => !newTutorMap[id])
            .map(id =>
              api.get(`/api/tutor-profile/${id}`)
                .then(res => {
                  newTutorMap[id] = {
                    name: res.data.fullName || `Gia sư #${id}`,
                    avatar: res.data.avatar || null,
                  }
                })
                .catch(() => { newTutorMap[id] = { name: `Gia sư #${id}`, avatar: null } })
            )
        )
        setTutorMap(newTutorMap)

        if (shouldClientPaginate) {
          const start = page * PAGE_SIZE
          setClasses(filtered.slice(start, start + PAGE_SIZE))
          setTotalElements(filtered.length)
          setTotalPages(Math.max(1, Math.ceil(filtered.length / PAGE_SIZE)))
        } else {
          setClasses(filtered)
          setTotalElements(data.totalElements)
          setTotalPages(data.totalPages)
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [tab, page, search, subjectFilter])

  const handleReview = async (id: number, approved: boolean, reason?: string) => {
    try {
      await adminReviewClass(id, approved, reason)
      setClasses(prev => prev.filter(c => c.id !== id))
      setTotalElements(prev => prev - 1)
    } catch {
      alert('Thao tác thất bại.')
    }
    setConfirmModal(null)
    setRejectReason('')
  }

  return (
    <AdminLayout activePath="/admin/classes">
      <div className="mb-6">
        <p className="text-2xl font-bold text-blue-900">Danh sách lớp học</p>
        <p className="text-sm text-slate-500 mt-1">Quản lý và kiểm duyệt các yêu cầu mở lớp từ gia sư trên EduMatch Pro.</p>
      </div>

      <div className="grid grid-cols-5 gap-4 mb-6">
        {[
          { label: 'TẤT CẢ', value: stats.all, accent: true },
          { label: 'CHỜ PHÊ DUYỆT', value: stats.pending, accent: true },
          { label: 'ĐANG TUYỂN SINH', value: stats.recruiting, accent: true },
          { label: 'ĐANG DẠY', value: stats.teaching, accent: true },
          { label: 'ĐÃ HOÀN THÀNH', value: stats.completed, accent: true },
        ].map(s => (
          <div key={s.label} className={`bg-white rounded-xl border p-5 ${s.accent ? 'border-l-4 border-l-blue-700 border-slate-200' : 'border-slate-200'}`}>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">{s.label}</p>
            <p className="text-3xl font-bold text-slate-900 mt-2">{String(s.value).padStart(2, '0')}</p>
          </div>
        ))}
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-4 mb-5 flex items-center gap-3">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" strokeWidth="2" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Tìm kiếm tên lớp, ID hoặc gia sư..."
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={subjectFilter}
          onChange={e => setSubjectFilter(e.target.value)}
          className="px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          <option value="">Tất cả môn học</option>
          {allSubjects.map(s => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
        <select className="px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
          <option>Ngày gửi</option>
          <option>Ngày tạo mới nhất</option>
          <option>Ngày tạo cũ nhất</option>
        </select>
        <button
          onClick={() => { setSearch(''); setSubjectFilter('') }}
          className="px-4 py-2 text-sm font-semibold text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
        >
          Xóa lọc
        </button>
        <button className="px-4 py-2 text-sm font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors">
          Áp dụng
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="flex border-b border-slate-200">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 py-3 text-sm font-semibold transition-colors border-b-2 -mb-px ${
                tab === t.key
                  ? 'border-blue-700 text-blue-700 bg-blue-50/50'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="mt-3">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-slate-400">
            <svg className="w-5 h-5 animate-spin mr-2" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            Đang tải...
          </div>
        ) : classes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-2">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-sm">Không có lớp học nào.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                {['Tên lớp học', 'Gia sư', 'Môn học', 'Sĩ số tối đa', 'Ngày gửi', 'Trạng thái', 'Hành động'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {classes.map((cls, idx) => (
                <tr key={cls.id} className={`border-b border-slate-100 hover:bg-slate-50 transition-colors ${idx === classes.length - 1 ? 'border-b-0' : ''}`}>
                  <td className="px-4 py-4">
                    <p className="font-semibold text-slate-800">{cls.title}</p>
                    <p className="text-xs text-slate-400">ID: CLS-{cls.id}</p>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      {(() => {
                        const tutor = tutorMap[cls.tutorId]
                        const name = tutor?.name || `Gia sư #${cls.tutorId}`
                        const avatar = tutor?.avatar
                        const initial = name.charAt(0).toUpperCase()
                        return (
                          <>
                            {avatar ? (
                              <img src={avatar} alt={name}
                                className="w-8 h-8 rounded-full object-cover shrink-0" />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-700 shrink-0">
                                {initial}
                              </div>
                            )}
                            <span className="text-slate-700 text-xs font-medium">{name}</span>
                          </>
                        )
                      })()}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className="inline-block px-2 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold">
                      {cls.subjectName || subjectMap[cls.subjectId] || '—'}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-slate-600">{cls.maxStudents} học sinh</td>
                  <td className="px-4 py-4 text-slate-500">{formatDate(cls.createdAt)}</td>
                  <td className="px-4 py-4">
                    {(() => {
                      const badge = getStatusBadge(cls)
                      return (
                        <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${badge.cls}`}>
                          {badge.label}
                        </span>
                      )
                    })()}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => window.location.href = `/admin/classes/${cls.id}`}
                        className="text-blue-400 hover:text-blue-600 transition-colors" title="Xem chi tiết"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                      {cls.approvalStatus === 'PENDING' && (
                        <>
                          <button
                            onClick={() => setConfirmModal({ id: cls.id, action: 'approve' })}
                            className="text-green-500 hover:text-green-700 transition-colors" title="Duyệt"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => setConfirmModal({ id: cls.id, action: 'reject' })}
                            className="text-red-400 hover:text-red-600 transition-colors" title="Từ chối"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {!loading && totalPages > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
            <span className="text-xs text-slate-400">
              Hiển thị {page * PAGE_SIZE + 1} - {Math.min((page + 1) * PAGE_SIZE, totalElements)} của {totalElements} yêu cầu {tab === 'pending' ? 'chờ duyệt' : ''}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="w-8 h-8 rounded-lg border border-slate-300 flex items-center justify-center text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="w-8 h-8 rounded-lg border border-slate-300 flex items-center justify-center text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
      </div>

      {confirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${confirmModal.action === 'approve' ? 'bg-green-100' : 'bg-red-100'}`}>
                {confirmModal.action === 'approve' ? (
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </div>
              <p className="text-sm font-semibold text-slate-800">
                {confirmModal.action === 'approve' ? 'Xác nhận duyệt lớp học này?' : 'Từ chối lớp học này?'}
              </p>
            </div>
            {confirmModal.action === 'reject' && (
              <textarea
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                placeholder="Nhập lý do từ chối..."
                rows={3}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            )}
            <div className="flex gap-3">
              <button
                onClick={() => { setConfirmModal(null); setRejectReason('') }}
                className="flex-1 py-2.5 rounded-lg border border-slate-300 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Hủy
              </button>
              <button
                onClick={() => handleReview(
                  confirmModal.id,
                  confirmModal.action === 'approve',
                  confirmModal.action === 'reject' ? rejectReason : undefined
                )}
                className={`flex-1 py-2.5 rounded-lg text-white text-sm font-semibold transition-colors ${
                  confirmModal.action === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-500 hover:bg-red-600'
                }`}
              >
                {confirmModal.action === 'approve' ? 'Duyệt' : 'Từ chối'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
