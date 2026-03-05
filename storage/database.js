// localStorage for metadata, IndexedDB for files
const STORAGE_KEYS = {
    BOOKS: 'studyc_books',
    CHAPTERS: 'studyc_chapters',
    NOTES_META: 'studyc_notes_meta',
    TASKS: 'studyc_tasks',
    STREAK: 'studyc_streak',
    FLASHCARDS: 'studyc_flashcards'
};

let data = {
    books: [],
    chapters: [],
    notesMeta: [],
    tasks: [],
    streak: { count: 0, lastDate: null },
    flashcards: []
};

// IndexedDB for file storage
const DB_NAME = 'StudyCoreDB';
const DB_VERSION = 1;
const FILE_STORE = 'files';

let dbPromise = null;

function openDB() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
        request.onupgradeneeded = (e) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains(FILE_STORE)) {
                db.createObjectStore(FILE_STORE, { keyPath: 'id' });
            }
        };
    });
    return dbPromise;
}

export async function initDB() {
    // Load from localStorage
    Object.keys(STORAGE_KEYS).forEach(k => {
        const key = STORAGE_KEYS[k];
        const saved = localStorage.getItem(key);
        if (saved) {
            try { data[k.toLowerCase()] = JSON.parse(saved); }
            catch (e) { console.warn(`Failed to parse ${key}`); }
        }
    });
    // Ensure notesMeta exists
    if (!data.notesMeta) data.notesMeta = [];
    if (!data.flashcards) data.flashcards = [];
    await openDB();
}

function save(key) {
    localStorage.setItem(STORAGE_KEYS[key], JSON.stringify(data[key.toLowerCase()]));
}

// Books
export function getBooks() { return data.books; }
export function addBook(book) {
    const newBook = { id: Date.now().toString(), ...book };
    data.books.push(newBook);
    save('BOOKS');
    return newBook;
}
export function updateBook(id, updates) {
    const idx = data.books.findIndex(b => b.id === id);
    if (idx !== -1) { data.books[idx] = { ...data.books[idx], ...updates }; save('BOOKS'); }
}
export function deleteBook(id) {
    data.books = data.books.filter(b => b.id !== id);
    const chaptersToDelete = data.chapters.filter(c => c.bookId === id).map(c => c.id);
    data.chapters = data.chapters.filter(c => c.bookId !== id);
    // Delete notes of these chapters
    const notesToDelete = data.notesMeta.filter(n => chaptersToDelete.includes(n.chapterId));
    notesToDelete.forEach(n => deleteFileFromDB(n.id));
    data.notesMeta = data.notesMeta.filter(n => !chaptersToDelete.includes(n.chapterId));
    // Also delete flashcards linked to these chapters
    data.flashcards = data.flashcards.filter(f => !chaptersToDelete.includes(f.chapterId));
    save('BOOKS'); save('CHAPTERS'); save('NOTES_META'); save('FLASHCARDS');
}

// Chapters
export function getChapters(bookId) {
    if (bookId) return data.chapters.filter(c => c.bookId === bookId);
    return data.chapters;
}
export function addChapter(chapter) {
    const newChapter = { id: Date.now() + '-' + Math.random(), progress: 0, completed: false, lastStudied: null, ...chapter };
    data.chapters.push(newChapter);
    save('CHAPTERS');
    return newChapter;
}
export function updateChapter(id, updates) {
    const idx = data.chapters.findIndex(c => c.id === id);
    if (idx !== -1) {
        data.chapters[idx] = { ...data.chapters[idx], ...updates };
        if (updates.progress !== undefined) {
            data.chapters[idx].lastStudied = new Date().toISOString().split('T')[0];
            updateStreak();
        }
        save('CHAPTERS');
    }
}
export function deleteChapter(id) {
    data.chapters = data.chapters.filter(c => c.id !== id);
    // Delete notes of this chapter
    const notesToDelete = data.notesMeta.filter(n => n.chapterId === id);
    notesToDelete.forEach(n => deleteFileFromDB(n.id));
    data.notesMeta = data.notesMeta.filter(n => n.chapterId !== id);
    // Delete flashcards
    data.flashcards = data.flashcards.filter(f => f.chapterId !== id);
    save('CHAPTERS'); save('NOTES_META'); save('FLASHCARDS');
}

// Notes
export async function getNotes(chapterId) {
    if (chapterId) return data.notesMeta.filter(n => n.chapterId === chapterId);
    return data.notesMeta;
}
export async function addNote(note) {
    const { file, title, chapterId, type, content } = note;
    const id = Date.now() + '-' + Math.random();
    const meta = {
        id,
        chapterId,
        title,
        type: type || 'text',
        fileName: file ? file.name : null,
        fileSize: file ? file.size : null,
        content: content || null, // for text notes
        createdAt: new Date().toISOString()
    };
    
    if (file) {
        // Store file in IndexedDB
        const db = await openDB();
        const tx = db.transaction(FILE_STORE, 'readwrite');
        const store = tx.objectStore(FILE_STORE);
        await new Promise((resolve, reject) => {
            const request = store.put({ id, file });
            request.onsuccess = resolve;
            request.onerror = reject;
        });
    }
    
    data.notesMeta.push(meta);
    save('NOTES_META');
    return meta;
}
export async function deleteNote(id) {
    data.notesMeta = data.notesMeta.filter(n => n.id !== id);
    await deleteFileFromDB(id);
    save('NOTES_META');
}
async function deleteFileFromDB(id) {
    const db = await openDB();
    const tx = db.transaction(FILE_STORE, 'readwrite');
    const store = tx.objectStore(FILE_STORE);
    await new Promise((resolve, reject) => {
        const request = store.delete(id);
        request.onsuccess = resolve;
        request.onerror = reject;
    });
}
export async function getNoteFile(id) {
    const db = await openDB();
    const tx = db.transaction(FILE_STORE, 'readonly');
    const store = tx.objectStore(FILE_STORE);
    return new Promise((resolve, reject) => {
        const request = store.get(id);
        request.onsuccess = () => resolve(request.result?.file);
        request.onerror = reject;
    });
}

// Tasks
export function getTasks(date) {
    if (date) return data.tasks.filter(t => t.date === date);
    return data.tasks;
}
export function addTask(task) {
    const newTask = { id: Date.now() + '-' + Math.random(), completed: false, ...task };
    data.tasks.push(newTask);
    save('TASKS');
    return newTask;
}
export function updateTask(id, updates) {
    const idx = data.tasks.findIndex(t => t.id === id);
    if (idx !== -1) { data.tasks[idx] = { ...data.tasks[idx], ...updates }; save('TASKS'); }
}
export function deleteTask(id) {
    data.tasks = data.tasks.filter(t => t.id !== id);
    save('TASKS');
}

// Streak
export function getStreak() { return data.streak; }
function updateStreak() {
    const today = new Date().toISOString().split('T')[0];
    if (data.streak.lastDate === today) return;
    const yesterday = new Date(Date.now()-86400000).toISOString().split('T')[0];
    if (data.streak.lastDate === yesterday) data.streak.count++;
    else data.streak.count = 1;
    data.streak.lastDate = today;
    save('STREAK');
}

// Flashcards
export function getFlashcards(chapterId) {
    if (chapterId) return data.flashcards.filter(f => f.chapterId === chapterId);
    return data.flashcards;
}
export function getDueFlashcards() {
    const now = new Date();
    return data.flashcards.filter(f => {
        if (!f.nextReview) return true;
        return new Date(f.nextReview) <= now;
    });
}
export function addFlashcard(flashcard) {
    const newCard = {
        id: Date.now() + '-' + Math.random(),
        created: new Date().toISOString(),
        ease: 2.5, // default ease factor
        interval: 0,
        repetitions: 0,
        nextReview: new Date().toISOString(), // due now
        ...flashcard
    };
    data.flashcards.push(newCard);
    save('FLASHCARDS');
    return newCard;
}
export function updateFlashcard(id, updates) {
    const idx = data.flashcards.findIndex(f => f.id === id);
    if (idx !== -1) {
        data.flashcards[idx] = { ...data.flashcards[idx], ...updates };
        save('FLASHCARDS');
    }
}
export function deleteFlashcard(id) {
    data.flashcards = data.flashcards.filter(f => f.id !== id);
    save('FLASHCARDS');
}

// Backup (metadata only, files excluded due to size)
export function backupData() {
    const backup = {
        books: data.books,
        chapters: data.chapters,
        notesMeta: data.notesMeta,
        tasks: data.tasks,
        streak: data.streak,
        flashcards: data.flashcards
    };
    const blob = new Blob([JSON.stringify(backup)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `studyc-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
}
