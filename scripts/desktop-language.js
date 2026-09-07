const desktopLanguage = (() => {
    const arabic = {
        'Applications': 'التطبيقات',
        'APPLICATIONS': 'التطبيقات',
        'Email Majed': 'راسل ماجد',
        'Desktop settings': 'إعدادات سطح المكتب',
        'Portfolio desktop': 'سطح مكتب الأعمال',
        'MAJED ALTAEMI / INDEPENDENT GAME DEVELOPER': 'ماجد الطعيمي / مطوّر ألعاب مستقل',
        'Games. Experiments. Other worlds.': 'ألعاب. تجارب. عوالم أخرى.',
        'Date and time': 'التاريخ والوقت',
        'MAJED ALTAEMI': 'ماجد الطعيمي',
        'Majed Altaemi': 'ماجد الطعيمي',
        'GAME DEVELOPER': 'مطوّر ألعاب',
        'Desktop applications': 'تطبيقات سطح المكتب',
        'MAKE ARABIA GREAT AGAIN': 'من المملكه العربيه السعوديه',
        'VOIDWAVE / PERSONAL DESKTOP': 'VOIDWAVE / سطح المكتب الشخصي',
        'Search applications': 'ابحث عن تطبيق',
        'No applications found.': 'لم يتم العثور على تطبيقات.',
        'Favorite and running applications': 'التطبيقات المفضلة والمفتوحة',
        'Portfolio': 'أعمالي',
        'Games & selected work': 'ألعاب وأعمال مختارة',
        'Hydrogen trailer': 'العرض الترويجي للعبة Hydrogen',
        'Djinn Scrolls trailer': 'العرض الترويجي للعبة Djinn Scrolls',
        'Experiments': 'تجارب',
        'Playable demos & projects': 'نماذج ومشاريع قابلة للتجربة',
        'Dev Videos': 'فيديوهات التطوير',
        'Development playlist': 'قائمة فيديوهات التطوير',
        'Gallery': 'معرض الصور',
        'Art & screenshots': 'رسومات ولقطات شاشة',
        'Terminal': 'الطرفية',
        'About Me': 'نبذة عني',
        'Settings': 'الإعدادات',
        'Desktop appearance': 'مظهر سطح المكتب',
        'Project Archive': 'أرشيف المشاريع',
        'All videos & demo projects': 'جميع الفيديوهات والمشاريع التجريبية',
        'Twitter / X (opens in a new tab)': 'Twitter / X (يفتح في علامة تبويب جديدة)',
        'Twitter / X (new tab)': 'Twitter / X (علامة تبويب جديدة)',
        'Instagram (opens in a new tab)': 'Instagram (يفتح في علامة تبويب جديدة)',
        'Instagram (new tab)': 'Instagram (علامة تبويب جديدة)',
        'Show desktop': 'إظهار سطح المكتب',
        'Desktop': 'سطح المكتب',
        'Restore window': 'استعادة النافذة',
        'Maximize window': 'تكبير النافذة',
        'Minimize window': 'تصغير النافذة',
        'Close window': 'إغلاق النافذة',
        'Back': 'رجوع',
        'Portfolio folders': 'مجلدات الأعمال',
        'PLACES': 'المجلدات',
        'Home': 'الرئيسية',
        'Games': 'الألعاب',
        'PERSONAL': 'شخصي',
        'About me': 'نبذة عني',
        'Get in touch': 'تواصل معي',
        'personal workspace': 'مساحة العمل الشخصية',
        'THE WORKSPACE OF': 'مساحة عمل',
        "Independent game developer. Making games and exploring what's possible.": 'مطوّر ألعاب مستقل. أصنع الألعاب وأستكشف ما يمكن تحقيقه.',
        'Selected games': 'ألعاب مختارة',
        '02 ITEMS': 'لعبتان',
        'Hydrogen game main menu': 'القائمة الرئيسية للعبة Hydrogen',
        'Game / PC': 'لعبة / PC',
        'Beyond the games': 'ما وراء الألعاب',
        'EXPLORE': 'استكشف',
        'Demos & side projects': 'نماذج ومشاريع جانبية',
        'Behind the builds': 'خلف كواليس التطوير',
        'All videos & demos': 'جميع الفيديوهات والنماذج',
        'Games, experiments & other worlds': 'ألعاب وتجارب وعوالم أخرى',
        'portfolio': 'أعمالي',
        'THE PERSON BEHIND VOIDWAVE': 'الشخص وراء VOIDWAVE',
        "Hi, I'm Majed": 'هلا، أنا ماجد',
        "I'm an independent game developer. This is my corner of the internet: games, playable experiments, and the things I make along the way.": 'أنا مطوّر ألعاب مستقل. هذه مساحتي على الإنترنت: ألعاب، وتجارب تفاعلية، وأشياء أصنعها خلال رحلتي.',
        'NAME': 'الاسم',
        'FOCUS': 'التخصص',
        'Game development': 'تطوير الألعاب',
        'PERSONALIZE YOUR WORKSPACE': 'خصّص مساحة عملك',
        'Appearance': 'المظهر',
        'Wallpaper': 'خلفية سطح المكتب',
        'Dither Waves': 'أمواج منقّطة',
        'Otherworld': 'عالم آخر',
        'Graphite': 'جرافيت',
        'Accent color': 'اللون المميز',
        'Mint': 'نعناعي',
        'Ice': 'جليدي',
        'Window animations': 'حركات النوافذ',
        'Terminal output': 'مخرجات الطرفية',
        'Terminal command': 'أمر الطرفية',
        'Run command': 'تنفيذ الأمر',
        'Open in a new tab': 'فتح في علامة تبويب جديدة',
        'Open in browser': 'فتح في المتصفح'
    };
    const textSources = new WeakMap();
    const attributeSources = new WeakMap();
    let language = 'en';

    function text(source) {
        const key = source.replace(/\s+/g, ' ');
        return language === 'ar' && Object.hasOwn(arabic, key) ? arabic[key] : source;
    }

    function translatedValue(value, previous) {
        const source = previous && value === previous.rendered ? previous.source : value;
        const trimmed = source.trim();
        const rendered = source.replace(trimmed, text(trimmed));
        return { source, rendered };
    }

    function localize(root) {
        const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
        while (walker.nextNode()) {
            const node = walker.currentNode;
            if (!node.textContent.trim() || node.parentElement.closest('script, style, option, kbd, .terminal-content, .file-path, [translate="no"]')) continue;
            const entry = translatedValue(node.textContent, textSources.get(node));
            textSources.set(node, entry);
            if (node.textContent !== entry.rendered) node.textContent = entry.rendered;
        }
        for (const element of [root, ...root.querySelectorAll('[title], [aria-label], [placeholder], [alt]')]) {
            const sources = attributeSources.get(element) || new Map();
            for (const attribute of ['title', 'aria-label', 'placeholder', 'alt']) {
                if (!element.hasAttribute(attribute)) continue;
                const entry = translatedValue(element.getAttribute(attribute), sources.get(attribute));
                sources.set(attribute, entry);
                element.setAttribute(attribute, entry.rendered);
            }
            attributeSources.set(element, sources);
        }
    }

    function setLanguage(value) {
        language = value === 'ar' ? 'ar' : 'en';
        document.documentElement.lang = language;
        document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    }

    return { text, localize, setLanguage };
})();