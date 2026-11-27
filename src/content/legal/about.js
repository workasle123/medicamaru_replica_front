import { formatYenSuffix } from '@/lib/format';

/**
 * お薬らくについて — imported from 01_medicamaru_aboutus.docx.
 *
 * GENERATED CONTENT, edited only here. The page and its table of contents
 * are both built from this file, so a heading cannot appear in one and not
 * the other. Block types: p, h3, list (bullets), steps (ordered), table.
 *
 * 特定商取引法に基づく表示 (2026-11-27) follows the same disclosure on
 * kaigai-okusuri-tsuhan.com/shipping, our sister site, item for item, so the
 * shops state one set of terms. It was ported from medicamaru.com/about,
 * which made the same change the same day. What differs is only what is
 * really different here: the site name and address, the support hours, the
 * postage (782円, the `shipping_rules` band live charges below the threshold,
 * where kaigai charges 800円), the free-shipping threshold (this site's own
 * 送料無料 offer — 5,000円 on 2026-11-27, where kaigai states 6,000円), and the
 * delivery estimate, which kaigai still marks 【要確認】 and this site already
 * states at checkout (通常10〜14日).
 *
 * A function rather than a plain object because of the free-shipping
 * threshold: it is the admin's 送料無料 offer, not a constant, so the page
 * passes it in and the 送料 row cannot print a number the admin has since
 * changed. With no offer running the row states the postage alone.
 *
 * @param {{freeShippingThreshold?: number|null}} [options]
 */

const SHIPPING_FEE = 782;

function shippingFee(threshold) {
  const fee = `通常送料${formatYenSuffix(SHIPPING_FEE)}`;
  return threshold ? `${fee}（${formatYenSuffix(threshold)}以上のご注文で送料無料）` : fee;
}

const aboutContent = ({ freeShippingThreshold = null } = {}) => ({
  "title": "お薬らくについて",
  "intro": [],
  "sections": [
    {
      "id": "section-1",
      "heading": "お薬らくとは",
      "blocks": [
        {
          "type": "p",
          "text": "お薬らく（okusuriraku.shop）は、海外で製造・販売されている医薬品、医薬部外品、サプリメント、化粧品などについて、個人輸入という仕組みを通じてご希望の方に取り次ぐ情報提供・注文サポートサイトです。"
        },
        {
          "type": "p",
          "text": "当サイトは病院、薬局、クリニックではなく、診察・診断・処方箋の発行を行う医療機関でもありません。あくまで「情報を整理してお届けする窓口」として運営しています。"
        }
      ]
    },
    {
      "id": "section-2",
      "heading": "なぜこのサービスを始めたのか",
      "blocks": [
        {
          "type": "p",
          "text": "海外の医薬品や健康関連製品について調べようとしても、日本語で信頼できる一次情報にたどり着くのは簡単ではありません。成分表示が外国語のままだったり、正規の承認状況が分かりにくかったりすることも少なくありません。"
        },
        {
          "type": "p",
          "text": "また、身近な人に相談しづらい体調の悩みを抱えていたり、通院や対面での相談に時間を割くことが難しい方もいらっしゃいます。お薬らくは、そうした方が自分の意思で情報を確認し、納得したうえで選択できる環境を用意したいという考えから生まれました。"
        }
      ]
    },
    {
      "id": "section-3",
      "heading": "大切にしていること",
      "blocks": [
        {
          "type": "list",
          "items": [
            "判断を急がせない：不安をあおる表現や、購入を急かす演出は行いません。",
            "決めつけない：年齢、性別、国籍、既往症などを理由に対応を変えたり、決めつけた案内をしたりしません。",
            "分からないことは分からないと伝える：根拠が不十分な情報を断定的に表現することはありません。未確認の情報は未確認である旨を明記します。"
          ]
        }
      ]
    },
    {
      "id": "section-4",
      "heading": "ご案内している情報",
      "blocks": [
        {
          "type": "p",
          "text": "製品名、成分、含有量、想定される使用方法、製造元情報、各国での承認状況、禁忌事項、副作用として報告されている症状、相互作用に関する注意など、公開されている一次情報をもとに整理してご案内しています。"
        }
      ]
    },
    {
      "id": "section-5",
      "heading": "ご案内していないこと",
      "blocks": [
        {
          "type": "p",
          "text": "以下は行っておりません。ご了承のうえご利用ください。"
        },
        {
          "type": "list",
          "items": [
            "症状に対する診断",
            "個別の病状に基づく処方や用法・用量の指示",
            "特定の製品が安全である、または効果があることの保証"
          ]
        },
        {
          "type": "p",
          "text": "体調に関するご相談は、必ず医師・薬剤師など医療の専門家にご確認ください。"
        }
      ]
    },
    {
      "id": "section-6",
      "heading": "サポートしていること",
      "blocks": [
        {
          "type": "list",
          "items": [
            "製品情報の検索・比較のためのデータベース提供",
            "ご注文の受付と海外からの発送手配",
            "医療相談以外のご注文・配送に関するお問い合わせ対応",
            "配送状況の確認サポート"
          ]
        }
      ]
    },
    {
      "id": "section-7",
      "heading": "運営体制について",
      "blocks": [
        {
          "type": "p",
          "text": "お薬らくは SENSE PHARMACEUTICALS が運営しています。決済代行や国際配送などの一部業務は提携する外部事業者が担っており、これらの事業者は販売主体ではなく、業務委託先として関与しています。"
        },
        {
          "type": "p",
          "text": "販売事業者の所在地・連絡先と、お支払い・配送・返品などの取引条件は、次の「特定商取引法に基づく表示」に記載しています。"
        }
      ]
    },
    /* The operator details that used to sit above as 事業者情報 are the first
       group of this table now — one place for them, not two that can
       disagree. A fixed id rather than section-N, so the footer's
       特定商取引法に基づく表示 link (constants/nav.js) survives a section
       being added above it. */
    {
      id: 'tokushoho',
      heading: '特定商取引法に基づく表示',
      blocks: [
        {
          type: 'p',
          text: 'お薬らくでは、お客様に安心してご利用いただけるよう、販売事業者および取引条件について、以下のとおりご案内いたします。',
        },
        {
          type: 'table',
          caption: '特定商取引法に基づく表示',
          groups: [
            {
              heading: '販売事業者について',
              rows: [
                { label: '販売業者名', value: 'SENSE PHARMACEUTICALS' },
                { label: 'サイト名', value: 'お薬らく' },
                { label: '運営責任者', value: 'Dr. Brajesh Bharadwaj' },
                { label: '所在地', value: '44, Regal Building, New Delhi-110001' },
                {
                  label: 'メールアドレス',
                  value: [{ text: 'info@okusuriraku.shop', href: 'mailto:info@okusuriraku.shop' }],
                },
                { label: 'カスタマーサポート受付時間', value: '10:00〜18:00' },
                {
                  label: 'サイトURL',
                  value: [{ text: 'https://okusuriraku.shop/', href: 'https://okusuriraku.shop/' }],
                },
              ],
            },
            {
              heading: '商品代金・お支払いについて',
              rows: [
                {
                  label: '販売価格',
                  value: '各商品ページに表示された価格をご参照ください。ご注文確定前の最終確認画面に、お支払い総額を表示いたします。',
                },
                {
                  label: '商品代金以外の必要料金',
                  value: '送料、銀行振込手数料、輸入時に発生する関税・輸入消費税・通関関連費用等が必要となる場合があります。費用の発生条件と負担者については、ご注文前にご案内いたします。',
                },
                { label: '送料', value: shippingFee(freeShippingThreshold) },
                { label: 'お支払い方法', value: '銀行振込' },
                {
                  label: 'お支払い時期',
                  value: 'ご注文後、当社がご案内する指定口座へお振り込みください。入金確認後、商品手配を進めます。',
                },
                {
                  label: '注文・お支払い期限',
                  value: [
                    '注文確定後14日間',
                    '期限までにご入金が確認できない場合、事前に表示した条件に従い、ご注文は自動的に取り消されます。再度ご注文ください。',
                  ],
                },
              ],
            },
            {
              heading: '配送・商品のお届けについて',
              rows: [
                {
                  label: '商品の引渡時期',
                  value: [
                    'ご入金およびご注文内容の確認後、順次発送手配を行います。',
                    'お届けまでの目安は、ご入金の確認後、通常10〜14日です。',
                    '海外からの発送となるため、天候、航空便、通関手続、現地事情等により配送が遅延する場合があります。',
                  ],
                },
                {
                  label: '配送方法',
                  value: '当社が指定する海外の配送事業者を通じて、お客様が指定された配送先へ商品をお届けいたします。',
                },
                {
                  label: '配送対象地域',
                  value: '原則として日本国内への配送を対象とします。配送できない地域や商品がある場合は、ご注文前にご案内いたします。',
                },
                {
                  label: '販売数量の制限',
                  value: '医薬品等の個人輸入は、ご本人の自己使用を目的とし、日本の法令で認められる数量および条件の範囲内に限ります。輸入規制の対象となる商品や、必要書類の条件を満たさないご注文はお受けできません。',
                },
              ],
            },
            {
              heading: 'キャンセル・返品・返金について',
              rows: [
                {
                  label: '注文のキャンセル',
                  value: '商品手配開始後は、お客様都合によるキャンセルに対応できない場合があります。ただし、法令上認められる取消し・解除の権利は制限いたしません。',
                },
                {
                  label: 'お客様都合による返品・交換',
                  value: '医薬品等の品質管理・衛生管理上、お客様都合による返品・交換は原則としてお受けしない方針です。',
                },
                {
                  label: '不良品・破損・誤配送',
                  value: 'お届けした商品に破損、数量不足、誤配送、その他契約内容との相違があった場合は、注文番号と商品の状態が確認できる写真等を添えてお問い合わせください。内容を確認し、交換、再発送、返金その他適切な対応を行います。',
                },
                {
                  label: '不良品等のご連絡期限',
                  value: [
                    '商品到着後、できる限り速やかにご連絡ください。',
                    '弊社の過失の場合は商品を再度配送いたします。',
                  ],
                },
                {
                  label: '返品・再発送の送料',
                  value: '当社の責めに帰すべき不良品・誤配送等については、適用法令および契約に従って当社が負担いたします。お客様の住所入力間違い、受取拒否、保管期限の経過等による追加費用については、事前に表示した条件に基づき、合理的な範囲でご負担いただく場合があります。',
                },
                {
                  label: '商品が届かない場合',
                  value: '配送状況、追跡情報、通関状況等を確認し、原因および契約条件に応じて再発送、返金その他適切な対応を行います。',
                },
                {
                  label: '返金方法・時期',
                  value: '返金が必要となった場合は、原則として銀行振込またはポイントで返金いたします。返金金額および返金時期は、契約条件と適用法令に従います。',
                },
                {
                  label: 'クーリング・オフ',
                  value: '海外通信販売には、法律上のクーリング・オフ制度は適用されません。ただし、返品特約および適用法令に基づく申込みの撤回・契約解除等の権利は制限されません。',
                },
              ],
            },
            {
              heading: '医薬品等の個人輸入について',
              rows: [
                { label: '輸入者', value: '日本への個人輸入においては、お客様ご本人が輸入者となります。' },
                {
                  label: '個人輸入の条件',
                  value: [
                    '医薬品等の個人輸入は、ご本人の自己使用を目的とする場合に限られます。輸入した医薬品等を第三者へ販売・譲渡することや、他人の分をまとめて輸入することはできません。',
                    { text: '個人輸入について', href: '/about-personal-import' },
                  ],
                },
                {
                  label: '輸入に必要な手続',
                  value: '商品、成分、数量等により、輸入確認証その他の書類が必要となる場合があります。税関その他の関係機関の判断により、通関が認められない場合があります。',
                },
                {
                  label: '販売事業者の責任',
                  value: 'SENSE PHARMACEUTICALSは商品の売主として、売買契約上の義務および法令上の責任を負います。お客様が輸入者であることを理由として、当社が売主として負う責任を免れるものではありません。',
                },
              ],
            },
            {
              heading: 'その他',
              rows: [
                {
                  label: '個人情報の取扱い',
                  value: [
                    'お客様の個人情報は、当サイトのプライバシーポリシーおよび適用法令に従って適切に取り扱います。',
                    { text: 'プライバシーポリシー', href: '/privacy' },
                  ],
                },
                {
                  label: '利用規約',
                  value: [
                    '本サイトのご利用条件については、利用規約をご確認ください。',
                    { text: '利用規約', href: '/terms' },
                  ],
                },
                {
                  label: 'お問い合わせ',
                  value: [
                    '商品、ご注文、お支払い、配送、返品・返金等に関するお問い合わせは、下記のメールアドレスへご連絡ください。',
                    { text: 'info@okusuriraku.shop', href: 'mailto:info@okusuriraku.shop' },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
    {
      "id": "section-8",
      "heading": "ご利用にあたって",
      "blocks": [
        {
          "type": "p",
          "text": "持病をお持ちの方、妊娠中・授乳中の方、他の薬剤を服用中の方は、ご注文の前に医師または薬剤師にご相談ください。当サイトの情報は医療専門家による診察に代わるものではありません。"
        }
      ]
    }
  ]
});

export default aboutContent;
