import React from "react";
import { motion } from "framer-motion";
import { MapContainer, TileLayer, CircleMarker, Tooltip } from "react-leaflet";
import { MapPin, CheckCircle2 } from "lucide-react";
import "leaflet/dist/leaflet.css";
import SectionHeading from "@/components/SectionHeading";

const areas = [
{ name: "Dhangadhi Core", position: [28.6960, 80.6000] },
{ name: "Campus Road", position: [28.6880, 80.6100] },
{ name: "Attariya Road", position: [28.7050, 80.5880] },
{ name: "Shantinagar", position: [28.7100, 80.6150] },
{ name: "Tribhuwan Chowk", position: [28.6900, 80.5950] },
{ name: "Hasanpur", position: [28.7020, 80.6200] },
{ name: "Udayapur", position: [28.7150, 80.6050] },
{ name: "Belapur", position: [28.6800, 80.6050] }];


export default function ServiceAreas() {
  return (
    <section id="areas" className="py-20 lg:py-28 px-4 sm:px-6 bg-gradient-to-b from-white to-terai/[0.02]">
      <div className="mx-auto max-w-7xl">
        <SectionHeading eyebrow="Coverage" title="Areas We Serve in Dhangadhi" subtitle="We're rapidly expanding across Dhangadhi. Check if your neighborhood is covered." />

        <div className="grid lg:grid-cols-2 gap-8 mt-14 items-stretch">
          <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: "-50px" }} transition={{ duration: 0.5 }} className="grid grid-cols-2 gap-3 content-start">
            {areas.map((area) =>
            <div key={area.name} className="flex items-center gap-3 bg-white rounded-2xl p-4 border border-carbon/5 shadow-sm">
                <CheckCircle2 className="w-5 h-5 text-terai flex-shrink-0" />
                <span className="text-sm font-medium text-foreground">{area.name}</span>
              </div>
            )}
            <div className="col-span-2 bg-saffron/5 border border-saffron/10 rounded-2xl p-4 flex items-center gap-3">
              <MapPin className="w-5 h-5 text-saffron flex-shrink-0" />
              <span className="text-sm text-foreground/70">Don't see your area? We're expanding fast — <a href="/#contact" className="text-saffron font-semibold">let us know</a>.</span>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true, margin: "-50px" }} transition={{ duration: 0.5 }} className="rounded-3xl overflow-hidden shadow-xl shadow-carbon/10 h-[400px] lg:h-auto min-h-[400px] border border-carbon/5">
            <MapContainer center={[28.6970, 80.6050]} zoom={13} className="w-full h-full" style={{ height: "100%", minHeight: "400px" }}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap contributors' />
              {areas.map((area) =>
              <CircleMarker key={area.name} center={area.position} radius={8} pathOptions={{ color: "#FF3D00", fillColor: "#FF3D00", fillOpacity: 0.85 }}>
                  <Tooltip>{area.name}</Tooltip>
                </CircleMarker>
              )}
            </MapContainer>
          </motion.div>
        </div>
      </div>
    </section>);

}