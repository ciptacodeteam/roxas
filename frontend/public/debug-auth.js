/**
 * Authentication Debug Helper
 * Add this to your browser console to debug cookie and auth issues
 */

(function() {
  console.log('=== ROXAS AUTH DEBUG ===\n');
  
  // Check cookies
  const cookies = document.cookie.split(';').reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split('=');
    acc[key] = value;
    return acc;
  }, {});
  
  console.log('1. COOKIES:');
  console.log('   access_token:', cookies.access_token ? '✓ Present' : '✗ Missing');
  console.log('   refresh_token:', cookies.refresh_token ? '✓ Present' : '✗ Missing');
  console.log('   All cookies:', Object.keys(cookies).join(', '));
  console.log('');
  
  // Check local storage
  console.log('2. LOCAL STORAGE:');
  console.log('   Items:', Object.keys(localStorage).join(', '));
  console.log('');
  
  // Check API URL
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  console.log('3. API CONFIGURATION:');
  console.log('   API URL:', apiUrl);
  console.log('   Current Origin:', window.location.origin);
  console.log('   Cross-Origin:', apiUrl !== window.location.origin ? '✓ Yes' : '✗ No');
  console.log('');
  
  // Test session endpoint
  console.log('4. TESTING SESSION ENDPOINT...');
  fetch(`${apiUrl}/api/v1/token/me/`, {
    credentials: 'include',
    headers: {
      'Accept': 'application/json',
    }
  })
    .then(response => {
      console.log('   Status:', response.status);
      if (response.ok) {
        return response.json();
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    })
    .then(data => {
      console.log('   ✓ Session Active');
      console.log('   User:', data.email);
      console.log('   Role:', data.role);
      console.log('   Is Staff:', data.role === 'STAFF');
    })
    .catch(error => {
      console.log('   ✗ Session Failed:', error.message);
    });
  
  // Check HTTPS
  console.log('\n5. SECURITY:');
  console.log('   Protocol:', window.location.protocol);
  console.log('   HTTPS:', window.location.protocol === 'https:' ? '✓ Yes' : '✗ No (Required for production)');
  
  console.log('\n=== END DEBUG ===');
})();

// Export helper functions
window.roxasDebug = {
  clearAuth: () => {
    document.cookie.split(';').forEach(cookie => {
      const name = cookie.split('=')[0].trim();
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    });
    localStorage.clear();
    sessionStorage.clear();
    console.log('✓ Auth data cleared. Reload the page.');
  },
  
  testLogin: async (email, password) => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    try {
      const response = await fetch(`${apiUrl}/api/v1/token/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password })
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✓ Login successful:', data);
        return data;
      } else {
        const error = await response.json();
        console.log('✗ Login failed:', error);
        return error;
      }
    } catch (error) {
      console.log('✗ Network error:', error);
      return error;
    }
  },
  
  checkSession: async () => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    try {
      const response = await fetch(`${apiUrl}/api/v1/token/me/`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✓ Session active:', data);
        return data;
      } else {
        console.log('✗ No active session');
        return null;
      }
    } catch (error) {
      console.log('✗ Network error:', error);
      return null;
    }
  }
};

console.log('\nAvailable debug commands:');
console.log('  roxasDebug.clearAuth() - Clear all auth data');
console.log('  roxasDebug.testLogin(email, password) - Test login');
console.log('  roxasDebug.checkSession() - Check current session');
