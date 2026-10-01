import { useEffect, useRef, useState } from "react";
import type { DashboardSnapshot } from "@/models/dashboard";
import markerAsset from "@/assets/Bot_Marker_for_the_Map.png.asset.json";

export function OperationsMap({ data }: { data: DashboardSnapshot }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("mapbox-gl").Map | null>(null);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    const token = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
    const container = containerRef.current;
    if (!token || !container) return;
    let cancelled = false;
    void import("mapbox-gl").then(({ default: mapboxgl }) => {
      if (cancelled || mapRef.current) return;
      mapboxgl.accessToken = token;
      const map = new mapboxgl.Map({
        container,
        style: "mapbox://styles/mapbox/satellite-streets-v12",
        center: [data.robot.location.longitude, data.robot.location.latitude],
        zoom: 14.4,
        pitch: 48,
        bearing: -18,
        attributionControl: false,
      });
      map.addControl(new mapboxgl.NavigationControl({ showCompass: true }), "bottom-right");
      map.on("load", () => {
        map.addSource("robot-path", { type: "geojson", data: { type: "Feature", properties: {}, geometry: data.path.path } });
        map.addLayer({ id: "robot-path-glow", type: "line", source: "robot-path", paint: { "line-color": "#f6a52c", "line-width": 8, "line-opacity": 0.22 } });
        map.addLayer({ id: "robot-path", type: "line", source: "robot-path", paint: { "line-color": "#ffb23f", "line-width": 3, "line-dasharray": [2, 1] } });
        const marker = document.createElement("div");
        marker.className = "robot-map-marker";
        const image = document.createElement("img");
        image.src = markerAsset.url;
        image.alt = data.robot.robot_id;
        marker.append(image);
        new mapboxgl.Marker({ element: marker }).setLngLat([data.robot.location.longitude, data.robot.location.latitude]).addTo(map);
        data.nearbyServices.forEach((service) => {
          const el = document.createElement("div");
          el.className = `poi-marker poi-${service.category.toLowerCase()}`;
          el.setAttribute("aria-label", service.name);
          new mapboxgl.Marker({ element: el }).setLngLat([service.location.longitude, service.location.latitude]).setPopup(new mapboxgl.Popup({ offset: 18 }).setText(`${service.name} · ${service.distance_km} km`)).addTo(map);
        });
        setMapReady(true);
      });
      mapRef.current = map;
    });
    return () => { cancelled = true; mapRef.current?.remove(); mapRef.current = null; };
  }, [data]);

  return (
    <div className="map-stage">
      <div ref={containerRef} className="mapbox-canvas" />
      {!mapReady && <FallbackMap data={data} />}
      <div className="map-grid" aria-hidden="true" />
      <div className="coordinates-readout">{data.robot.location.latitude.toFixed(4)} N&nbsp;&nbsp; {data.robot.location.longitude.toFixed(4)} E</div>
      <div className="map-legend"><span><i className="legend-path" />TRAVERSED</span><span><i className="legend-poi" />SERVICES</span></div>
    </div>
  );
}

function FallbackMap({ data }: { data: DashboardSnapshot }) {
  return (
    <div className="fallback-map" aria-label="Map preview awaiting Mapbox token">
      <div className="terrain terrain-one" /><div className="terrain terrain-two" /><div className="river" />
      <svg className="route-line" viewBox="0 0 1000 700" preserveAspectRatio="none" aria-hidden="true">
        <path d="M120 590 C220 530, 210 420, 355 405 S510 450, 570 330 S690 185, 790 215" />
      </svg>
      {data.nearbyServices.map((service, index) => <span key={service.service_id} className={`fallback-poi fallback-poi-${index + 1}`} title={service.name} />)}
      <div className="fallback-robot"><span /><img src={markerAsset.url} alt={`${data.robot.robot_id} current position`} /></div>
      <div className="map-token-notice">SATELLITE LINK / TOKEN PENDING</div>
    </div>
  );
}