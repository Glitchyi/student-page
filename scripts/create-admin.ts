import { createUser } from '../lib/auth';

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 3) {
    console.error('Usage: tsx scripts/create-admin.ts <email> <password> <name>');
    process.exit(1);
  }

  const [email, password, name] = args;

  try {
    const userId = await createUser(email, password, name, 'admin');
    console.log(`Admin user created successfully with ID: ${userId}`);
    console.log(`Email: ${email}`);
    console.log(`Name: ${name}`);
  } catch (error: any) {
    console.error('Failed to create admin user:', error.message);
    process.exit(1);
  }
}

main();

