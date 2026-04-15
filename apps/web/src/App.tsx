import type { NewcalCorePackage } from '@newcal/core';
import { NEWCAL_CORE_VERSION } from '@newcal/core';
import { Link, Navigate, Route, Routes } from 'react-router-dom';
import { DayPage } from './pages/DayPage.js';
import { DebugPage } from './pages/DebugPage.js';
import { MonthPage } from './pages/MonthPage.js';
import { PlaceholderPage } from './pages/PlaceholderPage.js';
import { WeekPage } from './pages/WeekPage.js';

const _corePackageName: NewcalCorePackage = '@newcal/core';
void _corePackageName;

export function App() {
  return (
    <div className="app-shell">
      <header className="app-header">
        <nav className="nav" aria-label="Main">
          <Link to="/">Week</Link>
          <Link to="/day">Day</Link>
          <Link to="/month">Month</Link>
          <Link to="/debug">Debug</Link>
          <Link to="/placeholder">Placeholder</Link>
        </nav>
        <p className="version-pill">
          <code>@newcal/core</code> {NEWCAL_CORE_VERSION}
        </p>
      </header>
      <main className="app-main">
        <Routes>
          <Route path="/" element={<WeekPage />} />
          <Route path="/day" element={<DayPage />} />
          <Route path="/month" element={<MonthPage />} />
          <Route path="/debug" element={<DebugPage />} />
          <Route path="/placeholder" element={<PlaceholderPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}
