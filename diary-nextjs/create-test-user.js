import bcrypt from 'bcryptjs';
import jsonDb from './src/utils/jsonDb.js';

async function createTestUser() {
  try {
    // Create a test user with known password
    const password = 'test123';
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const userData = {
      username: 'demo',
      email: 'demo@example.com',
      password_hash: hashedPassword
    };
    
    const user = await jsonDb.createUser(userData);
    console.log('Test user created successfully!');
    console.log('Username: demo');
    console.log('Password: test123');
    console.log('User ID:', user.id);
    
  } catch (error) {
    console.error('Error creating test user:', error);
  }
}

createTestUser();
