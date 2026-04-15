import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';

import { resetCalendarStoreState } from './store/calendar-store.js';

afterEach(() => {
  cleanup();
  resetCalendarStoreState();
  localStorage.clear();
});
