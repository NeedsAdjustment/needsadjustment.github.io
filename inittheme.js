/**
 * Theme initialization and switching
 */
document.addEventListener('DOMContentLoaded', function () {
  // Set initial theme based on system preference
  const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches

  if (isDarkMode) {
    document.getElementById('color-scheme-dark').checked = true
  } else {
    document.getElementById('color-scheme-light').checked = true
  }

  // Function to update gradient appearance when theme changes
  function updateGradients() {
    // Force animation restart to update colors
    const wrapper = document.querySelector('.h1-gradient-wrapper');
    if (wrapper) {
      const animation = wrapper.style.animation;
      wrapper.style.animation = 'none';
      void wrapper.offsetWidth; // Trigger reflow
      wrapper.style.animation = animation;
    }
  }

  // Listen for system preference changes
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (e.matches) {
      document.getElementById('color-scheme-dark').checked = true
      updateGradients();
    } else {
      document.getElementById('color-scheme-light').checked = true
      updateGradients();
    }
  })

  // Listen for manual theme changes
  document.querySelectorAll('input[name="color-scheme"]').forEach(input => {
    input.addEventListener('change', updateGradients);
  });
})
