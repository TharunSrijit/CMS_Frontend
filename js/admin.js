// ============================================================
// CMS - ADMIN JAVASCRIPT
// File: js/admin.js
// ============================================================

// ============================================================
// PAGE LOAD
// ============================================================

document.addEventListener("DOMContentLoaded", function () {

syncDirectoryRecords();

// Load dashboard
loadDashboard();

// Load doctors
loadDoctors();

// Load staff
loadStaff();

loadUsers();
loadCustomSpecializations();
updateStaffRoleFields();
updateDoctorUserFields();
initializeDoctorAvailabilityOptions();
initializeDoctorUnavailableDates();
updateDoctorAvailabilityFields();
const cancelDoctorEditButton = document.getElementById("cancelDoctorEdit");
if (cancelDoctorEditButton) {
    cancelDoctorEditButton.addEventListener("click", resetDoctorForm);
}

});

// ============================================================
// DASHBOARD
// ============================================================

function loadDashboard() {

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

}

// ============================================================
// DASHBOARD NAVIGATION
// ============================================================

function goToDoctors() {

window.location.href =
    "doctor-management.html";

}

function goToStaff() {

window.location.href =
    "staff-management.html";

}

function goToUsers() {

window.location.href =
    "user-management.html";

}

// ============================================================
// DOCTOR MANAGEMENT
// ============================================================

const CUSTOM_SPECIALIZATIONS_KEY = "cms_custom_specializations";
const SPECIALIZATION_SELECT_IDS = [
    "doctorSpecialization",
    "staffSpecialization"
];

function loadCustomSpecializations() {
    let specializations;
    try {
        specializations = JSON.parse(localStorage.getItem(CUSTOM_SPECIALIZATIONS_KEY) || "[]");
    } catch (error) {
        console.error("Unable to read custom doctor specializations:", error);
        return;
    }
    if (!Array.isArray(specializations)) return;

    SPECIALIZATION_SELECT_IDS.forEach(function (id) {
        const select = document.getElementById(id);
        if (!select) return;
        const addOption = select.querySelector('option[value="__add_specialization__"]');
        specializations.forEach(function (specialization) {
            if (typeof specialization !== "string" || !specialization.trim()) return;
            const exists = Array.from(select.options).some(function (option) {
                return option.value.toLowerCase() === specialization.toLowerCase();
            });
            if (exists) return;
            const option = new Option(specialization, specialization);
            select.insertBefore(option, addOption);
        });
    });
}

function handleSpecializationChange(select) {
    if (select.value !== "__add_specialization__") {
        select.dataset.previousValue = select.value;
        return;
    }

    const entered = prompt("Enter the new doctor specialization:");
    const specialization = entered && entered.trim();
    if (!specialization) {
        select.value = select.dataset.previousValue || "";
        return;
    }

    const existingOption = Array.from(select.options).find(function (option) {
        return option.value.toLowerCase() === specialization.toLowerCase();
    });
    if (existingOption) {
        select.value = existingOption.value;
        select.dataset.previousValue = select.value;
        return;
    }

    let specializations;
    try {
        specializations = JSON.parse(localStorage.getItem(CUSTOM_SPECIALIZATIONS_KEY) || "[]");
    } catch (error) {
        console.error("Unable to read custom doctor specializations:", error);
        alert("Unable to load custom specializations. Please try again.");
        select.value = select.dataset.previousValue || "";
        return;
    }
    if (!Array.isArray(specializations)) specializations = [];
    specializations.push(specialization);

    try {
        localStorage.setItem(CUSTOM_SPECIALIZATIONS_KEY, JSON.stringify(specializations));
    } catch (error) {
        console.error("Unable to save custom doctor specializations:", error);
        alert("Unable to save the new specialization. Please try again.");
        select.value = select.dataset.previousValue || "";
        return;
    }

    SPECIALIZATION_SELECT_IDS.forEach(function (id) {
        const target = document.getElementById(id);
        if (!target) return;
        const alreadyAdded = Array.from(target.options).some(function (option) {
            return option.value.toLowerCase() === specialization.toLowerCase();
        });
        if (alreadyAdded) return;
        const addOption = target.querySelector('option[value="__add_specialization__"]');
        target.insertBefore(new Option(specialization, specialization), addOption);
    });

    select.value = specialization;
    select.dataset.previousValue = specialization;
}

// ADD DOCTOR

function syncLinkedAccounts(profileType, profileId, updates) {
    if (!profileId) return;

    const users = getUsers();
    let changed = false;

    users.forEach(function (user) {
        if (user.profileType === profileType && user.profileId === profileId) {
            Object.assign(user, updates);
            changed = true;
        }
    });

    if (changed) saveUsers(users);
}

function syncDirectoryRecords() {
    getDoctors().forEach(syncDoctorStaffRecord);

    getStaff().forEach(function (person) {
        if (person.role === "Doctor" && person.specialization) {
            syncDoctorProfileFromStaff(person, person.specialization);
        }
    });
}

function readDoctorAvailability(dayName, startId, endId, defaultTimeId) {
    const selectedDays = Array.from(document.querySelectorAll(
        'input[name="' + dayName + '"]:checked'
    ));
    const noAvailableDays = selectedDays.some(function (input) {
        return input.value === "none";
    });
    const days = noAvailableDays ? [] : selectedDays.map(function (input) {
        return Number(input.value);
    });
    if (noAvailableDays) {
        return {
            days: [],
            startTime: "",
            endTime: "",
            defaultAppointmentTime: ""
        };
    }

    const startTime = document.getElementById(startId).value;
    const endTime = document.getElementById(endId).value;
    const defaultAppointmentTime = document.getElementById(defaultTimeId).value;

    if (days.length === 0 && !noAvailableDays) {
        alert("Select available days or choose Unavailable.");
        return null;
    }

    if (!startTime || !endTime || endTime <= startTime) {
        alert("The availability end time must be later than the start time.");
        return null;
    }

    const startMinutes = Number(startTime.slice(0, 2)) * 60 + Number(startTime.slice(3, 5));
    const endMinutes = Number(endTime.slice(0, 2)) * 60 + Number(endTime.slice(3, 5));
    const defaultMinutes = defaultAppointmentTime
        ? Number(defaultAppointmentTime.slice(0, 2)) * 60 + Number(defaultAppointmentTime.slice(3, 5))
        : -1;
    if (defaultMinutes < startMinutes || defaultMinutes >= endMinutes) {
        alert("Choose a default appointment time within the available hours.");
        return null;
    }

    return {
        days: days,
        startTime: startTime,
        endTime: endTime,
        defaultAppointmentTime: defaultAppointmentTime
    };
}

function initializeDoctorAvailabilityOptions() {
    document.querySelectorAll('input[name="doctorAvailabilityDay"]').forEach(function (input) {
        input.addEventListener("change", function () {
            const isNoneOption = input.value === "none";
            document.querySelectorAll('input[name="doctorAvailabilityDay"]').forEach(function (option) {
                if (option === input) return;
                if (isNoneOption && input.checked) option.checked = false;
                else if (!isNoneOption && input.checked && option.value === "none") option.checked = false;
            });
        });
    });
}

function initializeDoctorUnavailableDates() {
    const dateInput = document.getElementById("doctorUnavailableDate");
    const removeButton = document.getElementById("removeDoctorUnavailableDate");
    if (!dateInput || !removeButton) return;

    const today = new Date();
    dateInput.min = [
        today.getFullYear(),
        String(today.getMonth() + 1).padStart(2, "0"),
        String(today.getDate()).padStart(2, "0")
    ].join("-");
    dateInput.addEventListener("change", addDoctorUnavailableDate);
    removeButton.addEventListener("click", removeSelectedDoctorUnavailableDate);
    renderDoctorUnavailableDates([]);
}

function getDoctorUnavailableDates() {
    const input = document.getElementById("doctorUnavailableDate");
    if (!input) return [];
    try {
        const dates = JSON.parse(input.dataset.unavailableDates || "[]");
        return Array.isArray(dates) ? dates : [];
    } catch (error) {
        console.error("Unable to read doctor unavailable dates:", error);
        return [];
    }
}

function renderDoctorUnavailableDates(dates) {
    const input = document.getElementById("doctorUnavailableDate");
    if (!input) return;
    input.dataset.unavailableDates = JSON.stringify(dates);
    updateRemoveDoctorUnavailableDateButton();
}

function addDoctorUnavailableDate() {
    const dateInput = document.getElementById("doctorUnavailableDate");
    if (!dateInput || !dateInput.value) return;

    const dates = getDoctorUnavailableDates();
    if (!dates.includes(dateInput.value)) {
        dates.push(dateInput.value);
        dates.sort();
        renderDoctorUnavailableDates(dates);
    }
    updateRemoveDoctorUnavailableDateButton();
}

function updateRemoveDoctorUnavailableDateButton() {
    const dateInput = document.getElementById("doctorUnavailableDate");
    const removeButton = document.getElementById("removeDoctorUnavailableDate");
    if (!dateInput || !removeButton) return;
    removeButton.hidden = !getDoctorUnavailableDates().includes(dateInput.value);
}

function removeSelectedDoctorUnavailableDate() {
    const dateInput = document.getElementById("doctorUnavailableDate");
    if (!dateInput || !dateInput.value) return;
    renderDoctorUnavailableDates(getDoctorUnavailableDates().filter(function (date) {
        return date !== dateInput.value;
    }));
    dateInput.value = "";
    updateRemoveDoctorUnavailableDateButton();
}

function updateDoctorAvailabilityFields() {
    const statusInput = document.getElementById("doctorStatus");
    if (!statusInput) return;

    const isInactive = statusInput.value === "Inactive";
    [
        "doctorAvailableDaysField",
        "doctorStartTimeField",
        "doctorEndTimeField",
        "doctorDefaultAppointmentTimeField"
    ].forEach(function (id) {
        const field = document.getElementById(id);
        if (field) field.hidden = isInactive;
    });

    ["doctorStartTime", "doctorEndTime", "doctorDefaultAppointmentTime"].forEach(function (id) {
        const input = document.getElementById(id);
        if (input) input.required = !isInactive;
    });

    const note = document.getElementById("doctorInactiveAvailabilityNote");
    if (note) note.hidden = !isInactive;
}

function syncDoctorStaffRecord(doctor) {

const staff = getStaff();
let person = staff.find(function (item) {
    return item.id === doctor.staffId || item.doctorId === doctor.id;
});

if (!person) {
    person = staff.find(function (item) {
        return item.role === "Doctor" && item.email.toLowerCase() === doctor.email.toLowerCase();
    });
}

if (!person) {
    person = {
        id: doctor.staffId || generateId("STAFF"),
        createdAt: doctor.createdAt
    };
    staff.push(person);
}

doctor.staffId = person.id;
Object.assign(person, {
    doctorId: doctor.id,
    name: doctor.name,
    email: doctor.email,
    phone: doctor.phone,
    role: "Doctor",
    licenseNumber: doctor.licenseNumber || "",
    specialization: doctor.specialization,
    status: doctor.status
});

saveStaff(staff);
const doctors = getDoctors();
const storedDoctor = doctors.find(function (item) {
    return item.id === doctor.id;
});
if (storedDoctor) {
    storedDoctor.staffId = doctor.staffId;
    saveDoctors(doctors);
}
syncLinkedAccounts("doctor", doctor.id, {
    name: doctor.name,
    email: doctor.email,
    role: "Doctor",
    status: doctor.status
});

}

function removeDoctorStaffRecord(doctor) {
    const staff = getStaff().filter(function (person) {
        return person.id !== doctor.staffId && person.doctorId !== doctor.id;
    });
    saveStaff(staff);
    syncLinkedAccounts("doctor", doctor.id, { status: "Inactive" });
}

function addDoctor() {

const form = document.getElementById("doctorForm");
const editId = form.dataset.editId || "";
const name = document.getElementById("doctorName").value.trim();
const email = document.getElementById("doctorEmail").value.trim();
const phone = document.getElementById("doctorPhone").value.trim();
const licenseNumber = document.getElementById("doctorLicense").value.trim();
const specialization = document.getElementById("doctorSpecialization").value.trim();
const consultationFeeInput = document.getElementById("doctorConsultationFee").value.trim();
const consultationFee = consultationFeeInput === "" ? null : Number(consultationFeeInput);
const status = document.getElementById("doctorStatus").value;
const existingDoctor = editId ? getDoctors().find(function (item) {
    return item.id === editId;
}) : null;
const availability = status === "Inactive"
    ? existingDoctor && existingDoctor.availability
        ? existingDoctor.availability
        : { days: [], startTime: "", endTime: "", defaultAppointmentTime: "" }
    : readDoctorAvailability(
        "doctorAvailabilityDay",
        "doctorStartTime",
        "doctorEndTime",
        "doctorDefaultAppointmentTime"
    );

if (!name || !email || !phone || !licenseNumber || !specialization ||
    (consultationFeeInput !== "" && (!Number.isFinite(consultationFee) || consultationFee < 0))) {
    alert("Please fill all doctor details.");
    return;
}
if (!availability) return;

const doctors = getDoctors();
const staff = getStaff();
const duplicateDoctor = doctors.some(function (item) {
    return item.id !== editId && item.email.toLowerCase() === email.toLowerCase();
});
const matchingStaff = staff.find(function (person) {
    return person.email.toLowerCase() === email.toLowerCase();
});

if (duplicateDoctor || (matchingStaff && matchingStaff.role !== "Doctor")) {
    alert("A person with this email already exists. Check the staff and doctor directories.");
    return;
}

if (editId && !existingDoctor) {
    alert("Doctor not found. Refresh the page and try again.");
    resetDoctorForm();
    return;
}

const doctor = Object.assign({}, existingDoctor || {}, {
    id: existingDoctor ? existingDoctor.id : generateId("DOC"),
    staffId: existingDoctor
        ? existingDoctor.staffId
        : matchingStaff ? matchingStaff.id : generateId("STAFF"),
    name: name,
    email: email,
    phone: phone,
    licenseNumber: licenseNumber,
    specialization: specialization,
    consultationFee: consultationFee,
    availability: Object.assign({}, availability, {
        unavailableDates: getDoctorUnavailableDates()
    }),
    status: status,
    createdAt: existingDoctor ? existingDoctor.createdAt : new Date().toLocaleDateString()
});

if (existingDoctor) {
    const doctorIndex = doctors.findIndex(function (item) {
        return item.id === editId;
    });
    doctors[doctorIndex] = doctor;
} else {
    doctors.push(doctor);
}
if (!saveDoctors(doctors)) return;
syncDoctorStaffRecord(doctor);

alert(existingDoctor ? "Doctor updated successfully." : "Doctor added successfully.");
resetDoctorForm();
loadDoctors();

}

function resetDoctorForm() {
    const form = document.getElementById("doctorForm");
    if (!form) return;

    form.reset();
    form.dataset.editId = "";
    renderDoctorUnavailableDates([]);
    document.getElementById("add-doctor-title").textContent = "Add a doctor";
    form.querySelector(".doctor-submit").innerHTML = '<span aria-hidden="true">+</span> Add doctor';
    document.getElementById("cancelDoctorEdit").hidden = true;
    updateDoctorAvailabilityFields();
}

// LOAD DOCTORS

function loadDoctors() {

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

            <td colspan="12">
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

        <td>${doctor.licenseNumber || "Not provided"}</td>

        <td>${doctor.specialization}</td>

        <td>${formatConsultationFee(doctor.consultationFee)}</td>

        <td>${formatDoctorAvailability(doctor.availability)}</td>

        <td>${formatDoctorUnavailableDates(doctor.availability)}</td>

        <td>${doctor.availability && Array.isArray(doctor.availability.days) && doctor.availability.days.length === 0 ? "Unavailable" : (doctor.availability && doctor.availability.defaultAppointmentTime) || (doctor.availability && doctor.availability.startTime) || "Not set"}</td>

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

}

function formatDoctorAvailability(availability) {
    if (!availability || !Array.isArray(availability.days)) return "Not set";
    if (availability.days.length === 0) return "Unavailable";
    const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const days = availability.days.map(function (day) {
        return dayLabels[day];
    }).filter(Boolean).join(", ");
    return days + " · " + availability.startTime + "–" + availability.endTime;
}

function formatDoctorUnavailableDates(availability) {
    const unavailableDates = availability && Array.isArray(availability.unavailableDates)
        ? availability.unavailableDates
        : [];
    if (unavailableDates.length === 0) return "None";
    return unavailableDates.map(function (date) {
        return new Date(date + "T00:00:00").toLocaleDateString();
    }).join(", ");
}

function formatConsultationFee(fee) {
    return fee == null || fee === ""
        ? "Not set"
        : new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(Number(fee));
}

// EDIT DOCTOR

function editDoctor(id) {

const doctors = getDoctors();
const doctor =
    doctors.find(function (item) {
        return item.id === id;
    });

if (!doctor) {
    alert("Doctor not found.");
    return;
}

const form = document.getElementById("doctorForm");
const availability = doctor.availability || {};

form.dataset.editId = doctor.id;
document.getElementById("doctorName").value = doctor.name || "";
document.getElementById("doctorEmail").value = doctor.email || "";
document.getElementById("doctorPhone").value = doctor.phone || "";
document.getElementById("doctorLicense").value = doctor.licenseNumber || "";
document.getElementById("doctorSpecialization").value = doctor.specialization || "";
document.getElementById("doctorConsultationFee").value = doctor.consultationFee ?? "";
document.getElementById("doctorStatus").value = doctor.status || "Active";
document.getElementById("doctorStartTime").value = availability.startTime || "";
document.getElementById("doctorEndTime").value = availability.endTime || "";
document.getElementById("doctorDefaultAppointmentTime").value =
    availability.defaultAppointmentTime || availability.startTime || "";
renderDoctorUnavailableDates(Array.isArray(availability.unavailableDates)
    ? availability.unavailableDates
    : []);

const availableDays = Array.isArray(availability.days) ? availability.days : [];
document.querySelectorAll('input[name="doctorAvailabilityDay"]').forEach(function (input) {
    input.checked = input.value === "none"
        ? availableDays.length === 0
        : availableDays.includes(Number(input.value));
});

document.getElementById("add-doctor-title").textContent = "Edit doctor";
form.querySelector(".doctor-submit").innerHTML = "Save changes";
document.getElementById("cancelDoctorEdit").hidden = false;
updateDoctorAvailabilityFields();
form.scrollIntoView({ behavior: "smooth", block: "start" });
document.getElementById("doctorName").focus({ preventScroll: true });

}

// DELETE DOCTOR

function deleteDoctor(id) {

const confirmDelete =
    confirm(
        "Are you sure you want to delete this doctor?"
    );


if (!confirmDelete) {

    return;

}


const doctor = getDoctors().find(function (item) {
    return item.id === id;
});


deleteById(
    STORAGE_KEYS.doctors,
    id
);

if (doctor) {
    removeDoctorStaffRecord(doctor);
}


alert(
    "Doctor deleted successfully."
);


loadDoctors();

}

// TOGGLE DOCTOR STATUS

function toggleDoctorStatus(id) {

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
syncDoctorStaffRecord(doctor);


loadDoctors();

}

// SEARCH DOCTORS

function searchDoctors() {

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

            (doctor.licenseNumber || "")
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

}

// DISPLAY SEARCHED DOCTORS

function displayDoctors(doctors) {

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

            <td colspan="12">
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

        <td>${doctor.licenseNumber || "Not provided"}</td>

        <td>${doctor.specialization}</td>

        <td>${formatConsultationFee(doctor.consultationFee)}</td>

        <td>${formatDoctorAvailability(doctor.availability)}</td>

        <td>${formatDoctorUnavailableDates(doctor.availability)}</td>

        <td>${doctor.availability && Array.isArray(doctor.availability.days) && doctor.availability.days.length === 0 ? "Unavailable" : (doctor.availability && doctor.availability.defaultAppointmentTime) || (doctor.availability && doctor.availability.startTime) || "Not set"}</td>

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

}

// ============================================================
// STAFF MANAGEMENT
// ============================================================

// ADD STAFF

function updateStaffRoleFields() {
    const roleInput = document.getElementById("staffRole");
    const specializationField = document.getElementById("doctor-specialization-field");
    const specializationInput = document.getElementById("staffSpecialization");
    const licenseField = document.getElementById("doctor-license-field");
    const licenseInput = document.getElementById("staffDoctorLicense");

    if (!roleInput || !specializationField || !specializationInput) return;

    const isDoctor = roleInput.value === "Doctor";
    specializationField.hidden = !isDoctor;
    specializationInput.required = isDoctor;
    if (licenseField) licenseField.hidden = !isDoctor;
    if (licenseInput) licenseInput.required = isDoctor;
}

function updateDoctorUserFields() {
    const roleInput = document.getElementById("userRole");
    const nameInput = document.getElementById("userName");
    const emailInput = document.getElementById("userEmail");
    const profileField = document.getElementById("userProfileField");
    const profileSelect = document.getElementById("userProfile");
    const profileHint = document.getElementById("userProfileHint");
    const profileDetails = document.getElementById("userProfileDetails");

    if (!roleInput || !nameInput || !emailInput || !profileField || !profileSelect) return;

    const role = roleInput.value;
    const requiresProfile = role !== "" && role !== "Admin";
    const selectedProfileId = profileSelect.value;
    nameInput.readOnly = requiresProfile;
    emailInput.readOnly = requiresProfile;
    profileField.hidden = !requiresProfile;

    if (!requiresProfile) {
        profileHint.hidden = true;
        profileDetails.hidden = true;
        return;
    }

    const users = getUsers();
    const profiles = role === "Doctor"
        ? getDoctors()
        : getStaff().filter(function (person) { return person.role === role; });
    const availableProfiles = profiles.filter(function (profile) {
        if (!profile || profile.status !== "Active" || !profile.email) return false;
        return !users.some(function (user) {
            const correctRole = user.role === role;
            const linkedById = correctRole && (
                (user.profileType === (role === "Doctor" ? "doctor" : "staff") && user.profileId === profile.id) ||
                (role === "Doctor" && user.profileType === "staff" && user.profileId === profile.staffId)
            );
            const linkedByEmail = correctRole &&
                String(user.email || "").trim().toLowerCase() === String(profile.email).trim().toLowerCase();
            return linkedById || linkedByEmail;
        });
    });

    profileSelect.textContent = "";
    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = role === "Doctor" ? "Select an existing doctor" : "Select an existing staff member";
    profileSelect.appendChild(placeholder);
    availableProfiles.forEach(function (profile) {
        const option = document.createElement("option");
        option.value = profile.id;
        option.textContent = profile.name + " — " + profile.email;
        profileSelect.appendChild(option);
    });

    const selectedProfile = availableProfiles.find(function (profile) {
        return profile.id === selectedProfileId;
    });
    profileSelect.value = selectedProfile ? selectedProfile.id : "";
    profileHint.hidden = availableProfiles.length > 0;

    if (!selectedProfile) {
        nameInput.value = "";
        emailInput.value = "";
        profileDetails.textContent = "";
        profileDetails.hidden = true;
        profileHint.textContent = "";
        profileHint.appendChild(document.createTextNode("No available " +
            (role === "Doctor" ? "doctor" : role.toLowerCase()) + " profiles. "));
        const addProfileLink = document.createElement("a");
        addProfileLink.href = role === "Doctor" ? "doctor-management.html" : "staff-management.html";
        addProfileLink.textContent = role === "Doctor" ? "Add a doctor profile first" : "Add a staff profile first";
        profileHint.appendChild(addProfileLink);
        profileHint.appendChild(document.createTextNode("."));
        return;
    }

    profileHint.hidden = true;
    nameInput.value = selectedProfile.name || "";
    emailInput.value = selectedProfile.email || "";
    const details = [
        selectedProfile.phone ? "Phone: " + selectedProfile.phone : "",
        selectedProfile.licenseNumber ? "License: " + selectedProfile.licenseNumber : "",
        selectedProfile.specialization ? "Specialization: " + selectedProfile.specialization : "",
        role === "Doctor"
            ? "Availability: " + formatDoctorAvailability(selectedProfile.availability)
            : "",
        role === "Doctor"
            ? "Unavailable dates: " + formatDoctorUnavailableDates(selectedProfile.availability)
            : ""
    ].filter(Boolean);
    profileDetails.textContent = details.join(" · ");
    profileDetails.hidden = details.length === 0;
}

function syncDoctorProfileFromStaff(person, specialization, licenseNumber) {
    const doctors = getDoctors();
    let doctor = doctors.find(function (item) {
        return item.id === person.doctorId || item.staffId === person.id;
    });

    if (!doctor) {
        doctor = {
            id: generateId("DOC"),
            staffId: person.id,
            createdAt: person.createdAt
        };
        doctors.push(doctor);
    }

    Object.assign(doctor, {
        staffId: person.id,
        name: person.name,
        email: person.email,
        phone: person.phone,
        licenseNumber: licenseNumber || person.licenseNumber || doctor.licenseNumber || "",
        specialization: specialization,
        status: person.status
    });
    person.doctorId = doctor.id;
    person.specialization = specialization;
    person.licenseNumber = doctor.licenseNumber;

    const staff = getStaff();
    const storedPerson = staff.find(function (item) {
        return item.id === person.id;
    });
    if (storedPerson) Object.assign(storedPerson, person);

    saveDoctors(doctors);
    saveStaff(staff);
    syncLinkedAccounts("staff", person.id, {
        profileType: "doctor",
        profileId: doctor.id,
        name: person.name,
        email: person.email,
        role: "Doctor",
        status: person.status
    });
    syncLinkedAccounts("doctor", doctor.id, {
        name: person.name,
        email: person.email,
        role: "Doctor",
        status: person.status
    });
}

function removeDoctorProfileForStaff(person) {
    const existingDoctors = getDoctors();
    const linkedDoctors = existingDoctors.filter(function (doctor) {
        return doctor.id === person.doctorId || doctor.staffId === person.id;
    });

    linkedDoctors.forEach(function (doctor) {
        syncLinkedAccounts("doctor", doctor.id, {
            profileType: "staff",
            profileId: person.id,
            role: person.role,
            name: person.name,
            email: person.email,
            status: person.status
        });
    });

    const doctors = existingDoctors.filter(function (doctor) {
        return doctor.id !== person.doctorId && doctor.staffId !== person.id;
    });
    saveDoctors(doctors);
}

function addStaff() {

const name = document.getElementById("staffName").value.trim();
const email = document.getElementById("staffEmail").value.trim();
const phone = document.getElementById("staffPhone").value.trim();
const role = document.getElementById("staffRole").value;
const specializationInput = document.getElementById("staffSpecialization");
const specialization = specializationInput ? specializationInput.value.trim() : "";
const licenseInput = document.getElementById("staffDoctorLicense");
const licenseNumber = licenseInput ? licenseInput.value.trim() : "";

if (!name || !email || !phone || !role ||
    (role === "Doctor" && (!specialization || !licenseNumber))) {
    alert("Please fill all required staff details.");
    return;
}

const staff = getStaff();
const duplicateStaff = staff.some(function (person) {
    return person.email.toLowerCase() === email.toLowerCase();
});
const duplicateDoctor = role === "Doctor" && getDoctors().some(function (doctor) {
    return doctor.email.toLowerCase() === email.toLowerCase();
});

if (duplicateStaff || duplicateDoctor) {
    alert("A person with this email already exists in the directory.");
    return;
}

const newStaff = {
    id: generateId("STAFF"),
    name: name,
    email: email,
    phone: phone,
    role: role,
    licenseNumber: role === "Doctor" ? licenseNumber : "",
    status: "Active",
    createdAt: new Date().toLocaleDateString()
};

staff.push(newStaff);
saveStaff(staff);

if (role === "Doctor") {
    syncDoctorProfileFromStaff(newStaff, specialization, licenseNumber);
}

alert("Staff added successfully.");
document.getElementById("staffForm").reset();
updateStaffRoleFields();
loadStaff();

}

// LOAD STAFF

function loadStaff() {

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
                onclick="viewStaffDetails('${person.id}')">
                View
            </button>

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

}

function viewStaffDetails(id) {
    const person = getStaff().find(function (item) {
        return item.id === id;
    });
    const dialog = document.getElementById("staffDetailsDialog");
    const detailsList = document.getElementById("staffDetailsList");

    if (!person || !dialog || !detailsList) {
        alert("Staff details could not be loaded.");
        return;
    }

    const doctor = person.role === "Doctor"
        ? getDoctors().find(function (item) {
            return item.id === person.doctorId || item.staffId === person.id;
        })
        : null;
    const linkedUser = getUsers().find(function (user) {
        return user.profileId === person.id && user.profileType === "staff" ||
            doctor && user.profileId === doctor.id && user.profileType === "doctor" ||
            String(user.email || "").trim().toLowerCase() === String(person.email || "").trim().toLowerCase();
    });
    const detailRows = [
        ["Staff ID", person.id],
        ["Name", person.name],
        ["Email", person.email],
        ["Phone", person.phone],
        ["Role", person.role],
        ["Status", person.status],
        ["Created", person.createdAt]
    ];

    if (doctor) {
        detailRows.push(
            ["Specialization", doctor.specialization || person.specialization || "Not set"],
            ["Medical license", doctor.licenseNumber || person.licenseNumber || "Not set"],
            ["Availability", formatDoctorAvailability(doctor.availability)],
            ["Unavailable dates", formatDoctorUnavailableDates(doctor.availability)],
            ["Default appointment time", doctor.availability && doctor.availability.defaultAppointmentTime || "Not set"],
            ["Consultation fee", formatConsultationFee(doctor.consultationFee)]
        );
    }

    detailsList.textContent = "";
    detailRows.forEach(function (detail) {
        const term = document.createElement("dt");
        const value = document.createElement("dd");
        term.textContent = detail[0];
        value.textContent = detail[1] == null || detail[1] === "" ? "Not set" : String(detail[1]);
        detailsList.append(term, value);
    });

    document.getElementById("staffDetailsTitle").textContent = person.name + " — Staff details";
    if (!dialog.open) dialog.showModal();
}

function closeStaffDetails() {
    const dialog = document.getElementById("staffDetailsDialog");
    if (dialog && dialog.open) dialog.close();
}

// EDIT STAFF

function editStaff(id) {

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
        "Enter role:\nDoctor\nReceptionist\nLab Technician\nPharmacist",
        person.role
    );


if (role === null) return;

const nextRole = role.trim();
const originalDoctorId = person.doctorId;
let specialization = person.specialization || "";
let licenseNumber = person.licenseNumber || "";

if (nextRole === "Doctor") {
    specialization = prompt("Enter doctor specialization:", specialization);
    if (specialization === null || !specialization.trim()) {
        alert("Doctor specialization is required.");
        return;
    }
    specialization = specialization.trim();
    licenseNumber = prompt("Enter medical license / registration number:", licenseNumber);
    if (licenseNumber === null || !licenseNumber.trim()) {
        alert("A medical license / registration number is required.");
        return;
    }
    licenseNumber = licenseNumber.trim();
}

const duplicateStaff = staff.some(function (item) {
    return item.id !== id && item.email.toLowerCase() === email.trim().toLowerCase();
});
const duplicateDoctor = nextRole === "Doctor" && getDoctors().some(function (doctor) {
    return doctor.id !== originalDoctorId && doctor.email.toLowerCase() === email.trim().toLowerCase();
});

if (duplicateStaff || duplicateDoctor) {
    alert("A person with this email already exists in the directory.");
    return;
}


person.name =
    name.trim();

person.email =
    email.trim();

person.phone =
    phone.trim();

person.role =
    nextRole;
if (nextRole === "Doctor") {
    person.licenseNumber = licenseNumber;
}


saveStaff(staff);

if (nextRole === "Doctor") {
    syncDoctorProfileFromStaff(person, specialization, licenseNumber);
} else if (originalDoctorId || person.role === "Doctor") {
    person.doctorId = originalDoctorId;
    removeDoctorProfileForStaff(person);
    delete person.doctorId;
    delete person.specialization;
    delete person.licenseNumber;
    saveStaff(staff);
    syncLinkedAccounts("staff", person.id, {
        name: person.name,
        email: person.email,
        role: person.role,
        status: person.status
    });
} else {
    syncLinkedAccounts("staff", person.id, {
        name: person.name,
        email: person.email,
        role: person.role,
        status: person.status
    });
}


alert(
    "Staff updated successfully."
);


loadStaff();

}

// DELETE STAFF

function deleteStaff(id) {

const confirmDelete =
    confirm(
        "Are you sure you want to delete this staff member?"
    );


if (!confirmDelete) {

    return;

}

const person = getStaff().find(function (item) {
    return item.id === id;
});


deleteById(
    STORAGE_KEYS.staff,
    id
);

if (person && person.role === "Doctor") {
    removeDoctorProfileForStaff(person);
    syncLinkedAccounts("staff", person.id, { status: "Inactive" });
} else if (person) {
    syncLinkedAccounts("staff", person.id, { status: "Inactive" });
}


alert(
    "Staff deleted successfully."
);


loadStaff();

}

// TOGGLE STAFF STATUS

function toggleStaffStatus(id) {

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

if (person.role === "Doctor") {
    syncDoctorProfileFromStaff(person, person.specialization || "");
} else {
    syncLinkedAccounts("staff", person.id, {
        name: person.name,
        email: person.email,
        role: person.role,
        status: person.status
    });
}


loadStaff();

}

// SEARCH STAFF

function searchStaff() {

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

}

// DISPLAY STAFF

function displayStaff(staff) {

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
                onclick="viewStaffDetails('${person.id}')">
                View
            </button>

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

}

// ============================================================
// USER MANAGEMENT
// ============================================================

// ADD USER

function addUser() {

let name =
    document.getElementById("userName")
        .value
        .trim();

let email =
    document.getElementById("userEmail")
        .value
        .trim();

const username =
    document.getElementById("userUsername")
        .value
        .trim()
        .toLowerCase();

const password =
    document.getElementById("userPassword")
        .value;

const role =
    document.getElementById("userRole")
        .value;

let profile = null;
let profileType = null;
if (role !== "Admin") {
    const selectedProfileId = document.getElementById("userProfile").value;
    const matchingProfiles = role === "Doctor"
        ? getDoctors()
        : getStaff().filter(function (person) { return person.role === role; });
    profile = matchingProfiles.find(function (item) {
        return item.id === selectedProfileId;
    });
    if (!profile) {
        alert(role === "Doctor"
            ? "Select an existing active doctor profile before creating a Doctor account."
            : "Select an existing active " + role.toLowerCase() + " profile before creating this account.");
        return;
    }
    name = String(profile.name || "").trim();
    email = String(profile.email || "").trim();
    profileType = role === "Doctor" ? "doctor" : "staff";
}

if (!name || !email || !username || !password || !role) {
    alert("Please fill all user details.");
    return;
}

if (password.length < 8) {
    alert("The temporary password must be at least 8 characters.");
    return;
}

const users = getUsers();
const reservedUsernames = [
    "admin"
];

if (reservedUsernames.includes(username) || users.some(function (user) {
    return user.username && user.username.toLowerCase() === username;
})) {
    alert("That username is already in use. Choose another username.");
    return;
}

const emailAlreadyExists = users.some(function (user) {
    return user.email.toLowerCase() === email.toLowerCase();
});

if (emailAlreadyExists) {
    alert("A user with this email already exists.");
    return;
}

if (role !== "Admin" && !profile) {
    alert("Add this person to the matching staff or doctor directory before creating a login.");
    return;
}

if (profile && profile.status !== "Active") {
    alert("Activate this staff or doctor profile before creating a login.");
    return;
}

if (role !== "Admin") {
    const alreadyLinked = users.some(function (user) {
        return user.role === role && (
            (user.profileType === profileType && user.profileId === profile.id) ||
            (role === "Doctor" && user.profileType === "staff" && user.profileId === profile.staffId) ||
            String(user.email || "").trim().toLowerCase() === String(profile.email || "").trim().toLowerCase()
        );
    });
    if (alreadyLinked) {
        alert("This " + role.toLowerCase() + " already has a user account.");
        updateDoctorUserFields();
        return;
    }
}

const user = {
    id: generateId("USER"),
    name: profile && role !== "Admin" ? profile.name : name,
    email: profile && role !== "Admin" ? profile.email : email,
    username: username,
    password: password,
    role: role,
    profileId: profile ? profile.id : null,
    profileType: profileType,
    status: "Active",
    createdAt: new Date().toLocaleDateString()
};

users.push(user);
if (!saveUsers(users)) return;

alert("User added successfully.");
document.getElementById("userForm").reset();
updateDoctorUserFields();
loadUsers();

}

// LOAD USERS

function loadUsers() {

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

            <td colspan="7">
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

        <td>${user.username || "-"}</td>

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

}

// EDIT USER

function editUser(id) {

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


const role = prompt(
    "Enter role:\nAdmin\nDoctor\nReceptionist\nLab Technician\nPharmacist",
    user.role
);
if (role === null) return;


const username =
    prompt(
        "Enter login username:",
        user.username || ""
    );


if (username === null) return;

const newPassword = prompt("New password (leave blank to keep current):", "");
if (newPassword === null) return;

const nextName = name.trim();
const nextEmail = email.trim();
const nextUsername = username.trim().toLowerCase();
const nextRole = role.trim();
const allowedRoles = ["Admin", "Doctor", "Receptionist", "Lab Technician", "Pharmacist"];

if (!nextName || !nextEmail || !nextUsername || !allowedRoles.includes(nextRole)) {
    alert("Name, email, username, and a valid role are required.");
    return;
}

if (newPassword && newPassword.length < 8) {
    alert("The password must be at least 8 characters.");
    return;
}

const reservedUsernames = [
    "admin"
];
const usernameInUse = reservedUsernames.includes(nextUsername) || users.some(function (item) {
    return item.id !== id && item.username && item.username.toLowerCase() === nextUsername;
});
const emailInUse = users.some(function (item) {
    return item.id !== id && item.email.toLowerCase() === nextEmail.toLowerCase();
});

if (usernameInUse || emailInUse) {
    alert("That username or email is already in use.");
    return;
}

let profile = null;
let profileType = null;

if (nextRole === "Doctor") {
    profile = getDoctors().find(function (doctor) {
        return doctor.email.toLowerCase() === nextEmail.toLowerCase();
    });
    profileType = "doctor";
} else if (nextRole !== "Admin") {
    profile = getStaff().find(function (person) {
        return person.email.toLowerCase() === nextEmail.toLowerCase() && person.role === nextRole;
    });
    profileType = "staff";
}

if (nextRole !== "Admin" && !profile) {
    alert("Add this person to the matching staff or doctor directory before assigning this role.");
    return;
}

if (profile && profile.status !== "Active") {
    alert("Activate this staff or doctor profile before assigning this account.");
    return;
}


user.name = nextName;
user.email = nextEmail;
user.username = nextUsername;
if (newPassword) user.password = newPassword;
user.role = nextRole;
user.profileId = profile ? profile.id : null;
user.profileType = profileType;


saveUsers(users);

if (user.profileType === "doctor") {
    const doctors = getDoctors();
    const doctor = doctors.find(function (item) {
        return item.id === user.profileId;
    });
    if (doctor) {
        doctor.name = nextName;
        doctor.email = nextEmail;
        saveDoctors(doctors);
        syncDoctorStaffRecord(doctor);
    }
} else if (user.profileType === "staff") {
    const staff = getStaff();
    const person = staff.find(function (item) {
        return item.id === user.profileId;
    });
    if (person) {
        person.name = nextName;
        person.email = nextEmail;
        saveStaff(staff);
        if (person.role === "Doctor") {
            syncDoctorProfileFromStaff(person, person.specialization || "");
        } else {
            syncLinkedAccounts("staff", person.id, {
                name: nextName,
                email: nextEmail
            });
        }
    }
}


alert(
    "User updated successfully."
);


loadUsers();

}

// DELETE USER

function deleteUser(id) {

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

}

// TOGGLE USER STATUS

function toggleUserStatus(id) {

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

}

// SEARCH USERS

function searchUsers() {

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

            (user.username || "")
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

}

// DISPLAY USERS

function displayUsers(users) {

const tableBody =
    document.getElementById(
        "userTableBody"
    );


if (!tableBody) return;


tableBody.innerHTML = "";


if (users.length === 0) {

    tableBody.innerHTML = `

        <tr>

            <td colspan="7">
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

        <td>${user.username || "-"}</td>

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

}
