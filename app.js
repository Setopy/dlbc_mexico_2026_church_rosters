/**
 * Church Roster PWA - Main Application
 * Deeper Life Bible Church, Mexico
 * Fixed: Date display timezone issue
 */

class ChurchRosterApp {
    constructor() {
        this.currentUser = null;
        this.currentPage = 'home';
        this.currentMonth = new Date(2026, 0, 1); // January 2026
        this.scheduleFilter = 'all';
        this.userEvents = [];
    }
    
    init() {
        // Check for saved user
        const savedUser = localStorage.getItem('dlbc_user');
        if (savedUser) {
            this.currentUser = savedUser;
            this.showApp();
        } else {
            this.showLogin();
        }
        
        this.setupEventListeners();
        this.registerServiceWorker();
    }
    
    setupEventListeners() {
        // Login
        document.getElementById('loginBtn').addEventListener('click', () => this.handleLogin());
        document.getElementById('memberSelect').addEventListener('change', (e) => {
            document.getElementById('loginBtn').disabled = !e.target.value;
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
        
        // Calendar navigation
        document.getElementById('prevMonth').addEventListener('click', () => this.changeMonth(-1));
        document.getElementById('nextMonth').addEventListener('click', () => this.changeMonth(1));
        
        // Settings
        document.getElementById('notificationToggle').addEventListener('click', () => this.toggleNotifications());
        document.getElementById('logoutBtn').addEventListener('click', () => this.logout());
    }
    
    handleLogin() {
        const select = document.getElementById('memberSelect');
        const selectedUser = select.value;
        
        if (selectedUser) {
            this.currentUser = selectedUser;
            localStorage.setItem('dlbc_user', selectedUser);
            this.showApp();
        }
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
    }
    
    loadUserData() {
        // Get user's events from the schedule data
        this.userEvents = this.getUserEvents(this.currentUser);
        
        // Update displays
        document.getElementById('userName').textContent = this.currentUser.split(' ')[0];
        document.getElementById('currentUserDisplay').textContent = this.currentUser;
        
        // Calculate stats
        const moderatorEvents = this.userEvents.filter(e => 
            e.role === 'MODERATOR' || e.role === 'TEACHER' || e.role === 'CHORUS LEADER' || 
            e.type === 'gck' || e.type === 'bts' || e.type === 'wednesday'
        );
        const standbyEvents = this.userEvents.filter(e => e.role === 'STANDBY');
        
        document.getElementById('totalEvents').textContent = this.userEvents.length;
        document.getElementById('moderatorCount').textContent = moderatorEvents.length;
        document.getElementById('standbyCount').textContent = standbyEvents.length;
    }
    
    // Helper function to parse date string without timezone issues
    parseDate(dateStr) {
        // dateStr is in format "YYYY-MM-DD"
        const [year, month, day] = dateStr.split('-').map(Number);
        return new Date(year, month - 1, day); // month is 0-indexed
    }
    
    // Helper function to format date for display
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
        
        // Check Tuesday Bible Study (Moderator/Standby)
        if (typeof TUESDAY_ROSTER !== 'undefined') {
            TUESDAY_ROSTER.forEach(item => {
                if (item.moderator === userName) {
                    events.push({
                        date: item.date,
                        name: 'Tuesday Bible Study',
                        type: 'tuesday',
                        role: 'MODERATOR',
                        partner: item.standby,
                        time: '7:00 PM'
                    });
                } else if (item.standby === userName) {
                    events.push({
                        date: item.date,
                        name: 'Tuesday Bible Study',
                        type: 'tuesday',
                        role: 'STANDBY',
                        partner: item.moderator,
                        time: '7:00 PM'
                    });
                }
            });
        }
        
        // Check Tuesday Bible Study (Chorus)
        if (typeof CHORUS_TBS_ROSTER !== 'undefined') {
            CHORUS_TBS_ROSTER.forEach(item => {
                if (item.leader === userName) {
                    events.push({
                        date: item.date,
                        name: 'Tuesday Bible Study',
                        type: 'tuesday',
                        role: 'CHORUS LEADER',
                        partner: null,
                        time: '7:00 PM'
                    });
                }
            });
        }
        
        // Check Thursday Prayer Meeting
        if (typeof THURSDAY_ROSTER !== 'undefined') {
            THURSDAY_ROSTER.forEach(item => {
                if (item.moderator === userName) {
                    events.push({
                        date: item.date,
                        name: 'Thursday Prayer Meeting',
                        type: 'thursday',
                        role: 'MODERATOR',
                        partner: item.standby,
                        time: '7:00 PM'
                    });
                } else if (item.standby === userName) {
                    events.push({
                        date: item.date,
                        name: 'Thursday Prayer Meeting',
                        type: 'thursday',
                        role: 'STANDBY',
                        partner: item.moderator,
                        time: '7:00 PM'
                    });
                }
            });
        }
        
        // Check Friday Revival Hour (Moderator/Standby)
        if (typeof FRIDAY_ROSTER !== 'undefined') {
            FRIDAY_ROSTER.forEach(item => {
                if (item.moderator === userName) {
                    events.push({
                        date: item.date,
                        name: 'Friday Revival Hour',
                        type: 'friday',
                        role: 'MODERATOR',
                        partner: item.standby,
                        time: '7:00 PM'
                    });
                } else if (item.standby === userName) {
                    events.push({
                        date: item.date,
                        name: 'Friday Revival Hour',
                        type: 'friday',
                        role: 'STANDBY',
                        partner: item.moderator,
                        time: '7:00 PM'
                    });
                }
            });
        }
        
        // Check Friday Revival Hour (Chorus)
        if (typeof CHORUS_FRH_ROSTER !== 'undefined') {
            CHORUS_FRH_ROSTER.forEach(item => {
                if (item.leader === userName) {
                    events.push({
                        date: item.date,
                        name: 'Friday Revival Hour',
                        type: 'friday',
                        role: 'CHORUS LEADER',
                        partner: null,
                        time: '7:00 PM'
                    });
                }
            });
        }
        
        // Check GCK Prayer Day
        if (typeof GCK_ASSIGNMENTS !== 'undefined') {
            Object.entries(GCK_ASSIGNMENTS).forEach(([day, people]) => {
                if (people.includes(userName)) {
                    const dayNum = parseInt(day);
                    const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
                    const partners = people.filter(p => p !== userName);
                    
                    // Generate all dates for this day in 2026
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
        
        // Check Children's BTS
        if (typeof CHILDREN_BTS_ROSTER !== 'undefined') {
            CHILDREN_BTS_ROSTER.forEach(item => {
                if (item.moderator === userName) {
                    events.push({
                        date: item.date,
                        name: "Children's BTS",
                        type: 'bts',
                        role: 'TEACHER',
                        partner: null,
                        time: '4:30 PM'
                    });
                }
            });
        }
        
        // Check Wednesday Sisters Prayer
        if (typeof WEDNESDAY_SISTERS_ROSTER !== 'undefined') {
            WEDNESDAY_SISTERS_ROSTER.forEach(item => {
                if (item.moderator === userName) {
                    events.push({
                        date: item.date,
                        name: 'Wednesday Sisters Prayer',
                        type: 'wednesday',
                        role: 'MODERATOR',
                        partner: null,
                        time: '7:00 PM'
                    });
                }
            });
        }
        
        // Sort by date
        events.sort((a, b) => {
            const dateA = this.parseDate(a.date);
            const dateB = this.parseDate(b.date);
            return dateA - dateB;
        });
        
        return events;
    }
    
    getAllWeekdaysIn2026(weekday) {
        const dates = [];
        // JavaScript: 0=Sunday, 1=Monday, ..., 6=Saturday
        // Our data: 0=Monday, 1=Tuesday, ..., 6=Sunday
        // Convert: our 6 (Sunday) = JS 0, our 0 (Monday) = JS 1, etc.
        const jsWeekday = weekday === 6 ? 0 : weekday + 1;
        
        let d = new Date(2026, 0, 1); // January 1, 2026
        
        // Find first occurrence of this weekday
        while (d.getDay() !== jsWeekday) {
            d.setDate(d.getDate() + 1);
        }
        
        // Collect all occurrences in 2026
        while (d.getFullYear() === 2026) {
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            dates.push(`${year}-${month}-${day}`);
            d.setDate(d.getDate() + 7);
        }
        
        return dates;
    }
    
    renderHome() {
        const container = document.getElementById('upcomingEvents');
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Get next 5 upcoming events
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
        
        const roleClass = event.role === 'MODERATOR' || event.role === 'TEACHER' || event.role === 'CHORUS LEADER' ? 'moderator' : 
                          event.role === 'STANDBY' ? 'standby' : 'gck';
        const roleBadgeClass = event.role === 'MODERATOR' || event.role === 'TEACHER' || event.role === 'CHORUS LEADER' ? 'role-moderator' : 
                               event.role === 'STANDBY' ? 'role-standby' : 'role-gck';
        
        let partnerInfo = '';
        if (event.partner) {
            if (event.role === 'STANDBY') {
                partnerInfo = `<span>👤 Moderator: ${event.partner}</span>`;
            } else if (event.role === 'MODERATOR') {
                partnerInfo = `<span>👤 With: ${event.partner}</span>`;
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
        
        // Update tabs
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
        
        monthYear.textContent = this.currentMonth.toLocaleDateString('en-US', { 
            month: 'long', 
            year: 'numeric' 
        });
        
        // Clear previous days (keep headers)
        const headers = grid.querySelectorAll('.calendar-day-header');
        grid.innerHTML = '';
        headers.forEach(h => grid.appendChild(h));
        
        // Get first day of month and total days
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const daysInPrevMonth = new Date(year, month, 0).getDate();
        
        // Get user's event dates for this month
        const eventDates = new Set(
            this.userEvents
                .filter(e => {
                    const d = this.parseDate(e.date);
                    return d.getMonth() === month && d.getFullYear() === year;
                })
                .map(e => this.parseDate(e.date).getDate())
        );
        
        const today = new Date();
        
        // Previous month days
        for (let i = firstDay - 1; i >= 0; i--) {
            const day = daysInPrevMonth - i;
            const div = document.createElement('div');
            div.className = 'calendar-day other-month';
            div.textContent = day;
            grid.appendChild(div);
        }
        
        // Current month days
        for (let day = 1; day <= daysInMonth; day++) {
            const div = document.createElement('div');
            div.className = 'calendar-day';
            div.textContent = day;
            
            // Check if today
            if (year === today.getFullYear() && month === today.getMonth() && day === today.getDate()) {
                div.classList.add('today');
            }
            
            // Check if has event
            if (eventDates.has(day)) {
                div.classList.add('has-event');
            }
            
            div.addEventListener('click', () => this.showDayEvents(year, month, day));
            grid.appendChild(div);
        }
        
        // Next month days
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
        
        // Update navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.page === page);
        });
        
        // Update pages
        document.querySelectorAll('.page').forEach(p => {
            p.classList.remove('active');
        });
        document.getElementById(`${page}Page`).classList.add('active');
        
        // Render page content
        if (page === 'schedule') {
            this.renderSchedule();
        } else if (page === 'calendar') {
            this.renderCalendar();
        }
    }
    
    async toggleNotifications() {
        const toggle = document.getElementById('notificationToggle');
        
        if (!toggle.classList.contains('active')) {
            // Request permission
            if ('Notification' in window) {
                const permission = await Notification.requestPermission();
                if (permission === 'granted') {
                    toggle.classList.add('active');
                    localStorage.setItem('dlbc_notifications', 'enabled');
                    this.scheduleNotifications();
                }
            }
        } else {
            toggle.classList.remove('active');
            localStorage.removeItem('dlbc_notifications');
        }
    }
    
    scheduleNotifications() {
        // This would set up push notifications via service worker
        // For now, we'll use the Notification API for basic reminders
        if ('serviceWorker' in navigator && 'PushManager' in window) {
            console.log('Push notifications supported');
            // Implementation would require a backend server
        }
    }
    
    logout() {
        localStorage.removeItem('dlbc_user');
        this.currentUser = null;
        this.showLogin();
    }
    
    async registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('./sw.js');
                console.log('ServiceWorker registered:', registration);
            } catch (error) {
                console.log('ServiceWorker registration failed:', error);
            }
        }
    }
}
