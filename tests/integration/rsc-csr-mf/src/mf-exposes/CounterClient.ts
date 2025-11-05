'use client';

// Server-safe expose wrapper for the client Counter component.
// Use an explicit import/export so the RSC server transform handles it correctly.
import Counter from '../components/Counter';
export default Counter;
