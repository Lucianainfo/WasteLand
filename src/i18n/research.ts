import type { Lang } from './translations'

type HypothesisId = 'H1a' | 'H1b' | 'H2a' | 'H2b'
type RuleId = 'A' | 'B' | 'C' | 'A2'

export interface ResearchTexts {
  eyebrow: string
  title: string
  subtitle: string
  simulationBanner: string

  hypEyebrow: string
  hypTitle1: string
  hypTitle2: string
  /** {date} */
  hypIntro: string
  hyp: Record<HypothesisId, { title: string; text: string }>
  target: string
  observed: string
  interval: string
  /** {n} */
  cellsWon: string
  verdict: { supported: string; partial: string; notSupported: string }
  hypNote: string

  benchEyebrow: string
  benchTitle1: string
  benchTitle2: string
  /** {trials}, {cells} */
  benchNote: string
  colMethod: string
  colRescued: string
  colRevenue: string
  colSurplus: string
  colKg: string
  method: Record<RuleId, { name: string; desc: string }>

  findingsTitle: string
  /** {a} {b} {c} {d} {e} {f} are filled from benchmark.json */
  findings: [string, string, string, string]

  sweepTitle: string
  /** {best} */
  sweepNote: string
  colGamma: string
  colVsProduction: string
  ablationTitle: string
  ablationNote: string
  colBoost: string
  colVsB: string
  sensTitle: string
  sensNote: string
  colAssumption: string
  colVsA: string
  colRescuedShort: string
  colRevenueShort: string

  roiEyebrow: string
  roiTitle1: string
  roiTitle2: string
  roiIntro: string
  fItems: string
  fPrice: string
  fDays: string
  fDisposal: string
  colWhat: string
  colItemsDay: string
  colMonth: string
  colYear: string
  colYearEur: string
  rowBin: string
  /** {rate} */
  rowPlatform: string
  /** {mdl} {eur} {pct} {items} */
  roiSummary: string
  disposalLine: string
  /** {rate} */
  breakEven: string
  roiNotes: string[]

  costTitle: string
  costIntro: string
  colScenario: string
  colSessions: string
  colCommands: string
  colBill: string
  costRows: [string, string, string]
  costNotes: string[]

  limitsTitle: string
  limits: string[]
  repoNote: string
}

const en: ResearchTexts = {
  eyebrow: 'Research',
  title: 'The proof',
  subtitle: 'Does a price that falls with the evening really rescue more food and recover more money? We tested it before claiming it.',
  simulationBanner: 'Everything on this page comes from a simulation with assumed customers, not from real venues. There is no sales data yet; a pilot with one bakery is the missing experiment.',

  hypEyebrow: 'Pre-registered hypotheses',
  hypTitle1: 'Four claims,',
  hypTitle2: 'four honest answers',
  hypIntro: 'The hypotheses, the decision rule and the demand scenarios were written on {date}, before the simulation was run. The targets were proposed by the supervisor and were not adjusted afterwards.',
  hyp: {
    H1a: { title: 'Portions rescued vs a fixed 50% discount', text: 'Last-call pricing raises the share of portions sold by at least 25%.' },
    H1b: { title: 'Portions rescued vs a linear markdown', text: 'Last-call pricing raises the share of portions sold by at least 25% over a straight 30% → 70% line.' },
    H2a: { title: 'Revenue recovered vs a fixed 50% discount', text: 'Last-call pricing raises the venue’s revenue per evening by at least 18%.' },
    H2b: { title: 'Revenue recovered vs a linear markdown', text: 'Last-call pricing raises the venue’s revenue per evening by at least 18% over a straight 30% → 70% line.' },
  },
  target: 'Target',
  observed: 'Observed',
  interval: '95% interval',
  cellsWon: 'Better in {n} of 9 scenarios',
  verdict: { supported: 'Supported', partial: 'Partially supported', notSupported: 'Not supported' },
  hypNote: '“Partially supported” means the improvement is real (its interval is above zero) but smaller than the target. The result is reported in these words whichever way it lands.',

  benchEyebrow: 'Benchmark',
  benchTitle1: 'Four pricing rules,',
  benchTitle2: 'the same customers',
  benchNote: '{trials} simulated venue-evenings across {cells} demand scenarios. Every rule sells to exactly the same customers. Averages over all scenarios.',
  colMethod: 'Pricing rule',
  colRescued: 'Portions rescued',
  colRevenue: 'Revenue per evening',
  colSurplus: 'Customer surplus',
  colKg: 'Food rescued',
  method: {
    A: { name: 'Fixed 50% off', desc: 'One price all evening.' },
    B: { name: 'Linear 30% → 70%', desc: 'A straight markdown line.' },
    C: { name: 'WasteLand', desc: '30% → 70% along p^1.3, plus a boost for unsold stock.' },
    A2: { name: 'Fixed 67% off', desc: 'The surprise-bag price: one third of the value.' },
  },

  findingsTitle: 'What the numbers say',
  findings: [
    'Against a fixed 50% discount, last-call pricing rescues {a}% more portions and recovers {b}% more money, in all nine demand scenarios. That is real, but smaller than the 25% and 18% targets.',
    'Against a straight linear markdown the gap is at most {c}% on both measures. The p^1.3 curve on its own does not beat the line; the boost for unsold stock is what adds rescued portions.',
    'WasteLand rescues {d}% fewer portions than a deep fixed discount of 67% (the surprise-bag price), but recovers {e}% more revenue than it. Last-call pricing maximises money; a deep discount maximises food rescued.',
    'The exponent 1.3 is not a sharp optimum: every exponent from 1.0 to 1.6 gives the same revenue within {f}%.',
  ],

  sweepTitle: 'Why 1.3? The exponent sweep',
  sweepNote: 'Revenue and portions rescued for different exponents of the curve (boost kept). The highest revenue is at γ = {best}, but its closest neighbours (1.0 and 1.6) cannot be told apart from it.',
  colGamma: 'Exponent γ',
  colVsProduction: 'Revenue vs γ = 1.3',
  ablationTitle: 'Which ingredient does the work?',
  ablationNote: 'Each row removes or changes one ingredient. Compared with the linear baseline (first row).',
  colBoost: 'Boost',
  colVsB: 'vs linear',
  sensTitle: 'How much depends on the assumptions?',
  sensNote: 'One assumption is changed at a time. If nobody waits for the price to fall, a fixed 50% discount earns more than WasteLand.',
  colAssumption: 'Changed assumption',
  colVsA: 'vs fixed 50%',
  colRescuedShort: 'Rescued',
  colRevenueShort: 'Revenue',

  roiEyebrow: 'For venues',
  roiTitle1: 'What a bakery',
  roiTitle2: 'gets back',
  roiIntro: 'The reference venue is a bakery with 15 unsold items a day at 60 MDL. Move the sliders to your own venue. The food is already baked, so its cost is gone; every leu recovered is gain.',
  fItems: 'Unsold items per day',
  fPrice: 'Full price per item (MDL)',
  fDays: 'Trading days per month',
  fDisposal: 'Disposal cost avoided (€ per kg, placeholder)',
  colWhat: 'If the venue…',
  colItemsDay: 'Items rescued / day',
  colMonth: 'MDL / month',
  colYear: 'MDL / year',
  colYearEur: '€ / year',
  rowBin: 'Throws it away',
  rowPlatform: 'Uses a surprise-bag app (67% off, {rate}% commission)',
  roiSummary: 'At these settings the venue recovers about {mdl} MDL a month (about €{eur}), {pct}% of the retail value of the food it would have thrown away, and rescues {items} items a day.',
  disposalLine: 'If binning costs the venue the placeholder rate above, avoiding it saves a further €{eur} a month. Replace the rate with the figure on your own waste invoice.',
  breakEven: 'A commission above about {rate}% would make a fixed 67% discount with no commission earn more than WasteLand.',
  roiNotes: [
    'The commission rates of 25% and 30% were given by the supervisor. Too Good To Go’s own pages only say that partners pay an annual fee plus a commission that varies by country, so these rates are not verified.',
    'Revenue per item comes from the simulation, scaled linearly to your venue. Real demand will differ; the pilot is how to find out.',
    'Payment happens at the counter, so the venue pays no card fees. Packaging and staff time for handing over the food are not included.',
  ],

  costTitle: 'What it costs to run WasteLand',
  costIntro: 'The prototype costs nothing: Vercel’s Hobby plan and Upstash’s free tier. But the Hobby plan is for non-commercial use only, so a pilot that takes money from venues needs at least Vercel Pro (USD 20 a month excluding VAT, per vercel.com/pricing).',
  colScenario: 'Traffic',
  colSessions: 'Visits / month',
  colCommands: 'Redis commands',
  colBill: 'Bill / month',
  costRows: ['Demo (competition jury)', 'Pilot, steady evening traffic', 'Pilot, busy all day'],
  costNotes: [
    'The globe endpoint alone costs 56 Redis commands each time its 60-second cache refreshes (28 cities × 2 commands). Under steady traffic that passes Upstash’s free 500,000 commands a month; the overage is a few dollars.',
    'Raising that cache time would cut those commands proportionally. It is a product decision (the globe would be less fresh), so it has not been changed.',
  ],

  limitsTitle: 'What this study cannot show',
  limits: [
    'How real customers behave. The arrival rate, willingness to pay and patience are assumptions, tested over nine scenarios and six variations, not measured.',
    'That 1.3 is the best possible exponent. It is compared only with its neighbours, under assumed demand.',
    'Anything about no-shows, staff time, or whether venues would cook differently if they expect to sell leftovers.',
  ],
  repoNote: 'Code, the pre-registration, the raw results and the lab logbook are in the repository: research/ and docs/moldsef/.',
}

const ro: ResearchTexts = {
  eyebrow: 'Cercetare',
  title: 'Dovada',
  subtitle: 'Un preț care scade pe parcursul serii salvează într-adevăr mai multă mâncare și recuperează mai mulți bani? Am testat înainte să afirmăm.',
  simulationBanner: 'Tot ce vezi pe această pagină vine dintr-o simulare cu clienți presupuși, nu din localuri reale. Nu există încă date de vânzări; un pilot cu o brutărie este experimentul care lipsește.',

  hypEyebrow: 'Ipoteze preînregistrate',
  hypTitle1: 'Patru afirmații,',
  hypTitle2: 'patru răspunsuri sincere',
  hypIntro: 'Ipotezele, regula de decizie și scenariile de cerere au fost scrise pe {date}, înainte de rularea simulării. Pragurile au fost propuse de coordonator și nu au fost modificate ulterior.',
  hyp: {
    H1a: { title: 'Porții salvate față de reducerea fixă de 50%', text: 'Prețul „ultimul apel” crește cu cel puțin 25% ponderea porțiilor vândute.' },
    H1b: { title: 'Porții salvate față de reducerea liniară', text: 'Prețul „ultimul apel” crește cu cel puțin 25% ponderea porțiilor vândute față de o dreaptă 30% → 70%.' },
    H2a: { title: 'Venit recuperat față de reducerea fixă de 50%', text: 'Prețul „ultimul apel” crește cu cel puțin 18% venitul localului pe seară.' },
    H2b: { title: 'Venit recuperat față de reducerea liniară', text: 'Prețul „ultimul apel” crește cu cel puțin 18% venitul localului pe seară față de o dreaptă 30% → 70%.' },
  },
  target: 'Prag',
  observed: 'Observat',
  interval: 'Interval 95%',
  cellsWon: 'Mai bun în {n} din 9 scenarii',
  verdict: { supported: 'Confirmată', partial: 'Parțial confirmată', notSupported: 'Neconfirmată' },
  hypNote: '„Parțial confirmată” înseamnă că îmbunătățirea este reală (intervalul ei e peste zero), dar mai mică decât pragul. Rezultatul e raportat cu aceste cuvinte oricum ar ieși.',

  benchEyebrow: 'Comparație',
  benchTitle1: 'Patru reguli de preț,',
  benchTitle2: 'aceiași clienți',
  benchNote: '{trials} seri de local simulate în {cells} scenarii de cerere. Fiecare regulă vinde exact acelorași clienți. Medii pe toate scenariile.',
  colMethod: 'Regula de preț',
  colRescued: 'Porții salvate',
  colRevenue: 'Venit pe seară',
  colSurplus: 'Surplusul clientului',
  colKg: 'Mâncare salvată',
  method: {
    A: { name: 'Reducere fixă 50%', desc: 'Un singur preț toată seara.' },
    B: { name: 'Liniar 30% → 70%', desc: 'O dreaptă de reducere.' },
    C: { name: 'WasteLand', desc: '30% → 70% după p^1,3, plus un bonus pentru stocul nevândut.' },
    A2: { name: 'Reducere fixă 67%', desc: 'Prețul pachetului-surpriză: o treime din valoare.' },
  },

  findingsTitle: 'Ce spun cifrele',
  findings: [
    'Față de reducerea fixă de 50%, prețul „ultimul apel” salvează cu {a}% mai multe porții și recuperează cu {b}% mai mulți bani, în toate cele nouă scenarii de cerere. E real, dar mai mic decât pragurile de 25% și 18%.',
    'Față de o reducere liniară simplă diferența este de cel mult {c}% la ambele măsuri. Curba p^1,3 singură nu bate dreapta; bonusul pentru stocul nevândut este cel care adaugă porții salvate.',
    'WasteLand salvează cu {d}% mai puține porții decât o reducere fixă adâncă de 67% (prețul pachetului-surpriză), dar recuperează cu {e}% mai mult venit decât ea. Prețul „ultimul apel” maximizează banii; o reducere adâncă maximizează mâncarea salvată.',
    'Exponentul 1,3 nu este un optim ascuțit: orice exponent între 1,0 și 1,6 dă același venit cu o diferență de cel mult {f}%.',
  ],

  sweepTitle: 'De ce 1,3? Variația exponentului',
  sweepNote: 'Venitul și porțiile salvate pentru exponenți diferiți ai curbei (bonusul rămâne). Venitul maxim e la γ = {best}, dar cei mai apropiați vecini (1,0 și 1,6) nu se pot deosebi de el.',
  colGamma: 'Exponent γ',
  colVsProduction: 'Venit față de γ = 1,3',
  ablationTitle: 'Ce ingredient face treaba?',
  ablationNote: 'Fiecare rând scoate sau schimbă un ingredient. Comparație cu reducerea liniară (primul rând).',
  colBoost: 'Bonus',
  colVsB: 'față de liniar',
  sensTitle: 'Cât depinde de presupuneri?',
  sensNote: 'Se schimbă o presupunere pe rând. Dacă nimeni nu așteaptă ca prețul să scadă, o reducere fixă de 50% câștigă mai mult decât WasteLand.',
  colAssumption: 'Presupunere schimbată',
  colVsA: 'față de fix 50%',
  colRescuedShort: 'Salvate',
  colRevenueShort: 'Venit',

  roiEyebrow: 'Pentru localuri',
  roiTitle1: 'Ce primește înapoi',
  roiTitle2: 'o brutărie',
  roiIntro: 'Localul de referință e o brutărie cu 15 produse nevândute pe zi, la 60 MDL. Mută cursoarele pe localul tău. Mâncarea e deja coaptă, deci costul ei s-a dus; fiecare leu recuperat e câștig.',
  fItems: 'Produse nevândute pe zi',
  fPrice: 'Preț întreg pe produs (MDL)',
  fDays: 'Zile lucrătoare pe lună',
  fDisposal: 'Cost de eliminare evitat (€ pe kg, valoare provizorie)',
  colWhat: 'Dacă localul…',
  colItemsDay: 'Produse salvate / zi',
  colMonth: 'MDL / lună',
  colYear: 'MDL / an',
  colYearEur: '€ / an',
  rowBin: 'Aruncă mâncarea',
  rowPlatform: 'Folosește o aplicație cu pachete-surpriză (reducere 67%, comision {rate}%)',
  roiSummary: 'Cu aceste setări localul recuperează aproximativ {mdl} MDL pe lună (circa {eur} €), adică {pct}% din valoarea de vânzare a mâncării pe care ar fi aruncat-o, și salvează {items} produse pe zi.',
  disposalLine: 'Dacă aruncarea costă localul tariful provizoriu de mai sus, evitarea ei economisește încă {eur} € pe lună. Înlocuiește tariful cu cifra din factura ta de deșeuri.',
  breakEven: 'Un comision de peste {rate}% ar face ca o reducere fixă de 67% fără comision să câștige mai mult decât WasteLand.',
  roiNotes: [
    'Comisioanele de 25% și 30% au fost indicate de coordonator. Paginile Too Good To Go spun doar că partenerii plătesc o taxă anuală plus un comision care diferă de la țară la țară, deci aceste procente nu sunt verificate.',
    'Venitul pe produs vine din simulare, scalat liniar la localul tău. Cererea reală va fi diferită; pilotul e modul de a afla.',
    'Plata se face la tejghea, deci localul nu plătește comisioane de card. Ambalajul și timpul angajatului pentru predare nu sunt incluse.',
  ],

  costTitle: 'Cât costă să rulezi WasteLand',
  costIntro: 'Prototipul nu costă nimic: planul Hobby Vercel și nivelul gratuit Upstash. Dar planul Hobby e doar pentru uz necomercial, deci un pilot care încasează bani de la localuri are nevoie măcar de Vercel Pro (20 USD pe lună, fără TVA, conform vercel.com/pricing).',
  colScenario: 'Trafic',
  colSessions: 'Vizite / lună',
  colCommands: 'Comenzi Redis',
  colBill: 'Factură / lună',
  costRows: ['Demo (juriul concursului)', 'Pilot, trafic constant seara', 'Pilot, aglomerat toată ziua'],
  costNotes: [
    'Doar endpoint-ul globului costă 56 de comenzi Redis la fiecare reîmprospătare a cache-ului de 60 de secunde (28 de orașe × 2 comenzi). La trafic constant depășește cele 500.000 de comenzi gratuite Upstash pe lună; depășirea costă câțiva dolari.',
    'Mărirea timpului de cache ar reduce proporțional aceste comenzi. E o decizie de produs (globul ar fi mai puțin proaspăt), deci nu a fost schimbată.',
  ],

  limitsTitle: 'Ce nu poate arăta acest studiu',
  limits: [
    'Cum se comportă clienții reali. Ritmul sosirilor, disponibilitatea de a plăti și răbdarea sunt presupuneri, testate pe nouă scenarii și șase variante, nu măsurate.',
    'Că 1,3 este cel mai bun exponent posibil. E comparat doar cu vecinii lui, la o cerere presupusă.',
    'Nimic despre clienții care nu vin, timpul angajaților sau dacă localurile ar găti altfel știind că vând restul.',
  ],
  repoNote: 'Codul, preînregistrarea, rezultatele brute și caietul de laborator sunt în repository: research/ și docs/moldsef/.',
}

const ru: ResearchTexts = {
  eyebrow: 'Исследование',
  title: 'Доказательство',
  subtitle: 'Действительно ли цена, падающая к вечеру, спасает больше еды и возвращает больше денег? Мы проверили это, прежде чем утверждать.',
  simulationBanner: 'Всё на этой странице получено в симуляции с предполагаемыми покупателями, а не в реальных заведениях. Данных о продажах пока нет; пилот с одной пекарней — недостающий эксперимент.',

  hypEyebrow: 'Предварительно зарегистрированные гипотезы',
  hypTitle1: 'Четыре утверждения,',
  hypTitle2: 'четыре честных ответа',
  hypIntro: 'Гипотезы, правило решения и сценарии спроса записаны {date}, до запуска симуляции. Пороги предложил руководитель, позже они не менялись.',
  hyp: {
    H1a: { title: 'Спасённые порции против фиксированной скидки 50%', text: 'Цена «последнего звонка» повышает долю проданных порций не менее чем на 25%.' },
    H1b: { title: 'Спасённые порции против линейной уценки', text: 'Цена «последнего звонка» повышает долю проданных порций не менее чем на 25% по сравнению с прямой 30% → 70%.' },
    H2a: { title: 'Возвращённая выручка против фиксированной скидки 50%', text: 'Цена «последнего звонка» повышает выручку заведения за вечер не менее чем на 18%.' },
    H2b: { title: 'Возвращённая выручка против линейной уценки', text: 'Цена «последнего звонка» повышает выручку заведения за вечер не менее чем на 18% по сравнению с прямой 30% → 70%.' },
  },
  target: 'Порог',
  observed: 'Результат',
  interval: 'Интервал 95%',
  cellsWon: 'Лучше в {n} из 9 сценариев',
  verdict: { supported: 'Подтверждена', partial: 'Подтверждена частично', notSupported: 'Не подтверждена' },
  hypNote: '«Подтверждена частично» значит, что улучшение реальное (его интервал выше нуля), но меньше порога. Результат записывается этими словами при любом исходе.',

  benchEyebrow: 'Сравнение',
  benchTitle1: 'Четыре правила цены,',
  benchTitle2: 'одни и те же покупатели',
  benchNote: '{trials} смоделированных вечеров заведения в {cells} сценариях спроса. Каждое правило продаёт одним и тем же покупателям. Средние по всем сценариям.',
  colMethod: 'Правило цены',
  colRescued: 'Спасённые порции',
  colRevenue: 'Выручка за вечер',
  colSurplus: 'Выгода покупателя',
  colKg: 'Спасённая еда',
  method: {
    A: { name: 'Фиксированная скидка 50%', desc: 'Одна цена весь вечер.' },
    B: { name: 'Линейно 30% → 70%', desc: 'Прямая линия уценки.' },
    C: { name: 'WasteLand', desc: '30% → 70% по p^1,3 плюс надбавка за непроданный запас.' },
    A2: { name: 'Фиксированная скидка 67%', desc: 'Цена «сюрприз-пакета»: треть стоимости.' },
  },

  findingsTitle: 'Что говорят цифры',
  findings: [
    'По сравнению с фиксированной скидкой 50% цена «последнего звонка» спасает на {a}% больше порций и возвращает на {b}% больше денег — во всех девяти сценариях спроса. Это реально, но меньше порогов 25% и 18%.',
    'По сравнению с простой линейной уценкой разница не более {c}% по обоим показателям. Кривая p^1,3 сама по себе не лучше прямой; порции спасает надбавка за непроданный запас.',
    'WasteLand спасает на {d}% меньше порций, чем глубокая фиксированная скидка 67% (цена сюрприз-пакета), но возвращает на {e}% больше выручки, чем она. «Последний звонок» максимизирует деньги, глубокая скидка — спасённую еду.',
    'Показатель 1,3 — не острый оптимум: любой показатель от 1,0 до 1,6 даёт ту же выручку с точностью до {f}%.',
  ],

  sweepTitle: 'Почему 1,3? Перебор показателя',
  sweepNote: 'Выручка и спасённые порции для разных показателей кривой (надбавка сохраняется). Максимум выручки при γ = {best}, но ближайшие значения (1,0 и 1,6) от него неотличимы.',
  colGamma: 'Показатель γ',
  colVsProduction: 'Выручка к γ = 1,3',
  ablationTitle: 'Какой элемент работает?',
  ablationNote: 'В каждой строке убран или изменён один элемент. Сравнение с линейной уценкой (первая строка).',
  colBoost: 'Надбавка',
  colVsB: 'к линейной',
  sensTitle: 'Насколько всё зависит от допущений?',
  sensNote: 'Меняется по одному допущению. Если никто не ждёт снижения цены, фиксированная скидка 50% приносит больше, чем WasteLand.',
  colAssumption: 'Изменённое допущение',
  colVsA: 'к фикс. 50%',
  colRescuedShort: 'Спасено',
  colRevenueShort: 'Выручка',

  roiEyebrow: 'Для заведений',
  roiTitle1: 'Что возвращает',
  roiTitle2: 'пекарня',
  roiIntro: 'Эталонное заведение — пекарня с 15 непроданными изделиями в день по 60 леев. Подвиньте ползунки под своё заведение. Еда уже испечена, её себестоимость потрачена; каждый возвращённый лей — прибыль.',
  fItems: 'Непроданных изделий в день',
  fPrice: 'Полная цена изделия (MDL)',
  fDays: 'Рабочих дней в месяце',
  fDisposal: 'Сэкономленная стоимость утилизации (€ за кг, условная)',
  colWhat: 'Если заведение…',
  colItemsDay: 'Спасено изделий / день',
  colMonth: 'MDL / месяц',
  colYear: 'MDL / год',
  colYearEur: '€ / год',
  rowBin: 'Выбрасывает еду',
  rowPlatform: 'Использует приложение сюрприз-пакетов (скидка 67%, комиссия {rate}%)',
  roiSummary: 'При этих настройках заведение возвращает около {mdl} MDL в месяц (около {eur} €) — {pct}% розничной стоимости еды, которую пришлось бы выбросить, и спасает {items} изделий в день.',
  disposalLine: 'Если выбрасывание стоит заведению условную ставку выше, его отказ экономит ещё {eur} € в месяц. Замените ставку цифрой из своего счёта за вывоз отходов.',
  breakEven: 'Комиссия выше примерно {rate}% сделала бы фиксированную скидку 67% без комиссии выгоднее WasteLand.',
  roiNotes: [
    'Комиссии 25% и 30% назвал руководитель. На страницах Too Good To Go сказано лишь, что партнёры платят годовой взнос и комиссию, которая зависит от страны, поэтому эти проценты не проверены.',
    'Выручка с изделия получена в симуляции и линейно пересчитана на ваше заведение. Реальный спрос будет другим; узнать его поможет пилот.',
    'Оплата происходит на кассе, поэтому заведение не платит комиссию за карты. Упаковка и время сотрудника на выдачу не учтены.',
  ],

  costTitle: 'Сколько стоит запуск WasteLand',
  costIntro: 'Прототип ничего не стоит: план Hobby у Vercel и бесплатный уровень Upstash. Но Hobby — только для некоммерческого использования, поэтому пилоту, который берёт деньги с заведений, нужен хотя бы Vercel Pro (20 USD в месяц без НДС по данным vercel.com/pricing).',
  colScenario: 'Трафик',
  colSessions: 'Визитов / месяц',
  colCommands: 'Команд Redis',
  colBill: 'Счёт / месяц',
  costRows: ['Демо (жюри конкурса)', 'Пилот, ровный вечерний трафик', 'Пилот, загрузка весь день'],
  costNotes: [
    'Один только эндпоинт глобуса тратит 56 команд Redis при каждом обновлении 60-секундного кэша (28 городов × 2 команды). При ровном трафике он превышает бесплатные 500 000 команд Upstash в месяц; превышение стоит несколько долларов.',
    'Увеличение времени кэша пропорционально сократит эти команды. Это продуктовое решение (глобус будет менее свежим), поэтому оно не менялось.',
  ],

  limitsTitle: 'Чего это исследование показать не может',
  limits: [
    'Как ведут себя реальные покупатели. Поток прихода, готовность платить и терпеливость — допущения, проверенные на девяти сценариях и шести вариантах, а не измеренные.',
    'Что 1,3 — лучший возможный показатель. Он сравнивается только с соседними значениями при предполагаемом спросе.',
    'Ничего о тех, кто не пришёл, о времени сотрудников и о том, станут ли заведения готовить иначе, зная, что остатки продадут.',
  ],
  repoNote: 'Код, предварительная регистрация, сырые результаты и лабораторный журнал находятся в репозитории: research/ и docs/moldsef/.',
}

export const researchTexts: Record<Lang, ResearchTexts> = { en, ro, ru }
