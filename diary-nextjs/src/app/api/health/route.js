import { NextResponse } from 'next/server';
import jsonDb from '../../../utils/jsonDb.js';

export const runtime = 'nodejs';

export async function GET() {
  const startTime = Date.now();
  
  try {
    // Test JSON database health
    const dbStart = Date.now();
    const healthCheck = await jsonDb.healthCheck();
    const dbTime = Date.now() - dbStart;
    
    const totalTime = Date.now() - startTime;
    
    return NextResponse.json({
      status: 'healthy',
      database: {
        healthy: healthCheck.status === 'healthy',
        responseTime: `${dbTime}ms`,
        type: 'JSON File Database',
        tables: healthCheck.tables
      },
      vercel: {
        region: process.env.VERCEL_REGION || 'unknown',
        totalResponseTime: `${totalTime}ms`
      },
      environment: {
        nodeEnv: process.env.NODE_ENV,
        databaseType: 'JSON'
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    const totalTime = Date.now() - startTime;
    
    return NextResponse.json({
      status: 'unhealthy',
      error: error.message,
      totalResponseTime: `${totalTime}ms`,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
