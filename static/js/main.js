// Global state
let teachers = [];
let subjects = [];
let classrooms = [];
let semesters = [];
let currentSessionId = null;
let currentTimetable = [];
let currentMetadata = {};
let editingIndex = null;
let addTarget = null; // when set, save acts as add-entry for the clicked empty cell
// Color map for subjects in UI (fallback if backend doesn't provide colors)
const subjectColors = {};
function colorForSubject(name){
    if(subjectColors[name]) return subjectColors[name];
    // deterministic pastel color from hash
    let hash = 0; for(let i=0;i<name.length;i++){ hash = ((hash<<5)-hash)+name.charCodeAt(i); hash|=0; }
    const hue = Math.abs(hash)%360; const sat=65; const light=85;
    const color = `hsl(${hue} ${sat}% ${light}%)`;
    subjectColors[name]=color; return color;
}

// Theme presets
const themePresets = {
    default: {
        header: '#4a90e2',
        body: '#f5f7fa',
        card: '#ffffff',
        accent: '#4a90e2'
    },
    purple: {
        header: '#667eea',
        body: '#f3f4ff',
        card: '#ffffff',
        accent: '#667eea'
    },
    green: {
        header: '#56ab2f',
        body: '#f0f8f0',
        card: '#ffffff',
        accent: '#56ab2f'
    },
    orange: {
        header: '#f46b45',
        body: '#fff5f0',
        card: '#ffffff',
        accent: '#f46b45'
    },
    red: {
        header: '#eb3349',
        body: '#fff0f0',
        card: '#ffffff',
        accent: '#eb3349'
    },
    dark: {
        header: '#2c3e50',
        body: '#34495e',
        card: '#2c3e50',
        accent: '#3498db'
    }
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Application starting...');
    initializeApp();
    initializeTheme();
});

function initializeApp() {
    console.log('📝 Initializing application...');
    setupNavigation();
    setupButtons();
    setupSemesters(3);
    renderAll();
    console.log('✅ Application initialized successfully');
}

// Theme initialization
function initializeTheme() {
    console.log('🎨 Initializing theme customization...');
    
    // Load saved theme from localStorage
    loadThemeFromStorage();
    
    // Theme toggle button
    document.getElementById('theme-toggle-btn')?.addEventListener('click', function() {
        toggleThemePanel();
    });
    
    // Close theme panel
    document.getElementById('close-theme-btn')?.addEventListener('click', function() {
        closeThemePanel();
    });
    
    // Color pickers
    document.getElementById('header-color')?.addEventListener('input', function() {
        document.getElementById('header-color-text').value = this.value;
    });
    
    document.getElementById('body-color')?.addEventListener('input', function() {
        document.getElementById('body-color-text').value = this.value;
    });
    
    document.getElementById('card-color')?.addEventListener('input', function() {
        document.getElementById('card-color-text').value = this.value;
    });
    
    document.getElementById('accent-color')?.addEventListener('input', function() {
        document.getElementById('accent-color-text').value = this.value;
    });
    
    // Apply theme button
    document.getElementById('apply-theme-btn')?.addEventListener('click', function() {
        applyTheme();
    });
    
    // Reset theme button
    document.getElementById('reset-theme-btn')?.addEventListener('click', function() {
        resetTheme();
    });
    
    // Preset buttons
    document.querySelectorAll('.preset-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const preset = this.dataset.preset;
            applyPreset(preset);
        });
    });
    
    console.log('✅ Theme customization initialized');
}

// Toggle theme panel
function toggleThemePanel() {
    const panel = document.getElementById('theme-panel');
    
    // Create overlay if it doesn't exist
    let overlay = document.getElementById('theme-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'theme-overlay';
        overlay.className = 'theme-overlay';
        overlay.addEventListener('click', closeThemePanel);
        document.body.appendChild(overlay);
    }
    
    panel.classList.toggle('active');
    overlay.classList.toggle('active');
}

// Close theme panel
function closeThemePanel() {
    const panel = document.getElementById('theme-panel');
    const overlay = document.getElementById('theme-overlay');
    
    panel.classList.remove('active');
    if (overlay) {
        overlay.classList.remove('active');
    }
}

// Apply theme
function applyTheme() {
    const headerColor = document.getElementById('header-color').value;
    const bodyColor = document.getElementById('body-color').value;
    const cardColor = document.getElementById('card-color').value;
    const accentColor = document.getElementById('accent-color').value;
    
    // Calculate secondary color (darker version of header)
    const secondaryColor = shadeColor(headerColor, -20);
    
    // Apply CSS variables
    document.documentElement.style.setProperty('--primary-color', accentColor);
    document.documentElement.style.setProperty('--secondary-color', secondaryColor);
    document.documentElement.style.setProperty('--bg-color', bodyColor);
    document.documentElement.style.setProperty('--card-bg', cardColor);
    
    // Update header gradient
    const header = document.querySelector('.header');
    if (header) {
        header.style.background = `linear-gradient(135deg, ${headerColor}, ${secondaryColor})`;
    }
    
    // Save to localStorage
    const theme = {
        header: headerColor,
        body: bodyColor,
        card: cardColor,
        accent: accentColor
    };
    localStorage.setItem('timetable-theme', JSON.stringify(theme));
    
    showNotification('🎨 Theme applied successfully!', 'success');
    closeThemePanel();
}

// Apply preset theme
function applyPreset(presetName) {
    const preset = themePresets[presetName];
    if (!preset) return;
    
    document.getElementById('header-color').value = preset.header;
    document.getElementById('header-color-text').value = preset.header;
    document.getElementById('body-color').value = preset.body;
    document.getElementById('body-color-text').value = preset.body;
    document.getElementById('card-color').value = preset.card;
    document.getElementById('card-color-text').value = preset.card;
    document.getElementById('accent-color').value = preset.accent;
    document.getElementById('accent-color-text').value = preset.accent;
    
    showNotification(`🎨 ${presetName.charAt(0).toUpperCase() + presetName.slice(1)} preset loaded!`, 'success');
}

// Reset to default theme
function resetTheme() {
    applyPreset('default');
    applyTheme();
    showNotification('🎨 Theme reset to default', 'success');
}

// Load theme from localStorage
function loadThemeFromStorage() {
    const savedTheme = localStorage.getItem('timetable-theme');
    if (savedTheme) {
        try {
            const theme = JSON.parse(savedTheme);
            
            // Set color pickers
            document.getElementById('header-color').value = theme.header;
            document.getElementById('header-color-text').value = theme.header;
            document.getElementById('body-color').value = theme.body;
            document.getElementById('body-color-text').value = theme.body;
            document.getElementById('card-color').value = theme.card;
            document.getElementById('card-color-text').value = theme.card;
            document.getElementById('accent-color').value = theme.accent;
            document.getElementById('accent-color-text').value = theme.accent;
            
            // Apply theme
            const secondaryColor = shadeColor(theme.header, -20);
            document.documentElement.style.setProperty('--primary-color', theme.accent);
            document.documentElement.style.setProperty('--secondary-color', secondaryColor);
            document.documentElement.style.setProperty('--bg-color', theme.body);
            document.documentElement.style.setProperty('--card-bg', theme.card);
            
            const header = document.querySelector('.header');
            if (header) {
                header.style.background = `linear-gradient(135deg, ${theme.header}, ${secondaryColor})`;
            }
            
            console.log('🎨 Theme loaded from storage');
        } catch (e) {
            console.error('Failed to load theme:', e);
        }
    }
}

// Utility: Darken or lighten a color
function shadeColor(color, percent) {
    let R = parseInt(color.substring(1, 3), 16);
    let G = parseInt(color.substring(3, 5), 16);
    let B = parseInt(color.substring(5, 7), 16);

    R = parseInt(R * (100 + percent) / 100);
    G = parseInt(G * (100 + percent) / 100);
    B = parseInt(B * (100 + percent) / 100);

    R = (R < 255) ? R : 255;
    G = (G < 255) ? G : 255;
    B = (B < 255) ? B : 255;

    const RR = ((R.toString(16).length == 1) ? "0" + R.toString(16) : R.toString(16));
    const GG = ((G.toString(16).length == 1) ? "0" + G.toString(16) : G.toString(16));
    const BB = ((B.toString(16).length == 1) ? "0" + B.toString(16) : B.toString(16));

    return "#" + RR + GG + BB;
}

// Setup navigation
function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            const section = this.dataset.section;
            document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
            document.getElementById(`${section}-section`).classList.add('active');
            navItems.forEach(nav => nav.classList.remove('active'));
            this.classList.add('active');
        });
    });
}

// Setup all button event listeners
function setupButtons() {
    // Setup Semesters
    document.getElementById('setup-semesters-btn')?.addEventListener('click', function() {
        const count = parseInt(document.getElementById('semester-count').value) || 3;
        setupSemesters(count);
    });

    // Time slot
    document.getElementById('add-timeslot-btn')?.addEventListener('click', addTimeSlot);
    
    // Teacher
    document.getElementById('add-teacher-btn')?.addEventListener('click', addTeacher);
    
    // Subject
    document.getElementById('add-subject-btn')?.addEventListener('click', addSubject);
    
    // Classroom
    document.getElementById('add-classroom-btn')?.addEventListener('click', addClassroom);
    
    // Generate
    document.getElementById('generate-btn')?.addEventListener('click', generateTimetable);
    
    // Export
    document.getElementById('export-pdf-btn')?.addEventListener('click', exportPDF);
    document.getElementById('export-excel-btn')?.addEventListener('click', exportExcel);
    
    // Modal
    document.getElementById('close-modal')?.addEventListener('click', closeEditModal);
    document.getElementById('cancel-edit-btn')?.addEventListener('click', closeEditModal);
    document.getElementById('save-edit-btn')?.addEventListener('click', saveEdit);
    
    // Enter key support
    document.getElementById('new-timeslot')?.addEventListener('keypress', e => {
        if (e.key === 'Enter') addTimeSlot();
    });
    document.getElementById('classroom-name')?.addEventListener('keypress', e => {
        if (e.key === 'Enter') addClassroom();
    });
    
    // Time slot removal
    document.getElementById('time-slots-container')?.addEventListener('click', function(e) {
        if (e.target.classList.contains('fa-times')) {
            const tag = e.target.parentElement;
            const timeSlot = tag.textContent.replace('×', '').trim();
            tag.remove();
            showNotification('Time slot removed', 'success');
        }
    });

    // Classroom filter removed
}

// Semester Management
function setupSemesters(count) {
    semesters = [];
    for (let i = 1; i <= count; i++) {
        semesters.push(`Semester ${i}`);
    }
    
    renderSemesters();
    updateSubjectSemesterDropdown();
    showNotification(`✅ ${count} semester(s) configured`, 'success');
}

function renderSemesters() {
    const container = document.getElementById('semesters-list');
    if (semesters.length === 0) {
        container.innerHTML = '';
        return;
    }
    
    container.innerHTML = `
        <div style="margin-top: 1rem;">
            <strong style="color: var(--dark-color);">Configured Semesters:</strong>
            <div style="margin-top: 0.75rem;">
                ${semesters.map(sem => `<div class="semester-item"><i class="fas fa-layer-group"></i> ${sem}</div>`).join('')}
            </div>
        </div>
    `;
}

function updateSubjectSemesterDropdown() {
    const select = document.getElementById('subject-semester');
    if (!select) return;
    
    select.innerHTML = semesters.map(sem => 
        `<option value="${sem}">${sem}</option>`
    ).join('');
}



// Time Slots
function addTimeSlot() {
    const input = document.getElementById('new-timeslot');
    const value = input.value.trim();

    if (!value) {
        showNotification('Please enter a time slot', 'error');
        return;
    }

    const container = document.querySelector('#time-slots-container .input-tag-group');
    const tag = document.createElement('span');
    tag.className = 'tag';
    tag.innerHTML = `${value} <i class="fas fa-times"></i>`;
    container.appendChild(tag);

    input.value = '';
    showNotification('Time slot added: ' + value, 'success');
}

// Teachers
function addTeacher() {
    const nameInput = document.getElementById('teacher-name');
    const subjectsInput = document.getElementById('teacher-subjects');
    
    const name = nameInput.value.trim();
    const subjectsStr = subjectsInput.value.trim();
    
    if (!name || !subjectsStr) {
        showNotification('Please fill in teacher name and subjects', 'error');
        return;
    }
    
    const selectedDays = Array.from(document.querySelectorAll('.teacher-day:checked'))
        .map(cb => cb.value);
    
    const subjectsList = subjectsStr.split(',').map(s => s.trim());
    const timeSlots = getTimeSlots();
    
    const availability = {};
    selectedDays.forEach(day => {
        availability[day] = timeSlots;
    });
    
    teachers.push({
        name: name,
        subjects: subjectsList,
        availability: availability
    });
    
    renderTeachers();
    
    nameInput.value = '';
    subjectsInput.value = '';
    document.querySelectorAll('.teacher-day').forEach(cb => cb.checked = false);
    
    showNotification('✅ Teacher added: ' + name, 'success');
}

function removeTeacher(index) {
    teachers.splice(index, 1);
    renderTeachers();
    showNotification('Teacher removed', 'success');
}

function renderTeachers() {
    const container = document.getElementById('teachers-list');
    
    if (teachers.length === 0) {
        container.innerHTML = '<p style="color: var(--text-light); font-style: italic;">No teachers added yet.</p>';
        return;
    }
    
    container.innerHTML = teachers.map((teacher, index) => {
        const availableDays = Object.keys(teacher.availability).join(', ') || 'All days';
        const subjectBadges = teacher.subjects.map(s => `<span class="item-badge">${s}</span>`).join('');
        
        return `
            <div class="item">
                <div class="item-content">
                    <div class="item-title"><i class="fas fa-user"></i> ${teacher.name}</div>
                    <div class="item-details">${subjectBadges}</div>
                    <div class="item-details" style="margin-top: 0.5rem;">
                        <i class="fas fa-calendar-check"></i> Available: ${availableDays}
                    </div>
                </div>
                <div class="item-actions">
                    <button class="btn btn-danger btn-icon remove-teacher-btn" data-index="${index}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');
    
    container.querySelectorAll('.remove-teacher-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            removeTeacher(parseInt(this.getAttribute('data-index')));
        });
    });
}

// Subjects
function addSubject() {
    const semesterSelect = document.getElementById('subject-semester');
    const nameInput = document.getElementById('subject-name');
    const sessionsInput = document.getElementById('sessions-per-week');
    
    const semester = semesterSelect.value;
    const name = nameInput.value.trim();
    const sessions = parseInt(sessionsInput.value) || 2;
    
    if (!name) {
        showNotification('Please fill in subject name', 'error');
        return;
    }
    
    subjects.push({
        name: name,
        semester: semester,
        sessions_per_week: sessions
    });
    
    renderSubjects();
    
    nameInput.value = '';
    sessionsInput.value = '2';
    
    showNotification(`✅ Subject added: ${name}`, 'success');
}

function removeSubject(index) {
    subjects.splice(index, 1);
    renderSubjects();
    showNotification('Subject removed', 'success');
}

function renderSubjects() {
    const container = document.getElementById('subjects-list');
    
    if (subjects.length === 0) {
        container.innerHTML = '<p style="color: var(--text-light); font-style: italic;">No subjects added yet.</p>';
        return;
    }
    
    container.innerHTML = subjects.map((subject, index) => `
        <div class="item">
            <div class="item-content">
                <div class="item-title">
                    <i class="fas fa-book"></i> ${subject.name}
                    <span class="semester-badge">${subject.semester}</span>
                    <span class="sessions-badge">${subject.sessions_per_week}x/week</span>
                </div>
            </div>
            <div class="item-actions">
                <button class="btn btn-danger btn-icon remove-subject-btn" data-index="${index}">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
    
    container.querySelectorAll('.remove-subject-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            removeSubject(parseInt(this.getAttribute('data-index')));
        });
    });
}

// Classrooms
function addClassroom() {
    const input = document.getElementById('classroom-name');
    const value = input.value.trim();
    
    if (!value) {
        showNotification('Please enter a classroom name', 'error');
        return;
    }
    
    if (classrooms.includes(value)) {
        showNotification('Classroom already exists', 'error');
        return;
    }
    
    classrooms.push(value);
    renderClassrooms();
    input.value = '';
    showNotification('✅ Classroom added: ' + value, 'success');
}

function removeClassroom(classroom) {
    classrooms = classrooms.filter(c => c !== classroom);
    renderClassrooms();
    showNotification('Classroom removed', 'success');
}

function renderClassrooms() {
    const container = document.querySelector('#classrooms-list .input-tag-group');
    
    if (classrooms.length === 0) {
        container.innerHTML = '<p style="color: var(--text-light); font-style: italic;">No classrooms added yet.</p>';
        return;
    }
    
    container.innerHTML = classrooms.map(classroom => 
        `<span class="tag">${classroom} <i class="fas fa-times remove-classroom-btn" data-classroom="${classroom}"></i></span>`
    ).join('');
    
    container.querySelectorAll('.remove-classroom-btn').forEach(icon => {
        icon.addEventListener('click', function() {
            removeClassroom(this.getAttribute('data-classroom'));
        });
    });
}

// Generate Timetable
async function generateTimetable() {
    const days = getSelectedDays();
    const timeSlots = getTimeSlots();
    
    if (teachers.length === 0 || subjects.length === 0 || classrooms.length === 0) {
        showNotification('❌ Please add teachers, subjects, and classrooms first', 'error');
        return;
    }
    
    if (days.length === 0 || timeSlots.length === 0) {
        showNotification('❌ Please select days and time slots', 'error');
        return;
    }
    
    if (semesters.length === 0) {
        showNotification('❌ Please setup semesters first', 'error');
        return;
    }
    
    showLoading(true);
    
    try {
        const response = await fetch('/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                session_id: currentSessionId, // reuse to leverage memory
                teachers: teachers,
                subjects: subjects,
                classrooms: classrooms,
                timeSlots: timeSlots,
                days: days,
                semesters: semesters
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            currentSessionId = data.session_id;
            currentTimetable = data.timetable;
            currentMetadata = {
                classrooms: classrooms,
                days: days,
                timeSlots: timeSlots
            };
            
            updateClassroomFilter();
            renderTimetable(data.timetable, classrooms, days, timeSlots);
            renderConflicts(data.conflicts);
            
            // Note: backend memory can be used to prefill on next open
            // Optionally update local subject color map if provided later
            
            // Switch to timetable view
            document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
            document.getElementById('timetable-section').classList.add('active');
            
            document.querySelectorAll('.nav-item').forEach(item => {
                item.classList.remove('active');
                if (item.dataset.section === 'timetable') {
                    item.classList.add('active');
                }
            });
            
            showNotification('🎉 Timetable generated successfully!', 'success');
        } else {
            showNotification('❌ ' + (data.error || 'Failed to generate timetable'), 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showNotification('❌ Error generating timetable: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

// Classroom filter removed
function updateClassroomFilter() {}
function filterTimetableByClassroom() {}

// Render Timetable (Layout: Days on left, Time slots on top)
function renderTimetable(timetable, classroomsToShow, days, timeSlots) {
    const container = document.getElementById('timetable-container');
    
    if (!timetable || timetable.length === 0) {
        container.innerHTML = '<p class="empty-state"><i class="fas fa-calendar-times"></i><br>No classes scheduled.</p>';
        return;
    }
    
    let html = '';

    // Unified table (all classrooms combined per slot, multiple lines)
    html += `
        <div class="timetable-card">
            <h3 class="timetable-classroom-title">
                <i class="fas fa-calendar"></i>
                Unified Timetable
            </h3>
            <div class="timetable-wrapper">
                <table class="timetable">
                    <thead>
                        <tr>
                            <th>Day / Time</th>
                            ${timeSlots.map(slot => `<th>${slot}</th>`).join('')}
                        </tr>
                    </thead>
                    <tbody>
    `;

    days.forEach(day => {
        html += `<tr><td>${day}</td>`;
        timeSlots.forEach(slot => {
            const entries = timetable.filter(e => e.day === day && e.time_slot === slot);
            const cellAttrs = `data-day="${day}" data-slot="${slot}"`;
            if (entries && entries.length) {
                const cells = entries.map(e => {
                    const idx = timetable.indexOf(e);
                    const bg = colorForSubject(e.subject);
                    return `
                        <div class="cell-block" draggable="true" style="background:${bg}" data-index="${idx}" title="Drag to move or click to edit">
                            <div class="cell-subject">${e.subject}</div>
                            <div class="cell-teacher"><i class="fas fa-user"></i> ${e.teacher}</div>
                            <div class="cell-meta">${e.classroom} • ${e.semester || ''}</div>
                        </div>
                    `;
                }).join('');
                html += `<td class="timetable-cell multi droptarget" ${cellAttrs}>${cells}</td>`;
            } else {
                html += `<td class="droptarget" ${cellAttrs}></td>`;
            }
        });
        html += '</tr>';
    });

    html += `
                    </tbody>
                </table>
            </div>
        </div>
    `;

    container.innerHTML = html;

    // Click handlers on blocks
    container.querySelectorAll('.cell-block').forEach(block => {
        block.addEventListener('click', function(e){
            e.stopPropagation();
            editEntry(parseInt(this.getAttribute('data-index')));
        });
        // Drag handlers
        block.addEventListener('dragstart', onDragStart);
    });

    // Drop targets
    container.querySelectorAll('.droptarget').forEach(cell => {
        cell.addEventListener('dragover', onDragOver);
        cell.addEventListener('dragleave', onDragLeave);
        cell.addEventListener('drop', onDrop);
        // Empty-cell add support
        cell.addEventListener('click', function(){
            // Only when no entries exist in this cell
            if (!this.querySelector('.cell-block')) {
                const day = this.getAttribute('data-day');
                const slot = this.getAttribute('data-slot');
                openAddModal(day, slot);
            }
        });
    });
}

function openAddModal(day, slot){
    addTarget = { day, slot };
    editingIndex = null;
    // Clear fields
    const s = document.getElementById('edit-subject');
    const t = document.getElementById('edit-teacher');
    const sem = document.getElementById('edit-semester');
    if (s) s.value = '';
    if (t) t.value = '';
    if (sem) sem.value = '';
    document.getElementById('edit-modal').classList.add('active');
}

// Drag-and-drop handlers
let draggedIndex = null;
function onDragStart(ev){
    draggedIndex = parseInt(ev.currentTarget.getAttribute('data-index'));
    ev.dataTransfer.setData('text/plain', String(draggedIndex));
    ev.dataTransfer.effectAllowed = 'move';
}
function onDragOver(ev){
    ev.preventDefault();
    ev.dataTransfer.dropEffect = 'move';
    ev.currentTarget.classList.add('drag-hover');
}
function onDragLeave(ev){
    ev.currentTarget.classList.remove('drag-hover');
}
async function onDrop(ev){
    ev.preventDefault();
    ev.currentTarget.classList.remove('drag-hover');
    const idx = draggedIndex ?? parseInt(ev.dataTransfer.getData('text/plain'));
    if (isNaN(idx)) return;
    const targetDay = ev.currentTarget.getAttribute('data-day');
    const targetSlot = ev.currentTarget.getAttribute('data-slot');
    if (!targetDay || !targetSlot) return;

    // Update local state
    currentTimetable[idx].day = targetDay;
    currentTimetable[idx].time_slot = targetSlot;

    try {
        const response = await fetch('/update-timetable', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ session_id: currentSessionId, timetable: currentTimetable })
        });
        const data = await response.json();
        if (data.success) {
            // Re-render unified timetable
            renderTimetable(currentTimetable, classrooms, currentMetadata.days, currentMetadata.timeSlots);
            renderConflicts(data.conflicts);
            // Visual flagging of conflict cells
            flagConflictCells(data.conflicts);
        }
    } catch(err){
        console.error(err);
        showNotification('❌ Error updating after drag-and-drop: ' + err.message, 'error');
    }
}

function flagConflictCells(conflicts){
    const container = document.getElementById('timetable-container');
    container.querySelectorAll('.droptarget').forEach(c => c.classList.remove('conflict'));
    if (!Array.isArray(conflicts)) return;
    conflicts.forEach(c => {
        if (!c.day || !c.time_slot) return;
        const sel = `.droptarget[data-day="${c.day}"][data-slot="${c.time_slot}"]`;
        const cell = container.querySelector(sel);
        if (cell) cell.classList.add('conflict');
    });
}

// Render Conflicts
function renderConflicts(conflicts) {
    const container = document.getElementById('conflicts-container');
    
    if (!conflicts || conflicts.length === 0) {
        container.innerHTML = '<p class="empty-state"><i class="fas fa-check-circle"></i><br>No conflicts detected. All clear! ✅</p>';
        return;
    }
    
    container.innerHTML = conflicts.map(conflict => {
        let typeLabel = 'Conflict';
        if (conflict.type === 'teacher') typeLabel = 'Teacher Conflict';
        else if (conflict.type === 'classroom') typeLabel = 'Classroom Conflict';
        else if (conflict.type === 'student') typeLabel = 'Student Conflict';

        const details = `
            <div><strong>Day:</strong> ${conflict.day} <strong>Time:</strong> ${conflict.time_slot}</div>
            ${conflict.teacher ? `<div><strong>Teacher:</strong> ${conflict.teacher}</div>` : ''}
            ${conflict.classroom ? `<div><strong>Classroom:</strong> ${conflict.classroom}</div>` : ''}
            ${conflict.semester ? `<div><strong>Semester:</strong> ${conflict.semester}</div>` : ''}
            <div><i class="fas fa-book"></i> ${Array.isArray(conflict.subjects) ? conflict.subjects.join(', ') : ''}</div>
            ${conflict.suggestions && conflict.suggestions.length ? `<div class="conflict-suggestion"><i class="fas fa-lightbulb"></i> Suggested: ${conflict.suggestions.join(' | ')}</div>` : ''}
        `;

        return `
            <div class="conflict-item error">
                <div class="conflict-type"><i class="fas fa-exclamation-triangle"></i> ${typeLabel}</div>
                <div class="conflict-details">${details}</div>
            </div>
        `;
    }).join('');
}

// Edit Entry
function editEntry(index) {
    editingIndex = index;
    const entry = currentTimetable[index];

    document.getElementById('edit-subject').value = entry.subject;
    document.getElementById('edit-teacher').value = entry.teacher;
    document.getElementById('edit-semester').value = entry.semester;

    document.getElementById('edit-modal').classList.add('active');
}

function closeEditModal() {
    document.getElementById('edit-modal').classList.remove('active');
    editingIndex = null;
}

async function saveEdit() {
    const subject = document.getElementById('edit-subject').value.trim();
    const teacher = document.getElementById('edit-teacher').value.trim();
    const semester = document.getElementById('edit-semester').value.trim();

    if (!subject || !teacher) {
        showNotification('❌ Subject and teacher are required', 'error');
        return;
    }

    if (addTarget) {
        // Create new entry in the selected empty cell
        const classroom = classrooms[0] || 'Room 1';
        currentTimetable.push({
            day: addTarget.day,
            time_slot: addTarget.slot,
            subject,
            teacher,
            classroom,
            semester
        });
        addTarget = null;
    } else if (editingIndex !== null) {
        // Update existing entry
        currentTimetable[editingIndex].subject = subject;
        currentTimetable[editingIndex].teacher = teacher;
        currentTimetable[editingIndex].semester = semester;
    } else {
        return; // nothing to do
    }

    try {
        const response = await fetch('/update-timetable', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                session_id: currentSessionId,
                timetable: currentTimetable
            })
        });
        const data = await response.json();
        if (data.success) {
            // Re-render unified timetable
            renderTimetable(currentTimetable, classrooms, currentMetadata.days, currentMetadata.timeSlots);
            renderConflicts(data.conflicts);
            closeEditModal();
            showNotification('✅ Timetable updated', 'success');
        }
    } catch (error) {
        showNotification('❌ Error updating entry: ' + error.message, 'error');
    }
}

// Export Functions
function exportPDF() {
    if (!currentSessionId) {
        showNotification('❌ Please generate a timetable first', 'error');
        return;
    }
    window.open('/export/pdf/' + currentSessionId, '_blank');
    showNotification('📄 PDF export started...', 'success');
}

function exportExcel() {
    if (!currentSessionId) {
        showNotification('❌ Please generate a timetable first', 'error');
        return;
    }
    window.open('/export/excel/' + currentSessionId, '_blank');
    showNotification('📊 Excel export started...', 'success');
}

// Helper Functions
function getSelectedDays() {
    return Array.from(document.querySelectorAll('.day-checkbox:checked'))
        .map(cb => cb.value);
}

function getTimeSlots() {
    const tags = Array.from(document.querySelectorAll('#time-slots-container .tag'));
    return tags.map(tag => {
        const text = tag.textContent || tag.innerText;
        return text.replace(/×/g, '').replace(/🍽️/g, '').trim();
    }).filter(t => t.length > 0);
}

function showLoading(show) {
    const overlay = document.getElementById('loading-overlay');
    if (show) {
        overlay.classList.add('active');
    } else {
        overlay.classList.remove('active');
    }
}

function showNotification(message, type = 'info') {
    const icons = { 'success': '✅', 'error': '❌', 'info': 'ℹ️' };
    const icon = icons[type] || icons.info;
    console.log(`${icon} ${message}`);
    alert(`${message}`);
}

function renderAll() {
    renderTeachers();
    renderSubjects();
    renderClassrooms();
}