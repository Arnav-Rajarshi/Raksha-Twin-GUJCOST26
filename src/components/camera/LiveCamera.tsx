import { Crosshair } from "lucide-react";
import type { CameraState } from "@/models/dashboard";
import robotAsset from "@/assets/raksha_twin_bot.png.asset.json";
import { formatTime } from "@/utils/formatters";

export function LiveCamera({ data }: { data: CameraState }) {
  return (
    <section className="camera-feed">
      {data.stream_url ? <video src={data.stream_url} autoPlay muted loop playsInline /> : <img src={robotAsset.url} alt="RAKSHA-TWIN live reconnaissance feed" />}
      <div className="camera-scan" />
      <div className="camera-top"><span className="live-chip"><i />LIVE</span><span>{data.camera_id} / {data.camera_resolution}</span><span>{formatTime(data.latest_detection.timestamp)}</span></div>
      <div className="target-box"><span>{data.latest_detection.type} {(data.latest_detection.confidence * 100).toFixed(0)}%</span><Crosshair size={14} /></div>
      <div className="camera-bottom"><span>OPTICAL / RGB</span><span>{data.connection_status}</span></div>
    </section>
  );
}