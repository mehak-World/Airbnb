
  const stars = document.querySelectorAll('.star');
  const ratingInput = document.getElementById('ratingInput');

  function highlightStars(value) {
    stars.forEach(star => {
      star.classList.toggle('selected', star.getAttribute('data-value') <= value);
    });
  }

  // Set default highlight on page load
  highlightStars(ratingInput.value);

  // Update stars and input on click
  stars.forEach(star => {
    star.addEventListener('click', () => {
      const value = star.getAttribute('data-value');
      ratingInput.value = value;
      highlightStars(value);
    });
  });

