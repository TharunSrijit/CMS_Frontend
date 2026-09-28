const loginForm = document.getElementById('login-form');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const message = document.getElementById('form-message');
const submitButton = document.getElementById('submit-button');
const togglePassword = document.getElementById('toggle-password');
const submitLabel = document.getElementById('submit-label');
const portalEyebrow = document.getElementById('portal-eyebrow');
const portalIntro = document.getElementById('portal-intro');
const portalOptions = document.querySelectorAll('.portal-option');

const dashboardByRole = {
    ADMIN: 'admin/dashboard.html',
    DOCTOR: 'doctor/dashboard.html',
    RECEPTIONIST: 'receptionist/dashboard.html',
    LAB_TECHNICIAN: 'lab/dashboard.html',
    PHARMACIST: 'pharmacy/dashboard.html'
};

const localAccounts = {
    admin: { password: 'admin123', role: 'ADMIN', userRole: 'admin', fullName: 'Administrator' },
    doctor: { password: 'doctor123', role: 'DOCTOR', userRole: 'doctor', fullName: 'Dr. Arun Kumar' },
    reception: { password: 'reception123', role: 'RECEPTIONIST', userRole: 'receptionist', fullName: 'Receptionist' },
    receptionist: { password: ['reception123', 'receptionist123'], role: 'RECEPTIONIST', userRole: 'receptionist', fullName: 'Receptionist' },
    pharmacy: { password: 'pharmacy123', role: 'PHARMACIST', userRole: 'pharmacist', fullName: 'Pharmacist' },
    pharmacist: { password: 'pharmacist123', role: 'PHARMACIST', userRole: 'pharmacist', fullName: 'Pharmacist' },
    lab: { password: 'lab123', role: 'LAB_TECHNICIAN', userRole: 'lab', fullName: 'Lab Technician' }
};

togglePassword.addEventListener('click', () => {
    const showPassword = passwordInput.type === 'password';
    passwordInput.type = showPassword ? 'text' : 'password';
    togglePassword.textContent = showPassword ? 'Hide' : 'Show';
    togglePassword.setAttribute('aria-pressed', String(showPassword));
});

loginForm.addEventListener('submit', event => {
    event.preventDefault();
    message.textContent = '';

    if (!loginForm.reportValidity()) return;

    const username = usernameInput.value.trim().toLowerCase();
    const account = localAccounts[username];
    const requiredRole = loginForm.dataset.role;

    const passwordMatches = account && (Array.isArray(account.password)
        ? account.password.includes(passwordInput.value)
        : account.password === passwordInput.value);

    if (!passwordMatches) {
        message.textContent = 'Sign-in failed. Please check your username and password.';
        return;
    }

    const isAuthorized = requiredRole === 'ADMIN'
        ? account.role === 'ADMIN'
        : requiredRole === 'STAFF'
            ? account.role !== 'ADMIN'
            : true;

    if (!isAuthorized) {
        message.textContent = 'This sign-in is not authorized for this workspace.';
        return;
    }

    localStorage.setItem('fd_access', 'local-session');
    localStorage.setItem('fd_refresh', '');
    localStorage.setItem('fd_name', account.fullName);
    localStorage.setItem('loggedInUser', JSON.stringify({
        username,
        name: account.fullName,
        role: account.userRole
    }));
    window.location.assign(dashboardByRole[account.role]);
});

portalOptions.forEach(option => {
    option.addEventListener('click', () => {
        const isAdmin = option.dataset.role === 'ADMIN';
        loginForm.dataset.role = isAdmin ? 'ADMIN' : 'STAFF';

        portalOptions.forEach(portalOption => {
            const isCurrent = portalOption === option;
            portalOption.classList.toggle('is-current', isCurrent);
            portalOption.setAttribute('aria-pressed', String(isCurrent));
        });

        portalEyebrow.textContent = isAdmin ? 'ADMINISTRATOR ACCESS' : 'STAFF PORTAL';
        portalIntro.textContent = isAdmin
            ? 'Sign in with your administrator account to continue.'
            : 'Sign in with your staff account to continue.';
        submitLabel.textContent = isAdmin ? 'Sign in as Admin' : 'Sign in as Staff';
        document.title = isAdmin
            ? 'Administrator Sign In | Clinic Management System'
            : 'Sign In | Clinic Management System';
        message.textContent = '';
    });
});