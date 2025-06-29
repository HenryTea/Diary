import mysql from 'mysql2/promise';
import jwt from 'jsonwebtoken';

export async function GET(request) {
  try {
    // Check if user is admin (you can modify this logic)
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return Response.json({ error: 'Authentication required' }, { status: 401 });
    }
    
    const token = authHeader.substring(7); // Remove 'Bearer '
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // For now, only allow admin user - you can modify this
    if (decoded.username !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }
    
    const connection = await mysql.createConnection(process.env.DATABASE_URL);
    
    const [ips] = await connection.execute(`
      SELECT 
        id,
        ip_address,
        is_trusted,
        first_seen,
        last_seen,
        user_agent,
        notes
      FROM known_ips 
      ORDER BY last_seen DESC
    `);
    
    await connection.end();
    
    return Response.json(ips);
  } catch (error) {
    console.error('Admin IP list error:', error);
    return Response.json({ error: 'Failed to fetch IP list' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { action, ipId } = await request.json();
    
    // Check admin auth (same as above)
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return Response.json({ error: 'Authentication required' }, { status: 401 });
    }
    
    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (decoded.username !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }
    
    const connection = await mysql.createConnection(process.env.DATABASE_URL);
    
    if (action === 'trust') {
      await connection.execute(
        'UPDATE known_ips SET is_trusted = TRUE WHERE id = ?',
        [ipId]
      );
    } else if (action === 'untrust') {
      await connection.execute(
        'UPDATE known_ips SET is_trusted = FALSE WHERE id = ?',
        [ipId]
      );
    } else if (action === 'delete') {
      await connection.execute(
        'DELETE FROM known_ips WHERE id = ?',
        [ipId]
      );
    }
    
    await connection.end();
    
    return Response.json({ success: true });
  } catch (error) {
    console.error('Admin IP action error:', error);
    return Response.json({ error: 'Failed to perform action' }, { status: 500 });
  }
}
