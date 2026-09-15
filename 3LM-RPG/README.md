# 🕌 رحلة المعرفة — لعبة أسئلة إسلامية بأسلوب البكسل آرت

لعبة RPG تعليمية تعمل في المتصفح على الحاسوب والجوال (الوضع العمودي). تتجول في خمس مناطق
مولّدة عشوائيًا، تلتقي شخصيات تسألك أسئلة من **جدول جوجل مباشرة**، وتجمع المفاتيح لتفتح
البوابات وتصل في النهاية إلى **باب المكتبة**. لا يوجد قتال إطلاقًا.

---

## التشغيل — How to run

**المتطلبات:** Node.js (أي إصدار حديث) أو أي خادم ملفات ثابت آخر. لا حاجة إلى أي `npm install`.

```bash
node dev-server.mjs          # ثم افتح http://localhost:8080
# أو
npm start                    # نفس الأمر
```

على الجوال (نفس شبكة الواي فاي): افتح الرابط الذي يطبعه الخادم:
`http://<عنوان-الجهاز-في-الشبكة>:8080/`

> ⚠️ لا تعمل اللعبة بفتح `index.html` مباشرةً من القرص (file://) لأن المتصفح يمنع
> وحدات ES وجلب جدول الأسئلة في هذا الوضع. استخدم خادمًا محليًا كما هو موضح أعلاه.

---

## الأسئلة — كيف تُقرأ من جدول جوجل

- تُحمَّل الأسئلة من الجدول عند كل تشغيل: `SHEET.id` و `SHEET.gid` في `js/config.js`.
- بنية الأعمدة: **1** السؤال، **2** الإجابة الصحيحة، **3–5** الأجوبة الخاطئة.
- الصف الأول يُعدّ صف قالب/عنوان ويُتجاهل، والقراءة تبدأ من الصف الثاني
  (`SHEET.headerRows` في `js/config.js` — اجعلها `0` إذا حذفت صف القالب).
- **شرط مهم:** يجب أن يكون الجدول مشتركًا كـ «أي شخص لديه الرابط: عارض».
- الصفوف الناقصة أو المكررة تُتجاوز تلقائيًا (مع عدّاد في الطرفية/الكونسول).
- إذا تعذّر الاتصال بالإنترنت تُستخدم نسخة محفوظة محليًا وتظهر ملاحظة في اللعبة.
- لتحديث النسخة المحفوظة بعد تعديل الجدول: `npm run sheet` (تُحدِّث
  `js/data/fallback-questions.json`).
- حسب الحجم: إذا تجاوز عدد الأسئلة `SHEET.maxPerRun` يُختار منها جزء عشوائي كل رحلة
  (القيمة الافتراضية 24، ويمكن وضع `'all'` لاستخدام الكل دائمًا).

### قاعدة التوزيع والمفاتيح
كل سؤال = شخصية = مفتاح واحد عند الإجابة الصحيحة.
البوابات بين المناطق تحتاج نسبًا متزايدة، والباب النهائي يحتاج **كل** المفاتيح:
`20% → 40% → 60% → 80% → 100%` (انظر `RULES.gateFractions`).

---

## التحكم — Controls

| | حاسوب | جوال |
|---|---|---|
| الحركة | الأسهم أو WASD | المقبض الافتراضي (اسحب حيث تشاء أسفل يسار الشاشة) |
| التفاعل | E أو مسافة أو Enter (أو نقرة على الشاشة) | زر «تحدَّث» أسفل يمين الشاشة (أو نقرة على الشاشة) |
| إغلاق السؤال | زر «لاحقًا» أو Esc | زر «لاحقًا» |
| كتم الصوت | M أو زر 🔊 | زر 🔊 |
| الخريطة | زر 🗺 | زر 🗺 |

- القلوب: 3 قلوب. الإجابة الخاطئة تُنقص قلبًا والخيار الخاطئ يُعطَّل.
- عند فقد كل القلوب تُغمى عليك وتعود إلى باب الغرفة بقلوب كاملة (لا خسارة تقدّم).
- النقاط حسب رقم المحاولة: 100 / 70 / 40 (أول/ثاني/ثالث محاولة).

---

## خريطة الملفات — Where to edit what

| المطلوب تعديله | الملف |
|---|---|
| رابط الجدول، القلوب، السرعة، النقاط، نصوص اللعبة العربية، ألوان المناطق | `js/config.js` |
| رسمات البكسل (شخصيات، أغراض، أبواب) | `js/render/sprite-data.js` |
| أرضيات المناطق وزخارف الجدران | `js/render/rooms.js` |
| توليد العالم (المناطق، الغرف، الأبواب، البوابات، الشخصيات، الكنوز) | `js/game/world.js` |
| القواعد الحيّة (قلوب/مفاتيح/نقاط/إغماء/انتقالات) | `js/game/state.js` |
| الرسم والجزيئات | `js/render/renderer.js` |
| الإدخال (لوحة/لمس) | `js/engine/input.js` |
| الأصوات (مُولَّدة بالكود، بلا ملفات) | `js/engine/audio.js` |
| الواجهة: القلوب، الخريطة، نافذة السؤال، الشاشات | `js/ui/*.js` |
| الأنماط والتصميم | `styles.css` |

### معاينة الرسومات (أداة تطوير)
`http://localhost:8080/tools/preview.html?page=1&per=12&scale=5&cols=4`
تعرض كل الرسومات مكبَّرة مع تحقق تلقائي من صحة صفوف البكسل، وتُظهر مستطيلات التصادم.

### فحص العالم المولَّد (أداة تطوير)
```bash
node tools/check-world.mjs 40   # يفحص 40 عالمًا عشوائيًا
```
يتحقق من: اتصال الغرف، وجود محتوى في كل غرفة، خلوص الزينة عن الأبواب ونقطة البداية،
صحة أزواج الأبواب، وتدرج متطلبات البوابات — مفيد جدًا بعد أي تعديل على التوليد.

---

## النشر على استضافة ثابتة — Deploying to a static host

اللعبة **موقع ثابت بالكامل**: لا خادم خلفي، ولا خطوة بناء، ولا تبعيات وقت تشغيل.
انشر المجلد كما هو على أي استضافة ملفات ثابتة وسيعمل مباشرة.

**ما الذي ترفعه؟**
- المطلوب: `index.html`، `styles.css`، ومجلد `js/` كامل (بما فيه `js/data/fallback-questions.json`).
- اختياري: `tools/preview.html` (أداة معاينة الرسومات).
- غير مطلوب للنشر (أدوات تطوير فقط): `dev-server.mjs`، `package.json`، `tools/*.mjs`، `README.md`.

**أمثلة سريعة:**
- **GitHub Pages:** ارفع الملفات إلى المستودع ثم Settings → Pages → Deploy from branch → root.
  كل المسارات نسبية لذا يعمل داخل مجلد فرعي مثل `https://user.github.io/3LM-RPG/`.
- **Netlify / Cloudflare Pages / Vercel:** اسحب المجلد وأفلته (بلا أمر بناء — مجلد النشر هو الجذر).
- **استضافة تقليدية (FTP/cPanel):** انسخ الملفات إلى `public_html`.

**شرطان أساسيان:**
1. أن يبقى الجدول مشتركًا كـ «أي شخص لديه الرابط: عارض» — الوصول مسموح من أي نطاق
   (تم اختباره من GitHub Pages وNetlify وعنوان شبكة محلية).
2. يُقدَّم الموقع عبر HTTP/HTTPS — لا يعمل بفتح `index.html` مباشرةً من القرص، لأن المتصفح
   يمنع وحدات ES و`fetch` في وضع `file://`.

**ملاحظات:** إذا تعذّر الوصول إلى الجدول لحظة التشغيل تُستخدم النسخة المحفوظة تلقائيًا،
والخطوط تُحمَّل من Google Fonts ومع انقطاعها تُستخدم خطوط النظام العربية.

---

## ملاحظات تقنية — Technical notes

- **بلا بناء وبلا مكتبات:** وحدات ES فقط. لا خطوة تجميع ولا تبعيات.
- **الأداء:** كل رمز يُخبَز مرة واحدة إلى لوحة مستقلة، وكل غرفة تُرسم مرة واحدة وتُخزَّن
  في الذاكرة، والإطار عبارة عن `drawImage` فقط. الحلقة واحدة (`requestAnimationFrame`)
  وتتوقف عن العمل عندما يكون التبويب مخفيًا (سلوك المتصفح الطبيعي).
- **اللغة:** كل النصوص في طبقات HTML وليست مرسومة على اللوحة، لضمان تشكيل عربي سليم.
- الخط المستخدم: `Handjet` (بكسل عربي) للنصوص العريضة و`Noto Kufi Arabic` للنصوص الطويلة،
  مع خطوط نظام بديلة عند انقطاع الإنترنت.
- **حفظ التقدم:** لا يوجد حفظ بين الجلسات (كل تحميل = رحلة جديدة عشوائية) — عدا إعداد كتم
  الصوت. يمكن إضافة حفظ لاحقًا بسهولة عبر `localStorage` و`state.world.seed`.

---

## English quick start

An Arabic-only, portrait-first Islamic quiz RPG in pixel-art style. Explore five randomly
generated zones, answer questions from a live Google Sheet (column 1 = question, 2 =
correct answer, 3–5 = wrong answers), collect keys, and open the gates up to the final
Library door. No combat.

Run with `npm start` (or `node dev-server.mjs`) and open `http://localhost:8080`.
The game is fully static — deploy the folder as-is to GitHub Pages, Netlify, or any
static host (no build step). Only `index.html`, `styles.css` and `js/` are needed;
`dev-server.mjs`, `tools/*.mjs` and `package.json` are dev-only helpers.

- All tunables (sheet id/gid, hearts, scoring, gate fractions, Arabic strings, zone
  palettes) live in `js/config.js`.
- The sheet must be shared as *Anyone with the link → Viewer*. A bundled offline copy is
  used when the network is unavailable; refresh it with `npm run sheet`.
- Row 1 of the sheet is treated as a template/header row and skipped; set
  `SHEET.headerRows = 0` to start reading from the very first row. Incomplete rows are
  skipped safely.
- Sprites are pre-baked to canvases at boot; rooms are painted once and cached; rendering
  is a single `requestAnimationFrame` loop of `drawImage` calls — very light on phones.
- Sprite QA tool: `/tools/preview.html`.
- World generator checker (no browser needed): `node tools/check-world.mjs 40` — verifies
  connectivity, room content, prop clearance from doors/spawn, door pairing and gate
  progression across many random seeds.
