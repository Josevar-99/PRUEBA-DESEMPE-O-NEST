import { jest } from '@jest/globals';

// Assign the jest global object so it is available in all specs
(globalThis as unknown as { jest: typeof jest }).jest = jest;