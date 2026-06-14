// main.js
const SUPABASE_URL = 'https://pvobxfklldflizhvayel.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB2b2J4ZmtsbGRmbGl6aHZheWVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI1OTkxNjksImV4cCI6MjA2ODE3NTE2OX0.rztPYkFg4gVbh_3bUuPENmYCGiPVPxcK8qVnJECuwpE'; // User's real anon key
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Helper to get query/hash params
function getParam(name) {
  // Try hash first
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  if (hashParams.has(name)) return hashParams.get(name);
  // Then try query string
  const searchParams = new URLSearchParams(window.location.search);
  if (searchParams.has(name)) return searchParams.get(name);
  return null;
}

window.resetPassword = async function (e) {
  if (e) e.preventDefault(); // Prevent form submission reload
  const access_token = getParam('access_token');
  const refresh_token = getParam('refresh_token');
  const newPassword = document.getElementById('new-password').value;

  // Debug: Show what tokens we got
  document.getElementById('message').textContent =
    `access_token: ${access_token}\nrefresh_token: ${refresh_token}`;

  if (!access_token || !refresh_token) {
    document.getElementById('message').textContent = 'Auth session missing!';
    return;
  }

  // Set the session using the tokens from the URL
  const { error: sessionError } = await supabase.auth.setSession({
    access_token,
    refresh_token,
  });
  if (sessionError) {
    document.getElementById('message').textContent = 'Session error: ' + sessionError.message;
    return;
  }

  // Now update the password
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  document.getElementById('message').textContent = error ? error.message : 'Password updated!';
};

document.addEventListener('DOMContentLoaded', function () {
  const btn = document.querySelector('button');
  if (btn) btn.onclick = window.resetPassword;
}); 