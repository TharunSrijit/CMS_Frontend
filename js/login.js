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
    admin: { password: 'admin123', role: 'ADMIN', userRole: 'admin', fullName: 'Administrator' }
};

const registeredRoleDetails = {
    Admin: { role: 'ADMIN', userRole: 'admin' },
    Doctor: { role: 'DOCTOR', userRole: 'doctor' },
    Receptionist: { role: 'RECEPTIONIST', userRole: 'receptionist' },
    'Lab Technician': { role: 'LAB_TECHNICIAN', userRole: 'lab' },
    Pharmacist: { role: 'PHARMACIST', userRole: 'pharmacist' }
};

function findRegisteredAccount(username) {
    let users;

    try {
        users = JSON.parse(localStorage.getItem('cms_users') || '[]');
    } catch (error) {
        return null;
    }

    const user = users.find(item => item.username && item.username.toLowerCase() === username);
    const roleDetails = user && registeredRoleDetails[user.role];

    if (!user || !roleDetails) return null;

    return {
        id: user.id,
        password: user.password,
        role: roleDetails.role,
        userRole: roleDetails.userRole,
        fullName: user.name,
        status: user.status,
        profileId: user.profileId,
        profileType: user.profileType
    };
}

function readStoredRecords(key) {
    let doctors;

    try {
        doctors = JSON.parse(localStorage.getItem(key) || '[]');
    } catch (error) {
        return [];
    }

    return Array.isArray(doctors) ? doctors : [];
}

function normalizeDoctorName(name) {
    return name.toLowerCase().replace(/^dr\.?\s*/, '').replace(/\s+/g, ' ').trim();
}

function findDoctorProfile(account) {
    const doctors = readStoredRecords('cms_doctors');

    if (account.profileType === 'staff' && account.profileId) {
        const staffProfile = readStoredRecords('cms_staff').find(person =>
            person.id === account.profileId && person.role === 'Doctor'
        );
        if (!staffProfile) return null;

        const doctor = doctors.find(item =>
            item.id === staffProfile.doctorId || item.staffId === staffProfile.id
        );
        return doctor ? { doctor, staffProfile } : null;
    }

    let doctor = account.profileId
        ? doctors.find(item => item.id === account.profileId)
        : null;

    if (!doctor && !account.profileId && account.profileType === 'doctor') {
        const normalizedName = normalizeDoctorName(account.fullName);
        const matches = doctors.filter(item =>
            item.name && normalizeDoctorName(item.name) === normalizedName
        );
        if (matches.length === 1) doctor = matches[0];
    }

    return doctor ? { doctor, staffProfile: null } : null;
}

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
    const registeredAccount = findRegisteredAccount(username);
    const account = registeredAccount || localAccounts[username];
    const requiredRole = loginForm.dataset.role;
    const doctorProfile = account && account.userRole === 'doctor'
        ? findDoctorProfile(account)
        : null;

    if (registeredAccount && registeredAccount.status !== 'Active') {
        message.textContent = 'This account is inactive. Contact your clinic administrator.';
        return;
    }

    if (account && account.userRole === 'doctor' && (
        !doctorProfile ||
        doctorProfile.doctor.status !== 'Active' ||
        (doctorProfile.staffProfile && doctorProfile.staffProfile.status !== 'Active')
    )) {
        message.textContent = 'This doctor profile is inactive or unavailable. Contact your clinic administrator.';
        return;
    }

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
        role: account.userRole,
        userId: account.id || null,
        profileId: account.profileId || (doctorProfile && doctorProfile.doctor.id) || null,
        profileType: account.profileType || (doctorProfile && 'doctor') || null
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