# Podcast Subscription Manager

React + Vite frontend for the Podcast Subscription Spring Boot API.

## Run locally

1. Start the Spring Boot backend on port `8083`.
2. Start the frontend from this folder:

   ```sh
   npm install
   npm run dev
   ```

3. Open <http://localhost:5173/>.

Vite proxies `/DisplayAll`, `/Display`, `/Add`, `/Update`, and `/Delete` to
`http://localhost:8083`. This avoids browser CORS restrictions during local
development; no backend CORS change is needed for this setup. Keep both the
frontend and backend running.

To call a separately hosted API instead of using the Vite proxy, set
`VITE_API_BASE_URL` to the backend origin and configure that backend to allow
the frontend origin and the required methods/headers.

## API operations

The frontend uses the backend routes exactly as defined:

- `GET /DisplayAll` — list subscriptions
- `GET /Display/{id}` — view or load a subscription for editing
- `POST /Add` — create a subscription
- `PUT /Update/{id}` — update a subscription
- `DELETE /Delete/{id}` — delete a subscription

The generated ID is never included in create or update bodies. It is displayed
from backend data and used in the URL for operations on an existing record.

## Database troubleshooting

The frontend does not connect to PostgreSQL directly. Spring Boot connects to
the database and provides the data through its API. Check the Spring Boot
console for database connection errors. If the frontend cannot load records,
check that `http://localhost:8083/DisplayAll` responds and that the Vite proxy
is active.
