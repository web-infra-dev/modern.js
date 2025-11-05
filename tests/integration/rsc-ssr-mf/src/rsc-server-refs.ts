// Ensure 'use server' modules get compiled in the server build,
// so the client transform can map them by moduleId.
import './server-component-root/components/action';
import './mf-exposes/Counter';
import './mf-exposes/DynamicMessage';
