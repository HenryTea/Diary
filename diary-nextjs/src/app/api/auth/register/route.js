import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../../../../../db/db';

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
    const [existingUsers] = await pool.execute(
      'SELECT * FROM users WHERE username = ? OR email = ?',
      [username, email]
    );

    if (existingUsers.length > 0) {
      const existingUser = existingUsers[0];
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
    const [result] = await pool.execute(
      'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
      [username, email, hashedPassword]
    );

    // Get the created user
    const [newUserRows] = await pool.execute(
      'SELECT * FROM users WHERE id = ?',
      [result.insertId]
    );

    const newUser = newUserRows[0];

    // Generate JWT token
    const token = jwt.sign(
      { userId: newUser.id, username: newUser.username },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    // Return user data (excluding password)
    const userWithoutPassword = {
      id: newUser.id,
      username: newUser.username,
      email: newUser.email,
      created_at: newUser.created_at,
      updated_at: newUser.updated_at
    };

    return Response.json({
      user: userWithoutPassword,
      token
    }, { status: 201 });

  } catch (error) {
    console.error('Registration error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
