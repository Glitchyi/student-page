# Admin Account Setup Guide

This guide explains how to create an admin account for the Student Event Management System.

## Overview

Admin accounts have special privileges:
- Access to the admin dashboard at `/admin/dashboard`
- View all students from all teachers
- Export all student data as CSV
- Separate login page at `/admin/login`

## Prerequisites

- The application must be set up and the database initialized
- Node.js and npm must be installed
- The database file should exist (created automatically on first run)

## Creating an Admin Account

### Step 1: Ensure Database is Initialized

The database is automatically created when you first run the application. Make sure you've started the app at least once:

```bash
npm run dev
```

Then stop it (Ctrl+C) and proceed to create the admin account.

### Step 2: Run the Admin Creation Script

Use the provided npm script to create an admin account:

```bash
npm run create-admin <email> <password> <name>
```

**Parameters:**
- `<email>` - The email address for the admin account (must be unique)
- `<password>` - The password for the admin account (will be securely hashed)
- `<name>` - The display name for the admin account

**Example:**
```bash
npm run create-admin principal@school.edu securePassword123 "Dr. John Smith"
```

### Step 3: Verify Account Creation

After running the script, you should see output like:

```
Admin user created successfully with ID: 1
Email: principal@school.edu
Name: Dr. John Smith
```

If you see an error, check:
- The database file exists in the `data/` directory
- The email address is not already in use
- All three parameters were provided

### Step 4: Log In as Admin

1. Navigate to the admin login page: `http://localhost:3000/admin/login`
2. Enter the email and password you used when creating the account
3. You'll be redirected to the admin dashboard

## Troubleshooting

### Error: "User with this email already exists"

**Solution:** The email address is already registered. Either:
- Use a different email address
- Delete the existing user from the database
- Log in with the existing account

### Error: "Failed to create admin user"

**Possible causes:**
- Database file doesn't exist - Run the app once to initialize it
- Database permissions issue - Check file permissions in the `data/` directory
- Invalid parameters - Make sure all three parameters are provided

### Error: "Database not found" or "Cannot open database"

**Solution:**
1. Make sure the `data/` directory exists
2. Run the application once: `npm run dev`
3. Stop the application and try creating the admin again

## Security Best Practices

1. **Use a Strong Password:**
   - Minimum 12 characters
   - Mix of uppercase, lowercase, numbers, and symbols
   - Don't use common words or personal information

2. **Keep Credentials Secure:**
   - Don't share admin credentials
   - Change password regularly
   - Use different passwords for different systems

3. **Limit Admin Accounts:**
   - Only create admin accounts for authorized personnel
   - Regularly review who has admin access
   - Remove admin accounts when no longer needed

## Multiple Admin Accounts

You can create multiple admin accounts by running the script multiple times with different email addresses:

```bash
npm run create-admin admin1@school.edu password1 "Admin One"
npm run create-admin admin2@school.edu password2 "Admin Two"
```

Each admin account will have full access to the admin dashboard.

## Changing Admin Password

Currently, there's no built-in password reset feature. To change an admin password:

1. Delete the admin account from the database
2. Create a new admin account with the same email but new password

Or manually update the database (requires bcrypt hashing).

## Database Location

The database file is located at:
- **Local development:** `./data/database.db`
- **Docker deployment:** `/app/data/database.db` (inside container)

You can access the database using SQLite tools if needed for advanced operations.

## Need Help?

If you encounter issues:
1. Check the error message for specific details
2. Verify the database file exists and is accessible
3. Ensure all required parameters are provided
4. Check that the email address is unique

For additional support, refer to the main README.md file.


