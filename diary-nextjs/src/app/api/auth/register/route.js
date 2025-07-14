import bcrypt from 'bcryptjs';
import jsonDb from '../../../../utils/jsonDb.js';
import { createAuthCookie, setResponseCookie } from '../../../../utils/auth';

export async function POST(request) {
  try {
    const { username, email, password } = await request.json();

    if (!username || !email || !password) {
      return Response.json({ error: 'Username, email, and password are required' }, { status: 400 });
    }

    if (password.length < 6) {
      return Response.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await jsonDb.findUserByUsernameOrEmail(username, email);

    if (existingUser) {
      if (existingUser.username === username) {
        return Response.json({ error: 'Username already exists' }, { status: 409 });
      }
      if (existingUser.email === email) {
        return Response.json({ error: 'Email already exists' }, { status: 409 });
      }
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const newUser = await jsonDb.createUser({
      username,
      email,
      password_hash: hashedPassword
    });

    // Return user data (excluding password)
    const userWithoutPassword = {
      id: newUser.id,
      username: newUser.username,
      email: newUser.email,
      created_at: newUser.created_at,
      updated_at: newUser.updated_at
    };

    // Create authentication cookie
    const authCookie = createAuthCookie(userWithoutPassword);
    
    // Create response and set cookie
    const response = Response.json({
      user: userWithoutPassword,
      message: 'Registration successful'
    }, { status: 201 });

    return setResponseCookie(response, authCookie);

  } catch (error) {
    console.error('Registration error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
