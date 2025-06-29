import { NextResponse } from 'next/server';
import pool from '../../../utils/db';

export async function GET() {
  try {
    // Test database connection
    const [result] = await pool.execute('SELECT 1 as test');
    
    return NextResponse.json({ 
      success: true, 
      message: 'API and database are working',
      timestamp: new Date().toISOString(),
      database: {
        connected: true,
        test: result[0]
      },
      env: {
        hasDbUrl: !!process.env.DATABASE_URL,
        hasJwtSecret: !!process.env.JWT_SECRET
      }
    });
  } catch (error) {
    console.error('Health check error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message,
      database: {
        connected: false,
        error: error.message
      }
    }, { status: 500 });
  }
}
