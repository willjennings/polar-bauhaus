/**
 * The curriculum spine: ordered grammar units in acquisition order, each
 * with scene seeds engineered so the unit's grammar is the natural way to
 * complete the scene's tasks (the adobo scene is the reference pattern).
 * ORIGINAL CONTENT ONLY — never copy published textbook text, dialogues,
 * or exercises here (TAGALOG-PLAY.md A§5). Will maps unit numbers to his
 * physical textbook manually.
 */
import { getScenario, type Scenario } from "./scenarios";

export interface GrammarTarget {
  id: string;
  pattern: string;
  exampleFrames: string[];
}

export interface UnitVocab {
  tl: string;
  en: string;
  tags: string[];
}

/**
 * Spec extension: persona/voice/opening added to the spec's seed schema —
 * a voice scene needs a character and a first line (learner never faces
 * dead air). Flagged in the plan; not a spec change.
 */
export interface SceneSeed {
  id: string;
  persona: string;
  voice: string;
  setting: string;
  why: string;
  propsVocab: string[];
  opening: string;
}

export interface Unit {
  id: string;
  title: string;
  grammarTargets: GrammarTarget[];
  vocab: UnitVocab[];
  registerNotes: string[];
  canDo: string[];
  recycleFrom: string[];
  sceneSeeds: SceneSeed[];
}

/** D5 controlled general taxonomy — exactly these five. */
export const GENERIC_PATTERN_TAGS = [
  "g-ang-ng-confusion",
  "g-aspect",
  "g-enclitic-order",
  "g-word-order",
  "g-vocab",
];

export const CURRICULUM: Unit[] = [
  {
    id: "u01",
    title: "Greetings, po/opo, and saying who you are",
    grammarTargets: [
      {
        id: "g-po-opo",
        pattern: "po/opo in second position for elders and respect",
        exampleFrames: ["Kumusta po kayo?", "Opo, kumain na po ako.", "Salamat po sa pagkain."],
      },
      {
        id: "g-pronoun-basics",
        pattern: "core pronouns ako/ikaw~ka/siya/kayo in greetings and introductions",
        exampleFrames: ["Ako si ___.", "Kumusta ka?", "Mabuti naman ako."],
      },
    ],
    vocab: [
      { tl: "kumusta", en: "how are (you)", tags: ["greeting"] },
      { tl: "mabuti", en: "fine / well", tags: ["greeting"] },
      { tl: "salamat", en: "thank you", tags: ["courtesy"] },
      { tl: "walang anuman", en: "you're welcome", tags: ["courtesy"] },
      { tl: "sige", en: "okay / go ahead", tags: ["courtesy"] },
      { tl: "paalam", en: "goodbye", tags: ["greeting"] },
    ],
    registerNotes: ["Use kayo + po with elders (Lola, Tita); ka without po with peers and kids."],
    canDo: ["Greet an elder with po and answer kumusta", "Introduce myself by name"],
    recycleFrom: [],
    sceneSeeds: [
      {
        id: "s-tawag-lola",
        persona: "the learner's Lola on a phone call from the province, warm, slightly hard of hearing",
        voice: "marin",
        setting: "a phone call to Lola just to say hello and check in",
        why: "greetings and kumusta exchanges force po/opo and pronoun basics on every turn",
        propsVocab: ["kumusta", "mabuti", "salamat"],
        opening: "Hello? Sino ito? Apo! Kumusta ka na, anak?",
      },
      {
        id: "s-bagong-kapitbahay",
        persona: "a friendly older Filipina neighbor meeting the learner at the gate for the first time",
        voice: "marin",
        setting: "meeting the new neighbor, Aling Nena, outside the house",
        why: "first meetings require self-introduction (Ako si ___) and polite po forms",
        propsVocab: ["kumusta", "sige", "paalam"],
        opening: "Uy, hello! Ikaw ba ang bagong kapitbahay? Ako si Aling Nena.",
      },
    ],
  },
  {
    id: "u02",
    title: "Family and identity: si/ang sentences",
    grammarTargets: [
      {
        id: "g-si-ang-identity",
        pattern: "identifying people/things: Si ___ ang ___ / Ito ang ___",
        exampleFrames: ["Si Lia ang asawa ko.", "Ito ang anak namin.", "Si Nanay ang nagluto."],
      },
      {
        id: "g-sino-ano-questions",
        pattern: "sino/ano questions with ang-phrases",
        exampleFrames: ["Sino ang kapatid mo?", "Ano ang pangalan ng anak mo?"],
      },
    ],
    vocab: [
      { tl: "asawa", en: "spouse", tags: ["family"] },
      { tl: "anak", en: "child (one's own)", tags: ["family"] },
      { tl: "kapatid", en: "sibling", tags: ["family"] },
      { tl: "magulang", en: "parent", tags: ["family"] },
      { tl: "pamilya", en: "family", tags: ["family"] },
      { tl: "pangalan", en: "name", tags: ["identity"] },
    ],
    registerNotes: ["Ate/Kuya before an older sibling's (or older peer's) name; never bare first name for elders."],
    canDo: ["Introduce my wife and kids by name and relation", "Ask who someone is in a family photo"],
    recycleFrom: [],
    sceneSeeds: [
      {
        id: "s-family-photos",
        persona: "the learner's Tita flipping through a family photo album with them over coffee",
        voice: "marin",
        setting: "looking through an old family photo album with Tita",
        why: "every photo demands 'Sino ang...?' questions and 'Si ___ ang ___' identifications",
        propsVocab: ["pamilya", "kapatid", "magulang"],
        opening: "Halika, tingnan natin itong lumang album. O, sino ito sa litrato?",
      },
      {
        id: "s-video-call-pinsan",
        persona: "the learner's cousin video-calling from Manila, curious about the learner's family abroad",
        voice: "coral",
        setting: "a video call with a cousin who wants to meet the whole family",
        why: "introducing people on camera forces si/ang identity sentences and family terms",
        propsVocab: ["asawa", "anak", "pangalan"],
        opening: "Uy pinsan! Ang tagal nating hindi nagkita! Sino-sino diyan sa bahay? Ipakilala mo naman sila.",
      },
    ],
  },
  {
    id: "u03",
    title: "Doing things: mag- verbs (actor focus)",
    grammarTargets: [
      {
        id: "g-mag-aspect",
        pattern: "mag- verb aspect: nag- (completed) / nag+CV (incompleted) / mag+CV (contemplated)",
        exampleFrames: ["Nagluto ako ng hapunan kagabi.", "Naglilinis siya tuwing Sabado.", "Magluluto tayo bukas."],
      },
      {
        id: "g-mag-imperative",
        pattern: "friendly commands and invitations with mag-",
        exampleFrames: ["Maglinis ka muna ng kusina.", "Mag-aral tayo mamaya."],
      },
    ],
    vocab: [
      { tl: "magluto", en: "to cook", tags: ["home"] },
      { tl: "maglinis", en: "to clean", tags: ["home"] },
      { tl: "magtrabaho", en: "to work", tags: ["work"] },
      { tl: "mag-aral", en: "to study", tags: ["school"] },
      { tl: "maglaro", en: "to play", tags: ["kids"] },
      { tl: "magbasa", en: "to read", tags: ["leisure"] },
    ],
    registerNotes: ["Soften commands to elders with po; nga and naman soften requests to anyone."],
    canDo: ["Say what I did yesterday and will do tomorrow with mag- verbs", "Invite the family to do something together"],
    recycleFrom: ["u01", "u02"],
    sceneSeeds: [
      {
        id: "s-linggo-plano",
        persona: "the learner's wife planning the family weekend over morning coffee",
        voice: "coral",
        setting: "Saturday-morning planning: who does what this weekend",
        why: "planning talk lives in mag- contemplated forms (magluluto, maglilinis) and invitations",
        propsVocab: ["magluto", "maglinis", "maglaro"],
        opening: "Mahal, weekend na! Ano ang gagawin natin? Sino ang magluluto, sino ang maglilinis?",
      },
      {
        id: "s-chores-split",
        persona: "the learner's Tatay dividing up Saturday chores, checking in as work proceeds",
        voice: "cedar",
        setting: "Saturday chores day: splitting tasks and reporting progress",
        why: "chore talk cycles through mag- imperatives and completed/incompleted aspect (naglinis ka na ba?)",
        propsVocab: ["maglinis", "magtrabaho", "magbasa"],
        opening: "Anak, linis muna tayo. Alin ang gusto mo — maglinis ng sala o maglaba?",
      },
    ],
  },
  {
    id: "u04",
    title: "More doing: -um- verbs (actor focus)",
    grammarTargets: [
      {
        id: "g-um-aspect",
        pattern: "-um- verb aspect: kumain (completed) / kumakain (incompleted) / kakain (contemplated)",
        exampleFrames: ["Kumain ako ng almusal.", "Bumibili kami ng gulay tuwing weekend.", "Uuwi ako nang maaga."],
      },
      {
        id: "g-um-vs-mag",
        pattern: "which everyday verbs take -um- vs mag-",
        exampleFrames: ["Pumunta ako sa trabaho.", "Nagtrabaho ako buong araw."],
      },
    ],
    vocab: [
      { tl: "kumain", en: "to eat", tags: ["food"] },
      { tl: "uminom", en: "to drink", tags: ["food"] },
      { tl: "bumili", en: "to buy", tags: ["errands"] },
      { tl: "pumunta", en: "to go", tags: ["movement"] },
      { tl: "umuwi", en: "to go home", tags: ["movement"] },
      { tl: "tumulong", en: "to help", tags: ["home"] },
    ],
    registerNotes: ["Answering an elder's 'Kumain ka na ba?' takes opo/hindi pa po, not bare oo/hindi."],
    canDo: ["Narrate my morning with -um- verbs", "Say where I went and when I'll come home"],
    recycleFrom: ["u02", "u03"],
    sceneSeeds: [
      {
        id: "s-almusal-kwento",
        persona: "the learner's Nanay at the breakfast table, asking about yesterday and today's plans",
        voice: "marin",
        setting: "breakfast with Nanay: what happened yesterday, what's the plan today",
        why: "day narration cycles -um- verbs through all three aspects (kumain, pumunta, uuwi)",
        propsVocab: ["kumain", "uminom", "umuwi"],
        opening: "O, gising ka na! Kumain ka na ba? Ikwento mo nga — saan ka pumunta kahapon?",
      },
      {
        id: "s-pamilihan",
        persona: "the learner's wife making the shopping list together before a market run",
        voice: "coral",
        setting: "planning the market run: what to buy, where to go, when to be back",
        why: "errand planning forces bumili/pupunta/uuwi contemplated forms and um-vs-mag choices",
        propsVocab: ["bumili", "pumunta", "tumulong"],
        opening: "Beb, pupunta ako sa palengke mamaya. Ano ang bibilhin ko? Sasama ka ba?",
      },
    ],
  },
  {
    id: "u05",
    title: "The little words: ng and sa",
    grammarTargets: [
      {
        id: "g-ng-object",
        pattern: "ng marks the indefinite object of actor-focus verbs",
        exampleFrames: ["Nagluto ako ng adobo.", "Bumili siya ng gatas."],
      },
      {
        id: "g-ng-possession",
        pattern: "ng links possessor: X ng Y = Y's X",
        exampleFrames: ["bahay ng kapatid ko", "laruan ng bunso"],
      },
      {
        id: "g-sa-location",
        pattern: "sa marks location, direction, and recipients",
        exampleFrames: ["Nasa kusina si Nanay.", "Pumunta kami sa palengke.", "Ibigay mo ito sa kanya."],
      },
    ],
    vocab: [
      { tl: "palengke", en: "market", tags: ["errands"] },
      { tl: "kusina", en: "kitchen", tags: ["home"] },
      { tl: "opisina", en: "office", tags: ["work"] },
      { tl: "paaralan", en: "school", tags: ["kids"] },
      { tl: "lamesa", en: "table", tags: ["home"] },
      { tl: "laruan", en: "toy", tags: ["kids"] },
    ],
    registerNotes: ["kina/kay for going to people's places: 'pumunta kami kina Lola'."],
    canDo: ["Mark objects and possession with ng correctly", "Say where things and people are with sa/nasa"],
    recycleFrom: ["u03", "u04"],
    sceneSeeds: [
      {
        id: "s-hanapan",
        persona: "the learner's wife hunting for the kids' lost things before the school run, slightly rushed",
        voice: "coral",
        setting: "morning scramble: finding the kids' shoes, bag, and water bottle around the house",
        why: "a search scene is a sa/nasa machine (Nasa kusina? Sa ilalim ng lamesa?) with ng-possession everywhere (sapatos ng bunso)",
        propsVocab: ["kusina", "lamesa", "laruan"],
        opening: "Mahal, tulungan mo ako! Nasaan ang sapatos ng bunso? Late na tayo sa paaralan!",
      },
      {
        id: "s-palengke-run",
        persona: "the learner's Nanay walking the market with them, pointing out stalls and comparing goods",
        voice: "marin",
        setting: "a trip through the palengke, buying for tonight's dinner",
        why: "market talk pairs -um-/mag- verbs with ng objects (bumili ng isda) and sa stalls/locations",
        propsVocab: ["palengke", "gulay", "isda"],
        opening: "Halika, anak, dito muna tayo sa gulayan. Ano ang bibilhin natin para sa hapunan?",
      },
    ],
  },
  {
    id: "u06",
    title: "Object focus: -in verbs",
    grammarTargets: [
      {
        id: "g-in-aspect",
        pattern: "-in object-focus aspect: kinain (completed) / kinakain (incompleted) / kakainin (contemplated)",
        exampleFrames: ["Kinain ko ang adobo.", "Nililinis niya ang kusina.", "Kakainin natin ang leftover mamaya."],
      },
      {
        id: "g-of-ng-actor",
        pattern: "ng-form actor (ko/mo/niya) with ang-marked patient in object-focus clauses",
        exampleFrames: ["Niluto ko ang hapunan.", "Kinuha mo ba ang susi?"],
      },
      {
        id: "g-af-vs-of-choice",
        pattern: "choose object focus when the object is definite/specific",
        exampleFrames: ["Bumili ako ng mangga. → Binili ko ang mangga na gusto mo.", "Kumain ako ng adobo. → Kinain ko ang adobo ni Nanay."],
      },
    ],
    vocab: [
      { tl: "kainin", en: "to eat (something specific)", tags: ["food"] },
      { tl: "lutuin", en: "to cook (something specific)", tags: ["food"] },
      { tl: "linisin", en: "to clean (something specific)", tags: ["home"] },
      { tl: "kunin", en: "to get / fetch", tags: ["home"] },
      { tl: "bilhin", en: "to buy (something specific)", tags: ["errands"] },
      { tl: "gawin", en: "to do / make", tags: ["general"] },
    ],
    registerNotes: ["po slots after the first word of the predicate: 'Kinain ko na po.'"],
    canDo: ["Narrate what I ate today using object-focus past forms", "Ask what someone will cook using object-focus future"],
    recycleFrom: ["u03", "u04", "u05"],
    sceneSeeds: [
      {
        id: "s-adobo",
        persona: "the learner's Nanay cooking chicken adobo with them in the kitchen, directing every step",
        voice: "marin",
        setting: "kitchen, cooking chicken adobo with Nanay",
        why: "imperatives + object-focus -in verbs occur naturally (hiwain, lutuin, tikman) — the reference seed",
        propsVocab: ["kawali", "sandok", "toyo", "suka", "bawang"],
        opening: "Halika dito sa kusina, magluluto tayo ng adobo. O, kunin mo muna ang toyo at suka.",
      },
      {
        id: "s-ligpit-sala",
        persona: "the learner's wife tidying the living room with them before Tita visits, assigning specific items",
        voice: "coral",
        setting: "speed-cleaning the sala together before a visitor arrives",
        why: "tidying specific objects demands -in forms with ang patients (linisin ang lamesa, kunin ang mga laruan)",
        propsVocab: ["linisin", "kunin", "ayusin"],
        opening: "Mahal, darating si Tita sa isang oras! Kunin mo ang mga laruan, ako ang maglilinis ng lamesa. Kaya natin ito!",
      },
    ],
  },
  {
    id: "u07",
    title: "Giving and washing: i- and -an verbs",
    grammarTargets: [
      {
        id: "g-i-verbs",
        pattern: "i- conveyance focus: ibinigay (completed) / ibinibigay (incompleted) / ibibigay (contemplated)",
        exampleFrames: ["Ibinigay ko ang regalo kay Lia.", "Iabot mo nga ang toyo."],
      },
      {
        id: "g-an-verbs",
        pattern: "-an locative/benefactive focus: hinugasan / hinuhugasan / huhugasan",
        exampleFrames: ["Hinugasan ko na ang mga pinggan.", "Buksan mo ang bintana."],
      },
    ],
    vocab: [
      { tl: "ibigay", en: "to give (something)", tags: ["general"] },
      { tl: "iabot", en: "to hand over", tags: ["home"] },
      { tl: "itago", en: "to put away / keep", tags: ["home"] },
      { tl: "hugasan", en: "to wash (something)", tags: ["home"] },
      { tl: "buksan", en: "to open (something)", tags: ["home"] },
      { tl: "sarhan", en: "to close (something)", tags: ["home"] },
    ],
    registerNotes: ["nga softens requests: 'Iabot mo nga...' ≈ please hand me..."],
    canDo: ["Ask someone to hand or give me things at the table", "Describe washing/opening/closing household things"],
    recycleFrom: ["u04", "u05", "u06"],
    sceneSeeds: [
      {
        id: "s-hapag-abutan",
        persona: "the learner's Tatay at a busy family dinner where everything needs passing",
        voice: "cedar",
        setting: "family dinner: passing dishes, serving the kids, keeping plates full",
        why: "a crowded table runs on iabot/ibigay requests (Iabot mo nga ang kanin) in both directions",
        propsVocab: ["iabot", "ibigay", "kanin"],
        opening: "O, kain na tayo! Iabot mo nga ang kanin — at ibigay mo muna ang ulam sa bunso.",
      },
      {
        id: "s-hugasan-night",
        persona: "the learner's wife doing the after-dinner cleanup with them, trading tasks",
        voice: "coral",
        setting: "after-dinner cleanup: dishes, counters, windows, lights",
        why: "cleanup pairs -an verbs on surfaces and openings (hugasan, punasan, buksan, sarhan) with i- verbs for putting away",
        propsVocab: ["hugasan", "buksan", "sarhan", "itago"],
        opening: "Salamat sa hapunan, mahal. Ako ang maghuhugas — ikaw, itago mo ang mga leftover, tapos sarhan mo ang bintana?",
      },
    ],
  },
  {
    id: "u08",
    title: "The flavor particles: na, pa, din/rin, lang, naman, muna",
    grammarTargets: [
      {
        id: "g-na-pa",
        pattern: "na (already/now) vs pa (still/yet), incl. 'hindi pa'",
        exampleFrames: ["Kumain na ako.", "Hindi pa ako kumakain.", "Tulog na ang mga bata."],
      },
      {
        id: "g-enclitic-placement",
        pattern: "enclitic ordering after first word: na/pa before din/rin; lang/naman/muna placement",
        exampleFrames: ["Kumain na rin ako.", "Sandali lang po.", "Maglilinis muna ako."],
      },
    ],
    vocab: [
      { tl: "na", en: "already / now", tags: ["particle"] },
      { tl: "pa", en: "still / yet", tags: ["particle"] },
      { tl: "din / rin", en: "also / too", tags: ["particle"] },
      { tl: "lang", en: "just / only", tags: ["particle"] },
      { tl: "naman", en: "on the other hand / softener", tags: ["particle"] },
      { tl: "muna", en: "first / for now", tags: ["particle"] },
    ],
    registerNotes: ["naman softens contradiction: 'Okay naman ako' vs bare 'Okay ako'."],
    canDo: ["Say already / not yet naturally in daily talk", "Soften requests and answers with lang/naman/muna"],
    recycleFrom: ["u05", "u06", "u07"],
    sceneSeeds: [
      {
        id: "s-check-in-gabi",
        persona: "the learner's Nanay doing the evening check-in: who has eaten, who is asleep, what is done",
        voice: "marin",
        setting: "evening status check around the house before bed",
        why: "status checks are pure na/pa territory (Kumain ka na ba? Hindi pa. Tulog na sila.)",
        propsVocab: ["na", "pa", "muna"],
        opening: "Anak, gabi na. Kumain ka na ba? At ang mga bata — tulog na ba sila?",
      },
      {
        id: "s-bilin-umaga",
        persona: "the learner's wife trading quick morning reminders as both rush to start the day",
        voice: "coral",
        setting: "the morning rush: reminders, small requests, who does what first",
        why: "rushed logistics force softened requests (sandali lang, ikaw muna, ako na lang) and stacked enclitics",
        propsVocab: ["lang", "naman", "muna"],
        opening: "Beb, sandali lang — kunin mo muna ang bag ng panganay, ako na lang ang magtitimpla ng gatas!",
      },
    ],
  },
  {
    id: "u09",
    title: "Having and wanting: may/wala, gusto/ayaw",
    grammarTargets: [
      {
        id: "g-may-wala",
        pattern: "existential may/mayroon vs wala (+ng linker)",
        exampleFrames: ["May meeting ako bukas.", "Walang gatas sa ref.", "Mayroon pa bang kanin?"],
      },
      {
        id: "g-gusto-ayaw",
        pattern: "gusto/ayaw + ng noun or + linked verb (gusto kong ...)",
        exampleFrames: ["Gusto ko ng kape.", "Gusto kong magluto ng sinigang.", "Ayaw niyang matulog."],
      },
    ],
    vocab: [
      { tl: "mayroon / may", en: "there is / to have", tags: ["general"] },
      { tl: "wala", en: "none / not have", tags: ["general"] },
      { tl: "gusto", en: "to want / like", tags: ["general"] },
      { tl: "ayaw", en: "to not want", tags: ["general"] },
      { tl: "kailangan", en: "to need", tags: ["general"] },
      { tl: "pwede", en: "can / may", tags: ["general"] },
    ],
    registerNotes: ["'Gusto po ninyo ba ng kape?' — offering to elders takes po + ninyo."],
    canDo: ["Say what we have and don't have at home", "Express wants and needs for myself and the kids"],
    recycleFrom: ["u06", "u07", "u08"],
    sceneSeeds: [
      {
        id: "s-ref-imbentaryo",
        persona: "the learner's wife checking the fridge and pantry together to build the grocery list",
        voice: "coral",
        setting: "fridge-and-pantry inventory before grocery day",
        why: "inventory talk is may/wala on every item (May itlog pa ba? Walang gatas!)",
        propsVocab: ["mayroon", "wala", "kailangan"],
        opening: "Mahal, buksan mo nga ang ref — ano pa ang mayroon tayo? Walang gatas, 'di ba?",
      },
      {
        id: "s-order-merienda",
        persona: "the learner's Tita taking everyone's merienda orders before a food run, opinionated about the choices",
        voice: "marin",
        setting: "deciding what merienda to get for the whole family",
        why: "orders and preferences run on gusto/ayaw + ng and linked verbs (gusto kong subukan...)",
        propsVocab: ["gusto", "ayaw", "pwede"],
        opening: "Mga apo, bibili ako ng merienda! Ano ang gusto ninyo — turon, banana cue, o halo-halo?",
      },
    ],
  },
  {
    id: "u10",
    title: "Telling the story: connectors and narration",
    grammarTargets: [
      {
        id: "g-connectors",
        pattern: "kasi, pero, tapos, kapag, habang, pagkatapos linking clauses",
        exampleFrames: ["Na-late ako kasi ma-traffic.", "Pagkatapos kong magtrabaho, nagluto ako.", "Habang nagluluto ako, naglalaro ang mga bata."],
      },
      {
        id: "g-narrative-aspect",
        pattern: "mixing completed + incompleted aspect inside one short narrative",
        exampleFrames: ["Kumakain kami nang dumating si Tita.", "Naglilinis ako nang tumawag ka."],
      },
    ],
    vocab: [
      { tl: "kasi", en: "because", tags: ["connector"] },
      { tl: "pero", en: "but", tags: ["connector"] },
      { tl: "tapos", en: "then / afterwards", tags: ["connector"] },
      { tl: "kapag", en: "when(ever)", tags: ["connector"] },
      { tl: "habang", en: "while", tags: ["connector"] },
      { tl: "pagkatapos", en: "after", tags: ["connector"] },
    ],
    registerNotes: ["kasi often lands second position in speech: 'Na-late kasi ako.'"],
    canDo: ["Tell a 5-sentence story about my day", "Explain why something happened with kasi"],
    recycleFrom: ["u07", "u08", "u09"],
    sceneSeeds: [
      {
        id: "s-kwento-araw",
        persona: "the learner's wife on the couch after the kids are asleep, wanting the full story of the day",
        voice: "coral",
        setting: "evening couch debrief: tell me everything that happened today, in order",
        why: "a day retold in order forces connectors (tapos, kasi, habang) and mixed narrative aspect",
        propsVocab: ["tapos", "kasi", "habang"],
        opening: "Hay, tulog na sila sa wakas. Halika dito — ikwento mo ang buong araw mo. Umpisahan mo sa umaga!",
      },
      {
        id: "s-balita-tita",
        persona: "the learner's Tita hungry for the full story behind some family news, probing for details",
        voice: "marin",
        setting: "retelling a family story to Tita, who keeps asking bakit and ano'ng sumunod",
        why: "retelling under questioning (bakit? tapos?) drills kasi-explanations and sequencing",
        propsVocab: ["kasi", "pero", "pagkatapos"],
        opening: "Uy, narinig ko may nangyari kamakalawa! Ikwento mo nga sa akin — ano ba talaga ang nangyari?",
      },
    ],
  },
];

export function getUnit(id: string): Unit | undefined {
  return CURRICULUM.find((u) => u.id === id);
}

export function unitIndex(id: string): number {
  return CURRICULUM.findIndex((u) => u.id === id);
}

/** Units the learner has acquired: u01 through currentUnit, inclusive. */
export function acquiredUnits(currentUnitId: string): Unit[] {
  const i = unitIndex(currentUnitId);
  return i === -1 ? [] : CURRICULUM.slice(0, i + 1);
}

/** Closed tag set the feedback tagger may use at this point in the spine. */
export function allowedPatternTags(currentUnitId: string): string[] {
  const targetTags = acquiredUnits(currentUnitId).flatMap((u) =>
    u.grammarTargets.map((t) => t.id)
  );
  return [...new Set([...targetTags, ...GENERIC_PATTERN_TAGS])];
}

/** Default Taglish-dial level per unit (D3 ratio curve; Will tunes). */
export function defaultLevelForUnit(id: string): number {
  const i = unitIndex(id);
  if (i < 0) return 3;
  if (i < 2) return 2;   // u01–u02
  if (i < 5) return 3;   // u03–u05
  if (i < 8) return 4;   // u06–u08
  return 5;              // u09–u10
}

export function getSeed(seedId: string): { unit: Unit; seed: SceneSeed } | undefined {
  for (const unit of CURRICULUM) {
    const seed = unit.sceneSeeds.find((s) => s.id === seedId);
    if (seed) return { unit, seed };
  }
  return undefined;
}

/** Deterministic rotation: the seed after lastSeedId in unit order (wraps). */
export function pickSeed(unitId: string, lastSeedId: string | null): SceneSeed | undefined {
  const unit = getUnit(unitId);
  if (!unit || unit.sceneSeeds.length === 0) return undefined;
  const last = lastSeedId ? unit.sceneSeeds.findIndex((s) => s.id === lastSeedId) : -1;
  return unit.sceneSeeds[(last + 1) % unit.sceneSeeds.length];
}

/** Adapts a seed into the Scenario shape buildInstructions() consumes unchanged. */
export function seedToScenario(seed: SceneSeed, unit: Unit): Scenario {
  return {
    id: seed.id,
    title: unit.title,
    emoji: "🎬",
    description: seed.setting,
    voice: seed.voice,
    scene:
      `You are ${seed.persona}. The scene: ${seed.setting}. ` +
      `Run the scene so its natural tasks require the learner to respond, decide, and act. ` +
      `Season the dialogue with these words when natural: ${seed.propsVocab.join(", ")}.`,
    opening: seed.opening,
  };
}

/**
 * Resolves an id from session history to a Scenario, whether it's a curated
 * SCENARIOS entry or a curriculum scene seed (seeds aren't in SCENARIOS, so
 * plain getScenario lookups against seed ids miss and fall back to raw ids).
 */
export function resolveScenario(id: string): Scenario | undefined {
  const hit = getSeed(id);
  if (hit) return seedToScenario(hit.seed, hit.unit);
  return getScenario(id);
}

/** Returns human-readable constraint violations; empty array = valid. */
export function validateCurriculum(units: Unit[]): string[] {
  const errors: string[] = [];
  const ids = units.map((u) => u.id);
  const sorted = [...ids].sort();
  if (ids.join() !== sorted.join()) errors.push("units are not strictly ordered by id");
  units.forEach((u, i) => {
    if (i >= 2 && u.recycleFrom.length === 0)
      errors.push(`${u.id}: recycleFrom is mandatory for u03+`);
    for (const r of u.recycleFrom) {
      if (ids.indexOf(r) === -1 || ids.indexOf(r) >= i)
        errors.push(`${u.id}: recycleFrom '${r}' must reference an earlier unit`);
    }
    for (const t of u.grammarTargets) {
      if (t.exampleFrames.length < 2)
        errors.push(`${u.id}/${t.id}: needs >=2 example frames`);
    }
    if (u.sceneSeeds.length < 2) errors.push(`${u.id}: needs >=2 scene seeds`);
    if (u.vocab.length === 0) errors.push(`${u.id}: vocab must not be empty`);
    if (u.canDo.length === 0) errors.push(`${u.id}: canDo must not be empty`);
  });
  const seedIds = units.flatMap((u) => u.sceneSeeds.map((s) => s.id));
  if (new Set(seedIds).size !== seedIds.length) errors.push("scene seed ids must be globally unique");
  return errors;
}
