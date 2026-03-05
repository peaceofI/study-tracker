// SM-2 algorithm for spaced repetition
import { getFlashcards, updateFlashcard } from '../storage/database.js';

export function initSpacedRepetition() {
    // Optional: run daily check
    setInterval(checkDueCards, 3600000); // check every hour
}

export function checkDueCards() {
    const due = getDueFlashcards();
    if (due.length > 0) {
        // Could trigger a notification
        console.log(`${due.length} flashcards due for review`);
    }
}

export function processReview(card, quality) {
    // quality: 0 (again), 1 (hard), 2 (good), 3 (easy)
    let { ease, interval, repetitions } = card;
    
    if (quality >= 2) {
        // correct response
        if (repetitions === 0) {
            interval = 1;
        } else if (repetitions === 1) {
            interval = 6;
        } else {
            interval = Math.round(interval * ease);
        }
        repetitions++;
    } else {
        // incorrect response
        repetitions = 0;
        interval = 1;
    }
    
    // Update ease factor
    ease = Math.max(1.3, ease + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)));
    
    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + interval);
    
    updateFlashcard(card.id, {
        ease,
        interval,
        repetitions,
        nextReview: nextReview.toISOString()
    });
}

export function getDueFlashcards() {
    return getFlashcards().filter(c => new Date(c.nextReview) <= new Date());
}
