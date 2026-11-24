import { greeting } from '../../shared/greeting';

export const get = async () => ({ message: greeting('bff') });
