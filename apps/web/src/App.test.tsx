import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { App } from './App.js';

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );
}

describe('App', () => {
  it('renders week view on / with toolbar controls', () => {
    renderAt('/');
    expect(screen.getByRole('heading', { level: 1, name: 'Week' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /previous week/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /next week/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /today/i })).toBeInTheDocument();
  });

  it('renders Phase 6 scrollable week schedule region', () => {
    renderAt('/');
    expect(
      screen.getByRole('region', {
        name: /week schedule.*multiple weeks/i,
      }),
    ).toBeInTheDocument();
  });

  it('loads week view with weekOffset search param (Phase 9 preview)', () => {
    renderAt('/?weekOffset=2');
    expect(screen.getByRole('heading', { level: 1, name: 'Week' })).toBeInTheDocument();
  });

  it('shows zoom controls (Phase 7)', () => {
    renderAt('/');
    expect(screen.getByRole('button', { name: 'Zoom out' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Zoom in' })).toBeInTheDocument();
  });

  it('renders debug page on /debug with mock controls', () => {
    renderAt('/debug');
    expect(screen.getByRole('heading', { level: 1, name: 'Debug' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add mock event/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /delete first event/i })).toBeInTheDocument();
  });

  it('renders day view on /day (Phase 8)', () => {
    renderAt('/day');
    expect(screen.getByRole('heading', { level: 1, name: 'Day' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: /day schedule/i })).toBeInTheDocument();
  });

  it('renders month view on /month (Phase 8)', () => {
    renderAt('/month');
    expect(screen.getByRole('heading', { level: 1, name: 'Month' })).toBeInTheDocument();
    expect(screen.getByRole('grid')).toBeInTheDocument();
  });
});
