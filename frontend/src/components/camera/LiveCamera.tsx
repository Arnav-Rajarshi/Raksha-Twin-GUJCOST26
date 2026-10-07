import { useEffect, useState } from "react";
import { Crosshair, Maximize2, Minimize2 } from "lucide-react";
import type { CameraState, DetectionSummary } from "@/models/dashboard";
import { formatTime } from "@/utils/formatters";

interface LiveCameraProps {
  data: CameraState;
  detections: DetectionSummary;
  isFocused?: boolean;
  onToggleFocus?: () => void;
}

export function LiveCamera({
  data,
  detections,
  isFocused = false,
  onToggleFocus,
}: LiveCameraProps) {
  const [clock, setClock] = useState(data.latest_detection.timestamp);

  useEffect(() => {
    const start = Date.parse(data.latest_detection.timestamp) || Date.now();
    const t0 = Date.now();
    const id = setInterval(() => {
      setClock(new Date(start + (Date.now() - t0)).toISOString());
    }, 1000);
    return () => clearInterval(id);
  }, [data.latest_detection.timestamp]);

  const live = data.connection_status === "CONNECTED";
  const confidence = Math.round((data.latest_detection.confidence || 0) * 100);

  return (
    <section
      className={`instrument-panel camera-panel ${isFocused ? "is-focused-camera" : ""}`}
    >
      <header className="panel-header">
        <span>
          <i className={`live-dot ${live ? "" : "off"}`} />
          {isFocused ? "PRIMARY SENSOR VIEW // LIVE FEED" : `PRIMARY SENSOR · ${data.camera_id}`}
        </span>
        <div className="camera-header-controls">
          <code>{isFocused ? "FOCUS.VR" : "CAM.01"}</code>
          {onToggleFocus && (
            <button
              type="button"
              className="camera-focus-toggle-btn"
              onClick={onToggleFocus}
              title={isFocused ? "Exit Camera Focus (Return to Map)" : "Enter Camera Focus Mode"}
            >
              {isFocused ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
              <span>{isFocused ? "MAP VIEW" : "FOCUS"}</span>
            </button>
          )}
        </div>
      </header>

      <div className="camera-feed" onClick={!isFocused ? onToggleFocus : undefined}>
        {data.stream_url ? (
          <video src={data.stream_url} autoPlay muted loop playsInline />
        ) : data.preview_frame_url ? (
          <img
            className="camera-frame"
            src={data.preview_frame_url}
            alt={`${data.camera_id} live view`}
            width={1600}
            height={912}
          />
        ) : (
          <div className="camera-nosignal">NO SIGNAL // FEED OFFLINE</div>
        )}

        <div className="camera-noise" aria-hidden="true" />
        <div className="camera-scan" aria-hidden="true" />
        <span className="corner tl" />
        <span className="corner tr" />
        <span className="corner bl" />
        <span className="corner br" />

        <div className="camera-reticle" aria-hidden="true">
          <i />
          <i />
        </div>

        <div className="camera-top">
          <span className={`live-chip ${live ? "" : "off"}`}>
            <i />
            {live ? "LIVE" : "OFFLINE"}
          </span>
          <span>{data.camera_id} / RGB</span>
          <span>
            {data.camera_resolution}
            {data.stream_fps ? ` · ${data.stream_fps}FPS` : ""}
          </span>
          <span className="cam-clock">{formatTime(clock)} UTC</span>
        </div>

        <div className="target-box">
          <span>
            {data.latest_detection.type} {confidence}%
          </span>
          <Crosshair size={12} />
        </div>

        <div className="camera-bottom">
          <span>AI · YOLO ACTIVE</span>
          <span>
            P {detections.person_count} · D {detections.debris_count} · O {detections.obstacle_count}
          </span>
          <span>{data.connection_status}</span>
          {onToggleFocus && (
            <button
              type="button"
              className="bottom-expand-btn"
              onClick={(e) => {
                e.stopPropagation();
                onToggleFocus();
              }}
              title={isFocused ? "Return to Map Mode" : "Expand Camera"}
            >
              {isFocused ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
