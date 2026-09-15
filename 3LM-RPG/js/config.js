// ============================================================================
//  رحلة المعرفة — ملف الإعدادات المركزي
//  Journey of Knowledge — central configuration file
//
//  كل ما تحتاج تعديله موجود هنا: رابط جدول الأسئلة، عدد القلوب، ألوان المناطق،
//  النصوص العربية… لن تحتاج لفتح أي ملف آخر لتغيير سلوك اللعبة.
//  Everything tunable lives here: sheet URL, hearts, zone palettes, all Arabic
//  texts. You should never need to open another file to change game behavior.
// ============================================================================

// ---------------------------------------------------------------------------
// 1) بيانات الأسئلة — Questions source
// ---------------------------------------------------------------------------
export const SHEET = {
    // معرّف جدول جوجل (من الرابط) — Google Sheet id (from the URL)
    id: '1RbFoFsH88aNgjkqhyYl-HmoAJSf52uTfz021VXStKXc',
    // رقم الصفحة — tab id (gid=0 in the URL)
    gid: '0',
    // عنوان الأسئلة اليومي المستخدم عند تعذّر الاتصال بالإنترنت
    // Local fallback used when the sheet can't be reached (offline copy)
    // عدد الصفوف العلوية التي تُتجاهل (صف القالب/العنوان في الجدول).
    // اجعلها 0 إذا كان السؤال الحقيقي الأول في الصف الأول مباشرة.
    // Number of top rows to skip (template/header row). Set 0 to read from row 1.
    headerRows: 1,
    fallbackUrl: './js/data/fallback-questions.json',
    // مهلة الاتصال وإعادة المحاولة — network timeout / retries
    timeoutMs: 12000,
    retries: 1,
    // أقصى عدد أسئلة في الرحلة الواحدة. ضع 'all' لاستخدام كل الأسئلة دائمًا.
    // Max questions per run. Set to 'all' to always use every row.
    maxPerRun: 24,
};

// ---------------------------------------------------------------------------
// 2) قواعد اللعب — Gameplay rules
// ---------------------------------------------------------------------------
export const RULES = {
    hearts: 3,               // عدد القلوب — starting hearts
    playerSpeed: 62,         // سرعة الحركة (بكسل/ثانية) — px per second
    doorTransitionMs: 260,   // مدة الانتقال بين الغرف — room slide duration
    // النقاط حسب رقم المحاولة (الأولى، الثانية، الثالثة فما فوق)
    // Score by attempt number: first try, second try, third+ try
    scoreByAttempt: [100, 70, 40],
    scoreGem: 150,           // نقاط الكنز — chest points
    chestHeartChance: 0.35,  // احتمال أن يمنح الصندوق قلبًا — chance chest gives +1 heart
    // نسب فتح البوابات الرسمية (تُحسب من عدد الأسئلة) — official gate fractions
    gateFractions: [0.2, 0.4, 0.6, 0.8], // gates 1..4 ; final gate needs ALL keys
};

// ---------------------------------------------------------------------------
// 3) العرض — View
// ---------------------------------------------------------------------------
export const VIEW = {
    width: 176,        // عرض اللوحة المنطقي — logical canvas width  (11 × 16px tiles)
    height: 240,       // ارتفاع اللوحة المنطقي — logical canvas height (15 × 16px tiles)
    wall: 8,           // سماكة الجدار — wall thickness in px
    tile: 16,          // مقاس البلاطة — tile size
    maxPixelScale: 6,  // أقصى تكبير للبكسل — biggest allowed integer zoom
    minPixelScale: 1,
};

// ---------------------------------------------------------------------------
// 4) المناطق الخمس — The five themed zones (+ hidden library)
//    كل منطقة: لوحة ألوان + عناصر زينة — palette + prop weights per zone
// ---------------------------------------------------------------------------
export const ZONES = [
    {
        id: 'desert', name: 'الصحراء', enterText: 'بدأت رحلتك في الصحراء…',
        pal: {
            floor: '#d8b36a', floorDark: '#cfa85e', floorLight: '#e0bd74', speck: '#b8944e',
            wall: '#a97f45', wallTop: '#e0bd7a', wallShade: '#8a6534', door: '#6f5230'
        },
        props: [['rock1', 3], ['rock2', 2], ['shrubDry', 3], ['stones', 2]],
    },
    {
        id: 'oasis', name: 'الواحة', enterText: 'وصلت إلى الواحة الخضراء…',
        pal: {
            floor: '#58a85c', floorDark: '#519f55', floorLight: '#61af65', speck: '#3f7f44',
            wall: '#7a5a36', wallTop: '#c8a06a', wallShade: '#5f4527', door: '#5f4527'
        },
        props: [['palmTall', 2], ['palm', 2], ['bush', 3], ['reeds', 2], ['flowers', 3], ['pool', 1]],
    },
    {
        id: 'town', name: 'البلدة القديمة', enterText: 'دخلت البلدة القديمة…',
        pal: {
            floor: '#b39075', floorDark: '#a57f63', floorLight: '#bb987d', speck: '#8a6a52',
            wall: '#9c6b4a', wallTop: '#d9a878', wallShade: '#7a5136', door: '#5e3d28'
        },
        props: [['crate', 3], ['pot', 3], ['barrel', 2], ['sack', 2], ['stall', 2], ['lampPost', 2]],
    },
    {
        id: 'gardens', name: 'حدائق المسجد', enterText: 'تتفتح أمامك حدائق المسجد…',
        pal: {
            floor: '#c9d1bd', floorDark: '#bcc5ae', floorLight: '#d7decb', speck: '#a9b39a',
            wall: '#a8967a', wallTop: '#d9c9a8', wallShade: '#8a7a5e', door: '#7a6a4e'
        },
        props: [['fountain', 2], ['flowerBed', 3], ['oliveTree', 2], ['bench', 2], ['lampPost', 2]],
    },
    {
        id: 'night', name: 'ساحة الليل', enterText: 'بلغت ساحة الليل…',
        pal: {
            floor: '#2c3152', floorDark: '#262b48', floorLight: '#343a60', speck: '#20253e',
            wall: '#3b4268', wallTop: '#5a639a', wallShade: '#2b3050', door: '#1f2440', night: true
        },
        props: [['brazier', 3], ['lampPost', 3], ['medallion', 2], ['oliveTree', 2], ['stones', 2]],
    },
];

// غرفة النصر النهائية — the hidden victory room (past the great gate)
export const LIBRARY = {
    id: 'library', name: 'المكتبة',
    pal: {
        floor: '#d9c48a', floorDark: '#ccb677', floorLight: '#e6d29a', speck: '#b8a266',
        wall: '#8a6f42', wallTop: '#e0c078', wallShade: '#6b5430', door: '#5e4a28'
    },
    props: [['fountain', 3], ['brazier', 2], ['flowerBed', 3], ['medallion', 2], ['pedestal', 1]],
};

// ---------------------------------------------------------------------------
// 5) النصوص العربية — All Arabic texts (RTL)
// ---------------------------------------------------------------------------
export const TEXT = {
    appTitle: 'رحلة المعرفة',
    appSubtitle: 'اجمع مفاتيح العلم لتفتح باب المكتبة',
    loading: 'جارٍ تحميل الأسئلة…',
    loadingHint: 'يمكنك ترك أي سؤال بزر «لاحقًا» والعودة إليه في أي وقت',
    loadError: 'تعذّر تحميل الأسئلة',
    loadErrorHint: 'تأكد من اتصالك بالإنترنت، ثم أعد المحاولة',
    retry: 'إعادة المحاولة',
    fallbackNotice: 'تعذّر الاتصال بالإنترنت — استُخدمت نسخة محفوظة من الأسئلة',
    startButton: 'ابدأ الرحلة',
    controlsDesktop: 'الأسهم أو WASD للحركة • E للتحدث',
    controlsMobile: 'المقبض للحركة • الزر الأيمن للتحدث',
    hudKeys: 'مفاتيح',
    hudScore: 'نقاط',
    promptTalk: 'تحدَّث',
    promptOpen: 'افتح',
    promptGate: 'البوابة',
    npcGreetings: [
        'السلام عليكم! إليك سؤالي…',
        'مرحبًا بك أيها الرحّالة! أجب ولتحصل على مفتاح.',
        'أهلًا بك! سؤالي لك اليوم هو…',
        'أحسنت قدومك! خذ هذه المسألة…',
        'بوركت خطاك! إليك سؤالي…',
    ],
    npcCorrect: [
        'أحسنت! خذ المفتاح.',
        'إجابة صحيحة! مفتاح جديد لك.',
        'ما أبدعك! هذا مفتاحك.',
        'إجابة موفّقة! خذ المفتاح.',
    ],
    npcWrong: [
        'لا بأس، فكّر مرة أخرى.',
        'ليست الإجابة الصحيحة، أعد المحاولة.',
        'الإجابة غير صحيحة… تأنَّ قليلًا.',
    ],
    heartLost: 'فقدت قلبًا!',
    faintTitle: 'أُغمي عليك!',
    faintText: 'عدت إلى باب الغرفة… جمعت أنفاسك، فلنحاول من جديد',
    leaveQuiz: 'لاحقًا',
    gateLockedToast: 'الباب مغلق — تحتاج {n} من المفاتيح',
    gateUnlockedToast: 'انفتح باب جديد! تفقّد الخريطة',
    finalGateLocked: 'الباب العظيم — يحتاج {n} مفتاحًا',
    chestOpened: 'وجدت كنزًا!',
    heartFound: 'قلب +1',
    mapTitle: 'الخريطة',
    mapHint: 'اضغط الخريطة للمتابعة',
    rotateDevice: 'أدِر جهازك عموديًا للّعب',
    victoryTitle: 'فتحت باب المكتبة!',
    victoryText: 'أتممت رحلة المعرفة وأجبت عن كل الأسئلة. أحسنت!',
    statScore: 'النقاط',
    statKeys: 'المفاتيح',
    statMistakes: 'الأخطاء',
    statAccuracy: 'الدقة',
    statTime: 'الوقت',
    newJourney: 'رحلة جديدة',
    rankHigh: 'عالِم صغير',
    rankMid: 'طالب علم نجيب',
    rankLow: 'طالب علم مجتهد',
    thanksAgain: 'شكرًا لك! أكملت سؤالي.',
    allAnswered: 'أجبت عن جميع الأسئلة! توجه إلى الباب العظيم',
};

// ---------------------------------------------------------------------------
// 6) أدوات مساعدة — helpers
// ---------------------------------------------------------------------------
export function text(key, vars) {
    let s = TEXT[key] ?? key;
    if (vars) for (const k of Object.keys(vars)) s = s.replaceAll(`{${k}}`, String(vars[k]));
    return s;
}

/** رابط CSV المباشر لجدول الأسئلة — direct CSV endpoint of the question sheet */
export function sheetCsvUrl() {
    return `https://docs.google.com/spreadsheets/d/${SHEET.id}/gviz/tq?tqx=out:csv&gid=${SHEET.gid}`;
}
