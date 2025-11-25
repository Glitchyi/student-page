import { createUser } from '../lib/auth';
import { writeFileSync, existsSync } from 'fs';
import { join } from 'path';

// Initialize database first
import '../lib/db';
import db from '../lib/db';

async function main() {
  try {
    // Check if credentials file already exists
    const credentialsPath = join(process.cwd(), 'admin-credentials.json');
    if (existsSync(credentialsPath)) {
      console.log('Admin credentials file already exists. Skipping default admin creation.');
      return;
    }

    // Check if any admin already exists by querying all users
    const getAllUsers = db.prepare('SELECT * FROM users WHERE role = ?');
    const admins = getAllUsers.all('admin') as any[];
    
    if (admins.length > 0) {
      console.log('Admin user already exists. Skipping default admin creation.');
      return;
    }

    // Generate default credentials
    const defaultEmail = 'admin@school.com';
    const defaultPassword = Math.random().toString(36).slice(-12) + Math.random().toString(36).slice(-12) + Math.random().toString(36).slice(-8);
    const defaultName = 'Administrator';

    // Create admin user
    const adminId = await createUser(defaultEmail, defaultPassword, defaultName, 'admin');
    
    console.log('Default admin user created successfully!');
    
    // Create credentials file
    const credentials = {
      email: defaultEmail,
      password: defaultPassword,
      name: defaultName,
      created_at: new Date().toISOString(),
      note: 'Please change this password after first login for security.'
    };

    writeFileSync(credentialsPath, JSON.stringify(credentials, null, 2));
    
    console.log('\n========================================');
    console.log('DEFAULT ADMIN CREDENTIALS');
    console.log('========================================');
    console.log(`Email: ${defaultEmail}`);
    console.log(`Password: ${defaultPassword}`);
    console.log(`Name: ${defaultName}`);
    console.log('========================================');
    console.log(`\nCredentials saved to: ${credentialsPath}`);
    console.log('⚠️  IMPORTANT: Keep this file secure and delete it after noting the credentials!');
    console.log('========================================\n');
  } catch (error: any) {
    if (error.message?.includes('UNIQUE constraint')) {
      console.log('Admin user already exists. Skipping default admin creation.');
    } else {
      console.error('Error creating default admin:', error);
      // Don't exit with error, just log it
    }
  }
}

main();
