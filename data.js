/**
 * tabemasen — Translation & Selection Data
 * ========================================
 *
 * This file is the source of truth for all card content.
 * Edit here to add allergens, change phrasing, or extend languages.
 *
 * Structure:
 *   CARD_DATA.allergens    — individual allergens with Japanese translations
 *   CARD_DATA.patterns     — dietary patterns with statements + implied exclusions
 *   CARD_DATA.ui          — UI strings (greetings, buttons, labels)
 *   CARD_DATA.card        — card template strings (greeting, closing, etc.)
 *
 * URL hash format (parseable by app.js hashUtils):
 *   #a=peanut,wheat&p=vegetarian&s=severe&n=Name
 *   a = comma-separated allergen keys
 *   p = comma-separated pattern keys (multi-select)
 *   s = severe (omitted for default)
 *   n = URL-encoded name
 */

window.CARD_DATA = (function () {
  'use strict';

  // ─────────────────────────────────────────────────────────────────────────
  // ALLERGENS — Japan's 8 mandatory + common others
  // ─────────────────────────────────────────────────────────────────────────
  const allergens = [
    // ── Mandatory (表示義務) ──────────────────────────────────────────────
    { key: 'shrimp',     japanese: 'えび',                          english: 'Shrimp' },
    { key: 'crab',       japanese: 'かに',                            english: 'Crab' },
    { key: 'wheat',      japanese: '小麦',                            english: 'Wheat' },
    { key: 'buckwheat',  japanese: 'そば',                            english: 'Buckwheat' },
    { key: 'egg',        japanese: '卵',                              english: 'Egg' },
    { key: 'dairy',      japanese: '乳製品(牛乳、チーズ、バター)',      english: 'Dairy' },
    { key: 'peanut',     japanese: '落花生(ピーナッツ)',              english: 'Peanut' },
    { key: 'walnut',     japanese: 'くるみ',                          english: 'Walnut' },
    // ── Common additional ─────────────────────────────────────────────────
    { key: 'almond',     japanese: 'アーモンド',                      english: 'Almond' },
    { key: 'cashew',     japanese: 'カシューナッツ',                  english: 'Cashew' },
    { key: 'pistachio',  japanese: 'ピスタチオ',                      english: 'Pistachio' },
    { key: 'soy',        japanese: '大豆',                            english: 'Soy' },
    { key: 'sesame',     japanese: 'ごま',                            english: 'Sesame' },
    { key: 'fish',       japanese: '魚(さけ、さば、まぐろなど)',       english: 'Fish' },
    { key: 'shellfish',  japanese: '貝類(あさり、ホタテなど)',          english: 'Shellfish' },
    { key: 'chicken',    japanese: '鶏肉',                            english: 'Chicken' },
    { key: 'beef',       japanese: '牛肉',                            english: 'Beef' },
    { key: 'pork',       japanese: '豚肉',                            english: 'Pork' },
    { key: 'gelatin',    japanese: 'ゼラチン',                        english: 'Gelatin' },
    { key: 'kiwi',       japanese: 'キウイフルーツ',                    english: 'Kiwi' },
    { key: 'peach',      japanese: 'もも',                            english: 'Peach' },
    { key: 'apple',      japanese: 'りんご',                          english: 'Apple' },
    { key: 'mushroom',   japanese: 'きのこ全般',                       english: 'Mushrooms' },
  ];

  // ─────────────────────────────────────────────────────────────────────────
  // DIETARY PATTERNS
  // ─────────────────────────────────────────────────────────────────────────
  const patterns = [
    {
      key:          'vegetarian',
      label_en:     'Vegetarian',
      statement:    '私はベジタリアンです。',
      statement_en: 'I am vegetarian.',
      exclusions:   ['肉', '魚', '鶏肉', 'ハム', 'ベーコン', '魚介類'],
      exclusions_en:['meat', 'fish', 'chicken', 'ham', 'bacon', 'seafood'],
      note:         '※だし(特にかつおだし、煮干しだし)にもご注意ください。野菜だしや昆布だしは大丈夫です。',
      note_en:      'Please note: dashi (especially bonito and sardine stock) is in many dishes. Vegetable and kombu (kelp) stock are fine.',
    },
    {
      key:          'vegan',
      label_en:     'Vegan',
      statement:    '私はビーガン(完全菜食主義)です。',
      statement_en: 'I am vegan (no animal products).',
      exclusions:   ['肉', '魚', '鶏肉', '卵', '乳製品', 'はちみつ', 'ゼラチン'],
      exclusions_en:['meat', 'fish', 'chicken', 'egg', 'dairy', 'honey', 'gelatin'],
      note:         '※だし(かつおだし、煮干しだし)も食べません。野菜だしや昆布だしは大丈夫です。',
      note_en:      'I also avoid dashi (bonito, sardine). Vegetable and kombu stock are fine.',
    },
    {
      key:          'pescatarian',
      label_en:     'Pescatarian',
      statement:    '私はペスカタリアンです。魚は食べますが、肉と鶏肉は食べません。',
      statement_en: 'I am pescatarian. I eat fish but not meat or poultry.',
      exclusions:   ['肉', '鶏肉', 'ハム', 'ベーコン'],
      exclusions_en:['meat', 'chicken', 'ham', 'bacon'],
      note:         null,
      note_en:      null,
    },
    {
      key:          'halal',
      label_en:     'Halal',
      statement:    '私はハラル食を守っています。',
      statement_en: 'I follow a halal diet.',
      exclusions:   ['豚肉', 'ハム', 'ベーコン', 'アルコール', 'みりん', '料理酒', 'ラード'],
      exclusions_en:['pork', 'ham', 'bacon', 'alcohol', 'mirin', 'cooking sake', 'lard'],
      note:         '※醤油やみそにも少量のアルコールが含まれることがありますのでご注意ください。',
      note_en:      'Note: soy sauce and miso may contain small amounts of alcohol.',
    },
    {
      key:          'kosher',
      label_en:     'Kosher',
      statement:    '私はコーシャ(ユダヤ教の食事規定)を守っています。',
      statement_en: 'I follow kosher dietary laws.',
      exclusions:   ['豚肉', '貝類', 'えび', 'かに', 'いか', 'たこ'],
      exclusions_en:['pork', 'shellfish', 'shrimp', 'crab', 'squid', 'octopus'],
      note:         '※肉と乳製品を一緒に食べることもできません。',
      note_en:      'Meat and dairy cannot be combined.',
    },
    {
      key:          'gluten-free',
      label_en:     'Gluten-free',
      statement:    'グルテン(小麦、大麦、ライ麦)を食べることができません。',
      statement_en: 'I cannot eat gluten (wheat, barley, rye).',
      exclusions:   ['小麦', '大麦', 'ライ麦', '麺類(うどん、ラーメン、そうめん)', 'てんぷら', 'お好み焼き', '麦茶（むぎ茶）', '麦芽（モルト）'],
      exclusions_en:['wheat', 'barley', 'rye', 'noodles (udon, ramen, somen)', 'tempura', 'okonomiyaki', 'barley tea (mugicha)', 'malt (used in some seasonings)'],
      note:         '※醤油には小麦が含まれていることが多いので、たまり醤油やグルテンフリー醤油をお願いします。調理器具やフライパン、揚げ油も分けていただけると助かります。微量のグルテンでも反応します。',
      note_en:      'Soy sauce often contains wheat — please use tamari or gluten-free soy sauce. Please also use separate cookware, pans, and frying oil. Even trace amounts of gluten cause a reaction.',
    },
  ];

  // ─────────────────────────────────────────────────────────────────────────
  // CARD CONTENT
  // ─────────────────────────────────────────────────────────────────────────
  const card = {
    // Greeting line
    greetingDefault: 'すみません、お願いがあります。',
    greetingWithName: 'すみません、私は{{NAME}}と申します。お願いがあります。',

    // Restriction statements
    statementAllergy:      '食物アレルギーがあります。',
    statementSevereAllergy:'重度の食物アレルギーがあります。',
    statementPreference:   '食事制限があります。',

    // List header
    listHeader: '以下のものを食べることができません:',

    // Severity warning — only shown when s=severe
    // FIX: was '重度のアレルギーー' (doubled long-vowel mark) — corrected to 'アレルギー'
    severityWarning: '⚠ 重度のアレルギーで、少量でも命に関わります。\n調理器具や油も分けていただけると助かります。',

    // Closing
    question: 'これらが含まれていない料理はありますか?',
    thanks:   'ご協力ありがとうございます。',

    // English equivalents
    greetingDefault_en:      'Excuse me, I have a request.',
    greetingWithName_en:     'Excuse me, my name is {{NAME}}. I have a request.',
    statementAllergy_en:     'I have food allergies.',
    statementSevereAllergy_en: 'I have severe food allergies.',
    statementPreference_en:  'I have dietary restrictions.',
    listHeader_en:           'I cannot eat the following:',
    severityWarning_en:      '⚠ My allergy is severe — even small amounts can be life-threatening. Please use separate utensils and oil.',
    question_en:             'Are there any dishes that don\'t contain these?',
    thanks_en:               'Thank you for your help.',

    // Disclaimer — appears on card below Japanese
    disclaimer: 'This card was machine-generated. Please verify with the restaurant. Severe allergy sufferers should travel with a doctor\'s note in Japanese.',
    siteUrl:    'tabemasen.io',
  };

  // ─────────────────────────────────────────────────────────────────────────
  // UI STRINGS
  // ─────────────────────────────────────────────────────────────────────────
  const ui = {
    siteTitle:   'tabemasen',
    siteTagline: 'Show this to your waiter',

    headingAllergens:  'Allergens',
    headingDiet:        'Diet',
    headingSeverity:   'Severity',
    headingOptional:    'Optional',

    severityAllergy:      'Allergy (medical)',
    severitySevereAllergy:'Severe allergy',

    patternNone: 'None',

    labelCustomItem:    'Custom item',
    placeholderCustomItem: 'Paste any text (in any language) as-is on the card',
    labelName:           'Your first name (optional)',
    placeholderName:     'e.g. Sarah',

    btnCopyLink:    'Copy Link',
    btnDownload:    'Download PNG',
    btnPrint:       'Print',
    btnClear:       'Clear All',
    btnCopied:      'Copied!',

    previewLabel:   'Your card preview',

    footerDisclaimer: 'Translations are checked against common Japanese restaurant phrasing but are not a substitute for medical advice or professional translation. If you have a life-threatening allergy, please carry an EpiPen and a doctor\'s letter.',
    footerCredit:    'Built by a fellow traveller',
  };

  // ─────────────────────────────────────────────────────────────────────────
  // HELPERS
  // ─────────────────────────────────────────────────────────────────────────

  function getAllergen(key) {
    return allergens.find(function (a) { return a.key === key; }) || null;
  }

  function getPattern(key) {
    return patterns.find(function (p) { return p.key === key; }) || null;
  }

  /**
   * Build the full card as an array of line objects:
   *   [{ text: string, kind: 'greeting'|'statement'|'list-header'|'item'|'blank'|'warning'|'note'|'closing'|'disclaimer' }]
   *
   * The kind field lets the renderer apply per-line styling without string-sniffing.
   */
  function buildCard(state) {
    var lines = [];
    var patternObjs = (state.patterns || []).map(getPattern).filter(Boolean);
    var hasAllergens = state.allergens.length > 0;
    var hasCustom = !!(state.customText && state.customText.trim());

    function push(ja, en, kind) { lines.push({ ja: ja, en: en, kind: kind || 'body' }); }
    function blank() { lines.push({ ja: '', en: '', kind: 'blank' }); }

    // ── Greeting ──────────────────────────────────────────────────────────
    if (state.name && state.name.trim()) {
      var n = state.name.trim();
      push(card.greetingWithName.replace('{{NAME}}', n), card.greetingWithName_en.replace('{{NAME}}', n), 'greeting');
    } else {
      push(card.greetingDefault, card.greetingDefault_en, 'greeting');
    }

    // ── Restriction statement ────────────────────────────────────────────
    if (hasAllergens) {
      push(
        state.severity === 'severe' ? card.statementSevereAllergy : card.statementAllergy,
        state.severity === 'severe' ? card.statementSevereAllergy_en : card.statementAllergy_en,
        'statement'
      );
    } else if (patternObjs.length > 0 || hasCustom) {
      push(card.statementPreference, card.statementPreference_en, 'statement');
    }

    // ── Dietary pattern statements ───────────────────────────────────────
    patternObjs.forEach(function (p) {
      push(p.statement, p.statement_en, 'statement');
    });

    // ── Bulleted list ────────────────────────────────────────────────────
    push(card.listHeader, card.listHeader_en, 'list-header');

    var seen = {};
    state.allergens.forEach(function (key) {
      var a = getAllergen(key);
      if (a && !seen[a.japanese]) {
        seen[a.japanese] = true;
        push('・' + a.japanese, '• ' + a.english, 'item');
      }
    });

    patternObjs.forEach(function (patternObj) {
      if (patternObj.exclusions) {
        patternObj.exclusions.forEach(function (ex, i) {
          if (!seen[ex]) {
            seen[ex] = true;
            var enEx = patternObj.exclusions_en ? (patternObj.exclusions_en[i] || ex) : ex;
            push('・' + ex, '• ' + enEx, 'item');
          }
        });
      }
    });

    if (hasCustom) {
      push('★ ' + state.customText.trim() + ' (お客様による入力)', '★ ' + state.customText.trim() + ' (custom item)', 'item');
    }

    // ── Severity warning ─────────────────────────────────────────────────
    if (state.severity === 'severe' && hasAllergens) {
      blank();
      push(card.severityWarning, card.severityWarning_en, 'warning');
    }

    // ── Pattern-specific notes ───────────────────────────────────────────
    patternObjs.forEach(function (patternObj) {
      if (patternObj.note) {
        blank();
        push(patternObj.note, patternObj.note_en || '', 'note');
      }
    });

    // ── Closing ──────────────────────────────────────────────────────────
    blank();
    push(card.question, card.question_en, 'closing');
    push(card.thanks, card.thanks_en, 'closing');

    // ── Disclaimer ───────────────────────────────────────────────────────
    blank();
    push(card.disclaimer, '', 'disclaimer');
    push(card.siteUrl, '', 'site-url');

    return lines;
  }

  return {
    allergens:      allergens,
    patterns:       patterns,
    card:           card,
    ui:             ui,
    getAllergen:    getAllergen,
    getPattern:     getPattern,
    buildCard:      buildCard,
  };

}());