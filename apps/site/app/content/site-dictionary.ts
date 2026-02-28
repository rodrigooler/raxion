import type { Locale } from "../../lib/site";
import { locales } from "../../lib/site";
import type { SiteDictionary } from "./site-types";

type Localized<T> = Record<Locale, T>;
type UseCase = [string, string, string];
type MetricCopy = [suffix: string, label: string, sublabel: string];
type CardCopy = [heading: string, body: string];
type PhaseCopy = [label: string, title: string, accent: string, items: string[]];
type ProblemCopy = {
  eyebrow: string;
  titleTop: string;
  titleAccent: string;
  beforeLabel: string;
  afterLabel: string;
  intro: string;
  structuralEyebrow: string;
  structuralTitle: string;
  structuralAccent: string;
  structuralBody: string;
  structuralBody2: string;
  chainLabel: string;
  trustSteps: string[];
};
type RoadmapCopy = {
  eyebrow: string;
  titleTop: string;
  titleAccent: string;
  titleBottom: string;
};
type WhitepaperCopy = {
  eyebrow: string;
  title: string;
  body: string;
  primary: string;
  secondary: string;
};
type PostCopy = {
  backToHome: string;
  authorLabel: string;
  publishedLabel: string;
  relatedLabel: string;
  blogLabel: string;
  announcementsLabel: string;
  visitBlog: string;
  visitAnnouncements: string;
};


function localized<T>(en: T, ptBR: T, zh: T, ja: T, es: T): Localized<T> {
  return { en, "pt-BR": ptBR, zh, ja, es };
}

function mapLocalizedRows<T>(rows: ReadonlyArray<Localized<T>>, locale: Locale): T[] {
  return rows.map((row) => row[locale]);
}

const localeNames: SiteDictionary["localeNames"] = {
  en: "English",
  "pt-BR": "Portugues (Brasil)",
  zh: "中文",
  ja: "日本語",
  es: "Espanol",
};

const navHrefs = ["#problem", "#arch", "#logic", "#roadmap", "#whitepaper"] as const;
const metricValues = ["<2", "3", "0"] as const;
const metricAccents = ["text-brand-blue", undefined, "text-brand-red"] as const;
const cardTitles = [
  "01 // PARALLEL_COGNITION",
  "02 // ZK_ML",
  "03 // NATIVE_MEMORY",
] as const;
const cardAccents = ["text-brand-blue", "text-brand-red", "text-brand-purple"] as const;
const proofLabels = ["0.4 x CS_semantic", "0.6 x CC"] as const;
const proofAccents = [undefined, "text-brand-blue"] as const;
const economicsExpressions = [
  "= f(CoherenceScore, RS, stake)",
  "= chronic_divergence x penalty",
  "= log2(stake/1000) x 8 + 1",
] as const;
const economicsAccents = ["text-brand-blue", "text-brand-red", "text-brand-purple"] as const;
const roadmapDates = ["Q1 2026", "Q2 2026", "Q3 2026", "2027"] as const;
const roadmapAccentClasses = [
  "text-gray-500",
  "text-gray-400",
  "text-brand-blue",
  "text-gray-600",
] as const;
const roadmapActive = [false, false, true, false] as const;

const useCaseRows = [
  localized<UseCase>(
    [
      "Use Case 01 - Smart Contract Security",
      "You deploy a $10M DeFi protocol. You pay an auditor with a direct incentive to approve your launch. You ship. You get hacked.",
      "Three heterogeneous agents independently inspect the code. If they converge on the same exploit path, that result is mathematically proven on-chain.",
    ],
    [
      "Caso 01 - Seguranca de Smart Contracts",
      "Voce lanca um protocolo DeFi de US$10M. Paga um auditor incentivado a aprovar seu launch. Voce publica. Voce e hackeado.",
      "Tres agentes heterogeneos inspecionam o codigo de forma independente. Se convergirem no mesmo vetor de exploracao, o resultado e provado on-chain.",
    ],
    [
      "场景 01 - 智能合约安全",
      "你部署一个 1000 万美元的 DeFi 协议，并支付一个有动力批准上线的审计方。你上线，然后被黑。",
      "三个异构代理独立检查代码。若它们在同一攻击路径上收敛，结果会被数学证明并提交链上。",
    ],
    [
      "ユースケース 01 - スマートコントラクト監査",
      "1,000 万ドル規模の DeFi を公開し、ローンチ承認に利害を持つ監査人へ支払う。公開し、ハックされる。",
      "3 つの異種エージェントが独立にコードを検査し、同じ攻撃経路に収束すれば、その結果はオンチェーンで数理的に証明される。",
    ],
    [
      "Caso 01 - Seguridad de Smart Contracts",
      "Despliegas un protocolo DeFi de US$10M. Pagas a un auditor con incentivo directo para aprobar el lanzamiento. Publicas. Te hackean.",
      "Tres agentes heterogeneos inspeccionan el codigo de forma independiente. Si convergen en la misma ruta de explotacion, el resultado queda probado on-chain.",
    ]
  ),
  localized<UseCase>(
    [
      "Use Case 02 - Medical Research",
      "Five LLMs return five different answers about drug interaction risk. There is no objective confidence layer, so teams fall back to slow human review.",
      "RAXION computes a CoherenceScore across complementary architectures. High confidence is derived, not claimed, and can be verified by any node.",
    ],
    [
      "Caso 02 - Pesquisa Medica",
      "Cinco LLMs retornam cinco respostas diferentes sobre risco de interacao medicamentosa. Sem camada objetiva de confianca, a equipe volta para revisao humana lenta.",
      "A RAXION calcula um CoherenceScore entre arquiteturas complementares. Alta confianca e derivada, nao declarada, e qualquer no pode verificar.",
    ],
    [
      "场景 02 - 医学研究",
      "五个 LLM 对药物相互作用给出五个不同答案。没有客观置信层，团队只能回到缓慢的人类审查。",
      "RAXION 在互补架构之间计算 CoherenceScore。高置信度是推导出来的，不是宣称出来的，任何节点都能验证。",
    ],
    [
      "ユースケース 02 - 医療研究",
      "5 つの LLM が薬物相互作用について 5 つの異なる回答を返す。客観的な信頼レイヤーがなく、遅い人手レビューに戻るしかない。",
      "RAXION は補完的なアーキテクチャ間で CoherenceScore を算出する。高信頼は主張ではなく導出され、どのノードでも検証できる。",
    ],
    [
      "Caso 02 - Investigacion medica",
      "Cinco LLM devuelven cinco respuestas distintas sobre riesgo de interaccion farmacologica. Sin una capa objetiva de confianza, el equipo vuelve a revision humana lenta.",
      "RAXION calcula un CoherenceScore entre arquitecturas complementarias. La alta confianza se deriva, no se declara, y cualquier nodo puede verificarla.",
    ]
  ),
  localized<UseCase>(
    [
      "Use Case 03 - Decentralized AI Markets",
      "Validator incentives drift toward social consensus and cartel behavior. Rewards go to whoever pleases the judges, not whoever is right.",
      "Rewards bind to proof-backed inference quality. Challenges are deterministic. Slashing is automatic. Subjective scoring is removed.",
    ],
    [
      "Caso 03 - Mercados de IA Descentralizada",
      "Os incentivos de validadores derivam para consenso social e cartelizacao. As recompensas vao para quem agrada os juizes, nao para quem esta certo.",
      "As recompensas se ligam a qualidade de inferencia provada. Os desafios sao deterministicos. O slashing e automatico. A pontuacao subjetiva desaparece.",
    ],
    [
      "场景 03 - 去中心化 AI 市场",
      "验证者激励会滑向社会共识与卡特尔行为。奖励流向取悦裁判的人，而不是正确的人。",
      "奖励绑定到有证明支持的推理质量。挑战是确定性的。惩罚自动执行。主观评分被移除。",
    ],
    [
      "ユースケース 03 - 分散型 AI マーケット",
      "バリデータのインセンティブは社会的合意やカルテル行動へ傾く。報酬は正しい者ではなく、審判を満足させる者に流れる。",
      "報酬は証明に裏付けられた推論品質に結び付く。チャレンジは決定的で、スラッシングは自動。主観的な採点は排除される。",
    ],
    [
      "Caso 03 - Mercados de IA descentralizada",
      "Los incentivos de validadores derivan hacia consenso social y comportamiento cartelizado. Las recompensas van a quien satisface a los jueces, no a quien tiene razon.",
      "Las recompensas se atan a calidad de inferencia respaldada por pruebas. Los desafios son deterministas. El slashing es automatico. Se elimina la puntuacion subjetiva.",
    ]
  ),
] as const;

export const homeUseCases: Record<Locale, Array<[string, string, string]>> = Object.fromEntries(
  locales.map((locale) => [locale, mapLocalizedRows(useCaseRows, locale)])
) as Record<Locale, Array<[string, string, string]>>;

const navLabels = localized(
  ["Problem", "Architecture", "Logic", "Roadmap", "Whitepaper"] as const,
  ["Problema", "Arquitetura", "Logica", "Roadmap", "Whitepaper"] as const,
  ["问题", "架构", "逻辑", "路线图", "白皮书"] as const,
  ["問題", "アーキテクチャ", "ロジック", "ロードマップ", "ホワイトペーパー"] as const,
  ["Problema", "Arquitectura", "Logica", "Roadmap", "Whitepaper"] as const
);
const menuLabel = localized("Menu", "Menu", "菜单", "メニュー", "Menu");
const announcementLabel = localized("Announcement", "Anuncio", "公告", "お知らせ", "Anuncio");
const readAnnouncement = localized(
  "Read the announcement",
  "Ler o anuncio",
  "阅读公告",
  "お知らせを読む",
  "Leer el anuncio"
);
const latestAnnouncementEyebrow = localized(
  "Latest announcement",
  "Ultimo anuncio",
  "最新公告",
  "最新のお知らせ",
  "Ultimo anuncio"
);
const heroBadge = localized(
  "Q3 2026 - Testnet Active",
  "Q3 2026 - Testnet Ativa",
  "2026 Q3 - 测试网进行中",
  "2026年Q3 - テストネット進行中",
  "Q3 2026 - Testnet activa"
);
const heroLines = localized<[string, string, string, string]>(
  ["THE", "BLOCK", "CHAIN", "THAT THINKS."],
  ["A", "BLOCK", "CHAIN", "QUE PENSA."],
  ["会", "思", "考", "的链。"],
  ["考", "え", "る", "チェーン。"],
  ["LA", "BLOCK", "CHAIN", "QUE PIENSA."]
);
const heroOrb = localized(
  ["Sovereign SVM", "Rollup on Solana"] as const,
  ["SVM soberana", "Rollup na Solana"] as const,
  ["主权 SVM", "基于 Solana 的 Rollup"] as const,
  ["主権 SVM", "Solana 上の Rollup"] as const,
  ["SVM soberana", "Rollup sobre Solana"] as const
);
const heroCtas = localized(
  ["SEE THE PROBLEM", "GITHUB_REPO"] as const,
  ["VER O PROBLEMA", "GITHUB_REPO"] as const,
  ["查看问题", "GITHUB_REPO"] as const,
  ["課題を見る", "GITHUB_REPO"] as const,
  ["VER EL PROBLEMA", "GITHUB_REPO"] as const
);
const heroNotes = localized<[string, string]>(
  [
    "[01] AI inference quality - mathematically proven, not voted.",
    "[02] No human validators. No cartels. No oracle problem.",
  ],
  [
    "[01] Qualidade de inferencia de IA - provada matematicamente, nao votada.",
    "[02] Sem validadores humanos. Sem carteis. Sem problema do oraculo.",
  ],
  [
    "[01] AI 推理质量由数学证明，而不是投票。",
    "[02] 没有人类验证者，没有卡特尔，没有预言机问题。",
  ],
  [
    "[01] AI 推論品質は投票ではなく数理で証明される。",
    "[02] 人間のバリデータなし。カルテルなし。オラクル問題なし。",
  ],
  [
    "[01] Calidad de inferencia de IA - probada matematicamente, no votada.",
    "[02] Sin validadores humanos. Sin carteles. Sin problema del oraculo.",
  ]
);
const marqueeItems = localized(
  [
    "Proof of Inference Quality",
    "Cognitive Finality",
    "Zero Human Judges",
    "Neural SVM",
    "zk-ML Verification",
    "CoherenceScore",
  ] as const,
  [
    "Prova de Qualidade de Inferencia",
    "Finalidade Cognitiva",
    "Zero juizes humanos",
    "SVM neural",
    "Verificacao zk-ML",
    "CoherenceScore",
  ] as const,
  ["推理质量证明", "认知终局性", "零人类裁判", "神经 SVM", "zk-ML 验证", "CoherenceScore"] as const,
  ["推論品質証明", "認知ファイナリティ", "人間の裁定ゼロ", "ニューラル SVM", "zk-ML 検証", "CoherenceScore"] as const,
  ["Prueba de Calidad de Inferencia", "Finalidad cognitiva", "Cero jueces humanos", "SVM neural", "Verificacion zk-ML", "CoherenceScore"] as const
);

const metricRows = [
  localized<MetricCopy>(
    ["s", "Cognitive Finality", "Mainnet v1 target"],
    ["s", "Finalidade Cognitiva", "Meta da Mainnet v1"],
    ["秒", "认知终局性", "Mainnet v1 目标"],
    ["秒", "認知ファイナリティ", "メインネット v1 目標"],
    ["s", "Finalidad cognitiva", "Objetivo de Mainnet v1"]
  ),
  localized<MetricCopy>(
    ["arch", "Cross-Validation", "Transformer + SSM + NeuroSym"],
    ["arq", "Validacao cruzada", "Transformer + SSM + NeuroSym"],
    ["架构", "交叉验证", "Transformer + SSM + NeuroSym"],
    ["系統", "交差検証", "Transformer + SSM + NeuroSym"],
    ["arq", "Validacion cruzada", "Transformer + SSM + NeuroSym"]
  ),
  localized<MetricCopy>(
    ["votes", "Human Judges", "Math replaces opinion"],
    ["votos", "Juizes humanos", "A matematica substitui opiniao"],
    ["投票", "人类裁判", "数学替代意见"],
    ["票", "人間の裁定", "数学が意見を置き換える"],
    ["votos", "Jueces humanos", "La matematica reemplaza opinion"]
  ),
] as const;

const problemCopy = localized<ProblemCopy>(
  {
    eyebrow: "The Root Problem",
    titleTop: "WHO JUDGES",
    titleAccent: "THE JUDGE?",
    beforeLabel: "Without RAXION",
    afterLabel: "With RAXION",
    intro: "Every decentralized AI network today solves the same problem the same wrong way: it pays humans to judge machine quality. RAXION removes the judge and replaces subjectivity with math.",
    structuralEyebrow: "The Structural Failure",
    structuralTitle: "The Oracle Problem.",
    structuralAccent: "Tokenized.",
    structuralBody: "Bittensor did not solve the Oracle Problem. It tokenized it. The oracle is still human judgment, now distorted by economic incentives.",
    structuralBody2: "RAXION eliminates the oracle entirely. The math votes.",
    chainLabel: "RAXION chain of trust",
    trustSteps: [
      "3x parallel inference (Transformer + SSM + NeuroSym)",
      "CoherenceScore = 0.4xCS_semantic + 0.6xCC",
      "zk-ML proof generated -> committed to Solana L1",
      "Cognitive Finality ✓",
    ],
  },
  {
    eyebrow: "O Problema Raiz",
    titleTop: "QUEM JULGA",
    titleAccent: "O JUIZ?",
    beforeLabel: "Sem RAXION",
    afterLabel: "Com RAXION",
    intro: "Toda rede de IA descentralizada hoje resolve o mesmo problema do mesmo jeito errado: paga humanos para julgar a qualidade das maquinas. A RAXION remove o juiz e troca subjetividade por matematica.",
    structuralEyebrow: "A Falha Estrutural",
    structuralTitle: "O Problema do Oraculo.",
    structuralAccent: "Tokenizado.",
    structuralBody: "A Bittensor nao resolveu o Problema do Oraculo. Ela tokenizou esse problema. O oraculo continua sendo julgamento humano, agora distorcido por incentivos economicos.",
    structuralBody2: "A RAXION elimina o oraculo por completo. A matematica vota.",
    chainLabel: "Cadeia de confianca da RAXION",
    trustSteps: [
      "3x inferencia paralela (Transformer + SSM + NeuroSym)",
      "CoherenceScore = 0.4xCS_semantic + 0.6xCC",
      "Prova zk-ML gerada -> commitada na Solana L1",
      "Finalidade Cognitiva ✓",
    ],
  },
  {
    eyebrow: "根本问题",
    titleTop: "谁来判断",
    titleAccent: "判断者？",
    beforeLabel: "没有 RAXION",
    afterLabel: "有了 RAXION",
    intro: "今天的去中心化 AI 网络都在用同一种错误方式解决同一个问题：付费让人类判断机器质量。RAXION 去掉裁判，用数学取代主观。",
    structuralEyebrow: "结构性失效",
    structuralTitle: "预言机问题。",
    structuralAccent: "被代币化了。",
    structuralBody: "Bittensor 没有解决预言机问题，它只是把问题代币化了。预言机仍然是人类判断，只是现在被经济激励扭曲。",
    structuralBody2: "RAXION 彻底移除预言机。数学投票。",
    chainLabel: "RAXION 信任链",
    trustSteps: [
      "3 路并行推理 (Transformer + SSM + NeuroSym)",
      "CoherenceScore = 0.4xCS_semantic + 0.6xCC",
      "zk-ML 证明生成 -> 提交到 Solana L1",
      "认知终局性 ✓",
    ],
  },
  {
    eyebrow: "根本問題",
    titleTop: "誰が",
    titleAccent: "審判を裁くのか？",
    beforeLabel: "RAXION なし",
    afterLabel: "RAXION あり",
    intro: "現在の分散型 AI ネットワークは同じ問題を同じ誤った方法で解いています。人間に機械の品質を判定させているのです。RAXION は裁定者を取り除き、主観を数学に置き換えます。",
    structuralEyebrow: "構造的失敗",
    structuralTitle: "オラクル問題。",
    structuralAccent: "トークン化された。",
    structuralBody: "Bittensor はオラクル問題を解決していません。単にトークン化しただけです。オラクルは依然として人間の判断であり、経済的インセンティブで歪められています。",
    structuralBody2: "RAXION はオラクルを完全に排除します。数学が投票します。",
    chainLabel: "RAXION の信頼チェーン",
    trustSteps: [
      "3 系統の並列推論 (Transformer + SSM + NeuroSym)",
      "CoherenceScore = 0.4xCS_semantic + 0.6xCC",
      "zk-ML 証明を生成 -> Solana L1 にコミット",
      "認知ファイナリティ ✓",
    ],
  },
  {
    eyebrow: "El problema raiz",
    titleTop: "QUIEN JUZGA",
    titleAccent: "AL JUEZ?",
    beforeLabel: "Sin RAXION",
    afterLabel: "Con RAXION",
    intro: "Toda red de IA descentralizada hoy resuelve el mismo problema de la misma forma equivocada: paga a humanos para juzgar la calidad de la maquina. RAXION elimina al juez y reemplaza subjetividad por matematica.",
    structuralEyebrow: "La falla estructural",
    structuralTitle: "El problema del oraculo.",
    structuralAccent: "Tokenizado.",
    structuralBody: "Bittensor no resolvio el problema del oraculo. Lo tokenizo. El oraculo sigue siendo juicio humano, ahora distorsionado por incentivos economicos.",
    structuralBody2: "RAXION elimina por completo al oraculo. La matematica vota.",
    chainLabel: "Cadena de confianza de RAXION",
    trustSteps: [
      "3 inferencias en paralelo (Transformer + SSM + NeuroSym)",
      "CoherenceScore = 0.4xCS_semantic + 0.6xCC",
      "Prueba zk-ML generada -> commit en Solana L1",
      "Finalidad cognitiva ✓",
    ],
  }
);

const architectureHero = localized(
  [
    "NEURAL",
    "SHARDS.",
    "A sovereign cognitive runtime built to verify reasoning quality without human consensus.",
  ] as const,
  [
    "FRAGMENTOS",
    "NEURAIS.",
    "Um runtime cognitivo soberano construido para verificar qualidade de raciocinio sem consenso humano.",
  ] as const,
  ["神经", "分片。", "一个主权认知运行时，用于在没有人类共识的情况下验证推理质量。"] as const,
  ["ニューラル", "シャード。", "人間の合意なしで推論品質を検証するための主権的な認知ランタイム。"] as const,
  ["FRAGMENTOS", "NEURALES.", "Un runtime cognitivo soberano construido para verificar calidad de razonamiento sin consenso humano."] as const
);
const architectureCards = [
  localized<CardCopy>(
    [
      "Three architectures. One convergent signal.",
      "Transformer, State-Space, and Neuro-Symbolic agents execute in parallel because their failure modes differ. Agreement becomes evidence.",
    ],
    [
      "Tres arquiteturas. Um sinal convergente.",
      "Agentes Transformer, State-Space e Neuro-Symbolic executam em paralelo porque seus modos de falha sao diferentes. Convergencia vira evidencia.",
    ],
    [
      "三种架构。一个收敛信号。",
      "Transformer、State-Space 与 Neuro-Symbolic 代理并行执行，因为它们的失效模式不同。收敛因此成为证据。",
    ],
    [
      "三つのアーキテクチャ。ひとつの収束信号。",
      "Transformer、State-Space、Neuro-Symbolic の各エージェントは失敗モードが異なるため並列実行されます。収束はそのまま証拠になります。",
    ],
    [
      "Tres arquitecturas. Una senal convergente.",
      "Agentes Transformer, State-Space y Neuro-Symbolic ejecutan en paralelo porque sus modos de falla son distintos. La convergencia se vuelve evidencia.",
    ]
  ),
  localized<CardCopy>(
    [
      "Proof of execution plus proof of quality.",
      "RISC Zero proves execution. Jolt proves the quality path. Cognitive Finality only exists when both proof layers verify and coherence crosses threshold.",
    ],
    [
      "Prova de execucao mais prova de qualidade.",
      "RISC Zero prova a execucao. Jolt prova o caminho de qualidade. A Finalidade Cognitiva so existe quando as duas camadas verificam e a coerencia cruza o threshold.",
    ],
    [
      "执行证明加质量证明。",
      "RISC Zero 证明执行过程，Jolt 证明质量路径。只有当两层证明都通过且一致性跨过阈值时，认知终局性才成立。",
    ],
    [
      "実行証明と品質証明。",
      "RISC Zero は実行を証明し、Jolt は品質経路を証明します。両方の証明レイヤーが通り、一貫性が閾値を超えたときだけ認知ファイナリティが成立します。",
    ],
    [
      "Prueba de ejecucion mas prueba de calidad.",
      "RISC Zero prueba la ejecucion. Jolt prueba la ruta de calidad. La Finalidad Cognitiva solo existe cuando ambas capas verifican y la coherencia supera el umbral.",
    ]
  ),
  localized<CardCopy>(
    [
      "Hot-state on-chain. Cold-state by hash.",
      "Agents keep fast, compressed, protocol-owned memory in SVM state and anchor larger context in external storage with integrity commitments.",
    ],
    [
      "Memoria quente on-chain. Memoria fria por hash.",
      "Agentes mantem memoria rapida, comprimida e do proprio protocolo no estado da SVM, enquanto contexto maior fica em armazenamento externo com compromissos de integridade.",
    ],
    [
      "热状态在链上，冷状态以哈希引用。",
      "代理把快速、压缩且由协议控制的记忆保存在 SVM 状态中，并把更大的上下文放到外部存储，通过完整性承诺绑定。",
    ],
    [
      "ホットステートはオンチェーン、コールドステートはハッシュ参照。",
      "エージェントは高速で圧縮されたプロトコル所有メモリを SVM 状態に保持し、より大きな文脈は外部ストレージに置いて整合性コミットで結びます。",
    ],
    [
      "Memoria caliente on-chain. Memoria fria por hash.",
      "Los agentes guardan memoria rapida, comprimida y propiedad del protocolo dentro del estado de la SVM, mientras el contexto grande vive en almacenamiento externo con compromisos de integridad.",
    ]
  ),
] as const;
const proofTitle = localized(
  "Proof of Inference Quality",
  "Prova de Qualidade de Inferencia",
  "推理质量证明",
  "推論品質証明",
  "Prueba de Calidad de Inferencia"
);
const proofBodies = [
  localized(
    "Semantic agreement across three pairwise comparisons.",
    "Convergencia semantica em tres comparacoes pareadas.",
    "三组两两比较得到的语义收敛。",
    "三つのペア比較から得る意味的収束。",
    "Convergencia semantica a traves de tres comparaciones por pares."
  ),
  localized(
    "Causal coherence across premise consistency, conclusion alignment, and entailment.",
    "Coerencia causal entre consistencia de premissas, alinhamento de conclusao e entailment.",
    "前提一致性、结论对齐与蕴含关系构成的因果一致性。",
    "前提整合性、結論整列、含意関係から成る因果的一貫性。",
    "Coherencia causal entre consistencia de premisas, alineacion de conclusion y entailment."
  ),
] as const;
const economicsMeta = localized(
  ["Economic Energy", "Proof of Inference Quality", ["reward", "slash", "threads"]] as const,
  ["Energia Economica", "Prova de Qualidade de Inferencia", ["recompensa", "penalidade", "linhas"]] as const,
  ["经济能量", "推理质量证明", ["奖励", "罚没", "线程"]] as const,
  ["経済エネルギー", "推論品質証明", ["報酬", "スラッシュ", "スレッド"]] as const,
  ["Energia economica", "Prueba de Calidad de Inferencia", ["recompensa", "penalizacion", "hilos"]] as const
);

const roadmapMeta = localized<RoadmapCopy>(
  { eyebrow: "Development Phases", titleTop: "FROM", titleAccent: "GENESIS", titleBottom: "TO MAINNET." },
  { eyebrow: "Fases de Desenvolvimento", titleTop: "DE", titleAccent: "GENESE", titleBottom: "ATE A MAINNET." },
  { eyebrow: "开发阶段", titleTop: "从", titleAccent: "创世", titleBottom: "到主网。" },
  { eyebrow: "開発フェーズ", titleTop: "GENESIS", titleAccent: "から", titleBottom: "MAINNET へ。" },
  { eyebrow: "Fases de desarrollo", titleTop: "DE", titleAccent: "GENESIS", titleBottom: "A MAINNET." }
);
const roadmapPhases = [
  localized<PhaseCopy>(
    ["Completed", "Phase 0", "Genesis", ["Whitepaper complete", "CoherenceScore in Rust + Python", "RISC Zero proof-of-execution"]],
    ["Concluido", "Fase 0", "Genese", ["Whitepaper completo", "CoherenceScore em Rust + Python", "Prova de execucao do RISC Zero"]],
    ["已完成", "阶段 0", "创世", ["白皮书已完成", "Rust + Python CoherenceScore", "RISC Zero 执行证明"]],
    ["完了", "フェーズ 0", "ジェネシス", ["ホワイトペーパー公開", "Rust + Python の CoherenceScore", "RISC Zero 実行証明"]],
    ["Completado", "Fase 0", "Genesis", ["Whitepaper completo", "CoherenceScore en Rust + Python", "Prueba de ejecucion de RISC Zero"]]
  ),
  localized<PhaseCopy>(
    ["Completed", "Phase 1", "Devnet", ["Agave integration", "PoIQ v0.1 on-chain", "Rust Smart Agent SDK"]],
    ["Concluido", "Fase 1", "Devnet", ["Integracao com Agave", "PoIQ v0.1 em cadeia", "SDK Rust para Smart Agents"]],
    ["已完成", "阶段 1", "开发网", ["Agave 集成", "PoIQ v0.1 上链", "Rust 智能代理 SDK"]],
    ["完了", "フェーズ 1", "開発ネット", ["Agave 統合", "PoIQ v0.1 をオンチェーン化", "Rust Smart Agent SDK"]],
    ["Completado", "Fase 1", "Devnet", ["Integracion con Agave", "PoIQ v0.1 en cadena", "SDK de Smart Agents en Rust"]]
  ),
  localized<PhaseCopy>(
    ["Active Now", "Phase 2", "Testnet", ["GPU proof acceleration", "Full challenge categories", "RaxLang beta"]],
    ["Ativo agora", "Fase 2", "Testnet", ["Aceleracao de provas por GPU", "Categorias completas de desafio", "RaxLang beta"]],
    ["当前进行中", "阶段 2", "测试网", ["GPU 证明加速", "完整挑战类型", "RaxLang 测试版"]],
    ["進行中", "フェーズ 2", "テストネット", ["GPU による証明高速化", "完全なチャレンジ分類", "RaxLang ベータ"]],
    ["Activo ahora", "Fase 2", "Testnet", ["Aceleracion de pruebas por GPU", "Categorias completas de desafio", "RaxLang beta"]]
  ),
  localized<PhaseCopy>(
    ["Next", "Phase 3", "Mainnet v1", ["ZK ASIC first-gen", "PoIQ v1 formal audit", "On-chain governance"]],
    ["Proximo", "Fase 3", "Mainnet v1", ["ZK ASIC de primeira geracao", "Auditoria formal do PoIQ v1", "Governanca on-chain"]],
    ["下一步", "阶段 3", "主网 v1", ["第一代 ZK ASIC", "PoIQ v1 正式审计", "链上治理"]],
    ["次", "フェーズ 3", "メインネット v1", ["第一世代 ZK ASIC", "PoIQ v1 正式監査", "オンチェーンガバナンス"]],
    ["Siguiente", "Fase 3", "Mainnet v1", ["Primera generacion de ZK ASIC", "Auditoria formal de PoIQ v1", "Gobernanza on-chain"]]
  ),
] as const;

const whitepaperCopy = localized<WhitepaperCopy>(
  {
    eyebrow: "RAXION Whitepaper v0.4 | February 2026",
    title: "The era of proofs begins.",
    body: "Full protocol architecture, zk-ML proof mechanics, PoIQ formulas, token mechanics, and the roadmap from genesis to mainnet.",
    primary: "READ WHITEPAPER",
    secondary: "VIEW GITHUB",
  },
  {
    eyebrow: "RAXION Whitepaper v0.4 | Fevereiro 2026",
    title: "A era das provas comeca.",
    body: "Arquitetura completa do protocolo, mecanica zk-ML, formulas PoIQ, tokenomics e roadmap da genese ao mainnet.",
    primary: "LER WHITEPAPER",
    secondary: "VER GITHUB",
  },
  {
    eyebrow: "RAXION 白皮书 v0.4 | 2026 年 2 月",
    title: "证明时代开始了。",
    body: "完整协议架构、zk-ML 机制、PoIQ 公式、代币机制以及从创世到主网的路线图。",
    primary: "阅读白皮书",
    secondary: "查看 GITHUB",
  },
  {
    eyebrow: "RAXION Whitepaper v0.4 | 2026年2月",
    title: "証明の時代が始まる。",
    body: "完全なプロトコル構造、zk-ML、PoIQ 数式、トークン設計、ジェネシスからメインネットまでのロードマップ。",
    primary: "ホワイトペーパーを読む",
    secondary: "GITHUB を見る",
  },
  {
    eyebrow: "RAXION Whitepaper v0.4 | Febrero 2026",
    title: "Empieza la era de las pruebas.",
    body: "Arquitectura completa del protocolo, mecanica zk-ML, formulas PoIQ, tokenomics y roadmap desde genesis hasta mainnet.",
    primary: "LEER WHITEPAPER",
    secondary: "VER GITHUB",
  }
);
const footer = localized(
  "Built for the post-subjectivity era c 2026",
  "Construido para a era pos-subjetividade c 2026",
  "为后主观时代而建 c 2026",
  "ポスト主観時代のために構築 c 2026",
  "Construido para la era post-subjetividad c 2026"
);
const postCopy = localized<PostCopy>(
  {
    backToHome: "Back to site",
    authorLabel: "Author",
    publishedLabel: "Published",
    relatedLabel: "More from RAXION",
    blogLabel: "Blog",
    announcementsLabel: "Announcements",
    visitBlog: "Visit blog",
    visitAnnouncements: "Visit announcements",
  },
  {
    backToHome: "Back to site",
    authorLabel: "Author",
    publishedLabel: "Published",
    relatedLabel: "More from RAXION",
    blogLabel: "Blog",
    announcementsLabel: "Anuncios",
    visitBlog: "Visitar blog",
    visitAnnouncements: "Ver anuncios",
  },
  {
    backToHome: "Back to site",
    authorLabel: "Author",
    publishedLabel: "Published",
    relatedLabel: "More from RAXION",
    blogLabel: "博客",
    announcementsLabel: "公告",
    visitBlog: "访问博客",
    visitAnnouncements: "查看公告",
  },
  {
    backToHome: "Back to site",
    authorLabel: "Author",
    publishedLabel: "Published",
    relatedLabel: "More from RAXION",
    blogLabel: "ブログ",
    announcementsLabel: "お知らせ",
    visitBlog: "ブログへ",
    visitAnnouncements: "お知らせ一覧",
  },
  {
    backToHome: "Back to site",
    authorLabel: "Author",
    publishedLabel: "Published",
    relatedLabel: "More from RAXION",
    blogLabel: "Blog",
    announcementsLabel: "Anuncios",
    visitBlog: "Visitar blog",
    visitAnnouncements: "Ver anuncios",
  }
);
const localeLabel = localized("Language", "Idioma", "语言", "言語", "Idioma");

function buildSiteDictionary(locale: Locale): SiteDictionary {
  const metrics = mapLocalizedRows(metricRows, locale);
  const cards = mapLocalizedRows(architectureCards, locale);
  const proofItemBodies = mapLocalizedRows(proofBodies, locale);
  const phases = mapLocalizedRows(roadmapPhases, locale);
  const economy = economicsMeta[locale];
  const currentPost = postCopy[locale];
  const whitepaper = whitepaperCopy[locale];
  const roadmap = roadmapMeta[locale];

  return {
    nav: navLabels[locale].map((label, index) => ({ href: navHrefs[index], label })),
    menuLabel: menuLabel[locale],
    announcementLabel: announcementLabel[locale],
    readAnnouncement: readAnnouncement[locale],
    latestAnnouncementEyebrow: latestAnnouncementEyebrow[locale],
    heroBadge: heroBadge[locale],
    heroLines: heroLines[locale],
    heroOrb: { title: heroOrb[locale][0], subtitle: heroOrb[locale][1] },
    heroCtas: { primary: heroCtas[locale][0], secondary: heroCtas[locale][1] },
    heroNotes: heroNotes[locale],
    marqueeItems: [...marqueeItems[locale]],
    metrics: metrics.map((metric, index) => ({
      value: metricValues[index],
      suffix: metric[0],
      label: metric[1],
      sublabel: metric[2],
      accent: metricAccents[index],
    })),
    problem: problemCopy[locale],
    architecture: {
      title: architectureHero[locale][0],
      titleAccent: architectureHero[locale][1],
      summary: architectureHero[locale][2],
      cards: cards.map((card, index) => ({
        title: cardTitles[index],
        heading: card[0],
        body: card[1],
        accent: cardAccents[index],
      })),
      proofTitle: proofTitle[locale],
      proofItems: proofItemBodies.map((body, index) => ({
        title: proofLabels[index],
        body,
        accent: proofAccents[index],
      })),
      economicsEyebrow: economy[0],
      economicsTitle: economy[1],
      economicsLines: economy[2].map((label, index) => ({
        label,
        expression: economicsExpressions[index],
        accent: economicsAccents[index],
      })),
    },
    roadmap: {
      eyebrow: roadmap.eyebrow,
      titleTop: roadmap.titleTop,
      titleAccent: roadmap.titleAccent,
      titleBottom: roadmap.titleBottom,
      phases: phases.map((phase, index) => ({
        label: phase[0],
        date: roadmapDates[index],
        title: phase[1],
        accent: phase[2],
        accentClass: roadmapAccentClasses[index],
        active: roadmapActive[index],
        items: phase[3],
      })),
    },
    whitepaper: {
      eyebrow: whitepaper.eyebrow,
      title: whitepaper.title,
      body: whitepaper.body,
      ctas: { primary: whitepaper.primary, secondary: whitepaper.secondary },
    },
    footer: footer[locale],
    post: currentPost,
    localeLabel: localeLabel[locale],
    localeNames,
  };
}

export const siteContent: Record<Locale, SiteDictionary> = Object.fromEntries(
  locales.map((locale) => [locale, buildSiteDictionary(locale)])
) as Record<Locale, SiteDictionary>;

export function getSiteContent(locale: Locale): SiteDictionary {
  return siteContent[locale];
}

export function getHomeUseCases(locale: Locale): Array<[string, string, string]> {
  return homeUseCases[locale];
}

export const availableLocales = locales;
