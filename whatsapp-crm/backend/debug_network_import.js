import { checkConnection } from './services/networkService.js';
console.log('Import successful');
checkConnection().then(res => console.log('Execution result:', res));
