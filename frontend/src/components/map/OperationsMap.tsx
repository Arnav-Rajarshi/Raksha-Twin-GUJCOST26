import { useEffect, useRef, useState, useCallback } from "react";
import type { DashboardSnapshot, RobotState } from "@/models/dashboard";
import markerAsset from "@/assets/Bot Marker for the Map.png";
import selectedMarkerAsset from "@/assets/Selected Bot marker for the map.png";
import { formatCoordinate } from "@/utils/formatters";

type AnyMap = import("maplibre-gl").Map;
type AnyMarker = import("maplibre-gl").Marker;

const ESRI_SATELLITE_STYLE = {
  version: 8 as const,
  sources: {
    imagery: {
      type: "raster" as const,
      tiles: [
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      ],
      tileSize: 256,
      maxzoom: 19,
      attribution: "Esri, Maxar",
    },
    labels: {
      type: "raster" as const,
      tiles: [
        "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
      ],
      tileSize: 256,
    },
  },
  layers: [
    {
      id: "imagery",
      type: "raster" as const,
      source: "imagery",
      paint: {
        "raster-brightness-max": 0.64,
        "raster-saturation": -0.30,
        "raster-contrast": 0.10,
      },
    },
    {
      id: "labels",
      type: "raster" as const,
      source: "labels",
      paint: { "raster-opacity": 0.75 },
    },
  ],
};

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
    coords.push([
      lng + (radiusKm / (111.32 * Math.cos((lat * Math.PI) / 180))) * Math.cos(a),
      lat + (radiusKm / 110.57) * Math.sin(a),
    ]);
  }
  return {
    type: "Feature" as const,
    properties: {},
    geometry: { type: "Polygon" as const, coordinates: [coords] },
  };
}

interface OperationsMapProps {
  data: DashboardSnapshot;
  robot: RobotState;
  receded?: boolean;
  onMapClick?: () => void;
}

export function OperationsMap({
  data,
  robot,
  receded = false,
  onMapClick,
}: OperationsMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<AnyMap | null>(null);
  const robotMarkerRef = useRef<AnyMarker | null>(null);
  const [engine, setEngine] = useState<"mapbox" | "maplibre" | null>(null);
  const [zoom, setZoom] = useState(15.5);
  const [selected, setSelected] = useState(false);

  // Initialize Map
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const token = import.meta.env["VITE_MAPBOX_ACCESS_TOKEN"] as string | undefined;
    let cancelled = false;

    const center: [number, number] = [
      robot.location?.longitude ?? data.path?.path?.coordinates?.slice(-1)[0]?.[0] ?? 72.0782,
      robot.location?.latitude ?? data.path?.path?.coordinates?.slice(-1)[0]?.[1] ?? 21.7847,
    ];

    const load = async () => {
      let map: AnyMap;
      let lib: typeof import("maplibre-gl");

      if (token) {
        const mb = (await import("mapbox-gl")).default;
        mb.accessToken = token;
        lib = mb as unknown as typeof import("maplibre-gl");
        map = new mb.Map({
          container,
          style: "mapbox://styles/mapbox/satellite-streets-v12",
          center,
          zoom: 15.5,
          pitch: 42,
          bearing: -18,
          attributionControl: false,
          interactive: true,
          dragPan: true,
          scrollZoom: true,
          boxZoom: true,
          dragRotate: true,
          keyboard: true,
          doubleClickZoom: true,
          touchZoomRotate: true,
        }) as unknown as AnyMap;
      } else {
        await import("maplibre-gl/dist/maplibre-gl.css");
        lib = await import("maplibre-gl");
        const workerUrl = (await import("maplibre-gl/dist/maplibre-gl-worker.mjs?url")).default;
        lib.setWorkerUrl(workerUrl);
        map = new lib.Map({
          container,
          style: ESRI_SATELLITE_STYLE,
          center,
          zoom: 15.5,
          pitch: 42,
          bearing: -18,
          attributionControl: false,
          maxPitch: 70,
          interactive: true,
          dragPan: true,
          scrollZoom: true,
          boxZoom: true,
          dragRotate: true,
          keyboard: true,
          doubleClickZoom: true,
          touchZoomRotate: true,
        });
      }

      if (cancelled) {
        map.remove();
        return;
      }
      mapRef.current = map;

      const updatePadding = () => {
        const w = window.innerWidth;
        const h = window.innerHeight;
        const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
        if (w > 1024 && !receded) {
          map.setPadding({
            top: 64,
            left: clamp(w * 0.18, 260, 290) + 16,
            right: clamp(w * 0.18, 250, 280) + 16,
            bottom: clamp(h * 0.18, 140, 180) + 16,
          });
        } else {
          map.setPadding({ top: 16, left: 16, right: 16, bottom: 16 });
        }
      };

      updatePadding();
      map.addControl(
        new lib.NavigationControl({ showCompass: true, visualizePitch: true }),
        "bottom-right"
      );
      map.addControl(new lib.ScaleControl({ unit: "metric" }), "bottom-right");
      map.on("zoom", () => setZoom(map.getZoom()));
      map.on("move", () => setZoom(map.getZoom()));

      map.on("click", () => {
        if (receded && onMapClick) {
          onMapClick();
        }
      });

      map.on("load", () => {
        const warning = tokenToRgb("--warning");
        const accent = tokenToRgb("--accent");

        // Mission area circle
        map.addSource("mission-area", {
          type: "geojson",
          data: circlePolygon(center, 0.9),
        });
        map.addLayer({
          id: "mission-area-fill",
          type: "fill",
          source: "mission-area",
          paint: { "fill-color": accent, "fill-opacity": 0.06 },
        });
        map.addLayer({
          id: "mission-area-line",
          type: "line",
          source: "mission-area",
          paint: {
            "line-color": accent,
            "line-width": 1,
            "line-dasharray": [3, 3],
          },
        });

        // Robot Traversed Path
        const pathGeoJson = {
          type: "Feature" as const,
          properties: {},
          geometry: data.path?.path || {
            type: "LineString" as const,
            coordinates: [center],
          },
        };

        map.addSource("robot-path", {
          type: "geojson",
          data: pathGeoJson,
        });

        map.addLayer({
          id: "robot-path-glow",
          type: "line",
          source: "robot-path",
          layout: { "line-cap": "round", "line-join": "round" },
          paint: {
            "line-color": warning,
            "line-width": 12,
            "line-opacity": 0.22,
          },
        });

        map.addLayer({
          id: "robot-path",
          type: "line",
          source: "robot-path",
          layout: { "line-cap": "round", "line-join": "round" },
          paint: {
            "line-color": warning,
            "line-width": 3.5,
          },
        });

        // Operator Marker
        const opLocation = data.operatorLocation || (data.path?.path?.coordinates?.[0] ? {
          longitude: data.path.path.coordinates[0][0],
          latitude: data.path.path.coordinates[0][1],
        } : null);

        if (opLocation) {
          const op = document.createElement("div");
          op.className = "operator-marker";
          op.innerHTML = "<i></i><span>OPS 01</span>";
          new lib.Marker({ element: op })
            .setLngLat([opLocation.longitude, opLocation.latitude])
            .addTo(map);
        }

        // Nearby Emergency Services (POI)
        (data.nearbyServices || []).forEach((service) => {
          const el = document.createElement("button");
          el.type = "button";
          el.className = `poi-marker poi-${service.category.toLowerCase()}`;
          el.setAttribute("aria-label", service.name);
          el.textContent = service.category.slice(0, 1);
          new lib.Marker({ element: el })
            .setLngLat([service.location.longitude, service.location.latitude])
            .setPopup(
              new lib.Popup({
                offset: 16,
                closeButton: false,
                className: "ops-popup",
              }).setHTML(
                `<small>${service.category.replace("_", " ")}</small><strong>${service.name}</strong><span>${service.distance_km} km from robot</span>`
              )
            )
            .addTo(map);
        });

        // Robot Live Marker at latest robot location
        const marker = document.createElement("div");
        marker.className = "robot-map-marker";
        marker.innerHTML = `<span class="ping"></span><img alt="${robot.robot_id}" src="${markerAsset}" />`;
        marker.addEventListener("click", (e) => {
          e.stopPropagation();
          setSelected((s) => !s);
        });

        robotMarkerRef.current = new lib.Marker({
          element: marker,
          rotationAlignment: "map",
          rotation: robot.heading || 0,
        })
          .setLngLat(center)
          .addTo(map);

        setEngine(token ? "mapbox" : "maplibre");
      });
    };

    void load();

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      robotMarkerRef.current = null;
    };
    // Initialize once per mission / robot load
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.mission.mission_id, data.mission.robot_id]);

  // Update robot marker live position and rotation
  useEffect(() => {
    const marker = robotMarkerRef.current;
    if (!marker || !robot.location) return;

    marker.setLngLat([robot.location.longitude, robot.location.latitude]);
    marker.setRotation(robot.heading || 0);

    const img = marker.getElement().querySelector("img");
    if (img) img.src = selected ? selectedMarkerAsset : markerAsset;
    marker.getElement().classList.toggle("is-selected", selected);
  }, [robot.location?.latitude, robot.location?.longitude, robot.heading, selected]);

  // Update path on map when data.path changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    const source = map.getSource("robot-path") as
      | { setData: (data: unknown) => void }
      | undefined;

    if (source && data.path?.path) {
      source.setData({
        type: "Feature",
        properties: {},
        geometry: data.path.path,
      });
    }
  }, [data.path]);

  // Handle resize and padding when entering / exiting Camera focus
  useEffect(() => {
    const timer = setTimeout(() => {
      const map = mapRef.current;
      if (!map) return;
      const w = window.innerWidth;
      const h = window.innerHeight;
      const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
      if (w > 1024 && !receded) {
        map.setPadding({
          top: 64,
          left: clamp(w * 0.18, 260, 290) + 16,
          right: clamp(w * 0.18, 250, 280) + 16,
          bottom: clamp(h * 0.18, 140, 180) + 16,
        });
      } else {
        map.setPadding({ top: 16, left: 16, right: 16, bottom: 16 });
      }
      map.resize();
    }, 300);
    return () => clearTimeout(timer);
  }, [receded]);

  const recenter = useCallback(() => {
    const lng = robot.location?.longitude ?? data.path?.path?.coordinates?.slice(-1)[0]?.[0] ?? 72.0782;
    const lat = robot.location?.latitude ?? data.path?.path?.coordinates?.slice(-1)[0]?.[1] ?? 21.7847;
    mapRef.current?.flyTo({
      center: [lng, lat],
      zoom: 15.5,
      duration: 800,
    });
  }, [robot.location?.latitude, robot.location?.longitude, data.path]);

  return (
    <div
      className={`map-stage ${receded ? "is-receded-map" : ""}`}
      onClick={receded ? onMapClick : undefined}
    >
      <div ref={containerRef} className="map-canvas" />
      {!engine && <div className="map-loading">ACQUIRING SATELLITE IMAGERY…</div>}
      <div className="map-hud">
        <div className="coordinates-readout">
          <span>{formatCoordinate(robot.location?.latitude || 21.7847, "lat")}</span>
          <span>{formatCoordinate(robot.location?.longitude || 72.0782, "lng")}</span>
          <span>Z {zoom.toFixed(1)}</span>
        </div>
        <button type="button" className="recenter" onClick={recenter}>
          CENTER ON {robot.robot_id}
        </button>
      </div>

      <div className="map-legend">
        <span>
          <i className="legend-path" />
          TRAVERSED
        </span>
        <span>
          <i className="legend-area" />
          MISSION AREA
        </span>
        <span>
          <i className="legend-poi" />
          SERVICES
        </span>
        <span>
          <i className="legend-op" />
          OPERATOR
        </span>
      </div>
    </div>
  );
}
