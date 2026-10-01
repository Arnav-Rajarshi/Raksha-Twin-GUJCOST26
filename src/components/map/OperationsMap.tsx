import { useEffect, useRef, useState } from "react";
import type { DashboardSnapshot, RobotState } from "@/models/dashboard";
import markerAsset from "@/assets/Bot_Marker_for_the_Map.png.asset.json";
import selectedMarkerAsset from "@/assets/Selected_Bot_marker_for_the_map.png.asset.json";
import { formatCoordinate } from "@/utils/formatters";

// Both engines share the subset of the API used here.
type AnyMap = import("maplibre-gl").Map;
type AnyMarker = import("maplibre-gl").Marker;

const ESRI_SATELLITE_STYLE = {
  version: 8 as const,
  sources: {
    imagery: {
      type: "raster" as const,
      tiles: ["https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"],
      tileSize: 256,
      maxzoom: 19,
      attribution: "Esri, Maxar",
    },
    labels: {
      type: "raster" as const,
      tiles: ["https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"],
      tileSize: 256,
    },
  },
  layers: [
    { id: "imagery", type: "raster" as const, source: "imagery", paint: { "raster-brightness-max": 0.62, "raster-saturation": -0.35, "raster-contrast": 0.08 } },
    { id: "labels", type: "raster" as const, source: "labels", paint: { "raster-opacity": 0.7 } },
  ],
};

/** Map engines can't parse oklch; resolve a CSS token to rgb via canvas. */
function tokenToRgb(token: string) {
  const ctx = document.createElement("canvas").getContext("2d");
  if (!ctx) return "#e0a040";
  ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue(token).trim();
  ctx.fillRect(0, 0, 1, 1);
  const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
  return `rgb(${r}, ${g}, ${b})`;
}

function circlePolygon([lng, lat]: [number, number], radiusKm: number) {
  const coords: [number, number][] = [];
  for (let i = 0; i <= 64; i++) {
    const a = (i / 64) * Math.PI * 2;
    coords.push([lng + (radiusKm / (111.32 * Math.cos((lat * Math.PI) / 180))) * Math.cos(a), lat + (radiusKm / 110.57) * Math.sin(a)]);
  }
  return { type: "Feature" as const, properties: {}, geometry: { type: "Polygon" as const, coordinates: [coords] } };
}

export function OperationsMap({ data, robot }: { data: DashboardSnapshot; robot: RobotState }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<AnyMap | null>(null);
  const robotMarkerRef = useRef<AnyMarker | null>(null);
  const [engine, setEngine] = useState<"mapbox" | "maplibre" | null>(null);
  const [zoom, setZoom] = useState(15);
  const [selected, setSelected] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const token = import.meta.env["VITE_MAPBOX_ACCESS_TOKEN"] as string | undefined;
    let cancelled = false;
    const center: [number, number] = [robot.location.longitude, robot.location.latitude];

    const load = async () => {
      let map: AnyMap;
      let lib: typeof import("maplibre-gl");
      if (token) {
        const mb = (await import("mapbox-gl")).default;
        mb.accessToken = token;
        lib = mb as unknown as typeof import("maplibre-gl");
        map = new mb.Map({ container, style: "mapbox://styles/mapbox/satellite-streets-v12", center, zoom: 15, pitch: 42, bearing: -18, attributionControl: false }) as unknown as AnyMap;
      } else {
        await import("maplibre-gl/dist/maplibre-gl.css");
        lib = await import("maplibre-gl");
        const workerUrl = (await import("maplibre-gl/dist/maplibre-gl-csp-worker.js?url")).default;
        lib.setWorkerUrl(workerUrl);
        map = new lib.Map({ container, style: ESRI_SATELLITE_STYLE, center, zoom: 15, pitch: 42, bearing: -18, attributionControl: false, maxPitch: 70 });
      }
      if (cancelled) { map.remove(); return; }
      mapRef.current = map;
      map.addControl(new lib.NavigationControl({ showCompass: true, visualizePitch: true }), "bottom-right");
      map.addControl(new lib.ScaleControl({ unit: "metric" }), "bottom-right");
      map.on("zoom", () => setZoom(map.getZoom()));

      map.on("load", () => {
        const warning = tokenToRgb("--warning");
        const accent = tokenToRgb("--accent");
        map.addSource("mission-area", { type: "geojson", data: circlePolygon(center, 0.9) });
        map.addLayer({ id: "mission-area-fill", type: "fill", source: "mission-area", paint: { "fill-color": accent, "fill-opacity": 0.06 } });
        map.addLayer({ id: "mission-area-line", type: "line", source: "mission-area", paint: { "line-color": accent, "line-width": 1, "line-dasharray": [3, 3] } });
        map.addSource("robot-path", { type: "geojson", data: { type: "Feature", properties: {}, geometry: data.path.path } });
        map.addLayer({ id: "robot-path-glow", type: "line", source: "robot-path", layout: { "line-cap": "round", "line-join": "round" }, paint: { "line-color": warning, "line-width": 10, "line-opacity": 0.18 } });
        map.addLayer({ id: "robot-path", type: "line", source: "robot-path", layout: { "line-cap": "round", "line-join": "round" }, paint: { "line-color": warning, "line-width": 3 } });

        const op = document.createElement("div");
        op.className = "operator-marker";
        op.innerHTML = "<i></i><span>OPS 01</span>";
        new lib.Marker({ element: op }).setLngLat([data.operatorLocation.longitude, data.operatorLocation.latitude]).addTo(map);

        data.nearbyServices.forEach((service) => {
          const el = document.createElement("button");
          el.type = "button";
          el.className = `poi-marker poi-${service.category.toLowerCase()}`;
          el.setAttribute("aria-label", service.name);
          el.textContent = service.category.slice(0, 1);
          new lib.Marker({ element: el })
            .setLngLat([service.location.longitude, service.location.latitude])
            .setPopup(new lib.Popup({ offset: 16, closeButton: false, className: "ops-popup" }).setHTML(`<small>${service.category.replace("_", " ")}</small><strong>${service.name}</strong><span>${service.distance_km} km from robot</span>`))
            .addTo(map);
        });

        const marker = document.createElement("div");
        marker.className = "robot-map-marker";
        marker.innerHTML = `<span class="ping"></span><img alt="${robot.robot_id}" src="${markerAsset.url}" />`;
        marker.addEventListener("click", () => setSelected((s) => !s));
        robotMarkerRef.current = new lib.Marker({ element: marker, rotationAlignment: "map", rotation: robot.heading })
          .setLngLat(center)
          .addTo(map);
        setEngine(token ? "mapbox" : "maplibre");
      });
    };
    void load();
    return () => { cancelled = true; mapRef.current?.remove(); mapRef.current = null; robotMarkerRef.current = null; };
    // Map is created once; live robot updates are applied below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  useEffect(() => {
    const marker = robotMarkerRef.current;
    if (!marker) return;
    marker.setLngLat([robot.location.longitude, robot.location.latitude]);
    marker.setRotation(robot.heading);
    const img = marker.getElement().querySelector("img");
    if (img) img.src = selected ? selectedMarkerAsset.url : markerAsset.url;
    marker.getElement().classList.toggle("is-selected", selected);
  }, [robot, selected, engine]);

  const recenter = () => mapRef.current?.flyTo({ center: [robot.location.longitude, robot.location.latitude], zoom: 15.5, duration: 900 });

  return (
    <div className="map-stage">
      <div ref={containerRef} className="map-canvas" />
      {!engine && <div className="map-loading">ACQUIRING SATELLITE IMAGERY…</div>}
      <div className="map-hud">
        <div className="coordinates-readout">
          <span>{formatCoordinate(robot.location.latitude, "lat")}</span>
          <span>{formatCoordinate(robot.location.longitude, "lng")}</span>
          <span>Z {zoom.toFixed(1)}</span>
        </div>
        <button type="button" className="recenter" onClick={recenter}>CENTER ON {robot.robot_id}</button>
      </div>
      <div className="map-legend">
        <span><i className="legend-path" />TRAVERSED</span>
        <span><i className="legend-area" />MISSION AREA</span>
        <span><i className="legend-poi" />SERVICES</span>
        <span><i className="legend-op" />OPERATOR</span>
      </div>
    </div>
  );
}
