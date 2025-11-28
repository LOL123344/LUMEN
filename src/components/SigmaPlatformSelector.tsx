import { useMemo, useState } from 'react';
import { getAvailablePlatforms, SigmaPlatform } from '../lib/sigma/utils/autoLoadRules';
import './SigmaPlatformSelector.css';

interface SigmaPlatformSelectorProps {
  onSelect: (platform: SigmaPlatform, categories: string[]) => void;
  onBack: () => void;
}

const PLATFORM_CATEGORIES: Record<SigmaPlatform, string[]> = {
  windows: ['process_creation', 'image_load', 'network_connection', 'registry', 'file_event', 'pipe_created', 'powershell', 'process_access', 'dns_query', 'security', 'driver_load']
};

export default function SigmaPlatformSelector({ onSelect, onBack }: SigmaPlatformSelectorProps) {
  const [hoveredPlatform, setHoveredPlatform] = useState<string | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState<SigmaPlatform | null>(null);
  const platforms = getAvailablePlatforms();
  const categories = useMemo(() => {
    if (!selectedPlatform) return [];
    return PLATFORM_CATEGORIES[selectedPlatform] || [];
  }, [selectedPlatform]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const handlePlatformClick = (platformId: SigmaPlatform) => {
    setSelectedPlatform(platformId);
    setSelectedCategories(PLATFORM_CATEGORIES[platformId] || []);
  };

  const toggleCategory = (cat: string) => {
    setSelectedCategories(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const handleLoad = () => {
    if (!selectedPlatform) return;
    onSelect(selectedPlatform, selectedCategories);
  };

  return (
    <div className="platform-selector">
      <div className="platform-header">
        <button className="back-button" onClick={onBack}>
          ← Back to Analysis Selection
        </button>
        <div className="header-content">
          <div className="logo-container">
            <h1>SIGMA Detection</h1>
            <span className="logo-icon">🛡️</span>
          </div>
          <p className="tagline">Windows Event Log (EVTX) Detection Rules</p>
        </div>
      </div>

      <div className="platform-cards">
        {platforms.map((platform) => (
          <div
            key={platform.id}
            className={`platform-card ${platform.id} ${hoveredPlatform === platform.id ? 'hovered' : ''} ${platform.ruleCount === 0 ? 'disabled' : ''}`}
            onClick={() => platform.ruleCount > 0 && handlePlatformClick(platform.id)}
            onMouseEnter={() => setHoveredPlatform(platform.id)}
            onMouseLeave={() => setHoveredPlatform(null)}
          >
            <div className="platform-icon">{platform.icon}</div>
            <div className="platform-content">
              <h3>{platform.name}</h3>
              <p>{platform.description}</p>
              <div className="rule-count">
                <span className="count">{platform.ruleCount.toLocaleString()}</span>
                <span className="label">detection rules</span>
              </div>
            </div>
            <div className="platform-arrow">→</div>
          </div>
        ))}
      </div>

      {selectedPlatform && categories.length > 0 && (
        <div className="platform-filters">
          <div className="filters-header">
            <div>
              <p className="filter-kicker">Rule filters</p>
              <h4>Load only relevant categories</h4>
              <p className="filter-sub">Reducing categories trims load time and noise.</p>
            </div>
            <div className="filter-actions">
              <button onClick={() => setSelectedCategories(PLATFORM_CATEGORIES[selectedPlatform] || [])}>Select all</button>
              <button onClick={() => setSelectedCategories([])}>Clear</button>
            </div>
          </div>
          <div className="filter-grid">
            {categories.map(cat => (
              <label key={cat} className="filter-chip">
                <input
                  type="checkbox"
                  checked={selectedCategories.includes(cat)}
                  onChange={() => toggleCategory(cat)}
                />
                <span>{cat.replace(/_/g, ' ')}</span>
              </label>
            ))}
          </div>
          <div className="filter-footer">
            <span>{selectedCategories.length} of {categories.length} categories selected</span>
            <button className="load-button" onClick={handleLoad} disabled={selectedCategories.length === 0}>
              Load rules
            </button>
          </div>
        </div>
      )}

      <div className="platform-note">
        LUMEN supports Windows Event Logs (EVTX) only. Filter categories to speed up rule loading.
      </div>
    </div>
  );
}
