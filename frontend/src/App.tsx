import { useEffect, useState, useRef } from 'react'
import { Mail, User, Star, Sparkles, Paperclip, Trash2 } from 'lucide-react'
import { createCandidate, fetchCandidates, analyzeCandidate, uploadResume, deleteCandidate, updateCandidateStatus } from './api/candidateService'

type Candidate = {
  _id: string
  name: string
  email?: string
  role?: string
  status?: 'Applied' | 'Interviewing' | 'Hired' | 'Rejected'
  matchScore?: number
  aiSummary?: string
  resumeUrl?: string
}

function App() {
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [isAddCandidateOpen, setIsAddCandidateOpen] = useState(false)
  const [newCandidateName, setNewCandidateName] = useState('')
  const [newCandidateEmail, setNewCandidateEmail] = useState('')
  const [newCandidateRole, setNewCandidateRole] = useState('')
  const [savingCandidate, setSavingCandidate] = useState(false)
  const [saveCandidateError, setSaveCandidateError] = useState<string | null>(null)
  const [analyzingId, setAnalyzingId] = useState<string | null>(null)
  const [uploadingId, setUploadingId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null)
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)

  useEffect(() => {
    const loadCandidates = async () => {
      try {
        const data = await fetchCandidates()
        setCandidates(Array.isArray(data) ? data : [])
      } catch (err) {
        setError('Failed to load candidates. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    loadCandidates()
  }, [])

  const closeAddCandidate = () => {
    setIsAddCandidateOpen(false)
    setNewCandidateName('')
    setNewCandidateEmail('')
    setNewCandidateRole('')
    setSaveCandidateError(null)
    setSavingCandidate(false)
  }

  const onSubmitNewCandidate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSaveCandidateError(null)

    const name = newCandidateName.trim()
    const email = newCandidateEmail.trim()
    const role = newCandidateRole.trim()

    if (!name || !email) {
      setSaveCandidateError('Name and email are required.')
      return
    }

    setSavingCandidate(true)
    try {
      const created = await createCandidate({ name, email, role: role || undefined })
      if (!created?._id) {
        throw new Error('Create candidate failed')
      }
      setCandidates((prev) => [created, ...prev])
      closeAddCandidate()
    } catch (err) {
      setSaveCandidateError('Failed to save candidate. Please try again.')
      setSavingCandidate(false)
    }
  }

  const handleAnalyze = async (id: string) => {
    console.log('Starting AI analysis for candidate:', id)
    setAnalyzingId(id)
    try {
      const result = await analyzeCandidate(id)
      console.log('AI analysis result:', result)
      // Fetch fresh data from the backend to ensure UI is in sync
      const freshData = await fetchCandidates()
      console.log('Refreshed candidates:', freshData)
      setCandidates(Array.isArray(freshData) ? freshData : [])
    } catch (err) {
      console.error('AI analysis error:', err)
    } finally {
      setAnalyzingId(null)
    }
  }

  const handleUploadClick = (id: string) => {
    setSelectedCandidateId(id)
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !selectedCandidateId) return

    console.log('Uploading resume for candidate:', selectedCandidateId)
    setUploadingId(selectedCandidateId)

    try {
      await uploadResume(selectedCandidateId, file)
      console.log('Resume uploaded, triggering AI analysis...')
      // Automatically trigger AI analysis after upload
      await analyzeCandidate(selectedCandidateId)
      // Fetch fresh data
      const freshData = await fetchCandidates()
      setCandidates(Array.isArray(freshData) ? freshData : [])
    } catch (err) {
      console.error('Upload/analysis error:', err)
    } finally {
      setUploadingId(null)
      setSelectedCandidateId(null)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleDelete = async (id: string, name: string) => {
    console.log('Delete function called for candidate:', name, 'with id:', id);
    if (!window.confirm(`Are you sure you want to delete candidate "${name}"? This action cannot be undone.`)) {
      console.log('Delete cancelled by user');
      return;
    }

    try {
      console.log('Attempting to delete candidate with id:', id);
      const success = await deleteCandidate(id);
      console.log('Delete API response success:', success);
      if (success) {
        // Refresh the candidate list from the server to ensure consistency
        const freshData = await fetchCandidates();
        setCandidates(Array.isArray(freshData) ? freshData : []);
        console.log('Candidate list refreshed from server');
      } else {
        console.error('Delete API returned success=false');
        alert('Failed to delete candidate. Please try again.');
      }
    } catch (err) {
      console.error('Delete error:', err);
      alert('Failed to delete candidate. Please try again.');
    }
  }

  const openDetailModal = (candidate: Candidate) => {
    setSelectedCandidate(candidate);
    setIsDetailModalOpen(true);
  };

  const cycleStatus = async (id: string, currentStatus: string) => {
    // Define the status progression order
    const statusOrder: Array<'Applied' | 'Interviewing' | 'Hired' | 'Rejected'> = ['Applied', 'Interviewing', 'Hired', 'Rejected'];
    const currentIndex = statusOrder.indexOf(currentStatus as 'Applied' | 'Interviewing' | 'Hired' | 'Rejected');
    // Cycle to next status, or back to first if at the end
    const nextIndex = (currentIndex + 1) % statusOrder.length;
    const newStatus = statusOrder[nextIndex];

    try {
      // Update the candidate status
      const updatedCandidate = await updateCandidateStatus(id, newStatus);
      
      // Update the local state
      setCandidates(prev => 
        prev.map(candidate => 
          candidate._id === id ? { ...candidate, status: newStatus } : candidate
        )
      );
    } catch (err) {
      console.error('Update status error:', err);
      alert('Failed to update status. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      {/* Hidden file input for resume upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".pdf,.doc,.docx"
        className="hidden"
      />
      <div className="max-w-6xl mx-auto px-4 py-8 glass smooth-transition">
        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">
              Talent Pipeline AI
            </h1>
            <p className="mt-1 text-sm text-gray-300">
              A professional CRM for recruiters to manage candidates with AI-driven insights.
            </p>
          </div>
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 btn-dark btn-hover hover-lift"
            onClick={() => {
              setSaveCandidateError(null)
              setIsAddCandidateOpen(true)
            }}
          >
            <User className="mr-2 h-4 w-4" />
            Add Candidate
          </button>
        </header>

        {isAddCandidateOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
            role="dialog"
            aria-modal="true"
            aria-label="Add Candidate"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) closeAddCandidate()
            }}
          >
            <div className="w-full max-w-md rounded-xl bg-white shadow-xl border border-gray-100 modal-dark">
              <div className="flex items-start justify-between gap-4 px-5 py-4 border-b border-gray-100">
                <div>
                  <h2 className="text-base font-semibold text-white">Add Candidate</h2>
                  <p className="mt-1 text-sm text-gray-300">Enter a name and role to save a candidate.</p>
                </div>
                <button
                  type="button"
                  className="rounded-md p-2 text-gray-300 hover:text-white hover:bg-gray-700"
                  onClick={closeAddCandidate}
                  aria-label="Close"
                >
                  <span className="text-lg leading-none">×</span>
                </button>
              </div>

              <form className="px-5 py-4" onSubmit={onSubmitNewCandidate}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-200" htmlFor="candidate-name">
                      Name
                    </label>
                    <input
                      id="candidate-name"
                      className="mt-1 w-full rounded-lg border border-gray-600 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 input-dark"
                      value={newCandidateName}
                      onChange={(e) => setNewCandidateName(e.target.value)}
                      placeholder="e.g. Jordan Lee"
                      autoFocus
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-200" htmlFor="candidate-email">
                      Email
                    </label>
                    <input
                      id="candidate-email"
                      type="email"
                      className="mt-1 w-full rounded-lg border border-gray-600 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 input-dark"
                      value={newCandidateEmail}
                      onChange={(e) => setNewCandidateEmail(e.target.value)}
                      placeholder="e.g. jordan@example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-200" htmlFor="candidate-role">
                      Role
                    </label>
                    <input
                      id="candidate-role"
                      className="mt-1 w-full rounded-lg border border-gray-600 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 input-dark"
                      value={newCandidateRole}
                      onChange={(e) => setNewCandidateRole(e.target.value)}
                      placeholder="e.g. Frontend Engineer"
                    />
                  </div>

                  {saveCandidateError && (
                    <p className="text-sm font-medium text-red-400">{saveCandidateError}</p>
                  )}
                </div>

                <div className="mt-5 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    className="inline-flex items-center justify-center rounded-lg border border-gray-600 bg-transparent px-4 py-2 text-sm font-medium text-gray-200 hover:bg-gray-700 btn-hover hover-scale"
                    onClick={closeAddCandidate}
                    disabled={savingCandidate}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50 btn-dark btn-hover hover-lift"
                    disabled={savingCandidate}
                  >
                    {savingCandidate ? 'Saving…' : 'Save'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Content */}
        <main className="bg-white shadow-sm rounded-xl border border-gray-100 glass">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-400 border-t-transparent" />
              <span className="ml-3 text-sm text-gray-300">Loading candidates...</span>
            </div>
          ) : error ? (
            <div className="py-10 px-6 text-center">
              <p className="text-sm font-medium text-red-400">{error}</p>
            </div>
          ) : !Array.isArray(candidates) || candidates.length === 0 ? (
            <div className="py-12 px-6 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-700">
                <User className="h-6 w-6 text-gray-300" />
              </div>
              <h2 className="text-lg font-semibold text-white">No candidates found</h2>
              <p className="mt-1 text-sm text-gray-300">
                Start building your talent pipeline by adding your first candidate.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-600 glass">
                <thead className="bg-transparent">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-300"
                    >
                      Candidate
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-300"
                    >
                      Role
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-300"
                    >
                      Status
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-300"
                    >
                      Match Score
                    </th>
                    <th scope="col" className="px-6 py-3">
                      <span className="sr-only">Contact</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-600 bg-transparent">
                  {(Array.isArray(candidates) ? candidates : []).map((candidate, index) => (
                    <tr key={candidate && (candidate as { _id?: string })._id ? String((candidate as { _id: string })._id) : `row-${index}`} className="row-hover">
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="flex items-center">
                          <div className="mr-3 flex h-9 w-9 items-center justify-center rounded-full bg-indigo-900 text-sm font-semibold text-indigo-200">
                            {(candidate.name?.charAt(0) ?? '?').toUpperCase()}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-white">
                              {candidate.name || 'Unnamed Candidate'}
                            </div>
                            <div className="mt-0.5 flex items-center text-xs text-gray-400">
                              <Mail className="mr-1 h-3 w-3" />
                              <span>{candidate.email || 'No email'}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <span className="text-sm text-gray-200">
                          {candidate.role || '—'}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <button
                          type="button"
                          onClick={() => cycleStatus(candidate._id, candidate.status || 'Applied')}
                          className="inline-flex items-center rounded-full bg-gray-700 px-2.5 py-0.5 text-xs font-medium text-gray-200 hover:bg-gray-600 transition-colors status-badge btn-hover hover-scale"
                          title="Click to cycle status"
                        >
                          {candidate.status || 'Applied'}
                        </button>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <div
                          className="flex items-center text-sm"
                          title={candidate.aiSummary || undefined}
                        >
                          <Star className={`mr-1 h-4 w-4 ${typeof candidate.matchScore === 'number' ? 'text-yellow-400' : 'text-gray-500'}`} />
                          <span
                            className={
                              typeof candidate.matchScore === 'number'
                                ? candidate.matchScore >= 80
                                  ? 'text-green-400 font-semibold'
                                  : candidate.matchScore >= 60
                                    ? 'text-yellow-400 font-semibold'
                                    : 'text-red-400 font-semibold'
                                : 'text-gray-400'
                            }
                          >
                            {candidate.matchScore ?? '—'}
                          </span>
                          {typeof candidate.matchScore === 'number' && (
                            <span className="ml-0.5 text-xs text-gray-400">/ 100</span>
                          )}
                        </div>
                        {candidate.aiSummary && (
                          <p className="mt-1 text-xs text-gray-400 max-w-[200px] truncate" title={candidate.aiSummary}>
                            {candidate.aiSummary}
                          </p>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-right text-sm">
                        <button
                          type="button"
                          className="inline-flex items-center justify-center rounded-md p-1.5 text-gray-400 hover:text-gray-200 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed btn-dark btn-hover"
                          aria-label="Upload Resume"
                          disabled={uploadingId === candidate._id}
                          onClick={() => handleUploadClick(candidate._id)}
                          title={candidate.resumeUrl ? 'Resume uploaded - click to replace' : 'Upload Resume'}
                        >
                          {uploadingId === candidate._id ? (
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-400 border-t-transparent" />
                          ) : (
                            <Paperclip className={`h-4 w-4 ${candidate.resumeUrl ? 'text-green-400' : ''}`} />
                          )}
                        </button>
                        <button
                          type="button"
                          className="inline-flex items-center justify-center rounded-md p-1.5 text-indigo-400 hover:text-indigo-200 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed btn-dark ml-1 btn-hover"
                          aria-label="Analyze with AI"
                          disabled={analyzingId === candidate._id}
                          onClick={() => handleAnalyze(candidate._id)}
                        >
                          {analyzingId === candidate._id ? (
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-400 border-t-transparent" />
                          ) : (
                            <Sparkles className="h-4 w-4" />
                          )}
                        </button>
                        <button
                          type="button"
                          className="ml-2 text-indigo-400 hover:text-indigo-200 font-medium btn-dark px-2 py-1 rounded btn-hover hover-glow"
                          onClick={() => openDetailModal(candidate)}
                        >
                          View
                        </button>
                        <button
                          type="button"
                          className="ml-2 text-red-400 hover:text-red-200 btn-dark px-2 py-1 rounded btn-hover hover-glow"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(candidate._id, candidate.name);
                          }}
                          aria-label="Delete candidate"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </main>
        
        {/* Detail Modal */}
        {isDetailModalOpen && selectedCandidate && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="detail-modal-title"
            onMouseDown={() => setIsDetailModalOpen(false)}
          >
            <div 
              className="w-full max-w-2xl rounded-xl bg-white shadow-xl border border-gray-100 max-h-[90vh] overflow-y-auto modal-dark"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-4 px-5 py-4 border-b border-gray-600">
                <div>
                  <h2 id="detail-modal-title" className="text-xl font-semibold text-white">
                    {selectedCandidate.name}
                  </h2>
                  <p className="mt-1 text-sm text-gray-300">Candidate Details</p>
                </div>
                <button
                  type="button"
                  className="rounded-md p-2 text-gray-300 hover:text-white hover:bg-gray-700 btn-hover hover-scale"
                  onClick={() => setIsDetailModalOpen(false)}
                  aria-label="Close"
                >
                  <span className="text-lg leading-none">×</span>
                </button>
              </div>

              <div className="px-5 py-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-200">Name</label>
                    <p className="mt-1 text-sm text-white">{selectedCandidate.name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-200">Email</label>
                    <p className="mt-1 text-sm text-white">{selectedCandidate.email || 'No email provided'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-200">Role</label>
                    <p className="mt-1 text-sm text-white">{selectedCandidate.role || 'No role specified'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-200">Status</label>
                    <span className="inline-flex items-center rounded-full bg-gray-700 px-2.5 py-0.5 text-xs font-medium text-gray-200 mt-1 status-badge">
                      {selectedCandidate.status || 'Applied'}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-200">Match Score</label>
                    <div className="mt-1 flex items-center">
                      <Star className={`mr-1 h-4 w-4 ${typeof selectedCandidate.matchScore === 'number' ? 'text-yellow-400' : 'text-gray-500'}`} />
                      <span
                        className={
                          typeof selectedCandidate.matchScore === 'number'
                            ? selectedCandidate.matchScore >= 80
                              ? 'text-green-400 font-semibold'
                              : selectedCandidate.matchScore >= 60
                                ? 'text-yellow-400 font-semibold'
                                : 'text-red-400 font-semibold'
                            : 'text-gray-400'
                        }
                      >
                        {selectedCandidate.matchScore ?? '—'} {typeof selectedCandidate.matchScore === 'number' && '/ 100'}
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-200">Resume</label>
                    <div className="mt-1">
                      {selectedCandidate.resumeUrl ? (
                        <a 
                          href={`http://localhost:5000${selectedCandidate.resumeUrl}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-indigo-400 hover:text-indigo-200 underline text-sm"
                        >
                          Open Resume
                        </a>
                      ) : (
                        <p className="text-sm text-gray-400">No resume uploaded</p>
                      )}
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-200">AI Summary</label>
                  <div className="mt-1 p-3 bg-gray-800 rounded-lg min-h-[60px]">
                    <p className="text-sm text-gray-200">
                      {selectedCandidate.aiSummary || 'No AI analysis available. Click "Analyze with AI" to generate insights.'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="px-5 py-4 border-t border-gray-600 flex justify-end">
                <button
                  type="button"
                  className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 btn-dark btn-hover hover-lift"
                  onClick={() => setIsDetailModalOpen(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default App
