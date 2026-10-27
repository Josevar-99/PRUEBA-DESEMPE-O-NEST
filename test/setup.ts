import { jest } from '@jest/globals';

// Asignar objeto jest global para que esté disponible en todos los specs
(globalThis as unknown as { jest: typeof jest }).jest = jest;
