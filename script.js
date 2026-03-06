import { initDB, getBooks, getChapters, getNotes, getTasks, getStreak, getFlashcards, getDueFlashcards, addBook, addChapter, addNote, addTask, addFlashcard, updateChapter, updateTask, deleteBook, deleteChapter, deleteNote, deleteFlashcard, updateFlashcard, backupData } from './storage/database.js';
import { renderDashboard } from './components/dashboard.js';
import { renderCalendar } from './components/calendar.js';
import { renderBooks } from './components/books.js';
import { renderNotes } from './components/notes.js';
import { renderFlashcards } from './components/flashcards.js';
import { showModal, createModals } from './utils/helpers.js';
import { initSpacedRepetition } from './utils/spacedRepetition.js';

let currentTab = 'dashboard';

document.addEventListener('DOMContentLoaded', async () => {
    await initDB();
    initSpacedRepetition(); // sets up scheduler
    createModals();
    loadTab('dashboard');
    setupNavigation();
    setupThemeToggle();
    updateStreakDisplay();
});

function setupNavigation() {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => {
            const tab = item.dataset.tab;
            loadTab(tab);
        });
    });
}

function loadTab(tab) {
    currentTab = tab;
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.querySelector(`.nav-item[data-tab="${tab}"]`).classList.add('active');
    
    const content = document.getElementById('mainContent');
    switch(tab) {
        case 'dashboard': renderDashboard(content); break;
        case 'calendar': renderCalendar(content); break;
        case 'books': renderBooks(content); break;
        case 'notes': renderNotes(content); break;
        case 'flashcards': renderFlashcards(content); break;
    }
}

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("service-worker.js")
  .then(() => console.log("Service Worker Registered"));
}

function setupThemeToggle() {
    const toggle = document.getElementById('themeToggle');
    toggle.addEventListener('click', () => {
        document.body.classList.toggle('light-theme');
        const icon = toggle.querySelector('i');
        icon.classList.toggle('fa-moon');
        icon.classList.toggle('fa-sun');
    });
}

export function updateStreakDisplay() {
    const streak = getStreak();
    document.querySelector('#streakDisplay span').textContent = streak.count;
}

export { loadTab };
