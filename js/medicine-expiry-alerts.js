(function () {
    'use strict';

    const SETTING_KEY = 'cms_medicine_near_expiry_alert_days';

    function getTodayUtc() {
        const today = new Date();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        return Date.parse(today.getFullYear() + '-' + month + '-' + day + 'T00:00:00Z');
    }

    function getAlertDays() {
        const configuredDays = Number(localStorage.getItem(SETTING_KEY));
        return Number.isInteger(configuredDays) && configuredDays >= 1 && configuredDays <= 3650
            ? configuredDays
            : 30;
    }

    function appendText(parent, tagName, className, text) {
        const element = document.createElement(tagName);
        element.className = className;
        element.textContent = text;
        parent.appendChild(element);
        return element;
    }

    function renderMedicineExpiryAlerts(containerId, medicineMasterUrl) {
        const container = document.getElementById(containerId);
        if (!container) return;
        container.textContent = '';

        try {
            const rawMedicines = localStorage.getItem('cms_medicines') || '[]';
            const medicines = JSON.parse(rawMedicines);
            if (!Array.isArray(medicines)) {
                throw new TypeError('Medicine data must be a list.');
            }

            const todayUtc = getTodayUtc();
            const alertDays = getAlertDays();
            const alerts = medicines.reduce((result, medicine) => {
                if (!medicine || !medicine.expiryDate || Number(medicine.stock) <= 0) return result;

                const expiryUtc = Date.parse(medicine.expiryDate + 'T00:00:00Z');
                if (!Number.isFinite(expiryUtc)) return result;
                const daysUntilExpiry = (expiryUtc - todayUtc) / 86400000;
                if (daysUntilExpiry > alertDays) return result;

                result.push({ medicine, daysUntilExpiry });
                return result;
            }, []).sort((left, right) => left.daysUntilExpiry - right.daysUntilExpiry);

            if (alerts.length === 0) {
                appendText(container, 'p', 'medicine-expiry-empty', 'No medicines are expired or within the next ' + alertDays + ' days of expiry.');
            } else {
                alerts.forEach(({ medicine, daysUntilExpiry }) => {
                    const isExpired = daysUntilExpiry <= 0;
                    const item = document.createElement('li');
                    item.className = 'medicine-expiry-alert-item' + (isExpired ? ' is-expired' : '');

                    const details = document.createElement('div');
                    details.className = 'medicine-expiry-alert-details';
                    appendText(details, 'strong', '', medicine.name || 'Unnamed medicine');
                    const metadata = [medicine.id, medicine.batchNo ? 'Batch ' + medicine.batchNo : '']
                        .filter(Boolean)
                        .join(' · ');
                    if (metadata) appendText(details, 'small', '', metadata);
                    item.appendChild(details);

                    const message = isExpired
                        ? 'Expired'
                        : 'Expires in ' + daysUntilExpiry + (daysUntilExpiry === 1 ? ' day' : ' days');
                    appendText(item, 'span', 'medicine-expiry-alert-label', message);
                    container.appendChild(item);
                });
            }

            const footer = document.createElement('div');
            footer.className = 'medicine-expiry-alert-footer';
            appendText(footer, 'span', '', 'Near-expiry alert window: ' + alertDays + ' days');
            const link = document.createElement('a');
            link.href = medicineMasterUrl;
            link.textContent = 'View medicine inventory';
            footer.appendChild(link);
            container.appendChild(footer);
        } catch (error) {
            console.error('Unable to load medicine expiry alerts:', error);
            appendText(container, 'p', 'medicine-expiry-error', 'Medicine expiry alerts could not be loaded. Please check the medicine data and try again.');
        }
    }

    window.renderMedicineExpiryAlerts = renderMedicineExpiryAlerts;
}());
