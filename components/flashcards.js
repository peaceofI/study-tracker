import { getFlashcards, getDueFlashcards, updateFlashcard, deleteFlashcard } from '../storage/database.js';
import { showAddFlashcardModal } from '../utils/helpers.js';
import { processReview } from '../utils/spacedRepetition.js';

export function renderFlashcards(container) {
    const flashcards = getFlashcards();
    const due = getDueFlashcards();
    
    let html = `
        <div class="content-header">
            <h1 class="page-title">Flashcards</h1>
            <button class="primary-btn" id="addFlashcardBtn"><i class="fas fa-plus"></i> Add Flashcard</button>
        </div>
        <div class="flashcard-stats">
            <div class="glass-card">Total: ${flashcards.length}</div>
            <div class="glass-card">Due: ${due.length}</div>
        </div>
        <div class="flashcard-grid" id="flashcardGrid">
    `;
    
    if (flashcards.length === 0) {
        html += '<div class="glass-card" style="grid-column:1/-1; text-align:center;">No flashcards yet. Click "Add Flashcard" to create one.</div>';
    } else {
        flashcards.forEach(card => {
            const next = new Date(card.nextReview);
            const now = new Date();
            const isDue = next <= now;
            html += `
                <div class="flashcard ${isDue ? 'due' : ''}" data-id="${card.id}">
                    <div class="front show-front">
                        <strong>Q:</strong> ${card.question}
                    </div>
                    <div class="back" style="display:none;">
                        <strong>A:</strong> ${card.answer}
                    </div>
                    <div class="difficulty">Ease: ${card.ease.toFixed(2)}</div>
                    <div class="next-review">Next: ${next.toLocaleDateString()}</div>
                    <div class="review-buttons">
                        <button class="review-btn again">Again</button>
                        <button class="review-btn hard">Hard</button>
                        <button class="review-btn good">Good</button>
                        <button class="review-btn easy">Easy</button>
                    </div>
                    <button class="delete-flashcard-btn" style="position:absolute; bottom:8px; right:8px; background:none; border:none; color:rgba(255,255,255,0.5);"><i class="fas fa-trash"></i></button>
                </div>
            `;
        });
    }
    html += '</div>';
    container.innerHTML = html;
    
    // Add flashcard button
    document.getElementById('addFlashcardBtn').addEventListener('click', showAddFlashcardModal);
    
    // Toggle front/back on click
    document.querySelectorAll('.flashcard').forEach(card => {
        card.addEventListener('click', (e) => {
            if (e.target.tagName === 'BUTTON' || e.target.closest('button')) return;
            const front = card.querySelector('.front');
            const back = card.querySelector('.back');
            if (front.style.display !== 'none') {
                front.style.display = 'none';
                back.style.display = 'block';
            } else {
                front.style.display = 'block';
                back.style.display = 'none';
            }
        });
    });
    
    // Review buttons
    document.querySelectorAll('.review-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const cardEl = btn.closest('.flashcard');
            const cardId = cardEl.dataset.id;
            const quality = btn.classList.contains('again') ? 0 :
                            btn.classList.contains('hard') ? 1 :
                            btn.classList.contains('good') ? 2 : 3;
            const card = getFlashcards().find(c => c.id === cardId);
            if (card) {
                processReview(card, quality);
                renderFlashcards(container); // refresh
            }
        });
    });
    
    // Delete buttons
    document.querySelectorAll('.delete-flashcard-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const cardId = btn.closest('.flashcard').dataset.id;
            if (confirm('Delete this flashcard?')) {
                deleteFlashcard(cardId);
                renderFlashcards(container);
            }
        });
    });
}
