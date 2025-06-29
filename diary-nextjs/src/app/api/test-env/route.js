import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Test environment variables
    const envTest = {
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      hasJwtSecret: !!process.env.JWT_SECRET,
      nodeEnv: process.env.NODE_ENV,
      databaseUrlPreview: process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 20) + '...' : 'Not set'
    };
    
    return NextResponse.json({
      message: 'Environment test successful',
      environment: envTest,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({ 
      error: 'Environment test failed',
      details: error.message 
    }, { status: 500 });
  }
}
