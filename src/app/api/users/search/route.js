import { NextResponse } from 'next/server';
import { verifyToken } from '../../../../utils/auth';
import fs from 'fs';
import path from 'path';

// Simple in-memory cache and rate limiting
const cache = new Map();
const rateLimiter = new Map();
const CACHE_TTL = 30000; // 30 seconds
const RATE_LIMIT_WINDOW = 1000; // 1 second
const MAX_REQUESTS_PER_WINDOW = 5; // Max 5 requests per second per user

export async function GET(request) {
  try {
    // Verify authentication
    const user = verifyToken(request);
    if (!user) {
      console.log('User search: Authentication failed');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('User search: Authenticated user:', user);

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query || query.length < 2) {
      return NextResponse.json([]);
    }

    const userId = user.userId || user.id;
    const now = Date.now();

    // Rate limiting check
    const userRequests = rateLimiter.get(userId) || [];
    const recentRequests = userRequests.filter(timestamp => now - timestamp < RATE_LIMIT_WINDOW);
    
    if (recentRequests.length >= MAX_REQUESTS_PER_WINDOW) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    // Update rate limiter
    recentRequests.push(now);
    rateLimiter.set(userId, recentRequests);

    // Check cache first
    const cacheKey = `${query.toLowerCase()}-${userId}`;
    const cached = cache.get(cacheKey);
    if (cached && now - cached.timestamp < CACHE_TTL) {
      console.log('Returning cached results for:', query);
      return NextResponse.json(cached.data);
    }

    // Read the database directly
    const dbPath = path.join(process.cwd(), 'db', 'data.json');
    
    if (!fs.existsSync(dbPath)) {
      return NextResponse.json([]);
    }

    const data = fs.readFileSync(dbPath, 'utf8');
    const db = JSON.parse(data);
    
    console.log('Searching for query:', query);
    console.log('Total users in database:', db.users?.length || 0);
    
    // Search for users by username (case-insensitive)
    const searchTerm = query.toLowerCase().trim();
    const matchingUsers = (db.users || [])
      .filter(user => {
        if (!user.username) return false;
        
        const username = user.username.toLowerCase();
        const isMatch = username.includes(searchTerm);
        const isNotCurrentUser = user.id !== userId;
        
        console.log(`Checking user: ${user.username}, match: ${isMatch}, notCurrentUser: ${isNotCurrentUser}`);
        
        return isMatch && isNotCurrentUser;
      })
      .map(user => ({
        id: user.id,
        username: user.username,
        display_name: user.display_name || user.username
      }))
      .slice(0, 10); // Limit to 10 results

    console.log('Found matching users:', matchingUsers);

    // Cache the results
    cache.set(cacheKey, {
      data: matchingUsers,
      timestamp: now
    });

    // Clean old cache entries periodically
    if (cache.size > 100) {
      for (const [key, value] of cache.entries()) {
        if (now - value.timestamp > CACHE_TTL) {
          cache.delete(key);
        }
      }
    }

    return NextResponse.json(matchingUsers);
  } catch (error) {
    console.error('User search error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
