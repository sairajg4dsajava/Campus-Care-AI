# CampusCare AI — Intelligent Campus Infrastructure & Predictive Maintenance Platform

CampusCare AI is a web-based campus infrastructure management platform designed to simplify complaint handling, manage campus assets, coordinate maintenance activities, and support predictive maintenance.

The platform provides role-based access for administrators, technicians, students, and faculty members.

## Key Features

- **Complaint Management:** Students and faculty can submit complaints and track their own submissions.
- **AI-Based Complaint Suggestions:** A rule-based keyword classification system suggests complaint categories and priorities.
- **Asset Management:** Administrators can manage campus infrastructure assets.
- **Predictive Maintenance:** Displays maintenance risk information to help administrators identify assets that may require attention.
- **Work Order Management:** Administrators can generate work orders and assign them to technicians.
- **Technician Management:** Administrators can manage technician profiles.
- **Work Order Updates:** Technicians can view assigned work orders and update their status.
- **Analytics Dashboard:** Provides graphical insights into complaints and maintenance activities.
- **Role-Based Access Control:** Provides access according to each user's role.

## Technology Stack

| Component | Technology |
|---|---|
| Frontend | React.js, Vite |
| Backend | Node.js, Express.js |
| Database | MongoDB |
| Programming Language | JavaScript |
| API Communication | REST APIs |

## Project Structure

```text
CampusCare-AI/
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── style.css
│   ├── package.json
│   ├── package-lock.json
│   ├── index.html
│   └── vite.config.js
│
├── backend/
│   ├── routes/
│   ├── models/
│   ├── middleware/
│   ├── server.js
│   ├── seedAdmin.js
│   ├── package.json
│   └── package-lock.json
│
└── README.md
```

*Note: This is the expected project structure. Additional configuration files, including `.env.example` and `.gitignore`, may also be present.*

## Requirements

- Node.js 20 or later recommended
- MongoDB Atlas or locally installed MongoDB
- Visual Studio Code (recommended)
- npm (included with Node.js)

## Installation and Setup

### 1. Clone the Repository

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
cd CampusCare-AI
```

Replace `YOUR_GITHUB_REPOSITORY_URL` with your actual GitHub repository URL.

### 2. Backend Setup

Open a terminal and run:

```powershell
cd backend
```

Create your environment configuration file:

```powershell
copy .env.example .env
```

Open the `.env` file and configure the required environment variables:

- `MONGODB_URI` — Your MongoDB connection string.
- `JWT_SECRET` — A long, randomly generated secret.
- `ADMIN_NAME` — Initial administrator's name.
- `ADMIN_EMAIL` — Initial administrator's email.
- `ADMIN_PASSWORD` — Initial administrator's password.

Install dependencies:

```bash
npm install
```

Create the initial administrator account:

```bash
npm run seed:admin
```

Start the backend server:

```bash
npm run dev
```

Backend URL:

http://localhost:5000

### 3. Frontend Setup

Open a second terminal in VS Code.

Navigate to the frontend directory:

```powershell
cd frontend
```

Install dependencies:

```bash
npm install
```

Start the frontend development server:

```bash
npm run dev
```

Open the Vite development URL displayed in your terminal. The default URL is usually:

http://localhost:5173

## User Roles and Access

| Role | Permissions |
|---|---|
| Admin | Manage complaints, technicians, assets, predictions, work orders, and analytics. |
| Technician | View assigned work orders and update their status. |
| Student | Submit complaints and view their own complaints. |
| Faculty | Submit complaints and view their own complaints. |

### Account Registration

- Public registration is available for Students and Faculty.
- Technician accounts can be created only when the registered email matches a technician profile created by an administrator.
- The initial administrator account is created using the backend seed command.

## Application Workflow

1. Students and faculty submit campus-related complaints.
2. The system suggests a complaint category and priority using predefined keywords.
3. Administrators review complaints and manage campus assets.
4. Administrators can generate maintenance work orders and assign technicians.
5. Technicians view their assigned work orders and update their progress.
6. Administrators monitor maintenance activities through the analytics dashboard.

## Important Notes and Limitations

- This project is a fresh rebuild, not a patch of the previous project.
- It does not contain the previous project's MongoDB records or custom components.
- Existing MongoDB data is not deleted. The application creates or uses its own collections.
- Complaint classification currently uses predefined keyword rules; it is not a trained machine-learning model.
- Predictive maintenance information should be interpreted according to the implemented risk calculation and available data.

## Security Recommendations

- Never upload `.env` files to GitHub.
- Do not publish MongoDB credentials, passwords, JWT secrets, or API keys.
- Use a strong, randomly generated JWT secret.
- Configure restricted CORS origins before production deployment.
- Use HTTPS and secure deployment environment variables.
- Implement rate limiting, regular database backups, and account recovery procedures before production use.

## Future Enhancements

- Integrate a trained machine-learning model for complaint classification.
- Improve predictive maintenance using historical asset and maintenance data.
- Add email and notification alerts.
- Introduce advanced maintenance analytics and reporting.
- Improve production deployment and security.

## Project Purpose

CampusCare AI aims to provide a centralized platform for campus complaint management, infrastructure monitoring, and maintenance coordination.