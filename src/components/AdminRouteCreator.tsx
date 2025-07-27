import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMapEvents, Popup } from 'react-leaflet';

const DEFAULT_CENTER: [number, number] = [13.7424301, 109.195728]; // Núi Vũng Chua

function ClickHandler({ onAdd }: { onAdd: (latlng: [number, number]) => void }) {
  useMapEvents({
    click(e) {
      onAdd([e.latlng.lat, e.latlng.lng]);
    }
  });
  return null;
}

export const AdminRouteCreator: React.FC = () => {
  const [points, setPoints] = useState<[number, number][]>([]);
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');

  const handleAdd = (latlng: [number, number]) => {
    setPoints([...points, latlng]);
  };
  const handleRemoveLast = () => setPoints(points.slice(0, -1));
  const handleReset = () => setPoints([]);

  // Xuất JSON chuẩn places.json (LineString, [lng, lat])
  const exportJson = () => {
    return {
      id: name.toLowerCase().replace(/\s+/g, '-'),
      name,
      type: 'trail',
      description: desc,
      geometry: {
        type: 'LineString',
        coordinates: points.map(([lat, lng]) => [lng, lat])
      }
    };
  };

  return (
    <div style={{ display: 'flex', gap: 24 }}>
      <div style={{ width: 600, height: 500 }}>
        <MapContainer center={DEFAULT_CENTER} zoom={15} style={{ width: '100%', height: '100%' }}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          <ClickHandler onAdd={handleAdd} />
          {points.map((p, i) => (
            <Marker key={i} position={p}>
              <Popup>Điểm {i + 1}<br />[{p[0].toFixed(6)}, {p[1].toFixed(6)}]</Popup>
            </Marker>
          ))}
          {points.length > 1 && (
            <Polyline positions={points} pathOptions={{ color: 'red', weight: 4 }} />
          )}
        </MapContainer>
      </div>
      <div style={{ minWidth: 320 }}>
        <h2>Tạo hành trình mới</h2>
        <div>
          <label>Tên hành trình:<br />
            <input value={name} onChange={e => setName(e.target.value)} style={{ width: '100%' }} />
          </label>
        </div>
        <div style={{ marginTop: 8 }}>
          <label>Mô tả:<br />
            <textarea value={desc} onChange={e => setDesc(e.target.value)} style={{ width: '100%' }} />
          </label>
        </div>
        <div style={{ marginTop: 8 }}>
          <button onClick={handleRemoveLast} disabled={points.length === 0}>Xoá điểm cuối</button>
          <button onClick={handleReset} style={{ marginLeft: 8 }} disabled={points.length === 0}>Reset</button>
        </div>
        <div style={{ marginTop: 16 }}>
          <b>JSON object:</b>
          <pre style={{ background: '#eee', padding: 8, fontSize: 12, maxHeight: 200, overflow: 'auto' }}>{JSON.stringify(exportJson(), null, 2)}</pre>
        </div>
        <div style={{ color: '#888', fontSize: 12 }}>
          * Click lên bản đồ để thêm điểm. Copy JSON này vào places.json.<br />
          * Toạ độ sẽ tự động chuẩn [lng, lat] cho places.json.
        </div>
      </div>
    </div>
  );
}; 