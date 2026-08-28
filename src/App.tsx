import { Routes, Route, Navigate } from 'react-router-dom';
import { Shell } from './ui/Shell';
import { Dashboard } from './screens/Dashboard';
import { MapScreen } from './screens/MapScreen';
import { Zones } from './screens/Zones';
import { ZoneDetail } from './screens/ZoneDetail';
import { Structures } from './screens/Structures';
import { Events } from './screens/Events';
import { EventDetail } from './screens/EventDetail';
import { Notifications } from './screens/Notifications';
import { Weather } from './screens/Weather';
import { Rules } from './screens/Rules';
import { Resources } from './screens/Resources';
import { Assistant } from './screens/Assistant';
import { Audit } from './screens/Audit';
import { Integrations } from './screens/Integrations';

export function App() {
  return (
    <Shell>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/map" element={<MapScreen />} />
        <Route path="/zones" element={<Zones />} />
        <Route path="/zones/:id" element={<ZoneDetail />} />
        <Route path="/structures" element={<Structures />} />
        <Route path="/events" element={<Events />} />
        <Route path="/events/:id" element={<EventDetail />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/weather" element={<Weather />} />
        <Route path="/rules" element={<Rules />} />
        <Route path="/resources" element={<Resources />} />
        <Route path="/ai" element={<Assistant />} />
        <Route path="/audit" element={<Audit />} />
        <Route path="/integrations" element={<Integrations />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Shell>
  );
}
