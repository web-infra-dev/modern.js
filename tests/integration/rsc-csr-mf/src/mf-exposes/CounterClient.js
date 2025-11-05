'use client';

// Server-safe expose wrapper for the client Counter component.
// Re-export the actual client module so both web and node builds register it.
export { default } from '../components/Counter';
