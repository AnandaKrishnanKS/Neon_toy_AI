import React from 'react';

const DUMMY_REVIEWS = [
  { id: 1, name: 'Alice M.', text: 'Absolutely love these toys! Top quality.', stars: 5 },
  { id: 2, name: 'David R.', text: 'The delivery was so fast and the kid is happy.', stars: 5 },
  { id: 3, name: 'Sarah K.', text: 'Amazing customer service and great products.', stars: 4 },
  { id: 4, name: 'James L.', text: 'Best toy store online, unequivocally.', stars: 5 },
  { id: 5, name: 'Emma T.', text: 'Always finding exactly what I need here.', stars: 5 },
];

export default function ReviewTicker() {
  return (
    <div className="review-ticker-wrapper">
      <h2 className="review-ticker-title">Loved by Parents</h2>
      <div className="review-ticker-container">
        <div className="review-ticker-track">
          {/* Duplicate the array to create a seamless infinite loop */}
          {[...DUMMY_REVIEWS, ...DUMMY_REVIEWS].map((review, index) => (
            <div key={`${review.id}-${index}`} className="review-ticker-item">
              <div className="stars">
                {'★'.repeat(review.stars)}
                {'☆'.repeat(5 - review.stars)}
              </div>
              <p className="review-text">"{review.text}"</p>
              <span className="review-author">- {review.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
