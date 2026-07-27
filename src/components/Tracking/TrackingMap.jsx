import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, CircleMarker, Polyline, Tooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";

const DEFAULT_STORE_POS = [28.6960, 80.5900];
const DEFAULT_CUSTOMER_POS = [28.7080, 80.6180];

export default function TrackingMap({ status, riderPosition, storePosition, customerPosition }) {
  const [progress, setProgress] = useState(0.3);
  const storePos = storePosition || DEFAULT_STORE_POS;
  const customerPos = customerPosition || DEFAULT_CUSTOMER_POS;

  useEffect(() => {
    if (status !== "on_the_way") return;
    setProgress(0.3);
    const interval = setInterval(() => {
      setProgress((p) => Math.min(p + 0.008, 0.95));
    }, 600);
    return () => clearInterval(interval);
  }, [status]);

  let riderPos;
  if (riderPosition && riderPosition.length === 2) {
    riderPos = riderPosition;
  } else {
    let riderProgress = 0;
    if (status === "on_the_way") riderProgress = progress;
    else if (status === "delivered") riderProgress = 1;
    riderPos = [
      storePos[0] + (customerPos[0] - storePos[0]) * riderProgress,
      storePos[1] + (customerPos[1] - storePos[1]) * riderProgress,
    ];
  }

  return (
    <MapContainer center={[(storePos[0] + customerPos[0]) / 2, (storePos[1] + customerPos[1]) / 2]} zoom={14} className="w-full h-full" style={{ height: "100%", minHeight: "320px" }}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap contributors' />
      <Polyline positions={[storePos, customerPos]} pathOptions={{ color: "#FF3D00", weight: 3, dashArray: "6 8" }} />
      <CircleMarker center={storePos} radius={10} pathOptions={{ color: "#008A45", fillColor: "#008A45", fillOpacity: 1 }}>
        <Tooltip>Store</Tooltip>
      </CircleMarker>
      <CircleMarker center={customerPos} radius={10} pathOptions={{ color: "#FF3D00", fillColor: "#FF3D00", fillOpacity: 1 }}>
        <Tooltip>Delivery Address</Tooltip>
      </CircleMarker>
      <CircleMarker center={riderPos} radius={8} pathOptions={{ color: "#121212", fillColor: "#FF3D00", fillOpacity: 1 }}>
        <Tooltip>Your Rider</Tooltip>
      </CircleMarker>
      {status === "on_the_way" && (
        <CircleMarker center={riderPos} radius={16} pathOptions={{ color: "#FF3D00", fillColor: "#FF3D00", fillOpacity: 0.2 }} />
      )}
    </MapContainer>
  );
}