import { addTask, addBook, addChapter, addNote, addFlashcard } from '../storage/database.js';
import { loadTab, updateStreakDisplay } from '../script.js';

export function showModal(modalId) {
    document.querySelectorAll('.modal').forEach(m => m.classList.remove('active'));
    document.getElementById(modalId).classList.add('active');
}

export function closeModals() {
    document.querySelectorAll('.modal').forEach(m => m.classList.remove('active'));
}

export function createModals() {
    const container = document.getElementById('modalContainer');
    
    // Task modal
    container.innerHTML += `
        <div class="modal" id="taskModal">
            <div class="modal-content">
                <div class="modal-header"><h2>Add Task</h2><button class="close-modal"><i class="fas fa-times"></i></button></div>
                <form id="taskForm">
                    <div class="form-group"><label>Task</label><input type="text" id="taskName" required></div>
                    <div class="form-group"><label>Subject</label><select id="taskSubject"><option value="physics">Physics</option><option value="chemistry">Chemistry</option><option value="biology">Biology</option><option value="math">Math</option></select></div>
                    <div class="form-group"><label>Date</label><input type="date" id="taskDate" required></div>
                    <button type="submit" class="submit-btn">Add</button>
                </form>
            </div>
        </div>
    `;
    
    // Book modal
    container.innerHTML += `
        <div class="modal" id="bookModal">
            <div class="modal-content">
                <div class="modal-header"><h2>Add Book</h2><button class="close-modal"><i class="fas fa-times"></i></button></div>
                <form id="bookForm">
                    <div class="form-group"><label>Book Name</label><input type="text" id="bookName" required></div>
                    <div class="form-group"><label>Subject</label><select id="bookSubject"><option value="physics">Physics</option><option value="chemistry">Chemistry</option><option value="biology">Biology</option><option value="math">Math</option></select></div>
                    <button type="submit" class="submit-btn">Add</button>
                </form>
            </div>
        </div>
    `;
    
    // Chapter modal
    container.innerHTML += `
        <div class="modal" id="chapterModal">
            <div class="modal-content">
                <div class="modal-header"><h2>Add Chapter</h2><button class="close-modal"><i class="fas fa-times"></i></button></div>
                <form id="chapterForm">
                    <div class="form-group"><label>Chapter Name</label><input type="text" id="chapterName" required></div>
                    <div class="form-group"><label>Difficulty</label><select id="chapterDifficulty"><option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option></select></div>
                    <input type="hidden" id="parentBookId">
                    <button type="submit" class="submit-btn">Add</button>
                </form>
            </div>
        </div>
    `;
    
    // Note modal (text note only)
    container.innerHTML += `
        <div class="modal" id="noteModal">
            <div class="modal-content">
                <div class="modal-header"><h2>Add Text Note</h2><button class="close-modal"><i class="fas fa-times"></i></button></div>
                <form id="noteForm">
                    <div class="form-group"><label>Title</label><input type="text" id="noteTitle" required></div>
                    <div class="form-group"><label>Content</label><textarea id="noteContent" rows="3"></textarea></div>
                    <input type="hidden" id="noteChapterId">
                    <button type="submit" class="submit-btn">Add</button>
                </form>
            </div>
        </div>
    `;
    
    // Flashcard modal
    container.innerHTML += `
        <div class="modal" id="flashcardModal">
            <div class="modal-content">
                <div class="modal-header"><h2>Add Flashcard</h2><button class="close-modal"><i class="fas fa-times"></i></button></div>
                <form id="flashcardForm">
                    <div class="form-group"><label>Question</label><input type="text" id="cardQuestion" required></div>
                    <div class="form-group"><label>Answer</label><textarea id="cardAnswer" rows="3" required></textarea></div>
                    <div class="form-group"><label>Chapter (optional)</label><select id="cardChapterId"><option value="">None</option></select></div>
                    <button type="submit" class="submit-btn">Add</button>
                </form>
            </div>
        </div>
    `;
    
    // Pomodoro modal
    container.innerHTML += `
        <div class="modal" id="pomodoroModal">
            <div class="modal-content">
                <div class="modal-header"><h2>Pomodoro</h2><button class="close-modal"><i class="fas fa-times"></i></button></div>
                <div class="timer-display" id="timerDisplay">25:00</div>
                <div class="timer-controls">
                    <button class="timer-btn" id="startTimer">Start</button>
                    <button class="timer-btn" id="pauseTimer">Pause</button>
                    <button class="timer-btn" id="resetTimer">Reset</button>
                </div>
            </div>
        </div>
    `;
    
    // Setup forms
    document.getElementById('taskForm').addEventListener('submit', (e) => {
        e.preventDefault();
        addTask({
            name: document.getElementById('taskName').value,
            subject: document.getElementById('taskSubject').value,
            date: document.getElementById('taskDate').value
        });
        closeModals();
        loadTab('calendar');
    });
    
    document.getElementById('bookForm').addEventListener('submit', (e) => {
        e.preventDefault();
        addBook({
            name: document.getElementById('bookName').value,
            subject: document.getElementById('bookSubject').value
        });
        closeModals();
        loadTab('books');
    });
    
    document.getElementById('chapterForm').addEventListener('submit', (e) => {
        e.preventDefault();
        addChapter({
            name: document.getElementById('chapterName').value,
            difficulty: document.getElementById('chapterDifficulty').value,
            bookId: document.getElementById('parentBookId').value
        });
        closeModals();
        loadTab('books');
    });
    
    document.getElementById('noteForm').addEventListener('submit', (e) => {
        e.preventDefault();
        addNote({
            title: document.getElementById('noteTitle').value,
            content: document.getElementById('noteContent').value,
            chapterId: document.getElementById('noteChapterId').value,
            type: 'text'
        });
        closeModals();
        loadTab('notes');
    });
    
    document.getElementById('flashcardForm').addEventListener('submit', (e) => {
        e.preventDefault();
        addFlashcard({
            question: document.getElementById('cardQuestion').value,
            answer: document.getElementById('cardAnswer').value,
            chapterId: document.getElementById('cardChapterId').value || null
        });
        closeModals();
        loadTab('flashcards');
    });
    
    // Close buttons
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', closeModals);
    });
    
    // Pomodoro logic
    let timerInterval, timeLeft = 1500, running = false;
    const timerDisplay = document.getElementById('timerDisplay');
    function updateTimerDisplay() {
        const mins = Math.floor(timeLeft/60);
        const secs = timeLeft%60;
        timerDisplay.textContent = `${mins.toString().padStart(2,'0')}:${secs.toString().padStart(2,'0')}`;
    }
    document.getElementById('startTimer')?.addEventListener('click', () => {
        if (running) return;
        running = true;
        timerInterval = setInterval(() => {
            if (timeLeft <= 0) {
                clearInterval(timerInterval); running = false;
                alert('Pomodoro finished! Take a break.');
                timeLeft = 1500;
                updateTimerDisplay();
            } else { timeLeft--; updateTimerDisplay(); }
        }, 1000);
    });
    document.getElementById('pauseTimer')?.addEventListener('click', () => {
        clearInterval(timerInterval); running = false;
    });
    document.getElementById('resetTimer')?.addEventListener('click', () => {
        clearInterval(timerInterval); running = false;
        timeLeft = 1500;
        updateTimerDisplay();
    });
}

export function showAddTaskModal(date = null) {
    if (date) document.getElementById('taskDate').value = date;
    showModal('taskModal');
}

export function showAddBookModal() {
    showModal('bookModal');
}

export function showAddChapterModal(bookId) {
    document.getElementById('parentBookId').value = bookId;
    showModal('chapterModal');
}

export function showAddNoteModal(chapterId) {
    document.getElementById('noteChapterId').value = chapterId;
    document.getElementById('noteTitle').value = '';
    document.getElementById('noteContent').value = '';
    showModal('noteModal');
}

export function showAddFlashcardModal() {
    // Populate chapter dropdown
    import('../storage/database.js').then(({ getBooks, getChapters }) => {
        const books = getBooks();
        const chapters = getChapters();
        const select = document.getElementById('cardChapterId');
        select.innerHTML = '<option value="">None</option>';
        books.forEach(book => {
            const bookChapters = chapters.filter(c => c.bookId === book.id);
            bookChapters.forEach(ch => {
                select.innerHTML += `<option value="${ch.id}">${book.name} - ${ch.name}</option>`;
            });
        });
    });
    showModal('flashcardModal');
}

export function showPomodoroModal() {
    showModal('pomodoroModal');
}
