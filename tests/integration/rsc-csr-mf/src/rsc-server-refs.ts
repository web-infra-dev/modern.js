// Ensure 'use server' modules and client references enter the server build,
// so manifests contain the necessary metadata for Module Federation.
import './components/action';
import './components/Counter';
import './components/DynamicMessage';
import './components/Suspended';
import './mf-exposes/CounterClient';
import './mf-exposes/DynamicMessageClient';
import './mf-exposes/SuspendedClient';
