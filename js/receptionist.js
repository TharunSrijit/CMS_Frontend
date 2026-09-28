/* ============ CONFIG ============ */
const API = 'http://127.0.0.1:8000';          // change to your Django server URL
const R = '/api/receptionist/';

/* ============ HELPERS ============ */
const $ = (s, r = document) => r.querySelector(s);
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const today = () => { const d = new Date(); return new Date(d - d.getTimezoneOffset()*6e4).toISOString().slice(0,10); };
const money = n => '₹' + Number(n || 0).toFixed(2);
const list = d => Array.isArray(d) ? d : (d && d.results) || [];
const tag = s => `<span class="tag ${esc(s)}">${esc(String(s).replace('_',' '))}</span>`;
const time = t => t ? t.slice(0,5) : '—';

function toast(msg, bad) {
  const d = document.createElement('div'); d.textContent = msg; if (bad) d.className = 'err';
  $('#toast').append(d); setTimeout(() => d.remove(), 3500);
}
function errText(e) {
  if (typeof e === 'string') return e;
  if (e && typeof e === 'object') return Object.entries(e).map(([k, v]) => `${k === 'detail' || k === 'non_field_errors' ? '' : k + ': '}${Array.isArray(v) ? v.join(' ') : v}`).join(' | ');
  return 'Something went wrong.';
}
const store = {
  get: k => localStorage.getItem('fd_' + k), set: (k, v) => localStorage.setItem('fd_' + k, v),
  clear: () => Object.keys(localStorage).filter(k => k.startsWith('fd_')).forEach(k => localStorage.removeItem(k))
};

async function api(path, { method = 'GET', body, auth = true, base = R } = {}, retry = true) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth) headers.Authorization = 'Bearer ' + store.get('access');
  let res;
  try { res = await fetch(API + base + path, { method, headers, body: body ? JSON.stringify(body) : undefined }); }
  catch { throw 'Cannot reach the server. Check that Django is running and CORS is enabled.'; }
  if (res.status === 401 && auth && retry && await refresh()) return api(path, { method, body, auth, base }, false);
  if (res.status === 401 && auth) { signOut(); throw 'Session expired. Please sign in again.'; }
  const data = res.status === 204 ? null : await res.json().catch(() => null);
  if (!res.ok) throw data ? errText(data) : `Request failed (${res.status}).`;
  return data;
}
async function refresh() {
  try {
    const r = await fetch(API + '/api/auth/token/refresh/', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ refresh: store.get('refresh') }) });
    if (!r.ok) return false;
    store.set('access', (await r.json()).access); return true;
  } catch { return false; }
}
const qs = o => { const p = new URLSearchParams(Object.entries(o).filter(([, v]) => v !== '' && v != null)); return p.toString() ? '?' + p : ''; };

function modal(html) {
  const m = $('#modal'); m.innerHTML = `<div class="card">${html}</div>`; m.classList.remove('hide');
  m.onclick = e => { if (e.target === m) closeModal(); };
}
const closeModal = () => $('#modal').classList.add('hide');
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

/* ============ AUTH ============ */
$('#loginForm').onsubmit = async e => {
  e.preventDefault(); $('#loginErr').textContent = '';
  try {
    const d = await api('/api/auth/login/', { method: 'POST', auth: false, base: '', body: { username: $('#lu').value, password: $('#lp').value } });
    if (d.role !== 'RECEPTIONIST' && d.role !== 'ADMIN') throw 'This screen is for receptionist accounts.';
    store.set('access', d.access); store.set('refresh', d.refresh);
    store.set('name', d.full_name || d.username); start();
  } catch (err) { $('#loginErr').textContent = errText(err); }
};
function signOut() {
  const r = store.get('refresh'), a = store.get('access');
  if (r) fetch(API + '/api/auth/logout/', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + a }, body: JSON.stringify({ refresh: r }) }).catch(() => {});
  store.clear(); clearInterval(timer);
  $('#app').classList.add('hide'); $('#login').classList.remove('hide');
}
$('#logout').onclick = signOut;

/* ============ ROUTER (one HTML file per screen) ============ */
const FILE = { dashboard: 'dashboard.html', register: 'register-patient.html', search: 'search-patient.html', book: 'book-appointment.html', today: 'appointments.html', queue: 'token-queue.html', billing: 'billing.html', patient: 'patient-details.html' };
let timer;
const page = document.body.dataset.page, P = new URLSearchParams(location.search);
const pages = { dashboard, register, search, book, today: todayAppts, queue, billing, patient: patientPage };
function start() {
  $('#login').classList.add('hide'); $('#app').classList.remove('hide');
  $('#whoName').textContent = store.get('name');
  document.querySelectorAll('#nav [data-p]').forEach(l => l.classList.toggle('on', l.dataset.p === (page === 'patient' ? 'search' : page)));
  pages[page](P.get('id'));
}
function go(p, arg) {
  if (p === page && arg === undefined) return location.reload();
  location.href = FILE[p] + (arg ? '?id=' + arg : '');
}
const view = h => { $('#view').innerHTML = h; };
const loading = () => view('<div class="empty">Loading…</div>');
const fail = e => view(`<div class="card empty">${esc(errText(e))}<br><br><button class="btn ghost" onclick="go(page)">Try again</button></div>`);

/* ============ 1. DASHBOARD ============ */
async function dashboard() {
  loading();
  try {
    const [appts, tokens, inv] = await Promise.all([
      api('appointments/' + qs({ date: today() })), api('tokens/'), api('consultation-invoices/')]);
    const a = list(appts), t = list(tokens), i = list(inv);
    const cnt = (arr, s) => arr.filter(x => x.status === s).length;
    const serving = t.filter(x => x.status === 'CALLED').map(x => '#' + x.token_number).join(', ') || 'None';
    const next = a.filter(x => ['BOOKED', 'CONFIRMED'].includes(x.status));
    view(`<h1>Good ${new Date().getHours() < 12 ? 'morning' : 'day'}, ${esc(store.get('name'))}</h1>
    <p class="sub">${new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}</p>
    <div class="grid g4" style="margin-bottom:18px">
      <div class="card stat"><b>${a.length}</b><span>Appointments today</span></div>
      <div class="card stat"><b>${cnt(t, 'WAITING')}</b><span>Patients waiting</span></div>
      <div class="card stat"><b>${esc(serving)}</b><span>Now serving</span></div>
      <div class="card stat"><b>${i.filter(x => x.status !== 'PAID' && x.status !== 'CANCELLED').length}</b><span>Unpaid invoices</span></div>
    </div>
    <div class="grid g2">
      <div class="card"><h2>Still to arrive</h2>${next.length ? `<div class="tw"><table><tr><th>Time</th><th>Patient</th><th>Doctor</th></tr>${next.slice(0, 8).map(x => `<tr><td>${time(x.appointment_time)}</td><td>${esc(x.patient_name)}</td><td>${esc(x.doctor_name)}</td></tr>`).join('')}</table></div>` : '<div class="empty">Nobody left to arrive today.</div>'}</div>
      <div class="card"><h2>Quick actions</h2><div class="bar">
        <button class="btn" onclick="go('register')">Register patient</button>
        <button class="btn" onclick="go('book')">Book appointment</button>
        <button class="btn ghost" onclick="go('queue')">Open queue</button>
        <button class="btn ghost" onclick="go('billing')">Billing</button></div>
        <p class="sub" style="margin:0">Completed today: ${cnt(a, 'COMPLETED')} · Cancelled: ${cnt(a, 'CANCELLED')} · No-show: ${cnt(a, 'NO_SHOW')}</p></div>
    </div>`);
  } catch (e) { fail(e); }
}

/* ============ 2. REGISTER PATIENT ============ */
function register() {
  view(`<h1>Register patient</h1><p class="sub">A patient ID is generated when you save.</p>
  <form class="card" id="pf">
    <div class="row"><div><label>First name *</label><input name="first_name" required></div>
      <div><label>Last name *</label><input name="last_name" required></div>
      <div><label>Phone *</label><input name="phone" type="tel" required pattern="[0-9+ \\-]{7,15}" title="7–15 digits"></div></div>
    <div class="row"><div><label>Gender *</label><select name="gender" required><option value="">Select</option><option value="MALE">Male</option><option value="FEMALE">Female</option><option value="OTHER">Other</option></select></div>
      <div><label>Date of birth</label><input name="date_of_birth" type="date" max="${today()}"></div>
      <div><label>Blood group</label><select name="blood_group"><option value="">Unknown</option>${['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(b => `<option>${b}</option>`).join('')}</select></div></div>
    <div class="row"><div><label>Email</label><input name="email" type="email"></div>
      <div><label>Emergency contact name</label><input name="emergency_contact_name"></div>
      <div><label>Emergency contact phone</label><input name="emergency_contact_phone" type="tel"></div></div>
    <div style="margin-bottom:14px"><label>Address</label><textarea name="address" rows="2"></textarea></div>
    <button class="btn">Register patient</button><div class="err-txt" id="pfErr"></div>
  </form>`);
  $('#pf').onsubmit = async e => {
    e.preventDefault(); $('#pfErr').textContent = '';
    const body = Object.fromEntries(new FormData(e.target)); if (!body.date_of_birth) delete body.date_of_birth;
    try {
      const p = await api('patients/', { method: 'POST', body });
      toast('Registered ' + p.patient_id);
      modal(`<h2>Patient registered</h2><p><b>${esc(p.first_name)} ${esc(p.last_name)}</b><br>Patient ID <b>${esc(p.patient_id)}</b></p>
        <div class="bar"><button class="btn" onclick="closeModal();go('book',${p.id})">Book appointment</button>
        <button class="btn ghost" onclick="closeModal();go('register')">Register another</button></div>`);
    } catch (err) { $('#pfErr').textContent = errText(err); }
  };
}

/* ============ 3. SEARCH PATIENT ============ */
function search() {
  view(`<h1>Search patient</h1><p class="sub">Search by name, phone number or patient ID.</p>
  <div class="bar"><input id="sq" placeholder="e.g. Priya, 98450…, PAT0012" autofocus style="min-width:320px"></div>
  <div class="card"><div id="sres"><div class="empty">Type to search patients.</div></div></div>`);
  let t; $('#sq').oninput = e => { clearTimeout(t); t = setTimeout(runSearch, 300); };
  runSearch();
}
async function runSearch() {
  const q = $('#sq').value.trim(), box = $('#sres');
  try {
    const rows = list(await api('patients/' + qs({ search: q })));
    box.innerHTML = rows.length ? `<div class="tw"><table><tr><th>ID</th><th>Name</th><th>Phone</th><th>Gender</th><th>DOB</th></tr>${rows.slice(0, 50).map(p => `<tr class="click" onclick="go('patient',${p.id})"><td>${esc(p.patient_id)}</td><td>${esc(p.first_name)} ${esc(p.last_name)}</td><td>${esc(p.phone)}</td><td>${esc(p.gender)}</td><td>${esc(p.date_of_birth || '—')}</td></tr>`).join('')}</table></div>` : `<div class="empty">No patient matches “${esc(q)}”. <a href="#" onclick="go('register');return false">Register a new patient</a></div>`;
  } catch (e) { box.innerHTML = `<div class="empty">${esc(errText(e))}</div>`; }
}
async function patientPage(id) {
  if (!id) return view('<div class="card empty">No patient selected. <a href="search-patient.html">Search for a patient</a></div>');
  loading();
  try {
    const [p, hist, appts] = await Promise.all([api(`patients/${id}/`), api('medical-history/' + qs({ patient: id })), api('appointments/' + qs({ patient: id }))]);
    view(`<a class="back" href="search-patient.html">Back to search</a>
    <h1>${esc(p.first_name)} ${esc(p.last_name)}</h1>
    <p class="sub">${esc(p.patient_id)} · ${esc(p.gender)}${p.blood_group ? ' · ' + esc(p.blood_group) : ''}${p.date_of_birth ? ' · born ' + esc(p.date_of_birth) : ''}</p>
    <div class="bar"><button class="btn" onclick="go('book',${p.id})">Book appointment</button></div>
    <div class="grid g2">
      <div class="card"><h2>Contact</h2><p style="margin:0">${esc(p.phone)}${p.email ? '<br>' + esc(p.email) : ''}${p.address ? '<br>' + esc(p.address) : ''}
        ${p.emergency_contact_name ? '<br><br>Emergency contact: ' + esc(p.emergency_contact_name) + ' ' + esc(p.emergency_contact_phone) : ''}</p></div>
      <div class="card"><h2>Medical history</h2>
        ${list(hist).length ? list(hist).map(h => `<div style="padding:6px 0;border-bottom:1px solid var(--line)"><b>${esc(h.medical_condition)}</b>${h.allergies ? '<br>Allergies: ' + esc(h.allergies) : ''}${h.current_medications ? '<br>Medications: ' + esc(h.current_medications) : ''}</div>`).join('') : '<div class="sub" style="margin:0 0 8px">Nothing recorded yet.</div>'}
        <form id="hf" class="row" style="margin:12px 0 0"><div><label>Condition *</label><input name="medical_condition" required></div><div><label>Allergies</label><input name="allergies"></div>
        <div style="align-self:end"><button class="btn sm">Add history</button></div></form></div>
    </div>
    <div class="card" style="margin-top:16px"><h2>Appointments</h2>${list(appts).length ? `<div class="tw"><table><tr><th>Date</th><th>Time</th><th>Doctor</th><th>Status</th></tr>${list(appts).map(a => `<tr><td>${esc(a.appointment_date)}</td><td>${time(a.appointment_time)}</td><td>${esc(a.doctor_name)}</td><td>${tag(a.status)}</td></tr>`).join('')}</table></div>` : '<div class="empty">No appointments yet.</div>'}</div>`);
    $('#hf').onsubmit = async e => {
      e.preventDefault();
      try { await api('medical-history/', { method: 'POST', body: { patient: +id, ...Object.fromEntries(new FormData(e.target)) } }); toast('History added'); patientPage(id); }
      catch (err) { toast(errText(err), 1); }
    };
  } catch (e) { fail(e); }
}

/* ============ 4. BOOK APPOINTMENT ============ */
async function book(patientId) {
  loading();
  try {
    const docs = list(await api('doctors/'));
    let chosen = null;
    if (patientId) chosen = await api(`patients/${patientId}/`);
    view(`<h1>Book appointment</h1><p class="sub">Pick the patient, doctor and a free time.</p>
    <form class="card" id="bf">
      <div class="row"><div><label>Patient *</label><input id="bp" placeholder="Search name, phone or ID" autocomplete="off"><div id="bpd" class="dd hide"></div>
        <div id="bpc" style="margin-top:6px"></div></div>
      <div><label>Doctor *</label><select id="bd" required><option value="">Select doctor</option>${docs.map(d => `<option value="${d.id}" data-fee="${d.consultation_fee}" data-from="${d.available_from || ''}" data-to="${d.available_to || ''}">${esc(d.full_name || d.doctor_id)} — ${esc(d.specialization)}</option>`).join('')}</select>
        <div class="sub" id="bdi" style="margin:4px 0 0;font-size:13px"></div></div></div>
      <div class="row"><div><label>Date *</label><input id="bdt" type="date" min="${today()}" value="${today()}" required></div>
        <div><label>Time *</label><input id="bt" type="time" required><div id="bs" class="slots"></div></div></div>
      <div style="margin-bottom:14px"><label>Reason for visit</label><textarea id="br" rows="2"></textarea></div>
      <button class="btn">Book appointment</button><div class="err-txt" id="bErr"></div>
    </form>`);
    const setPatient = p => { chosen = p; $('#bpc').innerHTML = p ? `<span class="tag CONFIRMED">${esc(p.patient_id)} · ${esc(p.first_name)} ${esc(p.last_name)}</span>` : ''; $('#bpd').classList.add('hide'); $('#bp').value = ''; };
    setPatient(chosen);
    let t; $('#bp').oninput = e => {
      clearTimeout(t); const q = e.target.value.trim(); if (!q) return $('#bpd').classList.add('hide');
      t = setTimeout(async () => {
        const r = list(await api('patients/' + qs({ search: q }))).slice(0, 8), d = $('#bpd');
        d.innerHTML = r.length ? r.map(p => `<div data-id="${p.id}">${esc(p.patient_id)} · ${esc(p.first_name)} ${esc(p.last_name)} · ${esc(p.phone)}</div>`).join('') : '<div>No match</div>';
        d.classList.remove('hide'); d.onclick = ev => { const p = r.find(x => x.id == ev.target.dataset.id); if (p) setPatient(p); };
      }, 300);
    };
    const slots = async () => {
      const d = $('#bd').value, dt = $('#bdt').value, o = $('#bd').selectedOptions[0];
      $('#bdi').textContent = d && o.dataset.from ? `Available ${time(o.dataset.from)}–${time(o.dataset.to)} · Fee ${money(o.dataset.fee)}` : d ? `Fee ${money(o.dataset.fee)}` : '';
      if (!d || !dt) return $('#bs').innerHTML = '';
      const taken = list(await api('appointments/' + qs({ doctor: d, date: dt }))).filter(a => !['CANCELLED', 'NO_SHOW'].includes(a.status));
      $('#bs').innerHTML = taken.length ? 'Already booked: ' + taken.map(a => `<span class="tag">${time(a.appointment_time)}</span>`).join('') : '<span class="sub" style="font-size:13px">No bookings yet for this day.</span>';
    };
    $('#bd').onchange = $('#bdt').onchange = slots;
    $('#bf').onsubmit = async e => {
      e.preventDefault(); $('#bErr').textContent = '';
      if (!chosen) return $('#bErr').textContent = 'Choose a patient first.';
      const o = $('#bd').selectedOptions[0];
      if (o.dataset.from && ($('#bt').value < o.dataset.from.slice(0, 5) || $('#bt').value > o.dataset.to.slice(0, 5))) return $('#bErr').textContent = `Pick a time between ${time(o.dataset.from)} and ${time(o.dataset.to)}.`;
      try {
        await api('appointments/', { method: 'POST', body: { patient: chosen.id, doctor: +$('#bd').value, appointment_date: $('#bdt').value, appointment_time: $('#bt').value, reason: $('#br').value } });
        toast('Appointment booked'); go('today');
      } catch (err) { $('#bErr').textContent = errText(err); }
    };
    slots();
  } catch (e) { fail(e); }
}

/* ============ 5. TODAY'S APPOINTMENTS ============ */
let apptFilter = '';
async function todayAppts() {
  loading();
  try {
    const rows = list(await api('appointments/' + qs({ date: today() })));
    const shown = rows.filter(a => !apptFilter || a.status === apptFilter);
    view(`<h1>Today's appointments</h1><p class="sub">Check patients in as they arrive — that issues their queue token.</p>
    <div class="bar"><select id="af"><option value="">All statuses</option>${['BOOKED', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'].map(s => `<option value="${s}" ${s === apptFilter ? 'selected' : ''}>${s.replace('_', ' ')}</option>`).join('')}</select>
    <button class="btn" onclick="go('book')">Book appointment</button></div>
    <div class="card">${shown.length ? `<div class="tw"><table><tr><th>Time</th><th>Patient</th><th>Doctor</th><th>Reason</th><th>Status</th><th></th></tr>${shown.map(a => `<tr><td>${time(a.appointment_time)}</td><td>${esc(a.patient_name)}</td><td>${esc(a.doctor_name)}</td><td>${esc(a.reason || '—')}</td><td>${tag(a.status)}</td><td>
      ${a.status === 'BOOKED' ? `<button class="btn sm" onclick="checkIn(${a.id})">Check in</button>` : ''}
      ${['BOOKED', 'CONFIRMED'].includes(a.status) ? `<button class="btn sm ghost" onclick="setStatus(${a.id},'cancel')">Cancel</button><button class="btn sm ghost" onclick="setStatus(${a.id},'NO_SHOW')">No-show</button>` : ''}
      ${a.status === 'COMPLETED' ? `<button class="btn sm ghost" onclick="go('billing',${a.id})">Bill</button>` : ''}</td></tr>`).join('')}</table></div>` : '<div class="empty">No appointments to show.</div>'}</div>`);
    $('#af').onchange = e => { apptFilter = e.target.value; todayAppts(); };
  } catch (e) { fail(e); }
}
async function checkIn(id) {
  try { const t = await api(`appointments/${id}/check_in/`, { method: 'POST' }); toast('Checked in — token #' + t.token_number); todayAppts(); }
  catch (e) { toast(errText(e), 1); }
}
async function setStatus(id, s) {
  if (!confirm(s === 'cancel' ? 'Cancel this appointment?' : 'Mark this patient as a no-show?')) return;
  try {
    if (s === 'cancel') await api(`appointments/${id}/cancel/`, { method: 'POST' });
    else await api(`appointments/${id}/`, { method: 'PATCH', body: { status: s } });
    toast('Appointment updated'); todayAppts();
  } catch (e) { toast(errText(e), 1); }
}

/* ============ 6. TOKEN QUEUE ============ */
async function queue() {
  const draw = async () => {
    try {
      const t = list(await api('tokens/' + qs({ date: today() })));
      const called = t.filter(x => x.status === 'CALLED'), waiting = t.filter(x => x.status === 'WAITING'), done = t.filter(x => ['COMPLETED', 'CANCELLED'].includes(x.status));
      const row = x => `<div class="q"><div class="n">#${x.token_number}</div><div class="i"><b>${esc(x.patient_name)}</b><br><span class="sub" style="margin:0">${esc(x.doctor_name)}</span></div>${tag(x.status)}
        ${x.status === 'WAITING' ? `<button class="btn sm" onclick="tk(${x.id},'call_next')">Call</button>` : ''}${x.status === 'CALLED' ? `<button class="btn sm" onclick="tk(${x.id},'complete')">Complete</button>` : ''}</div>`;
      view(`<h1>Token queue</h1><p class="sub">Refreshes every 15 seconds.</p>
      <div class="now"><div><small>Now serving</small><div class="num">${called.length ? '#' + called[0].token_number : '—'}</div></div>
        <div>${called.length ? `<b>${esc(called[0].patient_name)}</b><br><small>${esc(called[0].doctor_name)}</small>` : '<small>No patient has been called.</small>'}</div>
        <div style="margin-left:auto"><small>Waiting</small><div style="font:700 34px var(--f-head)">${waiting.length}</div></div></div>
      <div class="grid g2"><div class="card"><h2>Called</h2>${called.map(row).join('') || '<div class="empty">Nobody called.</div>'}<h2 style="margin-top:20px">Waiting</h2>${waiting.map(row).join('') || '<div class="empty">Queue is empty.</div>'}</div>
      <div class="card"><h2>Finished</h2>${done.map(row).join('') || '<div class="empty">Nothing finished yet.</div>'}</div></div>`);
    } catch (e) { fail(e); }
  };
  loading(); await draw(); timer = setInterval(() => { if ($('#modal').classList.contains('hide')) draw(); }, 15000);
}
async function tk(id, act) {
  try { await api(`tokens/${id}/${act}/`, { method: 'POST' }); queue(); } catch (e) { toast(errText(e), 1); }
}

/* ============ 7. BILLING ============ */
let invFilter = '';
async function billing(apptId) {
  loading();
  try {
    const [inv, pays, appts] = await Promise.all([api('consultation-invoices/' + qs({ status: invFilter })), api('consultation-payments/'), api('appointments/')]);
    const paid = {}; list(pays).forEach(p => paid[p.invoice] = (paid[p.invoice] || 0) + Number(p.amount));
    const invoices = list(inv), allInv = list(invFilter ? await api('consultation-invoices/') : inv);
    const billed = new Set(allInv.map(i => i.appointment));
    const billable = list(appts).filter(a => !billed.has(a.id) && ['CONFIRMED', 'COMPLETED'].includes(a.status));
    window._inv = invoices; window._paid = paid;
    view(`<h1>Billing</h1><p class="sub">Raise consultation invoices and take payments.</p>
    <div class="bar"><button class="btn" id="ni">New invoice</button>
      <select id="if"><option value="">All invoices</option>${['PENDING', 'PARTIAL', 'PAID', 'CANCELLED'].map(s => `<option value="${s}" ${s === invFilter ? 'selected' : ''}>${s}</option>`).join('')}</select></div>
    <div class="card">${invoices.length ? `<div class="tw"><table><tr><th>Invoice</th><th>Patient</th><th>Total</th><th>Paid</th><th>Balance</th><th>Status</th><th></th></tr>${invoices.map(i => { const p = paid[i.id] || 0, bal = Math.max(0, i.total_amount - p); return `<tr><td>${esc(i.invoice_number)}</td><td>${esc(i.patient_name)}</td><td>${money(i.total_amount)}</td><td>${money(p)}</td><td>${money(bal)}</td><td>${tag(i.status)}</td><td>${bal > 0 && i.status !== 'CANCELLED' ? `<button class="btn sm" onclick="payModal(${i.id})">Take payment</button>` : ''}<button class="btn sm ghost" onclick="receipt(${i.id})">Receipt</button></td></tr>`; }).join('')}</table></div>` : '<div class="empty">No invoices yet.</div>'}</div>`);
    $('#if').onchange = e => { invFilter = e.target.value; billing(); };
    const openNew = async pre => {
      const docs = list(await api('doctors/')), fee = a => { const d = docs.find(d => d.id == a.doctor); return d ? d.consultation_fee : 0; };
      modal(`<h2>New consultation invoice</h2>${billable.length ? `<form id="nf"><div style="margin-bottom:12px"><label>Appointment *</label><select id="na" required><option value="">Select appointment</option>${billable.map(a => `<option value="${a.id}" ${a.id == pre ? 'selected' : ''}>${esc(a.appointment_date)} · ${esc(a.patient_name)} · ${esc(a.doctor_name)}</option>`).join('')}</select></div>
        <div class="row"><div><label>Fee</label><input id="nfee" type="number" min="0" step="0.01"></div><div><label>Discount</label><input id="nd" type="number" min="0" step="0.01" value="0"></div><div><label>Tax</label><input id="nt" type="number" min="0" step="0.01" value="0"></div></div>
        <p>Total: <b id="ntot">₹0.00</b></p><div class="bar"><button class="btn">Create invoice</button><button type="button" class="btn ghost" onclick="closeModal()">Cancel</button></div><div class="err-txt" id="nErr"></div></form>` : '<div class="empty">No confirmed or completed appointments waiting for an invoice.</div><button class="btn ghost" onclick="closeModal()">Close</button>'}`);
      if (!billable.length) return;
      const calc = () => $('#ntot').textContent = money(Math.max(0, $('#nfee').value - $('#nd').value + +$('#nt').value));
      $('#na').onchange = () => { const a = billable.find(a => a.id == $('#na').value); $('#nfee').value = a ? fee(a) : ''; calc(); };
      ['nfee', 'nd', 'nt'].forEach(i => $('#' + i).oninput = calc); $('#na').onchange();
      $('#nf').onsubmit = async e => {
        e.preventDefault();
        try { await api('consultation-invoices/', { method: 'POST', body: { appointment: +$('#na').value, consultation_fee: $('#nfee').value, discount: $('#nd').value || 0, tax: $('#nt').value || 0 } }); closeModal(); toast('Invoice created'); billing(); }
        catch (err) { $('#nErr').textContent = errText(err); }
      };
    };
    $('#ni').onclick = () => openNew();
    if (apptId) openNew(apptId);
  } catch (e) { fail(e); }
}
function payModal(id) {
  const i = window._inv.find(x => x.id === id), bal = Math.max(0, i.total_amount - (window._paid[id] || 0));
  modal(`<h2>Take payment</h2><p style="margin-top:0">${esc(i.invoice_number)} · ${esc(i.patient_name)}<br>Balance due <b>${money(bal)}</b></p>
    <form id="pf2"><div class="row"><div><label>Amount *</label><input id="pa" type="number" min="0.01" max="${bal}" step="0.01" value="${bal.toFixed(2)}" required></div>
    <div><label>Method *</label><select id="pm"><option value="CASH">Cash</option><option value="CARD">Card</option><option value="UPI">UPI</option><option value="ONLINE">Online</option></select></div></div>
    <div style="margin-bottom:12px" id="tx" class="hide"><label>Transaction ID</label><input id="pt"></div>
    <div class="bar"><button class="btn">Record payment</button><button type="button" class="btn ghost" onclick="closeModal()">Cancel</button></div><div class="err-txt" id="pErr"></div></form>`);
  $('#pm').onchange = () => $('#tx').classList.toggle('hide', $('#pm').value === 'CASH');
  $('#pf2').onsubmit = async e => {
    e.preventDefault();
    try { await api('consultation-payments/', { method: 'POST', body: { invoice: id, amount: $('#pa').value, payment_method: $('#pm').value, transaction_id: $('#pt').value } }); closeModal(); toast('Payment recorded'); billing(); }
    catch (err) { $('#pErr').textContent = errText(err); }
  };
}
function receipt(id) {
  const i = window._inv.find(x => x.id === id), p = window._paid[id] || 0;
  modal(`<div id="receipt"><h2>Consultation receipt</h2><p>${esc(i.invoice_number)} · ${new Date(i.created_at).toLocaleDateString()}<br>${esc(i.patient_name)}</p>
    <table><tr><td>Consultation fee</td><td>${money(i.consultation_fee)}</td></tr><tr><td>Discount</td><td>− ${money(i.discount)}</td></tr><tr><td>Tax</td><td>${money(i.tax)}</td></tr>
    <tr><td><b>Total</b></td><td><b>${money(i.total_amount)}</b></td></tr><tr><td>Paid</td><td>${money(p)}</td></tr><tr><td>Balance</td><td>${money(Math.max(0, i.total_amount - p))}</td></tr></table></div>
    <div class="bar" style="margin-top:14px"><button class="btn" onclick="window.print()">Print</button><button class="btn ghost" onclick="closeModal()">Close</button></div>`);
}

/* ============ BOOT ============ */
if (store.get('access')) start();
