/**
 * Every picture the site shows: real screens of Forge and its modules on demo data, the same files cognera.cz serves.
 * The wide master is drawn on a flat #f5f5f7 plate; `mobile` is the master for phones. The descriptions are the
 * pictures' alternative text. `forge-plan` is a crop of `forge-step-b` that starts below the task's status bar.
 */
export const SCREEN_DIR = "/assets/media/screens";

const WIDE = { width: 1920, height: 1200 };
const PHONE = { width: 1080, height: 1350 };
const TILE = { width: 1920, height: 960 };
const SQUARE = { width: 1200, height: 1200 };

const step = (name, alt) => ({ file: `${name}.webp`, ...WIDE, mobile: { file: `${name}-mobile.webp`, ...PHONE }, alt });
const tile = (name, alt) => ({ file: `${name}.webp`, ...TILE, mobile: { file: `${name}-mobile.webp`, ...SQUARE }, alt });

export const SCREENS = {
  "forge-review": tile("forge-tile-a", "Úloha ve Forge čeká na kontrolu: tlačítka Approve a Request Changes a pod nimi odškrtnuté úkoly plánu."),

  "forge-step-a": step("forge-step-a", "Zadání úlohy ve Forge: obchodní oddělení chce export objednávek do CSV a popisuje sloupce, formát i to, kdo export smí použít."),
  "forge-step-b": {
    file: "forge-step-b.webp",
    ...WIDE,
    mobile: { file: "forge-step-b-mobile.webp", ...PHONE },
    alt: "Plán úlohy ve Forge čeká na schválení: proč změna vzniká, co se změní a jaký bude mít dopad, s tlačítky Approve Spec a Reject.",
  },
  // The same screen without the task's status bar above it; the phone master has none and is the original's.
  "forge-plan": {
    file: "forge-plan.webp",
    width: 1600,
    height: 1000,
    mobile: { file: "forge-step-b-mobile.webp", ...PHONE },
    alt: "Plán úlohy ve Forge čeká na schválení: proč změna vzniká, co se změní a jaký bude mít dopad, s tlačítky Approve Spec a Reject.",
  },
  "forge-step-c": step("forge-step-c", "Úkoly z plánu ve Forge odškrtnuté jeden po druhém: služba, rozhraní, aplikace a nakonec testy."),
  "forge-step-e": step("forge-step-e", "Temper proklikává hotovou změnu v prohlížeči: kroky testu prošly a u kroku s přidáním zboží do košíku je snímek obrazovky."),
  "forge-merge": tile("forge-tile-d", "Úloha prošla kontrolami a sloučení změn potvrdí vývojář tlačítkem Merge."),

  "bellows-step-c": step("bellows-step-c", "Důkazy z internetu u nápadu v Bellows: u každé citace stav ověření, podpora tvrzení a úryvek ze zdroje."),
  "anvil-step-c": step("anvil-step-c", "Odpovědi na otázky Anvilu: k formátu exportu je vybraná doporučená odpověď CSV pro účetní, vedle ní možnost XLSX a vlastní odpověď."),
  "temper-step-c": step("temper-step-c", "Kroky běhu v Temperu: u každého výsledek PASSED a u kontrolního kroku snímek obrazovky ukázkového obchodu."),
  "rivet-step-d": step("rivet-step-d", "Průběh nasazení v Rivetu: zařazení do fronty, nasazení, ověření, kontrola Temperem a výsledek Ověřeno."),
  "harness-step-b": step("harness-step-b", "Doporučení Harnessu pro běh testu v Temperu: doporučeno, s důvody, proč úloze stačí standardní kvalita."),

  // The modules' story (src/content/story.mjs): the other steps it tells.
  "bellows-step-b": step("bellows-step-b", "Výzkum v Bellows: průběh od přípravy po posouzení příležitostí a dva agenti, každý s vlastním tématem."),
  "bellows-step-e": step("bellows-step-e", "Rozhodnutí o nápadu v Bellows: přijato s důvodem, uložení rozhodnutí a export hotového zadání."),
  "anvil-step-d": step("anvil-step-d", "Navržené nové znění zadání v Anvilu s kritérii přijetí. Tlačítko Continue to write vede k potvrzení zápisu, Discard návrh zahodí."),
  "anvil-step-e": step("anvil-step-e", "Zadání #57 po úpravě a novém rozboru v Anvilu: verdikt Clear, zadání je úplné a rozbor už nenašel nic nejasného."),
  "temper-step-b": step("temper-step-b", "Kontrola nahraného testu v Temperu: devět kroků scénáře z nahrávky, heslo zůstává skryté, a tlačítko pro uložení scénáře."),
  "temper-step-e": step("temper-step-e", "Vizuální snímky v Temperu: nový snímek banneru čeká na schválení, katalog a košík už člověk schválil."),
  "rivet-step-a": step("rivet-step-a", "Plán vydání v Rivetu: prostředí, artefakt a jeho přesná verze, platnost plánu a záznam o schválení plánu i produkce."),
  "rivet-step-c": step("rivet-step-c", "Schválení produkce v Rivetu: spuštění do produkčního prostředí povolí až druhé potvrzení s názvem prostředí."),
  "harness-step-a": step("harness-step-a", "Plán směrování v Harnessu: úlohy z Bellows, Forge a Temperu popsané stejnými poli, složitostí, požadovanou kvalitou a důvodem."),
  "harness-step-c": step("harness-step-c", "Další pokus v Harnessu: výsledek prvního pokusu neprošel ověřením (verifier_failed), proto druhý pokus požaduje vyšší kvalitu."),

};

/** A screen of the manifest by name; throws for a name the manifest does not list. */
export function screen(name) {
  if (!Object.prototype.hasOwnProperty.call(SCREENS, name)) throw new Error(`Unknown screen: ${JSON.stringify(name)}`);
  return SCREENS[name];
}

/** Every file the manifest names, for the build's check that each one is on disk. */
export function screenFiles(screens = SCREENS) {
  return [...new Set(Object.values(screens).flatMap((s) => (s.mobile ? [s.file, s.mobile.file] : [s.file])))].sort();
}
