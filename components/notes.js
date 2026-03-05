import { getBooks, getChapters, getNotes, addNote, deleteNote, getNoteFile } from '../storage/database.js';
import { showAddNoteModal } from '../utils/helpers.js';

let selectedChapterId = null;

export async function renderNotes(container) {
    const books = getBooks();
    const chapters = getChapters();
    const notes = await getNotes(selectedChapterId);
    
    let html = `
        <div class="content-header">
            <h1 class="page-title">Notes</h1>
            <button class="primary-btn" id="backupNotesBtn"><i class="fas fa-download"></i> Backup</button>
        </div>
        <div class="notes-container">
            <div class="notes-sidebar">
                <input type="text" placeholder="Search notes..." id="noteSearch">
                <div id="notesTree">
    `;
    books.forEach(book => {
        const bookChapters = chapters.filter(c => c.bookId === book.id);
        if (bookChapters.length === 0) return;
        html += `<div class="note-book"><div class="note-book-title">${book.name}</div>`;
        bookChapters.forEach(ch => {
            html += `<div class="note-chapter ${selectedChapterId === ch.id ? 'active' : ''}" data-chapter-id="${ch.id}">${ch.name}</div>`;
        });
        html += '</div>';
    });
    html += `
                </div>
            </div>
            <div class="notes-main">
                <div class="upload-area" id="dropZone">
                    <i class="fas fa-cloud-upload-alt"></i>
                    <p>Drag & drop files (images, PDFs, text) or click to upload</p>
                    <input type="file" id="fileInput" multiple hidden>
                </div>
                <h3>${selectedChapterId ? (chapters.find(c=>c.id===selectedChapterId)?.name || 'Notes') : 'Select a chapter'}</h3>
                <div class="notes-grid" id="notesGrid">
    `;
    if (selectedChapterId) {
        if (notes.length === 0) html += '<p>No notes yet. Upload some!</p>';
        else {
            for (const n of notes) {
                let contentHtml = '';
                if (n.type === 'text') {
                    contentHtml = `<p>${n.content.substring(0,100)}${n.content.length>100?'...':''}</p>`;
                } else if (n.type === 'image') {
                    const file = await getNoteFile(n.id);
                    if (file) {
                        const url = URL.createObjectURL(file);
                        contentHtml = `<img src="${url}" alt="${n.title}" onclick="window.open('${url}')">`;
                    } else {
                        contentHtml = '<p>Image not found</p>';
                    }
                } else {
                    // PDF or other file
                    const file = await getNoteFile(n.id);
                    if (file) {
                        const url = URL.createObjectURL(file);
                        const icon = file.type.includes('pdf') ? 'fa-file-pdf' : 'fa-file';
                        contentHtml = `
                            <div class="file-preview">
                                <i class="fas ${icon}"></i>
                                <a href="${url}" target="_blank">${n.title}</a>
                            </div>
                        `;
                    } else {
                        contentHtml = '<p>File not found</p>';
                    }
                }
                html += `
                    <div class="note-card" data-note-id="${n.id}">
                        <span class="note-type">${n.type}</span>
                        <h4>${n.title}</h4>
                        ${contentHtml}
                        <button class="delete-note-btn"><i class="fas fa-trash"></i></button>
                    </div>
                `;
            }
        }
    } else {
        html += '<p>Select a chapter from the sidebar</p>';
    }
    html += `
                </div>
            </div>
        </div>
    `;
    container.innerHTML = html;
    
    // Chapter selection
    document.querySelectorAll('.note-chapter').forEach(el => {
        el.addEventListener('click', () => {
            selectedChapterId = el.dataset.chapterId;
            renderNotes(container);
        });
    });
    
    // Upload
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    dropZone.addEventListener('click', () => fileInput.click());
    dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.style.borderColor = 'var(--neon-blue)'; });
    dropZone.addEventListener('dragleave', () => { dropZone.style.borderColor = 'var(--glass-border)'; });
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = 'var(--glass-border)';
        handleFiles(e.dataTransfer.files);
    });
    fileInput.addEventListener('change', (e) => handleFiles(e.target.files));
    
    async function handleFiles(files) {
        if (!selectedChapterId) { alert('Select a chapter first'); return; }
        for (const file of Array.from(files)) {
            let type = 'file';
            if (file.type.startsWith('image/')) type = 'image';
            else if (file.type === 'text/plain') type = 'text';
            
            if (type === 'text') {
                const reader = new FileReader();
                reader.onload = async (e) => {
                    await addNote({
                        title: file.name,
                        content: e.target.result,
                        chapterId: selectedChapterId,
                        type: 'text'
                    });
                    renderNotes(container);
                };
                reader.readAsText(file);
            } else {
                // Store file in IndexedDB
                await addNote({
                    title: file.name,
                    file: file,
                    chapterId: selectedChapterId,
                    type: type
                });
                renderNotes(container);
            }
        }
    }
    
    // Delete notes
    document.querySelectorAll('.delete-note-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const noteId = e.target.closest('.note-card').dataset.noteId;
            if (confirm('Delete note?')) {
                await deleteNote(noteId);
                renderNotes(container);
            }
        });
    });
    
    // Search
    document.getElementById('noteSearch').addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        document.querySelectorAll('.note-card').forEach(card => {
            const title = card.querySelector('h4').textContent.toLowerCase();
            card.style.display = title.includes(term) ? 'block' : 'none';
        });
    });
    
    document.getElementById('backupNotesBtn').addEventListener('click', ()=>{
        import('../storage/database.js').then(m => m.backupData());
    });
}
