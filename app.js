/**
 * Church Roster PWA with WhatsApp Reminders
 * Deeper Life Bible Church, Mexico
 * Using Callmebot Free API
 */

class ChurchRosterApp {
    constructor() {
        this.currentUser = null;
        this.phoneNumber = null;
        this.apiKey = null;
        this.currentPage = 'home';
        this.currentMonth = new Date(2026, 0, 1);
        this.scheduleFilter = 'all';
        this.userEvents = [];
        this.sentReminders = {};
    }
    
    init() {
        // Load saved data
        this.currentUser = localStorage.getItem('dlbc_user');
        this.phoneNumber = localStorage.getItem('dlbc_phone');
        this.apiKey = localStorage.getItem('dlbc_apikey');
        this.sentReminders = JSON.parse(localStorage.getItem('dlbc_sent_reminders') || '{}');
        
        if (this.currentUser) {
            this.showApp();
        } else {
            this.showLogin();
        }
        
        this.setupEventListeners();
        this.registerServiceWorker();
    }
    
    setupEventListeners() {
        // Login form
        const memberSelect = document.getElementById('memberSelect');
        const phoneInput = document.getElementById('phoneInput');
        const apiKeyInput = document.getElementById('apiKeyInput');
        const loginBtn = document.getElementById('loginBtn');
        
        const validateForm = () => {
            const hasName = memberSelect.value !== '';
            const hasPhone = phoneInput.value.length >= 10;
            const hasKey = apiKeyInput.value.length >= 4;
            loginBtn.disabled = !(hasName && hasPhone && hasKey);
        };
        
        memberSelect.addEventListener('change', validateForm);
        phoneInput.addEventListener('input', validateForm);
        apiKeyInput.addEventListener('input', validateForm);
        
        loginBtn.addEventListener('click', () => this.handleLogin());
        
        document.getElementById('skipSetup').addEventListener('click', (e) => {
            e.preventDefault();
            if (memberSelect.value) {
                this.currentUser = memberSelect.value;
                localStorage.setItem('dlbc_user', this.currentUser);
                this.showApp();
            } else {
                this.showToast('Please select your name first', 'error');
            }
        });
        
        // Navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const page = e.currentTarget.dataset.page;
                this.navigateTo(page);
            });
        });
        
        // Tabs
        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const filter = e.target.dataset.filter;
                this.filterSchedule(filter);
            });
        });
        
        // Calendar
        document.getElementById('prevMonth').addEventListener('click', () => this.changeMonth(-1));
        document.getElementById('nextMonth').addEventListener('click', () => this.changeMonth(1));
        
        // Reminder button
        document.getElementById('sendRemindersBtn').addEventListener('click', () => this.sendPendingReminders());
        
        // Settings
        document.getElementById('testWhatsappBtn').addEventListener('click', () => this.testWhatsApp());
        document.getElementById('logoutBtn').addEventListener('click', () => this.logout());
    }
    
    handleLogin() {
        this.currentUser = document.getElementById('memberSelect').value;
        this.phoneNumber = document.getElementById('phoneInput').value.replace(/\s/g, '');
        this.apiKey = document.getElementById('apiKeyInput').value.trim();
        
        // Ensure phone has + prefix
        if (!this.phoneNumber.startsWith('+')) {
            this.phoneNumber = '+' + this.phoneNumber;
        }
        
        // Save to localStorage
        localStorage.setItem('dlbc_user', this.currentUser);
        localStorage.setItem('dlbc_phone', this.phoneNumber);
        localStorage.setItem('dlbc_apikey', this.apiKey);
        
        this.showApp();
        
        // Send welcome message
        setTimeout(() => {
            this.sendWhatsAppMessage(`🙏 Welcome to DLBC Mexico Roster!\n\nHello ${this.currentUser.split(' ')[0]}, your WhatsApp reminders are now active.\n\nYou will receive reminders for your church activities.\n\nGod bless you!`);
        }, 1000);
    }
    
    showLogin() {
        document.getElementById('loginScreen').style.display = 'flex';
        document.getElementById('appContainer').classList.remove('active');
    }
    
    showApp() {
        document.getElementById('loginScreen').style.display = 'none';
        document.getElementById('appContainer').classList.add('active');
        
        this.loadUserData();
        this.renderHome();
        this.renderCalendar();
        this.updateReminderStatus();
        this.checkAndSendReminders();
    }
    
    loadUserData() {
        this.userEvents = this.getUserEvents(this.currentUser);
        
        // Update UI
        document.getElementById('userName').textContent = this.currentUser.split(' ')[0];
        document.getElementById('currentUserDisplay').textContent = this.currentUser;
        document.getElementById('currentPhoneDisplay').textContent = this.phoneNumber || 'Not set';
        document.getElementById('currentApiKeyDisplay').textContent = this.apiKey ? '••••' + this.apiKey.slice(-2) : 'Not set';
        
        // Show WhatsApp badge if configured
        const badge = document.getElementById('whatsappBadge');
        if (this.apiKey && this.phoneNumber) {
            badge.style.display = 'flex';
        } else {
            badge.style.display = 'none';
        }
        
        // Last reminder
        const lastSent = localStorage.getItem('dlbc_last_reminder');
        document.getElementById('lastReminderDisplay').textContent = lastSent || 'Never';
        
        // Stats
        const leaderEvents = this.userEvents.filter(e => 
            ['MODERATOR', 'TEACHER', 'CHORUS LEADER', 'PRAYER'].includes(e.role)
        );
        const standbyEvents = this.userEvents.filter(e => e.role === 'STANDBY');
        
        document.getElementById('totalEvents').textContent = this.userEvents.length;
        document.getElementById('moderatorCount').textContent = leaderEvents.length;
        document.getElementById('standbyCount').textContent = standbyEvents.length;
    }
    
    parseDate(dateStr) {
        const [year, month, day] = dateStr.split('-').map(Number);
        return new Date(year, month - 1, day);
    }
    
    formatDate(dateStr) {
        const date = this.parseDate(dateStr);
        return date.toLocaleDateString('en-US', { 
            weekday: 'short', 
            month: 'short', 
            day: 'numeric' 
        });
    }
    
    getUserEvents(userName) {
        const events = [];
        
        // Tuesday Bible Study (Moderator/Standby)
        if (typeof TUESDAY_ROSTER !== 'undefined') {
            TUESDAY_ROSTER.forEach(item => {
                if (item.moderator === userName) {
                    events.push({ date: item.date, name: 'Tuesday Bible Study', type: 'tuesday', role: 'MODERATOR', partner: item.standby, time: '7:00 PM' });
                } else if (item.standby === userName) {
                    events.push({ date: item.date, name: 'Tuesday Bible Study', type: 'tuesday', role: 'STANDBY', partner: item.moderator, time: '7:00 PM' });
                }
            });
        }
        
        // Tuesday Chorus
        if (typeof CHORUS_TBS_ROSTER !== 'undefined') {
            CHORUS_TBS_ROSTER.forEach(item => {
                if (item.leader === userName) {
                    events.push({ date: item.date, name: 'Tuesday Bible Study', type: 'tuesday', role: 'CHORUS LEADER', partner: null, time: '7:00 PM' });
                }
            });
        }
        
        // Thursday Prayer Meeting
        if (typeof THURSDAY_ROSTER !== 'undefined') {
            THURSDAY_ROSTER.forEach(item => {
                if (item.moderator === userName) {
                    events.push({ date: item.date, name: 'Thursday Prayer Meeting', type: 'thursday', role: 'MODERATOR', partner: item.standby, time: '7:00 PM' });
                } else if (item.standby === userName) {
                    events.push({ date: item.date, name: 'Thursday Prayer Meeting', type: 'thursday', role: 'STANDBY', partner: item.moderator, time: '7:00 PM' });
                }
            });
        }
        
        // Friday Revival Hour (Moderator/Standby)
        if (typeof FRIDAY_ROSTER !== 'undefined') {
            FRIDAY_ROSTER.forEach(item => {
                if (item.moderator === userName) {
                    events.push({ date: item.date, name: 'Friday Revival Hour', type: 'friday', role: 'MODERATOR', partner: item.standby, time: '7:00 PM' });
                } else if (item.standby === userName) {
                    events.push({ date: item.date, name: 'Friday Revival Hour', type: 'friday', role: 'STANDBY', partner: item.moderator, time: '7:00 PM' });
                }
            });
        }
        
        // Friday Chorus
        if (typeof CHORUS_FRH_ROSTER !== 'undefined') {
            CHORUS_FRH_ROSTER.forEach(item => {
                if (item.leader === userName) {
                    events.push({ date: item.date, name: 'Friday Revival Hour', type: 'friday', role: 'CHORUS LEADER', partner: null, time: '7:00 PM' });
                }
            });
        }
        
        // GCK Prayer Day
        if (typeof GCK_ASSIGNMENTS !== 'undefined') {
            Object.entries(GCK_ASSIGNMENTS).forEach(([day, people]) => {
                if (people.includes(userName)) {
                    const dayNum = parseInt(day);
                    const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
                    const partners = people.filter(p => p !== userName);
                    const dates = this.getAllWeekdaysIn2026(dayNum);
                    dates.forEach(date => {
                        events.push({
                            date: date,
                            name: `GCK Prayer Day - ${dayNames[dayNum]}`,
                            type: 'gck',
                            role: 'PRAYER',
                            partner: partners.length > 0 ? partners.join(', ') : null,
                            time: '6 AM, 12 PM, 3 PM'
                        });
                    });
                }
            });
        }
        
        // Children's BTS
        if (typeof CHILDREN_BTS_ROSTER !== 'undefined') {
            CHILDREN_BTS_ROSTER.forEach(item => {
                if (item.moderator === userName) {
                    events.push({ date: item.date, name: "Children's BTS", type: 'bts', role: 'TEACHER', partner: null, time: '4:30 PM' });
                }
            });
        }
        
        // Wednesday Sisters Prayer
        if (typeof WEDNESDAY_SISTERS_ROSTER !== 'undefined') {
            WEDNESDAY_SISTERS_ROSTER.forEach(item => {
                if (item.moderator === userName) {
                    events.push({ date: item.date, name: 'Wednesday Sisters Prayer', type: 'wednesday', role: 'MODERATOR', partner: null, time: '7:00 PM' });
                }
            });
        }
        
        // Sort by date
        events.sort((a, b) => this.parseDate(a.date) - this.parseDate(b.date));
        return events;
    }
    
    getAllWeekdaysIn2026(weekday) {
        const dates = [];
        const jsWeekday = weekday === 6 ? 0 : weekday + 1;
        let d = new Date(2026, 0, 1);
        while (d.getDay() !== jsWeekday) d.setDate(d.getDate() + 1);
        while (d.getFullYear() === 2026) {
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            dates.push(`${year}-${month}-${day}`);
            d.setDate(d.getDate() + 7);
        }
        return dates;
    }
    
    // ==================== WhatsApp Functions ====================
    
    async sendWhatsAppMessage(message) {
        if (!this.phoneNumber || !this.apiKey) {
            console.log('WhatsApp not configured');
            return false;
        }
        
        try {
            const encodedMessage = encodeURIComponent(message);
            const url = `https://api.callmebot.com/whatsapp.php?phone=${this.phoneNumber}&text=${encodedMessage}&apikey=${this.apiKey}`;
            
            // Use image to bypass CORS (callmebot trick)
            const img = new Image();
            img.src = url;
            
            console.log('WhatsApp message sent:', message.substring(0, 50) + '...');
            return true;
        } catch (error) {
            console.error('WhatsApp error:', error);
            return false;
        }
    }
    
    async testWhatsApp() {
        if (!this.phoneNumber || !this.apiKey) {
            this.showToast('Please set up WhatsApp first', 'error');
            return;
        }
        
        this.showToast('Sending test message...', 'success');
        const success = await this.sendWhatsAppMessage(`✅ Test from DLBC Roster App\n\nYour WhatsApp reminders are working!\n\nTime: ${new Date().toLocaleString()}`);
        
        if (success) {
            this.showToast('Test message sent! Check WhatsApp', 'success');
        }
    }
    
    getPendingReminders() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const reminders = [];
        const todayStr = today.toISOString().split('T')[0];
        
        this.userEvents.forEach(event => {
            const eventDate = this.parseDate(event.date);
            const diffDays = Math.ceil((eventDate - today) / (1000 * 60 * 60 * 24));
            
            // Check for reminders: 7 days, 3 days, 1 day, same day
            const reminderDays = [7, 3, 1, 0];
            
            reminderDays.forEach(days => {
                if (diffDays === days) {
                    const reminderKey = `${event.date}-${event.name}-${event.role}-${days}`;
                    const sentToday = this.sentReminders[reminderKey] === todayStr;
                    
                    if (!sentToday) {
                        reminders.push({
                            event: event,
                            daysUntil: days,
                            key: reminderKey
                        });
                    }
                }
            });
        });
        
        return reminders;
    }
    
    updateReminderStatus() {
        const pending = this.getPendingReminders();
        const statusDiv = document.getElementById('reminderStatus');
        const remindersDiv = document.getElementById('upcomingReminders');
        const sendBtn = document.getElementById('sendRemindersBtn');
        
        if (!this.apiKey || !this.phoneNumber) {
            statusDiv.className = 'reminder-status none';
            statusDiv.innerHTML = '⚠️ WhatsApp not set up. <a href="#" onclick="app.logout();return false;">Set up now</a>';
            remindersDiv.innerHTML = '';
            sendBtn.style.display = 'none';
            return;
        }
        
        if (pending.length === 0) {
            statusDiv.className = 'reminder-status sent';
            statusDiv.innerHTML = '✅ All reminders sent! No pending reminders.';
            remindersDiv.innerHTML = '';
            sendBtn.style.display = 'none';
        } else {
            statusDiv.className = 'reminder-status pending';
            statusDiv.innerHTML = `📬 ${pending.length} reminder(s) ready to send`;
            
            remindersDiv.innerHTML = pending.slice(0, 3).map(r => {
                const daysText = r.daysUntil === 0 ? 'TODAY' : 
                                 r.daysUntil === 1 ? 'Tomorrow' : 
                                 `In ${r.daysUntil} days`;
                return `
                    <div class="upcoming-reminder">
                        <div class="event-name">${r.event.name} - ${r.event.role}</div>
                        <div class="event-details">${daysText} • ${this.formatDate(r.event.date)}</div>
                    </div>
                `;
            }).join('');
            
            sendBtn.style.display = 'flex';
        }
    }
    
    async checkAndSendReminders() {
        // Auto-send reminders when app opens
        if (!this.apiKey || !this.phoneNumber) return;
        
        const pending = this.getPendingReminders();
        if (pending.length > 0) {
            // Wait a moment then update UI
            setTimeout(() => this.updateReminderStatus(), 500);
        }
    }
    
    async sendPendingReminders() {
        const pending = this.getPendingReminders();
        if (pending.length === 0) {
            this.showToast('No reminders to send', 'success');
            return;
        }
        
        const btn = document.getElementById('sendRemindersBtn');
        btn.disabled = true;
        btn.innerHTML = '<div class="spinner"></div> Sending...';
        
        const todayStr = new Date().toISOString().split('T')[0];
        let sentCount = 0;
        
        for (const reminder of pending) {
            const message = this.formatReminderMessage(reminder);
            await this.sendWhatsAppMessage(message);
            
            // Mark as sent
            this.sentReminders[reminder.key] = todayStr;
            sentCount++;
            
            // Wait between messages to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
        // Save sent reminders
        localStorage.setItem('dlbc_sent_reminders', JSON.stringify(this.sentReminders));
        localStorage.setItem('dlbc_last_reminder', new Date().toLocaleString());
        
        btn.disabled = false;
        btn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg> Send Reminders Now';
        
        this.showToast(`✅ ${sentCount} reminder(s) sent to WhatsApp!`, 'success');
        this.updateReminderStatus();
        this.loadUserData();
    }
    
    formatReminderMessage(reminder) {
        const event = reminder.event;
        const days = reminder.daysUntil;
        
        let timeText = '';
        if (days === 0) timeText = '🔴 TODAY';
        else if (days === 1) timeText = '🟡 TOMORROW';
        else if (days === 3) timeText = '🟢 In 3 days';
        else if (days === 7) timeText = '📅 In 1 week';
        
        let message = `🙏 *DLBC MEXICO REMINDER*\n\n`;
        message += `${timeText}\n\n`;
        message += `📌 *${event.name}*\n`;
        message += `👤 Your Role: *${event.role}*\n`;
        message += `📅 Date: ${this.formatDate(event.date)}\n`;
        message += `🕐 Time: ${event.time}\n`;
        
        if (event.partner) {
            if (event.role === 'STANDBY') {
                message += `\n👥 Moderator: ${event.partner}`;
            } else if (event.role === 'MODERATOR') {
                message += `\n👥 Standby: ${event.partner}`;
            } else if (event.type === 'gck') {
                message += `\n👥 Praying with: ${event.partner}`;
            }
        }
        
        message += `\n\n_God bless you!_`;
        
        return message;
    }
    
    // ==================== UI Functions ====================
    
    renderHome() {
        const container = document.getElementById('upcomingEvents');
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const upcoming = this.userEvents
            .filter(e => this.parseDate(e.date) >= today)
            .slice(0, 5);
        
        if (upcoming.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="icon">📅</div>
                    <p>No upcoming events</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = upcoming.map(event => this.renderEventCard(event)).join('');
    }
    
    renderEventCard(event) {
        const formattedDate = this.formatDate(event.date);
        
        let roleClass = 'moderator';
        if (event.role === 'STANDBY') roleClass = 'standby';
        else if (event.type === 'gck') roleClass = 'gck';
        
        let roleBadgeClass = 'role-moderator';
        if (event.role === 'STANDBY') roleBadgeClass = 'role-standby';
        else if (event.type === 'gck') roleBadgeClass = 'role-gck';
        
        let partnerInfo = '';
        if (event.partner) {
            if (event.role === 'STANDBY') {
                partnerInfo = `<span>👤 Moderator: ${event.partner}</span>`;
            } else if (event.role === 'MODERATOR') {
                partnerInfo = `<span>👤 Standby: ${event.partner}</span>`;
            } else if (event.type === 'gck') {
                partnerInfo = `<span>👤 With: ${event.partner}</span>`;
            }
        }
        
        return `
            <div class="event-card ${roleClass}">
                <div class="event-header">
                    <div class="event-name">${event.name}</div>
                    <div class="event-role ${roleBadgeClass}">${event.role}</div>
                </div>
                <div class="event-details">
                    <span>📅 ${formattedDate}</span>
                    <span>🕐 ${event.time}</span>
                    ${partnerInfo}
                </div>
            </div>
        `;
    }
    
    filterSchedule(filter) {
        this.scheduleFilter = filter;
        document.querySelectorAll('.tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.filter === filter);
        });
        this.renderSchedule();
    }
    
    renderSchedule() {
        const container = document.getElementById('scheduleList');
        let filtered = this.userEvents;
        if (this.scheduleFilter !== 'all') {
            filtered = this.userEvents.filter(e => e.type === this.scheduleFilter);
        }
        
        if (filtered.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="icon">📋</div>
                    <p>No events in this category</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = filtered.map(event => this.renderEventCard(event)).join('');
    }
    
    renderCalendar() {
        const grid = document.getElementById('calendarGrid');
        const monthYear = document.getElementById('monthYear');
        
        const year = this.currentMonth.getFullYear();
        const month = this.currentMonth.getMonth();
        
        monthYear.textContent = this.currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        
        const headers = grid.querySelectorAll('.calendar-day-header');
        grid.innerHTML = '';
        headers.forEach(h => grid.appendChild(h));
        
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const daysInPrevMonth = new Date(year, month, 0).getDate();
        
        const eventDates = new Set(
            this.userEvents
                .filter(e => {
                    const d = this.parseDate(e.date);
                    return d.getMonth() === month && d.getFullYear() === year;
                })
                .map(e => this.parseDate(e.date).getDate())
        );
        
        const today = new Date();
        
        for (let i = firstDay - 1; i >= 0; i--) {
            const day = daysInPrevMonth - i;
            const div = document.createElement('div');
            div.className = 'calendar-day other-month';
            div.textContent = day;
            grid.appendChild(div);
        }
        
        for (let day = 1; day <= daysInMonth; day++) {
            const div = document.createElement('div');
            div.className = 'calendar-day';
            div.textContent = day;
            
            if (year === today.getFullYear() && month === today.getMonth() && day === today.getDate()) {
                div.classList.add('today');
            }
            
            if (eventDates.has(day)) {
                div.classList.add('has-event');
            }
            
            div.addEventListener('click', () => this.showDayEvents(year, month, day));
            grid.appendChild(div);
        }
        
        const totalCells = firstDay + daysInMonth;
        const remainingCells = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
        for (let i = 1; i <= remainingCells; i++) {
            const div = document.createElement('div');
            div.className = 'calendar-day other-month';
            div.textContent = i;
            grid.appendChild(div);
        }
    }
    
    changeMonth(delta) {
        this.currentMonth.setMonth(this.currentMonth.getMonth() + delta);
        this.renderCalendar();
    }
    
    showDayEvents(year, month, day) {
        const container = document.getElementById('dayEvents');
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dayEvents = this.userEvents.filter(e => e.date === dateStr);
        
        if (dayEvents.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="icon">📅</div>
                    <p>No events on this day</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = dayEvents.map(event => this.renderEventCard(event)).join('');
    }
    
    navigateTo(page) {
        this.currentPage = page;
        
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.page === page);
        });
        
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        document.getElementById(`${page}Page`).classList.add('active');
        
        if (page === 'schedule') this.renderSchedule();
        else if (page === 'calendar') this.renderCalendar();
    }
    
    showToast(message, type = 'success') {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.className = `toast show ${type}`;
        setTimeout(() => toast.classList.remove('show'), 3000);
    }
    
    logout() {
        localStorage.removeItem('dlbc_user');
        localStorage.removeItem('dlbc_phone');
        localStorage.removeItem('dlbc_apikey');
        localStorage.removeItem('dlbc_sent_reminders');
        localStorage.removeItem('dlbc_last_reminder');
        this.currentUser = null;
        this.phoneNumber = null;
        this.apiKey = null;
        this.sentReminders = {};
        this.showLogin();
    }
    
    async registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                await navigator.serviceWorker.register('./sw.js');
            } catch (error) {
                console.log('SW registration failed:', error);
            }
        }
    }
}

// Global reference for inline handlers
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new ChurchRosterApp();
    app.init();
});
