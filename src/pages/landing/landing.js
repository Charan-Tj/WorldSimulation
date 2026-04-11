document.addEventListener('DOMContentLoaded', () => {
  const viewDemoBtn = document.getElementById('view-demo-btn');
  
  if (viewDemoBtn) {
    viewDemoBtn.addEventListener('click', () => {
      // Redirect to the main simulation page
      window.location.href = '/simulation.html';
    });
  }

  // Add some simple scroll reveal effects
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.feature-card').forEach((card, index) => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(30px)';
    card.style.transition = `all 0.6s ease ${index * 0.2}s`;
    observer.observe(card);
  });
});
