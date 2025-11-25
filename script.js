let machines = [
    { id: 1, name: 'Mesin Cuci P1', status: 'available', type: 'perempuan' },
    { id: 2, name: 'Mesin Cuci P2', status: 'available', type: 'perempuan' },
    { id: 3, name: 'Mesin Cuci P3', status: 'available', type: 'perempuan' },
    { id: 4, name: 'Mesin Cuci P4', status: 'available', type: 'perempuan' },
    { id: 5, name: 'Mesin Cuci P5', status: 'available', type: 'perempuan' },
    { id: 6, name: 'Mesin Cuci P6', status: 'available', type: 'perempuan' },
    { id: 7, name: 'Mesin Cuci P7', status: 'available', type: 'perempuan' },
    { id: 8, name: 'Mesin Cuci L1', status: 'available', type: 'laki-laki' },
    { id: 9, name: 'Mesin Cuci L2', status: 'available', type: 'laki-laki' },
    { id: 10, name: 'Mesin Cuci L3', status: 'available', type: 'laki-laki' },
    { id: 11, name: 'Mesin Cuci L4', status: 'available', type: 'laki-laki' },
    { id: 12, name: 'Mesin Cuci L5', status: 'available', type: 'laki-laki' }
];

let bookings = [];
let reports = [];
let selectedMachineId = null;
let selectedTime = null;
let currentFinishBookingId = null;

const timeSlots = ['00:00', '02:00', '04:00', '06:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00'];

function renderMachines() {
    const container = document.getElementById('machinesContainer');
    container.innerHTML = '';

    ['perempuan', 'laki-laki'].forEach(type => {
        const typeMachines = machines.filter(m => m.type === type);
        const available = typeMachines.filter(m => {
            const booking = bookings.find(b => b.machineId === m.id && (b.status === 'booked' || b.status === 'in-use'));
            return !booking;
        }).length;
        const booked = typeMachines.filter(m => {
            const booking = bookings.find(b => b.machineId === m.id && b.status === 'booked');
            return booking;
        }).length;
        const inUse = typeMachines.filter(m => {
            const booking = bookings.find(b => b.machineId === m.id && b.status === 'in-use');
            return booking;
        }).length;

        const section = document.createElement('div');
        section.className = 'area-section';
        section.innerHTML = `
            <div class="area-header">
                <div class="area-title">${type === 'perempuan' ? '👩 Area Perempuan' : '👨 Area Laki-laki'} (${typeMachines.length} Mesin)</div>
                <div class="area-summary">
                    <span class="summary-badge status-available">${available} Tersedia</span>
                    <span class="summary-badge status-booked">${booked} Terbooking</span>
                    <span class="summary-badge status-in-use">${inUse} Digunakan</span>
                </div>
            </div>
            <div class="machines-grid" id="grid-${type}"></div>
        `;
        container.appendChild(section);

        const grid = document.getElementById(`grid-${type}`);
        typeMachines.forEach(machine => {
            const currentBooking = bookings.find(b => 
                b.machineId === machine.id && 
                (b.status === 'booked' || b.status === 'in-use')
            );

            let statusClass = 'status-available';
            let statusText = 'Tersedia';
            let buttons = `<button class="btn btn-primary" onclick="openBookingModal(${machine.id})">Booking</button>`;
            let infoText = 'Siap digunakan';

            if (currentBooking) {
                if (currentBooking.status === 'booked') {
                    statusClass = 'status-booked';
                    statusText = 'Terbooking';
                    infoText = `${currentBooking.user}<br>${currentBooking.date} | ${currentBooking.time}-${getEndTime(currentBooking.time)}`;
                    buttons = `
                        <button class="btn btn-primary" onclick="showBookingDetail(${machine.id})">Lihat Detail</button>
                        <button class="btn btn-success" onclick="showFinishModal(${currentBooking.id})">Selesai & Upload Foto</button>
                    `;
                } else if (currentBooking.status === 'in-use') {
                    statusClass = 'status-in-use';
                    statusText = 'Digunakan';
                    infoText = `${currentBooking.user}<br>${currentBooking.time}-${getEndTime(currentBooking.time)}`;
                    buttons = `
                        <button class="btn btn-success" onclick="showFinishModal(${currentBooking.id})">Selesai & Upload Foto</button>
                    `;
                }
            }

            const card = document.createElement('div');
            card.className = 'machine-card';
            card.innerHTML = `
                <div class="machine-header">
                    <div class="machine-name">${machine.name.replace('Mesin Cuci ' + (type === 'perempuan' ? 'Perempuan' : 'Laki-laki') + ' ', '#')}</div>
                    <div class="status-badge ${statusClass}">${statusText}</div>
                </div>
                <div class="machine-info">${infoText}</div>
                ${buttons}
            `;
            grid.appendChild(card);
        });
    });
}

function getEndTime(startTime) {
    const [hour, minute] = startTime.split(':').map(Number);
    const endHour = (hour + 2) % 24;
    return `${String(endHour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

function openBookingModal(machineId) {
    selectedMachineId = machineId;
    selectedTime = null;
    
    // Reset error message
    document.getElementById('timeSlotError').classList.remove('show');
    
    const select = document.getElementById('bookingMachine');
    select.innerHTML = '<option value="">-- Pilih Mesin --</option>' + 
        machines.map(m => `<option value="${m.id}" ${m.id === machineId ? 'selected' : ''}>${m.name}</option>`).join('');
    
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('bookingDate').value = today;
    document.getElementById('bookingDate').min = today;
    
    renderTimeSlots();
    document.getElementById('bookingModal').classList.add('show');
}

function renderTimeSlots() {
    const container = document.getElementById('timeSlots');
    container.innerHTML = '';
    
    const selectedDate = document.getElementById('bookingDate').value;
    const machineId = parseInt(document.getElementById('bookingMachine').value) || selectedMachineId;
    
    if (!machineId) return;

    timeSlots.forEach(time => {
        const slot = document.createElement('div');
        slot.className = 'time-slot';
        
        const isBooked = isTimeSlotBooked(machineId, selectedDate, time);
        const isPassed = isTimeSlotPassed(selectedDate, time);
        
        if (isBooked || isPassed) {
            slot.classList.add('booked');
            if (isPassed) {
                slot.innerHTML = `${time}<br><small>Lewat</small>`;
            } else {
                slot.innerHTML = `${time}<br><small>Terbooked</small>`;
            }
        } else {
            slot.innerHTML = `${time}<br><small>${getEndTime(time)}</small>`;
            slot.onclick = () => selectTimeSlot(time);
        }
        
        container.appendChild(slot);
    });
}

function isTimeSlotBooked(machineId, date, startTime) {
    const [startHour, startMin] = startTime.split(':').map(Number);
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = startMinutes + 120;

    return bookings.some(b => {
        if (b.machineId !== machineId || b.date !== date || b.status === 'completed') return false;
        
        const [bHour, bMin] = b.time.split(':').map(Number);
        const bStart = bHour * 60 + bMin;
        const bEnd = bStart + 120;

        return (startMinutes < bEnd && endMinutes > bStart);
    });
}

function isTimeSlotPassed(date, startTime) {
    const now = new Date();
    const selectedDateTime = new Date(`${date}T${startTime}`);
    return selectedDateTime < now;
}

function selectTimeSlot(time) {
    selectedTime = time;
    
    // Hilangkan error message ketika user memilih jam
    document.getElementById('timeSlotError').classList.remove('show');
    
    document.querySelectorAll('.time-slot').forEach(slot => slot.classList.remove('selected'));
    event.target.classList.add('selected');
}

document.getElementById('bookingDate').addEventListener('change', function() {
    selectedTime = null;
    renderTimeSlots();
});

document.getElementById('bookingMachine').addEventListener('change', function() {
    selectedTime = null;
    renderTimeSlots();
});

document.getElementById('bookingForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Validasi: Cek apakah jam sudah dipilih
    if (!selectedTime) {
        const errorEl = document.getElementById('timeSlotError');
        errorEl.classList.add('show');
        
        // Scroll ke time slots
        document.getElementById('timeSlots').scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
    }

    const machineId = parseInt(document.getElementById('bookingMachine').value);
    const userName = document.getElementById('userName').value;
    const userClass = document.getElementById('userClass').value;
    const userRoom = document.getElementById('userRoom').value;
    const userPhone = document.getElementById('userPhone').value;
    const date = document.getElementById('bookingDate').value;
    
    const booking = {
        id: Date.now(),
        machineId: machineId,
        machineName: machines.find(m => m.id === machineId).name,
        user: userName,
        class: userClass,
        room: userRoom,
        phone: userPhone,
        date: date,
        time: selectedTime,
        photoAfter: null,
        status: 'booked',
        createdAt: new Date().toLocaleString('id-ID')
    };

    bookings.push(booking);
    
    scheduleReminders(booking);
    
    closeModal('bookingModal');
    renderMachines();
    renderBookings();
    showNotification(`Booking berhasil! ${booking.machineName} pada ${date} jam ${selectedTime} - ${getEndTime(selectedTime)}`, 'success');
    
    document.getElementById('bookingForm').reset();
    selectedTime = null;
});

function scheduleReminders(booking) {
    const bookingDateTime = new Date(`${booking.date}T${booking.time}`);
    const now = new Date();
    const reminderTime = new Date(bookingDateTime.getTime() - 10 * 60000);
    
    if (reminderTime > now) {
        const delay = reminderTime - now;
        setTimeout(() => {
            showNotification(`Pengingat: Booking ${booking.machineName} Anda akan dimulai dalam 10 menit!`, 'warning');
            
            const bookingObj = bookings.find(b => b.id === booking.id);
            if (bookingObj) {
                bookingObj.status = 'in-use';
                renderMachines();
                renderBookings();
            }
        }, delay);
    }
}

function showFinishModal(bookingId) {
    currentFinishBookingId = bookingId;
    document.getElementById('previewAfter').style.display = 'none';
    document.getElementById('finishForm').reset();
    document.getElementById('finishModal').classList.add('show');
}

document.getElementById('finishForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const photoAfter = document.getElementById('photoAfter').files[0];
    if (!photoAfter) {
        showNotification('Ambil foto filter mesin cuci yang bersih terlebih dahulu!', 'error');
        return;
    }

    const booking = bookings.find(b => b.id === currentFinishBookingId);
    if (booking) {
        booking.photoAfter = URL.createObjectURL(photoAfter);
        booking.status = 'completed';
        booking.completedAt = new Date().toLocaleString('id-ID');
    }

    closeModal('finishModal');
    renderMachines();
    renderBookings();
    renderHistory();
    showNotification('Terima kasih! Booking selesai. Mesin sudah tersedia untuk pengguna lain.', 'success');
    
    document.getElementById('finishForm').reset();
    document.getElementById('previewAfter').style.display = 'none';
});

function renderBookings() {
    const list = document.getElementById('bookingList');
    const userBookings = bookings.filter(b => b.status !== 'completed');
    
    if (userBookings.length === 0) {
        list.innerHTML = '<p style="color: #64748b; text-align: center; padding: 40px;">Belum ada booking aktif</p>';
        return;
    }

    list.innerHTML = userBookings.map(booking => `
        <div class="booking-item">
            <div class="booking-header">
                <div class="booking-title">${booking.machineName}</div>
                <div class="status-badge ${booking.status === 'booked' ? 'status-booked' : 'status-in-use'}">
                    ${booking.status === 'booked' ? 'Terbooking' : 'Sedang Digunakan'}
                </div>
            </div>
            <div class="booking-details">
                <strong>Nama:</strong> ${booking.user}<br>
                <strong>Kelas:</strong> ${booking.class}<br>
                <strong>Kamar:</strong> ${booking.room}<br>
                <strong>HP:</strong> ${booking.phone}<br>
                <strong>Tanggal:</strong> ${booking.date}<br>
                <strong>Jam:</strong> ${booking.time} - ${getEndTime(booking.time)} (2 Jam)<br>
                <strong>Dibuat:</strong> ${booking.createdAt}
            </div>
            <button class="btn btn-success" onclick="showFinishModal(${booking.id})" style="margin-top: 15px;">
                Selesai & Upload Foto
            </button>
        </div>
    `).join('');
}

function renderHistory() {
    const list = document.getElementById('historyList');
    const completedBookings = bookings.filter(b => b.status === 'completed').sort((a, b) => b.id - a.id);
    
    if (completedBookings.length === 0) {
        list.innerHTML = '<p style="color: #64748b; text-align: center; padding: 40px;">Belum ada history booking</p>';
        return;
    }

    list.innerHTML = completedBookings.map(booking => `
        <div class="history-item">
            <div class="booking-header">
                <div class="booking-title">${booking.machineName}</div>
                <div class="status-badge">
                    ✓ Selesai
                </div>
            </div>
            <div class="booking-details">
                <strong>Nama:</strong> ${booking.user}<br>
                <strong>Kelas:</strong> ${booking.class}<br>
                <strong>Kamar:</strong> ${booking.room}<br>
                <strong>HP:</strong> ${booking.phone}<br>
                <strong>Tanggal:</strong> ${booking.date}<br>
                <strong>Jam:</strong> ${booking.time} - ${getEndTime(booking.time)} (2 Jam)<br>
                <strong>Dibuat:</strong> ${booking.createdAt}<br>
                <strong>Selesai:</strong> ${booking.completedAt}<br>
                ${booking.photoAfter ? `<br><strong>Foto Filter Mesin Cuci Setelah Digunakan:</strong><br><img src="${booking.photoAfter}" class="photo-thumbnail" onclick="showPhotoModal('${booking.photoAfter}')">` : ''}
            </div>
        </div>
    `).join('');
}

function showPhotoModal(photoUrl) {
    event.stopPropagation();
    document.getElementById('photoModalImg').src = photoUrl;
    document.getElementById('photoModal').classList.add('show');
}

function closePhotoModal() {
    document.getElementById('photoModal').classList.remove('show');
}

function openReportModal() {
    const select = document.getElementById('reportMachine');
    select.innerHTML = '<option value="">-- Pilih Mesin --</option>' + 
        machines.map(m => `<option value="${m.id}">${m.name}</option>`).join('');
    document.getElementById('reportModal').classList.add('show');
}

document.getElementById('reportForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const machineId = parseInt(document.getElementById('reportMachine').value);
    const machine = machines.find(m => m.id === machineId);
    const type = document.getElementById('reportType').value;
    const desc = document.getElementById('reportDesc').value;
    const reporter = document.getElementById('reporterName').value;
    const reporterClass = document.getElementById('reporterClass').value;
    const reporterRoom = document.getElementById('reporterRoom').value;

    const report = {
        id: Date.now(),
        machineId: machineId,
        machineName: machine.name,
        machineType: machine.type,
        type: type,
        description: desc,
        reporter: reporter,
        reporterClass: reporterClass,
        reporterRoom: reporterRoom,
        date: new Date().toLocaleString('id-ID'),
        status: 'pending'
    };

    reports.push(report);

    if (type === 'pakaian-tertinggal') {
        const lastBooking = bookings
            .filter(b => b.machineId === machineId && b.status === 'completed')
            .sort((a, b) => b.id - a.id)[0];
        
        if (lastBooking) {
            showNotification(`Pemberitahuan terkirim ke ${lastBooking.user} (${lastBooking.phone}) tentang pakaian tertinggal`, 'success');
        }
    }

    closeModal('reportModal');
    renderReports();
    showNotification('Laporan berhasil dikirim!', 'success');
    
    document.getElementById('reportForm').reset();
});

function renderReports() {
    const list = document.getElementById('reportList');
    
    if (reports.length === 0) {
        list.innerHTML = '<p style="color: #64748b; text-align: center; padding: 40px;">Belum ada laporan masalah</p>';
        return;
    }

    list.innerHTML = reports.map(report => {
        let typeIcon = '';
        let typeName = 'Lainnya';
        
        if (report.type === 'pakaian-tertinggal') {
            typeIcon = '👕';
            typeName = 'Pakaian Tertinggal';
        } else if (report.type === 'mesin-rusak') {
            typeIcon = '🔧';
            typeName = 'Mesin Rusak';
        } else if (report.type === 'mesin-kotor') {
            typeIcon = '🧹';
            typeName = 'Mesin Kotor';
        }

        return `
            <div class="report-item">
                <div class="booking-header">
                    <div class="booking-title">${report.machineName}</div>
                    <div class="status-badge" style="background: #fef3c7; color: #92400e;">
                        ${typeIcon} ${typeName}
                    </div>
                </div>
                <div class="booking-details">
                    <strong>Deskripsi:</strong> ${report.description}<br>
                    <strong>Pelapor:</strong> ${report.reporter}<br>
                    <strong>Kelas:</strong> ${report.reporterClass}<br>
                    <strong>Kamar:</strong> ${report.reporterRoom}<br>
                    <strong>Dilaporkan:</strong> ${report.date}<br>
                    <strong>Status:</strong> <span style="color: #f59e0b; font-weight: 600;">Menunggu Tindak Lanjut</span>
                </div>
            </div>
        `;
    }).join('');
}

function showNotification(message, type) {
    const notif = document.createElement('div');
    notif.className = `notification ${type}`;
    notif.innerHTML = `
        <div style="font-weight: bold; margin-bottom: 5px; font-size: 1.1em;">
            ${type === 'success' ? 'Berhasil' : type === 'warning' ? 'Pengingat' : 'Perhatian'}
        </div>
        <div style="line-height: 1.5;">${message}</div>
    `;
    document.body.appendChild(notif);

    setTimeout(() => {
        notif.style.animation = 'slideIn 0.3s reverse';
        setTimeout(() => notif.remove(), 300);
    }, 6000);
}

function switchTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    event.target.classList.add('active');
    document.getElementById(`${tab}-tab`).classList.add('active');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('show');
    
    // Reset error message saat modal ditutup
    if (modalId === 'bookingModal') {
        document.getElementById('timeSlotError').classList.remove('show');
        selectedTime = null;
    }
}

function previewPhoto(input, previewId) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const preview = document.getElementById(previewId);
            preview.src = e.target.result;
            preview.style.display = 'block';
        };
        reader.readAsDataURL(input.files[0]);
    }
}

function showBookingDetail(machineId) {
    const booking = bookings.find(b => b.machineId === machineId && b.status !== 'completed');
    if (booking) {
        const details = `
            Detail Booking:<br><br>
            Mesin: ${booking.machineName}<br>
            Nama: ${booking.user}<br>
            Kelas: ${booking.class}<br>
            Kamar: ${booking.room}<br>
            HP: ${booking.phone}<br>
            Tanggal: ${booking.date}<br>
            Jam: ${booking.time} - ${getEndTime(booking.time)} (2 Jam)
        `;
        showNotification(details, 'success');
    }
}

window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.classList.remove('show');
        
        // Reset error message
        if (event.target.id === 'bookingModal') {
            document.getElementById('timeSlotError').classList.remove('show');
            selectedTime = null;
        }
    }
}

// Render data saat halaman pertama kali dibuka
renderMachines();
renderBookings();
renderHistory();
renderReports();

setTimeout(() => {
    showNotification('Selamat datang di Smart Laundry Management System!', 'success');
}, 500);