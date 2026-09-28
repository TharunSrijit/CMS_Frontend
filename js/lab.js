// ============================================================
// CMS — LABORATORY MODULE JAVASCRIPT
// File: js/lab.js
// Used by: All pages in /lab/
// ============================================================


// ============================================================
// 1. AUTHENTICATION
// ============================================================

const labLoggedInUser = JSON.parse(
    localStorage.getItem("loggedInUser") || "null"
);


// Allow lab technician and admin.
// If your login system uses another lab role name,
// add it here.

if (
    labLoggedInUser &&
    labLoggedInUser.role &&
    labLoggedInUser.role !== "lab" &&
    labLoggedInUser.role !== "laboratory" &&
    labLoggedInUser.role !== "lab_technician" &&
    labLoggedInUser.role !== "lab-technician" &&
    labLoggedInUser.role !== "admin"
) {

    window.location.href = "../index.html";

}


// ============================================================
// 2. COMMON VARIABLES
// ============================================================

const LAB_TODAY =
    new Date().toISOString().split("T")[0];


let allLabTests = [];

let filteredLabTests = [];


// ============================================================
// 3. DEFAULT LAB DATA
// ============================================================

const DEFAULT_LAB_TESTS = [

    {
        id: "LAB-1001",

        orderDate: LAB_TODAY,

        patientId: "PAT001",

        patientName: "Rahul Menon",

        testName: "Complete Blood Count (CBC)",

        priority: "Normal",

        status: "Completed",

        doctorName: "Dr. Arun Kumar",

        summary:
            "Hb: 14.1 g/dL, WBC: 8,200/mcL, Platelets: 230,000/mcL. All counts within normal biological reference range.",

        result: "Normal CBC result",

        notes: "No abnormal findings."

    },


    {
        id: "LAB-1002",

        orderDate: LAB_TODAY,

        patientId: "PAT003",

        patientName: "Arjun Kumar",

        testName: "Lipid Profile",

        priority: "Urgent",

        status: "Pending",

        doctorName: "Dr. Arun Kumar",

        summary:
            "Sample received at pathology lab; awaiting biochemistry autoanalyzer processing.",

        result: "",

        notes: ""

    },


    {
        id: "LAB-1003",

        orderDate: LAB_TODAY,

        patientId: "PAT005",

        patientName: "Suresh Babu",

        testName: "HbA1c Glycated Hemoglobin",

        priority: "Normal",

        status: "Completed",

        doctorName: "Dr. Arun Kumar",

        summary:
            "HbA1c: 7.2% (Fair glycemic control). Estimated average blood glucose: 160 mg/dL.",

        result: "HbA1c: 7.2%",

        notes: "Fair glycemic control."

    },


    {
        id: "LAB-1004",

        orderDate: LAB_TODAY,

        patientId: "PAT007",

        patientName: "Mohammed Rizwan",

        testName: "Urine Routine Examination",

        priority: "Urgent",

        status: "Pending",

        doctorName: "Dr. Arun Kumar",

        summary:
            "Sample collection underway in diagnostic wing.",

        result: "",

        notes: ""

    },


    {
        id: "LAB-1005",

        orderDate: "2026-02-14",

        patientId: "PAT008",

        patientName: "Divya Krishnan",

        testName: "Thyroid Profile (T3, T4, TSH)",

        priority: "Normal",

        status: "Completed",

        doctorName: "Dr. Arun Kumar",

        summary:
            "TSH: 3.14 mIU/L (Euthyroid state). Free T4: 1.2 ng/dL.",

        result:
            "TSH: 3.14 mIU/L, Free T4: 1.2 ng/dL",

        notes:
            "Euthyroid state."

    }

];


// ============================================================
// 4. INITIALIZE LAB DATA
// ============================================================

function initializeLabData() {

    let stored =
        JSON.parse(
            localStorage.getItem("cms_lab_tests") || "null"
        );


    if (
        !stored ||
        !Array.isArray(stored) ||
        stored.length === 0
    ) {

        stored = DEFAULT_LAB_TESTS;

        localStorage.setItem(
            "cms_lab_tests",
            JSON.stringify(stored)
        );

    }


    allLabTests = stored;

    return allLabTests;

}


// ============================================================
// 5. COMMON UI
// ============================================================

function getInitials(name) {

    return (name || "LT")
        .split(" ")
        .map(function (word) {

            return word.charAt(0);

        })
        .join("")
        .toUpperCase()
        .slice(0, 2);

}


function initLabUI() {

    let name =
        labLoggedInUser &&
        (
            labLoggedInUser.name ||
            labLoggedInUser.username
        )
        ||
        "Lab Technician";


    let initials =
        getInitials(name);


    let sidebarAvatar =
        document.getElementById(
            "sidebarAvatar"
        );

    let sidebarName =
        document.getElementById(
            "sidebarName"
        );


    if (sidebarAvatar) {

        sidebarAvatar.textContent =
            initials;

    }


    if (sidebarName) {

        sidebarName.textContent =
            name;

    }


    let topbarAvatar =
        document.getElementById(
            "topbarAvatar"
        );

    let topbarName =
        document.getElementById(
            "topbarName"
        );


    if (topbarAvatar) {

        topbarAvatar.textContent =
            initials;

    }


    if (topbarName) {

        topbarName.textContent =
            name;

    }


    let topbarDate =
        document.getElementById(
            "topbarDate"
        );


    if (topbarDate) {

        topbarDate.textContent =
            new Date().toLocaleDateString(
                "en-IN",
                {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric"
                }
            );

    }


    let timeOfDay =
        document.getElementById(
            "timeOfDay"
        );


    if (timeOfDay) {

        let hour =
            new Date().getHours();


        timeOfDay.textContent =
            hour < 12
                ? "morning"
                : hour < 17
                    ? "afternoon"
                    : "evening";

    }


    let welcomeName =
        document.getElementById(
            "welcomeName"
        );


    if (welcomeName) {

        welcomeName.textContent =
            "Welcome back, " + name + "!";

    }

}


// ============================================================
// 6. SIDEBAR
// ============================================================

function openSidebar() {

    let sidebar =
        document.getElementById(
            "sidebar"
        );

    let overlay =
        document.getElementById(
            "sidebarOverlay"
        );


    if (sidebar) {

        sidebar.classList.add(
            "open"
        );

    }


    if (overlay) {

        overlay.classList.add(
            "open"
        );

    }

}


function closeSidebar() {

    let sidebar =
        document.getElementById(
            "sidebar"
        );

    let overlay =
        document.getElementById(
            "sidebarOverlay"
        );


    if (sidebar) {

        sidebar.classList.remove(
            "open"
        );

    }


    if (overlay) {

        overlay.classList.remove(
            "open"
        );

    }

}


// ============================================================
// 7. LOGOUT
// ============================================================

function logout() {

    if (
        !confirm(
            "Are you sure you want to logout?"
        )
    ) {

        return;

    }


    localStorage.removeItem(
        "loggedInUser"
    );


    window.location.href =
        "../index.html";

}


// ============================================================
// 8. BADGE HELPERS
// ============================================================

function getStatusBadge(status) {

    let className =
        "badge-neutral";


    if (status === "Pending") {

        className =
            "badge-warning";

    }
    else if (status === "Completed") {

        className =
            "badge-success";

    }
    else if (status === "In Progress") {

        className =
            "badge-info";

    }
    else if (status === "Cancelled") {

        className =
            "badge-danger";

    }


    return `
        <span class="badge ${className}">
            ${status}
        </span>
    `;

}


function getPriorityBadge(priority) {

    if (priority === "Urgent") {

        return `
            <span class="badge badge-danger">
                Urgent
            </span>
        `;

    }


    return `
        <span class="badge badge-neutral">
            Normal
        </span>
    `;

}


// ============================================================
// 9. DASHBOARD
// ============================================================

function initLabDashboard() {

    initializeLabData();

    initLabUI();

    updateLabDashboard();

}


function updateLabDashboard() {

    let total =
        allLabTests.length;


    let pending =
        allLabTests.filter(
            function (test) {

                return test.status === "Pending";

            }
        ).length;


    let completed =
        allLabTests.filter(
            function (test) {

                return test.status === "Completed";

            }
        ).length;


    let urgent =
        allLabTests.filter(
            function (test) {

                return (
                    test.priority === "Urgent" &&
                    test.status !== "Completed"
                );

            }
        ).length;


    setText(
        "statTotal",
        total
    );

    setText(
        "statPending",
        pending
    );

    setText(
        "statCompleted",
        completed
    );

    setText(
        "statUrgent",
        urgent
    );


    setText(
        "bannerTotal",
        total
    );

    setText(
        "bannerPending",
        pending
    );

    setText(
        "bannerCompleted",
        completed
    );


    setText(
        "pendingBadge",
        pending
    );

}


// ============================================================
// 10. SET TEXT HELPER
// ============================================================

function setText(id, value) {

    let element =
        document.getElementById(id);


    if (element) {

        element.textContent =
            value;

    }

}


// ============================================================
// 11. PENDING ORDERS
// ============================================================

function initPendingOrders() {

    initializeLabData();

    initLabUI();

    filterLabOrders();

}


function filterLabOrders() {

    let searchElement =
        document.getElementById(
            "labSearch"
        );


    let search =
        searchElement
            ? searchElement.value
                .trim()
                .toLowerCase()
            : "";


    filteredLabTests =
        allLabTests.filter(
            function (test) {

                if (
                    test.status !==
                    "Pending"
                ) {

                    return false;

                }


                if (!search) {

                    return true;

                }


                return (

                    test.id
                        .toLowerCase()
                        .includes(search)

                    ||

                    test.patientName
                        .toLowerCase()
                        .includes(search)

                    ||

                    test.testName
                        .toLowerCase()
                        .includes(search)

                    ||

                    test.doctorName
                        .toLowerCase()
                        .includes(search)

                );

            }
        );


    renderPendingOrders();

}


function renderPendingOrders() {

    let tbody =
        document.getElementById(
            "pendingOrdersTable"
        );


    if (!tbody) {

        return;

    }


    let count =
        document.getElementById(
            "pendingCountLabel"
        );


    if (count) {

        count.textContent =
            filteredLabTests.length;

    }


    if (
        filteredLabTests.length === 0
    ) {

        tbody.innerHTML = `

            <tr>

                <td colspan="7"
                    style="text-align:center;
                           padding:30px;">

                    No pending laboratory orders found.

                </td>

            </tr>

        `;

        return;

    }


    tbody.innerHTML =
        filteredLabTests
            .map(
                function (test) {

                    return `

                    <tr>

                        <td class="td-mono">
                            ${test.id}
                        </td>

                        <td class="td-primary">
                            ${test.patientName}
                        </td>

                        <td>
                            ${test.testName}
                        </td>

                        <td>
                            ${test.doctorName}
                        </td>

                        <td>
                            ${getPriorityBadge(
                                test.priority
                            )}
                        </td>

                        <td>
                            ${test.orderDate}
                        </td>

                        <td class="td-actions">

                            <div
                                class="td-actions-group">

                                <button
                                    class="btn btn-primary btn-sm"
                                    onclick="openTestDetails('${test.id}')">

                                    View

                                </button>


                                <button
                                    class="btn btn-success btn-sm"
                                    onclick="enterResultForTest('${test.id}')">

                                    Result

                                </button>

                            </div>

                        </td>

                    </tr>

                    `;

                }
            )
            .join("");

}


// ============================================================
// 12. OPEN TEST DETAILS
// ============================================================

function openTestDetails(id) {

    window.location.href =
        "test-details.html?id=" +
        encodeURIComponent(id);

}


// ============================================================
// 13. ENTER RESULT FOR TEST
// ============================================================

function enterResultForTest(id) {

    window.location.href =
        "enter-results.html?id=" +
        encodeURIComponent(id);

}


// ============================================================
// 14. GET URL PARAMETER
// ============================================================

function getQueryParameter(name) {

    let params =
        new URLSearchParams(
            window.location.search
        );


    return params.get(name);

}


// ============================================================
// 15. TEST DETAILS PAGE
// ============================================================

function initTestDetails() {

    initializeLabData();

    initLabUI();


    let id =
        getQueryParameter("id");


    let container =
        document.getElementById(
            "testDetailsContainer"
        );


    if (!container) {

        return;

    }


    if (!id) {

        container.innerHTML = `

            <div class="card">

                <div class="card-body">

                    <p>
                        No test ID was provided.
                    </p>

                    <a
                        href="pending-lab-orders.html"
                        class="btn btn-primary">

                        Back to Orders

                    </a>

                </div>

            </div>

        `;

        return;

    }


    let test =
        allLabTests.find(
            function (item) {

                return item.id === id;

            }
        );


    if (!test) {

        container.innerHTML = `

            <div class="card">

                <div class="card-body">

                    <p>
                        Laboratory test not found.
                    </p>

                </div>

            </div>

        `;

        return;

    }


    container.innerHTML = `

        <div class="card">

            <div class="card-header">

                <div>

                    <div class="card-title">
                        ${test.testName}
                    </div>

                    <div class="card-subtitle">
                        Test ID: ${test.id}
                    </div>

                </div>

                ${getStatusBadge(
                    test.status
                )}

            </div>


            <div class="card-body">


                <div class="form-grid form-grid-2">


                    <div>

                        <strong>
                            Patient
                        </strong>

                        <p>
                            ${test.patientName}
                        </p>

                    </div>


                    <div>

                        <strong>
                            Patient ID
                        </strong>

                        <p>
                            ${test.patientId}
                        </p>

                    </div>


                    <div>

                        <strong>
                            Doctor
                        </strong>

                        <p>
                            ${test.doctorName}
                        </p>

                    </div>


                    <div>

                        <strong>
                            Order Date
                        </strong>

                        <p>
                            ${test.orderDate}
                        </p>

                    </div>


                    <div>

                        <strong>
                            Priority
                        </strong>

                        <p>
                            ${getPriorityBadge(
                                test.priority
                            )}
                        </p>

                    </div>


                    <div>

                        <strong>
                            Status
                        </strong>

                        <p>
                            ${getStatusBadge(
                                test.status
                            )}
                        </p>

                    </div>


                </div>


                <br>


                <div>

                    <strong>
                        Test Summary
                    </strong>

                    <p>
                        ${test.summary || "No summary available."}
                    </p>

                </div>


                ${
                    test.result
                    ? `

                    <div>

                        <strong>
                            Result
                        </strong>

                        <p>
                            ${test.result}
                        </p>

                    </div>

                    `
                    : ""
                }


                ${
                    test.notes
                    ? `

                    <div>

                        <strong>
                            Technician Notes
                        </strong>

                        <p>
                            ${test.notes}
                        </p>

                    </div>

                    `
                    : ""
                }


                <br>


                <div class="page-actions">

                    ${
                        test.status === "Pending"

                        ? `

                        <a
                            href="enter-results.html?id=${test.id}"
                            class="btn btn-success">

                            Enter Result

                        </a>

                        `

                        : ""

                    }


                    <a
                        href="pending-lab-orders.html"
                        class="btn btn-outline">

                        Back

                    </a>

                </div>


            </div>

        </div>

    `;

}


// ============================================================
// 16. ENTER RESULTS PAGE
// ============================================================

function initEnterResults() {

    initializeLabData();

    initLabUI();


    let id =
        getQueryParameter("id");


    let idField =
        document.getElementById(
            "resultTestId"
        );


    if (
        id &&
        idField
    ) {

        idField.value =
            id;

    }


    if (
        id &&
        allLabTests.find(
            function (test) {

                return test.id === id;

            }
        )
    ) {

        let test =
            allLabTests.find(
                function (item) {

                    return item.id === id;

                }
            );


        let resultValue =
            document.getElementById(
                "resultValue"
            );


        let notes =
            document.getElementById(
                "resultNotes"
            );


        if (
            resultValue &&
            test.result
        ) {

            resultValue.value =
                test.result;

        }


        if (
            notes &&
            test.notes
        ) {

            notes.value =
                test.notes;

        }

    }

}


// ============================================================
// 17. SAVE LAB RESULT
// ============================================================

function saveLabResult() {

    let id =
        document.getElementById(
            "resultTestId"
        ).value.trim();


    let status =
        document.getElementById(
            "resultStatus"
        ).value;


    let result =
        document.getElementById(
            "resultValue"
        ).value.trim();


    let notes =
        document.getElementById(
            "resultNotes"
        ).value.trim();


    let message =
        document.getElementById(
            "resultMessage"
        );


    if (!id) {

        alert(
            "Please enter the Test / Order ID."
        );

        return;

    }


    if (!result) {

        alert(
            "Please enter the test result."
        );

        return;

    }


    let tests =
        JSON.parse(
            localStorage.getItem(
                "cms_lab_tests"
            ) || "[]"
        );


    let test =
        tests.find(
            function (item) {

                return item.id === id;

            }
        );


    if (!test) {

        alert(
            "Laboratory test not found."
        );

        return;

    }


    test.status =
        status;


    test.result =
        result;


    test.notes =
        notes;


    test.summary =
        result;


    test.completedDate =
        status === "Completed"
            ? new Date()
                .toISOString()
                .split("T")[0]
            : "";


    localStorage.setItem(
        "cms_lab_tests",
        JSON.stringify(tests)
    );


    allLabTests =
        tests;


    if (message) {

        message.innerHTML = `

            <br>

            <span class="badge badge-success">

                Result saved successfully.

            </span>

        `;

    }


    setTimeout(
        function () {

            window.location.href =
                "completed-tests.html";

        },
        900
    );

}


// ============================================================
// 18. COMPLETED TESTS
// ============================================================

function initCompletedTests() {

    initializeLabData();

    initLabUI();

    filterCompletedTests();

}


function filterCompletedTests() {

    let searchElement =
        document.getElementById(
            "completedSearch"
        );


    let search =
        searchElement
            ? searchElement.value
                .trim()
                .toLowerCase()
            : "";


    let completed =
        allLabTests.filter(
            function (test) {

                if (
                    test.status !==
                    "Completed"
                ) {

                    return false;

                }


                if (!search) {

                    return true;

                }


                return (

                    test.id
                        .toLowerCase()
                        .includes(search)

                    ||

                    test.patientName
                        .toLowerCase()
                        .includes(search)

                    ||

                    test.testName
                        .toLowerCase()
                        .includes(search)

                );

            }
        );


    renderCompletedTests(
        completed
    );

}


function renderCompletedTests(
    tests
) {

    let tbody =
        document.getElementById(
            "completedTestsTable"
        );


    if (!tbody) {

        return;

    }


    let count =
        document.getElementById(
            "completedCountLabel"
        );


    if (count) {

        count.textContent =
            tests.length;

    }


    if (tests.length === 0) {

        tbody.innerHTML = `

            <tr>

                <td
                    colspan="7"
                    style="text-align:center;
                           padding:30px;">

                    No completed tests found.

                </td>

            </tr>

        `;

        return;

    }


    tbody.innerHTML =
        tests.map(
            function (test) {

                return `

                <tr>

                    <td class="td-mono">
                        ${test.id}
                    </td>

                    <td class="td-primary">
                        ${test.patientName}
                    </td>

                    <td>
                        ${test.testName}
                    </td>

                    <td>
                        ${test.doctorName}
                    </td>

                    <td>
                        ${
                            test.completedDate ||
                            test.orderDate
                        }
                    </td>

                    <td>
                        ${getStatusBadge(
                            test.status
                        )}
                    </td>

                    <td class="td-actions">

                        <a
                            href="test-details.html?id=${test.id}"
                            class="btn btn-outline btn-sm">

                            View

                        </a>

                    </td>

                </tr>

                `;

            }
        )
        .join("");

}


// ============================================================
// 19. LAB BILLING
// ============================================================

function calculateLabBill() {

    let test =
        document.getElementById(
            "billingTest"
        );


    let quantity =
        Number(
            document.getElementById(
                "billingQuantity"
            ).value
        );


    let price =
        Number(
            test.value
        );


    if (!quantity || quantity < 1) {

        quantity = 1;

    }


    let total =
        price * quantity;


    setText(
        "labBillTotal",
        total
    );


    return total;

}


function generateLabBill() {

    let patient =
        document.getElementById(
            "billingPatient"
        ).value.trim();


    let test =
        document.getElementById(
            "billingTest"
        );


    let quantity =
        Number(
            document.getElementById(
                "billingQuantity"
            ).value
        );


    let message =
        document.getElementById(
            "billingMessage"
        );


    if (!patient) {

        alert(
            "Please enter the patient name."
        );

        return;

    }


    if (!test.value) {

        alert(
            "Please select a laboratory test."
        );

        return;

    }


    if (!quantity || quantity < 1) {

        alert(
            "Please enter a valid quantity."
        );

        return;

    }


    let total =
        calculateLabBill();


    message.innerHTML = `

        <br>

        <span class="badge badge-success">

            Bill generated successfully!

        </span>

        <br><br>

        Patient:
        <strong>
            ${patient}
        </strong>

        <br>

        Test:
        <strong>
            ${test.options[
                test.selectedIndex
            ].text}
        </strong>

        <br>

        Quantity:
        <strong>
            ${quantity}
        </strong>

        <br>

        Total:
        <strong>
            ₹${total}
        </strong>

    `;

}


function clearLabBill() {

    let patient =
        document.getElementById(
            "billingPatient"
        );


    let test =
        document.getElementById(
            "billingTest"
        );


    let quantity =
        document.getElementById(
            "billingQuantity"
        );


    let message =
        document.getElementById(
            "billingMessage"
        );


    if (patient) {

        patient.value = "";

    }


    if (test) {

        test.value = "";

    }


    if (quantity) {

        quantity.value = 1;

    }


    setText(
        "labBillTotal",
        0
    );


    if (message) {

        message.innerHTML = "";

    }

}


// ============================================================
// 20. PAGE AUTO INITIALIZATION
// ============================================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        initLabUI();


        let path =
            window.location.pathname
                .toLowerCase();


        if (
            path.includes(
                "enter-results.html"
            )
        ) {

            initEnterResults();

        }

    }
);