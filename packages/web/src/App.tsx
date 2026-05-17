import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import { ImportUrlHandler } from './components/ImportUrlHandler';
import { RoutineListPage } from './pages/RoutineListPage';
import { RoutineBuilderPage } from './pages/RoutineBuilderPage';
import { RoutinePlayerPage } from './pages/RoutinePlayerPage';
import { SettingsPage } from './pages/SettingsPage';

export function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <ImportUrlHandler />
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<RoutineListPage />} />
          <Route path="builder/:id" element={<RoutineBuilderPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
        <Route path="play/:id" element={<RoutinePlayerPage />} />
      </Routes>
    </BrowserRouter>
  );
}
