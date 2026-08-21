import { Prisma, PrismaClient, ExperienceType } from "@prisma/client";

const prisma = new PrismaClient();

type CompetencySeed = {
    code: string;
    title: string;
    canDo: string;
    domain: string;
    difficulty?: number;
    isCore?: boolean;
    xpReward?: number;
    patterns: string[];
    examples: string[];
    grammarNote?: string;
    pronunciationNote?: string;
    culturalNote?: string;
    vocabulary: Array<{
        word: string;
        translation: string;
        difficulty?: number;
        importance?: number;
    }>;
    prerequisites?: string[];
};

type UnitSeed = {
    title: string;
    description: string;
    competencies: CompetencySeed[];
};

const units: UnitSeed[] = [
    // ============================================================
    // UNIT 1 — SOUND & ORIENTATION
    // ============================================================
    {
        title: "Sound & Orientation",
        description:
            "Build the learner's first contact with Spanish sounds, rhythm, greetings, and basic classroom interaction.",
        competencies: [
            {
                code: "PA1.SND.LST.01",
                title: "Recognize basic Spanish sounds",
                canDo: "Recognize and distinguish common Spanish sounds in familiar words.",
                domain: "SOUND",
                difficulty: 1,
                patterns: ["a, e, i, o, u", "ma, me, mi, mo, mu"],
                examples: ["a", "mesa", "mi", "música"],
                pronunciationNote:
                    "Spanish vowels are short and stable. They generally keep the same sound rather than changing as English vowels often do.",
                vocabulary: [
                    { word: "a", translation: "a", difficulty: 1 },
                    { word: "e", translation: "e", difficulty: 1 },
                    { word: "i", translation: "i", difficulty: 1 },
                    { word: "o", translation: "o", difficulty: 1 },
                    { word: "u", translation: "u", difficulty: 1 },
                ],
            },
            {
                code: "PA1.SND.LST.02",
                title: "Follow simple spoken instructions",
                canDo: "Understand a small set of common instructions used during learning.",
                domain: "SOUND",
                difficulty: 1,
                patterns: ["Escucha.", "Mira.", "Repite.", "Lee."],
                examples: [
                    "Escucha.",
                    "Mira.",
                    "Repite.",
                    "Lee.",
                ],
                vocabulary: [
                    { word: "escucha", translation: "listen", difficulty: 1 },
                    { word: "mira", translation: "look", difficulty: 1 },
                    { word: "repite", translation: "repeat", difficulty: 1 },
                    { word: "lee", translation: "read", difficulty: 1 },
                ],
            },
            {
                code: "PA1.SOC.GRT.01",
                title: "Recognize basic greetings",
                canDo: "Recognize and use very common Spanish greetings.",
                domain: "SOCIAL",
                difficulty: 1,
                patterns: ["Hola.", "Buenos días.", "Buenas tardes.", "Buenas noches."],
                examples: [
                    "Hola.",
                    "Buenos días.",
                    "Buenas tardes.",
                    "Buenas noches.",
                ],
                culturalNote:
                    "Greeting conventions vary by country and context. Hola is broadly useful, while buenos días and buenas tardes are common polite greetings.",
                vocabulary: [
                    { word: "hola", translation: "hello", difficulty: 1, importance: 3 },
                    { word: "buenos días", translation: "good morning", difficulty: 1, importance: 3 },
                    { word: "buenas tardes", translation: "good afternoon", difficulty: 1, importance: 3 },
                    { word: "buenas noches", translation: "good evening / good night", difficulty: 1, importance: 3 },
                ],
            },
            {
                code: "PA1.SOC.GRT.02",
                title: "Say goodbye",
                canDo: "Use basic expressions to end a simple interaction.",
                domain: "SOCIAL",
                difficulty: 1,
                patterns: ["Adiós.", "Hasta luego.", "Hasta mañana.", "Nos vemos."],
                examples: [
                    "Adiós.",
                    "Hasta luego.",
                    "Hasta mañana.",
                    "Nos vemos.",
                ],
                vocabulary: [
                    { word: "adiós", translation: "goodbye", difficulty: 1, importance: 3 },
                    { word: "hasta luego", translation: "see you later", difficulty: 1, importance: 3 },
                    { word: "hasta mañana", translation: "see you tomorrow", difficulty: 1 },
                    { word: "nos vemos", translation: "see you", difficulty: 1, importance: 2 },
                ],
            },
            {
                code: "PA1.SOC.COU.01",
                title: "Use polite basic expressions",
                canDo: "Use please, thank you, and apology expressions in simple interactions.",
                domain: "SOCIAL",
                difficulty: 1,
                patterns: ["Por favor.", "Gracias.", "Perdón."],
                examples: [
                    "Por favor.",
                    "Gracias.",
                    "Muchas gracias.",
                    "Perdón.",
                ],
                vocabulary: [
                    { word: "por favor", translation: "please", difficulty: 1, importance: 3 },
                    { word: "gracias", translation: "thank you", difficulty: 1, importance: 3 },
                    { word: "muchas gracias", translation: "thank you very much", difficulty: 1, importance: 2 },
                    { word: "perdón", translation: "sorry / excuse me", difficulty: 1, importance: 3 },
                ],
            },
        ],
    },

    // ============================================================
    // UNIT 2 — FIRST CONTACT
    // ============================================================
    {
        title: "First Contact",
        description:
            "Learn to enter a basic interaction, exchange names, and ask who someone is.",
        competencies: [
            {
                code: "PA1.SOC.INT.01",
                title: "Introduce yourself",
                canDo: "Give your name in a simple interaction.",
                domain: "SOCIAL",
                difficulty: 1,
                patterns: ["Me llamo + nombre.", "Soy + nombre."],
                examples: [
                    "Me llamo Samir.",
                    "Soy Samir.",
                ],
                grammarNote:
                    "Me llamo literally means 'I call myself' and is one of the most common ways to introduce your name.",
                vocabulary: [
                    { word: "llamarse", translation: "to be called", difficulty: 1 },
                    { word: "nombre", translation: "name", difficulty: 1, importance: 3 },
                ],
            },
            {
                code: "PA1.SOC.INT.02",
                title: "Ask someone's name",
                canDo: "Ask another person for their name.",
                domain: "SOCIAL",
                difficulty: 1,
                patterns: ["¿Cómo te llamas?", "¿Cuál es tu nombre?"],
                examples: [
                    "¿Cómo te llamas?",
                    "¿Cuál es tu nombre?",
                ],
                vocabulary: [
                    { word: "cómo", translation: "how", difficulty: 1 },
                    { word: "cuál", translation: "which / what", difficulty: 1 },
                    { word: "tu", translation: "your", difficulty: 1 },
                ],
                prerequisites: ["PA1.SOC.INT.01"],
            },
            {
                code: "PA1.SOC.GRT.03",
                title: "Ask how someone is",
                canDo: "Ask a familiar person how they are.",
                domain: "SOCIAL",
                difficulty: 1,
                patterns: ["¿Cómo estás?", "¿Qué tal?"],
                examples: [
                    "¿Cómo estás?",
                    "¿Qué tal?",
                ],
                vocabulary: [
                    { word: "estar", translation: "to be", difficulty: 1, importance: 3 },
                    { word: "qué", translation: "what", difficulty: 1 },
                    { word: "tal", translation: "how / what kind", difficulty: 1 },
                ],
            },
            {
                code: "PA1.SOC.GRT.04",
                title: "Respond to how are you",
                canDo: "Give a very simple response about your current state.",
                domain: "SOCIAL",
                difficulty: 1,
                patterns: ["Estoy bien.", "Estoy mal.", "Estoy muy bien.", "Más o menos."],
                examples: [
                    "Estoy bien.",
                    "Estoy muy bien.",
                    "Estoy mal.",
                    "Más o menos.",
                ],
                vocabulary: [
                    { word: "bien", translation: "well / good", difficulty: 1, importance: 3 },
                    { word: "mal", translation: "bad / badly", difficulty: 1, importance: 3 },
                    { word: "muy", translation: "very", difficulty: 1, importance: 2 },
                    { word: "más o menos", translation: "so-so / more or less", difficulty: 1, importance: 2 },
                ],
                prerequisites: ["PA1.SOC.GRT.03"],
            },
            {
                code: "PA1.SOC.RES.01",
                title: "Close a basic introduction",
                canDo: "Respond appropriately when meeting someone for the first time.",
                domain: "SOCIAL",
                difficulty: 1,
                patterns: ["Mucho gusto.", "Encantado.", "Encantada."],
                examples: [
                    "Mucho gusto.",
                    "Encantado.",
                    "Encantada.",
                ],
                culturalNote:
                    "Mucho gusto is broadly useful and avoids needing to choose a gendered adjective.",
                vocabulary: [
                    { word: "mucho gusto", translation: "nice to meet you", difficulty: 1, importance: 3 },
                    { word: "encantado", translation: "pleased to meet you (masculine)", difficulty: 1 },
                    { word: "encantada", translation: "pleased to meet you (feminine)", difficulty: 1 },
                ],
                prerequisites: [
                    "PA1.SOC.INT.01",
                    "PA1.SOC.INT.02",
                ],
            },
        ],
    },

    // ============================================================
    // UNIT 3 — ME
    // ============================================================
    {
        title: "Me",
        description:
            "Build the learner's first ability to describe identity, origin, language, and simple personal information.",
        competencies: [
            {
                code: "PA1.PER.NAM.01",
                title: "State your identity",
                canDo: "Say who you are using a basic identity statement.",
                domain: "PERSONAL",
                difficulty: 1,
                patterns: ["Soy + nombre.", "Soy + profesión/identidad."],
                examples: [
                    "Soy Samir.",
                    "Soy estudiante.",
                ],
                vocabulary: [
                    { word: "soy", translation: "I am", difficulty: 1, importance: 3 },
                    { word: "estudiante", translation: "student", difficulty: 1, importance: 3 },
                ],
            },
            {
                code: "PA1.PER.ORG.01",
                title: "State origin",
                canDo: "Say where you are from.",
                domain: "PERSONAL",
                difficulty: 1,
                patterns: ["Soy de + lugar.", "Vengo de + lugar."],
                examples: [
                    "Soy de Sudán del Sur.",
                    "Soy de Juba.",
                ],
                grammarNote:
                    "Soy de is the simplest Pre-A1 structure for stating origin.",
                vocabulary: [
                    { word: "de", translation: "from / of", difficulty: 1, importance: 3 },
                    { word: "Sudán del Sur", translation: "South Sudan", difficulty: 1, importance: 3 },
                    { word: "Juba", translation: "Juba", difficulty: 1, importance: 2 },
                ],
            },
            {
                code: "PA1.PER.LOC.01",
                title: "State where you live",
                canDo: "Say where you currently live.",
                domain: "PERSONAL",
                difficulty: 1,
                patterns: ["Vivo en + lugar.", "Vivo en Juba."],
                examples: [
                    "Vivo en Juba.",
                    "Vivo en Sudán del Sur.",
                ],
                vocabulary: [
                    { word: "vivir", translation: "to live", difficulty: 1, importance: 3 },
                    { word: "en", translation: "in / at", difficulty: 1, importance: 3 },
                ],
                prerequisites: ["PA1.PER.ORG.01"],
            },
            {
                code: "PA1.PER.LNG.01",
                title: "State what language you speak",
                canDo: "Say which language or languages you speak.",
                domain: "PERSONAL",
                difficulty: 1,
                patterns: ["Hablo + idioma.", "Hablo español."],
                examples: [
                    "Hablo español.",
                    "Hablo inglés.",
                ],
                vocabulary: [
                    { word: "hablar", translation: "to speak", difficulty: 1, importance: 3 },
                    { word: "español", translation: "Spanish", difficulty: 1, importance: 3 },
                    { word: "inglés", translation: "English", difficulty: 1, importance: 2 },
                    { word: "árabe", translation: "Arabic", difficulty: 1, importance: 2 },
                ],
            },
            {
                code: "PA1.PER.AGE.01",
                title: "State your age",
                canDo: "Say your age using the basic Spanish age structure.",
                domain: "PERSONAL",
                difficulty: 1,
                patterns: ["Tengo + número + años."],
                examples: [
                    "Tengo veinte años.",
                    "Tengo treinta años.",
                ],
                grammarNote:
                    "Spanish expresses age with tener rather than ser: Tengo veinte años.",
                vocabulary: [
                    { word: "tener", translation: "to have", difficulty: 1, importance: 3 },
                    { word: "años", translation: "years", difficulty: 1, importance: 3 },
                ],
                prerequisites: ["PA1.PER.NAM.01"],
            },
            {
                code: "PA1.PER.IDN.01",
                title: "Give a short personal profile",
                canDo:
                    "Combine name, origin, residence, and language into a short introduction.",
                domain: "PERSONAL",
                difficulty: 2,
                patterns: [
                    "Me llamo + nombre.",
                    "Soy de + lugar.",
                    "Vivo en + lugar.",
                    "Hablo + idioma.",
                ],
                examples: [
                    "Me llamo Samir. Soy de Sudán del Sur. Vivo en Juba. Hablo inglés.",
                ],
                prerequisites: [
                    "PA1.SOC.INT.01",
                    "PA1.PER.ORG.01",
                    "PA1.PER.LOC.01",
                    "PA1.PER.LNG.01",
                ],
                vocabulary: [],
            },
        ],
    },

    // ============================================================
    // UNIT 4 — MY IMMEDIATE WORLD
    // ============================================================
    {
        title: "My Immediate World",
        description:
            "Name familiar people and objects and use basic descriptions around the learner.",
        competencies: [
            {
                code: "PA1.WLD.NAM.01",
                title: "Name familiar people",
                canDo: "Identify close people using basic family and social vocabulary.",
                domain: "EVERYDAY",
                difficulty: 1,
                patterns: ["Mi + persona.", "Es mi + persona."],
                examples: [
                    "Mi madre.",
                    "Mi padre.",
                    "Es mi amigo.",
                ],
                vocabulary: [
                    { word: "madre", translation: "mother", difficulty: 1, importance: 3 },
                    { word: "padre", translation: "father", difficulty: 1, importance: 3 },
                    { word: "amigo", translation: "male friend", difficulty: 1, importance: 3 },
                    { word: "amiga", translation: "female friend", difficulty: 1, importance: 3 },
                    { word: "familia", translation: "family", difficulty: 1, importance: 3 },
                ],
            },
            {
                code: "PA1.WLD.OBJ.01",
                title: "Identify basic objects",
                canDo: "Identify common objects in an immediate environment.",
                domain: "EVERYDAY",
                difficulty: 1,
                patterns: ["Es + objeto.", "Un/una + objeto."],
                examples: [
                    "Es un libro.",
                    "Es una mesa.",
                    "Un teléfono.",
                ],
                vocabulary: [
                    { word: "libro", translation: "book", difficulty: 1, importance: 2 },
                    { word: "mesa", translation: "table", difficulty: 1, importance: 2 },
                    { word: "teléfono", translation: "phone", difficulty: 1, importance: 3 },
                    { word: "casa", translation: "house / home", difficulty: 1, importance: 3 },
                    { word: "puerta", translation: "door", difficulty: 1, importance: 2 },
                ],
            },
            {
                code: "PA1.WLD.COL.01",
                title: "Use basic colors",
                canDo: "Identify and use common colors.",
                domain: "EVERYDAY",
                difficulty: 1,
                patterns: ["Es + color.", "El libro es rojo."],
                examples: [
                    "Es rojo.",
                    "Es azul.",
                    "La casa es blanca.",
                ],
                vocabulary: [
                    { word: "rojo", translation: "red", difficulty: 1, importance: 2 },
                    { word: "azul", translation: "blue", difficulty: 1, importance: 2 },
                    { word: "verde", translation: "green", difficulty: 1, importance: 2 },
                    { word: "blanco", translation: "white", difficulty: 1, importance: 2 },
                    { word: "negro", translation: "black", difficulty: 1, importance: 2 },
                ],
            },
            {
                code: "PA1.WLD.DES.01",
                title: "Give a basic description",
                canDo: "Describe a familiar person or object using one simple adjective.",
                domain: "EVERYDAY",
                difficulty: 1,
                patterns: ["Es + adjective.", "Es grande.", "Es pequeño."],
                examples: [
                    "Es grande.",
                    "Es pequeño.",
                    "Es bonito.",
                ],
                vocabulary: [
                    { word: "grande", translation: "big", difficulty: 1, importance: 2 },
                    { word: "pequeño", translation: "small", difficulty: 1, importance: 2 },
                    { word: "bonito", translation: "pretty / nice", difficulty: 1, importance: 2 },
                    { word: "nuevo", translation: "new", difficulty: 1, importance: 2 },
                ],
            },
        ],
    },

    // ============================================================
    // UNIT 5 — BASIC NEEDS
    // ============================================================
    {
        title: "Basic Needs",
        description:
            "Give the learner enough language to express immediate needs, wants, and simple preferences.",
        competencies: [
            {
                code: "PA1.NED.WNT.01",
                title: "Express a basic want",
                canDo: "Say that you want something using a simple structure.",
                domain: "NEEDS",
                difficulty: 1,
                patterns: ["Quiero + noun.", "Quiero + infinitive."],
                examples: [
                    "Quiero agua.",
                    "Quiero comer.",
                    "Quiero café.",
                ],
                vocabulary: [
                    { word: "querer", translation: "to want", difficulty: 1, importance: 3 },
                    { word: "agua", translation: "water", difficulty: 1, importance: 3 },
                    { word: "comer", translation: "to eat", difficulty: 1, importance: 3 },
                    { word: "café", translation: "coffee", difficulty: 1, importance: 2 },
                ],
            },
            {
                code: "PA1.NED.NED.01",
                title: "Express a basic need",
                canDo: "Say that you need something.",
                domain: "NEEDS",
                difficulty: 1,
                patterns: ["Necesito + noun.", "Necesito ayuda."],
                examples: [
                    "Necesito agua.",
                    "Necesito ayuda.",
                    "Necesito un médico.",
                ],
                vocabulary: [
                    { word: "necesitar", translation: "to need", difficulty: 1, importance: 3 },
                    { word: "ayuda", translation: "help", difficulty: 1, importance: 3 },
                    { word: "médico", translation: "doctor", difficulty: 1, importance: 2 },
                ],
            },
            {
                code: "PA1.NED.LIK.01",
                title: "Express a basic preference",
                canDo: "Say what you like or dislike at a very basic level.",
                domain: "NEEDS",
                difficulty: 1,
                patterns: ["Me gusta + noun.", "No me gusta + noun."],
                examples: [
                    "Me gusta el café.",
                    "Me gusta la música.",
                    "No me gusta el frío.",
                ],
                vocabulary: [
                    { word: "gustar", translation: "to like", difficulty: 1, importance: 3 },
                    { word: "música", translation: "music", difficulty: 1, importance: 2 },
                    { word: "frío", translation: "cold", difficulty: 1, importance: 2 },
                ],
            },
            {
                code: "PA1.NED.FOD.01",
                title: "Order a basic drink or food",
                canDo: "Request a simple food or drink.",
                domain: "NEEDS",
                difficulty: 1,
                patterns: ["Quiero + food/drink.", "Un/una + food/drink, por favor."],
                examples: [
                    "Un café, por favor.",
                    "Quiero agua, por favor.",
                ],
                vocabulary: [
                    { word: "pan", translation: "bread", difficulty: 1, importance: 2 },
                    { word: "arroz", translation: "rice", difficulty: 1, importance: 2 },
                    { word: "agua", translation: "water", difficulty: 1, importance: 3 },
                    { word: "comida", translation: "food", difficulty: 1, importance: 2 },
                ],
                prerequisites: ["PA1.NED.WNT.01"],
            },
            {
                code: "PA1.NED.REQ.01",
                title: "Make a polite basic request",
                canDo: "Ask for something using a simple polite request.",
                domain: "NEEDS",
                difficulty: 2,
                patterns: ["¿Me da + noun, por favor?", "Por favor, + request."],
                examples: [
                    "¿Me da agua, por favor?",
                    "¿Me da un café, por favor?",
                ],
                prerequisites: [
                    "PA1.NED.WNT.01",
                    "PA1.SOC.COU.01",
                ],
                vocabulary: [],
            },
        ],
    },

    // ============================================================
    // UNIT 6 — EVERYDAY SURVIVAL
    // ============================================================
    {
        title: "Everyday Survival",
        description:
            "Handle simple navigation, numbers, time, places, and basic transactions.",
        competencies: [
            {
                code: "PA1.SRV.NUM.01",
                title: "Recognize basic numbers",
                canDo: "Recognize and use numbers needed for simple everyday interactions.",
                domain: "SURVIVAL",
                difficulty: 1,
                patterns: ["uno, dos, tres...", "Tengo + número."],
                examples: [
                    "Uno.",
                    "Cinco.",
                    "Diez.",
                    "Veinte.",
                ],
                vocabulary: [
                    { word: "uno", translation: "one", difficulty: 1, importance: 3 },
                    { word: "dos", translation: "two", difficulty: 1, importance: 3 },
                    { word: "tres", translation: "three", difficulty: 1, importance: 3 },
                    { word: "cinco", translation: "five", difficulty: 1, importance: 2 },
                    { word: "diez", translation: "ten", difficulty: 1, importance: 3 },
                    { word: "veinte", translation: "twenty", difficulty: 1, importance: 2 },
                ],
            },
            {
                code: "PA1.SRV.TIM.01",
                title: "Recognize basic time expressions",
                canDo: "Understand simple references to today, tomorrow, and now.",
                domain: "SURVIVAL",
                difficulty: 1,
                patterns: ["hoy", "mañana", "ahora", "por la mañana"],
                examples: [
                    "Hoy.",
                    "Mañana.",
                    "Ahora.",
                ],
                vocabulary: [
                    { word: "hoy", translation: "today", difficulty: 1, importance: 3 },
                    { word: "mañana", translation: "tomorrow / morning", difficulty: 1, importance: 3 },
                    { word: "ahora", translation: "now", difficulty: 1, importance: 3 },
                    { word: "día", translation: "day", difficulty: 1, importance: 2 },
                ],
            },
            {
                code: "PA1.SRV.LOC.01",
                title: "Ask where something is",
                canDo: "Ask for the location of a familiar place or object.",
                domain: "SURVIVAL",
                difficulty: 1,
                patterns: ["¿Dónde está + place/object?"],
                examples: [
                    "¿Dónde está el baño?",
                    "¿Dónde está la estación?",
                    "¿Dónde está el hotel?",
                ],
                vocabulary: [
                    { word: "dónde", translation: "where", difficulty: 1, importance: 3 },
                    { word: "baño", translation: "bathroom", difficulty: 1, importance: 3 },
                    { word: "estación", translation: "station", difficulty: 1, importance: 2 },
                    { word: "hotel", translation: "hotel", difficulty: 1, importance: 2 },
                ],
            },
            {
                code: "PA1.SRV.LOC.02",
                title: "Understand simple location answers",
                canDo: "Understand very simple answers about where something is.",
                domain: "SURVIVAL",
                difficulty: 1,
                patterns: ["Está aquí.", "Está allí.", "Está cerca.", "Está lejos."],
                examples: [
                    "Está aquí.",
                    "Está allí.",
                    "Está cerca.",
                    "Está lejos.",
                ],
                vocabulary: [
                    { word: "aquí", translation: "here", difficulty: 1, importance: 3 },
                    { word: "allí", translation: "there", difficulty: 1, importance: 2 },
                    { word: "cerca", translation: "near", difficulty: 1, importance: 3 },
                    { word: "lejos", translation: "far", difficulty: 1, importance: 3 },
                ],
                prerequisites: ["PA1.SRV.LOC.01"],
            },
            {
                code: "PA1.SRV.PAY.01",
                title: "Handle a simple purchase",
                canDo: "Use basic language during a simple purchase.",
                domain: "SURVIVAL",
                difficulty: 2,
                patterns: ["¿Cuánto cuesta?", "Quiero esto.", "Aquí tiene."],
                examples: [
                    "¿Cuánto cuesta?",
                    "Quiero esto.",
                    "Aquí tiene.",
                ],
                vocabulary: [
                    { word: "cuánto", translation: "how much", difficulty: 1, importance: 3 },
                    { word: "cuesta", translation: "costs", difficulty: 1, importance: 3 },
                    { word: "esto", translation: "this", difficulty: 1, importance: 2 },
                    { word: "dinero", translation: "money", difficulty: 1, importance: 2 },
                ],
                prerequisites: ["PA1.SRV.NUM.01"],
            },
        ],
    },

    // ============================================================
    // UNIT 7 — INTERACTION & REPAIR
    // ============================================================
    {
        title: "Interaction & Repair",
        description:
            "Teach the learner how to keep an interaction alive when comprehension is limited.",
        competencies: [
            {
                code: "PA1.INT.UND.01",
                title: "Say that you do not understand",
                canDo: "Tell someone that you do not understand.",
                domain: "INTERACTION",
                difficulty: 1,
                patterns: ["No entiendo.", "No entiendo bien."],
                examples: [
                    "No entiendo.",
                    "No entiendo bien.",
                ],
                vocabulary: [
                    { word: "entender", translation: "to understand", difficulty: 1, importance: 3 },
                    { word: "bien", translation: "well", difficulty: 1, importance: 2 },
                ],
            },
            {
                code: "PA1.INT.REP.01",
                title: "Ask someone to repeat",
                canDo: "Ask someone to repeat what they said.",
                domain: "INTERACTION",
                difficulty: 1,
                patterns: ["¿Puedes repetir?", "Otra vez, por favor."],
                examples: [
                    "¿Puedes repetir?",
                    "Otra vez, por favor.",
                ],
                vocabulary: [
                    { word: "repetir", translation: "to repeat", difficulty: 1, importance: 3 },
                    { word: "otra vez", translation: "again", difficulty: 1, importance: 3 },
                ],
                prerequisites: ["PA1.INT.UND.01"],
            },
            {
                code: "PA1.INT.SLW.01",
                title: "Ask someone to speak slowly",
                canDo: "Ask another person to speak more slowly.",
                domain: "INTERACTION",
                difficulty: 1,
                patterns: ["Más despacio, por favor.", "¿Puedes hablar más despacio?"],
                examples: [
                    "Más despacio, por favor.",
                    "¿Puedes hablar más despacio?",
                ],
                vocabulary: [
                    { word: "despacio", translation: "slowly", difficulty: 1, importance: 3 },
                    { word: "hablar", translation: "to speak", difficulty: 1, importance: 2 },
                ],
                prerequisites: ["PA1.INT.UND.01"],
            },
            {
                code: "PA1.INT.QUE.01",
                title: "Ask what a word means",
                canDo: "Ask for the meaning of an unfamiliar word or expression.",
                domain: "INTERACTION",
                difficulty: 2,
                patterns: ["¿Qué significa + palabra?", "¿Qué es + palabra?"],
                examples: [
                    "¿Qué significa esta palabra?",
                    "¿Qué significa esto?",
                ],
                vocabulary: [
                    { word: "significar", translation: "to mean", difficulty: 2, importance: 3 },
                    { word: "palabra", translation: "word", difficulty: 1, importance: 3 },
                    { word: "esto", translation: "this", difficulty: 1, importance: 2 },
                ],
                prerequisites: ["PA1.INT.UND.01"],
            },
            {
                code: "PA1.INT.CON.01",
                title: "Confirm simple information",
                canDo: "Confirm whether a simple piece of information is correct.",
                domain: "INTERACTION",
                difficulty: 2,
                patterns: ["¿Sí?", "¿Correcto?", "¿Es aquí?", "Sí, correcto."],
                examples: [
                    "¿Es aquí?",
                    "¿Correcto?",
                    "Sí, correcto.",
                ],
                vocabulary: [
                    { word: "sí", translation: "yes", difficulty: 1, importance: 3 },
                    { word: "no", translation: "no", difficulty: 1, importance: 3 },
                    { word: "correcto", translation: "correct", difficulty: 1, importance: 2 },
                ],
            },
        ],
    },

    // ============================================================
    // UNIT 8 — MINI REAL LIFE
    // ============================================================
    {
        title: "Mini Real Life",
        description:
            "Combine Pre-A1 language into short real-world situations rather than isolated grammar drills.",
        competencies: [
            {
                code: "PA1.RL.INT.01",
                title: "Complete a basic introduction",
                canDo:
                    "Introduce yourself and exchange basic personal information.",
                domain: "REAL_LIFE",
                difficulty: 2,
                patterns: [
                    "Hola. Me llamo...",
                    "Soy de...",
                    "Vivo en...",
                    "Hablo...",
                ],
                examples: [
                    "Hola. Me llamo Samir. Soy de Sudán del Sur. Vivo en Juba.",
                ],
                prerequisites: [
                    "PA1.SOC.INT.01",
                    "PA1.PER.ORG.01",
                    "PA1.PER.LOC.01",
                ],
                vocabulary: [],
            },
            {
                code: "PA1.RL.CAF.01",
                title: "Order something in a café",
                canDo:
                    "Make a simple food or drink request and respond to a basic follow-up.",
                domain: "REAL_LIFE",
                difficulty: 2,
                patterns: [
                    "Un café, por favor.",
                    "¿Algo más?",
                    "No, gracias.",
                ],
                examples: [
                    "Un café, por favor.",
                    "¿Algo más?",
                    "No, gracias.",
                ],
                prerequisites: [
                    "PA1.NED.FOD.01",
                    "PA1.SOC.COU.01",
                ],
                vocabulary: [
                    { word: "algo", translation: "something / anything", difficulty: 2 },
                    { word: "más", translation: "more", difficulty: 1 },
                ],
            },
            {
                code: "PA1.RL.DIR.01",
                title: "Ask for a basic direction",
                canDo: "Ask where a familiar place is and understand a very simple answer.",
                domain: "REAL_LIFE",
                difficulty: 2,
                patterns: [
                    "¿Dónde está el hotel?",
                    "Está aquí.",
                    "Está cerca.",
                ],
                examples: [
                    "¿Dónde está el hotel?",
                    "Está cerca.",
                ],
                prerequisites: [
                    "PA1.SRV.LOC.01",
                    "PA1.SRV.LOC.02",
                ],
                vocabulary: [],
            },
            {
                code: "PA1.RL.HEL.01",
                title: "Ask for basic help",
                canDo: "Ask for help and explain that you need something.",
                domain: "REAL_LIFE",
                difficulty: 2,
                patterns: [
                    "Necesito ayuda.",
                    "¿Puedes ayudarme?",
                    "No entiendo.",
                ],
                examples: [
                    "Necesito ayuda, por favor.",
                    "¿Puedes ayudarme?",
                    "No entiendo.",
                ],
                prerequisites: [
                    "PA1.NED.NED.01",
                    "PA1.INT.UND.01",
                    "PA1.SOC.COU.01",
                ],
                vocabulary: [
                    { word: "ayudar", translation: "to help", difficulty: 2 },
                ],
            },
            {
                code: "PA1.RL.SOC.01",
                title: "Maintain a short social exchange",
                canDo:
                    "Start, maintain, and close a very short social interaction.",
                domain: "REAL_LIFE",
                difficulty: 2,
                patterns: [
                    "Hola.",
                    "¿Cómo estás?",
                    "Estoy bien.",
                    "¿Y tú?",
                    "Hasta luego.",
                ],
                examples: [
                    "Hola. ¿Cómo estás?",
                    "Estoy bien. ¿Y tú?",
                    "Muy bien. Hasta luego.",
                ],
                prerequisites: [
                    "PA1.SOC.GRT.01",
                    "PA1.SOC.GRT.03",
                    "PA1.SOC.GRT.04",
                    "PA1.SOC.GRT.02",
                ],
                vocabulary: [
                    { word: "y", translation: "and", difficulty: 1 },
                ],
            },
        ],
    },

    // ============================================================
    // UNIT 9 — PRE-A1 GATEWAY
    // ============================================================
    {
        title: "Pre-A1 Gateway",
        description:
            "Bring the learner's foundational abilities together in integrated communication tasks.",
        competencies: [
            {
                code: "PA1.GAT.SUR.01",
                title: "Handle a basic survival interaction",
                canDo:
                    "Use memorized and practiced language to handle a very simple everyday need.",
                domain: "GATEWAY",
                difficulty: 3,
                patterns: [
                    "Necesito...",
                    "Quiero...",
                    "¿Dónde está...?",
                    "¿Cuánto cuesta?",
                ],
                examples: [
                    "Necesito agua.",
                    "¿Dónde está el baño?",
                    "¿Cuánto cuesta?",
                ],
                prerequisites: [
                    "PA1.NED.NED.01",
                    "PA1.NED.WNT.01",
                    "PA1.SRV.LOC.01",
                    "PA1.SRV.PAY.01",
                ],
                vocabulary: [],
            },
            {
                code: "PA1.GAT.INT.01",
                title: "Repair a simple conversation",
                canDo:
                    "Use basic repair phrases when communication breaks down.",
                domain: "GATEWAY",
                difficulty: 3,
                patterns: [
                    "No entiendo.",
                    "¿Puedes repetir?",
                    "Más despacio, por favor.",
                ],
                examples: [
                    "No entiendo. ¿Puedes repetir?",
                    "Más despacio, por favor.",
                ],
                prerequisites: [
                    "PA1.INT.UND.01",
                    "PA1.INT.REP.01",
                    "PA1.INT.SLW.01",
                ],
                vocabulary: [],
            },
            {
                code: "PA1.GAT.PRO.01",
                title: "Give a basic personal profile",
                canDo:
                    "Give a short spoken or written profile containing several familiar facts.",
                domain: "GATEWAY",
                difficulty: 3,
                patterns: [
                    "Me llamo...",
                    "Soy de...",
                    "Vivo en...",
                    "Hablo...",
                    "Tengo ... años.",
                ],
                examples: [
                    "Me llamo Samir. Soy de Sudán del Sur. Vivo en Juba. Hablo inglés.",
                ],
                prerequisites: [
                    "PA1.PER.IDN.01",
                    "PA1.PER.AGE.01",
                ],
                vocabulary: [],
            },
            {
                code: "PA1.GAT.MIS.01",
                title: "Complete a basic real-life mission",
                canDo:
                    "Combine familiar expressions to accomplish a simple real-world communication goal.",
                domain: "GATEWAY",
                difficulty: 3,
                patterns: [
                    "Hola.",
                    "Necesito...",
                    "Quiero...",
                    "¿Dónde está...?",
                    "Gracias.",
                    "Hasta luego.",
                ],
                examples: [
                    "Hola. Necesito ayuda, por favor.",
                    "¿Dónde está el hotel?",
                    "Gracias. Hasta luego.",
                ],
                prerequisites: [
                    "PA1.RL.INT.01",
                    "PA1.RL.CAF.01",
                    "PA1.RL.DIR.01",
                    "PA1.RL.HEL.01",
                ],
                vocabulary: [],
            },
        ],
    },
];

// ============================================================
// EXPERIENCE GENERATION
// ============================================================

function buildExperienceContent(
    competency: CompetencySeed,
    type: ExperienceType
) {
    const examples = competency.examples;

    switch (type) {
        case ExperienceType.STORY:
            return {
                teach: [
                    {
                        type: "story",
                        text: `You encounter a simple real-life situation where you need to ${competency.canDo.toLowerCase()}.`,
                    },
                    {
                        type: "explanation",
                        text: `Your goal is to recognize and use: ${examples.join(" / ")}`,
                    },
                ],
                exercises: [
                    {
                        type: "recognition",
                        prompt: `Which expression helps you ${competency.canDo.toLowerCase()}?`,
                        options: examples.slice(0, 4),
                        answer: examples[0] ?? null,
                    },
                ],
                realLife: {
                    prompt: competency.canDo,
                    chatSeed: examples[0] ?? "",
                },
            };

        case ExperienceType.DRILL:
            return {
                teach: [
                    {
                        type: "rule",
                        text:
                            competency.grammarNote ??
                            `Practice the core language needed to ${competency.canDo.toLowerCase()}.`,
                    },
                ],
                exercises: [
                    {
                        type: "mcq",
                        prompt: `Which expression can you use to ${competency.canDo.toLowerCase()}?`,
                        options: examples.slice(0, 4),
                        answer: examples[0] ?? null,
                    },
                    {
                        type: "recall",
                        prompt: `Complete the target expression.`,
                        answer: examples[0] ?? null,
                    },
                ],
            };

        case ExperienceType.IMMERSION:
            return {
                teach: [
                    {
                        type: "context",
                        text:
                            competency.culturalNote ??
                            `Notice how this expression appears naturally when people ${competency.canDo.toLowerCase()}.`,
                    },
                ],
                exercises: [
                    {
                        type: "meaning",
                        prompt: `What would you use when you need to ${competency.canDo.toLowerCase()}?`,
                        options: examples.slice(0, 4),
                        answer: examples[0] ?? null,
                    },
                ],
                realLife: {
                    prompt: competency.canDo,
                    chatSeed: examples[0] ?? "",
                },
            };

        case ExperienceType.PROFESSIONAL:
            return {
                teach: [
                    {
                        type: "context",
                        text: `Use clear, polite language when you need to ${competency.canDo.toLowerCase()}.`,
                    },
                ],
                exercises: [
                    {
                        type: "selection",
                        prompt: `Choose the expression you could use in a polite interaction.`,
                        options: examples.slice(0, 4),
                        answer: examples[0] ?? null,
                    },
                ],
            };

        case ExperienceType.MISSION:
            return {
                teach: [
                    {
                        type: "mission",
                        text: `Complete a real-life task: ${competency.canDo}`,
                    },
                ],
                exercises: [],
                realLife: {
                    prompt: competency.canDo,
                    chatSeed: examples[0] ?? "",
                },
            };
    }
}

// ============================================================
// MAIN SEED
// ============================================================

async function main() {
    console.log("Seeding ECLA Pre-A1 curriculum...\n");

    // ------------------------------------------------------------
    // 1. LANGUAGE
    // ------------------------------------------------------------

    const spanish = await prisma.language.upsert({
        where: {
            code: "es",
        },
        update: {
            name: "Spanish",
            nativeName: "Español",
            ttsLocale: "es-ES",
            isActive: true,
        },
        create: {
            code: "es",
            name: "Spanish",
            nativeName: "Español",
            ttsLocale: "es-ES",
            isActive: true,
        },
    });

    console.log(`✓ Language: ${spanish.name}`);

    // ------------------------------------------------------------
    // 2. COURSE
    // ------------------------------------------------------------

    const course = await prisma.course.upsert({
        where: {
            languageId_cefrLevel: {
                languageId: spanish.id,
                cefrLevel: "PRE_A1",
            },
        },
        update: {
            title: "Spanish Pre-A1",
            isPublished: true,
        },
        create: {
            languageId: spanish.id,
            cefrLevel: "PRE_A1",
            title: "Spanish Pre-A1",
            isPublished: true,
        },
    });

    console.log(`✓ Course: ${course.title}`);

    // ------------------------------------------------------------
    // 3. CREATE UNITS + COMPETENCIES
    // ------------------------------------------------------------

    const competencyIds = new Map<string, string>();

    for (let unitIndex = 0; unitIndex < units.length; unitIndex++) {
        const unitData = units[unitIndex];

        const unit = await prisma.unit.upsert({
            where: {
                courseId_orderIndex: {
                    courseId: course.id,
                    orderIndex: unitIndex + 1,
                },
            },
            update: {
                title: unitData.title,
                description: unitData.description,
            },
            create: {
                courseId: course.id,
                title: unitData.title,
                description: unitData.description,
                orderIndex: unitIndex + 1,
            },
        });

        console.log(`\n✓ Unit ${unitIndex + 1}: ${unit.title}`);

        for (
            let competencyIndex = 0;
            competencyIndex < unitData.competencies.length;
            competencyIndex++
        ) {
            const data = unitData.competencies[competencyIndex];

            const competency = await prisma.competency.upsert({
                where: {
                    code: data.code,
                },
                update: {
                    unitId: unit.id,
                    title: data.title,
                    canDo: data.canDo,
                    domain: data.domain,
                    level: "PRE_A1",
                    orderIndex: competencyIndex + 1,
                    difficulty: data.difficulty ?? 1,
                    isCore: data.isCore ?? true,
                    xpReward: data.xpReward ?? 20,
                },
                create: {
                    code: data.code,
                    unitId: unit.id,
                    title: data.title,
                    canDo: data.canDo,
                    domain: data.domain,
                    level: "PRE_A1",
                    orderIndex: competencyIndex + 1,
                    difficulty: data.difficulty ?? 1,
                    isCore: data.isCore ?? true,
                    xpReward: data.xpReward ?? 20,
                },
            });

            competencyIds.set(data.code, competency.id);

            console.log(`   ✓ ${data.code} — ${data.title}`);

            // ----------------------------------------------------------
            // LANGUAGE REALIZATION
            // ----------------------------------------------------------

            await prisma.languageRealization.upsert({
                where: {
                    competencyId_languageId: {
                        competencyId: competency.id,
                        languageId: spanish.id,
                    },
                },
                update: {
                    grammarNote: data.grammarNote,
                    pronunciationNote: data.pronunciationNote,
                    culturalNote: data.culturalNote,
                    patterns: data.patterns,
                    examples: data.examples,
                },
                create: {
                    competencyId: competency.id,
                    languageId: spanish.id,
                    grammarNote: data.grammarNote,
                    pronunciationNote: data.pronunciationNote,
                    culturalNote: data.culturalNote,
                    patterns: data.patterns,
                    examples: data.examples,
                },
            });

            // ----------------------------------------------------------
            // VOCABULARY
            // ----------------------------------------------------------

            for (const vocab of data.vocabulary) {
                const vocabulary = await prisma.vocabulary.upsert({
                    where: {
                        id: `${spanish.id}-${vocab.word
                            .toLowerCase()
                            .replace(/[^a-z0-9áéíóúüñ]+/gi, "-")}`,
                    },
                    update: {
                        word: vocab.word,
                        translation: vocab.translation,
                        difficulty: vocab.difficulty ?? 1,
                    },
                    create: {
                        id: `${spanish.id}-${vocab.word
                            .toLowerCase()
                            .replace(/[^a-z0-9áéíóúüñ]+/gi, "-")}`,
                        languageId: spanish.id,
                        word: vocab.word,
                        translation: vocab.translation,
                        difficulty: vocab.difficulty ?? 1,
                    },
                });

                await prisma.competencyVocabulary.upsert({
                    where: {
                        competencyId_vocabularyId: {
                            competencyId: competency.id,
                            vocabularyId: vocabulary.id,
                        },
                    },
                    update: {
                        importance: vocab.importance ?? 1,
                    },
                    create: {
                        competencyId: competency.id,
                        vocabularyId: vocabulary.id,
                        importance: vocab.importance ?? 1,
                    },
                });
            }

            // ----------------------------------------------------------
            // LEARNING EXPERIENCES
            // ----------------------------------------------------------

            const experienceTypes: ExperienceType[] = [
                ExperienceType.STORY,
                ExperienceType.DRILL,
                ExperienceType.IMMERSION,
                ExperienceType.PROFESSIONAL,
                ExperienceType.MISSION,
            ];

            for (
                let experienceIndex = 0;
                experienceIndex < experienceTypes.length;
                experienceIndex++
            ) {
                const type = experienceTypes[experienceIndex];

                const content = buildExperienceContent(data, type);

                await prisma.learningExperience.upsert({
                    where: {
                        id: `${competency.id}-${type.toLowerCase()}`,
                    },
                    update: {
                        title: `${data.title} — ${type}`,
                        description: data.canDo,
                        orderIndex: experienceIndex + 1,
                        content: content as Prisma.InputJsonValue,
                        assessment:
                            type === ExperienceType.MISSION
                                ? {
                                    type: "mission",
                                    competencyCode: data.code,
                                    successCriteria: [
                                        `Can ${data.canDo.toLowerCase()}`,
                                    ],
                                }
                                : Prisma.JsonNull,
                        estimatedMinutes:
                            type === ExperienceType.MISSION ? 7 : 5,
                    },
                    create: {
                        id: `${competency.id}-${type.toLowerCase()}`,
                        competencyId: competency.id,
                        type,
                        title: `${data.title} — ${type}`,
                        description: data.canDo,
                        orderIndex: experienceIndex + 1,
                        content: content as Prisma.InputJsonValue,
                        assessment:
                            type === ExperienceType.MISSION
                                ? {
                                    type: "mission",
                                    competencyCode: data.code,
                                    successCriteria: [
                                        `Can ${data.canDo.toLowerCase()}`,
                                    ],
                                }
                                : Prisma.JsonNull,
                        estimatedMinutes:
                            type === ExperienceType.MISSION ? 7 : 5,
                    },
                });
            }
        }
    }

    // ------------------------------------------------------------
    // 4. PREREQUISITE GRAPH
    // ------------------------------------------------------------

    console.log("\nCreating prerequisite graph...");

    for (const unitData of units) {
        for (const competencyData of unitData.competencies) {
            const competencyId = competencyIds.get(competencyData.code);

            if (!competencyId) {
                throw new Error(
                    `Missing competency ID for ${competencyData.code}`
                );
            }

            for (const prerequisiteCode of competencyData.prerequisites ?? []) {
                const prerequisiteId = competencyIds.get(prerequisiteCode);

                if (!prerequisiteId) {
                    throw new Error(
                        `Prerequisite ${prerequisiteCode} for ${competencyData.code} was not found`
                    );
                }

                await prisma.competencyPrerequisite.upsert({
                    where: {
                        competencyId_prerequisiteId: {
                            competencyId,
                            prerequisiteId,
                        },
                    },
                    update: {},
                    create: {
                        competencyId,
                        prerequisiteId,
                    },
                });
            }
        }
    }

    console.log("✓ Prerequisite graph created");

    // ------------------------------------------------------------
    // 5. MISSIONS
    // ------------------------------------------------------------

    console.log("\n🎯 Creating gateway missions...");

    const gatewayCompetencies = [
        "PA1.GAT.SUR.01",
        "PA1.GAT.INT.01",
        "PA1.GAT.PRO.01",
        "PA1.GAT.MIS.01",
    ];

    for (const code of gatewayCompetencies) {
        const competency = await prisma.competency.findUnique({
            where: { code },
        });

        if (!competency) {
            throw new Error(`Gateway competency ${code} not found`);
        }

        const existingMission = await prisma.mission.findFirst({
            where: {
                competencyId: competency.id,
            },
        });

        if (existingMission) {
            await prisma.mission.update({
                where: {
                    id: existingMission.id,
                },
                data: {
                    title: `${competency.title} Mission`,
                    objective: competency.canDo,
                    scenario:
                        "Complete a short real-life interaction using the language you have learned.",
                    difficulty: competency.difficulty,
                    successCriteria: {
                        competencyCode: competency.code,
                        requirements: [
                            competency.canDo,
                            "Use appropriate basic expressions.",
                            "Complete the communication goal.",
                        ],
                    },
                    configuration: {
                        type: "guided_real_life",
                        allowHints: true,
                        maxAttempts: 3,
                    },
                },
            });
        } else {
            await prisma.mission.create({
                data: {
                    competencyId: competency.id,
                    title: `${competency.title} Mission`,
                    objective: competency.canDo,
                    scenario:
                        "Complete a short real-life interaction using the language you have learned.",
                    difficulty: competency.difficulty,
                    successCriteria: {
                        competencyCode: competency.code,
                        requirements: [
                            competency.canDo,
                            "Use appropriate basic expressions.",
                            "Complete the communication goal.",
                        ],
                    },
                    configuration: {
                        type: "guided_real_life",
                        allowHints: true,
                        maxAttempts: 3,
                    },
                },
            });
        }
    }

    console.log("✓ Gateway missions created");

    // ------------------------------------------------------------
    // 6. SUMMARY
    // ------------------------------------------------------------

    const [
        languageCount,
        courseCount,
        unitCount,
        competencyCount,
        realizationCount,
        vocabularyCount,
        experienceCount,
        prerequisiteCount,
        missionCount,
    ] = await Promise.all([
        prisma.language.count(),
        prisma.course.count(),
        prisma.unit.count(),
        prisma.competency.count(),
        prisma.languageRealization.count(),
        prisma.vocabulary.count(),
        prisma.learningExperience.count(),
        prisma.competencyPrerequisite.count(),
        prisma.mission.count(),
    ]);

    console.log("\n========================================");
    console.log("       ECLA PRE-A1 SEED COMPLETE");
    console.log("========================================");
    console.log(`Languages:             ${languageCount}`);
    console.log(`Courses:              ${courseCount}`);
    console.log(`Units:                 ${unitCount}`);
    console.log(`Competencies:          ${competencyCount}`);
    console.log(`Realizations:          ${realizationCount}`);
    console.log(`Vocabulary:            ${vocabularyCount}`);
    console.log(`Learning Experiences:  ${experienceCount}`);
    console.log(`Prerequisites:         ${prerequisiteCount}`);
    console.log(`Missions:              ${missionCount}`);
    console.log("========================================\n");
}

main()
    .catch((error) => {
        console.error("\nECLA seed failed:");
        console.error(error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });