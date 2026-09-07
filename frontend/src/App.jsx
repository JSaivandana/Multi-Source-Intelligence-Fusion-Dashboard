import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { Upload, Database, Layers } from 'lucide-react';

// Fix for default marker icon in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function App() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  // Initial mock data
  useEffect(() => {
    setData([
      { lat: 51.505, lng: -0.09, source: 'OSINT', title: 'Target Alpha', description: 'Activity detected on social media' },
      { lat: 51.51, lng: -0.1, source: 'IMINT', title: 'Facility Beta', description: 'Satellite imagery shows new structures' }
    ]);
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch('http://localhost:8000/api/intelligence');
      const result = await res.json();
      
      // If we got real data from backend, merge it or overwrite
      if (result && result.length > 0) {
        setData(result);
      } else {
        alert("No intelligence data found on the server. Try uploading some first!");
      }
    } catch (error) {
      console.error(error);
      alert('Failed to connect to backend. Make sure python main.py is running!');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      setLoading(true);
      const res = await fetch('http://localhost:8000/api/ingest/json', {
        method: 'POST',
        body: formData,
      });
      
      if(res.ok) {
        alert('File uploaded successfully!');
        fetchData(); // Refresh the map with new data
      } else {
        const errorText = await res.text();
        alert('Upload failed: ' + errorText);
      }
    } catch (error) {
      console.error(error);
      alert('Upload failed. Make sure the backend is running.');
    } finally {
      setLoading(false);
      event.target.value = ''; // Reset input
    }
  };

  const handleTriggerUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleImageryUpload = () => {
    alert("In a full implementation, this would open a dialog asking for image coordinates before uploading to S3/Backend.");
  };

  // Determine map center dynamically or default to Delhi (since sample data is there)
  /*const mapCenter = data.length > 0 && data[0].lat > 20 
    ? [28.6139, 77.2090] // Delhi coordinates for sample data
    : [51.505, -0.09];   // London */ 
    const mapCenter = [20.5937, 78.9629];

  return (
    <div className="dashboard-container">
      <div className="sidebar">
        <div className="header">
          <h1>Intelligence Fusion</h1>
          <p style={{ margin: '0.5rem 0 0', fontSize: '0.875rem', color: 'var(--text-muted)' }}>Multi-Source Dashboard</p>
        </div>
        
        <div className="control-panel">
          <button 
            className="btn" 
            onClick={fetchData}
            disabled={loading}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', opacity: loading ? 0.7 : 1 }}
          >
            <Database size={16} /> {loading ? 'Fetching...' : 'Fetch OSINT Data'}
          </button>
          
          {/* Hidden file input */}
          <input 
            type="file" 
            accept=".json"
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            style={{ display: 'none' }} 
          />
          
          <button 
            className="btn" 
            onClick={handleTriggerUpload}
            disabled={loading}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', backgroundColor: '#475569' }}
          >
            <Upload size={16} /> Upload JSON
          </button>
          
          <button 
            className="btn" 
            onClick={handleImageryUpload}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', backgroundColor: '#475569' }}
          >
            <Layers size={16} /> Upload Imagery
          </button>
        </div>

        <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
          <h3 style={{ fontSize: '0.875rem', marginTop: 0 }}>Active Nodes: {data.length}</h3>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', backgroundColor: 'rgba(59, 130, 246, 0.2)', borderRadius: '999px', color: '#60a5fa' }}>OSINT</span>
            <span style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', backgroundColor: 'rgba(34, 197, 94, 0.2)', borderRadius: '999px', color: '#4ade80' }}>IMINT</span>
            <span style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', backgroundColor: 'rgba(168, 85, 247, 0.2)', borderRadius: '999px', color: '#c084fc' }}>HUMINT</span>
          </div>
        </div>
      </div>
      
      <div className="map-container">
        {/* Added a key to MapContainer so it re-centers when data changes drastically 11*/}
        <MapContainer key={mapCenter[0]} center={mapCenter} zoom={5} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />
          {data.map((point, idx) => {
            // Pick color based on source
            const sourceColor = point.source === 'OSINT' ? '#60a5fa' : point.source === 'IMINT' ? '#4ade80' : '#c084fc';
            
            return (
              <Marker key={idx} position={[point.lat, point.lng]}>
                <Popup>
                  <div>
                    <h3 style={{ margin: '0 0 0.5rem', color: '#1e293b' }}>{point.title}</h3>
                    <span style={{ display: 'inline-block', padding: '0.125rem 0.375rem', backgroundColor: '#e2e8f0', color: sourceColor, borderRadius: '4px', fontSize: '0.75rem', marginBottom: '0.5rem', fontWeight: 'bold' }}>{point.source}</span>
                    <p style={{ margin: 0, fontSize: '0.875rem', color: '#334155' }}>{point.description}</p>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
}

export default App;
