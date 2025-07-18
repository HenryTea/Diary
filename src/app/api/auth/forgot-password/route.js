import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

export async function POST(request) {
  try {
    const { email, username, newPassword } = await request.json();

    // Validate input
    if (!email || !username || !newPassword) {
      return NextResponse.json(
        { error: 'Email, username, and new password are required' },
        { status: 400 }
      );
    }

    // Validate password length
    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    // Read the database
    const dbPath = path.join(process.cwd(), 'db', 'data.json');
    
    if (!fs.existsSync(dbPath)) {
      return NextResponse.json(
        { error: 'Database not found' },
        { status: 500 }
      );
    }

    const data = fs.readFileSync(dbPath, 'utf8');
    const db = JSON.parse(data);

    // Find user by email and username
    const user = db.users.find(u => 
      u.email.toLowerCase() === email.toLowerCase() && 
      u.username.toLowerCase() === username.toLowerCase()
    );

    if (!user) {
      return NextResponse.json(
        { error: 'No user found with this email and username combination' },
        { status: 404 }
      );
    }

    // Hash the new password
    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    
    // Update user's password in database
    const userIndex = db.users.findIndex(u => u.id === user.id);
    if (userIndex !== -1) {
      db.users[userIndex].password_hash = newPasswordHash;
      db.users[userIndex].updated_at = new Date().toISOString();
      
      // Write back to database
      fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
    }

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Password reset successful',
      user: {
        username: user.username,
        email: user.email
      }
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
