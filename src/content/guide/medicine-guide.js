/**
 * お薬ガイド — the long-form guide linked from the footer.
 *
 * Imported from お薬ガイド_医薬品情報とご注文方法.md. Edited only here: the
 * page, its contents list and its FAQ structured data are all built from this
 * file, so a heading cannot appear in one and not the others.
 *
 * Block types: p (optional trailing `link`), h3, list, steps, figure.
 *
 * ## What was changed from the source document, and why
 *
 * 1. 「お薬ショップ」 and 「医薬品ショップ」 are RETIRED BRAND NAMES — see
 *    RETIRED_BRANDS in lib/seo.js, which exists to stop pre-rebrand copy
 *    reaching a title or a search result. The source used both as ordinary
 *    nouns, including in the welcome line. Replaced with メディカ丸 or a
 *    neutral phrase. The keyword block at the top of the source is SEO
 *    working notes, not page copy, and is not carried over at all.
 *
 * 2. The ordering steps said 「ご希望の支払い方法を選択します」. Checkout
 *    offers no choice: paymentMethod is a hidden field fixed to bank_transfer
 *    and the chooser was removed on 2026-10-07 (constants/checkout.js). A
 *    guide that promises a selection screen which does not exist is wrong on
 *    the one page meant to remove surprises, so that step describes what is
 *    actually shown.
 *
 * 3. The returns answer said 「返品・交換が可能です」. The terms say
 *    返金または再送 for breakage or a wrong item, and that opened medicines
 *    cannot be returned at all (第16条・第17条). Reworded to match, and
 *    linked, rather than stating a softer policy than the one that binds.
 *
 * ## The figures
 *
 * Captured fresh from the site rather than taken from the source document.
 * Half of the document's screenshots were Chrome's English auto-translation
 * of the Japanese pages, and its confirmation-screen shot carried a live
 * order number and the company's bank account details. See
 * scripts/guide-images.mjs.
 */

/**
 * Where the page lives, percent-encoded.
 *
 * The route directory is named 「お薬-ガイド」 so it is readable in the tree,
 * but every URL we WRITE — the canonical tag, the sitemap entry, the footer
 * link — comes from here. absoluteUrl() only concatenates, so passing the raw
 * characters would put unencoded UTF-8 into a canonical tag and an XML
 * sitemap; encoding it once, in one place, is what keeps them agreeing.
 *
 * `encodeURI('/お薬-ガイド')`.
 */
export const GUIDE_PATH = '/%E3%81%8A%E8%96%AC-%E3%82%AC%E3%82%A4%E3%83%89';

const content = {
  title: 'お薬ガイド：医薬品情報とご注文方法',

  intro: [
    {
      type: 'p',
      text: 'お薬は、さまざまな健康状態の管理や症状の緩和を助け、正しく使用すれば治療をサポートするなど、医療において重要な役割を果たしています。',
    },
    {
      type: 'p',
      text: 'メディカ丸へようこそ。お薬の通販をご検討中の方も、海外医薬品をお探しの方も、購入前にわかりやすいお薬の情報を確認したい方も、このガイドが一つひとつのステップをご案内します。薬の使用方法を解説し、オンラインで医薬品の商品一覧をご覧になる際に押さえておきたいポイントもご紹介します。',
    },
  ],

  sections: [
    {
      id: 'what-are-medicines',
      heading: 'お薬とは？',
      blocks: [
        {
          type: 'p',
          text: 'お薬とは、疾病や健康状態を予防・診断・管理・治療するために調製された物質です。特定の薬理作用をもたらす有効成分が1つ、または複数含まれていることがあります。また、安定性や外観、使いやすさを保つために、添加物（不活性成分）と呼ばれる成分が含まれていることもあります。',
        },
        {
          type: 'p',
          text: '医薬品は、剤形や含有量、パッケージなど様々な形で提供されています。どの製品が適しているかは、使用目的やご自身の健康状態、併用している他の薬、専門家による医学的アドバイスなどによって異なります。',
        },
        {
          type: 'p',
          text: 'ご注文の前に、商品ページをよくお読みいただき、ご自身に合った製品かどうかをご確認いただくことをおすすめします。',
        },
      ],
    },

    {
      id: 'types',
      heading: 'お薬の種類',
      blocks: [
        {
          type: 'p',
          text: '薬の種類を理解しておくと、医薬品の商品一覧の中から目的の製品を見つけやすくなります。薬は、用途や服用方法によって、一般的に次のように分類されます。',
        },
        {
          type: 'list',
          items: [
            '経口薬：錠剤、カプセル、液剤など、口から服用するもの。',
            '外用薬：クリーム、ジェル、ローション、セラムなど、肌や頭皮に使用するもの。',
            '日常ケア製品：日々の健康習慣をサポートするアイテム。',
            'ブランド品とジェネリック医薬品：先発製品と、それより低価格な同等品。',
          ],
        },
        {
          type: 'p',
          text: '取り扱っている製品はすべて、カテゴリーごとにご覧いただけます。各商品には詳細ページが用意されているため、製品同士を比較しながらお選びいただけます。',
          link: { href: '/category', label: 'カテゴリーから探す' },
        },
        {
          type: 'figure',
          src: '/guide/categories.webp',
          width: 1400,
          height: 656,
          alt: 'メディカ丸のカテゴリー一覧ページ。ED・男性の健康、AGA・薄毛、ダイエット・体重管理、女性の健康、スキンケア・美容、メンタルヘルス・睡眠などのカテゴリーがアイコン付きで並んでいる。',
          caption: '目的やお悩みからカテゴリーを選んで商品をお探しいただけます。',
        },
      ],
    },

    {
      id: 'ingredients',
      heading: '薬の成分と薬の効果',
      blocks: [
        {
          type: 'p',
          text: 'すべての商品に薬の成分が記載されています。有効成分とは、主な薬の効果をもたらす成分のことです。薬によっては、同じ有効成分を含んでいても、ブランド名や含有量、剤形、添加物が異なる場合があります。',
        },
        {
          type: 'figure',
          src: '/guide/product-info.webp',
          width: 1376,
          height: 742,
          alt: '商品ページの「医薬品情報」表。有効成分、使用目的、推奨用量、主なメリット、保管方法が項目ごとに記載されている。',
          caption: '各商品ページの「医薬品情報」に、有効成分から保管方法までをまとめています。',
        },
        {
          type: 'p',
          text: '薬の成分の表示を確認する際は、以下の点をチェックしましょう。',
        },
        {
          type: 'list',
          items: [
            '成分名とその含有量',
            '製品に記載された使用目的',
            '剤形',
            'ブランド名だけに頼らず、関連する注意事項も確認すること',
          ],
        },
        {
          type: 'p',
          text: 'お薬の効果は、製品や個人差によって一人ひとり異なる場合があります。お薬は症状の緩和や健康状態の管理に役立つことがありますが、その効果が保証されるものではありません。そのため、当店では一般的な使用目的のみをご案内し、特定の効果を保証する表現は行いません。',
        },
      ],
    },

    {
      id: 'precautions',
      heading: 'お薬の副作用、注意点、薬の飲み合わせについて',
      blocks: [
        {
          type: 'p',
          text: '医薬品は、人によってお薬の副作用が生じる場合があるため、どのような症状に注意すべきかを知っておくことが大切です。医薬品の安全性を保つためにも、薬を使用する前に添付文書や商品ページをよくお読みいただき、異常を感じた場合は使用を中止し、専門家にご相談ください。',
        },
        {
          type: 'figure',
          src: '/guide/product-precautions.webp',
          width: 1376,
          height: 1790,
          alt: '商品ページの「副作用」と「使用上の注意」。よくある副作用の一覧と、使用を避けるべき場合などの注意事項が並んでいる。',
          caption: '商品ページには「副作用」と「使用上の注意」も掲載しています。ご注文の前に必ずご確認ください。',
        },
        {
          type: 'p',
          text: '以下の薬の注意点を押さえておきましょう。',
        },
        {
          type: 'list',
          items: [
            'すでに使用している製品については、必ず医師や薬剤師に伝えること。',
            '妊娠中、授乳中、または慢性疾患がある場合は特に注意すること。',
            '自分用に処方・用意された製品を他の人と共有しないこと。',
            'すべての製品は子どもの手の届かない場所に保管すること。',
          ],
        },
        {
          type: 'p',
          text: '一部の製品は、他の製品と併用するのに適さない場合があり、薬の飲み合わせが生じることがあります。これにより製品の働きが変化したり、副作用のリスクが高まったりする可能性があります。そのため、すでに何らかの医薬品を使用している場合は、新たに別の製品を追加する前に、必ず医師や薬剤師に相談することが重要です。',
        },
      ],
    },

    {
      id: 'how-to-take',
      heading: 'お薬の飲み方と保管方法',
      blocks: [
        {
          type: 'p',
          text: '正しいお薬の飲み方を知ることは、適切な製品を選ぶことと同じくらい重要です。パッケージに記載された指示、または医師の指示に従ってください。推奨量を超えて使用せず、相談なしに服用を中止したり変更したりしないでください。',
        },
        {
          type: 'p',
          text: 'お薬の保管方法も大切です。一般的な薬の保管方法のルールは次のとおりです。',
        },
        {
          type: 'list',
          items: [
            '直射日光を避け、涼しく乾燥した場所で保管すること。',
            '元のパッケージのまま保管すること。',
            '使用期限を定期的に確認し、期限切れの製品は安全に処分すること。',
            'ラベルに記載された特別な温度管理の指示に従うこと。',
          ],
        },
      ],
    },

    {
      id: 'brand-and-generic',
      heading: 'ブランド品とジェネリック医薬品',
      blocks: [
        {
          type: 'p',
          text: '同じような効果を持つ2つの製品を前にして迷うこともあるかもしれません。そこで、わかりやすい考え方をご紹介します。',
        },
        {
          type: 'p',
          text: 'ブランド薬は、製薬会社が商標名のもとで開発・発売した先発製品です。製薬会社は研究と試験に何年もの時間をかけており、価格にはその投資やブランドのマーケティングコストが反映されていることが多くあります。',
        },
        {
          type: 'p',
          text: 'ジェネリック医薬品は、先発品の特許期間が終了した後に製造されます。ジェネリック品には、ブランド製品と同じ有効成分が同じ含有量・剤形で含まれていますが、名称が異なり（多くの場合、成分名がそのまま使われます）、パッケージも異なります。',
        },
        {
          type: 'h3',
          text: 'なぜ価格がこれほど異なるのか',
        },
        {
          type: 'p',
          text: 'ジェネリック医薬品のメーカーは、もとの研究を繰り返す必要がないため、同じ有効成分をより低コストで提供できます。そのため、多くのお客様がお薬の価格を比較し、ジェネリック品を選んでいます。特に長期間使用する製品の場合、節約効果は大きくなります。',
        },
        {
          type: 'p',
          text: 'ブランド品とジェネリック品のどちらを選ぶ場合も、最も大切なのはご自身に合った製品を選び、指示どおりに使用することです。どちらの選択肢も当店の商品一覧でご覧いただけます。ジェネリック医薬品の通販をご希望の場合も、各商品ページに詳細情報を掲載していますので、安心してお選びいただけます。',
        },
      ],
    },

    {
      id: 'how-to-order',
      heading: '医薬品をオンラインで購入する方法',
      blocks: [
        {
          type: 'p',
          text: '医薬品をオンラインで検索すると、製品情報を比較し、購入方法について理解しやすくなります。メディカ丸のご注文手続きは、わずか数分で完了します。以下のステップに沿ってお進みください。',
        },
        {
          type: 'steps',
          items: [
            {
              text: '閲覧：商品名や症状で検索するか、カテゴリーから商品一覧を確認し、希望する商品のページを開きます。',
              image: {
                src: '/guide/search.webp',
                width: 1400,
                height: 1456,
                alt: '検索結果ページ。検索欄に「ツゲイン」と入力し、該当する4商品が商品画像・価格・在庫状況とともに表示されている。',
              },
            },
            {
              text: '確認：商品ページで成分、使用目的、用法・用量、副作用、使用上の注意を確認します。上の「医薬品情報」と「使用上の注意」が、その確認先です。',
            },
            {
              text: 'カートに追加：数量を選択し、商品をカートに追加します。カートでは小計・送料・合計をその場でご確認いただけます。',
              image: {
                src: '/guide/cart.webp',
                width: 1400,
                height: 756,
                alt: 'ショッピングカート。商品、数量、単価と、小計・送料・合計を表示したお支払い金額の欄が並んでいる。',
              },
            },
            {
              text: '情報の入力：お届け先のお名前、郵便番号、ご住所、お電話番号、メールアドレスを入力します。',
              image: {
                src: '/guide/checkout-form.webp',
                width: 1400,
                height: 1616,
                alt: 'ご注文手続きの「お届け先」入力欄。氏名、郵便番号、都道府県、市区町村、番地、建物名、電話番号の各項目が並んでいる。',
              },
            },
            {
              text: 'お支払い方法の確認：現在お取り扱いしているお支払い方法は銀行振込です。ご注文内容の欄に表示されますので、金額とあわせてご確認ください。',
            },
            {
              text: '確定：ご注文内容と3つのご確認事項をお読みいただき、「注文を確定する」を押して送信します。その後、確認メールが届きます。',
              image: {
                src: '/guide/checkout-summary.webp',
                width: 776,
                height: 1394,
                alt: 'ご注文内容の欄。商品、小計、送料、お支払い方法（銀行振込）、合計金額と、3つの確認チェックボックス、「注文を確定する」ボタンが表示されている。',
              },
            },
          ],
        },
      ],
    },

    {
      id: 'overseas',
      heading: '海外医薬品の購入について',
      blocks: [
        {
          type: 'p',
          text: '国内では入手しにくい製品を探すために、海外医薬品をオンラインで検索する方もいらっしゃいます。ただし、医薬品を日本に輸入する際には特定のルールが適用され、その条件は製品、数量、成分、使用目的によって異なります。',
        },
        {
          type: 'p',
          text: '日本国内のお客様へ：海外でのご購入前に、厚生労働省が示す関連ガイダンスをご確認ください。個人輸入は、その製品が日本国内で承認されていることを意味するものではなく、輸入品はパッケージや説明書が異なる場合があります。',
        },
        {
          type: 'p',
          text: '海外医薬品の通販をご利用になるのが初めての場合は、まず少量のご注文から始め、決済から配送までの流れをご確認いただくことをおすすめします。仕組みと注意点は、個人輸入についてのページで詳しくご説明しています。',
          link: { href: '/about-personal-import', label: '個人輸入について' },
        },
      ],
    },

    {
      id: 'price-payment-delivery',
      heading: '医薬品の価格、支払い方法、配送について',
      blocks: [
        {
          type: 'p',
          text: '医薬品の価格を比較する際は、表示されている商品価格だけでなく、パッケージサイズ、含有量、数量、送料、その他の手数料も確認しましょう。これらは最終的な金額に影響します。',
        },
        {
          type: 'h3',
          text: '支払い方法',
        },
        {
          type: 'p',
          text: '現在お取り扱いしているお支払い方法は銀行振込です。ご注文後にお振込先をご案内し、ご入金の確認後に発送いたします。金額とお支払い方法は、ご注文を確定する前の画面に明記されます。',
        },
        {
          type: 'h3',
          text: '配送方法と送料',
        },
        {
          type: 'p',
          text: '送料はご注文のサイズと重量によって異なります。お支払いの前に決済画面で明確に表示されるため、予期しない追加費用が発生することはありません。商品が発送されると、追跡番号が発行され、配送状況をご確認いただけます。',
          link: { href: '/about', label: '特定商取引法に基づく表記' },
        },
        {
          type: 'h3',
          text: '返品・交換',
        },
        {
          type: 'p',
          text: 'お薬は、安全性および衛生上の理由から特別な返品制限が適用されます。開封または使用された医薬品は、原則として返品をお受けできません。商品に破損や誤配送があった場合は、到着後速やかにご連絡いただければ、確認のうえ返金または再送などの対応を行います。ご購入前に、適用されるポリシーをご確認ください。',
          link: { href: '/terms', label: '利用規約（返品・キャンセル・不良品対応）' },
        },
      ],
    },

    {
      id: 'informed-decisions',
      heading: 'お薬について正しく理解したうえでご判断を',
      blocks: [
        {
          type: 'p',
          text: '信頼できるお薬の情報は、製品の成分、使用目的、注意事項、購入時に考慮すべき点を理解する助けとなります。オンラインで医薬品をお求めになる場合も、ジェネリック製品を比較する場合も、海外のカタログをご覧になる場合も、正確な情報と適切な医学的アドバイスを優先し、適用される法律や規制を守ることが重要です。',
        },
        {
          type: 'p',
          text: 'お薬は必ず指示に従って使用し、必要に応じて資格を持つ医療専門家に相談してください。正しい情報をもとにした判断は、医薬品への理解を深め、責任あるヘルスケアを支える選択につながります。',
        },
      ],
    },
  ],
};

/**
 * The FAQ, kept apart from `sections` so the page can emit FAQPage
 * structured data from the same strings it renders. A question answered on
 * the page and a question in the markup that drift apart is exactly what the
 * guidelines call a mismatch.
 */
export const faqs = [
  {
    question: 'お薬をオンラインで購入しても安全ですか？',
    answer:
      '信頼できる販売サイトを利用し、製品情報を確認し、指示に従えば安全にご購入いただけます。何らかの疾患がある場合は、まず専門家にご相談ください。',
  },
  {
    question: '配送にはどのくらい時間がかかりますか？',
    answer:
      'ご入金の確認後、通常10〜14日程度でお届けします。発送後は追跡番号で最新の状況をご確認いただけます。',
  },
  {
    question: '商品を返品できますか？',
    answer:
      '開封または使用された医薬品は、衛生上の理由により原則として返品をお受けできません。破損や誤配送があった場合は、到着後速やかにご連絡ください。確認のうえ、返金または再送などの対応を行います。',
  },
  {
    question: 'どの支払い方法を利用できますか？',
    answer:
      '現在は銀行振込をお取り扱いしています。ご注文後にお振込先をご案内し、ご入金の確認後に発送いたします。',
  },
  {
    question: 'どの商品が自分に合っているか、どうすればわかりますか？',
    answer:
      '商品ページを確認し、薬の成分を比較し、迷った場合は医師や薬剤師にご相談ください。',
  },
];

/* The FAQ renders as part of the document, built from the same array. */
content.sections.push({
  id: 'faq',
  heading: 'お薬に関するよくある質問',
  blocks: faqs.flatMap((faq) => [
    { type: 'h3', text: faq.question },
    { type: 'p', text: faq.answer },
  ]),
});

export default content;
