import { clearAuthCookie, setResponseCookie } from '../../../../utils/auth';

export async function POST() {
  try {
    // Clear the authentication cookie
    const clearCookie = clearAuthCookie();
    
    const response = Response.json({
      message: 'Logout successful'
    });

    return setResponseCookie(response, clearCookie);
  } catch (error) {
    console.error('Logout error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
