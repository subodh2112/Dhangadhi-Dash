import React, { useEffect } from "react";
import { MapContainer, TileLayer, CircleMarker, Polyline, Tooltip, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";

const DEFAULT_STORE_POS = [28.6960, 80.5900];
const DEFAULT_CUSTOMER_POS = [28.7080, 80.6180];

function AutoPan({ riderPos }) {
  const map = useMap();
  useEffect(() => {
    if (riderPos && riderPos.length === 2) {
      map.panTo(riderPos, { animate: true, duration: 0.5 });
    }
  }, [riderPos, map]);
  return null;
}

export default function LiveDeliveryMap({ riderPosition, storePosition, customerPosition, status, eta, distance }) {
  const storePos = storePosition || DEFAULT_STORE_POS;
  const customerPos = customerPosition || DEFAULT_CUSTOMER_POS;
  const riderPos = (riderPosition && riderPosition.length === 2) ? riderPosition : null;
  const center = riderPos || [(storePos[0] + customerPos[0]) / 2, (storePos[1] + customerPos[1]) / 2];

  return (
    <MapContainer center={center} zoom={14} className="w-full h-full" style={{ height: "100%", minHeight: "320px" }}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap contributors' />
      <AutoPan riderPos={riderPos} />
      <Polyline positions={[storePos, customerPos]} pathOptions={{ color: "#FF3D00", weight: 3, dashArray: "6 8" }} />
      <CircleMarker center={storePos} radius={10} pathOptions={{ color: "#008A45", fillColor: "#008A45", fillOpacity: 1 }}>
        <Tooltip direction="top">Store: Pickup</Tooltip>
      </CircleMarker>
      <CircleMarker center={customerPos} radius={10} pathOptions={{ color: "#FF3D00", fillColor: "#FF3D00", fillOpacity: 1 }}>
        <Tooltip direction="top">Delivery Address</Tooltip>
      </CircleMarker>
      {riderPos && (
        <>
          <Polyline positions={[storePos, riderPos]} pathOptions={{ color: "#008A45", weight: 4, opacity: 0.6 }} />
          {status === "on_the_way" && (
            <Polyline positions={[riderPos, customerPos]} pathOptions={{ color: "#FF3D00", weight: 4, opacity: 0.6 }} />
          )}
          <CircleMarker center={riderPos} radius={20} pathOptions={{ color: "#FF3D00", fillColor: "#FF3D00", fillOpacity: 0.15 }} />
          <CircleMarker center={riderPos} radius={9} pathOptions={{ color: "#121212", fillColor: "#FF3D00", fillOpacity: 1 }}>
            <Tooltip direction="top">Rider {eta ? `- ${eta} min away (${distance} km)` : ""}</Tooltip>
          </CircleMarker>
        </>
      )}
    </MapContainer>
  );
}