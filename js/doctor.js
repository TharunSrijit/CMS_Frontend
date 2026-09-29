// ============================================================
// CMS — DOCTOR MODULE JAVASCRIPT
// File: js/doctor.js
// Used by: All pages in /doctor/
// ============================================================


// ============================================================
// 1. AUTH GUARD
// ============================================================

const loggedInUser = JSON.parse(
    localStorage.getItem('loggedInUser') || 'null'
);

if (
    !loggedInUser ||
    (loggedInUser.role !== 'doctor' &&
     loggedInUser.role !== 'admin')
) {
    window.location.href = '../index.html';
}


// ============================================================
// 2. COMMON CONSTANTS
// ============================================================

const TODAY = new Date().toISOString().split('T')[0];

const AVATAR_COLOURS = [
    '#9C6B5D', '#7e5249', '#5c3a32', '#2980b9', '#27ae60',
    '#d68910', '#8e44ad', '#c0392b', '#16a085', '#2c3e50'
];


// ============================================================
// 3. COMMON HELPER FUNCTIONS
// ============================================================

function getInitials(name) {

    return (name || '?')
        .split(' ')
        .map(function (w) { return w[0]; })
        .join('')
        .toUpperCase()
        .slice(0, 2);
}


function avatarColor(id) {

    var num = (id || '').replace(/\D/g, '');

    return AVATAR_COLOURS[
        parseInt(num || '0') % AVATAR_COLOURS.length
    ];
}


function statusBadgeClass(status) {

    var map = {
        'Waiting':       'badge-warning',
        'Confirmed':     'badge-info',
        'In Progress':   'badge-primary',
        'Completed':     'badge-success',
        'Cancelled':     'badge-danger'
    };

    return map[status] || 'badge-neutral';
}


function typeIcon(type) {

    var map = {
        'General':   '🩺',
        'Follow-up': '🔄',
        'Emergency': '🚨'
    };

    return map[type] || '📋';
}


function truncateText(str, len) {

    if (!str) return '';

    return str.length > len
        ? str.slice(0, len) + '…'
        : str;
}


function animateCount(id, target) {

    var el = document.getElementById(id);

    if (!el) return;

    var cur = 0;
    var step = Math.ceil(target / 20) || 1;

    var timer = setInterval(function () {

        cur = Math.min(cur + step, target);
        el.textContent = cur;

        if (cur >= target) clearInterval(timer);

    }, 40);
}


// ============================================================
// 4. COMMON UI FUNCTIONS
// ============================================================

function initDoctorUI() {

    var name = loggedInUser.name ||
               loggedInUser.username ||
               'Doctor';

    var ini = getInitials(name);

    // Sidebar
    var sidebarAvatar = document.getElementById('sidebarAvatar');
    var sidebarName   = document.getElementById('sidebarName');

    if (sidebarAvatar) sidebarAvatar.textContent = ini;
    if (sidebarName)   sidebarName.textContent   = name;

    // Topbar
    var topbarAvatar = document.getElementById('topbarAvatar');
    var topbarName   = document.getElementById('topbarName');

    if (topbarAvatar) topbarAvatar.textContent = ini;
    if (topbarName)   topbarName.textContent   = name;

    // Update sidebar appointment badge
    updateSidebarBadge();
}


function updateSidebarBadge() {

    var appts = JSON.parse(
        localStorage.getItem('cms_appointments') || '[]'
    );

    var waiting = appts.filter(function (a) {
        return a.date === TODAY && a.status === 'Waiting';
    }).length;

    var badge = document.getElementById('sidebarApptBadge') ||
                document.getElementById('sidebarWaitBadge');

    if (badge) badge.textContent = waiting;
}


function initDateLabel() {

    var now  = new Date();
    var hour = now.getHours();
    var opts = {
        weekday: 'long',
        year:    'numeric',
        month:   'long',
        day:     'numeric'
    };

    var dateStr = now.toLocaleDateString('en-IN', opts);

    // Time of day greeting
    var tod = document.getElementById('timeOfDay');
    if (tod) {
        tod.textContent = hour < 12
            ? 'morning'
            : hour < 17
                ? 'afternoon'
                : 'evening';
    }

    // Topbar date
    var topDate = document.getElementById('topbarDate');
    if (topDate) topDate.textContent = dateStr;

    // Today label (appointments page)
    var todayLabel = document.getElementById('todayLabel');
    if (todayLabel) todayLabel.textContent = dateStr;

    var dateSub = document.getElementById('dateSubtitle');
    if (dateSub) {
        dateSub.textContent = 'Showing appointments for ' + dateStr;
    }

    // Modal date (consultation page)
    var mDate = document.getElementById('mDate');
    if (mDate) {
        mDate.textContent = now.toLocaleDateString('en-IN', {
            year: 'numeric', month: 'short', day: 'numeric'
        });
    }
}


// ============================================================
// 5. SIDEBAR & MOBILE NAVIGATION
// ============================================================

function openSidebar() {

    document.getElementById('sidebar')
        .classList.add('open');

    document.getElementById('sidebarOverlay')
        .classList.add('open');
}


function closeSidebar() {

    document.getElementById('sidebar')
        .classList.remove('open');

    document.getElementById('sidebarOverlay')
        .classList.remove('open');
}


function toggleSidebar() {

    document.getElementById('sidebar')
        .classList.toggle('open');

    document.getElementById('sidebarOverlay')
        .classList.toggle('open');
}


// ============================================================
// 6. LOGOUT
// ============================================================

function logout() {

    if (!confirm('Are you sure you want to logout?')) {
        return;
    }

    localStorage.removeItem('loggedInUser');
    window.location.href = '../index.html';
}


// ============================================================
// 7. TOAST NOTIFICATIONS
// ============================================================

function showToast(msg, type) {

    type = type || 'info';

    var icons = {
        success: '✅',
        danger:  '⚠️',
        warning: '⚠️',
        info:    'ℹ️'
    };

    var bgColors = {
        success: '#2e7d32',
        danger:  '#d32f2f',
        warning: '#ed6c02',
        info:    '#1976d2'
    };

    var container = document.getElementById('toastContainer');
    if (!container) return;

    var toast = document.createElement('div');
    toast.className = 'toast toast-' + type;
    toast.innerHTML =
        '<span style="font-size:1rem;">' +
        (icons[type] || 'ℹ️') +
        '</span><span>' + msg + '</span>';

    container.appendChild(toast);

    setTimeout(function () {

        toast.style.opacity    = '0';
        toast.style.transform  = 'translateX(24px)';
        toast.style.transition = 'all .3s ease';

        setTimeout(function () {
            toast.remove();
        }, 300);

    }, 3200);
}


// ============================================================
// 8. SEED DATA
// ============================================================

var SEED_APPOINTMENTS = [
    { id:'APT001', token:1,  patientId:'PAT001', patientName:'Rahul Menon',     age:24, gender:'Male',   blood:'O+',  phone:'9876543210', allergies:'None',        time:'09:00 AM', type:'General',   status:'Completed',   waitMin:0,  complaint:'Persistent headache for 3 days',          bookedOn:'2026-09-26', date:TODAY },
    { id:'APT002', token:2,  patientId:'PAT002', patientName:'Anu Thomas',      age:32, gender:'Female', blood:'A+',  phone:'9812345670', allergies:'Penicillin',  time:'09:30 AM', type:'Follow-up', status:'Completed',   waitMin:0,  complaint:'Post-surgery check-up',                   bookedOn:'2026-09-25', date:TODAY },
    { id:'APT003', token:3,  patientId:'PAT003', patientName:'Arjun Kumar',     age:45, gender:'Male',   blood:'B-',  phone:'9823456701', allergies:'Sulfa drugs', time:'10:00 AM', type:'General',   status:'In Progress', waitMin:5,  complaint:'Chest tightness and mild breathlessness',  bookedOn:'2026-09-27', date:TODAY },
    { id:'APT004', token:4,  patientId:'PAT004', patientName:'Priya Nair',      age:28, gender:'Female', blood:'AB+', phone:'9834567012', allergies:'None',        time:'10:30 AM', type:'General',   status:'Waiting',     waitMin:12, complaint:'Fever and sore throat since yesterday',   bookedOn:'2026-09-28', date:TODAY },
    { id:'APT005', token:5,  patientId:'PAT005', patientName:'Suresh Babu',     age:60, gender:'Male',   blood:'O-',  phone:'9845678123', allergies:'Aspirin',     time:'11:00 AM', type:'Follow-up', status:'Waiting',     waitMin:20, complaint:'Diabetes follow-up — monthly review',     bookedOn:'2026-09-20', date:TODAY },
    { id:'APT006', token:6,  patientId:'PAT006', patientName:'Lakshmi Devi',    age:38, gender:'Female', blood:'A-',  phone:'9856789234', allergies:'None',        time:'11:30 AM', type:'General',   status:'Waiting',     waitMin:30, complaint:'Skin rash on arms for 1 week',            bookedOn:'2026-09-28', date:TODAY },
    { id:'APT007', token:7,  patientId:'PAT007', patientName:'Mohammed Rizwan', age:22, gender:'Male',   blood:'B+',  phone:'9867890345', allergies:'None',        time:'12:00 PM', type:'Emergency', status:'Waiting',     waitMin:35, complaint:'Acute abdominal pain — sudden onset',     bookedOn:'2026-09-28', date:TODAY },
    { id:'APT008', token:8,  patientId:'PAT008', patientName:'Divya Krishnan',  age:35, gender:'Female', blood:'O+',  phone:'9878901456', allergies:'Latex',       time:'12:30 PM', type:'Follow-up', status:'Waiting',     waitMin:42, complaint:'Thyroid follow-up',                       bookedOn:'2026-09-22', date:TODAY },
    { id:'APT009', token:9,  patientId:'PAT009', patientName:'Ravi Shankar',    age:50, gender:'Male',   blood:'A+',  phone:'9889012567', allergies:'None',        time:'01:00 PM', type:'General',   status:'Confirmed',   waitMin:50, complaint:'Back pain — lower lumbar region',         bookedOn:'2026-09-28', date:TODAY },
    { id:'APT010', token:10, patientId:'PAT010', patientName:'Meera Pillai',    age:29, gender:'Female', blood:'B+',  phone:'9890123678', allergies:'Codeine',     time:'01:30 PM', type:'General',   status:'Confirmed',   waitMin:58, complaint:'Migraine with visual aura',               bookedOn:'2026-09-27', date:TODAY },
    { id:'APT011', token:11, patientId:'PAT011', patientName:'Anand Mohan',     age:41, gender:'Male',   blood:'AB-', phone:'9801234789', allergies:'None',        time:'02:00 PM', type:'General',   status:'Confirmed',   waitMin:66, complaint:'Weakness and fatigue for 2 weeks',        bookedOn:'2026-09-28', date:TODAY },
    { id:'APT012', token:12, patientId:'PAT012', patientName:'Kavitha Ramesh',  age:55, gender:'Female', blood:'O+',  phone:'9812340890', allergies:'Iodine',      time:'02:30 PM', type:'Follow-up', status:'Confirmed',   waitMin:75, complaint:'Blood pressure monitoring visit',         bookedOn:'2026-09-18', date:TODAY }
];

var DEFAULT_PATIENTS = [
    { id:'PAT001', name:'Rahul Menon',     age:24, gender:'Male',   blood:'O+',  phone:'9876543210', allergies:'None',        chronic:'None',               status:'Active' },
    { id:'PAT002', name:'Anu Thomas',      age:32, gender:'Female', blood:'A+',  phone:'9812345670', allergies:'Penicillin',  chronic:'Post-Surgery Check', status:'Active' },
    { id:'PAT003', name:'Arjun Kumar',     age:45, gender:'Male',   blood:'B-',  phone:'9823456701', allergies:'Sulfa drugs', chronic:'Hypertension',       status:'Active' },
    { id:'PAT004', name:'Priya Nair',      age:28, gender:'Female', blood:'AB+', phone:'9834567012', allergies:'None',        chronic:'None',               status:'Active' },
    { id:'PAT005', name:'Suresh Babu',     age:60, gender:'Male',   blood:'O-',  phone:'9845678123', allergies:'Aspirin',     chronic:'Type 2 Diabetes',   status:'Active' },
    { id:'PAT006', name:'Lakshmi Devi',    age:38, gender:'Female', blood:'A-',  phone:'9856789234', allergies:'None',        chronic:'None',               status:'Active' },
    { id:'PAT007', name:'Mohammed Rizwan', age:22, gender:'Male',   blood:'B+',  phone:'9867890345', allergies:'None',        chronic:'Gastritis',          status:'Active' },
    { id:'PAT008', name:'Divya Krishnan',  age:35, gender:'Female', blood:'O+',  phone:'9878901456', allergies:'Latex',       chronic:'Hypothyroidism',    status:'Active' },
    { id:'PAT009', name:'Ravi Shankar',    age:50, gender:'Male',   blood:'A+',  phone:'9889012567', allergies:'None',        chronic:'Lumbar Spondylosis', status:'Active' },
    { id:'PAT010', name:'Meera Pillai',    age:29, gender:'Female', blood:'B+',  phone:'9890123678', allergies:'Codeine',     chronic:'Migraine',           status:'Active' },
    { id:'PAT011', name:'Anand Mohan',     age:41, gender:'Male',   blood:'AB-', phone:'9801234789', allergies:'None',        chronic:'Asthma',             status:'Active' },
    { id:'PAT012', name:'Kavitha Ramesh',  age:55, gender:'Female', blood:'O+',  phone:'9812340890', allergies:'Iodine',      chronic:'Hypertension',       status:'Active' }
];

var DEFAULT_RX = [
    {
        id: 'RX-98201', date: TODAY,
        patientId: 'PAT001', patientName: 'Rahul Menon',
        doctorName: 'Dr. Arun Kumar', status: 'Pending Dispensation',
        medicines: [
            { medicine:'Paracetamol 650mg', dosage:'1 Tab', frequency:'1-0-1', duration:'3 Days', instructions:'After food' },
            { medicine:'Pantoprazole 40mg', dosage:'1 Tab', frequency:'1-0-0', duration:'5 Days', instructions:'Before food' }
        ]
    },
    {
        id: 'RX-98202', date: TODAY,
        patientId: 'PAT002', patientName: 'Anu Thomas',
        doctorName: 'Dr. Arun Kumar', status: 'Dispensed',
        medicines: [
            { medicine:'Amoxicillin 500mg', dosage:'1 Cap', frequency:'1-0-1', duration:'5 Days', instructions:'After food' },
            { medicine:'Cetirizine 10mg',   dosage:'1 Tab', frequency:'0-0-1', duration:'5 Days', instructions:'Bedtime' }
        ]
    },
    {
        id: 'RX-98203', date: TODAY,
        patientId: 'PAT003', patientName: 'Arjun Kumar',
        doctorName: 'Dr. Arun Kumar', status: 'Pending Dispensation',
        medicines: [
            { medicine:'Amlodipine 5mg', dosage:'1 Tab', frequency:'1-0-0', duration:'30 Days', instructions:'Morning after food' },
            { medicine:'Aspirin 75mg',   dosage:'1 Tab', frequency:'0-1-0', duration:'30 Days', instructions:'Lunch' }
        ]
    },
    {
        id: 'RX-98190', date: '2026-02-14',
        patientId: 'PAT005', patientName: 'Suresh Babu',
        doctorName: 'Dr. Arun Kumar', status: 'Dispensed',
        medicines: [
            { medicine:'Metformin 500mg',  dosage:'1 Tab', frequency:'1-0-1', duration:'30 Days', instructions:'With meals' },
            { medicine:'Glimepiride 1mg',  dosage:'1 Tab', frequency:'1-0-0', duration:'30 Days', instructions:'Before breakfast' }
        ]
    }
];

var DEFAULT_LABS = [
    { id:'LAB-1001', orderDate:TODAY,       patientId:'PAT001', patientName:'Rahul Menon',     testName:'Complete Blood Count (CBC)',      priority:'Normal', status:'Completed', doctorName:'Dr. Arun Kumar', summary:'Hb: 14.1 g/dL, WBC: 8,200/mcL, Platelets: 230,000/mcL. All counts within normal biological reference range.' },
    { id:'LAB-1002', orderDate:TODAY,       patientId:'PAT003', patientName:'Arjun Kumar',     testName:'Lipid Profile',                   priority:'Urgent', status:'Pending',   doctorName:'Dr. Arun Kumar', summary:'Sample received at pathology lab; awaiting biochemistry autoanalyzer processing.' },
    { id:'LAB-1003', orderDate:TODAY,       patientId:'PAT005', patientName:'Suresh Babu',     testName:'HbA1c Glycated Hemoglobin',       priority:'Normal', status:'Completed', doctorName:'Dr. Arun Kumar', summary:'HbA1c: 7.2% (Fair glycemic control). Estimated average blood glucose: 160 mg/dL.' },
    { id:'LAB-1004', orderDate:TODAY,       patientId:'PAT007', patientName:'Mohammed Rizwan', testName:'Urine Routine Examination',       priority:'Urgent', status:'Pending',   doctorName:'Dr. Arun Kumar', summary:'Sample collection underway in diagnostic wing.' },
    { id:'LAB-1005', orderDate:'2026-02-14', patientId:'PAT008', patientName:'Divya Krishnan', testName:'Thyroid Profile (T3, T4, TSH)',   priority:'Normal', status:'Completed', doctorName:'Dr. Arun Kumar', summary:'TSH: 3.14 mIU/L (Euthyroid state). Free T4: 1.2 ng/dL.' }
];


function seedAllData() {

    if (!localStorage.getItem('cms_appointments')) {
        localStorage.setItem(
            'cms_appointments',
            JSON.stringify(SEED_APPOINTMENTS)
        );
    }

    var patients = JSON.parse(
        localStorage.getItem('cms_patients') || '[]'
    );
    if (!patients || patients.length === 0) {
        localStorage.setItem(
            'cms_patients',
            JSON.stringify(DEFAULT_PATIENTS)
        );
    }

    var rx = JSON.parse(
        localStorage.getItem('cms_prescriptions') || '[]'
    );
    if (!rx || rx.length === 0) {
        localStorage.setItem(
            'cms_prescriptions',
            JSON.stringify(DEFAULT_RX)
        );
    }

    var labs = JSON.parse(
        localStorage.getItem('cms_lab_tests') || '[]'
    );
    if (!labs || labs.length === 0) {
        localStorage.setItem(
            'cms_lab_tests',
            JSON.stringify(DEFAULT_LABS)
        );
    }
}


// ============================================================
// 9. PAGE DETECTION
// ============================================================

function getCurrentPage() {

    var path = window.location.pathname;
    var file = path.split('/').pop();

    return file || 'dashboard.html';
}


// ============================================================
// 10. DASHBOARD PAGE
// ============================================================

var dashAllAppts = [];

function initDashboard() {

    var welcomeName = document.getElementById('welcomeName');
    var name = loggedInUser.name ||
               loggedInUser.username ||
               'Doctor';

    if (welcomeName) {
        welcomeName.textContent = 'Welcome back, ' + name + '!';
    }

    dashLoadData();
}


function dashLoadData() {

    var raw = JSON.parse(
        localStorage.getItem('cms_appointments') || '[]'
    );

    dashAllAppts = raw.filter(function (a) {
        return a.date === TODAY;
    });

    dashUpdateStats();
    dashRenderHero();
    dashRenderUpcoming();
    dashRenderCompleted();
    dashRenderProgress();
    dashRenderTypeBreakdown();
    dashRenderStatusBreakdown();
    dashRenderActivity();
}


function dashUpdateStats() {

    var total     = dashAllAppts.length;
    var waiting   = dashAllAppts.filter(function (a) {
        return a.status === 'Waiting';
    }).length;
    var completed = dashAllAppts.filter(function (a) {
        return a.status === 'Completed';
    }).length;

    animateCount('statTotal',     total);
    animateCount('statWaiting',   waiting);
    animateCount('statCompleted', completed);
    animateCount('statRx',        completed);

    var el;

    el = document.getElementById('bannerTotal');
    if (el) el.textContent = total;

    el = document.getElementById('bannerCompleted');
    if (el) el.textContent = completed;

    el = document.getElementById('bannerWaiting');
    if (el) el.textContent = waiting;

    el = document.getElementById('bannerPending');
    if (el) el.textContent = waiting;

    el = document.getElementById('sidebarApptBadge');
    if (el) el.textContent = waiting;
}


function dashRenderHero() {

    var inProg = dashAllAppts.find(function (a) {
        return a.status === 'In Progress';
    });

    if (inProg) {

        document.getElementById('heroToken').textContent =
            String(inProg.token).padStart(2, '0');

        document.getElementById('heroName').textContent =
            inProg.patientName;

        document.getElementById('heroMeta').textContent =
            inProg.time + ' · Token #' + inProg.token +
            ' · ' + inProg.type + ' · ' + inProg.complaint;

        document.getElementById('heroConsultBtn')
            .style.display = '';

    } else {

        document.getElementById('heroToken').textContent = '—';

        document.getElementById('heroName').textContent =
            'No Active Patient';

        document.getElementById('heroMeta').textContent =
            'Go to Appointments to call the next patient.';

        document.getElementById('heroConsultBtn')
            .style.display = 'none';
    }
}


function goConsult() {

    var inProg = dashAllAppts.find(function (a) {
        return a.status === 'In Progress';
    });

    if (inProg) {
        localStorage.setItem('cms_active_appointment', inProg.id);
        window.location.href = 'consultation.html?id=' + inProg.id;
    }
}


function dashRenderUpcoming() {

    var upcoming = dashAllAppts
        .filter(function (a) {
            return a.status === 'Waiting' ||
                   a.status === 'Confirmed';
        })
        .sort(function (a, b) {
            return a.token - b.token;
        })
        .slice(0, 6);

    var el = document.getElementById('upcomingList');
    var sub = document.getElementById('upcomingSubtitle');

    if (sub) {
        sub.textContent = upcoming.length + ' patient' +
            (upcoming.length !== 1 ? 's' : '') +
            ' still to see';
    }

    if (upcoming.length === 0) {
        el.innerHTML =
            '<div style="padding:24px;text-align:center;' +
            'color:var(--text-muted);font-size:var(--text-sm);">' +
            'All patients seen for today! 🎉</div>';
        return;
    }

    el.innerHTML = upcoming.map(function (a, i) {
        return '<div class="upcoming-row" ' +
            'onclick="location.href=\'appointments.html\'">' +
            '<div class="upcoming-token ' +
            (i === 0 ? 'active' : '') + '">' +
            String(a.token).padStart(2, '0') +
            '</div>' +
            '<div class="avatar avatar-sm" style="background:' +
            avatarColor(a.patientId) + ';flex-shrink:0;">' +
            getInitials(a.patientName) +
            '</div>' +
            '<div style="flex:1;min-width:0;">' +
            '<div style="font-size:var(--text-sm);font-weight:600;' +
            'color:var(--text-primary);white-space:nowrap;' +
            'overflow:hidden;text-overflow:ellipsis;">' +
            a.patientName + '</div>' +
            '<div style="font-size:var(--text-xs);' +
            'color:var(--text-muted);">' +
            a.time + ' · ' + typeIcon(a.type) + ' ' + a.type +
            (a.complaint ? ' · ' + truncateText(a.complaint, 30) : '') +
            '</div></div>' +
            '<span class="badge ' + statusBadgeClass(a.status) +
            '" style="font-size:10px;">' + a.status +
            '</span></div>';
    }).join('');
}


function dashRenderCompleted() {

    var done = dashAllAppts
        .filter(function (a) {
            return a.status === 'Completed';
        })
        .sort(function (a, b) {
            return b.token - a.token;
        });

    var countEl = document.getElementById('completedCount');
    if (countEl) countEl.textContent = done.length + ' done';

    var tbody = document.getElementById('completedBody');

    if (done.length === 0) {
        tbody.innerHTML =
            '<tr><td colspan="5">' +
            '<div class="table-empty">' +
            '<div class="table-empty-icon">🩺</div>' +
            '<div class="table-empty-title">No consultations completed yet</div>' +
            '<div class="table-empty-desc">Completed patients will appear here.</div>' +
            '</div></td></tr>';
        return;
    }

    tbody.innerHTML = done.map(function (a) {
        return '<tr>' +
            '<td><span style="display:inline-flex;align-items:center;' +
            'justify-content:center;width:28px;height:28px;' +
            'border-radius:var(--radius-xs);background:var(--success-light);' +
            'color:var(--success);font-weight:700;font-size:var(--text-xs);">' +
            String(a.token).padStart(2, '0') +
            '</span></td>' +
            '<td><div style="display:flex;align-items:center;gap:8px;">' +
            '<div class="avatar avatar-sm" style="background:' +
            avatarColor(a.patientId) + ';">' +
            getInitials(a.patientName) + '</div><div>' +
            '<div class="td-primary" style="font-size:var(--text-sm);">' +
            a.patientName + '</div>' +
            '<div style="font-size:var(--text-xs);color:var(--text-muted);">' +
            a.patientId + '</div></div></div></td>' +
            '<td style="font-weight:600;font-size:var(--text-sm);">' +
            a.time + '</td>' +
            '<td style="font-size:var(--text-xs);">' +
            typeIcon(a.type) + ' ' + a.type + '</td>' +
            '<td style="font-size:var(--text-xs);color:var(--text-secondary);' +
            'max-width:160px;white-space:nowrap;overflow:hidden;' +
            'text-overflow:ellipsis;">' +
            (a.complaint || '—') + '</td></tr>';
    }).join('');
}


function dashRenderProgress() {

    var total     = dashAllAppts.length || 1;
    var completed = dashAllAppts.filter(function (a) {
        return a.status === 'Completed';
    }).length;

    var pct       = Math.round((completed / total) * 100);

    var remaining = dashAllAppts.filter(function (a) {
        return a.status !== 'Completed' &&
               a.status !== 'Cancelled';
    }).length;

    var circumference = 213.63;
    var offset = circumference - (circumference * pct / 100);

    var ring = document.getElementById('progressRing');
    if (ring) {
        setTimeout(function () {
            ring.style.strokeDashoffset = offset;
        }, 200);
    }

    var el;

    el = document.getElementById('progressPct');
    if (el) el.textContent = pct + '%';

    el = document.getElementById('ringDone');
    if (el) el.textContent = completed;

    el = document.getElementById('ringTotal');
    if (el) el.textContent = dashAllAppts.length;

    el = document.getElementById('ringRemaining');
    if (el) el.textContent = remaining + ' remaining today';
}


function dashRenderTypeBreakdown() {

    var types   = ['General', 'Follow-up', 'Emergency'];
    var total   = dashAllAppts.length || 1;
    var colours = {
        'General':   'var(--accent)',
        'Follow-up': 'var(--info)',
        'Emergency': 'var(--danger)'
    };

    var el = document.getElementById('typeBreakdown');
    if (!el) return;

    el.innerHTML = types.map(function (t) {

        var cnt = dashAllAppts.filter(function (a) {
            return a.type === t;
        }).length;

        var pct = Math.round((cnt / total) * 100);

        return '<div class="progress-bar-item">' +
            '<div class="progress-bar-label">' +
            '<span class="progress-bar-name">' +
            typeIcon(t) + ' ' + t + '</span>' +
            '<span class="progress-bar-value">' + cnt +
            '</span></div>' +
            '<div class="progress-track">' +
            '<div class="progress-fill" style="width:' +
            pct + '%;background:' + colours[t] + ';"></div>' +
            '</div></div>';

    }).join('');
}


function dashRenderStatusBreakdown() {

    var statuses = [
        'Waiting', 'In Progress', 'Confirmed',
        'Completed', 'Cancelled'
    ];

    var total   = dashAllAppts.length || 1;
    var colours = {
        'Waiting':     'var(--warning)',
        'In Progress': '#8e44ad',
        'Confirmed':   'var(--info)',
        'Completed':   'var(--success)',
        'Cancelled':   'var(--danger)'
    };

    var el = document.getElementById('statusBreakdown');
    if (!el) return;

    el.innerHTML = statuses.map(function (s) {

        var cnt = dashAllAppts.filter(function (a) {
            return a.status === s;
        }).length;

        if (cnt === 0) return '';

        var pct = Math.round((cnt / total) * 100);

        return '<div class="progress-bar-item">' +
            '<div class="progress-bar-label">' +
            '<span class="progress-bar-name">' + s + '</span>' +
            '<span class="progress-bar-value">' + cnt +
            '</span></div>' +
            '<div class="progress-track">' +
            '<div class="progress-fill" style="width:' +
            pct + '%;background:' + colours[s] + ';"></div>' +
            '</div></div>';

    }).join('');
}


function dashRenderActivity() {

    var activities = [
        { icon: '✅', text: '<strong>Anu Thomas</strong> consultation completed',            time: '9:58 AM',  type: 'success' },
        { icon: '✅', text: '<strong>Rahul Menon</strong> consultation completed',            time: '9:25 AM',  type: 'success' },
        { icon: '🩺', text: 'Started consulting <strong>Arjun Kumar</strong> — Token #03',   time: '10:02 AM', type: 'info' },
        { icon: '💊', text: 'Prescription written for <strong>Rahul Menon</strong>',          time: '9:22 AM',  type: 'warning' },
        { icon: '🧪', text: 'Lab test ordered for <strong>Anu Thomas</strong> — CBC',        time: '9:50 AM',  type: 'info' },
        { icon: '📋', text: '<strong>Suresh Babu</strong> added to waiting queue',            time: '10:30 AM', type: 'terra' }
    ];

    var el = document.getElementById('activityFeed');
    if (!el) return;

    el.innerHTML = activities.map(function (a, i) {
        return '<div class="activity-item">' +
            '<div class="activity-dot-col">' +
            '<div class="activity-dot ' +
            (a.type === 'success' ? 'success' : a.type === 'info' ? 'info' : '') +
            '">' + a.icon + '</div>' +
            (i < activities.length - 1 ? '<div class="activity-line"></div>' : '') +
            '</div>' +
            '<div class="activity-content">' +
            '<div class="activity-text">' + a.text + '</div>' +
            '<div class="activity-time">Today, ' + a.time + '</div>' +
            '</div></div>';
    }).join('');
}


// ============================================================
// 11. APPOINTMENTS PAGE
// ============================================================

var allAppointments = [];
var apptFiltered    = [];
var currentSort     = { key: 'token', dir: 'asc' };
var currentPage     = 1;
var perPage         = 15;
var searchQuery     = '';
var statusFilterVal = '';
var typeFilterVal   = '';
var activeDrawerId  = null;
var currentTokenId  = null;


function initAppointments() {

    loadAppointments();
}


function loadAppointments() {

    var all = JSON.parse(
        localStorage.getItem('cms_appointments') || '[]'
    );

    allAppointments = all.filter(function (a) {
        return a.date === TODAY;
    });

    apptApplyFilters();
    apptUpdateStats();
    apptRenderTokenQueue();
    apptRenderTypeBreakdown();
}


function apptApplyFilters() {

    var data = allAppointments.slice();

    // Search
    if (searchQuery) {
        var q = searchQuery.toLowerCase();
        data = data.filter(function (a) {
            return a.patientName.toLowerCase().indexOf(q) !== -1 ||
                   String(a.token).indexOf(q) !== -1 ||
                   a.time.toLowerCase().indexOf(q) !== -1 ||
                   a.patientId.toLowerCase().indexOf(q) !== -1;
        });
    }

    // Status filter
    if (statusFilterVal) {
        data = data.filter(function (a) {
            return a.status === statusFilterVal;
        });
    }

    // Type filter
    if (typeFilterVal) {
        data = data.filter(function (a) {
            return a.type === typeFilterVal;
        });
    }

    // Sort
    data.sort(function (a, b) {
        var aVal = a[currentSort.key];
        var bVal = b[currentSort.key];
        if (typeof aVal === 'string') aVal = aVal.toLowerCase();
        if (typeof bVal === 'string') bVal = bVal.toLowerCase();
        if (aVal < bVal) return currentSort.dir === 'asc' ? -1 : 1;
        if (aVal > bVal) return currentSort.dir === 'asc' ?  1 : -1;
        return 0;
    });

    apptFiltered = data;
    currentPage  = 1;

    apptRenderTable();
    apptRenderPagination();
    apptUpdateTableCount();
}


function handleSearch(val) {

    searchQuery = val.trim();

    var tableSearch = document.getElementById('tableSearchInput');
    var topSearch   = document.getElementById('topbarSearch');

    if (tableSearch) tableSearch.value = val;
    if (topSearch)   topSearch.value   = val;

    apptApplyFilters();
}


function handleTopbarSearch(val) {
    handleSearch(val);
}


function handleStatusFilter(val) {
    statusFilterVal = val;
    apptApplyFilters();
}


function handleTypeFilter(val) {
    typeFilterVal = val;
    apptApplyFilters();
}


function filterAll() {

    statusFilterVal = '';

    var sf = document.getElementById('statusFilter');
    if (sf) sf.value = '';

    var btnAll = document.getElementById('btnAll');
    if (btnAll) btnAll.classList.add('btn-secondary');

    ['btnWaiting', 'btnInProgress', 'btnCompleted'].forEach(
        function (id) {
            var el = document.getElementById(id);
            if (el) el.classList.remove('btn-secondary');
        }
    );

    apptApplyFilters();
}


function filterByStatus(status) {

    statusFilterVal = status;

    var sf = document.getElementById('statusFilter');
    if (sf) sf.value = status;

    apptApplyFilters();
}


function sortTable(key) {

    if (currentSort.key === key) {
        currentSort.dir =
            currentSort.dir === 'asc' ? 'desc' : 'asc';
    } else {
        currentSort = { key: key, dir: 'asc' };
    }

    ['th-token', 'th-time'].forEach(function (id) {
        var el = document.getElementById(id);
        if (el) {
            el.classList.remove('sorted', 'sort-asc', 'sort-desc');
            if (id === 'th-' + key) {
                el.classList.add('sorted', 'sort-' + currentSort.dir);
            }
        }
    });

    apptApplyFilters();
}


function apptRenderTable() {

    var tbody = document.getElementById('appointmentsTbody');
    if (!tbody) return;

    var start = (currentPage - 1) * perPage;
    var slice = apptFiltered.slice(start, start + perPage);

    if (slice.length === 0) {
        tbody.innerHTML =
            '<tr><td colspan="7">' +
            '<div class="table-empty">' +
            '<div class="table-empty-icon">📭</div>' +
            '<div class="table-empty-title">No appointments found</div>' +
            '<div class="table-empty-desc">Try adjusting your search or filter criteria.</div>' +
            '</div></td></tr>';
        return;
    }

    tbody.innerHTML = slice.map(function (a) {

        var sClass      = statusBadgeClass(a.status);
        var isInProgress = a.status === 'In Progress';
        var rowClass    = isInProgress ? 'class="current-patient"' : '';
        var tIcon       = typeIcon(a.type);

        return '<tr ' + rowClass + ' data-id="' + a.id + '">' +
            '<td><span style="display:inline-flex;align-items:center;' +
            'justify-content:center;width:30px;height:30px;' +
            'border-radius:var(--radius-xs);background:' +
            (isInProgress ? 'var(--accent)' : 'var(--clr-blush)') +
            ';color:' + (isInProgress ? '#fff' : 'var(--accent)') +
            ';font-weight:700;font-size:var(--text-xs);">' +
            (a.token < 10 ? '0' + a.token : a.token) +
            '</span></td>' +

            '<td><div style="display:flex;align-items:center;gap:10px;">' +
            '<div class="avatar avatar-sm" style="background:' +
            avatarColor(a.patientId) + ';">' +
            getInitials(a.patientName) + '</div><div>' +
            '<div class="td-primary" style="font-size:var(--text-sm);">' +
            a.patientName + '</div>' +
            '<div style="font-size:var(--text-xs);color:var(--text-muted);">' +
            a.patientId + '</div></div></div></td>' +

            '<td style="font-weight:600;font-size:var(--text-sm);' +
            'white-space:nowrap;">' + a.time + '</td>' +

            '<td><span style="font-size:var(--text-xs);">' +
            tIcon + ' ' + a.type + '</span></td>' +

            '<td><span class="badge ' + sClass + '">' +
            a.status + '</span></td>' +

            '<td><span style="font-size:var(--text-sm);color:' +
            (a.waitMin > 30 ? 'var(--danger)' : 'var(--text-secondary)') +
            ';">' + (a.status === 'Completed' ? '—' : a.waitMin + ' min') +
            '</span></td>' +

            '<td class="td-actions"><div class="td-actions-group">' +
            '<button class="action-btn view" title="Quick View" ' +
            'onclick="openDrawer(\'' + a.id + '\')">👁</button>' +

            (a.status !== 'Completed' && a.status !== 'Cancelled'
                ? '<button class="action-btn approve" title="Start Consultation" ' +
                  'onclick="openConsultation(\'' + a.id + '\')">🩺</button>'
                : '') +

            (a.status === 'Waiting' || a.status === 'Confirmed'
                ? '<button class="action-btn edit" title="Mark In Progress" ' +
                  'onclick="setStatus(\'' + a.id + '\', \'In Progress\')">▶</button>'
                : '') +

            (a.status === 'In Progress'
                ? '<button class="action-btn approve" title="Mark Completed" ' +
                  'onclick="setStatus(\'' + a.id + '\', \'Completed\')">✓</button>'
                : '') +

            '<button class="action-btn delete" title="Cancel" ' +
            'onclick="cancelAppointment(\'' + a.id + '\')" ' +
            (a.status === 'Completed' ? 'style="display:none"' : '') +
            '>✕</button>' +
            '</div></td></tr>';

    }).join('');
}


function apptRenderPagination() {

    var totalPages = Math.ceil(apptFiltered.length / perPage);
    var paginationEl = document.getElementById('pagination');
    if (!paginationEl) return;

    if (totalPages <= 1) {
        paginationEl.innerHTML = '';
        return;
    }

    var html = '<button class="page-btn ' +
        (currentPage === 1 ? 'disabled' : '') +
        '" onclick="goToPage(' + (currentPage - 1) + ')">‹</button>';

    for (var i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages ||
            Math.abs(i - currentPage) <= 1) {
            html += '<button class="page-btn ' +
                (i === currentPage ? 'active' : '') +
                '" onclick="goToPage(' + i + ')">' + i + '</button>';
        } else if (Math.abs(i - currentPage) === 2) {
            html += '<span class="pagination-ellipsis">…</span>';
        }
    }

    html += '<button class="page-btn ' +
        (currentPage === totalPages ? 'disabled' : '') +
        '" onclick="goToPage(' + (currentPage + 1) + ')">›</button>';

    paginationEl.innerHTML = html;
}


function goToPage(page) {

    var totalPages = Math.ceil(apptFiltered.length / perPage);

    if (page < 1 || page > totalPages) return;

    currentPage = page;
    apptRenderTable();
    apptRenderPagination();
    apptUpdateTableCount();
}


function changePerPage(val) {

    perPage     = parseInt(val);
    currentPage = 1;

    apptRenderTable();
    apptRenderPagination();
    apptUpdateTableCount();
}


function apptUpdateTableCount() {

    var start = (currentPage - 1) * perPage;
    var end   = Math.min(start + perPage, apptFiltered.length);

    var info = document.getElementById('paginationInfo');
    if (info) {
        info.innerHTML = 'Showing <strong>' +
            (apptFiltered.length > 0 ? start + 1 : 0) + '–' +
            end + '</strong> of <strong>' +
            apptFiltered.length + '</strong>';
    }

    var cnt = document.getElementById('tableCount');
    if (cnt) {
        cnt.textContent = apptFiltered.length + ' record' +
            (apptFiltered.length !== 1 ? 's' : '');
    }
}


function apptUpdateStats() {

    var total      = allAppointments.length;
    var waiting    = allAppointments.filter(function (a) {
        return a.status === 'Waiting';
    }).length;
    var inProgress = allAppointments.filter(function (a) {
        return a.status === 'In Progress';
    }).length;
    var completed  = allAppointments.filter(function (a) {
        return a.status === 'Completed';
    }).length;

    animateCount('statTotal',      total);
    animateCount('statWaiting',    waiting);
    animateCount('statInProgress', inProgress);
    animateCount('statCompleted',  completed);

    var badge = document.getElementById('sidebarWaitBadge');
    if (badge) badge.textContent = waiting + inProgress;
}


function apptRenderTokenQueue() {

    var inProgress = allAppointments.find(function (a) {
        return a.status === 'In Progress';
    });

    var waiting = allAppointments
        .filter(function (a) {
            return a.status === 'Waiting' ||
                   a.status === 'Confirmed';
        })
        .sort(function (a, b) {
            return a.token - b.token;
        });

    // Current token
    if (inProgress) {
        currentTokenId = inProgress.id;

        var numEl = document.getElementById('currentTokenNum');
        if (numEl) numEl.textContent = String(inProgress.token).padStart(2, '0');

        var nameEl = document.getElementById('currentTokenName');
        if (nameEl) nameEl.textContent = inProgress.patientName;

        var infoEl = document.getElementById('currentTokenInfo');
        if (infoEl) {
            infoEl.textContent =
                inProgress.time + ' · ' + inProgress.type;
        }
    } else {
        currentTokenId = null;

        var numEl2 = document.getElementById('currentTokenNum');
        if (numEl2) numEl2.textContent = '—';

        var nameEl2 = document.getElementById('currentTokenName');
        if (nameEl2) nameEl2.textContent = 'No Active Patient';

        var infoEl2 = document.getElementById('currentTokenInfo');
        if (infoEl2) infoEl2.textContent = 'Click "Call Next" to begin';
    }

    // Queue list
    var queueEl  = document.getElementById('queueList');
    var queueSub = document.getElementById('queueSubtitle');

    if (queueSub) {
        queueSub.textContent = waiting.length + ' patient' +
            (waiting.length !== 1 ? 's' : '') + ' waiting';
    }

    if (!queueEl) return;

    if (waiting.length === 0) {
        queueEl.innerHTML =
            '<div style="padding:24px;text-align:center;' +
            'color:var(--text-muted);font-size:var(--text-sm);">' +
            'No patients waiting 🎉</div>';
        return;
    }

    queueEl.innerHTML = waiting.slice(0, 6).map(function (a, idx) {
        return '<div class="token-queue-item" style="' +
            (idx === 0 ? 'background:var(--accent-light);' : '') + '">' +
            '<div class="token-num-badge" style="' +
            (idx === 0 ? 'background:var(--accent);color:#fff;' : '') + '">' +
            String(a.token).padStart(2, '0') + '</div>' +
            '<div style="flex:1;min-width:0;">' +
            '<div style="font-size:var(--text-sm);font-weight:600;' +
            'color:var(--text-primary);white-space:nowrap;overflow:hidden;' +
            'text-overflow:ellipsis;">' + a.patientName + '</div>' +
            '<div style="font-size:var(--text-xs);color:var(--text-muted);">' +
            a.time + ' · ' + a.type + '</div></div>' +
            '<span class="badge ' + statusBadgeClass(a.status) +
            '" style="font-size:10px;">' + a.status + '</span></div>';
    }).join('');

    if (waiting.length > 6) {
        var footer = document.getElementById('queueFooterNote');
        if (footer) {
            footer.textContent = '+' + (waiting.length - 6) + ' more in queue';
        }
    }
}


function callNextToken() {

    if (currentTokenId) {
        setStatus(currentTokenId, 'Completed', false);
    }

    var next = allAppointments
        .filter(function (a) {
            return a.status === 'Waiting' ||
                   a.status === 'Confirmed';
        })
        .sort(function (a, b) {
            return a.token - b.token;
        })[0];

    if (!next) {
        showToast('No more patients in queue 🎉', 'success');
        return;
    }

    setStatus(next.id, 'In Progress', false);
    showToast(
        'Token ' + String(next.token).padStart(2, '0') +
        ' — ' + next.patientName + ' called',
        'info'
    );
}


function apptRenderTypeBreakdown() {

    var types   = ['General', 'Follow-up', 'Emergency'];
    var total   = allAppointments.length || 1;
    var colours = {
        'General':   'var(--accent)',
        'Follow-up': 'var(--info)',
        'Emergency': 'var(--danger)'
    };

    var el = document.getElementById('typeBreakdown');
    if (!el) return;

    el.innerHTML = types.map(function (t) {

        var cnt = allAppointments.filter(function (a) {
            return a.type === t;
        }).length;

        var pct = Math.round((cnt / total) * 100);

        return '<div class="progress-bar-item">' +
            '<div class="progress-bar-label">' +
            '<span class="progress-bar-name">' + t + '</span>' +
            '<span class="progress-bar-value">' + cnt + '</span>' +
            '</div><div class="progress-track">' +
            '<div class="progress-fill" style="width:' + pct +
            '%;background:' + colours[t] + ';"></div>' +
            '</div></div>';
    }).join('');
}


// Drawer (Quick View)

function openDrawer(id) {

    var a = allAppointments.find(function (ap) {
        return ap.id === id;
    });
    if (!a) return;

    activeDrawerId = id;

    var setEl = function (elId, val) {
        var el = document.getElementById(elId);
        if (el) el.textContent = val;
    };

    setEl('drawerApptId',    a.id);
    setEl('drawerName',      a.patientName);
    setEl('drawerPatientId', a.patientId);
    setEl('drawerToken',     '#' + String(a.token).padStart(2, '0'));
    setEl('drawerTime',      a.time);
    setEl('drawerType',      typeIcon(a.type) + ' ' + a.type);
    setEl('drawerBooked',    a.bookedOn);
    setEl('drawerAgeGender', a.age + ' yrs · ' + a.gender);
    setEl('drawerBlood',     a.blood);
    setEl('drawerPhone',     a.phone);
    setEl('drawerAllergies', a.allergies || 'None known');
    setEl('drawerComplaint', a.complaint);

    var drawerAvatar = document.getElementById('drawerAvatar');
    if (drawerAvatar) {
        drawerAvatar.textContent       = getInitials(a.patientName);
        drawerAvatar.style.background  = avatarColor(a.patientId);
    }

    var drawerStatus = document.getElementById('drawerStatus');
    if (drawerStatus) {
        drawerStatus.innerHTML = '<span class="badge ' +
            statusBadgeClass(a.status) + '">' + a.status + '</span>';
    }

    var drawerStatusBadge = document.getElementById('drawerStatusBadge');
    if (drawerStatusBadge) {
        drawerStatusBadge.innerHTML = '<span class="badge ' +
            statusBadgeClass(a.status) + '">' + a.status + '</span>';
    }

    var completeBtn = document.getElementById('drawerCompleteBtn');
    if (completeBtn) {
        completeBtn.style.display =
            (a.status === 'Completed' || a.status === 'Cancelled')
                ? 'none' : '';
    }

    document.getElementById('patientDrawer').classList.add('open');
    document.getElementById('drawerOverlay').classList.add('open');
    document.body.style.overflow = 'hidden';
}


function closeDrawer() {

    var drawer  = document.getElementById('patientDrawer');
    var overlay = document.getElementById('drawerOverlay');

    if (drawer)  drawer.classList.remove('open');
    if (overlay) overlay.classList.remove('open');

    document.body.style.overflow = '';
    activeDrawerId = null;
}


function markCompleted() {

    if (!activeDrawerId) return;
    setStatus(activeDrawerId, 'Completed');
    closeDrawer();
}


function startConsultation() {

    if (!activeDrawerId) return;
    openConsultation(activeDrawerId);
}


// Status changes

function setStatus(id, newStatus, notify) {

    if (notify === undefined) notify = true;

    var stored = JSON.parse(
        localStorage.getItem('cms_appointments') || '[]'
    );

    var idx = stored.findIndex(function (a) {
        return a.id === id;
    });

    if (idx === -1) return;

    stored[idx].status = newStatus;
    localStorage.setItem(
        'cms_appointments',
        JSON.stringify(stored)
    );

    loadAppointments();

    if (notify) {
        showToast(
            'Appointment marked as "' + newStatus + '"',
            newStatus === 'Completed' ? 'success' : 'info'
        );
    }
}


function cancelAppointment(id) {

    var a = allAppointments.find(function (ap) {
        return ap.id === id;
    });
    if (!a) return;

    if (!confirm('Cancel appointment for ' + a.patientName + '?')) {
        return;
    }

    setStatus(id, 'Cancelled');
    showToast(
        'Appointment for ' + a.patientName + ' cancelled',
        'danger'
    );
}


function openConsultation(id) {

    var a = allAppointments.find(function (ap) {
        return ap.id === id;
    });

    if (a && a.status !== 'In Progress' &&
        a.status !== 'Completed') {
        setStatus(id, 'In Progress', false);
    }

    localStorage.setItem('cms_active_appointment', id);
    window.location.href = 'consultation.html?id=' + id;
}


function exportAppointments() {

    var rows = [
        ['Token', 'Patient', 'Patient ID', 'Time',
         'Type', 'Status', 'Wait (min)', 'Complaint']
    ];

    allAppointments.forEach(function (a) {
        rows.push([
            a.token, a.patientName, a.patientId,
            a.time, a.type, a.status, a.waitMin,
            '"' + a.complaint + '"'
        ]);
    });

    var csv  = rows.map(function (r) {
        return r.join(',');
    }).join('\n');

    var blob = new Blob([csv], { type: 'text/csv' });
    var url  = URL.createObjectURL(blob);
    var link = document.createElement('a');
    link.href     = url;
    link.download = 'appointments_' + TODAY + '.csv';
    link.click();
    URL.revokeObjectURL(url);
    showToast('Appointments exported as CSV', 'success');
}


function refreshAppointments() {

    loadAppointments();
    showToast('Appointments refreshed', 'info');
}


function toggleUserMenu() {
    // Placeholder for user dropdown menu
}


// ============================================================
// 12. CONSULTATION PAGE
// ============================================================

var activeAppt = null;

function initConsultation() {

    var modalDocName = document.getElementById('modalDocName');
    if (modalDocName) {
        modalDocName.textContent =
            loggedInUser.name || loggedInUser.username || 'Doctor';
    }

    consultLoadData();
    setupInitialMedications();
}


function consultLoadData() {

    allAppointments = JSON.parse(
        localStorage.getItem('cms_appointments') || '[]'
    );

    updateSidebarBadge();

    var urlParams = new URLSearchParams(window.location.search);
    var targetId  = urlParams.get('id') ||
                    localStorage.getItem('cms_active_appointment');

    var todayAppts = allAppointments.filter(function (a) {
        return a.date === TODAY;
    });

    // Populate dropdown
    var sel = document.getElementById('patientQueueSelect');
    if (sel) {
        sel.innerHTML = todayAppts.length === 0
            ? '<option value="">No patients scheduled today</option>'
            : todayAppts.map(function (a) {
                return '<option value="' + a.id + '" ' +
                    (targetId === a.id ? 'selected' : '') + '>' +
                    'Token #' + a.token + ' — ' +
                    a.patientName + ' (' + a.status + ')' +
                    '</option>';
              }).join('');
    }

    if (targetId) {
        activeAppt = todayAppts.find(function (a) {
            return a.id === targetId;
        }) || todayAppts[0];
    } else {
        activeAppt = todayAppts.find(function (a) {
            return a.status === 'In Progress';
        }) || todayAppts.find(function (a) {
            return a.status === 'Waiting';
        }) || todayAppts[0];
    }

    if (activeAppt) {
        renderPatientHero(activeAppt);
    }
}


function onSelectPatientChange(id) {

    if (!id) return;
    localStorage.setItem('cms_active_appointment', id);
    window.location.href = 'consultation.html?id=' + id;
}


function callNextPatient() {

    var next = allAppointments.find(function (a) {
        return a.date === TODAY && a.status === 'Waiting';
    });

    if (!next) {
        showToast(
            'No more waiting patients for today! 🎉',
            'info'
        );
        return;
    }

    next.status = 'In Progress';
    localStorage.setItem(
        'cms_appointments',
        JSON.stringify(allAppointments)
    );
    localStorage.setItem('cms_active_appointment', next.id);
    window.location.href = 'consultation.html?id=' + next.id;
}


function renderPatientHero(appt) {

    var setEl = function (id, val) {
        var el = document.getElementById(id);
        if (el) el.textContent = val;
    };

    setEl('pToken',     String(appt.token).padStart(2, '0'));
    setEl('pName',      appt.patientName);
    setEl('pId',        appt.patientId || 'PAT-00' + appt.token);
    setEl('pAgeGender', (appt.age || 30) + ' yrs, ' + (appt.gender || 'Unknown'));
    setEl('pBlood',     appt.blood || 'B+');
    setEl('pPhone',     appt.phone || '9876543210');
    setEl('pAllergies', appt.allergies || 'None');
    setEl('pComplaint', appt.complaint || 'General medical consultation');

    var statusEl = document.getElementById('pStatusBadge');
    if (statusEl) {
        statusEl.textContent = appt.status;
        statusEl.className   = 'badge ' +
            (appt.status === 'In Progress' ? 'badge-info' :
             appt.status === 'Completed'   ? 'badge-success' :
             'badge-warning');
    }

    var profileLink = document.getElementById('btnFullProfile');
    if (profileLink) {
        profileLink.href = 'patient-details.html?id=' +
            (appt.patientId || appt.id);
    }

    var diagInput = document.getElementById('diagPrimary');
    if (diagInput && appt.complaint) {
        diagInput.value = 'Clinical evaluation for ' + appt.complaint;
    }
}


// Medication Builder

function setupInitialMedications() {

    var tbody = document.getElementById('rxTableBody');
    if (!tbody) return;

    tbody.innerHTML = '';
    addMedicationRow('Paracetamol 500mg', '1 Tablet', '1-0-1', '3 Days', 'After food');
    addMedicationRow('Pantoprazole 40mg', '1 Tablet', '1-0-0', '5 Days', 'Before food');
}


function addMedicationRow(name, dosage, freq, dur, inst) {

    name   = name   || '';
    dosage = dosage || '';
    freq   = freq   || '1-0-1';
    dur    = dur    || '5 Days';
    inst   = inst   || 'After food';

    var tbody = document.getElementById('rxTableBody');
    if (!tbody) return;

    var tr = document.createElement('tr');

    tr.innerHTML =
        '<td><input type="text" class="rx-input rx-name" value="' + name +
        '" placeholder="e.g. Amoxicillin 500mg" /></td>' +
        '<td><input type="text" class="rx-input rx-dose" value="' + dosage +
        '" placeholder="e.g. 1 Tab" /></td>' +
        '<td><select class="rx-input rx-freq">' +
        '<option value="1-0-1"' + (freq === '1-0-1' ? ' selected' : '') +
        '>1-0-1 (Twice daily)</option>' +
        '<option value="1-0-0"' + (freq === '1-0-0' ? ' selected' : '') +
        '>1-0-0 (Morning)</option>' +
        '<option value="0-0-1"' + (freq === '0-0-1' ? ' selected' : '') +
        '>0-0-1 (Night)</option>' +
        '<option value="1-1-1"' + (freq === '1-1-1' ? ' selected' : '') +
        '>1-1-1 (Thrice daily)</option>' +
        '<option value="SOS / As needed"' +
        (freq.indexOf('SOS') !== -1 ? ' selected' : '') +
        '>SOS (As needed)</option>' +
        '</select></td>' +
        '<td><input type="text" class="rx-input rx-dur" value="' + dur +
        '" placeholder="5 Days" /></td>' +
        '<td><input type="text" class="rx-input rx-inst" value="' + inst +
        '" placeholder="After food" /></td>' +
        '<td><button class="rx-delete-btn" onclick="this.closest(\'tr\').remove()" title="Remove">✕</button></td>';

    tbody.appendChild(tr);
}


function quickAddRx(name, dosage, freq, dur, inst) {

    addMedicationRow(name, dosage, freq, dur, inst);
    showToast('Added ' + name, 'info');
}


function getPrescriptionData() {

    var rows      = document.querySelectorAll('#rxTableBody tr');
    var medicines = [];

    rows.forEach(function (tr) {

        var nameEl = tr.querySelector('.rx-name');
        var name   = nameEl ? nameEl.value.trim() : '';

        if (name) {
            medicines.push({
                medicine:     name,
                dosage:       (tr.querySelector('.rx-dose') || {}).value || '1 Dose',
                frequency:    (tr.querySelector('.rx-freq') || {}).value || '1-0-1',
                duration:     (tr.querySelector('.rx-dur')  || {}).value || '3 Days',
                instructions: (tr.querySelector('.rx-inst') || {}).value || 'After food'
            });
        }
    });

    return medicines;
}


// Complete Consultation

function completeConsultation() {

    if (!activeAppt) {
        showToast('No active patient to complete.', 'warning');
        return;
    }

    var primaryDiag = document.getElementById('diagPrimary').value.trim();
    if (!primaryDiag) {
        showToast(
            'Please enter a Primary Diagnosis before completing.',
            'warning'
        );
        document.getElementById('diagPrimary').focus();
        return;
    }

    var medicines = getPrescriptionData();

    // Lab Tests
    var labCheckboxes = document.querySelectorAll(
        'input[name="labTest"]:checked'
    );
    var labTests = Array.from(labCheckboxes).map(function (cb) {
        return cb.value;
    });
    var customLab = document.getElementById('labCustom');
    if (customLab && customLab.value.trim()) {
        labTests.push(customLab.value.trim());
    }

    // 1. Update appointment status
    var appts = JSON.parse(
        localStorage.getItem('cms_appointments') || '[]'
    );
    var idx = appts.findIndex(function (a) {
        return a.id === activeAppt.id;
    });
    if (idx !== -1) {
        appts[idx].status = 'Completed';
        localStorage.setItem(
            'cms_appointments',
            JSON.stringify(appts)
        );
    }

    // 2. Save consultation record
    var consults = JSON.parse(
        localStorage.getItem('cms_consultations') || '[]'
    );

    var consultRecord = {
        id:                  'CNS-' + Date.now(),
        appointmentId:       activeAppt.id,
        patientId:           activeAppt.patientId || 'PAT-001',
        patientName:         activeAppt.patientName,
        doctorName:          loggedInUser.name || 'Dr. Arun Kumar',
        date:                TODAY,
        time:                new Date().toLocaleTimeString(
                                 [], { hour:'2-digit', minute:'2-digit' }
                             ),
        diagnosis:           primaryDiag,
        secondaryDiagnosis:  (document.getElementById('diagSecondary') || {}).value || '',
        notes:               (document.getElementById('diagNotes') || {}).value || '',
        vitals: {
            bp:     (document.getElementById('vitBP')     || {}).value || '',
            pulse:  (document.getElementById('vitPulse')  || {}).value || '',
            temp:   (document.getElementById('vitTemp')   || {}).value || '',
            spo2:   (document.getElementById('vitSpo2')   || {}).value || '',
            weight: (document.getElementById('vitWeight') || {}).value || ''
        },
        medicines:  medicines,
        labTests:   labTests,
        advice:     (document.getElementById('adviceNotes') || {}).value || '',
        followUp:   (document.getElementById('followUpSelect') || {}).value || ''
    };

    consults.unshift(consultRecord);
    localStorage.setItem(
        'cms_consultations',
        JSON.stringify(consults)
    );

    // 3. Save prescription
    if (medicines.length > 0) {
        var rxList = JSON.parse(
            localStorage.getItem('cms_prescriptions') || '[]'
        );
        rxList.unshift({
            id:             'RX-' + Date.now(),
            consultationId: consultRecord.id,
            patientId:      consultRecord.patientId,
            patientName:    consultRecord.patientName,
            doctorName:     consultRecord.doctorName,
            date:           TODAY,
            medicines:      medicines,
            status:         'Pending Dispensation'
        });
        localStorage.setItem(
            'cms_prescriptions',
            JSON.stringify(rxList)
        );
    }

    // 4. Save lab orders
    if (labTests.length > 0) {
        var testList = JSON.parse(
            localStorage.getItem('cms_lab_tests') || '[]'
        );
        labTests.forEach(function (t, i) {
            testList.unshift({
                id:          'LAB-' + (Date.now() + i),
                testName:    t,
                patientId:   consultRecord.patientId,
                patientName: consultRecord.patientName,
                doctorName:  consultRecord.doctorName,
                orderDate:   TODAY,
                status:      'Pending',
                priority:    'Normal'
            });
        });
        localStorage.setItem(
            'cms_lab_tests',
            JSON.stringify(testList)
        );
    }

    // 5. Auto-generate billing record for consultation
    try {
        var billingList = JSON.parse(
            localStorage.getItem('cms_billing') || '[]'
        );
        billingList.unshift({
            id:          'BILL' + String(Date.now()).slice(-5),
            patientId:   consultRecord.patientId,
            patientName: consultRecord.patientName,
            amount:      '500',
            method:      'Cash',
            notes:       'Consultation fee — ' + (consultRecord.diagnosis || 'General OPD'),
            status:      'Unpaid',
            date:        TODAY
        });
        localStorage.setItem(
            'cms_billing',
            JSON.stringify(billingList)
        );
    } catch (e) {
        console.error('Error generating bill from consultation', e);
    }

    showToast(
        'Consultation for ' + activeAppt.patientName + ' saved!',
        'success'
    );

    setTimeout(function () {
        if (confirm(
            'Consultation completed for ' +
            activeAppt.patientName +
            '.\n\nWould you like to call the next patient in queue?'
        )) {
            callNextPatient();
        } else {
            window.location.href = 'appointments.html';
        }
    }, 600);
}


// Printable Rx Preview

function openPrintModal() {

    if (!activeAppt) {
        showToast('No patient selected.', 'warning');
        return;
    }

    var setEl = function (id, val) {
        var el = document.getElementById(id);
        if (el) el.textContent = val;
    };

    setEl('mPatientName', activeAppt.patientName);
    setEl('mAgeGender',   (activeAppt.age || 30) + 'Y / ' + (activeAppt.gender || 'M'));
    setEl('mPatientId',   activeAppt.patientId || 'PAT-001');
    setEl('mBlood',       activeAppt.blood || 'B+');
    setEl('mDiagnosis',   (document.getElementById('diagPrimary') || {}).value || 'General Consultation');
    setEl('mAdvice',      (document.getElementById('adviceNotes') || {}).value || 'Take medications as prescribed with adequate rest.');
    setEl('mFollowUp',    (document.getElementById('followUpSelect') || {}).value || 'As needed');

    // Meds table
    var meds  = getPrescriptionData();
    var mBody = document.getElementById('mRxBody');
    if (mBody) {
        if (meds.length === 0) {
            mBody.innerHTML =
                '<tr><td colspan="6" style="padding:10px;text-align:center;color:#888;">' +
                'No medications prescribed.</td></tr>';
        } else {
            mBody.innerHTML = meds.map(function (m, i) {
                return '<tr style="border-bottom:1px solid #f0e9e4;">' +
                    '<td style="padding:6px 8px;">' + (i + 1) + '</td>' +
                    '<td style="padding:6px 8px;font-weight:600;">' + m.medicine + '</td>' +
                    '<td style="padding:6px 8px;">' + m.dosage + '</td>' +
                    '<td style="padding:6px 8px;">' + m.frequency + '</td>' +
                    '<td style="padding:6px 8px;">' + m.duration + '</td>' +
                    '<td style="padding:6px 8px;color:#555;">' + m.instructions + '</td></tr>';
            }).join('');
        }
    }

    // Lab section
    var labChecks = document.querySelectorAll(
        'input[name="labTest"]:checked'
    );
    var labs = Array.from(labChecks).map(function (c) {
        return c.value;
    });

    var labSec = document.getElementById('mLabSection');
    if (labSec) {
        if (labs.length > 0) {
            labSec.style.display = 'block';
            var labEl = document.getElementById('mLabTests');
            if (labEl) labEl.textContent = labs.join(', ');
        } else {
            labSec.style.display = 'none';
        }
    }

    var modal = document.getElementById('rxModal');
    if (modal) modal.classList.add('open');
}


function closeRxModal() {

    var modal = document.getElementById('rxModal');
    if (modal) modal.classList.remove('open');
}


// ============================================================
// 13. PATIENTS PAGE
// ============================================================

var allPatients      = [];
var filteredPatients = [];


function initPatients() {

    loadPatientsList();
}


function loadPatientsList() {

    var stored = JSON.parse(
        localStorage.getItem('cms_patients') || '[]'
    );

    if (!stored || stored.length === 0) {
        stored = DEFAULT_PATIENTS;
        localStorage.setItem(
            'cms_patients',
            JSON.stringify(stored)
        );
    }

    allPatients = stored;
    patientsApplyFilters();
    patientsUpdateStats();
    updateSidebarBadge();
}


function patientsUpdateStats() {

    var el;

    el = document.getElementById('statTotalPatients');
    if (el) el.textContent = allPatients.length;

    var chronicCount = allPatients.filter(function (p) {
        return p.chronic && p.chronic !== 'None';
    }).length;

    el = document.getElementById('statChronic');
    if (el) el.textContent = chronicCount;

    var allergyCount = allPatients.filter(function (p) {
        return p.allergies && p.allergies !== 'None';
    }).length;

    el = document.getElementById('statAllergies');
    if (el) el.textContent = allergyCount;

    var consults = JSON.parse(
        localStorage.getItem('cms_consultations') || '[]'
    );

    el = document.getElementById('statSeenByDoc');
    if (el) el.textContent = consults.length || 8;
}


function patientsApplyFilters() {

    var searchInput = document.getElementById('patientSearchInput');
    var genderInput = document.getElementById('genderFilter');
    var bloodInput  = document.getElementById('bloodFilter');

    var q      = searchInput ? searchInput.value.trim().toLowerCase() : '';
    var gender = genderInput ? genderInput.value : '';
    var blood  = bloodInput  ? bloodInput.value  : '';

    filteredPatients = allPatients.filter(function (p) {

        var matchQ = !q ||
            p.name.toLowerCase().indexOf(q) !== -1 ||
            p.id.toLowerCase().indexOf(q) !== -1 ||
            (p.phone && p.phone.indexOf(q) !== -1);

        var matchG = !gender || p.gender === gender;
        var matchB = !blood  || p.blood  === blood;

        return matchQ && matchG && matchB;
    });

    patientsRenderTable();
}


function handleSearch_patients() {
    patientsApplyFilters();
}


function patientsRenderTable() {

    var tbody = document.getElementById('patientsTableBody');
    if (!tbody) return;

    var countLabel = document.getElementById('patientCountLabel');
    if (countLabel) {
        countLabel.textContent = 'Showing ' + filteredPatients.length +
            ' of ' + allPatients.length + ' patients';
    }

    if (filteredPatients.length === 0) {
        tbody.innerHTML =
            '<tr><td colspan="8" style="text-align:center;padding:32px;' +
            'color:var(--text-muted);">No patients found matching your search.</td></tr>';
        return;
    }

    tbody.innerHTML = filteredPatients.map(function (p) {

        var hasAllergy = p.allergies && p.allergies !== 'None';

        return '<tr>' +
            '<td style="font-weight:600;font-family:monospace;color:var(--accent);">' +
            p.id + '</td>' +
            '<td><div class="patient-avatar-cell">' +
            '<div class="avatar avatar-sm" style="background:#e8dfd8;color:#5c4033;' +
            'font-weight:700;width:32px;height:32px;border-radius:50%;display:flex;' +
            'align-items:center;justify-content:center;font-size:12px;">' +
            getInitials(p.name) + '</div><div>' +
            '<div style="font-weight:600;color:var(--text-primary);">' + p.name + '</div>' +
            '<div style="font-size:11px;color:var(--text-muted);">' +
            (p.chronic && p.chronic !== 'None' ? '🩺 ' + p.chronic : 'No chronic conditions') +
            '</div></div></div></td>' +
            '<td>' + p.age + ' yrs, ' + p.gender + '</td>' +
            '<td>' + (p.phone || '—') + '</td>' +
            '<td><span class="badge" style="background:#f0e9e4;color:#3d2a25;">' +
            (p.blood || '—') + '</span></td>' +
            '<td>' + (hasAllergy
                ? '<span class="allergy-chip">⚠️ ' + p.allergies + '</span>'
                : '<span class="safe-chip">None reported</span>') +
            '</td>' +
            '<td><span class="badge badge-success">Active</span></td>' +
            '<td style="text-align:right;">' +
            '<div style="display:inline-flex;gap:6px;">' +
            '<a href="patient-details.html?id=' + p.id +
            '" class="btn btn-outline btn-sm" title="View Full Medical Record">Profile ↗</a>' +
            '<button class="btn btn-secondary btn-sm" ' +
            'onclick="startConsultFor(\'' + p.id + '\', \'' + p.name +
            '\')" title="Start Consultation">🩺 Consult</button>' +
            '</div></td></tr>';
    }).join('');
}


function startConsultFor(patientId, patientName) {

    var appts = JSON.parse(
        localStorage.getItem('cms_appointments') || '[]'
    );
    var today = new Date().toISOString().split('T')[0];

    var appt = appts.find(function (a) {
        return a.patientId === patientId && a.date === today;
    });

    if (!appt) {
        var token = appts.filter(function (a) {
            return a.date === today;
        }).length + 1;

        appt = {
            id:          'APT-' + Date.now(),
            token:       token,
            patientId:   patientId,
            patientName: patientName,
            age:         30,
            gender:      'Male',
            blood:       'O+',
            time:        new Date().toLocaleTimeString(
                             [], { hour:'2-digit', minute:'2-digit' }
                         ),
            type:        'Walk-in',
            status:      'In Progress',
            complaint:   'Routine consultation',
            date:        today
        };
        appts.push(appt);
    } else {
        appt.status = 'In Progress';
    }

    localStorage.setItem(
        'cms_appointments',
        JSON.stringify(appts)
    );
    localStorage.setItem('cms_active_appointment', appt.id);
    window.location.href = 'consultation.html?id=' + appt.id;
}


function exportPatientsCSV() {

    var rows = [[
        'Patient ID', 'Name', 'Age', 'Gender',
        'Phone', 'Blood Group', 'Allergies', 'Chronic Conditions'
    ]];

    allPatients.forEach(function (p) {
        rows.push([
            p.id, p.name, p.age, p.gender,
            p.phone, p.blood,
            '"' + p.allergies + '"',
            '"' + (p.chronic || '') + '"'
        ]);
    });

    var csv = rows.map(function (r) {
        return r.join(',');
    }).join('\n');

    var blob = new Blob([csv], { type: 'text/csv' });
    var a    = document.createElement('a');
    a.href     = URL.createObjectURL(blob);
    a.download = 'medicare_patients_' +
        new Date().toISOString().slice(0, 10) + '.csv';
    a.click();
}


// ============================================================
// 14. PATIENT DETAILS PAGE
// ============================================================

var currentPatient         = null;
var patientConsultations   = [];
var patientPrescriptions   = [];
var patientLabs            = [];


function initPatientDetails() {

    loadPatientData();
}


function loadPatientData() {

    var patients  = JSON.parse(
        localStorage.getItem('cms_patients') || '[]'
    );
    var urlParams = new URLSearchParams(window.location.search);
    var requestedId = urlParams.get('id') || 'PAT001';

    // Patient picker
    var picker = document.getElementById('quickPatientPicker');
    if (picker) {
        picker.innerHTML = patients.map(function (p) {
            return '<option value="' + p.id + '" ' +
                (p.id === requestedId ? 'selected' : '') + '>' +
                p.name + ' (' + p.id + ')</option>';
        }).join('');
    }

    currentPatient = patients.find(function (p) {
        return p.id === requestedId;
    }) || patients[0] || {
        id: 'PAT001', name: 'Rahul Menon', age: 24,
        gender: 'Male', blood: 'O+', phone: '9876543210',
        allergies: 'None', chronic: 'None'
    };

    detailsRenderHeader(currentPatient);
    detailsLoadClinical(currentPatient);
    updateSidebarBadge();
}


function switchPatient(id) {
    window.location.href = 'patient-details.html?id=' + id;
}


function detailsRenderHeader(p) {

    var initials = getInitials(p.name);

    var setEl = function (id, val) {
        var el = document.getElementById(id);
        if (el) el.textContent = val;
    };

    setEl('pHeroAvatar', initials);
    setEl('pHeroName',   p.name);
    setEl('pHeroId',     p.id);
    setEl('pHeroSub',    (p.age || 28) + ' yrs · ' +
        (p.gender || 'Unknown') + ' · Blood: ' +
        (p.blood || '—') + ' · Phone: ' + (p.phone || '—'));

    var allergyEl = document.getElementById('pHeroAllergies');
    if (allergyEl) {
        if (p.allergies && p.allergies !== 'None') {
            allergyEl.textContent = '⚠️ Allergies: ' + p.allergies;
            allergyEl.className   = 'badge badge-danger';
        } else {
            allergyEl.textContent = '✓ No known drug allergies';
            allergyEl.className   = 'badge badge-success';
        }
    }

    setEl('pHeroChronic',
        p.chronic && p.chronic !== 'None'
            ? '🩺 Chronic: ' + p.chronic
            : '🩺 General Medicine'
    );
}


function detailsLoadClinical(p) {

    // 1. Consultations
    var allConsults = JSON.parse(
        localStorage.getItem('cms_consultations') || '[]'
    );

    patientConsultations = allConsults.filter(function (c) {
        return c.patientId === p.id || c.patientName === p.name;
    });

    if (patientConsultations.length === 0) {
        patientConsultations = [{
            id: 'CNS-Sample', date: '2026-02-14', time: '10:30 AM',
            doctorName: 'Dr. Arun Kumar',
            diagnosis: 'Acute Upper Respiratory Tract Infection',
            secondaryDiagnosis: 'None',
            notes: 'Patient presented with 3-day history of dry cough and low-grade pyrexia. Throat examination revealed mild erythematous pharynx. Chest clear to auscultation.',
            vitals: { bp:'118/76', pulse:'76', temp:'99.1', spo2:'98', weight:'67' },
            medicines: [
                { medicine:'Amoxicillin 500mg', dosage:'1 Cap', frequency:'1-0-1', duration:'5 Days', instructions:'After food' },
                { medicine:'Paracetamol 650mg', dosage:'1 Tab', frequency:'SOS / As needed', duration:'3 Days', instructions:'For fever/body ache' }
            ],
            labTests: ['Complete Blood Count (CBC)'],
            advice: 'Adequate hydration, warm saline gargles twice daily. Review if fever persists over 48 hours.',
            followUp: '1 Week'
        }];
    }

    var countConsults = document.getElementById('countConsults');
    if (countConsults) countConsults.textContent = patientConsultations.length;
    detailsRenderConsultations(patientConsultations);

    // 2. Prescriptions
    var allRx = JSON.parse(
        localStorage.getItem('cms_prescriptions') || '[]'
    );

    patientPrescriptions = allRx.filter(function (r) {
        return r.patientId === p.id || r.patientName === p.name;
    });

    if (patientPrescriptions.length === 0) {
        patientPrescriptions = [{
            id: 'RX-98210', date: '2026-02-14',
            doctorName: 'Dr. Arun Kumar', status: 'Dispensed',
            medicines: [
                { medicine:'Amoxicillin 500mg', dosage:'1 Cap', frequency:'1-0-1', duration:'5 Days' },
                { medicine:'Paracetamol 650mg', dosage:'1 Tab', frequency:'SOS', duration:'3 Days' }
            ]
        }];
    }

    var countRx = document.getElementById('countPrescriptions');
    if (countRx) countRx.textContent = patientPrescriptions.length;
    detailsRenderPrescriptions(patientPrescriptions);

    // 3. Lab Tests
    var allLabTests = JSON.parse(
        localStorage.getItem('cms_lab_tests') || '[]'
    );

    patientLabs = allLabTests.filter(function (l) {
        return l.patientId === p.id || l.patientName === p.name;
    });

    if (patientLabs.length === 0) {
        patientLabs = [{
            id: 'LAB-1029', orderDate: '2026-02-14',
            testName: 'Complete Blood Count (CBC)',
            status: 'Completed', priority: 'Normal',
            doctorName: 'Dr. Arun Kumar',
            summary: 'Hb: 14.2 g/dL, WBC: 7,800 /mcL, Platelets: 240,000 /mcL (Normal limits)'
        }];
    }

    var countLabs = document.getElementById('countLabs');
    if (countLabs) countLabs.textContent = patientLabs.length;
    detailsRenderLabs(patientLabs);
}


function detailsRenderConsultations(consults) {

    var container = document.getElementById('consultationsContainer');
    if (!container) return;

    container.innerHTML = consults.map(function (c) {

        var vitalsHtml = '';
        if (c.vitals) {
            vitalsHtml =
                '<div style="display:flex;gap:16px;flex-wrap:wrap;' +
                'background:var(--surface-secondary);padding:8px 14px;' +
                'border-radius:6px;font-size:12px;margin-bottom:12px;">' +
                '<span><b>BP:</b> ' + (c.vitals.bp || '—') + ' mmHg</span>' +
                '<span><b>Pulse:</b> ' + (c.vitals.pulse || '—') + ' bpm</span>' +
                '<span><b>Temp:</b> ' + (c.vitals.temp || '—') + ' °F</span>' +
                '<span><b>SpO2:</b> ' + (c.vitals.spo2 || '—') + '%</span>' +
                '<span><b>Weight:</b> ' + (c.vitals.weight || '—') + ' kg</span></div>';
        }

        var medsHtml = '';
        if (c.medicines && c.medicines.length > 0) {
            medsHtml =
                '<div style="font-size:13px;margin-bottom:8px;">' +
                '<b>Prescribed Medications:</b>' +
                '<ul style="margin:4px 0 8px 18px;padding:0;color:var(--text-primary);">' +
                c.medicines.map(function (m) {
                    return '<li><b>' + m.medicine + '</b> — ' +
                        (m.dosage || '') + ' (' + (m.frequency || '') +
                        ') for ' + (m.duration || '') + '</li>';
                }).join('') + '</ul></div>';
        }

        return '<div class="timeline-card">' +
            '<div class="timeline-header"><div>' +
            '<span class="timeline-date">📅 ' + c.date +
            ' · ' + (c.time || '10:00 AM') + '</span>' +
            '<span style="margin-left:10px;font-size:12px;color:var(--text-muted);">' +
            'Consulted by <b>' + (c.doctorName || 'Dr. Arun Kumar') +
            '</b></span></div>' +
            '<span class="badge badge-success">Completed</span></div>' +
            '<div style="margin-bottom:12px;">' +
            '<div style="font-size:15px;font-weight:700;color:var(--text-primary);' +
            'margin-bottom:4px;">🩺 ' + c.diagnosis + '</div>' +
            '<p style="font-size:13px;color:var(--text-secondary);' +
            'line-height:1.5;margin:0;">' +
            (c.notes || 'Clinical consultation documented.') +
            '</p></div>' + vitalsHtml + medsHtml +
            '<div style="font-size:12px;color:var(--text-secondary);' +
            'display:flex;justify-content:space-between;flex-wrap:wrap;' +
            'border-top:1px solid var(--border-light);padding-top:8px;">' +
            '<div><b>Advice:</b> ' +
            (c.advice || 'Follow general healthcare advice.') + '</div>' +
            '<div><b>Follow-up:</b> ' +
            (c.followUp || 'As needed') + '</div></div></div>';
    }).join('');
}


function detailsRenderPrescriptions(prescriptions) {

    var tbody = document.getElementById('prescriptionsTableBody');
    if (!tbody) return;

    tbody.innerHTML = prescriptions.map(function (rx) {
        return (rx.medicines || []).map(function (m, i) {
            return '<tr>' +
                (i === 0 ? '<td rowspan="' + rx.medicines.length +
                 '" style="font-family:monospace;font-weight:600;color:var(--accent);">' +
                 rx.id + '</td>' : '') +
                (i === 0 ? '<td rowspan="' + rx.medicines.length +
                 '">' + rx.date + '</td>' : '') +
                '<td style="font-weight:600;">' + m.medicine + '</td>' +
                '<td>' + m.dosage + ' (' + m.frequency + ')</td>' +
                '<td>' + m.duration + '</td>' +
                (i === 0 ? '<td rowspan="' + rx.medicines.length +
                 '">' + (rx.doctorName || 'Dr. Arun Kumar') + '</td>' : '') +
                (i === 0 ? '<td rowspan="' + rx.medicines.length +
                 '"><span class="badge badge-success">' +
                 (rx.status || 'Active') + '</span></td>' : '') +
                '</tr>';
        }).join('');
    }).join('');
}


function detailsRenderLabs(labs) {

    var tbody = document.getElementById('labsTableBody');
    if (!tbody) return;

    tbody.innerHTML = labs.map(function (l) {
        return '<tr>' +
            '<td style="font-family:monospace;font-weight:600;color:var(--accent);">' +
            l.id + '</td>' +
            '<td>' + l.orderDate + '</td>' +
            '<td style="font-weight:600;">' + l.testName + '</td>' +
            '<td><span class="badge ' +
            (l.status === 'Completed' ? 'badge-success' : 'badge-warning') +
            '">' + l.status + '</span></td>' +
            '<td><span class="badge" style="background:#f0e9e4;">' +
            (l.priority || 'Normal') + '</span></td>' +
            '<td>' + (l.doctorName || 'Dr. Arun Kumar') + '</td>' +
            '<td style="font-size:12px;color:var(--text-secondary);">' +
            (l.summary || 'Awaiting lab technician results') + '</td></tr>';
    }).join('');
}


function setTab(tab, btn) {

    document.querySelectorAll('.tab-btn').forEach(function (b) {
        b.classList.remove('active');
    });

    btn.classList.add('active');

    var tabConsultations = document.getElementById('tabConsultations');
    var tabPrescriptions = document.getElementById('tabPrescriptions');
    var tabLabs          = document.getElementById('tabLabs');

    if (tabConsultations) {
        tabConsultations.style.display =
            tab === 'consultations' ? 'block' : 'none';
    }
    if (tabPrescriptions) {
        tabPrescriptions.style.display =
            tab === 'prescriptions' ? 'block' : 'none';
    }
    if (tabLabs) {
        tabLabs.style.display =
            tab === 'labs' ? 'block' : 'none';
    }
}


function startConsultationForPatient() {

    if (!currentPatient) return;

    var appts = JSON.parse(
        localStorage.getItem('cms_appointments') || '[]'
    );
    var today = new Date().toISOString().split('T')[0];

    var appt = appts.find(function (a) {
        return a.patientId === currentPatient.id &&
               a.date === today;
    });

    if (!appt) {
        var token = appts.filter(function (a) {
            return a.date === today;
        }).length + 1;

        appt = {
            id:          'APT-' + Date.now(),
            token:       token,
            patientId:   currentPatient.id,
            patientName: currentPatient.name,
            age:         currentPatient.age || 30,
            gender:      currentPatient.gender || 'Male',
            blood:       currentPatient.blood || 'O+',
            time:        new Date().toLocaleTimeString(
                             [], { hour:'2-digit', minute:'2-digit' }
                         ),
            type:        'Follow-up',
            status:      'In Progress',
            complaint:   'Clinical follow-up consultation',
            date:        today
        };
        appts.push(appt);
    } else {
        appt.status = 'In Progress';
    }

    localStorage.setItem(
        'cms_appointments',
        JSON.stringify(appts)
    );
    localStorage.setItem('cms_active_appointment', appt.id);
    window.location.href = 'consultation.html?id=' + appt.id;
}


// ============================================================
// 15. PRESCRIPTIONS PAGE
// ============================================================

var allRx      = [];
var filteredRx = [];


function initPrescriptions() {

    loadRxData();
}


function loadRxData() {

    var stored = JSON.parse(
        localStorage.getItem('cms_prescriptions') || '[]'
    );

    if (!stored || stored.length === 0) {
        stored = DEFAULT_RX;
        localStorage.setItem(
            'cms_prescriptions',
            JSON.stringify(stored)
        );
    }

    allRx = stored;
    filterRx();
    rxUpdateStats();
    updateSidebarBadge();
}


function rxUpdateStats() {

    var el;

    el = document.getElementById('statTotalRx');
    if (el) el.textContent = allRx.length;

    var todayCount = allRx.filter(function (r) {
        return r.date === TODAY;
    }).length;

    el = document.getElementById('statTodayRx');
    if (el) el.textContent = todayCount;

    var pendingCount = allRx.filter(function (r) {
        return r.status === 'Pending Dispensation';
    }).length;

    el = document.getElementById('statPendingRx');
    if (el) el.textContent = pendingCount;

    var dispensedCount = allRx.filter(function (r) {
        return r.status === 'Dispensed';
    }).length;

    el = document.getElementById('statDispensedRx');
    if (el) el.textContent = dispensedCount;
}


function filterRx() {

    var searchEl = document.getElementById('rxSearch');
    var statusEl = document.getElementById('statusFilter');

    var q      = searchEl ? searchEl.value.trim().toLowerCase() : '';
    var status = statusEl ? statusEl.value : '';

    filteredRx = allRx.filter(function (r) {

        var medNames = (r.medicines || []).map(function (m) {
            return m.medicine.toLowerCase();
        }).join(' ');

        var matchQ = !q ||
            r.patientName.toLowerCase().indexOf(q) !== -1 ||
            r.id.toLowerCase().indexOf(q) !== -1 ||
            medNames.indexOf(q) !== -1;

        var matchS = !status || r.status === status;

        return matchQ && matchS;
    });

    rxRenderTable();
}


function rxRenderTable() {

    var tbody = document.getElementById('rxTableBody');
    if (!tbody) return;

    var countLabel = document.getElementById('rxCountLabel');
    if (countLabel) {
        countLabel.textContent = 'Showing ' + filteredRx.length +
            ' of ' + allRx.length + ' prescriptions';
    }

    if (filteredRx.length === 0) {
        tbody.innerHTML =
            '<tr><td colspan="7" style="text-align:center;padding:32px;' +
            'color:var(--text-muted);">No prescriptions found.</td></tr>';
        return;
    }

    tbody.innerHTML = filteredRx.map(function (r) {
        return '<tr>' +
            '<td style="font-family:monospace;font-weight:600;color:var(--accent);">' +
            r.id + '</td>' +
            '<td>' + r.date + '</td>' +
            '<td><div style="font-weight:600;color:var(--text-primary);">' +
            r.patientName + '</div>' +
            '<div style="font-size:11px;color:var(--text-muted);">' +
            (r.patientId || '') + '</div></td>' +
            '<td><div class="med-pill-list">' +
            (r.medicines || []).map(function (m) {
                return '<div class="med-pill">' +
                    '<b>💊 ' + m.medicine + '</b> <span>' +
                    m.dosage + ' (' + m.frequency + ') · ' +
                    m.duration + '</span></div>';
            }).join('') + '</div></td>' +
            '<td>' + (r.doctorName || 'Dr. Arun Kumar') + '</td>' +
            '<td><span class="badge ' +
            (r.status === 'Dispensed' ? 'badge-success' : 'badge-warning') +
            '">' + r.status + '</span></td>' +
            '<td style="text-align:right;">' +
            '<button class="btn btn-outline btn-sm" ' +
            'onclick="viewRxSlip(\'' + r.id + '\')">🖨 View Slip</button>' +
            '</td></tr>';
    }).join('');
}


function viewRxSlip(id) {

    var rx = allRx.find(function (r) {
        return r.id === id;
    });
    if (!rx) return;

    var setEl = function (elId, val) {
        var el = document.getElementById(elId);
        if (el) el.textContent = val;
    };

    setEl('vRxId',    rx.id);
    setEl('vPatient', rx.patientName);
    setEl('vDate',    rx.date);
    setEl('vStatus',  rx.status);
    setEl('vDoc',     rx.doctorName || 'Dr. Arun Kumar');

    var mb = document.getElementById('vMedBody');
    if (mb) {
        mb.innerHTML = (rx.medicines || []).map(function (m, i) {
            return '<tr style="border-bottom:1px solid #f0e9e4;">' +
                '<td style="padding:6px;">' + (i + 1) + '</td>' +
                '<td style="padding:6px;font-weight:600;">' + m.medicine + '</td>' +
                '<td style="padding:6px;">' + m.dosage + '</td>' +
                '<td style="padding:6px;">' + m.frequency + '</td>' +
                '<td style="padding:6px;">' + m.duration + '</td></tr>';
        }).join('');
    }

    var modal = document.getElementById('viewModal');
    if (modal) modal.classList.add('open');
}


function closeModal() {

    var modal = document.getElementById('viewModal');
    if (modal) modal.classList.remove('open');
}


// ============================================================
// 16. LAB TESTS PAGE
// ============================================================

var allLabTests      = [];
var filteredLabTests = [];


function initLabTests() {

    loadLabsData();
}


function loadLabsData() {

    var stored = JSON.parse(
        localStorage.getItem('cms_lab_tests') || '[]'
    );

    if (!stored || stored.length === 0) {
        stored = DEFAULT_LABS;
        localStorage.setItem(
            'cms_lab_tests',
            JSON.stringify(stored)
        );
    }

    allLabTests = stored;
    filterLabTests();
    labUpdateStats();
    updateSidebarBadge();
}


function labUpdateStats() {

    var el;

    el = document.getElementById('statTotalTests');
    if (el) el.textContent = allLabTests.length;

    var pending = allLabTests.filter(function (l) {
        return l.status === 'Pending';
    }).length;

    el = document.getElementById('statPendingTests');
    if (el) el.textContent = pending;

    var completed = allLabTests.filter(function (l) {
        return l.status === 'Completed';
    }).length;

    el = document.getElementById('statCompletedTests');
    if (el) el.textContent = completed;

    var urgent = allLabTests.filter(function (l) {
        return l.priority === 'Urgent';
    }).length;

    el = document.getElementById('statUrgentTests');
    if (el) el.textContent = urgent;
}


function filterLabTests() {

    var searchEl   = document.getElementById('labSearch');
    var statusEl   = document.getElementById('labStatusFilter');
    var priorityEl = document.getElementById('labPriorityFilter');

    var q        = searchEl   ? searchEl.value.trim().toLowerCase() : '';
    var status   = statusEl   ? statusEl.value   : '';
    var priority = priorityEl ? priorityEl.value : '';

    filteredLabTests = allLabTests.filter(function (l) {

        var matchQ = !q ||
            l.patientName.toLowerCase().indexOf(q) !== -1 ||
            l.testName.toLowerCase().indexOf(q) !== -1 ||
            l.id.toLowerCase().indexOf(q) !== -1;

        var matchS = !status   || l.status   === status;
        var matchP = !priority || l.priority === priority;

        return matchQ && matchS && matchP;
    });

    labRenderTable();
}


function labRenderTable() {

    var tbody = document.getElementById('labTableBody');
    if (!tbody) return;

    var countLabel = document.getElementById('labCountLabel');
    if (countLabel) {
        countLabel.textContent = 'Showing ' + filteredLabTests.length +
            ' of ' + allLabTests.length + ' investigations';
    }

    if (filteredLabTests.length === 0) {
        tbody.innerHTML =
            '<tr><td colspan="8" style="text-align:center;padding:32px;' +
            'color:var(--text-muted);">No lab investigations found.</td></tr>';
        return;
    }

    tbody.innerHTML = filteredLabTests.map(function (l) {
        return '<tr>' +
            '<td style="font-family:monospace;font-weight:600;color:var(--accent);">' +
            l.id + '</td>' +
            '<td>' + l.orderDate + '</td>' +
            '<td><div style="font-weight:600;color:var(--text-primary);">' +
            l.patientName + '</div>' +
            '<div style="font-size:11px;color:var(--text-muted);">' +
            (l.patientId || '') + '</div></td>' +
            '<td style="font-weight:600;">🧪 ' + l.testName + '</td>' +
            '<td><span class="badge ' +
            (l.priority === 'Urgent' ? 'priority-urgent' : 'priority-normal') +
            '">' + (l.priority || 'Normal') + '</span></td>' +
            '<td><span class="badge ' +
            (l.status === 'Completed' ? 'badge-success' : 'badge-warning') +
            '">' + l.status + '</span></td>' +
            '<td style="font-size:12px;color:var(--text-secondary);' +
            'max-width:240px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' +
            (l.summary || 'Pending lab processing') + '</td>' +
            '<td style="text-align:right;">' +
            '<button class="btn btn-outline btn-sm" ' +
            'onclick="viewReport(\'' + l.id + '\')">📋 View Report</button>' +
            '</td></tr>';
    }).join('');
}


function viewReport(id) {

    var lab = allLabTests.find(function (l) {
        return l.id === id;
    });
    if (!lab) return;

    var setEl = function (elId, val) {
        var el = document.getElementById(elId);
        if (el) el.textContent = val;
    };

    setEl('repTestTitle', lab.testName);
    setEl('repSub',       'Order ID: ' + lab.id);
    setEl('repPatient',   lab.patientName);
    setEl('repDate',      lab.orderDate);
    setEl('repDoc',       lab.doctorName || 'Dr. Arun Kumar');
    setEl('repPriority',  lab.priority || 'Normal');

    var badge = document.getElementById('repBadge');
    if (badge) {
        badge.textContent = lab.status;
        badge.className   = 'badge ' +
            (lab.status === 'Completed' ? 'badge-success' : 'badge-warning');
    }

    var body = document.getElementById('repBody');
    if (body) {
        body.textContent = lab.summary ||
            'Lab report is in analysis stage. Expected completion within 2 hours.';
    }

    var modal = document.getElementById('reportModal');
    if (modal) modal.classList.add('open');
}


function closeReportModal() {

    var modal = document.getElementById('reportModal');
    if (modal) modal.classList.remove('open');
}


function openOrderModal() {

    var patients = JSON.parse(
        localStorage.getItem('cms_patients') || '[]'
    );

    var sel = document.getElementById('mPatientSelect');
    if (sel) {
        sel.innerHTML = patients.map(function (p) {
            return '<option value="' + p.id + '|' + p.name +
                '">' + p.name + ' (' + p.id + ')</option>';
        }).join('');
    }

    var modal = document.getElementById('orderModal');
    if (modal) modal.classList.add('open');
}


function closeOrderModal() {

    var modal = document.getElementById('orderModal');
    if (modal) modal.classList.remove('open');
}


function submitNewLabOrder(e) {

    e.preventDefault();

    var patVal   = document.getElementById('mPatientSelect').value.split('|');
    var patId    = patVal[0];
    var patName  = patVal[1];
    var testName = document.getElementById('mTestSelect').value;
    var priority = document.getElementById('mPriority').value;
    var notes    = document.getElementById('mIndication').value.trim();

    var newOrder = {
        id:          'LAB-' + Date.now(),
        orderDate:   TODAY,
        patientId:   patId,
        patientName: patName,
        testName:    testName,
        priority:    priority,
        status:      'Pending',
        doctorName:  loggedInUser.name || 'Dr. Arun Kumar',
        summary:     notes
            ? 'Clinical note: ' + notes
            : 'Test order sent to central diagnostic facility.'
    };

    allLabTests.unshift(newOrder);
    localStorage.setItem(
        'cms_lab_tests',
        JSON.stringify(allLabTests)
    );

    closeOrderModal();
    filterLabTests();
    labUpdateStats();
}


// ============================================================
// 17. AUTO-INIT ON PAGE LOAD
// ============================================================

document.addEventListener('DOMContentLoaded', function () {

    // Seed data if needed
    seedAllData();

    // Common UI
    initDoctorUI();
    initDateLabel();

    // Detect page and run the correct initializer
    var page = getCurrentPage();

    switch (page) {

        case 'dashboard.html':
            initDashboard();
            break;

        case 'appointments.html':
            initAppointments();
            break;

        case 'consultation.html':
            initConsultation();
            break;

        case 'patients.html':
            initPatients();
            break;

        case 'patient-details.html':
            initPatientDetails();
            break;

        case 'prescriptions.html':
            initPrescriptions();
            break;

        case 'lab-tests.html':
            initLabTests();
            break;

        default:
            break;
    }
});
