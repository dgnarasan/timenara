
export const cleanupAuthState = () => {
  console.log("Cleaning up authentication state...");
  
  // Remove all Supabase auth keys from localStorage
  Object.keys(localStorage).forEach((key) => {
    if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
      console.log("Removing auth key:", key);
      localStorage.removeItem(key);
    }
  });
  
  // Remove from sessionStorage as well
  if (typeof sessionStorage !== 'undefined') {
    Object.keys(sessionStorage).forEach((key) => {
      if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
        console.log("Removing session auth key:", key);
        sessionStorage.removeItem(key);
      }
    });
  }
  
  // Also remove any favorite courses to ensure clean state
  localStorage.removeItem('favoriteCourses');
  
  console.log("Auth state cleanup completed");
};
