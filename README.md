# Task Manager API

A REST API for user registration and login, with JWT-protected task management. Each task is associated with its owner, so authenticated users can access only their own tasks.

## Features

- Register users and log in with email and password
- Hash passwords with bcrypt before storing them
- Issue JWTs for authenticated API access
- Create, list, retrieve, update, and delete tasks
- Validate request fields and task status values
- Store users and tasks in MongoDB through Mongoose

## Tech stack

- Node.js
- Express 5
- MongoDB and Mongoose
- JSON Web Tokens (`jsonwebtoken`)
- `bcryptjs`
- `dotenv`

## Requirements

- Node.js and npm
- A MongoDB instance, such as MongoDB Atlas

## Setup

1. Clone the repository and open its folder:

   ```powershell
   git clone https://github.com/<YOUR-GITHUB-USERNAME>/task-manager-api.git
   Set-Location task-manager-api
   ```

2. Install dependencies:

   ```powershell
   npm install
   ```

3. Create a `.env` file in the project root. Replace the placeholders locally; do not commit this file:

   ```env
   PORT=5000
   MONGO_URI=mongodb+srv://<DATABASE-USERNAME>:<URL-ENCODED-PASSWORD>@<CLUSTER-HOST>/<DATABASE-NAME>?retryWrites=true&w=majority
   JWT_SECRET=<RANDOM-SECRET-AT-LEAST-32-CHARACTERS>
   JWT_EXPIRES_IN=1d
   ```

   For MongoDB Atlas, use the connection details for your own cluster and database user. URL-encode reserved characters in the database password (for example, `@` as `%40` and `#` as `%23`). Never put a real password or JWT secret in this README or in a committed file.

4. Start the API:

   ```powershell
   npm start
   ```

   On success, the API logs `MongoDB connected successfully` and the local server URL. If the database connection fails, the server does not start.

For development with automatic restarts:

```powershell
npm run dev
```

## API

The default local base URL is `http://localhost:5000`. Requests and responses use JSON. The task endpoints require an access token from the login endpoint in the `Authorization: Bearer <JWT>` header.

| Method | Path | Authentication | Description |
| --- | --- | --- | --- |
| `GET` | `/` | No | API health response |
| `POST` | `/api/auth/register` | No | Register a user |
| `POST` | `/api/auth/login` | No | Log in and receive a JWT |
| `POST` | `/api/tasks` | Yes | Create a task |
| `GET` | `/api/tasks` | Yes | List the signed-in user's tasks |
| `GET` | `/api/tasks/:id` | Yes | Get one of the signed-in user's tasks |
| `PUT` | `/api/tasks/:id` | Yes | Update one of the signed-in user's tasks |
| `DELETE` | `/api/tasks/:id` | Yes | Delete one of the signed-in user's tasks |

Task statuses are `pending`, `in-progress`, and `completed`. A task title is required; descriptions are optional.

### Example requests (PowerShell)

Check the root endpoint:

```powershell
Invoke-RestMethod http://localhost:5000/
```

Register and log in using test values:

```powershell
$baseUrl = "http://localhost:5000"
$registerBody = @{
  name = "Test User"
  email = "test@example.com"
  password = "replace-with-a-test-password"
} | ConvertTo-Json

Invoke-RestMethod -Method Post -Uri "$baseUrl/api/auth/register" `
  -ContentType "application/json" -Body $registerBody

$loginBody = @{
  email = "test@example.com"
  password = "replace-with-a-test-password"
} | ConvertTo-Json
$login = Invoke-RestMethod -Method Post -Uri "$baseUrl/api/auth/login" `
  -ContentType "application/json" -Body $loginBody
$token = $login.token
```

Create and list tasks:

```powershell
$headers = @{ Authorization = "Bearer $token" }
$taskBody = @{
  title = "Review the API"
  description = "Try the task endpoints"
  status = "pending"
} | ConvertTo-Json

$created = Invoke-RestMethod -Method Post -Uri "$baseUrl/api/tasks" `
  -Headers $headers -ContentType "application/json" -Body $taskBody
Invoke-RestMethod -Method Get -Uri "$baseUrl/api/tasks" -Headers $headers
```

Use `$created.task._id` with `GET`, `PUT`, or `DELETE /api/tasks/:id` to test the remaining task operations. Only delete a disposable task created for testing.

## Testing

There is currently no automated test script in `package.json`. To manually smoke-test the API:

1. Configure `.env` and run `npm start`.
2. Confirm the root endpoint responds with the API status message.
3. Confirm an unauthenticated request to `GET /api/tasks` returns `401`.
4. Register a test account, log in, and use the returned token to create, list, retrieve, update, and (if desired) delete a disposable task.

## Security notes

- `.env` and `node_modules/` are excluded by `.gitignore`. Keep real credentials in the local environment and rotate any credential that is accidentally exposed.
- Passwords are hashed with bcrypt and are excluded from normal user queries by the Mongoose schema.
- Task queries are scoped to the authenticated user.
- Use a strong, randomly generated `JWT_SECRET` of at least 32 characters. Do not expose JWTs in logs or commit them.
- Restrict MongoDB Atlas Network Access and give the database user only the permissions the application needs.
- The current Express CORS configuration allows requests from any origin. Restrict allowed origins before deploying for real users, and serve production traffic over HTTPS.
- The server currently configures Google Public DNS before MongoDB connects to work around the development environment's SRV DNS resolution. Review whether this override is needed in your deployment environment.

## AI usage declaration

AI assistance was used to troubleshoot the MongoDB startup configuration and prepare this README. Review the project and update this disclosure if additional AI tools were used during development.
