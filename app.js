/**
 * Church Roster PWA - Simple Version
 * Deeper Life Bible Church, Mexico - 2026
 */

class ChurchRosterApp {
    constructor() {
        this.currentUser = null;
        this.currentPage = 'home';
        this.currentMonth = new Date(2026, 0, 1);
        this.scheduleFilter = 'all';
        this.userEvents = [];
    }
    
    init() {
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
        const memberSelect = document.getElementById('memberSelect');
        const loginBtn = document.getElementById('loginBtn');
        
        memberSelect.addEventListener('change', (e) => {
            loginBtn.disabled = !e.target.value;
        });
        
        loginBtn.addEventListener('click', () => this.handleLogin());
        
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                this.navigateTo(e.currentTarget.dataset.page);
            });
        });
        
        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.filterSchedule(e.target.dataset.filter);
            });
        });
        
        document.getElementById('prevMonth').addEventListener('click', () => this.changeMonth(-1));
        document.getElementById('nextMonth').addEventListener('click', () => this.changeMonth(1));
        document.getElementById('logoutBtn').addEventListener('click', () => this.logout());
    }
    
    handleLogin() {
        this.currentUser = document.getElementById('memberSelect').value;
        if (this.currentUser) {
            localStorage.setItem('dlbc_user', this.currentUser);
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
        this.userEvents = this.getUserEvents(this.currentUser);
        
        document.getElementById('userName').textContent = this.currentUser.split(' ')[0];
        document.getElementById('currentUserDisplay').textContent = this.currentUser;
        
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
        return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    }
    
    getUserEvents(userName) {
        const events = [];
        
        // Tuesday Bible Study
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
        
        // Thursday Prayer
        if (typeof THURSDAY_ROSTER !== 'undefined') {
            THURSDAY_ROSTER.forEach(item => {
                if (item.moderator === userName) {
                    events.push({ date: item.date, name: 'Thursday Prayer Meeting', type: 'thursday', role: 'MODERATOR', partner: item.standby, time: '7:00 PM' });
                } else if (item.standby === userName) {
                    events.push({ date: item.date, name: 'Thursday Prayer Meeting', type: 'thursday', role: 'STANDBY', partner: item.moderator, time: '7:00 PM' });
                }
            });
        }
        
        // Friday Revival Hour
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
                            name: `GCK Prayer - ${dayNames[dayNum]}`,
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
    
    renderHome() {
        const container = document.getElementById('upcomingEvents');
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const upcoming = this.userEvents.filter(e => this.parseDate(e.date) >= today).slice(0, 5);
        
        if (upcoming.length === 0) {
            container.innerHTML = '<div class="empty-state"><div class="icon">📅</div><p>No upcoming events</p></div>';
            return;
        }
        
        container.innerHTML = upcoming.map(e => this.renderEventCard(e)).join('');
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
            if (event.role === 'STANDBY') partnerInfo = `<span>👤 Moderator: ${event.partner}</span>`;
            else if (event.role === 'MODERATOR') partnerInfo = `<span>👤 Standby: ${event.partner}</span>`;
            else if (event.type === 'gck') partnerInfo = `<span>👤 With: ${event.partner}</span>`;
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
            container.innerHTML = '<div class="empty-state"><div class="icon">📋</div><p>No events in this category</p></div>';
            return;
        }
        
        container.innerHTML = filtered.map(e => this.renderEventCard(e)).join('');
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
            const div = document.createElement('div');
            div.className = 'calendar-day other-month';
            div.textContent = daysInPrevMonth - i;
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
            container.innerHTML = '<div class="empty-state"><div class="icon">📅</div><p>No events on this day</p></div>';
            return;
        }
        
        container.innerHTML = dayEvents.map(e => this.renderEventCard(e)).join('');
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
    
    logout() {
        localStorage.removeItem('dlbc_user');
        this.currentUser = null;
        this.showLogin();
    }
    
    async registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                await navigator.serviceWorker.register('./sw.js');
            } catch (e) {
                console.log('SW error:', e);
            }
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const app = new ChurchRosterApp();
    app.init();
});
