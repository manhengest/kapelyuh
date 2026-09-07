import { pluralizeUkrainian } from '@shared/lib/pluralize';

export const strings = {
  appName: 'Капелюх',
  home: {
    newGame: 'Нова гра',
    rules: 'Як грати',
    settings: 'Налаштування',
    about: 'Про додаток',
    tagline: 'Весела гра для компанії',
    openSettings: 'Відкрити налаштування',
  },
  common: {
    next: 'Далі',
    start: 'Почати',
    back: 'Назад',
    done: 'Готово',
    skip: 'Пропустити',
    understand: 'Зрозуміло',
    placeholder: 'Екран у розробці',
  },
  setup: {
    title: 'Нова гра',
    teamsTitle: 'Команди',
    wordCount: 'Кількість слів',
    turnDuration: 'Час ходу',
    teamCount: 'Команди',
    difficulty: 'Рівень',
    skipPenalty: 'Штраф за пропуск слова',
    skipPenaltyNone: 'Без штрафу',
    skipPenaltyMinusOne: '−1 бал за пропуск',
    difficultyEasy: 'Легкий',
    difficultyMedium: 'Середній',
    difficultyHard: 'Важкий',
    teamPlaceholder: 'Назва команди',
    wordSetNote: 'Один набір слів грається за 3 раунди',
    teamHint: 'Натисни на назву, щоб змінити',
    wordSet: 'Набір слів',
    wordSourceBundled: 'Базовий набір',
    wordSourceCustom: 'Свій капелюх',
    customHatHint: 'Гравці по черзі додають слова. Коли їх буде достатньо, починаємо гру.',
    customWordCountNote: 'Ці слова напишуть гравці',
  },
  buildingHat: {
    title: 'Заповнимо капелюх',
    subtitle: 'Напишіть слова, з якими хочете грати',
    placeholder: 'Напишіть слово...',
    add: 'Додати',
    passPhone: 'Передавайте телефон по черзі',
    readyTitle: 'Капелюх готовий ✅',
    readyCount: (count: number) => {
      const wordsWord = pluralizeUkrainian(count, {
        one: 'слово',
        few: 'слова',
        many: 'слів',
      });
      return `${count} ${wordsWord} додано`;
    },
    readyNote: 'Тепер ці слова будуть використовуватися у всіх трьох раундах.',
    startGame: 'Почати гру',
    duplicate: 'Це слово вже є в капелюсі',
    earlyFinish: 'Досить, починаємо',
  },
  rounds: {
    elias: 'ЕЛІАС',
    crocodile: 'КРОКОДИЛ',
    association: 'АСОЦІАЦІЯ',
    roundLabel: (n: number, total: number) => `Раунд ${n} з ${total}`,
    teamTurn: 'Хід команди',
    eliasHint: 'Поясни слова, не називаючи саме слово',
    crocodileHint: 'Показуй слово жестами та мімікою',
    associationHint: 'Пояснюй одним асоціативним словом',
    forbidden: 'ЗАБОРОНЕНО',
    eliasForbidden: ['жести та міміка', 'однокореневі слова', 'переклад іноземною'],
    crocodileForbidden: [
      'вимовляти слова та будь-які звуки',
      'вказувати на людей та предмети',
      'використовувати предмети',
    ],
    associationForbidden: ['однокореневі слова', 'міміку та жести', 'більше одного слова'],
    carryOverContinues: (name: string) => `Команда ${name} продовжує`,
    carryOverTimeLeft: (sec: number) => `Залишилось ${sec} сек`,
    hatRemaining: (count: number) => {
      const wordsWord = pluralizeUkrainian(count, {
        one: 'слово',
        few: 'слова',
        many: 'слів',
      });
      return `В капелюсі ${count} ${wordsWord}`;
    },
  },
  turn: {
    guess: 'Вгадав',
    skip: 'Пропустити',
    wordForAll: 'СЛОВО ДЛЯ ВСІХ',
    pause: 'Пауза',
  },
  pause: {
    title: 'Гру зупинено',
    round: (name: string) => `Тур: ${name}`,
    team: (name: string) => `Команда: ${name}`,
    exit: 'Вийти',
    resume: 'Продовжити',
  },
  award: {
    title: 'Кому віддати слово?',
    nobody: 'Ніхто не вгадав',
  },
  review: {
    timeUp: 'Час вичерпано',
    hatEmpty: 'Капелюх пустий',
    pointsAwarded: 'Нараховано балів',
    confirmStop: 'Завершити матч?',
    emptyTurn: 'На жаль, ваша команда не вгадала жодного слова в цьому раунді.',
    nextTeam: 'Наступна команда',
    nextRound: 'Наступний тур',
    matchResults: 'Результати гри',
  },
  results: {
    matchComplete: 'Гру завершено',
    congrats: 'Вітаємо команди!',
    playAgain: 'Зіграти ще!',
    tableRound: 'Тур',
    tableTotal: '🏅',
    tableTeam: 'Команда',
    tableTotalLabel: 'Всього',
    tableRoundLegend: 'Тури: Еліас · Крокодил · Асоціація',
    winnerLabel: 'Переможці',
    tieLabel: 'Нічия',
    friendshipWins: 'Перемогла дружба 🤗',
    roundLabels: {
      elias: 'Еліас',
      crocodile: 'Крокодил',
      association: 'Асоціація',
    },
    pointsUnit: (points: number) =>
      pluralizeUkrainian(points, {
        one: 'бал',
        few: 'бали',
        many: 'балів',
      }),
    recap: {
      screenTitle: 'Підсумки гри',
      next: 'Далі',
      skip: 'Пропустити',
      fastestTitle: 'Найшвидший мозок',
      hardestTitle: 'Найважче слово',
      slowestTitle: 'Це було боляче',
      bestTurnTitle: 'Найпродуктивніший хід',
      closeTitle: 'Оце була заруба',
      blowoutTitle: 'Без шансів',
      summaryTitle: 'Статистика гри',
      onWord: 'На слово',
      spent: 'витратили',
      spentAll: 'витратили всього',
      quotedWord: (word: string) => `«${word}»`,
      hardestSkips: (count: number) => {
        const timesWord = pluralizeUkrainian(count, {
          one: 'раз',
          few: 'рази',
          many: 'разів',
        });
        return `Пропустили ${count} ${timesWord}`;
      },
      hardestAttempt: (index: number) => `Відгадали лише з ${index}-ї спроби`,
      bestTurnTeam: (teamName: string) => `Команда «${teamName}»`,
      bestTurnCaption: (count: number) => {
        const wordsWord = pluralizeUkrainian(count, {
          one: 'слово',
          few: 'слова',
          many: 'слів',
        });
        return `${wordsWord} за один хід`;
      },
      scoreGapCaption: (gap: number) => {
        const pointsWord = pluralizeUkrainian(gap, {
          one: 'бал',
          few: 'бали',
          many: 'балів',
        });
        return `${pointsWord} різниці між командами`;
      },
      secondsUnit: (seconds: number) =>
        pluralizeUkrainian(seconds, {
          one: 'секунду',
          few: 'секунди',
          many: 'секунд',
        }),
      durationLabel: 'Ця гра тривала',
      guessedLabel: 'Відгадано',
      skippedLabel: 'Пропущено',
      turnsLabel: 'Зіграно ходів',
      durationValue: (durationMs: number) => {
        const totalSeconds = Math.max(0, Math.round(durationMs / 1000));
        if (totalSeconds < 60) {
          const secWord = pluralizeUkrainian(totalSeconds, {
            one: 'секунду',
            few: 'секунди',
            many: 'секунд',
          });
          return `${totalSeconds} ${secWord}`;
        }

        if (totalSeconds < 3600) {
          const minutes = Math.floor(totalSeconds / 60);
          const minWord = pluralizeUkrainian(minutes, {
            one: 'хвилину',
            few: 'хвилини',
            many: 'хвилин',
          });
          return `${minutes} ${minWord}`;
        }

        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const hourWord = pluralizeUkrainian(hours, {
          one: 'годину',
          few: 'години',
          many: 'годин',
        });
        if (minutes === 0) {
          return `${hours} ${hourWord}`;
        }
        const minWord = pluralizeUkrainian(minutes, {
          one: 'хвилину',
          few: 'хвилини',
          many: 'хвилин',
        });
        return `${hours} ${hourWord} ${minutes} ${minWord}`;
      },
      guessedValue: (count: number) => {
        const wordsWord = pluralizeUkrainian(count, {
          one: 'слово',
          few: 'слова',
          many: 'слів',
        });
        return `${count} ${wordsWord}`;
      },
      skippedValue: (count: number) => {
        const wordsWord = pluralizeUkrainian(count, {
          one: 'слово',
          few: 'слова',
          many: 'слів',
        });
        return `${count} ${wordsWord}`;
      },
      turnsValue: (count: number) => `${count}`,
      cardProgress: (index: number, total: number) => `Картка ${index} з ${total}`,
    },
  },
  settings: {
    title: 'Налаштування',
    sectionPlay: 'У грі',
    sectionScore: 'Рахунок',
    sectionApp: 'Застосунок',
    sound: 'Звук',
    soundDescription: 'Звукові ефекти під час гри',
    haptics: 'Вібрація',
    hapticsDescription: 'Тактильний відгук на дії',
    sentry: 'Звіти про збої',
    sentryDescription: 'Анонімні звіти для покращення стабільності',
    skipPenalty: 'Штраф за пропуск',
    skipPenaltyDescription: '−1 бал за пропуск, рахунок ходу не нижче 0',
    about: 'Про гру',
    play: 'Грати',
  },
  about: {
    title: 'Про гру',
    summaryTitle: 'Коротко',
    facts: [
      {
        title: 'Один телефон',
        body: 'Передавайте пристрій між командами. Інтернет не потрібен.',
      },
      {
        title: 'Три тури',
        body: 'Еліас, Крокодил, Асоціація — ті самі слова в капелюсі.',
      },
      {
        title: 'Без зайвого',
        body: 'Немає реклами, акаунтів і покупок.',
      },
    ],
    version: (version: string) => `Версія ${version}`,
    privacy: 'Політика конфіденційності',
  },
  privacy: {
    title: 'Політика конфіденційності',
    headerTitle: 'Конфіденційність',
    updated: 'Останнє оновлення: червень 2026',
    sections: [
      {
        title: 'Загальні положення',
        body: '«Капелюх» — офлайн-гра. Ми не збираємо персональні дані, не створюємо акаунти і не продаємо інформацію третім сторонам.',
      },
      {
        title: 'Дані на пристрої',
        body: 'Налаштування гри, активна сесія та історія матчів зберігаються лише на вашому iPhone. Ви можете видалити їх, видаливши застосунок.',
      },
      {
        title: 'Звіти про збої',
        body: 'За вашою згодою (увімкнено в налаштуваннях) застосунок може надсилати анонімні звіти про збої через Sentry. Звіти не містять імен команд, слів чи іншого ігрового контенту.',
      },
      {
        title: 'Контакти',
        body: 'Питання щодо конфіденційності: manhengest@gmail.com',
      },
    ],
  },
  rules: {
    skipAll: 'Все зрозуміло',
    wantToPlay: 'Хочу грати!',
    basics: {
      title: 'Базові правила',
      items: [
        'Діліться на рівні команди. Ходите по черзі — кожен пояснює слова своїй команді.',
        'Один телефон передається між гравцями. Не показуй слово іншим!',
        'Якщо слово не вгадали — воно повертається до капелюха.',
      ],
      calloutLabel: 'Увага',
      callout: 'Той самий набір слів проходить три тури з різними правилами.',
    },
    explain: {
      title: 'Як пояснювати?',
      intro: 'Три тури, ті самі слова:',
      rounds: [
        {
          key: 'elias',
          name: 'Еліас',
          body: 'Поясни слово словами. Без однокореневих слів і перекладу.',
        },
        {
          key: 'crocodile',
          name: 'Крокодил',
          body: 'Поясни слово лише жестами. Без звуків.',
        },
        {
          key: 'association',
          name: 'Асоціація',
          body: 'Поясни одним асоціативним словом. Без однокореневих і перекладу.',
        },
      ],
      tipLabel: 'Порада',
      tip: 'Чим знайоміші слова до третього туру, тим веселіше!',
    },
    scoring: {
      title: 'Хто перемагає?',
      guess: 'за кожне вгадане слово',
      skip: 'за пропуск, якщо штраф увімкнено',
      winner: 'Перемагає команда з найбільшою сумою балів.',
      calloutLabel: 'Увага',
      callout: 'Якщо час вийшов на слові — воно стає «Словом для всіх».',
    },
    prep: {
      title: 'Перед грою',
      body: 'Збери друзів, поділись на команди (мінімум 2×2), обери налаштування — і грай!',
      tipLabel: 'Порада',
      tip: 'Краще грати в тихому колі, щоб усі чули пояснювача.',
    },
    customHat: {
      title: 'Свій капелюх',
      body: 'У «Новій грі» оберіть «Свій капелюх». Гравці по черзі пишуть слова на одному телефоні.',
      tipLabel: 'Порада',
      tip: 'Пишіть слова зі своєї компанії: імена, жарти, меми, ніяких обмежень.',
    },
    emptyHat: {
      title: 'Капелюх пустий',
      items: [
        {
          title: 'Слова закінчились',
          body: 'Команди переходять до наступного раунду.',
        },
        {
          title: 'Час ще є',
          body: 'Команда забирає залишок часу в наступний раунд.',
        },
      ],
    },
  },
} as const;

export const ROUND_DISPLAY_NAMES = {
  elias: strings.rounds.elias,
  crocodile: strings.rounds.crocodile,
  association: strings.rounds.association,
} as const;
