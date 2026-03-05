import { getBooks, getChapters, updateChapter, deleteBook, deleteChapter } from '../storage/database.js';
import { showAddBookModal, showAddChapterModal } from '../utils/helpers.js';

export function renderBooks(container) {
    const books = getBooks();
    const allChapters = getChapters();
    
    let html = `
        <div class="content-header">
            <h1 class="page-title">Books & Chapters</h1>
            <button class="primary-btn" id="addBookMainBtn"><i class="fas fa-plus"></i> Add Book</button>
        </div>
        <div class="books-container">
    `;
    if (books.length === 0) {
        html += '<div class="glass-card" style="text-align:center;">No books yet. Click "Add Book" to start.</div>';
    } else {
        books.forEach(book => {
            const chapters = allChapters.filter(c => c.bookId === book.id);
            html += `
                <div class="book-item" data-book-id="${book.id}">
                    <div class="book-header">
                        <i class="fas fa-chevron-right toggle-icon"></i>
                        <h3>${book.name}</h3>
                        <span style="background:rgba(255,255,255,0.1); padding:4px 12px; border-radius:30px;">${book.subject}</span>
                        <div class="book-actions">
                            <button class="add-chapter-btn"><i class="fas fa-plus"></i></button>
                            <button class="delete-book-btn"><i class="fas fa-trash"></i></button>
                        </div>
                    </div>
                    <div class="chapters-container">
                        ${chapters.length === 0 ? '<p>No chapters</p>' : chapters.map(ch => `
                            <div class="chapter-item" data-chapter-id="${ch.id}">
                                <span style="min-width:120px;">${ch.name}</span>
                                <span class="difficulty-tag ${ch.difficulty}">${ch.difficulty}</span>
                                <div class="chapter-progress">
                                    <input type="range" min="0" max="100" value="${ch.progress||0}" class="progress-slider" data-id="${ch.id}">
                                    <span class="chapter-percent">${ch.progress||0}%</span>
                                </div>
                                <button class="delete-chapter-btn"><i class="fas fa-trash"></i></button>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        });
    }
    html += '</div>';
    container.innerHTML = html;
    
    // Event listeners
    document.getElementById('addBookMainBtn').addEventListener('click', showAddBookModal);
    
    document.querySelectorAll('.book-header').forEach(h => {
        h.addEventListener('click', (e) => {
            if (e.target.closest('button')) return;
            const container = h.nextElementSibling;
            const icon = h.querySelector('.toggle-icon');
            container.classList.toggle('open');
            icon.classList.toggle('open');
        });
    });
    
    document.querySelectorAll('.add-chapter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const bookId = btn.closest('.book-item').dataset.bookId;
            showAddChapterModal(bookId);
        });
    });
    
    document.querySelectorAll('.delete-book-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const bookId = btn.closest('.book-item').dataset.bookId;
            if (confirm('Delete this book and all its chapters?')) {
                deleteBook(bookId);
                renderBooks(container);
            }
        });
    });
    
    document.querySelectorAll('.progress-slider').forEach(slider => {
        slider.addEventListener('input', (e) => {
            e.target.closest('.chapter-item').querySelector('.chapter-percent').textContent = e.target.value + '%';
        });
        slider.addEventListener('change', (e) => {
            updateChapter(e.target.dataset.id, { progress: parseInt(e.target.value) });
        });
    });
    
    document.querySelectorAll('.delete-chapter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const chapterId = btn.closest('.chapter-item').dataset.chapterId;
            if (confirm('Delete this chapter?')) {
                deleteChapter(chapterId);
                renderBooks(container);
            }
        });
    });
}
