import { useEffect, useState } from "react";
import { Crosshair, Maximize2, Minimize2 } from "lucide-react";
import type { CameraState, DetectionSummary, PiDetectionState } from "@/models/dashboard";
import { formatTime } from "@/utils/formatters";
import { LOCAL_ML_VIDEO_URL, RAKSHA_ML_VIDEO_URL } from "@/services/CameraFeed_Service";

export type LiveCameraSource = "PI" | "LOCAL";

interface LiveCameraProps {
  data: CameraState;
  detections: DetectionSummary;
  isLiveCamera: boolean;
  cameraSource: LiveCameraSource;
  liveStreamFailed: boolean;
  piDetections: PiDetectionState | null;
  onLiveCameraChange: (isLive: boolean) => void;
  onLiveStreamError: (source: LiveCameraSource) => void;
  isFocused?: boolean;
  onToggleFocus?: () => void;
}

export function LiveCamera({
  data,
  detections,
  isLiveCamera,
  cameraSource,
  liveStreamFailed,
  piDetections,
  onLiveCameraChange,
  onLiveStreamError,
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

  const live = isLiveCamera ? !liveStreamFailed : data.connection_status === "CONNECTED";
  const latestPiDetection = piDetections?.detections?.[0];
  const targetType = isLiveCamera
    ? latestPiDetection?.class_name?.toUpperCase() || "PERSON"
    : data.latest_detection.type;
  const targetConfidence = isLiveCamera
    ? latestPiDetection?.confidence || 0
    : data.latest_detection.confidence;
  const confidence = Math.round((targetConfidence || 0) * 100);

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
          <button
            type="button"
            className="camera-live-toggle-btn"
            onClick={(event) => {
              event.stopPropagation();
              onLiveCameraChange(!isLiveCamera);
            }}
          >
            {isLiveCamera ? "SWITCH TO MOCK" : "SWITCH TO LIVE"}
          </button>
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
        {isLiveCamera && !liveStreamFailed ? (
          <img
            className="camera-live-stream"
            src={cameraSource === "PI" ? RAKSHA_ML_VIDEO_URL : LOCAL_ML_VIDEO_URL}
            alt={cameraSource === "PI" ? "Raspberry Pi live AI camera stream" : "Local laptop AI camera stream"}
            onError={() => onLiveStreamError(cameraSource)}
          />
        ) : data.stream_url ? (
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

        {isLiveCamera && liveStreamFailed && (
          <div className="camera-live-error">
            {cameraSource === "LOCAL" ? "LOCAL CAMERA OFFLINE · MOCK VIEW SHOWN" : "PI STREAM OFFLINE · MOCK VIEW SHOWN"}
          </div>
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
            {live ? (cameraSource === "LOCAL" ? "LOCAL AI" : "LIVE") : isLiveCamera ? "OFFLINE" : "OFFLINE"}
          </span>
          <span>{data.camera_id} / RGB</span>
          <span>
            {data.camera_resolution}
            {data.stream_fps ? ` · ${data.stream_fps}FPS` : ""}
          </span>
          <span className="cam-clock">{formatTime(clock)} UTC</span>
        </div>

        {!isLiveCamera && (
          <div className="target-box">
            <span>
              {targetType} {confidence}%
            </span>
            <Crosshair size={12} />
          </div>
        )}

        <div className="camera-bottom">
          <span>{isLiveCamera ? `AI · YOLO ${cameraSource}` : "AI · YOLO ACTIVE"}</span>
          {isLiveCamera ? (
            <span>
              PERSONS {piDetections?.person_count ?? "—"} · AI FPS {piDetections?.fps?.toFixed(1) ?? "—"}
              {latestPiDetection?.status ? ` · ${latestPiDetection.status}` : ""}
            </span>
          ) : <span>
            P {detections.person_count} · D {detections.debris_count} · O {detections.obstacle_count}
          </span>}
          <span>{isLiveCamera ? (liveStreamFailed ? "CAMERA OFFLINE" : `${cameraSource} LIVE`) : data.connection_status}</span>
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
