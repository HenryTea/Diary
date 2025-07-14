import bcrypt from 'bcryptjs';
import jsonDb from '../../../../utils/jsonDb.js';
import { createAuthCookie, setResponseCookie } from '../../../../utils/auth';

export async function POST(request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return Response.json({ error: 'Username and password are required' }, { status: 400 });
    }

    // Get user from database
    const user = await jsonDb.findUserByUsername(username);

    if (!user) {
      return Response.json({ error: 'Invalid username or password' }, { status: 401 });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    
    if (!isValidPassword) {
      return Response.json({ error: 'Invalid username or password' }, { status: 401 });
    }

    // Return user data (excluding password)
    const userWithoutPassword = {
      id: user.id,
      username: user.username,
      email: user.email,
      created_at: user.created_at,
      updated_at: user.updated_at
    };

    // Create authentication cookie
    const authCookie = createAuthCookie(userWithoutPassword);
    
    // Create response and set cookie
    const response = Response.json({
      user: userWithoutPassword,
      message: 'Login successful'
    });

    return setResponseCookie(response, authCookie);

  } catch (error) {
    console.error('Login error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
