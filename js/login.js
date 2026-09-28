const loginForm = document.getElementById('login-form');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const message = document.getElementById('form-message');
const submitButton = document.getElementById('submit-button');
const togglePassword = document.getElementById('toggle-password');

const dashboardByRole = {
    ADMIN: 'admin/dashboard.html',
    DOCTOR: 'doctor/dashboard.html',
    RECEPTIONIST: 'receptionist/dashboard.html',
    LAB_TECHNICIAN: 'lab/dashboard.html',
    PHARMACIST: 'pharmacy/dashboard.html'
};

togglePassword.addEventListener('click', () => {
    const showPassword = passwordInput.type === 'password';
    passwordInput.type = showPassword ? 'text' : 'password';
    togglePassword.textContent = showPassword ? 'Hide' : 'Show';
    togglePassword.setAttribute('aria-pressed', String(showPassword));
});

loginForm.addEventListener('submit', async event => {
    event.preventDefault();
    message.textContent = '';

    if (!loginForm.reportValidity()) return;

    submitButton.disabled = true;
    submitButton.querySelector('span').textContent = 'Signing in...';

    try {
        const response = await fetch('http://127.0.0.1:8000/api/auth/login/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: usernameInput.value.trim(),
                password: passwordInput.value
            })
        });

        const result = await response.json().catch(() => ({}));
        if (!response.ok) {
            const detail = result.detail || result.non_field_errors?.[0];
            throw new Error(detail || 'Sign-in failed. Check your username and password.');
        }

        const role = String(result.role || '').trim().toUpperCase().replace(/[\s-]+/g, '_');
        const dashboard = dashboardByRole[role];
        if (!dashboard) {
            throw new Error('Your account role does not have a dashboard configured.');
        }

        localStorage.setItem('fd_access', result.access || '');
        localStorage.setItem('fd_refresh', result.refresh || '');
        localStorage.setItem('fd_name', result.full_name || result.username || usernameInput.value.trim());
        window.location.assign(dashboard);
    } catch (error) {
        message.textContent = error instanceof TypeError
            ? 'Cannot reach the sign-in server. Make sure the clinic API is running at 127.0.0.1:8000.'
            : error.message;
    } finally {
        submitButton.disabled = false;
        submitButton.querySelector('span').textContent = 'Sign in to your workspace';
    }
});