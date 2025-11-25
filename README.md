# Student Event Management System

A Next.js web application for teachers to manage student achievements and points. Accounts are stored in SQLite. Includes admin dashboard for exporting all student data.

## Features

- **Teacher Portal**: Self-registration and login for teachers
- **Student Management**: Add, edit, and delete students
- **Event Tracking**: Record multiple events per student with automatic points calculation
- **Teacher Isolation**: Each teacher can only access their own students
- **Admin Dashboard**: Password-protected admin view with CSV export
- **Docker Deployment**: Ready for Raspberry Pi deployment

## Event Types & Points

- National Winner: 30 (single) / 27 (group)
- National Participation: 25 (single) / 23 (group)
- State Winner: 20 (single) / 17 (group)
- State Participation: 15 (single) / 13 (group)
- District Winners: 12 (single) / 11 (group)
- District Participation: 10 (single) / 9 (group)
- Interschool Ekm District Winners: 8 (single) / 7 (group)
- Interschool Ekm District Participation: 5 (single) / 4 (group)
- Mayookham Winners: 3 (single) / 2 (group)

## Setup

### Prerequisites

- Node.js 20+
- Docker and Docker Compose (for deployment)

### Local Development

1. Install dependencies:
```bash
npm install
```

2. Create `.env.local` file:
```env
DATABASE_PATH=./data/database.db
SESSION_SECRET=your-random-secret-here
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000)

### Docker Deployment (Raspberry Pi)

1. Create `.env.local` file with your configuration

2. Build and start the container:
```bash
docker-compose build
docker-compose up -d
```

3. View logs:
```bash
docker-compose logs -f
```

4. Stop the container:
```bash
docker-compose down
```

The SQLite database will be persisted in the `./data` directory.

### Clearing Database

To clear all data from the database (students, achievements, and users):

```bash
npm run clear-db --confirm
```

**⚠️ WARNING:** This will delete ALL data including:
- All students
- All achievements/events
- All user accounts (teachers and admins)

After clearing, you'll need to:
1. Create a new admin account: `npm run create-admin <email> <password> <name>`
2. Teachers can register again at `/register`

### Student ID System

Students are assigned **random 5-digit IDs** (10000-99999) instead of sequential numbers. This provides:
- Better privacy (IDs don't reveal total student count)
- More professional appearance
- Unique identification per student

### Creating Admin Account

**Quick Start:**
```bash
npm run create-admin <email> <password> <name>
```

**Example:**
```bash
npm run create-admin principal@school.com mySecurePassword123 "Principal Name"
```

**Important:**
- Make sure the database is initialized (run `npm run dev` at least once first)
- The email must be unique
- After creation, log in at `/admin/login`

**For detailed instructions, troubleshooting, and security best practices, see [ADMIN_SETUP.md](./ADMIN_SETUP.md)**

## Project Structure

```
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── admin/             # Admin pages
│   ├── teacher/           # Teacher pages
│   └── register/          # Registration page
├── components/            # React components
│   └── ui/               # shadcn/ui components
├── lib/                   # Utility libraries
│   ├── db.ts             # Database queries
│   ├── auth.ts           # Authentication
│   └── points.ts         # Points calculation
├── data/                  # SQLite database (created automatically)
├── Dockerfile            # Docker image configuration
└── docker-compose.yml    # Docker Compose configuration
```

## License

MIT
