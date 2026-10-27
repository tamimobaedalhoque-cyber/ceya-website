/* Ceya website, the reel. One record per film; project.html?p=<slug> renders it.
   Clients, credits and numbers are placeholders until the studio supplies the real ones.
   motif: indices into the sonic logo's eight notes (0 = Sun ring, 7 = Mint core), null is a rest. */
window.CeyaReel = [
  {
    slug: "mapping-the-idea", title: "Mapping the idea", format: "Series", year: 2026, client: "Northlight", runtime: "6 × 12 min",
    a: "#F7B32B", b: "#FC864F", pat: { type: "terrain", n: 12, v: 0.5, mode: "mono", color: "rgba(255,255,255,.38)", w: 2.4, seed: 21 },
    logline: "A six-part series that follows one idea from a napkin sketch to a building people queue to enter.",
    layers: [
      "Northlight wanted to show how their architects think, not just what they build. We framed every episode around a single question the team had to answer that week.",
      "No narrator. The architects tell it themselves, and the drawings carry the plot: every episode opens on a blank sheet and closes on the same sheet, full.",
      "We shot on long lenses through glass and models, so the city always sits behind the thinking. Contour maps from the site became the series' title graphics.",
      "A score built from pencil on paper, recorded close, then pitched into the logo's key. It grows one instrument per episode until the building opens.",
    ],
    stills: [{ type: "terrain", n: 14, v: 0.6, seed: 4 }, { type: "ridge", n: 10, v: 0.5, seed: 9 }, { type: "terrain", n: 9, v: 0.3, seed: 33 }, { type: "arcs", n: 3, w: 12 }, { type: "terrain", n: 16, v: 0.8, seed: 2 }],
    motif: [0, 2, 4, null, 3, 5, 7],
    results: [["2.4M", "views across the series"], ["6", "episodes, one question each"], ["31%", "more site visits in launch week"]],
    credits: [["Director", "Lina Haddad"], ["Producer", "Omar Saleh"], ["Cinematography", "Rami Nasser"], ["Edit", "Dana Youssef"], ["Score", "Ceya Sound"], ["Grade", "Ceya Colour"]],
  },
  {
    slug: "sound-of-the-cut", title: "Sound of the cut", format: "Podcast", year: 2025, client: "Saltwater Records", runtime: "12 episodes",
    a: "#FF6F61", b: "#D7927B", pat: { type: "wave", n: 48, v: 0.7, mode: "mono", color: "rgba(255,255,255,.42)", seed: 5 },
    logline: "Twelve editors take apart the one cut that changed how they work, and rebuild it in front of us.",
    layers: [
      "Saltwater Records asked for a show about music. We pitched one about rhythm instead: how editors hear a film before anyone sees it.",
      "Each episode is one cut, played three ways: as released, as first assembled, and as the editor wishes it had been.",
      "Video episodes shot in a single room with one lamp and two chairs. The waveform of each episode became its cover art.",
      "Mixed for headphones first. Every guest's cut is reconstructed from stems, so the listener hears the change land.",
    ],
    stills: [{ type: "wave", n: 40, v: 0.9, seed: 12 }, { type: "wave", n: 18, v: 0.4, seed: 3 }, { type: "halftone", n: 18, v: 0.6 }, { type: "wave", n: 60, v: 0.6, seed: 8 }, { type: "radial", n: 70, v: 0.5 }],
    motif: [7, 5, 7, 4, null, 3, 1, 0],
    results: [["640K", "listens in the first season"], ["Top 10", "in arts podcasts, two countries"], ["12", "editors, twelve rebuilt cuts"]],
    credits: [["Host", "Yara Mansour"], ["Producer", "Karim Aziz"], ["Sound design", "Ceya Sound"], ["Mix", "Hadi Fares"], ["Artwork", "Ceya Studio"], ["Video", "Rana Khalil"]],
  },
  {
    slug: "night-shoot", title: "Night shoot", format: "Documentary", year: 2025, client: "Halo Pictures", runtime: "72 min",
    a: "#2F6B72", b: "#88D8B0", pat: { type: "ridge", n: 14, v: 0.6, mode: "mono", color: "rgba(255,255,255,.4)", seed: 8, bg: "transparent" },
    logline: "One night, one desert highway, and the crews who keep a city's lights on while it sleeps.",
    layers: [
      "Halo Pictures came with access and no angle. We found it in a timesheet: every shift in the film starts at sunset and ends at first light.",
      "Told in real time across one night, cut between four crews who never meet. The film ends when the last one goes home.",
      "Shot almost entirely by available light: sodium lamps, headlights, phone screens. We graded the shadows toward Deep Teal so the night keeps its colour.",
      "Field recordings only, from dusk to dawn, then a single theme that arrives at five in the morning with the first light.",
    ],
    stills: [{ type: "ridge", n: 18, v: 0.7, seed: 2 }, { type: "ridge", n: 8, v: 0.4, seed: 14 }, { type: "halftone", n: 26, v: 0.4 }, { type: "ridge", n: 22, v: 0.9, seed: 6 }, { type: "terrain", n: 10, v: 0.4, seed: 7 }],
    motif: [3, null, 4, 3, null, 1, 0, null, 7],
    results: [["6", "festival selections"], ["Best", "cinematography, regional awards"], ["72 min", "shot across eleven nights"]],
    credits: [["Director", "Sami Rahal"], ["Producer", "Halo Pictures"], ["Cinematography", "Nour Bitar"], ["Edit", "Ceya Edit"], ["Sound", "Ceya Sound"], ["Grade", "Ceya Colour"]],
  },
  {
    slug: "desert-light", title: "Desert light", format: "Commercial", year: 2026, client: "Duneline", runtime: "45 sec",
    a: "#FA9C3D", b: "#F7B32B", pat: { type: "halftone", n: 22, v: 0.5, mode: "mono", color: "rgba(255,255,255,.42)" },
    logline: "Forty-five seconds of one day in the dunes, from the first warm light to the last.",
    layers: [
      "Duneline sells glass that changes with the sun. Our idea was to never show the product, only what the light does through it.",
      "One location, one family, one day compressed into forty-five seconds. The story is the shadow moving across a table.",
      "A motion-control rig repeated the same move every hour, so the day could be cut as one continuous shot.",
      "Wind, sand and a single warm chord that opens a little wider every time the light changes.",
    ],
    stills: [{ type: "halftone", n: 28, v: 0.7 }, { type: "arcs", n: 5, w: 10 }, { type: "halftone", n: 14, v: 0.3 }, { type: "terrain", n: 8, v: 0.3, seed: 18 }, { type: "halftone", n: 34, v: 0.9 }],
    motif: [0, 1, 2, 3, 4],
    results: [["18M", "impressions in four weeks"], ["2.1×", "recall against the category"], ["1", "shot, twelve hours long"]],
    credits: [["Director", "Lina Haddad"], ["Agency", "Duneline in house"], ["Cinematography", "Rami Nasser"], ["Motion control", "Tariq Amin"], ["Music", "Ceya Sound"], ["Grade", "Ceya Colour"]],
  },
  {
    slug: "open-studio", title: "Open Studio", format: "Brand film", year: 2026, client: "Aster Hotels", runtime: "2 min 48",
    a: "#B0B596", b: "#2F6B72", pat: { type: "arcs", n: 4, mode: "mono", color: "rgba(255,255,255,.38)", w: 14 },
    logline: "A hotel that opens its kitchen, its workshops and its roof to the city, filmed on the day it did.",
    layers: [
      "Aster Hotels was opening its back of house to the public for one day. We proposed filming that day as it happened, with no second takes.",
      "Structured as a walk through the building, top to bottom, following whoever happened to be holding the key.",
      "Three handheld units connected by radio, cut live on location. The arches of the building became the film's frame.",
      "The hotel recorded as an instrument: doors, lifts, pans and voices tuned into one rising loop.",
    ],
    stills: [{ type: "arcs", n: 6, w: 8 }, { type: "tile", n: 8 }, { type: "arcs", n: 3, w: 18 }, { type: "play", n: 5, v: 0.5, seed: 3, w: 20 }, { type: "arcs", n: 9, w: 6 }],
    motif: [4, 4, 6, null, 5, 3, 4],
    results: [["11K", "visitors on the open day"], ["3", "units cut live, no reshoots"], ["4.6M", "views of the film"]],
    credits: [["Director", "Maya Darwish"], ["Producer", "Omar Saleh"], ["Camera", "Ceya Crew"], ["Live edit", "Dana Youssef"], ["Sound", "Ceya Sound"], ["Grade", "Ceya Colour"]],
  },
  {
    slug: "tide", title: "Tide", format: "Music video", year: 2025, client: "Kitefield", runtime: "3 min 51",
    a: "#D7927B", b: "#FF6F61", pat: { type: "play", n: 6, v: 0.6, mode: "mono", color: "rgba(255,255,255,.42)", seed: 4, w: 24 },
    logline: "A song about leaving, filmed on a beach where the sea comes in a little further every verse.",
    layers: [
      "Kitefield's song is about a slow goodbye. We wanted the location to do the leaving, so we chose a beach with a fast tide.",
      "One performance, filmed in four passes as the water rose. Each verse is a pass; the chorus is cut from all four.",
      "Shot from a fixed frame as the sea took the set. We built the colour from Clay toward Rose as the light dropped.",
      "We remixed the stems against recorded surf, so the waves fall on the beat of the last chorus.",
    ],
    stills: [{ type: "wave", n: 30, v: 0.5, seed: 21 }, { type: "play", n: 8, v: 0.5, seed: 1, w: 18 }, { type: "wave", n: 14, v: 0.9, seed: 6 }, { type: "ridge", n: 12, v: 0.3, seed: 11 }, { type: "wave", n: 50, v: 0.3, seed: 2 }],
    motif: [5, 4, 3, null, 2, 3, 1, 0],
    results: [["9.8M", "plays in the first month"], ["4", "passes as the sea rose"], ["1", "set, taken by the tide"]],
    credits: [["Artist", "Kitefield"], ["Director", "Sami Rahal"], ["Producer", "Karim Aziz"], ["Cinematography", "Nour Bitar"], ["Edit", "Ceya Edit"], ["Grade", "Ceya Colour"]],
  },
];

/* Arabic, read by the /ar/ pages. Client names stay in Latin script, as brands do in the Gulf. */
(() => {
  const AR = {
    "mapping-the-idea": {
      title: "رسم الفكرة", format: "سلسلة", runtime: "6 حلقات × 12 دقيقة",
      logline: "سلسلة من ستة أجزاء تتبع فكرة واحدة، من رسمة على منديل إلى مبنى يصطف الناس لدخوله.",
      layers: [
        "أرادت Northlight أن تُظهر كيف يفكر معماريوها، لا ما يبنونه فقط. فبنينا كل حلقة حول سؤال واحد على الفريق أن يجيب عنه في ذلك الأسبوع.",
        "بلا راوٍ. المعماريون يروون القصة بأنفسهم، والرسومات تحمل الحبكة: كل حلقة تبدأ بورقة بيضاء وتنتهي بالورقة نفسها ممتلئة.",
        "صوّرنا بعدسات طويلة عبر الزجاج والمجسّمات، لتبقى المدينة دائمًا خلف التفكير. وأصبحت الخرائط الكنتورية للموقع رسومات عناوين السلسلة.",
        "موسيقى مبنية من صوت القلم على الورق، مسجّلة عن قرب ثم مضبوطة على مقام الشعار. تكبر بآلة جديدة في كل حلقة حتى يُفتتح المبنى.",
      ],
      results: [["2.4 مليون", "مشاهدة عبر السلسلة"], ["6", "حلقات، لكل حلقة سؤال واحد"], ["31%", "زيادة في زيارات الموقع في أسبوع الإطلاق"]],
      credits: [["الإخراج", "لينا حداد"], ["الإنتاج", "عمر صالح"], ["التصوير السينمائي", "رامي ناصر"], ["المونتاج", "دانة يوسف"], ["الموسيقى", "Ceya Sound"], ["التلوين", "Ceya Colour"]],
    },
    "sound-of-the-cut": {
      title: "صوت القطع", format: "بودكاست", runtime: "12 حلقة",
      logline: "اثنا عشر مونتيرًا يفككون القطع الذي غيّر طريقة عملهم، ويعيدون بناءه أمامنا.",
      layers: [
        "طلبت Saltwater Records برنامجًا عن الموسيقى، فاقترحنا برنامجًا عن الإيقاع: كيف يسمع المونتير الفيلم قبل أن يراه أحد.",
        "كل حلقة عن قطع واحد يُعرض بثلاث طرق: كما صدر، وكما جُمع أول مرة، وكما تمنى المونتير لو كان.",
        "حلقات فيديو صُوّرت في غرفة واحدة بمصباح واحد وكرسيين. وأصبحت الموجة الصوتية لكل حلقة غلافها.",
        "مكساج للسماعات أولًا. يُعاد بناء قطع كل ضيف من مساراته الأصلية، ليسمع المستمع لحظة التغيير.",
      ],
      results: [["640 ألف", "استماع في الموسم الأول"], ["أفضل 10", "في بودكاست الفنون في بلدين"], ["12", "مونتيرًا، و12 قطعًا أُعيد بناؤه"]],
      credits: [["التقديم", "يارا منصور"], ["الإنتاج", "كريم عزيز"], ["التصميم الصوتي", "Ceya Sound"], ["المكساج", "هادي فارس"], ["التصميم الفني", "Ceya Studio"], ["الفيديو", "رنا خليل"]],
    },
    "night-shoot": {
      title: "تصوير ليلي", format: "وثائقي", runtime: "72 دقيقة",
      logline: "ليلة واحدة، وطريق صحراوي واحد، والفرق التي تُبقي أضواء المدينة مضاءة وهي نائمة.",
      layers: [
        "جاءت Halo Pictures بإمكانية الوصول ومن دون زاوية. وجدناها في كشف الدوام: كل وردية في الفيلم تبدأ مع الغروب وتنتهي مع أول ضوء.",
        "يُروى في الزمن الحقيقي عبر ليلة واحدة، متنقلًا بين أربع فرق لا تلتقي أبدًا. وينتهي الفيلم حين يعود آخرها إلى البيت.",
        "صُوّر كله تقريبًا بالضوء المتاح: مصابيح الصوديوم والمصابيح الأمامية وشاشات الهواتف. ولوّنّا الظلال نحو الأزرق المخضر العميق ليحتفظ الليل بلونه.",
        "تسجيلات ميدانية فقط من الغسق حتى الفجر، ثم لحن واحد يصل في الخامسة صباحًا مع أول ضوء.",
      ],
      results: [["6", "اختيارات رسمية في مهرجانات"], ["الأفضل", "في التصوير السينمائي، جوائز إقليمية"], ["72 دقيقة", "صُوّرت عبر إحدى عشرة ليلة"]],
      credits: [["الإخراج", "سامي رحّال"], ["الإنتاج", "Halo Pictures"], ["التصوير السينمائي", "نور البيطار"], ["المونتاج", "Ceya Edit"], ["الصوت", "Ceya Sound"], ["التلوين", "Ceya Colour"]],
    },
    "desert-light": {
      title: "ضوء الصحراء", format: "إعلان", runtime: "45 ثانية",
      logline: "خمس وأربعون ثانية من يوم واحد في الكثبان، من أول ضوء دافئ إلى آخره.",
      layers: [
        "تبيع Duneline زجاجًا يتغير مع الشمس. وكانت فكرتنا ألا نُظهر المنتج أبدًا، بل ما يفعله الضوء عبره فقط.",
        "موقع واحد، وعائلة واحدة، ويوم كامل مختصر في خمس وأربعين ثانية. القصة ظلٌّ يتحرك عبر طاولة.",
        "كرّرت رافعة التحكم بالحركة الحركة نفسها كل ساعة، ليُقطع اليوم كأنه لقطة واحدة متصلة.",
        "ريح ورمل وتآلف دافئ واحد ينفتح قليلًا مع كل تغيّر في الضوء.",
      ],
      results: [["18 مليون", "ظهور في أربعة أسابيع"], ["2.1×", "في التذكّر مقارنة بالفئة"], ["1", "لقطة واحدة، طولها اثنتا عشرة ساعة"]],
      credits: [["الإخراج", "لينا حداد"], ["الوكالة", "فريق Duneline الداخلي"], ["التصوير السينمائي", "رامي ناصر"], ["التحكم بالحركة", "طارق أمين"], ["الموسيقى", "Ceya Sound"], ["التلوين", "Ceya Colour"]],
    },
    "open-studio": {
      title: "الاستوديو المفتوح", format: "فيلم علامة تجارية", runtime: "دقيقتان و48 ثانية",
      logline: "فندق يفتح مطبخه وورشه وسطحه للمدينة، صوّرناه في اليوم الذي فعل فيه ذلك.",
      layers: [
        "كانت Aster Hotels تفتح كواليسها للجمهور ليوم واحد. فاقترحنا تصوير ذلك اليوم كما يحدث، من دون إعادة أي لقطة.",
        "مبني كجولة في المبنى من الأعلى إلى الأسفل، تتبع من يحمل المفتاح في تلك اللحظة.",
        "ثلاث وحدات تصوير محمولة متصلة باللاسلكي، تُقطع مباشرة في الموقع. وأصبحت أقواس المبنى إطار الفيلم.",
        "سُجّل الفندق كآلة موسيقية: الأبواب والمصاعد والقدور والأصوات مضبوطة في حلقة واحدة متصاعدة.",
      ],
      results: [["11 ألف", "زائر في اليوم المفتوح"], ["3", "وحدات قُطعت مباشرة، بلا إعادة تصوير"], ["4.6 مليون", "مشاهدة للفيلم"]],
      credits: [["الإخراج", "مايا درويش"], ["الإنتاج", "عمر صالح"], ["الكاميرا", "Ceya Crew"], ["المونتاج المباشر", "دانة يوسف"], ["الصوت", "Ceya Sound"], ["التلوين", "Ceya Colour"]],
    },
    "tide": {
      title: "المدّ", format: "فيديو موسيقي", runtime: "3 دقائق و51 ثانية",
      logline: "أغنية عن الرحيل، صُوّرت على شاطئ يتقدم إليه البحر قليلًا مع كل مقطع.",
      layers: [
        "أغنية Kitefield عن وداع بطيء. أردنا أن يكون المكان هو من يرحل، فاخترنا شاطئًا يرتفع فيه المد بسرعة.",
        "أداء واحد صُوّر أربع مرات مع ارتفاع الماء. كل مقطع مرة، واللازمة مقطوعة من المرات الأربع.",
        "صُوّر من إطار ثابت بينما أخذ البحر الديكور. وبنينا الألوان من لون الطين نحو الوردي مع انخفاض الضوء.",
        "أعدنا مزج المسارات مع صوت أمواج مسجّل، لتسقط الأمواج على إيقاع اللازمة الأخيرة.",
      ],
      results: [["9.8 مليون", "تشغيل في الشهر الأول"], ["4", "مرات مع ارتفاع البحر"], ["1", "ديكور واحد، أخذه المد"]],
      credits: [["الفنان", "Kitefield"], ["الإخراج", "سامي رحّال"], ["الإنتاج", "كريم عزيز"], ["التصوير السينمائي", "نور البيطار"], ["المونتاج", "Ceya Edit"], ["التلوين", "Ceya Colour"]],
    },
  };
  window.CeyaReel.forEach(f => { f.ar = AR[f.slug]; });
})();
