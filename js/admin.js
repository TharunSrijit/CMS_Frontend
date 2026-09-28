// ============================================================
// CMS - ADMIN JAVASCRIPT
// File: js/admin.js
// ============================================================

// ============================================================
// PAGE LOAD
// ============================================================

document.addEventListener("DOMContentLoaded", function () {

```
// Load dashboard
loadDashboard();

// Load doctors
loadDoctors();

// Load staff
loadStaff();

// Load users
loadUsers();
```

});

// ============================================================
// DASHBOARD
// ============================================================

function loadDashboard() {

```
const doctors = getDoctors();

const staff = getStaff();

const users = getUsers();


// Total Doctors
const totalDoctors =
    document.getElementById("totalDoctors");

if (totalDoctors) {

    totalDoctors.textContent =
        doctors.length;

}


// Total Staff
const totalStaff =
    document.getElementById("totalStaff");

if (totalStaff) {

    totalStaff.textContent =
        staff.length;

}


// Total Users
const totalUsers =
    document.getElementById("totalUsers");

if (totalUsers) {

    totalUsers.textContent =
        users.length;

}


// Active Users
const activeUsers =
    document.getElementById("activeUsers");

if (activeUsers) {

    const active =
        users.filter(function (user) {

            return user.status === "Active";

        });

    activeUsers.textContent =
        active.length;

}
```

}

// ============================================================
// DASHBOARD NAVIGATION
// ============================================================

function goToDoctors() {

```
window.location.href =
    "doctor-management.html";
```

}

function goToStaff() {

```
window.location.href =
    "staff-management.html";
```

}

function goToUsers() {

```
window.location.href =
    "user-management.html";
```

}

// ============================================================
// DOCTOR MANAGEMENT
// ============================================================

// ADD DOCTOR

function addDoctor() {

```
const name =
    document.getElementById("doctorName")
        .value
        .trim();

const email =
    document.getElementById("doctorEmail")
        .value
        .trim();

const phone =
    document.getElementById("doctorPhone")
        .value
        .trim();

const specialization =
    document.getElementById("doctorSpecialization")
        .value
        .trim();


// Validation

if (
    !name ||
    !email ||
    !phone ||
    !specialization
) {

    alert("Please fill all doctor details.");

    return;

}


// Get existing doctors

const doctors = getDoctors();


// Check duplicate email

const emailAlreadyExists =
    doctors.some(function (doctor) {

        return doctor.email.toLowerCase() ===
               email.toLowerCase();

    });


if (emailAlreadyExists) {

    alert(
        "A doctor with this email already exists."
    );

    return;

}


// Create doctor

const doctor = {

    id: generateId("DOC"),

    name: name,

    email: email,

    phone: phone,

    specialization: specialization,

    status: "Active",

    createdAt:
        new Date().toLocaleDateString()

};


// Add doctor

doctors.push(doctor);


// Save

saveDoctors(doctors);


alert(
    "Doctor added successfully."
);


// Clear form

document.getElementById("doctorForm")
    .reset();


// Refresh table

loadDoctors();
```

}

// LOAD DOCTORS

function loadDoctors() {

```
const tableBody =
    document.getElementById(
        "doctorTableBody"
    );


// If this is not doctor page

if (!tableBody) {

    return;

}


const doctors = getDoctors();


tableBody.innerHTML = "";


// No doctors

if (doctors.length === 0) {

    tableBody.innerHTML = `

        <tr>

            <td colspan="7">
                No doctors found.
            </td>

        </tr>

    `;

    return;

}


// Display doctors

doctors.forEach(function (doctor) {

    const row =
        document.createElement("tr");


    row.innerHTML = `

        <td>${doctor.id}</td>

        <td>${doctor.name}</td>

        <td>${doctor.email}</td>

        <td>${doctor.phone}</td>

        <td>${doctor.specialization}</td>

        <td>${doctor.status}</td>

        <td>

            <button
                onclick="editDoctor('${doctor.id}')">
                Edit
            </button>

            <button
                onclick="toggleDoctorStatus('${doctor.id}')">
                ${
                    doctor.status === "Active"
                    ? "Deactivate"
                    : "Activate"
                }
            </button>

            <button
                onclick="deleteDoctor('${doctor.id}')">
                Delete
            </button>

        </td>

    `;


    tableBody.appendChild(row);

});
```

}

// EDIT DOCTOR

function editDoctor(id) {

```
const doctors = getDoctors();


const doctor =
    doctors.find(function (item) {

        return item.id === id;

    });


if (!doctor) {

    alert("Doctor not found.");

    return;

}


const name =
    prompt(
        "Enter doctor name:",
        doctor.name
    );


if (name === null) {

    return;

}


const email =
    prompt(
        "Enter doctor email:",
        doctor.email
    );


if (email === null) {

    return;

}


const phone =
    prompt(
        "Enter doctor phone:",
        doctor.phone
    );


if (phone === null) {

    return;

}


const specialization =
    prompt(
        "Enter specialization:",
        doctor.specialization
    );


if (specialization === null) {

    return;

}


doctor.name =
    name.trim();

doctor.email =
    email.trim();

doctor.phone =
    phone.trim();

doctor.specialization =
    specialization.trim();


saveDoctors(doctors);


alert(
    "Doctor updated successfully."
);


loadDoctors();
```

}

// DELETE DOCTOR

function deleteDoctor(id) {

```
const confirmDelete =
    confirm(
        "Are you sure you want to delete this doctor?"
    );


if (!confirmDelete) {

    return;

}


deleteById(
    STORAGE_KEYS.doctors,
    id
);


alert(
    "Doctor deleted successfully."
);


loadDoctors();
```

}

// TOGGLE DOCTOR STATUS

function toggleDoctorStatus(id) {

```
const doctors = getDoctors();


const doctor =
    doctors.find(function (item) {

        return item.id === id;

    });


if (!doctor) {

    return;

}


if (doctor.status === "Active") {

    doctor.status = "Inactive";

} else {

    doctor.status = "Active";

}


saveDoctors(doctors);


loadDoctors();
```

}

// SEARCH DOCTORS

function searchDoctors() {

```
const search =
    document.getElementById(
        "doctorSearch"
    ).value
    .toLowerCase()
    .trim();


const doctors = getDoctors();


const filteredDoctors =
    doctors.filter(function (doctor) {

        return (

            doctor.name
                .toLowerCase()
                .includes(search)

            ||

            doctor.email
                .toLowerCase()
                .includes(search)

            ||

            doctor.specialization
                .toLowerCase()
                .includes(search)

        );

    });


displayDoctors(
    filteredDoctors
);
```

}

// DISPLAY SEARCHED DOCTORS

function displayDoctors(doctors) {

```
const tableBody =
    document.getElementById(
        "doctorTableBody"
    );


if (!tableBody) {

    return;

}


tableBody.innerHTML = "";


if (doctors.length === 0) {

    tableBody.innerHTML = `

        <tr>

            <td colspan="7">
                No doctors found.
            </td>

        </tr>

    `;

    return;

}


doctors.forEach(function (doctor) {

    const row =
        document.createElement("tr");


    row.innerHTML = `

        <td>${doctor.id}</td>

        <td>${doctor.name}</td>

        <td>${doctor.email}</td>

        <td>${doctor.phone}</td>

        <td>${doctor.specialization}</td>

        <td>${doctor.status}</td>

        <td>

            <button
                onclick="editDoctor('${doctor.id}')">
                Edit
            </button>

            <button
                onclick="toggleDoctorStatus('${doctor.id}')">
                ${
                    doctor.status === "Active"
                    ? "Deactivate"
                    : "Activate"
                }
            </button>

            <button
                onclick="deleteDoctor('${doctor.id}')">
                Delete
            </button>

        </td>

    `;


    tableBody.appendChild(row);

});
```

}

// ============================================================
// STAFF MANAGEMENT
// ============================================================

// ADD STAFF

function addStaff() {

```
const name =
    document.getElementById("staffName")
        .value
        .trim();

const email =
    document.getElementById("staffEmail")
        .value
        .trim();

const phone =
    document.getElementById("staffPhone")
        .value
        .trim();

const role =
    document.getElementById("staffRole")
        .value;


if (
    !name ||
    !email ||
    !phone ||
    !role
) {

    alert(
        "Please fill all staff details."
    );

    return;

}


const staff = getStaff();


// Check duplicate email

const emailAlreadyExists =
    staff.some(function (person) {

        return person.email.toLowerCase() ===
               email.toLowerCase();

    });


if (emailAlreadyExists) {

    alert(
        "A staff member with this email already exists."
    );

    return;

}


// Create staff

const newStaff = {

    id: generateId("STAFF"),

    name: name,

    email: email,

    phone: phone,

    role: role,

    status: "Active",

    createdAt:
        new Date().toLocaleDateString()

};


staff.push(newStaff);


saveStaff(staff);


alert(
    "Staff added successfully."
);


document.getElementById("staffForm")
    .reset();


loadStaff();
```

}

// LOAD STAFF

function loadStaff() {

```
const tableBody =
    document.getElementById(
        "staffTableBody"
    );


if (!tableBody) {

    return;

}


const staff = getStaff();


tableBody.innerHTML = "";


if (staff.length === 0) {

    tableBody.innerHTML = `

        <tr>

            <td colspan="7">
                No staff found.
            </td>

        </tr>

    `;

    return;

}


staff.forEach(function (person) {

    const row =
        document.createElement("tr");


    row.innerHTML = `

        <td>${person.id}</td>

        <td>${person.name}</td>

        <td>${person.email}</td>

        <td>${person.phone}</td>

        <td>${person.role}</td>

        <td>${person.status}</td>

        <td>

            <button
                onclick="editStaff('${person.id}')">
                Edit
            </button>

            <button
                onclick="toggleStaffStatus('${person.id}')">
                ${
                    person.status === "Active"
                    ? "Deactivate"
                    : "Activate"
                }
            </button>

            <button
                onclick="deleteStaff('${person.id}')">
                Delete
            </button>

        </td>

    `;


    tableBody.appendChild(row);

});
```

}

// EDIT STAFF

function editStaff(id) {

```
const staff = getStaff();


const person =
    staff.find(function (item) {

        return item.id === id;

    });


if (!person) {

    alert("Staff member not found.");

    return;

}


const name =
    prompt(
        "Enter staff name:",
        person.name
    );


if (name === null) return;


const email =
    prompt(
        "Enter staff email:",
        person.email
    );


if (email === null) return;


const phone =
    prompt(
        "Enter staff phone:",
        person.phone
    );


if (phone === null) return;


const role =
    prompt(
        "Enter role:\nReceptionist\nLab Technician\nPharmacist",
        person.role
    );


if (role === null) return;


person.name =
    name.trim();

person.email =
    email.trim();

person.phone =
    phone.trim();

person.role =
    role.trim();


saveStaff(staff);


alert(
    "Staff updated successfully."
);


loadStaff();
```

}

// DELETE STAFF

function deleteStaff(id) {

```
const confirmDelete =
    confirm(
        "Are you sure you want to delete this staff member?"
    );


if (!confirmDelete) {

    return;

}


deleteById(
    STORAGE_KEYS.staff,
    id
);


alert(
    "Staff deleted successfully."
);


loadStaff();
```

}

// TOGGLE STAFF STATUS

function toggleStaffStatus(id) {

```
const staff = getStaff();


const person =
    staff.find(function (item) {

        return item.id === id;

    });


if (!person) {

    return;

}


person.status =
    person.status === "Active"
        ? "Inactive"
        : "Active";


saveStaff(staff);


loadStaff();
```

}

// SEARCH STAFF

function searchStaff() {

```
const search =
    document.getElementById(
        "staffSearch"
    ).value
    .toLowerCase()
    .trim();


const staff = getStaff();


const filteredStaff =
    staff.filter(function (person) {

        return (

            person.name
                .toLowerCase()
                .includes(search)

            ||

            person.email
                .toLowerCase()
                .includes(search)

            ||

            person.role
                .toLowerCase()
                .includes(search)

        );

    });


displayStaff(
    filteredStaff
);
```

}

// DISPLAY STAFF

function displayStaff(staff) {

```
const tableBody =
    document.getElementById(
        "staffTableBody"
    );


if (!tableBody) return;


tableBody.innerHTML = "";


if (staff.length === 0) {

    tableBody.innerHTML = `

        <tr>

            <td colspan="7">
                No staff found.
            </td>

        </tr>

    `;

    return;

}


staff.forEach(function (person) {

    const row =
        document.createElement("tr");


    row.innerHTML = `

        <td>${person.id}</td>

        <td>${person.name}</td>

        <td>${person.email}</td>

        <td>${person.phone}</td>

        <td>${person.role}</td>

        <td>${person.status}</td>

        <td>

            <button
                onclick="editStaff('${person.id}')">
                Edit
            </button>

            <button
                onclick="toggleStaffStatus('${person.id}')">
                ${
                    person.status === "Active"
                    ? "Deactivate"
                    : "Activate"
                }
            </button>

            <button
                onclick="deleteStaff('${person.id}')">
                Delete
            </button>

        </td>

    `;


    tableBody.appendChild(row);

});
```

}

// ============================================================
// USER MANAGEMENT
// ============================================================

// ADD USER

function addUser() {

```
const name =
    document.getElementById("userName")
        .value
        .trim();

const email =
    document.getElementById("userEmail")
        .value
        .trim();

const role =
    document.getElementById("userRole")
        .value;


if (
    !name ||
    !email ||
    !role
) {

    alert(
        "Please fill all user details."
    );

    return;

}


const users = getUsers();


// Check duplicate email

const emailAlreadyExists =
    users.some(function (user) {

        return user.email.toLowerCase() ===
               email.toLowerCase();

    });


if (emailAlreadyExists) {

    alert(
        "A user with this email already exists."
    );

    return;

}


// Create user

const user = {

    id: generateId("USER"),

    name: name,

    email: email,

    role: role,

    status: "Active",

    createdAt:
        new Date().toLocaleDateString()

};


users.push(user);


saveUsers(users);


alert(
    "User added successfully."
);


document.getElementById("userForm")
    .reset();


loadUsers();
```

}

// LOAD USERS

function loadUsers() {

```
const tableBody =
    document.getElementById(
        "userTableBody"
    );


if (!tableBody) {

    return;

}


const users = getUsers();


tableBody.innerHTML = "";


if (users.length === 0) {

    tableBody.innerHTML = `

        <tr>

            <td colspan="6">
                No users found.
            </td>

        </tr>

    `;

    return;

}


users.forEach(function (user) {

    const row =
        document.createElement("tr");


    row.innerHTML = `

        <td>${user.id}</td>

        <td>${user.name}</td>

        <td>${user.email}</td>

        <td>${user.role}</td>

        <td>${user.status}</td>

        <td>

            <button
                onclick="editUser('${user.id}')">
                Edit
            </button>

            <button
                onclick="toggleUserStatus('${user.id}')">
                ${
                    user.status === "Active"
                    ? "Deactivate"
                    : "Activate"
                }
            </button>

            <button
                onclick="deleteUser('${user.id}')">
                Delete
            </button>

        </td>

    `;


    tableBody.appendChild(row);

});
```

}

// EDIT USER

function editUser(id) {

```
const users = getUsers();


const user =
    users.find(function (item) {

        return item.id === id;

    });


if (!user) {

    alert("User not found.");

    return;

}


const name =
    prompt(
        "Enter user name:",
        user.name
    );


if (name === null) return;


const email =
    prompt(
        "Enter user email:",
        user.email
    );


if (email === null) return;


const role =
    prompt(
        "Enter role:\nAdmin\nDoctor\nReceptionist\nLab Technician\nPharmacist",
        user.role
    );


if (role === null) return;


user.name =
    name.trim();

user.email =
    email.trim();

user.role =
    role.trim();


saveUsers(users);


alert(
    "User updated successfully."
);


loadUsers();
```

}

// DELETE USER

function deleteUser(id) {

```
const confirmDelete =
    confirm(
        "Are you sure you want to delete this user?"
    );


if (!confirmDelete) {

    return;

}


deleteById(
    STORAGE_KEYS.users,
    id
);


alert(
    "User deleted successfully."
);


loadUsers();
```

}

// TOGGLE USER STATUS

function toggleUserStatus(id) {

```
const users = getUsers();


const user =
    users.find(function (item) {

        return item.id === id;

    });


if (!user) {

    return;

}


user.status =
    user.status === "Active"
        ? "Inactive"
        : "Active";


saveUsers(users);


loadUsers();
```

}

// SEARCH USERS

function searchUsers() {

```
const search =
    document.getElementById(
        "userSearch"
    ).value
    .toLowerCase()
    .trim();


const users = getUsers();


const filteredUsers =
    users.filter(function (user) {

        return (

            user.name
                .toLowerCase()
                .includes(search)

            ||

            user.email
                .toLowerCase()
                .includes(search)

            ||

            user.role
                .toLowerCase()
                .includes(search)

        );

    });


displayUsers(
    filteredUsers
);
```

}

// DISPLAY USERS

function displayUsers(users) {

```
const tableBody =
    document.getElementById(
        "userTableBody"
    );


if (!tableBody) return;


tableBody.innerHTML = "";


if (users.length === 0) {

    tableBody.innerHTML = `

        <tr>

            <td colspan="6">
                No users found.
            </td>

        </tr>

    `;

    return;

}


users.forEach(function (user) {

    const row =
        document.createElement("tr");


    row.innerHTML = `

        <td>${user.id}</td>

        <td>${user.name}</td>

        <td>${user.email}</td>

        <td>${user.role}</td>

        <td>${user.status}</td>

        <td>

            <button
                onclick="editUser('${user.id}')">
                Edit
            </button>

            <button
                onclick="toggleUserStatus('${user.id}')">
                ${
                    user.status === "Active"
                    ? "Deactivate"
                    : "Activate"
                }
            </button>

            <button
                onclick="deleteUser('${user.id}')">
                Delete
            </button>

        </td>

    `;


    tableBody.appendChild(row);

});
```

}
