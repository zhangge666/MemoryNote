/**
 * FSRS (Free Spaced Repetition Scheduler) Algorithm Implementation
 * 
 * FSRS is a modern spaced repetition algorithm that uses a more sophisticated
 * model to predict memory retention and optimize review scheduling.
 * 
 * This is a simplified implementation for demonstration purposes.
 * The full FSRS algorithm includes more complex parameters and calculations.
 * 
 * Reference: https://github.com/open-spaced-repetition/fsrs4anki
 */

// FSRS parameters (default values)
const FSRS_PARAMS = {
  w: [0.4, 0.6, 2.4, 5.8, 4.93, 0.94, 0.86, 0.01, 1.49, 0.14, 0.94, 2.18, 0.05, 0.34, 1.26, 0.29, 2.61],
  requestRetention: 0.9,
  maximumInterval: 36500,
  easyBonus: 1.3,
  hardPenalty: 1.2
};

/**
 * Calculate the initial stability based on difficulty rating
 * @param {number} d - Difficulty (0-1)
 * @returns {number} Initial stability
 */
function initStability(d) {
  return Math.max(0.1, FSRS_PARAMS.w[0] + FSRS_PARAMS.w[1] * d);
}

/**
 * Calculate the retrievability (probability of recall)
 * @param {number} stability - Current stability
 * @param {number} elapsed - Days since last review
 * @returns {number} Retrievability (0-1)
 */
function retrievability(stability, elapsed) {
  return Math.pow(1 + elapsed / (9 * stability), -1);
}

/**
 * Calculate the new stability after a review
 * @param {number} stability - Current stability
 * @param {number} difficulty - Current difficulty
 * @param {number} retrievability - Current retrievability
 * @param {number} quality - Review quality (0-5)
 * @returns {number} New stability
 */
function nextStability(stability, difficulty, retrievability, quality) {
  const w = FSRS_PARAMS.w;
  
  if (quality >= 3) {
    // Successful recall
    const hardPenalty = quality === 3 ? w[15] : 1;
    const easyBonus = quality === 5 ? w[16] : 1;
    
    return stability * (
      1 + 
      Math.exp(w[8]) * 
      (11 - difficulty) * 
      Math.pow(stability, -w[9]) * 
      (Math.exp((1 - retrievability) * w[10]) - 1) *
      hardPenalty *
      easyBonus
    );
  } else {
    // Failed recall - need to relearn
    return w[11] * Math.pow(difficulty, -w[12]) * (Math.pow(stability + 1, w[13]) - 1) * Math.exp((1 - retrievability) * w[14]);
  }
}

/**
 * Calculate the new difficulty after a review
 * @param {number} difficulty - Current difficulty
 * @param {number} quality - Review quality (0-5)
 * @returns {number} New difficulty
 */
function nextDifficulty(difficulty, quality) {
  const w = FSRS_PARAMS.w;
  // Map quality 0-5 to grade impact
  const gradeImpact = (quality - 3) / 2; // -1.5 to 1
  
  let newDifficulty = difficulty - w[6] * gradeImpact;
  // Mean reversion
  newDifficulty = w[7] * (difficulty - newDifficulty) + newDifficulty;
  
  // Clamp to valid range
  return Math.max(0.1, Math.min(1, newDifficulty));
}

/**
 * Calculate the optimal interval for requested retention
 * @param {number} stability - Current stability
 * @returns {number} Interval in days
 */
function nextInterval(stability) {
  const retention = FSRS_PARAMS.requestRetention;
  const interval = 9 * stability * (1 / Math.pow(retention, 1) - 1);
  return Math.max(1, Math.min(FSRS_PARAMS.maximumInterval, Math.round(interval)));
}

/**
 * FSRS Review Algorithm Implementation
 * Implements the IReviewAlgorithm interface
 */
module.exports = {
  name: 'FSRS',
  
  /**
   * Calculate the next review parameters based on review result
   * @param {Object} card - The review card
   * @param {Object} result - The review result
   * @returns {Object} Updated card parameters
   */
  calculate: function(card, result) {
    const { quality } = result;
    let { easeFactor, repetitions, interval, difficulty } = card;
    
    // Initialize stability (using easeFactor as a proxy)
    let stability = easeFactor || 2.5;
    difficulty = difficulty || 0.3;
    
    // Calculate elapsed time since last review (days)
    const lastReview = card.lastReview || Date.now();
    const elapsed = Math.max(0, (Date.now() - lastReview) / (24 * 60 * 60 * 1000));
    
    // Calculate current retrievability
    const currentRetrievability = repetitions === 0 ? 1 : retrievability(stability, elapsed);
    
    // Update difficulty
    difficulty = nextDifficulty(difficulty, quality);
    
    // Update stability
    if (repetitions === 0) {
      // First review - initialize stability
      stability = initStability(difficulty);
    } else {
      stability = nextStability(stability, difficulty, currentRetrievability, quality);
    }
    
    // Update repetitions
    if (quality >= 3) {
      repetitions += 1;
    } else {
      // Failed - reset to relearning
      repetitions = 0;
    }
    
    // Calculate next interval
    interval = nextInterval(stability);
    
    // Apply modifiers based on quality
    if (quality === 5) {
      interval = Math.round(interval * FSRS_PARAMS.easyBonus);
    } else if (quality === 3) {
      interval = Math.round(interval / FSRS_PARAMS.hardPenalty);
    }
    
    // Ensure minimum interval
    interval = Math.max(1, interval);
    
    // Calculate next review time
    const nextReview = Date.now() + interval * 24 * 60 * 60 * 1000;
    
    return {
      interval,
      difficulty,
      easeFactor: stability, // Store stability in easeFactor field
      repetitions,
      nextReview
    };
  }
};
