import { useEffect, useMemo, useState } from 'react'
import './App.css'
import { api } from './services/api'

const emptyForm = {
  subscriberName: '',
  podcastTitle: '',
  startDate: '',
  active: '',
}

const isBlank = (value) => !value || !value.trim()

const normalizeDateForInput = (value) => {
  if (!value) {
    return ''
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value
  }

  const match = value.match(/^(\d{2})[-/](\d{2})[-/](\d{4})$/)
  if (match) {
    const [, day, month, year] = match
    return `${year}-${month}-${day}`
  }

  return value
}

const isValidDateString = (value) => {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false
  }

  const parsed = new Date(`${value}T00:00:00.000Z`)
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value
}

const normalizeSubscriptions = (data) =>
  (Array.isArray(data) ? data : []).map((item) => ({
    ...item,
    startDate: normalizeDateForInput(item.startDate),
  }))

function App() {
  const [subscriptions, setSubscriptions] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const [formData, setFormData] = useState(emptyForm)
  const [formErrors, setFormErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [detailsItem, setDetailsItem] = useState(null)
  const [detailsLoading, setDetailsLoading] = useState(false)
  const [detailsError, setDetailsError] = useState('')

  const [editItemId, setEditItemId] = useState(null)
  const [editForm, setEditForm] = useState(emptyForm)
  const [editErrors, setEditErrors] = useState({})
  const [isUpdating, setIsUpdating] = useState(false)

  const [deleteId, setDeleteId] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const fetchSubscriptions = async (showLoader = true) => {
    try {
      if (showLoader) {
        setLoading(true)
      }
      setLoadError('')
      const data = await api.getAllSubscriptions()
      setSubscriptions(normalizeSubscriptions(data))
    } catch (error) {
      setLoadError(error.message || 'Unable to load subscriptions right now.')
    } finally {
      if (showLoader) {
        setLoading(false)
      }
    }
  }

  useEffect(() => {
    let cancelled = false

    api.getAllSubscriptions()
      .then((data) => {
        if (!cancelled) {
          setSubscriptions(normalizeSubscriptions(data))
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setLoadError(error.message || 'Unable to load subscriptions right now.')
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  const summary = useMemo(() => {
    const total = subscriptions.length
    const active = subscriptions.filter((item) => item.active === true).length
    const inactive = total - active

    return { total, active, inactive }
  }, [subscriptions])

  const filteredSubscriptions = useMemo(() => {
    const searchValue = searchTerm.trim().toLowerCase()

    return subscriptions.filter((item) => {
      const matchesSearch =
        !searchValue ||
        `${item.subscriberName || ''}`.toLowerCase().includes(searchValue) ||
        `${item.podcastTitle || ''}`.toLowerCase().includes(searchValue)

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && item.active === true) ||
        (statusFilter === 'inactive' && item.active === false)

      return matchesSearch && matchesStatus
    })
  }, [subscriptions, searchTerm, statusFilter])

  const showAlert = (message, type) => {
    if (type === 'success') {
      setSuccessMessage(message)
      setErrorMessage('')
    } else {
      setErrorMessage(message)
      setSuccessMessage('')
    }
  }

  const validateSubscription = (payload) => {
    const errors = {}

    if (isBlank(payload.subscriberName)) {
      errors.subscriberName = 'Subscriber name is required.'
    }

    if (isBlank(payload.podcastTitle)) {
      errors.podcastTitle = 'Podcast title is required.'
    }

    if (!isValidDateString(payload.startDate)) {
      errors.startDate = 'Please provide a valid date in YYYY-MM-DD format.'
    }

    if (typeof payload.active !== 'boolean') {
      errors.active = 'Active status must be selected.'
    }

    return errors
  }

  const handleFormChange = (event) => {
    const { name, value } = event.target
    const nextValue = name === 'active' ? (value === '' ? '' : value === 'true') : value
    setFormData((current) => ({ ...current, [name]: nextValue }))
    setFormErrors((current) => ({ ...current, [name]: '' }))
  }

  const handleAddSubmit = async (event) => {
    event.preventDefault()
    const errors = validateSubscription(formData)
    setFormErrors(errors)

    if (Object.keys(errors).length > 0) {
      showAlert('Please correct the highlighted fields before saving.', 'error')
      return
    }

    setIsSubmitting(true)
    try {
      await api.createSubscription({
        subscriberName: formData.subscriberName.trim(),
        podcastTitle: formData.podcastTitle.trim(),
        startDate: formData.startDate,
        active: formData.active,
      })

      setFormData(emptyForm)
      setFormErrors({})
      await fetchSubscriptions(false)
      showAlert('Subscription created successfully.', 'success')
    } catch (error) {
      showAlert(error.message || 'Unable to create the subscription.', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const openDetails = async (id) => {
    setDetailsLoading(true)
    setDetailsError('')
    setDetailsItem(null)

    try {
      const response = await api.getSubscriptionById(id)
      setDetailsItem({
        ...response,
        startDate: normalizeDateForInput(response.startDate),
      })
    } catch (error) {
      setDetailsError(error.message || 'Unable to fetch subscription details.')
    } finally {
      setDetailsLoading(false)
    }
  }

  const openEditForm = async (id) => {
    try {
      const item = await api.getSubscriptionById(id)
      setEditItemId(id)
      setEditForm({
        subscriberName: item.subscriberName || '',
        podcastTitle: item.podcastTitle || '',
        startDate: normalizeDateForInput(item.startDate) || '',
        active: Boolean(item.active),
      })
      setEditErrors({})
      setErrorMessage('')
      setSuccessMessage('')
    } catch (error) {
      showAlert(error.message || 'Unable to load the selected subscription.', 'error')
    }
  }

  const handleEditChange = (event) => {
    const { name, value } = event.target
    const nextValue = name === 'active' ? (value === '' ? '' : value === 'true') : value
    setEditForm((current) => ({ ...current, [name]: nextValue }))
    setEditErrors((current) => ({ ...current, [name]: '' }))
  }

  const handleUpdateSubmit = async (event) => {
    event.preventDefault()
    const errors = validateSubscription(editForm)
    setEditErrors(errors)

    if (Object.keys(errors).length > 0) {
      showAlert('Please correct the form before updating the subscription.', 'error')
      return
    }

    setIsUpdating(true)
    try {
      await api.updateSubscription(editItemId, {
        subscriberName: editForm.subscriberName.trim(),
        podcastTitle: editForm.podcastTitle.trim(),
        startDate: editForm.startDate,
        active: editForm.active,
      })

      setEditItemId(null)
      setEditForm(emptyForm)
      await fetchSubscriptions(false)
      showAlert('Subscription updated successfully.', 'success')
    } catch (error) {
      showAlert(error.message || 'Unable to update the subscription.', 'error')
    } finally {
      setIsUpdating(false)
    }
  }

  const confirmDelete = async () => {
    if (!deleteId) {
      return
    }

    setIsDeleting(true)
    try {
      await api.deleteSubscription(deleteId)
      setDeleteId(null)
      await fetchSubscriptions(false)
      showAlert('Subscription deleted successfully.', 'success')
    } catch (error) {
      showAlert(error.message || 'Unable to delete the subscription.', 'error')
    } finally {
      setIsDeleting(false)
    }
  }

  const renderStatusBadge = (active) => (
    <span className={`badge rounded-pill ${active ? 'bg-success-subtle text-success-emphasis' : 'bg-secondary-subtle text-secondary-emphasis'}`}>
      {active ? 'Active' : 'Inactive'}
    </span>
  )

  return (
    <div className="app-shell">
      <nav className="navbar navbar-expand-lg dashboard-navbar">
        <div className="container-fluid px-4 px-lg-5">
          <a className="navbar-brand fw-bold" href="#top">
            <span className="brand-icon">🎙️</span>
            Podcast Subscription Manager
          </a>

          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#mainNav"
            aria-controls="mainNav"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon" />
          </button>

          <div className="collapse navbar-collapse" id="mainNav">
            <ul className="navbar-nav ms-auto align-items-lg-center gap-lg-2">
              <li className="nav-item">
                <a className="nav-link active" href="#dashboard">Dashboard</a>
              </li>
              <li className="nav-item">
                <a className="nav-link" href="#subscriptions">All Subscriptions</a>
              </li>
              <li className="nav-item">
                <a className="nav-link cta-link" href="#subscription-form">Add Subscription</a>
              </li>
            </ul>
          </div>
        </div>
      </nav>

      <main className="container py-4 py-lg-5">
        <section id="dashboard" className="mb-4">
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4">
            <div>
              <p className="eyebrow text-uppercase">Overview</p>
              <h1 className="page-title mb-0">Podcast subscription dashboard</h1>
            </div>
            <button type="button" className="btn btn-primary" onClick={() => fetchSubscriptions()}>
              Refresh
            </button>
          </div>

          <div className="row g-3">
            <div className="col-md-4">
              <div className="stat-card">
                <span className="stat-label">Total subscriptions</span>
                <div className="stat-value">{summary.total}</div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="stat-card accent-card">
                <span className="stat-label">Active subscriptions</span>
                <div className="stat-value">{summary.active}</div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="stat-card secondary-card">
                <span className="stat-label">Inactive subscriptions</span>
                <div className="stat-value">{summary.inactive}</div>
              </div>
            </div>
          </div>
        </section>

        {(successMessage || errorMessage) && (
          <div className={`alert ${successMessage ? 'alert-success' : 'alert-danger'} alert-dismissible fade show`} role="alert">
            {successMessage || errorMessage}
            <button type="button" className="btn-close" onClick={() => { setSuccessMessage(''); setErrorMessage('') }} aria-label="Close" />
          </div>
        )}

        <section id="subscription-form" className="mb-4">
          <div className="card form-card shadow-sm border-0">
            <div className="card-header bg-transparent border-0 pb-0">
              <h2 className="section-title">Add subscription</h2>
            </div>
            <div className="card-body pt-3">
              <form onSubmit={handleAddSubmit} noValidate>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label htmlFor="subscriberName" className="form-label">Subscriber Name</label>
                    <input
                      id="subscriberName"
                      name="subscriberName"
                      className={`form-control ${formErrors.subscriberName ? 'is-invalid' : ''}`}
                      type="text"
                      value={formData.subscriberName}
                      onChange={handleFormChange}
                      placeholder="Enter subscriber name"
                    />
                    {formErrors.subscriberName && <div className="invalid-feedback d-block">{formErrors.subscriberName}</div>}
                  </div>

                  <div className="col-md-6">
                    <label htmlFor="podcastTitle" className="form-label">Podcast Title</label>
                    <input
                      id="podcastTitle"
                      name="podcastTitle"
                      className={`form-control ${formErrors.podcastTitle ? 'is-invalid' : ''}`}
                      type="text"
                      value={formData.podcastTitle}
                      onChange={handleFormChange}
                      placeholder="Enter podcast title"
                    />
                    {formErrors.podcastTitle && <div className="invalid-feedback d-block">{formErrors.podcastTitle}</div>}
                  </div>

                  <div className="col-md-6">
                    <label htmlFor="startDate" className="form-label">Start Date</label>
                    <input
                      id="startDate"
                      name="startDate"
                      className={`form-control ${formErrors.startDate ? 'is-invalid' : ''}`}
                      type="date"
                      value={formData.startDate}
                      onChange={handleFormChange}
                      aria-describedby="startDateHint"
                    />
                    <div id="startDateHint" className="form-text">Choose the subscription start date.</div>
                    {formErrors.startDate && <div className="invalid-feedback d-block">{formErrors.startDate}</div>}
                  </div>

                  <div className="col-md-6">
                    <label htmlFor="active" className="form-label">Subscription Status</label>
                    <select
                      id="active"
                      name="active"
                      className={`form-select ${formErrors.active ? 'is-invalid' : ''}`}
                      value={String(formData.active)}
                      onChange={handleFormChange}
                    >
                      <option value="">Choose a status</option>
                      <option value="true">Active</option>
                      <option value="false">Inactive</option>
                    </select>
                    {formErrors.active && <div className="invalid-feedback d-block">{formErrors.active}</div>}
                  </div>
                </div>

                <div className="d-flex justify-content-end mt-4">
                  <button type="submit" className="btn btn-primary px-4" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />
                        Saving...
                      </>
                    ) : (
                      'Save subscription'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </section>

        <section id="subscriptions" className="card shadow-sm border-0">
          <div className="card-header bg-transparent border-0 d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 pb-0">
            <div>
              <h2 className="section-title mb-0">Subscription list</h2>
            </div>
            <div className="d-flex flex-column flex-sm-row gap-2 w-100 w-md-auto">
              <input
                type="search"
                className="form-control"
                placeholder="Search by name or title"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
              <select className="form-select" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                <option value="all">All subscriptions</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="card-body">
            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading subscriptions...</span>
                </div>
              </div>
            ) : loadError ? (
              <div className="empty-state text-center py-5">
                <div className="alert alert-danger" role="alert">{loadError}</div>
                <button type="button" className="btn btn-primary" onClick={() => fetchSubscriptions()}>
                  Retry
                </button>
              </div>
            ) : filteredSubscriptions.length === 0 ? (
              <div className="empty-state text-center py-5">
                <h3 className="h5 text-muted">No subscriptions found</h3>
                <p className="text-muted">Try another search or add a new podcast subscription.</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle subscription-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Subscriber</th>
                      <th>Podcast</th>
                      <th>Start Date</th>
                      <th>Status</th>
                      <th className="text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSubscriptions.map((item) => (
                      <tr key={item.id}>
                        <td>{item.id}</td>
                        <td>{item.subscriberName}</td>
                        <td>{item.podcastTitle}</td>
                        <td>{item.startDate}</td>
                        <td>{renderStatusBadge(item.active)}</td>
                        <td>
                          <div className="d-flex justify-content-end gap-2 flex-wrap">
                            <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => openDetails(item.id)}>
                              View
                            </button>
                            <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => openEditForm(item.id)}>
                              Edit
                            </button>
                            <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => setDeleteId(item.id)}>
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      </main>

      <div className={`modal fade ${detailsItem || detailsError || detailsLoading ? 'show d-block' : ''}`} tabIndex="-1" aria-hidden={!(detailsItem || detailsError || detailsLoading)}>
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Subscription details</h5>
              <button type="button" className="btn-close" aria-label="Close" onClick={() => { setDetailsItem(null); setDetailsError(''); setDetailsLoading(false) }} />
            </div>
            <div className="modal-body">
              {detailsLoading ? (
                <div className="text-center py-3">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading details...</span>
                  </div>
                </div>
              ) : detailsError ? (
                <div className="alert alert-danger mb-0">{detailsError}</div>
              ) : detailsItem ? (
                <dl className="row mb-0 detail-list">
                  <dt className="col-sm-5">ID</dt>
                  <dd className="col-sm-7">{detailsItem.id}</dd>

                  <dt className="col-sm-5">Subscriber</dt>
                  <dd className="col-sm-7">{detailsItem.subscriberName}</dd>

                  <dt className="col-sm-5">Podcast</dt>
                  <dd className="col-sm-7">{detailsItem.podcastTitle}</dd>

                  <dt className="col-sm-5">Start Date</dt>
                  <dd className="col-sm-7">{detailsItem.startDate}</dd>

                  <dt className="col-sm-5">Status</dt>
                  <dd className="col-sm-7">{renderStatusBadge(detailsItem.active)}</dd>
                </dl>
              ) : null}
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => { setDetailsItem(null); setDetailsError(''); setDetailsLoading(false) }}>
                Close
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className={`modal fade ${editItemId !== null ? 'show d-block' : ''}`} tabIndex="-1" aria-hidden={editItemId === null}>
        <div className="modal-dialog modal-lg modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Edit subscription</h5>
              <button type="button" className="btn-close" aria-label="Close" onClick={() => { setEditItemId(null); setEditForm(emptyForm); setEditErrors({}) }} />
            </div>
            <div className="modal-body">
              <form onSubmit={handleUpdateSubmit} noValidate>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label htmlFor="edit-subscriberName" className="form-label">Subscriber Name</label>
                    <input
                      id="edit-subscriberName"
                      name="subscriberName"
                      type="text"
                      className={`form-control ${editErrors.subscriberName ? 'is-invalid' : ''}`}
                      value={editForm.subscriberName}
                      onChange={handleEditChange}
                      placeholder="Enter subscriber name"
                    />
                    {editErrors.subscriberName && <div className="invalid-feedback d-block">{editErrors.subscriberName}</div>}
                  </div>

                  <div className="col-md-6">
                    <label htmlFor="edit-podcastTitle" className="form-label">Podcast Title</label>
                    <input
                      id="edit-podcastTitle"
                      name="podcastTitle"
                      type="text"
                      className={`form-control ${editErrors.podcastTitle ? 'is-invalid' : ''}`}
                      value={editForm.podcastTitle}
                      onChange={handleEditChange}
                      placeholder="Enter podcast title"
                    />
                    {editErrors.podcastTitle && <div className="invalid-feedback d-block">{editErrors.podcastTitle}</div>}
                  </div>

                  <div className="col-md-6">
                    <label htmlFor="edit-startDate" className="form-label">Start Date</label>
                    <input
                      id="edit-startDate"
                      name="startDate"
                      type="date"
                      className={`form-control ${editErrors.startDate ? 'is-invalid' : ''}`}
                      value={editForm.startDate}
                      onChange={handleEditChange}
                    />
                    {editErrors.startDate && <div className="invalid-feedback d-block">{editErrors.startDate}</div>}
                  </div>

                  <div className="col-md-6">
                    <label htmlFor="edit-active" className="form-label">Subscription Status</label>
                    <select
                      id="edit-active"
                      name="active"
                      className={`form-select ${editErrors.active ? 'is-invalid' : ''}`}
                      value={String(editForm.active)}
                      onChange={handleEditChange}
                    >
                      <option value="true">Active</option>
                      <option value="false">Inactive</option>
                    </select>
                    {editErrors.active && <div className="invalid-feedback d-block">{editErrors.active}</div>}
                  </div>
                </div>

                <div className="d-flex justify-content-end gap-2 mt-4">
                  <button type="button" className="btn btn-outline-secondary" onClick={() => { setEditItemId(null); setEditForm(emptyForm); setEditErrors({}) }}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={isUpdating}>
                    {isUpdating ? 'Updating...' : 'Update subscription'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      <div className={`modal fade ${deleteId !== null ? 'show d-block' : ''}`} tabIndex="-1" aria-hidden={deleteId === null}>
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Confirm deletion</h5>
              <button type="button" className="btn-close" aria-label="Close" onClick={() => setDeleteId(null)} />
            </div>
            <div className="modal-body">
              <p className="mb-0">Are you sure you want to delete subscription #{deleteId}?</p>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setDeleteId(null)}>
                Cancel
              </button>
              <button type="button" className="btn btn-danger" onClick={confirmDelete} disabled={isDeleting}>
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
