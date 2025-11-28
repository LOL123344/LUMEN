import { useState } from 'react';
import './SampleSelector.css';

// Sample EVTX files available for loading
const SAMPLE_CATEGORIES = [
  {
    name: 'Execution',
    description: 'Process execution and command line attacks',
    samples: [
      { name: 'Meterpreter Reverse TCP (MSI)', file: 'Exec_sysmon_meterpreter_reversetcp_msipackage.evtx' },
      { name: 'MSHTA SharpShooter', file: 'sysmon_mshta_sharpshooter_stageless_meterpreter.evtx' },
      { name: 'Regsvr32 SCT', file: 'exec_sysmon_lobin_regsvr32_sct.evtx' },
      { name: 'WMIC XSL Internet', file: 'exec_wmic_xsl_internet_sysmon_3_1_11.evtx' },
      { name: 'Compiled HTML Execution', file: 'Sysmon_Exec_CompiledHTML.evtx' },
      { name: 'Rundll32 LOLBIN', file: 'exec_sysmon_1_11_lolbin_rundll32_openurl_FileProtocolHandler.evtx' },
    ]
  },
  {
    name: 'Defense Evasion',
    description: 'Techniques to avoid detection',
    samples: [
      { name: 'Visual Studio Pre-build', file: 'execution_evasion_visual_studio_prebuild_event.evtx' },
      { name: 'JScript9 Evasion', file: 'exec_sysmon_1_7_jscript9_defense_evasion.evtx' },
    ]
  },
  {
    name: 'Persistence',
    description: 'Techniques for maintaining access',
    samples: [
      { name: 'Scheduled Task Execution', file: 'exec_persist_rundll32_mshta_scheduledtask_sysmon_1_3_11.evtx' },
      { name: 'VSS Persistence', file: 'sysmon_exec_from_vss_persistence.evtx' },
    ]
  },
];

interface SampleSelectorProps {
  onSelectSample: (url: string, filename: string) => void;
  onClose: () => void;
}

export default function SampleSelector({ onSelectSample, onClose }: SampleSelectorProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>(SAMPLE_CATEGORIES[0].name);
  const [loading, setLoading] = useState<string | null>(null);

  const currentCategory = SAMPLE_CATEGORIES.find(c => c.name === selectedCategory);

  const handleSelectSample = async (sample: { name: string; file: string }) => {
    setLoading(sample.file);
    // Build the URL to the sample file
    const url = `/samples/EVTX-ATTACK-SAMPLES/Execution/${sample.file}`;
    onSelectSample(url, sample.file);
  };

  return (
    <div className="sample-selector-overlay" onClick={onClose}>
      <div className="sample-selector-modal" onClick={e => e.stopPropagation()}>
        <div className="sample-selector-header">
          <h2>Load Sample EVTX File</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="sample-selector-content">
          <div className="category-tabs">
            {SAMPLE_CATEGORIES.map(cat => (
              <button
                key={cat.name}
                className={`category-tab ${selectedCategory === cat.name ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat.name)}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {currentCategory && (
            <div className="sample-list">
              <p className="category-description">{currentCategory.description}</p>
              {currentCategory.samples.map(sample => (
                <button
                  key={sample.file}
                  className={`sample-item ${loading === sample.file ? 'loading' : ''}`}
                  onClick={() => handleSelectSample(sample)}
                  disabled={loading !== null}
                >
                  <span className="sample-name">{sample.name}</span>
                  <span className="sample-file">{sample.file}</span>
                  {loading === sample.file && <span className="loading-spinner" />}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="sample-selector-footer">
          <p className="credit">
            Samples from <a href="https://github.com/sbousseaden/EVTX-ATTACK-SAMPLES" target="_blank" rel="noopener noreferrer">EVTX-ATTACK-SAMPLES</a> by @sbousseaden
          </p>
        </div>
      </div>
    </div>
  );
}
