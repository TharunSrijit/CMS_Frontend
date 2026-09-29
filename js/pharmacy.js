// ============================================================
// CMS - PHARMACY JAVASCRIPT
// File: js/pharmacy.js
// Handles medicine inventory, prescription queue, dispensing,
// and pharmacy billing with localStorage persistence.
// ============================================================

// ============================================================
// 1. DEFAULT SEED DATA
// ============================================================

const DEFAULT_MEDICINES = [
    {
        id: 1,
        name: "Paracetamol 650mg",
        price: 20,
        stock: 120,
        expiry: "2027-12-31"
    },
    {
        id: 2,
        name: "Amoxicillin 500mg",
        price: 80,
        stock: 45,
        expiry: "2027-05-15"
    },
    {
        id: 3,
        name: "Cetirizine 10mg",
        price: 30,
        stock: 25,
        expiry: "2028-01-20"
    },
    {
        id: 4,
        name: "Azithromycin 500mg",
        price: 60,
        stock: 8,
        expiry: "2026-10-15"
    },
    {
        id: 5,
        name: "Pantoprazole 40mg",
        price: 45,
        stock: 60,
        expiry: "2027-08-10"
    },
    {
        id: 6,
        name: "Amlodipine 5mg",
        price: 35,
        stock: 50,
        expiry: "2027-11-20"
    },
    {
        id: 7,
        name: "Aspirin 75mg",
        price: 25,
        stock: 75,
        expiry: "2028-03-15"
    },
    {
        id: 8,
        name: "Metformin 500mg",
        price: 40,
        stock: 90,
        expiry: "2027-09-30"
    },
    {
        id: 9,
        name: "Glimepiride 1mg",
        price: 55,
        stock: 6,
        expiry: "2026-12-05"
    },
    {
        id: 10,
        name: "Ibuprofen 400mg",
        price: 25,
        stock: 35,
        expiry: "2027-07-22"
    }
];

const DEFAULT_PRESCRIPTIONS = [
    {
        id: "RX-98201",
        date: new Date().toISOString().slice(0, 10),
        patientId: "PAT001",
        patientName: "Rahul Menon",
        doctorName: "Dr. Arun Kumar",
        status: "Pending Dispensation",
        medicines: [
            { medicine: "Paracetamol 650mg", dosage: "1 Tab", frequency: "1-0-1", duration: "3 Days", instructions: "After food", quantity: 6 },
            { medicine: "Pantoprazole 40mg", dosage: "1 Tab", frequency: "1-0-0", duration: "5 Days", instructions: "Before food", quantity: 5 }
        ]
    },
    {
        id: "RX-98202",
        date: new Date().toISOString().slice(0, 10),
        patientId: "PAT002",
        patientName: "Anu Thomas",
        doctorName: "Dr. Arun Kumar",
        status: "Dispensed",
        medicines: [
            { medicine: "Amoxicillin 500mg", dosage: "1 Cap", frequency: "1-0-1", duration: "5 Days", instructions: "After food", quantity: 10 },
            { medicine: "Cetirizine 10mg",   dosage: "1 Tab", frequency: "0-0-1", duration: "5 Days", instructions: "Bedtime", quantity: 5 }
        ]
    },
    {
        id: "RX-98203",
        date: new Date().toISOString().slice(0, 10),
        patientId: "PAT003",
        patientName: "Arjun Kumar",
        doctorName: "Dr. Arun Kumar",
        status: "Pending Dispensation",
        medicines: [
            { medicine: "Amlodipine 5mg", dosage: "1 Tab", frequency: "1-0-0", duration: "30 Days", instructions: "Morning after food", quantity: 30 },
            { medicine: "Aspirin 75mg",   dosage: "1 Tab", frequency: "0-1-0", duration: "30 Days", instructions: "Lunch", quantity: 30 }
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
            { medicine: "Metformin 500mg",  dosage: "1 Tab", frequency: "1-0-1", duration: "30 Days", instructions: "With meals", quantity: 60 },
            { medicine: "Glimepiride 1mg",  dosage: "1 Tab", frequency: "1-0-0", duration: "30 Days", instructions: "Before breakfast", quantity: 30 }
        ]
    }
];


// ============================================================
// 2. LOCALSTORAGE HELPERS
// ============================================================

function getStoredMedicines() {
    try {
        const raw = localStorage.getItem("cms_medicines");
        if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed) && parsed.length > 0) {
                return parsed;
            }
        }
    } catch (e) {
        console.error("Error reading cms_medicines from localStorage:", e);
    }

    localStorage.setItem("cms_medicines", JSON.stringify(DEFAULT_MEDICINES));
    return DEFAULT_MEDICINES.slice();
}

function saveStoredMedicines(data) {
    medicines = data;
    try {
        localStorage.setItem("cms_medicines", JSON.stringify(data));
    } catch (e) {
        console.error("Error saving cms_medicines to localStorage:", e);
    }
}

function getStoredPrescriptions() {
    try {
        const raw = localStorage.getItem("cms_prescriptions");
        if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed) && parsed.length > 0) {
                return parsed;
            }
        }
    } catch (e) {
        console.error("Error reading cms_prescriptions from localStorage:", e);
    }

    localStorage.setItem("cms_prescriptions", JSON.stringify(DEFAULT_PRESCRIPTIONS));
    return DEFAULT_PRESCRIPTIONS.slice();
}

function saveStoredPrescriptions(data) {
    try {
        localStorage.setItem("cms_prescriptions", JSON.stringify(data));
    } catch (e) {
        console.error("Error saving cms_prescriptions to localStorage:", e);
    }
}

// Active in-memory reference synced with localStorage
let medicines = getStoredMedicines();


// Helper to find medicine by exact or partial/brand name
function findMedicineByName(name) {
    if (!name) return null;
    const clean = name.trim().toLowerCase();

    // 1. Exact match
    let found = medicines.find(function (m) {
        return m.name.toLowerCase() === clean;
    });
    if (found) return found;

    // 2. Starts with / includes match (e.g. 'Paracetamol' matches 'Paracetamol 650mg')
    found = medicines.find(function (m) {
        const mLower = m.name.toLowerCase();
        return mLower.startsWith(clean) || clean.startsWith(mLower) || mLower.includes(clean);
    });

    return found || null;
}


// ============================================================
// 3. PRESCRIPTION QUEUE
// ============================================================

function viewPrescription(id) {
    window.location.href = "prescription-details.html?id=" + encodeURIComponent(id);
}

function loadPrescriptionQueue() {
    const tableBody = document.getElementById("prescriptionQueue");
    if (!tableBody) return;

    const rxList = getStoredPrescriptions();
    const countElement = document.getElementById("queueCount") || document.querySelector(".table-count");

    const pendingCount = rxList.filter(function (rx) {
        return rx.status === "Pending" || rx.status === "Pending Dispensation";
    }).length;

    if (countElement) {
        countElement.innerText = pendingCount;
    }

    if (rxList.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align:center;padding:24px;color:var(--text-muted);">
                    No prescriptions in queue.
                </td>
            </tr>
        `;
        return;
    }

    tableBody.innerHTML = rxList.map(function (rx) {
        const isPending = rx.status === "Pending" || rx.status === "Pending Dispensation";
        const statusBadgeClass = isPending ? "badge-warning" : "badge-success";
        const statusText = isPending ? "Pending" : "Dispensed";
        const btnClass = isPending ? "btn-primary" : "btn-outline";

        return `
            <tr>
                <td class="td-mono">${rx.id}</td>
                <td class="td-primary">${rx.patientName || rx.patientId || "—"}</td>
                <td>${rx.doctorName || "Dr. Arun Kumar"}</td>
                <td>${rx.date || "—"}</td>
                <td>
                    <span class="badge ${statusBadgeClass}">
                        ${statusText}
                    </span>
                </td>
                <td class="td-actions">
                    <a href="prescription-details.html?id=${encodeURIComponent(rx.id)}"
                       class="btn ${btnClass} btn-sm">
                        View
                    </a>
                </td>
            </tr>
        `;
    }).join("");
}


// ============================================================
// 4. PRESCRIPTION DETAILS
// ============================================================

function loadPrescriptionDetails() {
    const tableBody = document.getElementById("rxMedicinesTable");
    if (!tableBody) return;

    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");
    const rxList = getStoredPrescriptions();

    let rx = null;
    if (id) {
        rx = rxList.find(function (item) {
            return String(item.id).toLowerCase() === String(id).toLowerCase();
        });
    }

    if (!rx && rxList.length > 0) {
        rx = rxList[0];
    }

    if (!rx) {
        const titleEl = document.getElementById("rxTitle");
        if (titleEl) titleEl.innerText = "No Prescription Found";
        tableBody.innerHTML = `
            <tr>
                <td colspan="4" style="text-align:center;padding:24px;color:var(--text-muted);">
                    Prescription not found.
                </td>
            </tr>
        `;
        return;
    }

    // Set Header & Fields
    const titleEl = document.getElementById("rxTitle");
    if (titleEl) titleEl.innerText = "Prescription " + rx.id;

    const isPending = rx.status === "Pending" || rx.status === "Pending Dispensation";
    const statusEl = document.getElementById("rxStatusBadge");
    if (statusEl) {
        statusEl.className = "badge " + (isPending ? "badge-warning" : "badge-success");
        statusEl.innerText = isPending ? "Pending" : "Dispensed";
    }

    const patientEl = document.getElementById("rxPatient");
    if (patientEl) {
        patientEl.innerText = (rx.patientName || "—") + (rx.patientId ? " (" + rx.patientId + ")" : "");
    }

    const doctorEl = document.getElementById("rxDoctor");
    if (doctorEl) doctorEl.innerText = rx.doctorName || "Dr. Arun Kumar";

    const dateEl = document.getElementById("rxDate");
    if (dateEl) dateEl.innerText = rx.date || "—";

    const idEl = document.getElementById("rxId");
    if (idEl) idEl.innerText = rx.id;

    // Set Top button
    const topDispenseBtn = document.getElementById("rxTopDispenseBtn");
    if (topDispenseBtn) {
        topDispenseBtn.href = "dispense-medicine.html?id=" + encodeURIComponent(rx.id);
        if (!isPending) {
            topDispenseBtn.style.display = "none";
        } else {
            topDispenseBtn.style.display = "inline-flex";
        }
    }

    // Populate Medicines Table
    const meds = rx.medicines || [];
    if (meds.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="4" style="text-align:center;padding:20px;color:var(--text-muted);">
                    No medicines listed for this prescription.
                </td>
            </tr>
        `;
    } else {
        tableBody.innerHTML = meds.map(function (m) {
            const medName = m.medicine || m.name || "—";
            const dosage = m.dosage || "—";
            const duration = [m.frequency, m.duration].filter(Boolean).join(" · ") || "—";
            const instr = m.instructions || (m.quantity ? "Qty: " + m.quantity : "—");

            return `
                <tr>
                    <td class="td-primary">${medName}</td>
                    <td>${dosage}</td>
                    <td>${duration}</td>
                    <td>${instr}</td>
                </tr>
            `;
        }).join("");
    }

    // Action container
    const actionContainer = document.getElementById("rxActionContainer");
    if (actionContainer) {
        if (isPending) {
            actionContainer.innerHTML = `
                <button class="btn btn-success" onclick="dispenseCurrentPrescription('${rx.id}')">
                    ✅ Dispense All Prescribed Medicines
                </button>
                <a href="dispense-medicine.html?id=${encodeURIComponent(rx.id)}" class="btn btn-outline">
                    Manual Item Dispense
                </a>
            `;
        } else {
            actionContainer.innerHTML = `
                <div style="padding:10px 16px;background:var(--success-light, #e8f8f0);color:var(--success, #27ae60);border-radius:6px;font-weight:600;display:flex;align-items:center;gap:8px;">
                    <span>✓</span> All prescribed medicines have been dispensed.
                </div>
            `;
        }
    }
}

// Dispense all medicines directly from the prescription details page
function dispenseCurrentPrescription(rxId) {
    const rxList = getStoredPrescriptions();
    const rx = rxList.find(function (item) {
        return item.id === rxId;
    });

    if (!rx) {
        alert("Prescription not found.");
        return;
    }

    if (rx.status === "Dispensed") {
        alert("This prescription is already marked as dispensed.");
        return;
    }

    let deductedDetails = [];
    const meds = rx.medicines || [];

    meds.forEach(function (m) {
        const medName = m.medicine || m.name;
        const targetMed = findMedicineByName(medName);
        const qty = m.quantity || 1;

        if (targetMed) {
            targetMed.stock = Math.max(0, targetMed.stock - qty);
            deductedDetails.push(targetMed.name + " (-" + qty + ", stock left: " + targetMed.stock + ")");
        }
    });

    rx.status = "Dispensed";
    saveStoredPrescriptions(rxList);
    saveStoredMedicines(medicines);

    alert("Prescription " + rx.id + " dispensed successfully!\n" +
          (deductedDetails.length > 0 ? "\nStock updated:\n• " + deductedDetails.join("\n• ") : ""));

    loadPrescriptionDetails();
    loadStock();
    loadInventory();
    updateDashboard();
}


// ============================================================
// 5. MEDICINE INVENTORY
// ============================================================

function addMedicine() {
    const nameInput = document.getElementById("medicineName");
    const priceInput = document.getElementById("medicinePrice");
    const stockInput = document.getElementById("medicineStock");
    const expiryInput = document.getElementById("medicineExpiry");

    if (!nameInput || !priceInput || !stockInput || !expiryInput) return;

    const name = nameInput.value.trim();
    const price = Number(priceInput.value);
    const stock = Number(stockInput.value);
    const expiry = expiryInput.value;

    if (!name || price <= 0 || stock < 0 || !expiry) {
        alert("Please enter medicine name, price, stock and expiry date.");
        return;
    }

    const nextId = medicines.reduce(function (max, m) {
        return Math.max(max, m.id || 0);
    }, 0) + 1;

    const newMedicine = {
        id: nextId,
        name: name,
        price: price,
        stock: stock,
        expiry: expiry
    };

    medicines.push(newMedicine);
    saveStoredMedicines(medicines);

    alert("Medicine '" + name + "' added successfully to inventory.");

    nameInput.value = "";
    priceInput.value = "";
    stockInput.value = "";
    expiryInput.value = "";

    loadInventory();
    loadStock();
    updateDashboard();
    populateMedicineDropdowns();
}


// ============================================================
// 6. EXPIRY & STOCK STATUS
// ============================================================

function getExpiryStatus(expiry) {
    const today = new Date();
    const expiryDate = new Date(expiry);

    today.setHours(0, 0, 0, 0);
    expiryDate.setHours(0, 0, 0, 0);

    if (expiryDate < today) {
        return {
            text: "Expired",
            className: "badge-danger"
        };
    }

    const difference = expiryDate - today;
    const days = Math.ceil(difference / (1000 * 60 * 60 * 24));

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

function getStockStatus(stock) {
    if (stock <= 0) {
        return {
            text: "Out of Stock",
            className: "badge-danger"
        };
    }

    if (stock <= 10) {
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
// 7. LOAD INVENTORY TABLE
// ============================================================

function loadInventory() {
    const table = document.getElementById("inventoryTable");
    if (!table) return;

    table.innerHTML = "";

    if (medicines.length === 0) {
        table.innerHTML = `
            <tr>
                <td colspan="6" style="text-align:center;padding:24px;color:var(--text-muted);">
                    No medicines in inventory.
                </td>
            </tr>
        `;
        return;
    }

    medicines.forEach(function (medicine) {
        const stockStatus = getStockStatus(medicine.stock);
        const expiryStatus = getExpiryStatus(medicine.expiry);

        table.innerHTML += `
            <tr>
                <td class="td-mono">${medicine.id}</td>
                <td class="td-primary">${medicine.name}</td>
                <td>₹${medicine.price}</td>
                <td>${medicine.stock}</td>
                <td>${medicine.expiry}</td>
                <td>
                    <span class="badge ${expiryStatus.className}">
                        ${expiryStatus.text}
                    </span>
                    <br>
                    <span class="badge ${stockStatus.className}">
                        ${stockStatus.text}
                    </span>
                </td>
            </tr>
        `;
    });
}


// ============================================================
// 8. LOAD STOCK TABLE
// ============================================================

function loadStock() {
    const table = document.getElementById("stockTable");
    if (!table) return;

    table.innerHTML = "";

    if (medicines.length === 0) {
        table.innerHTML = `
            <tr>
                <td colspan="5" style="text-align:center;padding:24px;color:var(--text-muted);">
                    No stock records found.
                </td>
            </tr>
        `;
        return;
    }

    medicines.forEach(function (medicine) {
        const stockStatus = getStockStatus(medicine.stock);
        const expiryStatus = getExpiryStatus(medicine.expiry);

        table.innerHTML += `
            <tr>
                <td class="td-primary">${medicine.name}</td>
                <td>${medicine.stock}</td>
                <td>${medicine.expiry}</td>
                <td>
                    <span class="badge ${stockStatus.className}">
                        ${stockStatus.text}
                    </span>
                    <br>
                    <span class="badge ${expiryStatus.className}">
                        ${expiryStatus.text}
                    </span>
                </td>
                <td class="td-actions">
                    <button class="btn btn-primary btn-sm"
                            onclick="restockMedicine(${medicine.id})">
                        Restock
                    </button>
                </td>
            </tr>
        `;
    });
}


// ============================================================
// 9. RESTOCK MEDICINE
// ============================================================

function restockMedicine(id) {
    const medicine = medicines.find(function (item) {
        return item.id === id;
    });

    if (!medicine) {
        alert("Medicine not found.");
        return;
    }

    const quantity = prompt("Enter quantity to restock " + medicine.name + ":");

    if (quantity === null || quantity.trim() === "" || Number(quantity) <= 0 || isNaN(Number(quantity))) {
        if (quantity !== null) alert("Please enter a valid quantity.");
        return;
    }

    medicine.stock += Number(quantity);
    saveStoredMedicines(medicines);

    alert(medicine.name + " restocked successfully.\n" +
          "Added: " + quantity + "\n" +
          "New Stock: " + medicine.stock);

    loadStock();
    loadInventory();
    updateDashboard();
    populateMedicineDropdowns();
}


// ============================================================
// 10. DISPENSE MEDICINE (Single Item Form)
// ============================================================

function dispenseMedicine() {
    const rxInput = document.getElementById("prescriptionId");
    const medInput = document.getElementById("medicine");
    const qtyInput = document.getElementById("quantity");

    const prescriptionId = rxInput ? rxInput.value.trim() : "";
    const medicineName = medInput ? medInput.value.trim() : "";
    const quantity = Number(qtyInput ? qtyInput.value : 0);

    if (!medicineName || quantity <= 0) {
        alert("Please select a medicine and enter a valid quantity.");
        return;
    }

    const medicine = findMedicineByName(medicineName);

    if (!medicine) {
        alert("Medicine '" + medicineName + "' not found in inventory.");
        return;
    }

    // Check expiry
    const expiryStatus = getExpiryStatus(medicine.expiry);
    if (expiryStatus.text === "Expired") {
        alert("Cannot dispense expired medicine (" + medicine.name + ").");
        return;
    }

    // Check stock
    if (medicine.stock < quantity) {
        alert("Insufficient stock for " + medicine.name + ". Available: " + medicine.stock);
        return;
    }

    // Deduct stock
    medicine.stock -= quantity;
    saveStoredMedicines(medicines);

    // If prescription ID is entered, update status in cms_prescriptions
    let rxUpdated = false;
    if (prescriptionId) {
        const rxList = getStoredPrescriptions();
        const rx = rxList.find(function (item) {
            return String(item.id).toLowerCase() === prescriptionId.toLowerCase();
        });

        if (rx) {
            rx.status = "Dispensed";
            saveStoredPrescriptions(rxList);
            rxUpdated = true;
        }
    }

    const message = document.getElementById("dispenseMessage");
    if (message) {
        message.innerHTML = `
            <span class="badge badge-success">
                Medicine dispensed successfully.
            </span>
            <br><br>
            Medicine: <strong>${medicine.name}</strong><br>
            Quantity Dispensed: <strong>${quantity}</strong><br>
            Remaining Stock: <strong>${medicine.stock}</strong>
            ${rxUpdated ? `<br>Prescription <strong>${prescriptionId}</strong> status updated to: <span class="badge badge-success">Dispensed</span>` : ""}
        `;
    }

    loadStock();
    loadInventory();
    updateDashboard();
    populateMedicineDropdowns();
}


// ============================================================
// 11. MEDICINE DROPDOWNS
// ============================================================

function populateMedicineDropdowns() {
    const medSelect = document.getElementById("medicine");
    if (medSelect) {
        const currentVal = medSelect.value;
        medSelect.innerHTML = '<option value="">Select Medicine</option>' +
            medicines.map(function (m) {
                return `<option value="${m.name}">${m.name} (Stock: ${m.stock})</option>`;
            }).join("");
        if (currentVal) medSelect.value = currentVal;
    }

    const billSelect = document.getElementById("billMedicine");
    if (billSelect) {
        const currentVal = billSelect.value;
        billSelect.innerHTML = '<option value="">Select Medicine</option>' +
            medicines.map(function (m) {
                return `<option value="${m.price}">${m.name} - ₹${m.price}</option>`;
            }).join("");
        if (currentVal) billSelect.value = currentVal;
    }
}


// ============================================================
// 12. DASHBOARD
// ============================================================

function updateDashboard() {
    const pending = document.getElementById("pendingPrescriptions");
    const medicineCount = document.getElementById("medicineCount");
    const lowStock = document.getElementById("lowStock");

    if (medicineCount) {
        medicineCount.innerText = medicines.length;
    }

    if (lowStock) {
        lowStock.innerText = medicines.filter(function (m) {
            return m.stock <= 10;
        }).length;
    }

    if (pending) {
        const rxList = getStoredPrescriptions();
        const pendingCount = rxList.filter(function (rx) {
            return rx.status === "Pending" || rx.status === "Pending Dispensation";
        }).length;
        pending.innerText = pendingCount;
    }
}


// ============================================================
// 13. BILLING
// ============================================================

function calculateBill() {
    const medSelect = document.getElementById("billMedicine");
    const qtyInput = document.getElementById("billQuantity");
    const totalElement = document.getElementById("total");

    const price = Number(medSelect ? medSelect.value : 0);
    const quantity = Number(qtyInput ? qtyInput.value : 1);

    const total = price * quantity;

    if (totalElement) {
        totalElement.innerText = total;
    }
}

function generateBill() {
    const patientInput = document.getElementById("patientName");
    const totalElement = document.getElementById("total");
    const medSelect = document.getElementById("billMedicine");

    const patient = patientInput ? patientInput.value.trim() : "";
    const total = totalElement ? totalElement.innerText : "0";

    if (!patient || total === "0" || !medSelect || !medSelect.value) {
        alert("Please enter patient name and select a valid medicine.");
        return;
    }

    const medName = medSelect.options[medSelect.selectedIndex] ? medSelect.options[medSelect.selectedIndex].text : "Medicine";

    const billMsg = document.getElementById("billMessage");
    if (billMsg) {
        billMsg.innerHTML = `
            <br>
            <span class="badge badge-success">
                Bill generated successfully!
            </span>
            <br><br>
            Patient: <strong>${patient}</strong><br>
            Item: <strong>${medName}</strong><br>
            Total Amount: <strong>₹${total}</strong>
        `;
    }
}


// ============================================================
// 14. INITIALIZATION
// ============================================================

document.addEventListener("DOMContentLoaded", function () {
    // Sync with localStorage
    medicines = getStoredMedicines();

    // Populate UI elements across pages
    loadInventory();
    loadStock();
    loadPrescriptionQueue();
    loadPrescriptionDetails();
    populateMedicineDropdowns();
    updateDashboard();

    // Auto-fill prescription ID on dispense page if passed in query string
    const params = new URLSearchParams(window.location.search);
    const rxId = params.get("id");
    const rxInput = document.getElementById("prescriptionId");
    if (rxId && rxInput) {
        rxInput.value = rxId;
    }
});