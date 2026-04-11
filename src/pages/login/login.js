const API_URL = 'https://instadrone.onrender.com/api/auth';

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('login-form');
  const title = document.querySelector('.auth-title');
  const switchBtn = document.getElementById('switch-to-signup');
  const btnText = document.querySelector('.auth-btn');
  
  let isLogin = true;

  switchBtn.addEventListener('click', (e) => {
    e.preventDefault();
    isLogin = !isLogin;
    title.textContent = isLogin ? 'Welcome Back' : 'Create Account';
    btnText.textContent = isLogin ? 'Login' : 'Sign Up';
    switchBtn.innerHTML = isLogin ? 'Create account' : 'Login';
    switchBtn.previousSibling.textContent = isLogin ? 'New here? ' : 'Already have an account? ';
    
    if (!isLogin) {
      // Add username field
      const usernameGroup = document.createElement('div');
      usernameGroup.className = 'form-group';
      usernameGroup.id = 'username-group';
      usernameGroup.innerHTML = `
        <label>Username</label>
        <input type="text" id="username" required>
      `;
      form.insertBefore(usernameGroup, form.firstChild);
    } else {
      const usernameGroup = document.getElementById('username-group');
      if (usernameGroup) usernameGroup.remove();
    }
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const username = document.getElementById('username')?.value;

    const endpoint = isLogin ? '/login' : '/register';
    const body = isLogin ? { email, password } : { username, email, password };

    try {
      const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await res.json();
      
      if (res.ok) {
        if (isLogin) {
          localStorage.setItem('token', data.token);
          localStorage.setItem('user', JSON.stringify(data.user));
          alert('Login Successful!');
          window.location.href = data.user.role === 'admin' ? '/src/pages/admin/admin.html' : '/src/pages/products/products.html';
        } else {
          alert('Registration Successful! Please login.');
          switchBtn.click();
        }
      } else {
        alert(data.message || data.error);
      }
    } catch (err) {
      console.error(err);
      alert('Something went wrong');
    }
  });
});
