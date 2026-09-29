```javascript
// ============================================================
// CMS - PHARMACY JAVASCRIPT
// File: js/pharmacy.js
//
// Pharmacy module only.
// Medicine master source: cms_medicines
// Billing source: cms_billing
// Receipt source: cms_receipts
//
// Pharmacy can:
//   - View medicines
//   - Search medicines
//   - Dispense medicines
//   - Create pharmacy bills
//   - Process payments
//   - Print receipts
//
// Pharmacy cannot:
//   - Add medicines
//   - Edit medicines
//   - Change master prices
//   - Change reorder levels
//   - Restock medicines
// ============================================================


// ============================================================
// 1. COMMON HELPERS
// ============================================================

function getToday() {

    const now = new Date();

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}


function escapeHtml(value) {

    if (value === null || value === undefined) {
        return "";
    }

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


function showMessage(elementId, message, type = "success") {

    const element = document.getElementById(elementId);

    if (!element) {
        return;
    }

    const className =
        type === "error"
            ? "badge badge-danger"
            : "badge badge-success";

    element.innerHTML = `
        <span class="${className}">
            ${escapeHtml(message)}
        </span>
    `;
}


function getExpiryDate(medicine) {

    return medicine?.expiryDate || medicine?.expiry || "";
}


function isMedicineExpired(medicine) {

    const expiry = getExpiryDate(medicine);

    if (!expiry) {
        return false;
    }

    const today = new Date();
    const expiryDate = new Date(expiry);

    today.setHours(0, 0, 0, 0);
    expiryDate.setHours(0, 0, 0, 0);

    return expiryDate < today;
}


function isMedicineActive(medicine) {

    return String(medicine?.status || "Active").toLowerCase() === "active";
}


function isMedicineAvailable(medicine) {

    return (
        medicine &&
        isMedicineActive(medicine) &&
        Number(medicine.stock) > 0 &&
        !isMedicineExpired(medicine)
    );
}


// ============================================================
// 2. MEDICINE MASTER - SINGLE SOURCE OF TRUTH
// ============================================================

function getStoredMedicines() {

    try {

        const raw =
            localStorage.getItem("cms_medicines");

        if (!raw) {
            return [];
        }

        const parsed =
            JSON.parse(raw);

        return Array.isArray(parsed)
            ? parsed
            : [];

    } catch (error) {

        console.error(
            "Error reading cms_medicines:",
            error
        );

        return [];
    }
}


function saveStoredMedicines(data) {

    if (!Array.isArray(data)) {
        return false;
    }

    try {

        localStorage.setItem(
            "cms_medicines",
            JSON.stringify(data)
        );

        medicines = data;

        return true;

    } catch (error) {

        console.error(
            "Error saving cms_medicines:",
            error
        );

        return false;
    }
}


let medicines = getStoredMedicines();


function findMedicineById(id, source = medicines) {

    if (!id) {
        return null;
    }

    return source.find(function (medicine) {

        return String(medicine.id) === String(id);

    }) || null;
}


function findMedicineByName(name, source = medicines) {

    if (!name) {
        return null;
    }

    const cleanName =
        String(name).trim().toLowerCase();


    // Exact match
    let medicine =
        source.find(function (item) {

            return String(item.name || "")
                .trim()
                .toLowerCase() === cleanName;

        });


    if (medicine) {
        return medicine;
    }


    // Partial compatibility for existing prescriptions
    medicine =
        source.find(function (item) {

            const itemName =
                String(item.name || "")
                    .trim()
                    .toLowerCase();

            return (
                itemName.startsWith(cleanName) ||
                cleanName.startsWith(itemName) ||
                itemName.includes(cleanName)
            );

        });


    return medicine || null;
}


// ============================================================
// 3. PRESCRIPTIONS
// ============================================================

const DEFAULT_PRESCRIPTIONS = [
    {
        id: "RX-98201",
        date: getToday(),
        patientId: "PAT001",
        patientName: "Rahul Menon",
        doctorName: "Dr. Arun Kumar",
        status: "Pending Dispensation",
        medicines: [
            {
                medicine: "Paracetamol 650mg",
                dosage: "1 Tab",
                frequency: "1-0-1",
                duration: "3 Days",
                instructions: "After food",
                quantity: 6
            },
            {
                medicine: "Pantoprazole 40mg",
                dosage: "1 Tab",
                frequency: "1-0-0",
                duration: "5 Days",
                instructions: "Before food",
                quantity: 5
            }
        ]
    },

    {
        id: "RX-98202",
        date: getToday(),
        patientId: "PAT002",
        patientName: "Anu Thomas",
        doctorName: "Dr. Arun Kumar",
        status: "Dispensed",
        medicines: [
            {
                medicine: "Amoxicillin 500mg",
                dosage: "1 Cap",
                frequency: "1-0-1",
                duration: "5 Days",
                instructions: "After food",
                quantity: 10
            },
            {
                medicine: "Cetirizine 10mg",
                dosage: "1 Tab",
                frequency: "0-0-1",
                duration: "5 Days",
                instructions: "Bedtime",
                quantity: 5
            }
        ]
    },

    {
        id: "RX-98203",
        date: getToday(),
        patientId: "PAT003",
        patientName: "Arjun Kumar",
        doctorName: "Dr. Arun Kumar",
        status: "Pending Dispensation",
        medicines: [
            {
                medicine: "Amlodipine 5mg",
                dosage: "1 Tab",
                frequency: "1-0-0",
                duration: "30 Days",
                instructions: "Morning after food",
                quantity: 30
            },
            {
                medicine: "Aspirin 75mg",
                dosage: "1 Tab",
                frequency: "0-1-0",
                duration: "30 Days",
                instructions: "Lunch",
                quantity: 30
            }
        ]
    },

    {
        id: "RX-98190",
        date: "2026-02-14",
        patientId: "PAT005",
        patientName: "Suresh Babu",
        doctorName: "Dr. Arun Kumar",
        status: "Dispensed",
        medicines: [
            {
                medicine: "Metformin 500mg",
                dosage: "1 Tab",
                frequency: "1-0-1",
                duration: "30 Days",
                instructions: "With meals",
                quantity: 60
            },
            {
                medicine: "Glimepiride 1mg",
                dosage: "1 Tab",
                frequency: "1-0-0",
                duration: "30 Days",
                instructions: "Before breakfast",
                quantity: 30
            }
        ]
    }
];


function getStoredPrescriptions() {

    try {

        const raw =
            localStorage.getItem("cms_prescriptions");

        if (raw) {

            const parsed =
                JSON.parse(raw);

            if (Array.isArray(parsed)) {
                return parsed;
            }
        }

    } catch (error) {

        console.error(
            "Error reading cms_prescriptions:",
            error
        );
    }


    // Preserve existing prescription integration.
    // This does NOT create medicines in cms_medicines.
    localStorage.setItem(
        "cms_prescriptions",
        JSON.stringify(DEFAULT_PRESCRIPTIONS)
    );

    return DEFAULT_PRESCRIPTIONS.slice();
}


function saveStoredPrescriptions(data) {

    try {

        localStorage.setItem(
            "cms_prescriptions",
            JSON.stringify(data)
        );

        return true;

    } catch (error) {

        console.error(
            "Error saving prescriptions:",
            error
        );

        return false;
    }
}


// ============================================================
// 4. PRESCRIPTION QUEUE
// ============================================================

function viewPrescription(id) {

    window.location.href =
        "prescription-details.html?id=" +
        encodeURIComponent(id);
}


function loadPrescriptionQueue() {

    const tableBody =
        document.getElementById("prescriptionQueue");

    if (!tableBody) {
        return;
    }


    const prescriptions =
        getStoredPrescriptions();


    const countElement =
        document.getElementById("queueCount") ||
        document.querySelector(".table-count");


    const pendingCount =
        prescriptions.filter(function (rx) {

            return (
                rx.status === "Pending" ||
                rx.status === "Pending Dispensation"
            );

        }).length;


    if (countElement) {
        countElement.innerText = pendingCount;
    }


    if (prescriptions.length === 0) {

        tableBody.innerHTML = `
            <tr>
                <td colspan="6"
                    style="text-align:center;padding:24px;">
                    No prescriptions in queue.
                </td>
            </tr>
        `;

        return;
    }


    tableBody.innerHTML =
        prescriptions.map(function (rx) {

            const isPending =
                rx.status === "Pending" ||
                rx.status === "Pending Dispensation";


            return `
                <tr>

                    <td class="td-mono">
                        ${escapeHtml(rx.id)}
                    </td>

                    <td class="td-primary">
                        ${escapeHtml(
                            rx.patientName ||
                            rx.patientId ||
                            "—"
                        )}
                    </td>

                    <td>
                        ${escapeHtml(
                            rx.doctorName ||
                            "—"
                        )}
                    </td>

                    <td>
                        ${escapeHtml(rx.date || "—")}
                    </td>

                    <td>

                        <span class="badge ${
                            isPending
                                ? "badge-warning"
                                : "badge-success"
                        }">

                            ${
                                isPending
                                    ? "Pending"
                                    : "Dispensed"
                            }

                        </span>

                    </td>

                    <td class="td-actions">

                        <a
                            href="prescription-details.html?id=${encodeURIComponent(rx.id)}"
                            class="btn btn-primary btn-sm">

                            View

                        </a>

                    </td>

                </tr>
            `;

        }).join("");
}


// ============================================================
// 5. PRESCRIPTION DETAILS
// ============================================================

function loadPrescriptionDetails() {

    const tableBody =
        document.getElementById("rxMedicinesTable");

    if (!tableBody) {
        return;
    }


    const params =
        new URLSearchParams(
            window.location.search
        );


    const prescriptionId =
        params.get("id");


    const prescriptions =
        getStoredPrescriptions();


    let prescription = null;


    if (prescriptionId) {

        prescription =
            prescriptions.find(function (item) {

                return String(item.id).toLowerCase() ===
                       String(prescriptionId).toLowerCase();

            });

    }


    if (!prescription &&
        prescriptions.length > 0) {

        prescription =
            prescriptions[0];

    }


    if (!prescription) {

        const title =
            document.getElementById("rxTitle");

        if (title) {
            title.innerText =
                "No Prescription Found";
        }

        tableBody.innerHTML = `
            <tr>
                <td colspan="4"
                    style="text-align:center;padding:24px;">
                    Prescription not found.
                </td>
            </tr>
        `;

        return;
    }


    const isPending =
        prescription.status === "Pending" ||
        prescription.status === "Pending Dispensation";


    const title =
        document.getElementById("rxTitle");

    if (title) {
        title.innerText =
            "Prescription " +
            prescription.id;
    }


    const status =
        document.getElementById("rxStatusBadge");

    if (status) {

        status.className =
            "badge " +
            (
                isPending
                    ? "badge-warning"
                    : "badge-success"
            );

        status.innerText =
            isPending
                ? "Pending"
                : "Dispensed";
    }


    const patient =
        document.getElementById("rxPatient");

    if (patient) {

        patient.innerText =
            (prescription.patientName || "—") +
            (
                prescription.patientId
                    ? " (" +
                      prescription.patientId +
                      ")"
                    : ""
            );
    }


    const doctor =
        document.getElementById("rxDoctor");

    if (doctor) {

        doctor.innerText =
            prescription.doctorName || "—";
    }


    const date =
        document.getElementById("rxDate");

    if (date) {

        date.innerText =
            prescription.date || "—";
    }


    const rxId =
        document.getElementById("rxId");

    if (rxId) {

        rxId.innerText =
            prescription.id;
    }


    const topButton =
        document.getElementById("rxTopDispenseBtn");


    if (topButton) {

        topButton.href =
            "dispense-medicine.html?id=" +
            encodeURIComponent(
                prescription.id
            );

        topButton.style.display =
            isPending
                ? "inline-flex"
                : "none";
    }


    const prescriptionMedicines =
        prescription.medicines || [];


    if (prescriptionMedicines.length === 0) {

        tableBody.innerHTML = `
            <tr>
                <td colspan="4"
                    style="text-align:center;padding:20px;">
                    No medicines listed.
                </td>
            </tr>
        `;

    } else {

        tableBody.innerHTML =
            prescriptionMedicines.map(
                function (medicine) {

                    const name =
                        medicine.medicine ||
                        medicine.name ||
                        "—";

                    const dosage =
                        medicine.dosage ||
                        "—";

                    const duration =
                        [
                            medicine.frequency,
                            medicine.duration
                        ]
                        .filter(Boolean)
                        .join(" · ") ||
                        "—";

                    const instructions =
                        medicine.instructions ||
                        (
                            medicine.quantity
                                ? "Qty: " +
                                  medicine.quantity
                                : "—"
                        );


                    return `
                        <tr>

                            <td class="td-primary">
                                ${escapeHtml(name)}
                            </td>

                            <td>
                                ${escapeHtml(dosage)}
                            </td>

                            <td>
                                ${escapeHtml(duration)}
                            </td>

                            <td>
                                ${escapeHtml(instructions)}
                            </td>

                        </tr>
                    `;

                }
            ).join("");
    }


    const actionContainer =
        document.getElementById(
            "rxActionContainer"
        );


    if (actionContainer) {

        if (isPending) {

            actionContainer.innerHTML = `

                <button
                    class="btn btn-success"
                    onclick="dispenseCurrentPrescription('${escapeHtml(prescription.id)}')">

                    ✅ Dispense All Prescribed Medicines

                </button>

                <a
                    href="dispense-medicine.html?id=${encodeURIComponent(prescription.id)}"
                    class="btn btn-outline">

                    Manual Item Dispense

                </a>

            `;

        } else {

            actionContainer.innerHTML = `

                <div style="
                    padding:10px 16px;
                    background:var(--success-light,#e8f8f0);
                    color:var(--success,#27ae60);
                    border-radius:6px;
                    font-weight:600;
                ">

                    ✓ All prescribed medicines have been dispensed.

                </div>

            `;
        }
    }
}


// ============================================================
// 6. ATOMIC PRESCRIPTION DISPENSING
// ============================================================

function dispenseCurrentPrescription(rxId) {

    const prescriptions =
        getStoredPrescriptions();


    const prescription =
        prescriptions.find(function (rx) {

            return String(rx.id) ===
                   String(rxId);

        });


    if (!prescription) {

        alert("Prescription not found.");

        return;
    }


    if (prescription.status === "Dispensed") {

        alert(
            "This prescription is already marked as dispensed."
        );

        return;
    }


    const currentMedicines =
        getStoredMedicines();


    const requiredMap = new Map();


    // --------------------------------------------------------
    // FIRST PASS:
    // Resolve every prescribed medicine.
    // No stock is changed here.
    // --------------------------------------------------------

    for (const prescribed of
         prescription.medicines || []) {

        const medicineId =
            prescribed.medicineId ||
            prescribed.id;


        let masterMedicine = null;


        if (medicineId) {

            masterMedicine =
                findMedicineById(
                    medicineId,
                    currentMedicines
                );
        }


        if (!masterMedicine) {

            masterMedicine =
                findMedicineByName(
                    prescribed.medicine ||
                    prescribed.name,
                    currentMedicines
                );
        }


        if (!masterMedicine) {

            alert(
                "Medicine not found in Admin Medicine Master: " +
                (
                    prescribed.medicine ||
                    prescribed.name ||
                    "Unknown"
                )
            );

            return;
        }


        if (!isMedicineActive(masterMedicine)) {

            alert(
                masterMedicine.name +
                " is not Active and cannot be dispensed."
            );

            return;
        }


        if (isMedicineExpired(masterMedicine)) {

            alert(
                masterMedicine.name +
                " is expired and cannot be dispensed."
            );

            return;
        }


        const quantity =
            Number(prescribed.quantity);


        if (!Number.isInteger(quantity) ||
            quantity <= 0) {

            alert(
                "Invalid quantity for " +
                masterMedicine.name
            );

            return;
        }


        const existing =
            requiredMap.get(
                String(masterMedicine.id)
            );


        if (existing) {

            existing.quantity += quantity;

        } else {

            requiredMap.set(
                String(masterMedicine.id),
                {
                    medicine: masterMedicine,
                    quantity: quantity
                }
            );
        }
    }


    // --------------------------------------------------------
    // SECOND PASS:
    // Validate ALL stock before changing anything.
    // --------------------------------------------------------

    for (const item of requiredMap.values()) {

        const medicine =
            findMedicineById(
                item.medicine.id,
                currentMedicines
            );


        if (!medicine) {

            alert(
                "Medicine no longer exists in the master."
            );

            return;
        }


        const stock =
            Number(medicine.stock);


        if (!Number.isInteger(stock) ||
            stock < item.quantity) {

            alert(
                "Insufficient stock for " +
                medicine.name +
                ". Available: " +
                stock +
                ", Required: " +
                item.quantity
            );

            return;
        }
    }


    // --------------------------------------------------------
    // THIRD PASS:
    // All validation succeeded.
    // Now deduct stock.
    // --------------------------------------------------------

    const deductedDetails = [];


    for (const item of requiredMap.values()) {

        const medicine =
            findMedicineById(
                item.medicine.id,
                currentMedicines
            );


        medicine.stock =
            Number(medicine.stock) -
            item.quantity;


        deductedDetails.push(
            medicine.name +
            " (-" +
            item.quantity +
            ", stock left: " +
            medicine.stock +
            ")"
        );
    }


    // Save only after all validation succeeded.
    if (!saveStoredMedicines(currentMedicines)) {

        alert(
            "Unable to save stock changes."
        );

        return;
    }


    prescription.status =
        "Dispensed";


    if (!saveStoredPrescriptions(
        prescriptions
    )) {

        alert(
            "Stock was updated, but prescription status could not be saved."
        );

        return;
    }


    alert(
        "Prescription " +
        prescription.id +
        " dispensed successfully!\n\n" +
        "Stock updated:\n• " +
        deductedDetails.join("\n• ")
    );


    loadPrescriptionDetails();
    loadStock();
    loadInventory();
    updateDashboard();
    populateMedicineDropdowns();
}


// ============================================================
// 7. EXPIRY STATUS
// ============================================================

function getExpiryStatus(expiry) {

    if (!expiry) {

        return {
            text: "No Expiry",
            className: "badge-warning"
        };
    }


    const today =
        new Date();


    const expiryDate =
        new Date(expiry);


    today.setHours(0, 0, 0, 0);
    expiryDate.setHours(0, 0, 0, 0);


    if (expiryDate < today) {

        return {
            text: "Expired",
            className: "badge-danger"
        };
    }


    const difference =
        expiryDate - today;


    const days =
        Math.ceil(
            difference /
            (1000 * 60 * 60 * 24)
        );


    if (days <= 30) {

        return {
            text: "Expiring Soon",
            className: "badge-warning"
        };
    }


    return {
        text: "Valid",
        className: "badge-success"
    };
}


// ============================================================
// 8. STOCK STATUS
// ============================================================

function getStockStatus(
    stock,
    reorderLevel = 0
) {

    stock =
        Number(stock || 0);

    reorderLevel =
        Number(reorderLevel || 0);


    if (stock === 0) {

        return {
            text: "Out of Stock",
            className: "badge-danger"
        };
    }


    if (stock <= reorderLevel) {

        return {
            text: "Low Stock",
            className: "badge-warning"
        };
    }


    return {
        text: "Available",
        className: "badge-success"
    };
}


// ============================================================
// 9. MEDICINE INVENTORY
// ============================================================

function loadInventory() {

    const table =
        document.getElementById(
            "inventoryTable"
        );


    if (!table) {
        return;
    }


    const currentMedicines =
        getStoredMedicines();


    medicines =
        currentMedicines;


    table.innerHTML = "";


    if (currentMedicines.length === 0) {

        table.innerHTML = `

            <tr>

                <td colspan="10"
                    style="text-align:center;padding:24px;">

                    No medicines found in Admin Medicine Master.

                </td>

            </tr>

        `;

        return;
    }


    currentMedicines.forEach(
        function (medicine) {

            const stockStatus =
                getStockStatus(
                    medicine.stock,
                    medicine.reorderLevel
                );


            const expiryStatus =
                getExpiryStatus(
                    getExpiryDate(medicine)
                );


            const masterStatus =
                medicine.status ||
                "Active";


            table.innerHTML += `

                <tr>

                    <td class="td-mono">
                        ${escapeHtml(medicine.id)}
                    </td>

                    <td class="td-primary">
                        ${escapeHtml(medicine.name)}
                    </td>

                    <td>
                        ${escapeHtml(
                            medicine.category || "-"
                        )}
                    </td>

                    <td>
                        ${escapeHtml(
                            medicine.unit || "-"
                        )}
                    </td>

                    <td>
                        ₹${Number(
                            medicine.price || 0
                        ).toFixed(2)}
                    </td>

                    <td>
                        ${Number(
                            medicine.stock || 0
                        )}
                    </td>

                    <td>
                        ${Number(
                            medicine.reorderLevel || 0
                        )}
                    </td>

                    <td>
                        ${escapeHtml(
                            medicine.batchNo || "-"
                        )}
                    </td>

                    <td>
                        ${escapeHtml(
                            getExpiryDate(medicine) ||
                            "-"
                        )}
                    </td>

                    <td>

                        <span class="badge ${
                            String(masterStatus).toLowerCase() === "active"
                                ? "badge-success"
                                : "badge-danger"
                        }">

                            ${escapeHtml(masterStatus)}

                        </span>

                        <br>

                        <span class="badge ${
                            expiryStatus.className
                        }">

                            ${expiryStatus.text}

                        </span>

                        <br>

                        <span class="badge ${
                            stockStatus.className
                        }">

                            ${stockStatus.text}

                        </span>

                    </td>

                </tr>

            `;

        }
    );
}


// ============================================================
// 10. STOCK PAGE
// ============================================================

function loadStock() {

    const table =
        document.getElementById(
            "stockTable"
        );


    if (!table) {
        return;
    }


    const currentMedicines =
        getStoredMedicines();


    medicines =
        currentMedicines;


    table.innerHTML = "";


    if (currentMedicines.length === 0) {

        table.innerHTML = `

            <tr>

                <td colspan="8"
                    style="text-align:center;padding:24px;">

                    No stock records found.

                </td>

            </tr>

        `;

        return;
    }


    currentMedicines.forEach(
        function (medicine) {

            const stockStatus =
                getStockStatus(
                    medicine.stock,
                    medicine.reorderLevel
                );


            const expiryStatus =
                getExpiryStatus(
                    getExpiryDate(medicine)
                );


            table.innerHTML += `

                <tr>

                    <td class="td-mono">
                        ${escapeHtml(medicine.id)}
                    </td>

                    <td class="td-primary">
                        ${escapeHtml(medicine.name)}
                    </td>

                    <td>
                        ${Number(
                            medicine.stock || 0
                        )}
                    </td>

                    <td>
                        ${Number(
                            medicine.reorderLevel || 0
                        )}
                    </td>

                    <td>
                        ${escapeHtml(
                            medicine.unit || "-"
                        )}
                    </td>

                    <td>
                        ${escapeHtml(
                            medicine.batchNo || "-"
                        )}
                    </td>

                    <td>
                        ${escapeHtml(
                            getExpiryDate(medicine) ||
                            "-"
                        )}
                    </td>

                    <td>

                        <span class="badge ${
                            stockStatus.className
                        }">

                            ${stockStatus.text}

                        </span>

                        <br>

                        <span class="badge ${
                            expiryStatus.className
                        }">

                            ${expiryStatus.text}

                        </span>

                    </td>

                </tr>

            `;

        }
    );
}


// ============================================================
// 11. PHARMACY DISPENSING
// ============================================================

function dispenseMedicine() {

    const prescriptionInput =
        document.getElementById(
            "prescriptionId"
        );


    const medicineInput =
        document.getElementById(
            "medicine"
        );


    const quantityInput =
        document.getElementById(
            "quantity"
        );


    const prescriptionId =
        prescriptionInput
            ? prescriptionInput.value.trim()
            : "";


    const medicineId =
        medicineInput
            ? medicineInput.value
            : "";


    const quantity =
        Number(
            quantityInput
                ? quantityInput.value
                : 0
        );


    if (!medicineId) {

        showMessage(
            "dispenseMessage",
            "Please select a medicine.",
            "error"
        );

        return;
    }


    if (
        !Number.isInteger(quantity) ||
        quantity <= 0
    ) {

        showMessage(
            "dispenseMessage",
            "Quantity must be a whole number greater than zero.",
            "error"
        );

        return;
    }


    const currentMedicines =
        getStoredMedicines();


    const medicine =
        findMedicineById(
            medicineId,
            currentMedicines
        );


    if (!medicine) {

        showMessage(
            "dispenseMessage",
            "Medicine was not found in the Admin Medicine Master.",
            "error"
        );

        return;
    }


    if (!isMedicineActive(medicine)) {

        showMessage(
            "dispenseMessage",
            "This medicine is not Active.",
            "error"
        );

        return;
    }


    if (isMedicineExpired(medicine)) {

        showMessage(
            "dispenseMessage",
            "Expired medicines cannot be dispensed.",
            "error"
        );

        return;
    }


    const stock =
        Number(medicine.stock || 0);


    if (stock === 0) {

        showMessage(
            "dispenseMessage",
            "This medicine is out of stock.",
            "error"
        );

        return;
    }


    if (quantity > stock) {

        showMessage(
            "dispenseMessage",
            "Insufficient stock. Available: " +
            stock,
            "error"
        );

        return;
    }


    // Fresh read before deduction.
    const freshMedicines =
        getStoredMedicines();


    const freshMedicine =
        findMedicineById(
            medicine.id,
            freshMedicines
        );


    if (!freshMedicine ||
        Number(freshMedicine.stock) < quantity) {

        showMessage(
            "dispenseMessage",
            "Stock changed. Please refresh and try again.",
            "error"
        );

        return;
    }


    freshMedicine.stock =
        Number(freshMedicine.stock) -
        quantity;


    if (!saveStoredMedicines(
        freshMedicines
    )) {

        showMessage(
            "dispenseMessage",
            "Unable to save stock changes.",
            "error"
        );

        return;
    }


    // Update prescription only after stock validation/deduction.
    let prescriptionUpdated = false;


    if (prescriptionId) {

        const prescriptions =
            getStoredPrescriptions();


        const prescription =
            prescriptions.find(
                function (rx) {

                    return String(rx.id)
                        .toLowerCase() ===
                        prescriptionId
                            .toLowerCase();

                }
            );


        if (prescription) {

            prescription.status =
                "Dispensed";


            saveStoredPrescriptions(
                prescriptions
            );


            prescriptionUpdated =
                true;
        }
    }


    const message =
        document.getElementById(
            "dispenseMessage"
        );


    if (message) {

        message.innerHTML = `

            <span class="badge badge-success">
                Medicine dispensed successfully.
            </span>

            <br><br>

            Medicine:
            <strong>
                ${escapeHtml(freshMedicine.name)}
            </strong>

            <br>

            Quantity:
            <strong>
                ${quantity}
            </strong>

            <br>

            Remaining Stock:
            <strong>
                ${freshMedicine.stock}
            </strong>

            ${
                prescriptionUpdated
                    ? `
                        <br>

                        Prescription
                        <strong>
                            ${escapeHtml(prescriptionId)}
                        </strong>

                        updated to
                        <strong>Dispensed</strong>.
                    `
                    : ""
            }

        `;
    }


    loadInventory();
    loadStock();
    updateDashboard();
    populateMedicineDropdowns();
}


// ============================================================
// 12. MEDICINE DROPDOWNS
// ============================================================

function populateMedicineDropdowns() {

    const currentMedicines =
        getStoredMedicines();


    medicines =
        currentMedicines;


    // --------------------------------------------------------
    // DISPENSE MEDICINE
    // --------------------------------------------------------

    const medicineSelect =
        document.getElementById(
            "medicine"
        );


    if (medicineSelect) {

        const currentValue =
            medicineSelect.value;


        medicineSelect.innerHTML =
            `<option value="">
                Select Medicine
            </option>`;


        currentMedicines
            .filter(function (medicine) {

                return isMedicineAvailable(
                    medicine
                );

            })
            .forEach(function (medicine) {

                medicineSelect.innerHTML += `

                    <option value="${escapeHtml(medicine.id)}">

                        ${escapeHtml(medicine.name)}

                        -
                        Stock:
                        ${Number(medicine.stock)}

                    </option>

                `;

            });


        if (
            currentValue &&
            currentMedicines.some(
                function (medicine) {

                    return String(medicine.id) ===
                           String(currentValue) &&
                           isMedicineAvailable(
                               medicine
                           );

                }
            )
        ) {

            medicineSelect.value =
                currentValue;
        }
    }


    // --------------------------------------------------------
    // BILLING MEDICINE
    // --------------------------------------------------------

    const billSelect =
        document.getElementById(
            "billMedicine"
        );


    if (billSelect) {

        const currentValue =
            billSelect.value;


        billSelect.innerHTML =
            `<option value="">
                Select Medicine
            </option>`;


        currentMedicines
            .filter(function (medicine) {

                return isMedicineAvailable(
                    medicine
                );

            })
            .forEach(function (medicine) {

                billSelect.innerHTML += `

                    <option value="${escapeHtml(medicine.id)}">

                        ${escapeHtml(medicine.name)}

                        -
                        ₹${Number(
                            medicine.price || 0
                        ).toFixed(2)}

                    </option>

                `;

            });


        if (
            currentValue &&
            currentMedicines.some(
                function (medicine) {

                    return String(medicine.id) ===
                           String(currentValue) &&
                           isMedicineAvailable(
                               medicine
                           );

                }
            )
        ) {

            billSelect.value =
                currentValue;
        }
    }


    updateBillingMedicineDetails();
}


// ============================================================
// 13. BILLING CART
// ============================================================

let pharmacyCart = [];


function getBillingMedicine() {

    const select =
        document.getElementById(
            "billMedicine"
        );


    if (!select ||
        !select.value) {

        return null;
    }


    const currentMedicines =
        getStoredMedicines();


    return findMedicineById(
        select.value,
        currentMedicines
    );
}


function updateBillingMedicineDetails() {

    const medicine =
        getBillingMedicine();


    const priceField =
        document.getElementById(
            "billPrice"
        );


    const stockField =
        document.getElementById(
            "billStock"
        );


    const reorderField =
        document.getElementById(
            "billReorderLevel"
        );


    if (!medicine) {

        if (priceField) {
            priceField.value = "₹0.00";
        }

        if (stockField) {
            stockField.innerText = "0";
        }

        if (reorderField) {
            reorderField.innerText = "0";
        }

        calculateBill();

        return;
    }


    if (priceField) {

        priceField.value =
            "₹" +
            Number(
                medicine.price || 0
            ).toFixed(2);
    }


    if (stockField) {

        stockField.innerText =
            Number(
                medicine.stock || 0
            );
    }


    if (reorderField) {

        reorderField.innerText =
            Number(
                medicine.reorderLevel || 0
            );
    }


    calculateBill();
}


function calculateBill() {

    const select =
        document.getElementById(
            "billMedicine"
        );


    const quantityInput =
        document.getElementById(
            "billQuantity"
        );


    const totalElement =
        document.getElementById(
            "total"
        );


    if (!totalElement) {
        return;
    }


    const medicine =
        select && select.value
            ? findMedicineById(
                select.value,
                getStoredMedicines()
              )
            : null;


    const quantity =
        Number(
            quantityInput
                ? quantityInput.value
                : 0
        );


    if (!medicine ||
        !Number.isFinite(quantity) ||
        quantity <= 0) {

        totalElement.innerText =
            pharmacyCart
                .reduce(
                    function (sum, item) {

                        return sum +
                            item.quantity *
                            item.price;

                    },
                    0
                )
                .toFixed(2);

        return;
    }


    const selectedTotal =
        Number(medicine.price || 0) *
        quantity;


    const cartTotal =
        pharmacyCart
            .reduce(
                function (sum, item) {

                    return sum +
                        item.quantity *
                        item.price;

                },
                0
            );


    totalElement.innerText =
        (
            cartTotal +
            selectedTotal
        ).toFixed(2);
}


// ------------------------------------------------------------
// ADD MEDICINE TO BILL
// ------------------------------------------------------------

function addMedicineToBill() {

    const medicine =
        getBillingMedicine();


    const quantityInput =
        document.getElementById(
            "billQuantity"
        );


    const quantity =
        Number(
            quantityInput
                ? quantityInput.value
                : 0
        );


    if (!medicine) {

        showMessage(
            "billMessage",
            "Please select a medicine.",
            "error"
        );

        return;
    }


    if (!isMedicineActive(medicine)) {

        showMessage(
            "billMessage",
            "This medicine is not Active.",
            "error"
        );

        return;
    }


    if (isMedicineExpired(medicine)) {

        showMessage(
            "billMessage",
            "Expired medicines cannot be billed.",
            "error"
        );

        return;
    }


    if (
        !Number.isInteger(quantity) ||
        quantity <= 0
    ) {

        showMessage(
            "billMessage",
            "Quantity must be a whole number greater than zero.",
            "error"
        );

        return;
    }


    const currentMedicines =
        getStoredMedicines();


    const freshMedicine =
        findMedicineById(
            medicine.id,
            currentMedicines
        );


    if (!freshMedicine) {

        showMessage(
            "billMessage",
            "Medicine no longer exists in the master.",
            "error"
        );

        return;
    }


    const existing =
        pharmacyCart.find(
            function (item) {

                return String(item.medicineId) ===
                       String(freshMedicine.id);

            }
        );


    const existingQuantity =
        existing
            ? existing.quantity
            : 0;


    const requestedTotal =
        existingQuantity +
        quantity;


    if (
        requestedTotal >
        Number(freshMedicine.stock || 0)
    ) {

        showMessage(
            "billMessage",
            "Insufficient stock. Available: " +
            Number(freshMedicine.stock || 0),
            "error"
        );

        return;
    }


    if (existing) {

        existing.quantity =
            requestedTotal;

        existing.price =
            Number(freshMedicine.price || 0);

    } else {

        pharmacyCart.push({

            medicineId:
                freshMedicine.id,

            name:
                freshMedicine.name,

            category:
                freshMedicine.category || "",

            unit:
                freshMedicine.unit || "",

            price:
                Number(
                    freshMedicine.price || 0
                ),

            quantity:
                quantity

        });
    }


    renderPharmacyCart();


    if (quantityInput) {

        quantityInput.value =
            "1";
    }


    showMessage(
        "billMessage",
        "Medicine added to bill."
    );
}


// ------------------------------------------------------------
// REMOVE MEDICINE FROM BILL
// ------------------------------------------------------------

function removeMedicineFromBill(
    medicineId
) {

    pharmacyCart =
        pharmacyCart.filter(
            function (item) {

                return String(
                    item.medicineId
                ) !== String(medicineId);

            }
        );


    renderPharmacyCart();
}


// ------------------------------------------------------------
// RENDER BILL CART
// ------------------------------------------------------------

function renderPharmacyCart() {

    const tableBody =
        document.getElementById(
            "billingCart"
        );


    if (!tableBody) {

        calculateBill();

        return;
    }


    tableBody.innerHTML = "";


    if (pharmacyCart.length === 0) {

        tableBody.innerHTML = `

            <tr>

                <td colspan="5"
                    style="text-align:center;">

                    No medicines added

                </td>

            </tr>

        `;


        const total =
            document.getElementById(
                "total"
            );


        if (total) {
            total.innerText =
                "0.00";
        }


        return;
    }


    let grandTotal = 0;


    pharmacyCart.forEach(
        function (item) {

            const lineTotal =
                item.price *
                item.quantity;


            grandTotal +=
                lineTotal;


            tableBody.innerHTML += `

                <tr>

                    <td>
                        ${escapeHtml(item.name)}
                    </td>

                    <td>
                        ${item.quantity}
                    </td>

                    <td>
                        ₹${item.price.toFixed(2)}
                    </td>

                    <td>
                        ₹${lineTotal.toFixed(2)}
                    </td>

                    <td>

                        <button
                            type="button"
                            class="btn btn-danger btn-sm"
                            onclick="removeMedicineFromBill('${escapeHtml(item.medicineId)}')">

                            Remove

                        </button>

                    </td>

                </tr>

            `;

        }
    );


    const total =
        document.getElementById(
            "total"
        );


    if (total) {

        total.innerText =
            grandTotal.toFixed(2);
    }
}


// ============================================================
// 14. BILL STORAGE
// ============================================================

function getStoredBills() {

    try {

        const raw =
            localStorage.getItem(
                "cms_billing"
            );


        if (!raw) {
            return [];
        }


        const parsed =
            JSON.parse(raw);


        return Array.isArray(parsed)
            ? parsed
            : [];

    } catch (error) {

        console.error(
            "Error reading cms_billing:",
            error
        );

        return [];
    }
}


function saveStoredBills(bills) {

    try {

        localStorage.setItem(
            "cms_billing",
            JSON.stringify(bills)
        );

        return true;

    } catch (error) {

        console.error(
            "Error saving cms_billing:",
            error
        );

        return false;
    }
}


function generateBillId() {

    const bills =
        getStoredBills();


    const timestamp =
        Date.now();


    return (
        "PHB-" +
        timestamp +
        "-" +
        String(
            bills.length + 1
        ).padStart(3, "0")
    );
}


function getCartTotal() {

    return pharmacyCart.reduce(
        function (sum, item) {

            return sum +
                (
                    Number(item.price) *
                    Number(item.quantity)
                );

        },
        0
    );
}


// ============================================================
// 15. GENERATE PHARMACY BILL
// ============================================================

function generateBill() {

    const patientNameInput =
        document.getElementById(
            "patientName"
        );


    const patientIdInput =
        document.getElementById(
            "patientId"
        );


    const patientName =
        patientNameInput
            ? patientNameInput.value.trim()
            : "";


    const patientId =
        patientIdInput
            ? patientIdInput.value.trim()
            : "";


    if (!patientName) {

        showMessage(
            "billMessage",
            "Please enter patient name.",
            "error"
        );

        return;
    }


    if (pharmacyCart.length === 0) {

        showMessage(
            "billMessage",
            "Please add at least one medicine.",
            "error"
        );

        return;
    }


    // --------------------------------------------------------
    // FRESH MASTER READ
    // --------------------------------------------------------

    const currentMedicines =
        getStoredMedicines();


    const validationItems = [];


    // --------------------------------------------------------
    // VALIDATE EVERY CART ITEM FIRST.
    // NO STOCK IS CHANGED DURING THIS PASS.
    // --------------------------------------------------------

    for (const cartItem of pharmacyCart) {

        const medicine =
            findMedicineById(
                cartItem.medicineId,
                currentMedicines
            );


        if (!medicine) {

            showMessage(
                "billMessage",
                "Medicine no longer exists: " +
                cartItem.name,
                "error"
            );

            return;
        }


        if (!isMedicineActive(medicine)) {

            showMessage(
                "billMessage",
                medicine.name +
                " is not Active.",
                "error"
            );

            return;
        }


        if (isMedicineExpired(medicine)) {

            showMessage(
                "billMessage",
                medicine.name +
                " is expired.",
                "error"
            );

            return;
        }


        const quantity =
            Number(cartItem.quantity);


        if (
            !Number.isInteger(quantity) ||
            quantity <= 0
        ) {

            showMessage(
                "billMessage",
                "Invalid quantity for " +
                medicine.name,
                "error"
            );

            return;
        }


        const stock =
            Number(medicine.stock || 0);


        if (quantity > stock) {

            showMessage(
                "billMessage",
                "Insufficient stock for " +
                medicine.name +
                ". Available: " +
                stock +
                ", Required: " +
                quantity,
                "error"
            );

            return;
        }


        validationItems.push({

            medicine:
                medicine,

            quantity:
                quantity,

            price:
                Number(medicine.price || 0),

            lineTotal:
                Number(medicine.price || 0) *
                quantity

        });
    }


    // --------------------------------------------------------
    // ALL ITEMS VALIDATED.
    // NOW DEDUCT STOCK.
    // --------------------------------------------------------

    for (const item of validationItems) {

        item.medicine.stock =
            Number(item.medicine.stock) -
            item.quantity;
    }


    // --------------------------------------------------------
    // SAVE STOCK FIRST.
    // --------------------------------------------------------

    if (!saveStoredMedicines(
        currentMedicines
    )) {

        showMessage(
            "billMessage",
            "Unable to update medicine stock.",
            "error"
        );

        return;
    }


    // --------------------------------------------------------
    // CREATE BILL.
    // --------------------------------------------------------

    const totalAmount =
        validationItems.reduce(
            function (sum, item) {

                return sum +
                    item.lineTotal;

            },
            0
        );


    const bill = {

        id:
            generateBillId(),

        type:
            "Pharmacy",

        patientId:
            patientId,

        patient:
            patientName,

        patientName:
            patientName,

        amount:
            Number(totalAmount.toFixed(2)),

        status:
            "Unpaid",

        method:
            "",

        reference:
            "",

        date:
            getToday(),

        createdAt:
            new Date().toISOString(),

        items:
            validationItems.map(
                function (item) {

                    return {

                        medicineId:
                            item.medicine.id,

                        medicine:
                            item.medicine.name,

                        category:
                            item.medicine.category || "",

                        unit:
                            item.medicine.unit || "",

                        quantity:
                            item.quantity,

                        price:
                            item.price,

                        total:
                            item.lineTotal

                    };

                }
            )
    };


    const bills =
        getStoredBills();


    bills.push(bill);


    if (!saveStoredBills(bills)) {

        showMessage(
            "billMessage",
            "Unable to save bill.",
            "error"
        );

        return;
    }


    // Save latest bill ID for payment / print.
    sessionStorage.setItem(
        "cms_last_pharmacy_bill",
        bill.id
    );


    // Clear cart after successful bill.
    pharmacyCart = [];


    renderPharmacyCart();
    loadInventory();
    loadStock();
    updateDashboard();
    populateMedicineDropdowns();


    showMessage(
        "billMessage",
        "Pharmacy bill " +
        bill.id +
        " generated successfully. Status: Unpaid."
    );


    // Display generated bill.
    displayPharmacyBill(bill);
}


// ============================================================
// 16. DISPLAY BILL
// ============================================================

function displayPharmacyBill(bill) {

    const receipt =
        document.getElementById(
            "pharmacyBillReceipt"
        );


    if (!receipt) {
        return;
    }


    const itemRows =
        (bill.items || [])
            .map(function (item) {

                return `

                    <tr>

                        <td>
                            ${escapeHtml(
                                item.medicine
                            )}
                        </td>

                        <td>
                            ${item.quantity}
                        </td>

                        <td>
                            ₹${Number(
                                item.price
                            ).toFixed(2)}
                        </td>

                        <td>
                            ₹${Number(
                                item.total
                            ).toFixed(2)}
                        </td>

                    </tr>

                `;

            })
            .join("");


    receipt.style.display =
        "block";


    receipt.innerHTML = `

        <div
            id="printablePharmacyBill"
            style="
                padding:20px;
                max-width:800px;
                margin:20px auto;
                background:#fff;
            "
        >

            <h2>
                Clinic Management
            </h2>

            <h3>
                Pharmacy Bill
            </h3>

            <p>
                <strong>Bill ID:</strong>
                ${escapeHtml(bill.id)}
            </p>

            <p>
                <strong>Date:</strong>
                ${escapeHtml(bill.date)}
            </p>

            <p>
                <strong>Patient:</strong>
                ${escapeHtml(
                    bill.patientName ||
                    bill.patient ||
                    "—"
                )}
            </p>

            ${
                bill.patientId
                    ? `
                        <p>
                            <strong>Patient ID:</strong>
                            ${escapeHtml(
                                bill.patientId
                            )}
                        </p>
                    `
                    : ""
            }

            <hr>

            <table
                style="
                    width:100%;
                    border-collapse:collapse;
                "
            >

                <thead>

                    <tr>

                        <th style="text-align:left;">
                            Medicine
                        </th>

                        <th>
                            Quantity
                        </th>

                        <th>
                            Price
                        </th>

                        <th>
                            Total
                        </th>

                    </tr>

                </thead>

                <tbody>

                    ${itemRows}

                </tbody>

            </table>

            <hr>

            <h3>
                Total:
                ₹${Number(
                    bill.amount
                ).toFixed(2)}
            </h3>

            <p>
                <strong>Status:</strong>
                ${escapeHtml(
                    bill.status
                )}
            </p>

            ${
                bill.status === "Paid"
                    ? `
                        <p>
                            <strong>Payment Method:</strong>
                            ${escapeHtml(
                                bill.method
                            )}
                        </p>

                        ${
                            bill.reference
                                ? `
                                    <p>
                                        <strong>Reference:</strong>
                                        ${escapeHtml(
                                            bill.reference
                                        )}
                                    </p>
                                `
                                : ""
                        }
                    `
                    : ""
            }

        </div>

    `;
}


// ============================================================
// 17. PAYMENT
// ============================================================

function processPharmacyPayment() {

    const methodInput =
        document.getElementById(
            "paymentMethod"
        );


    const referenceInput =
        document.getElementById(
            "paymentReference"
        );


    const method =
        methodInput
            ? methodInput.value
            : "";


    const reference =
        referenceInput
            ? referenceInput.value.trim()
            : "";


    if (!method) {

        showMessage(
            "paymentMessage",
            "Please select a payment method.",
            "error"
        );

        return;
    }


    if (
        (
            method === "UPI" ||
            method === "Card"
        ) &&
        !reference
    ) {

        showMessage(
            "paymentMessage",
            "Payment reference is required for UPI/Card.",
            "error"
        );

        return;
    }


    const bills =
        getStoredBills();


    const lastBillId =
        sessionStorage.getItem(
            "cms_last_pharmacy_bill"
        );


    let bill = null;


    if (lastBillId) {

        bill =
            bills.find(function (item) {

                return String(item.id) ===
                       String(lastBillId);

            });
    }


    // Fallback: latest unpaid pharmacy bill.
    if (!bill) {

        for (
            let index = bills.length - 1;
            index >= 0;
            index--
        ) {

            if (
                bills[index].type === "Pharmacy" &&
                bills[index].status === "Unpaid"
            ) {

                bill =
                    bills[index];

                break;
            }
        }
    }


    if (!bill) {

        showMessage(
            "paymentMessage",
            "No unpaid pharmacy bill found.",
            "error"
        );

        return;
    }


    if (bill.status === "Paid") {

        showMessage(
            "paymentMessage",
            "This bill is already paid.",
            "error"
        );

        return;
    }


    bill.status =
        "Paid";

    bill.method =
        method;

    bill.reference =
        reference;


    if (!saveStoredBills(bills)) {

        showMessage(
            "paymentMessage",
            "Unable to save payment.",
            "error"
        );

        return;
    }


    createPharmacyReceipt(
        bill
    );


    displayPharmacyBill(
        bill
    );


    showMessage(
        "paymentMessage",
        "Payment processed successfully."
    );
}


// ============================================================
// 18. RECEIPTS
// ============================================================

function getStoredReceipts() {

    try {

        const raw =
            localStorage.getItem(
                "cms_receipts"
            );


        if (!raw) {
            return [];
        }


        const parsed =
            JSON.parse(raw);


        return Array.isArray(parsed)
            ? parsed
            : [];

    } catch (error) {

        console.error(
            "Error reading cms_receipts:",
            error
        );

        return [];
    }
}


function saveStoredReceipts(
    receipts
) {

    try {

        localStorage.setItem(
            "cms_receipts",
            JSON.stringify(receipts)
        );

        return true;

    } catch (error) {

        console.error(
            "Error saving receipts:",
            error
        );

        return false;
    }
}


function createPharmacyReceipt(
    bill
) {

    const receipts =
        getStoredReceipts();


    const existing =
        receipts.find(
            function (receipt) {

                return String(
                    receipt.billId
                ) === String(
                    bill.id
                );

            }
        );


    if (existing) {

        existing.status =
            bill.status;

        existing.method =
            bill.method;

        existing.reference =
            bill.reference;

    } else {

        receipts.push({

            id:
                "RCT-" +
                Date.now(),

            billId:
                bill.id,

            type:
                "Pharmacy",

            patientId:
                bill.patientId || "",

            patientName:
                bill.patientName ||
                bill.patient ||
                "",

            amount:
                bill.amount,

            method:
                bill.method,

            reference:
                bill.reference,

            date:
                getToday(),

            items:
                bill.items || []

        });
    }


    saveStoredReceipts(
        receipts
    );
}


// ============================================================
// 19. PRINT PHARMACY BILL
// ============================================================

function printPharmacyBill() {

    const lastBillId =
        sessionStorage.getItem(
            "cms_last_pharmacy_bill"
        );


    const bills =
        getStoredBills();


    let bill = null;


    if (lastBillId) {

        bill =
            bills.find(function (item) {

                return String(item.id) ===
                       String(lastBillId);

            });
    }


    if (!bill) {

        for (
            let index = bills.length - 1;
            index >= 0;
            index--
        ) {

            if (
                bills[index].type ===
                "Pharmacy"
            ) {

                bill =
                    bills[index];

                break;
            }
        }
    }


    if (!bill) {

        alert(
            "No pharmacy bill available to print."
        );

        return;
    }


    const itemRows =
        (bill.items || [])
            .map(function (item) {

                return `

                    <tr>

                        <td>
                            ${escapeHtml(
                                item.medicine
                            )}
                        </td>

                        <td>
                            ${item.quantity}
                        </td>

                        <td>
                            ₹${Number(
                                item.price
                            ).toFixed(2)}
                        </td>

                        <td>
                            ₹${Number(
                                item.total
                            ).toFixed(2)}
                        </td>

                    </tr>

                `;

            })
            .join("");


    const printWindow =
        window.open(
            "",
            "_blank",
            "width=900,height=700"
        );


    if (!printWindow) {

        alert(
            "Please allow pop-ups to print the bill."
        );

        return;
    }


    printWindow.document.write(`

        <!DOCTYPE html>

        <html>

        <head>

            <title>
                Pharmacy Bill - ${escapeHtml(bill.id)}
            </title>

            <style>

                body {
                    font-family: Arial, sans-serif;
                    padding: 30px;
                    color: #222;
                }

                .receipt {
                    max-width: 800px;
                    margin: auto;
                }

                h1,
                h2,
                h3 {
                    text-align: center;
                }

                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-top: 20px;
                }

                th,
                td {
                    border: 1px solid #ccc;
                    padding: 10px;
                    text-align: left;
                }

                th {
                    background: #f3f3f3;
                }

                .total {
                    text-align: right;
                    font-size: 20px;
                    font-weight: bold;
                    margin-top: 20px;
                }

                .status {
                    margin-top: 15px;
                    font-weight: bold;
                }

                @media print {

                    body {
                        padding: 10px;
                    }

                }

            </style>

        </head>

        <body>

            <div class="receipt">

                <h1>
                    Clinic Management
                </h1>

                <h2>
                    Pharmacy Bill
                </h2>

                <p>
                    <strong>Bill ID:</strong>
                    ${escapeHtml(bill.id)}
                </p>

                <p>
                    <strong>Date:</strong>
                    ${escapeHtml(bill.date)}
                </p>

                <p>
                    <strong>Patient:</strong>
                    ${escapeHtml(
                        bill.patientName ||
                        bill.patient ||
                        "—"
                    )}
                </p>

                ${
                    bill.patientId
                        ? `
                            <p>
                                <strong>Patient ID:</strong>
                                ${escapeHtml(
                                    bill.patientId
                                )}
                            </p>
                        `
                        : ""
                }

                <table>

                    <thead>

                        <tr>

                            <th>
                                Medicine
                            </th>

                            <th>
                                Quantity
                            </th>

                            <th>
                                Unit Price
                            </th>

                            <th>
                                Total
                            </th>

                        </tr>

                    </thead>

                    <tbody>

                        ${itemRows}

                    </tbody>

                </table>


                <div class="total">

                    Total:
                    ₹${Number(
                        bill.amount
                    ).toFixed(2)}

                </div>


                <div class="status">

                    Status:
                    ${escapeHtml(
                        bill.status
                    )}

                </div>


                ${
                    bill.status === "Paid"
                        ? `
                            <p>
                                <strong>
                                    Payment Method:
                                </strong>

                                ${escapeHtml(
                                    bill.method
                                )}
                            </p>

                            ${
                                bill.reference
                                    ? `
                                        <p>
                                            <strong>
                                                Reference:
                                            </strong>

                                            ${escapeHtml(
                                                bill.reference
                                            )}
                                        </p>
                                    `
                                    : ""
                            }
                        `
                        : ""
                }

            </div>

        </body>

        </html>

    `);


    printWindow.document.close();


    printWindow.focus();


    setTimeout(function () {

        printWindow.print();

        printWindow.close();

    }, 300);
}


// ============================================================
// 20. DASHBOARD
// ============================================================

function updateDashboard() {

    const currentMedicines =
        getStoredMedicines();


    medicines =
        currentMedicines;


    const pendingElement =
        document.getElementById(
            "pendingPrescriptions"
        );


    const medicineCountElement =
        document.getElementById(
            "medicineCount"
        );


    const lowStockElement =
        document.getElementById(
            "lowStock"
        );


    if (medicineCountElement) {

        medicineCountElement.innerText =
            currentMedicines.length;
    }


    if (lowStockElement) {

        lowStockElement.innerText =
            currentMedicines.filter(
                function (medicine) {

                    return (
                        Number(medicine.stock || 0) <=
                        Number(
                            medicine.reorderLevel || 0
                        )
                    );

                }
            ).length;
    }


    if (pendingElement) {

        const prescriptions =
            getStoredPrescriptions();


        const pendingCount =
            prescriptions.filter(
                function (rx) {

                    return (
                        rx.status === "Pending" ||
                        rx.status ===
                        "Pending Dispensation"
                    );

                }
            ).length;


        pendingElement.innerText =
            pendingCount;
    }
}


// ============================================================
// 21. INITIALIZATION
// ============================================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        medicines =
            getStoredMedicines();


        loadInventory();

        loadStock();

        loadPrescriptionQueue();

        loadPrescriptionDetails();

        populateMedicineDropdowns();

        updateDashboard();

        renderPharmacyCart();


        // ----------------------------------------------------
        // Prescription ID passed to dispense page
        // ----------------------------------------------------

        const params =
            new URLSearchParams(
                window.location.search
            );


        const prescriptionId =
            params.get("id");


        const prescriptionInput =
            document.getElementById(
                "prescriptionId"
            );


        if (
            prescriptionId &&
            prescriptionInput
        ) {

            prescriptionInput.value =
                prescriptionId;
        }


        // ----------------------------------------------------
        // Billing medicine details
        // ----------------------------------------------------

        const billMedicine =
            document.getElementById(
                "billMedicine"
            );


        if (billMedicine) {

            billMedicine.addEventListener(
                "change",
                updateBillingMedicineDetails
            );

        }


        // ----------------------------------------------------
        // Billing quantity
        // ----------------------------------------------------

        const billQuantity =
            document.getElementById(
                "billQuantity"
            );


        if (billQuantity) {

            billQuantity.addEventListener(
                "input",
                calculateBill
            );

        }


        // ----------------------------------------------------
        // Payment method
        // ----------------------------------------------------

        const paymentMethod =
            document.getElementById(
                "paymentMethod"
            );


        if (paymentMethod) {

            paymentMethod.addEventListener(
                "change",
                function () {

                    const reference =
                        document.getElementById(
                            "paymentReference"
                        );


                    if (!reference) {
                        return;
                    }


                    if (
                        paymentMethod.value ===
                        "Cash"
                    ) {

                        reference.placeholder =
                            "Not required for Cash";

                    } else {

                        reference.placeholder =
                            "Required for UPI/Card";
                    }

                }
            );

        }

    }
);
```
