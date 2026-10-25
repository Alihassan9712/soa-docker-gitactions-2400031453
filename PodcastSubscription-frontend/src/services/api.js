const BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

async function parseBody(response) {
  const contentType = response.headers.get('content-type') || ''

  if (contentType.includes('application/json')) {
    try {
      return await response.json()
    } catch {
      return null
    }
  }

  try {
    const text = await response.text()
    return text || null
  } catch {
    return null
  }
}

async function request(path, options = {}) {
  const config = {
    ...options,
    headers: {
      Accept: 'application/json',
      ...(options.headers || {}),
    },
  }

  if (config.body && typeof config.body !== 'string') {
    config.body = JSON.stringify(config.body)
    config.headers['Content-Type'] = 'application/json'
  }

  let response

  try {
    response = await fetch(`${BASE_URL}${path}`, config)
  } catch {
    throw new Error('The backend is not running or is unreachable. Please start the Spring Boot app on port 8083.')
  }

  const payload = await parseBody(response)

  if (!response.ok) {
    if (typeof payload === 'string' && payload.trim()) {
      throw new Error(payload)
    }

    if (payload && typeof payload === 'object') {
      const message = payload.message || payload.error || payload.errorMessage
      if (message) {
        throw new Error(message)
      }
    }

    throw new Error(`Request failed with status ${response.status}.`)
  }

  return payload ?? { success: true }
}

export const api = {
  getAllSubscriptions: async () => request('/DisplayAll'),
  getSubscriptionById: async (id) => request(`/Display/${id}`),
  createSubscription: async (subscription) => request('/Add', { method: 'POST', body: subscription }),
  updateSubscription: async (id, subscription) => request(`/Update/${id}`, { method: 'PUT', body: subscription }),
  deleteSubscription: async (id) => request(`/Delete/${id}`, { method: 'DELETE' }),
}
