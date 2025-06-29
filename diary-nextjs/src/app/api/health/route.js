import { NextResponse } from 'next/server';
import pool, { getPoolHealth } from '@/utils/db';

export const runtime = 'nodejs';

export async function GET() {
  const startTime = Date.now();
  
  try {
    // Test database connection with timing
    const dbStart = Date.now();
    const [rows] = await pool.execute('SELECT 1 as healthy, NOW() as server_time');
    const dbTime = Date.now() - dbStart;
    
    // Get pool statistics
    const poolStats = getPoolHealth();
    
    const totalTime = Date.now() - startTime;
    
    return NextResponse.json({
      status: 'healthy',
      database: {
        healthy: true,
        responseTime: `${dbTime}ms`,
        serverTime: rows[0]?.server_time
      },
      pool: poolStats,
      vercel: {
        region: process.env.VERCEL_REGION || 'unknown',
        totalResponseTime: `${totalTime}ms`
      },
      environment: {
        nodeEnv: process.env.NODE_ENV,
        databaseHost: process.env.DATABASE_URL?.split('@')[1]?.split('/')[0] || 'unknown'
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
