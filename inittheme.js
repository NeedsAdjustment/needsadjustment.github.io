// Set the initial theme based on system preference
document.addEventListener('DOMContentLoaded', function() {
  const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  if (isDarkMode) {
    document.getElementById('color-scheme-dark').checked = true;
  } else {
    document.getElementById('color-scheme-light').checked = true;
  }
  
  // Listen for system preference changes
  window.matchMedia('(prefers-color-scheme: dark)')
    .addEventListener('change', e => {
      if (e.matches) {
        document.getElementById('color-scheme-dark').checked = true;
      } else {
        document.getElementById('color-scheme-light').checked = true;
      }
    });
});