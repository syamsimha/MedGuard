import { useState, useEffect, useCallback } from 'react';
import type { HealthStatusResponse } from './types/health';
import type { NavigationTab } from './types/navigation';
import { checkApiHealth } from './services/api';
import { AppLayout } from './components/layout/AppLayout';
import { SystemOverview } from './components/views/SystemOverview';
import { PrescriptionReviewPlaceholder } from './components/views/PrescriptionReviewPlaceholder';
import { InteractionSafetyPlaceholder } from './components/views/InteractionSafetyPlaceholder';
import { RulesEnginePlaceholder } from './components/views/RulesEnginePlaceholder';
import { AuditLogView } from './components/views/AuditLogView';
import { SystemSettingsView } from './components/views/SystemSettingsView';

export function App() {
  const [activeTab, setActiveTab] = useState<NavigationTab>('overview');
  const [health, setHealth] = useState<HealthStatusResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHealth = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await checkApiHealth();
      setHealth(data);
    } catch (err: any) {
      console.warn('API health check could not connect:', err.message);
      setError(err.message || 'Failed to reach backend API');
      setHealth(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHealth();
  }, [fetchHealth]);

  const renderCurrentView = () => {
    switch (activeTab) {
      case 'overview':
        return <SystemOverview health={health} loading={loading} error={error} />;
      case 'prescriptions':
        return <PrescriptionReviewPlaceholder />;
      case 'interactions':
        return <InteractionSafetyPlaceholder />;
      case 'rules':
        return <RulesEnginePlaceholder />;
      case 'audit-log':
        return <AuditLogView />;
      case 'settings':
        return <SystemSettingsView health={health} />;
      default:
        return <SystemOverview health={health} loading={loading} error={error} />;
    }
  };

  return (
    <AppLayout
      health={health}
      loading={loading}
      activeTab={activeTab}
      onSelectTab={setActiveTab}
      onRefreshHealth={fetchHealth}
    >
      {renderCurrentView()}
    </AppLayout>
  );
}

export default App;
