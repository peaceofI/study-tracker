import { getTasks } from '../storage/database.js';
import { showAddTaskModal } from '../utils/helpers.js';

let currentMonth = new Date();

export function renderCalendar(container) {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const lastDate = new Date(year, month + 1, 0).getDate();
    const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    const todayStr = new Date().toDateString();
    
    let html = `
        <div class="content-header">
            <h1 class="page-title">Calendar</h1>
            <div class="calendar-nav">
                <button class="nav-btn" id="prevMonth"><i class="fas fa-chevron-left"></i></button>
                <h2>${monthNames[month]} ${year}</h2>
                <button class="nav-btn" id="nextMonth"><i class="fas fa-chevron-right"></i></button>
            </div>
        </div>
        <div class="glass-card">
            <div class="calendar-weekdays">
                ${['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d=>`<div>${d}</div>`).join('')}
            </div>
            <div class="calendar-grid" id="calendarGrid">
    `;
    for (let i=0; i<firstDay; i++) html += '<div class="calendar-day empty"></div>';
    for (let d=1; d<=lastDate; d++) {
        const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
        const tasks = getTasks(dateStr);
        const isToday = new Date(year, month, d).toDateString() === todayStr;
        html += `<div class="calendar-day ${isToday?'today':''} ${tasks.length?'has-event':''}" data-date="${dateStr}">
            <span class="day-number">${d}</span>${tasks.length?'<span class="event-dot"></span>':''}
        </div>`;
    }
    html += `
            </div>
        </div>
        <div class="glass-card" style="margin-top:1.5rem;">
            <h3>Today's Tasks</h3>
            <div id="todayTasksList"></div>
            <button class="primary-btn" id="addTaskBtn" style="margin-top:1rem;"><i class="fas fa-plus"></i> Add Task</button>
        </div>
    `;
    container.innerHTML = html;
    
    // Event listeners
    document.getElementById('prevMonth').addEventListener('click', ()=>{
        currentMonth.setMonth(currentMonth.getMonth()-1);
        renderCalendar(container);
    });
    document.getElementById('nextMonth').addEventListener('click', ()=>{
        currentMonth.setMonth(currentMonth.getMonth()+1);
        renderCalendar(container);
    });
    document.querySelectorAll('.calendar-day[data-date]').forEach(day => {
        day.addEventListener('click', ()=>{
            showAddTaskModal(day.dataset.date);
        });
    });
    document.getElementById('addTaskBtn').addEventListener('click', ()=>{
        showAddTaskModal(new Date().toISOString().split('T')[0]);
    });
    
    renderTodayTasks();
}

function renderTodayTasks() {
    const today = new Date().toISOString().split('T')[0];
    const tasks = getTasks(today);
    const list = document.getElementById('todayTasksList');
    if (!list) return;
    if (tasks.length === 0) {
        list.innerHTML = '<p>No tasks for today</p>';
        return;
    }
    list.innerHTML = tasks.map(t => `
        <div style="display:flex; align-items:center; gap:10px; padding:8px 0; border-bottom:1px solid var(--glass-border);">
            <input type="checkbox" ${t.completed?'checked':''} data-id="${t.id}">
            <span style="flex:1; ${t.completed?'text-decoration:line-through':''}">${t.name}</span>
            <span style="background:rgba(255,255,255,0.1); padding:4px 12px; border-radius:20px;">${t.subject}</span>
        </div>
    `).join('');
    
    document.querySelectorAll('#todayTasksList input[type=checkbox]').forEach(cb => {
        cb.addEventListener('change', (e)=>{
            import('../storage/database.js').then(m => m.updateTask(e.target.dataset.id, { completed: e.target.checked }));
        });
    });
}
