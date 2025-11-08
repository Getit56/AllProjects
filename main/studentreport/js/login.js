const form = document.getElementById('loginForm');
const errorMessage = document.getElementById('error-message');
const showPass = document.getElementById('showPass');
const passwordInput = document.getElementById('password');

// Default password
const correctPassword = "Rom123@";

// Handle login
form.addEventListener('submit', (e) => {
  e.preventDefault();
  const password = passwordInput.value.trim();

  if (password === correctPassword) {
    window.location.href = "report.html";
  } else {
    errorMessage.textContent = "❌ Incorrect password. Try again.";
  }
});

// Show/hide password
showPass.addEventListener('change', () => {
  passwordInput.type = showPass.checked ? "text" : "password";
});
