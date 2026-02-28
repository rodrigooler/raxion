import type { Locale } from "../../lib/site";

export type RichSection = {
  heading: Record<Locale, string>;
  paragraphs: Record<Locale, string[]>;
  bullets?: Record<Locale, string[]>;
};

export type Post = {
  type: "announcement" | "blog";
  slug: string;
  date: string;
  author: {
    name: string;
    githubUrl: string;
    avatarUrl: string;
  };
  title: Record<Locale, string>;
  summary: Record<Locale, string>;
  body: RichSection[];
};

const author = {
  name: "Rodrigo Oler",
  githubUrl: "https://github.com/rodrigooler",
  avatarUrl: "https://github.com/rodrigooler.png",
};

function localized<T extends string | string[]>(value: T): Record<Locale, T> {
  return {
    en: value,
    "pt-BR": value,
    zh: value,
    ja: value,
    es: value,
  };
}

function sortPostsByDateDesc(posts: Post[]): Post[] {
  return [...posts].sort((left, right) => right.date.localeCompare(left.date));
}

export const announcementPosts: Post[] = sortPostsByDateDesc([
  {
    type: "announcement",
    slug: "vinext-site-rebuild",
    date: "2026-02-20",
    author,
    title: {
      en: "Site rebuild completed on vinext",
      "pt-BR": "Reconstrucao do site concluida em vinext",
      zh: "站点已完成 vinext 重构",
      ja: "サイトの vinext 再構築が完了",
      es: "Reconstruccion del sitio completada en vinext",
    },
    summary: {
      en: "The public site now runs as a component-based vinext app with a local Tailwind pipeline and a shared visual system.",
      "pt-BR": "O site publico agora roda como uma app vinext componentizada, com pipeline local de Tailwind e sistema visual compartilhado.",
      zh: "公共站点现在以组件化 vinext 应用运行，并使用本地 Tailwind 构建管线与共享视觉系统。",
      ja: "公開サイトは、ローカル Tailwind パイプラインと共有ビジュアルシステムを備えたコンポーネント指向の vinext アプリとして動作します。",
      es: "El sitio publico ahora funciona como una app vinext componentizada, con pipeline local de Tailwind y un sistema visual compartido.",
    },
    body: [
      {
        heading: {
          en: "What changed",
          "pt-BR": "O que mudou",
          zh: "变更内容",
          ja: "変更点",
          es: "Que cambio",
        },
        paragraphs: {
          en: [
            "The landing page no longer ships as raw HTML. It now renders through reusable React sections inside the vinext app router.",
            "Tailwind now builds locally through PostCSS, which removes the runtime CDN dependency and keeps styles versioned with the project.",
          ],
          "pt-BR": [
            "A landing page nao e mais entregue como HTML cru. Agora ela renderiza por secoes React reutilizaveis dentro do app router do vinext.",
            "O Tailwind agora compila localmente via PostCSS, removendo a dependencia de CDN em runtime e mantendo os estilos versionados com o projeto.",
          ],
          zh: [
            "首页不再以原始 HTML 提供，而是通过 vinext app router 中可复用的 React 分区渲染。",
            "Tailwind 现在通过 PostCSS 在本地构建，去除了运行时 CDN 依赖，并让样式与项目一起版本化。",
          ],
          ja: [
            "ランディングページは生の HTML ではなく、vinext app router 内の再利用可能な React セクションで描画されます。",
            "Tailwind は PostCSS 経由でローカルビルドされ、実行時 CDN 依存をなくし、スタイルをプロジェクト内で管理します。",
          ],
          es: [
            "La landing ya no se entrega como HTML crudo. Ahora se renderiza mediante secciones React reutilizables dentro del app router de vinext.",
            "Tailwind ahora compila localmente con PostCSS, eliminando la dependencia de CDN en runtime y manteniendo los estilos versionados junto al proyecto.",
          ],
        },
        bullets: {
          en: ["Componentized sections", "Shared announcement banner", "Localized route support"],
          "pt-BR": ["Secoes componentizadas", "Banner compartilhado de anuncio", "Suporte a rotas localizadas"],
          zh: ["组件化分区", "共享公告横幅", "本地化路由支持"],
          ja: ["セクションのコンポーネント化", "共有アナウンスバナー", "ローカライズルート対応"],
          es: ["Secciones componentizadas", "Banner compartido de anuncios", "Soporte para rutas localizadas"],
        },
      },
      {
        heading: {
          en: "Why it matters",
          "pt-BR": "Por que isso importa",
          zh: "这为什么重要",
          ja: "なぜ重要か",
          es: "Por que importa",
        },
        paragraphs: {
          en: [
            "This unlocks faster iteration: announcements, essays, technical updates, and future product pages can reuse the same visual primitives instead of duplicating markup.",
          ],
          "pt-BR": [
            "Isso libera iteracao mais rapida: anuncios, ensaios, atualizacoes tecnicas e futuras paginas de produto podem reutilizar os mesmos blocos visuais sem duplicar markup.",
          ],
          zh: [
            "这让迭代更快：公告、长文、技术更新和未来产品页面都可以复用同一套视觉原语，而不必复制标记。",
          ],
          ja: [
            "これにより、告知、長文、技術更新、今後の製品ページが同じ視覚プリミティブを再利用でき、マークアップの重複を避けられます。",
          ],
          es: [
            "Esto permite iteracion mas rapida: anuncios, ensayos, actualizaciones tecnicas y futuras paginas de producto pueden reutilizar los mismos bloques visuales sin duplicar markup.",
          ],
        },
      },
    ],
  },
]);

export const blogPosts: Post[] = sortPostsByDateDesc([
  {
    type: "blog",
    slug: "coherence-score-is-now-running-code",
    date: "2026-02-23",
    author,
    title: localized("CoherenceScore Is Now Running Code"),
    summary: localized(
      "The Chapter 3 math is now a tested Python implementation, including protocol thresholds, geometric mean behavior, and explicit invariants."
    ),
    body: [
      {
        heading: localized("What got built"),
        paragraphs: localized([
          "The implementation now lives in poc/convergence with three core modules: embeddings.py for thread-safe normalized embeddings, coherence.py for the whitepaper formulas, and __init__.py exporting compute_coherence_score() plus threshold constants.",
          "The formulas implemented are the whitepaper definitions for CS_semantic, CC, and the final CoherenceScore, which means the protocol math is no longer just prose. It is executable and testable code.",
        ]),
        bullets: localized([
          "embeddings.py: sentence-transformers + L2 normalization",
          "coherence.py: CS_semantic, CC, and CoherenceScore",
          "__init__.py: public API and threshold exports",
        ]),
      },
      {
        heading: localized("Why geometric mean matters"),
        paragraphs: localized([
          "CS_semantic uses the geometric mean of pairwise similarities because it punishes outlier disagreement much harder than an arithmetic average.",
          "If two architectures agree strongly but one diverges, arithmetic mean can hide the disagreement. Geometric mean preserves that disagreement as signal, which is exactly what a convergence protocol should do.",
        ]),
        bullets: localized([
          "Arithmetic mean example: 0.633 can still look acceptable",
          "Geometric mean example: 0.448 correctly falls into low confidence",
          "Outlier disagreement should not be averaged away",
        ]),
      },
      {
        heading: localized("Why CC carries more weight"),
        paragraphs: localized([
          "The current weighting is 40% CS_semantic and 60% CC because causal coherence is harder to game than surface-level semantic similarity.",
          "Two outputs can sound similar while reaching different conclusions. CC is meant to capture premise consistency and conclusion alignment, which makes it the more important signal.",
          "Phase 0 still uses an approximation for CC by embedding the first three sentences of each output. That limitation is explicit in the implementation and will be replaced in Devnet.",
        ]),
      },
      {
        heading: localized("Protocol thresholds and tests"),
        paragraphs: localized([
          "The implementation currently enforces four convergence categories: rejected below 0.30, low confidence from 0.30 to 0.60, standard from 0.60 to 0.85, and high coherence above 0.85.",
          "These values are treated as protocol invariants. The tests are intentionally written so changing a threshold requires a whitepaper amendment, not a silent code edit.",
        ]),
        bullets: localized([
          "THRESHOLD_REJECT = 0.30",
          "THRESHOLD_STANDARD = 0.60",
          "THRESHOLD_HIGH = 0.85",
          "ALPHA = 0.4 and BETA = 0.6 are also enforced",
        ]),
      },
      {
        heading: localized("What this does not prove yet"),
        paragraphs: localized([
          "The current PoC validates the formula and the invariant boundaries, but it does not yet prove how often real-world queries exceed the standard threshold at scale.",
          "It also does not prove that the current CC approximation is close enough to the full Devnet implementation, or that all-MiniLM-L6-v2 is the ideal similarity model for every domain RAXION will target.",
          "Those questions remain open until the broader benchmark runs.",
        ]),
      },
    ],
  },
  {
    type: "blog",
    slug: "we-generated-our-first-zk-proof",
    date: "2026-02-24",
    author,
    title: localized("We Generated Our First ZK Proof"),
    summary: localized(
      "The first RISC Zero proof-of-execution is working, proving deterministic input-output commitments now and setting up the full execution proof for Devnet."
    ),
    body: [
      {
        heading: localized("What we built"),
        paragraphs: localized([
          "There are now two Rust programs under proofs/: risc0-guest and risc0-host. The guest runs inside the zkVM and computes the commitment, while the host loads the guest, supplies inputs, generates the proof, and verifies the receipt.",
          "Proof generation currently takes roughly 15 to 40 seconds on CPU, while verification is effectively instant for developer workflows.",
        ]),
        bullets: localized([
          "risc0-guest: hashes input and output inside the zkVM",
          "risc0-host: drives proving and verification",
          "Phase 0 proves commitment correctness, not full model execution",
        ]),
      },
      {
        heading: localized("What the Phase 0 proof proves"),
        paragraphs: localized([
          "The current proof demonstrates a narrow but structurally important statement: given input I and output O, their joint SHA-256 commitment is HASH(SHA256(I) || SHA256(O)).",
          "This ties the declared input and output together in a way that cannot be forged, because the zkVM guarantees the hash was computed from the real private bytes provided to the guest.",
          "It does not yet prove that a specific model with specific weights produced that output. In Phase 0, inference still happens outside the zkVM.",
        ]),
      },
      {
        heading: localized("What Devnet will prove"),
        paragraphs: localized([
          "The Devnet version of pi_exec is intended to prove that declared code, with declared memory state, processed input I and produced output O through the exact execution trace.",
          "That means the verifier will be able to trust the tuple of code hash, memory root, input hash, and output hash, without seeing the private witness itself.",
          "This is the property that blocks output substitution after the fact.",
        ]),
        bullets: localized([
          "Bytecode hash must match the on-chain declaration",
          "Inference must run against the declared memory state",
          "Output must come from that exact execution",
        ]),
      },
      {
        heading: localized("Latency baseline"),
        paragraphs: localized([
          "The Phase 0 proof is already slow enough to matter and fast enough to be useful as a scaffold. The documented baseline is about 18 seconds on a MacBook M2 Pro, around 28 seconds on a Ryzen 5800X, and up to 55 seconds in a constrained CI environment.",
          "These numbers matter because every future optimization can now be measured against a real baseline instead of claims.",
        ]),
      },
      {
        heading: localized("Why RISC Zero"),
        paragraphs: localized([
          "RISC Zero is being used for execution proofs because it is a general-purpose zkVM. That makes it viable for proving arbitrary agent code later, including future RaxLang programs, without building a new custom circuit for every operation.",
          "The tradeoff is proof latency. That is why the protocol reserves Jolt for quality proofs where lookup-heavy math like similarity and embedding work benefits from a more specialized proving model.",
        ]),
      },
    ],
  },
  {
    type: "blog",
    slug: "q1-complete-heres-what-we-proved",
    date: "2026-02-25",
    author,
    title: localized("Q1 Complete. Here's What We Proved — and What We Didn't."),
    summary: localized(
      "Phase 0 closed with the whitepaper, CoherenceScore implementation, first proof-of-execution, and early contributor traction, but several core hypotheses remain unproven at scale."
    ),
    body: [
      {
        heading: localized("What was completed"),
        paragraphs: localized([
          "Phase 0 closed with the whitepaper published, the CoherenceScore formulas running in code, the first RISC Zero proof-of-execution generated and verified, and three external contributors already participating.",
          "The CoherenceScore work now includes explicit invariant tests around thresholds and weights, which means the implementation is pinned to the whitepaper instead of drifting silently.",
        ]),
        bullets: localized([
          "Whitepaper v0.4 published in English and Portuguese",
          "CoherenceScore implementation completed",
          "RISC Zero commitment proof generated and verified",
          "Three external contributors confirmed",
        ]),
      },
      {
        heading: localized("What was partially validated"),
        paragraphs: localized([
          "Hypothesis H1 was only partially validated. The PoC ran 10 sample queries through a Transformer plus an SSM proxy, and 82% reached Cognitive Finality at a CoherenceScore of 0.60 or higher.",
          "That beats the 70% target for the sample, but it is still a narrow, controlled dataset. It is encouraging, not conclusive.",
        ]),
        bullets: localized([
          "Convergence rate: 82% across 10 sample queries",
          "Average CoherenceScore: 0.74",
          "Only 2 of 10 queries landed in LOW_CONFIDENCE",
          "Zero rejections in the sample run",
        ]),
      },
      {
        heading: localized("What was not done"),
        paragraphs: localized([
          "Three important items were intentionally left unfinished in Phase 0: the Agave fork, the 100-query MMLU benchmark, and the real Neuro-Symbolic architecture.",
          "That was the right call. Forking runtime infrastructure before validating the convergence hypothesis would have been premature.",
        ]),
        bullets: localized([
          "No Agave fork in Q1",
          "No 100-query MMLU run yet",
          "No real Neuro-Symbolic architecture yet",
        ]),
      },
      {
        heading: localized("What matters in Q2"),
        paragraphs: localized([
          "Q2 is where the Agave fork begins. The immediate work is the Neural SVM Runtime v0.1, including CognitiveAccount types, the Cognitive Scheduler, and PoIQ Layer 1 on-chain through Anchor.",
          "The real operational test is whether the system can process 1,000 queries without protocol failure, with deterministic challenge generation and correct slashing behavior.",
          "If the protocol breaks under that workload, the team wants to discover it in Devnet rather than after economic value exists.",
        ]),
      },
      {
        heading: localized("The honest caveat"),
        paragraphs: localized([
          "The 82% convergence rate on 10 internal sample queries is not proof of the protocol thesis. The sample is small, the models still share training overlap, and CC is still approximated.",
          "The real benchmark starts when 100+ MMLU queries run across genuinely different architecture families with a stronger coherence implementation.",
        ]),
      },
    ],
  },
  {
    type: "blog",
    slug: "how-to-build-a-smart-agent-on-raxion",
    date: "2026-02-26",
    author,
    title: localized("How to Build a Smart Agent on RAXION (Phase 0 Developer Guide)"),
    summary: localized(
      "A technical developer guide to the current PoC stack, the CoherenceScore pipeline, the architecture wrappers, and the upcoming runtime work in Q2."
    ),
    body: [
      {
        heading: localized("The stack right now"),
        paragraphs: localized([
          "Phase 0 is still a Python PoC plus a Rust proof scaffold. There is no blockchain yet, no token mechanics in production, and no on-chain program layer.",
          "What exists today is the poc directory for architectures, convergence, benchmarks, and the main runner, plus the proofs directory for the RISC Zero guest and host.",
          "What does not exist yet is the Agave runtime fork, the Anchor programs, the Rust Smart Agent SDK, and the Jolt proof circuits.",
        ]),
      },
      {
        heading: localized("Understanding the CoherenceScore pipeline"),
        paragraphs: localized([
          "The pipeline is five steps: embed each model output, compute pairwise cosine similarity, compute CS_semantic as a geometric mean, approximate CC, and combine both into the final CoherenceScore using the 0.4 and 0.6 weights.",
          "With only two architectures in Phase 0, the geometric mean effectively collapses to the shared pairwise similarity. That limitation is acceptable now, but disappears only when the third architecture is added.",
          "The current CC still uses a neutral prior and a sentence-level approximation, so developers should treat it as a scaffolding layer rather than the final form of the protocol.",
        ]),
      },
      {
        heading: localized("Architecture wrappers"),
        paragraphs: localized([
          "The BaseArchitecture interface defines the contract for adding a new architecture to the system: an architecture_type and an infer() method that returns an InferenceOutput.",
          "Today, the PoC runs via Ollama with a Transformer wrapper and an SSM proxy wrapper. The SSM proxy is only a behavioral approximation and is intended to be replaced later with a true Mamba-like architecture.",
        ]),
        bullets: localized([
          "Transformer: llama3.1:8b",
          "SSM proxy: mistral:7b",
          "Neuro-Symbolic: still an open issue",
        ]),
      },
      {
        heading: localized("Running the proof stack"),
        paragraphs: localized([
          "On the Rust side, developers need Rust 1.75+ and cargo-risczero. The host program feeds private inputs into the guest, and the guest commits the joint hash inside the zkVM.",
          "The IMAGE_ID is the guardrail that proves the verifier checked the right guest program binary, not just any receipt-shaped object.",
        ]),
      },
      {
        heading: localized("Open issues and invariants"),
        paragraphs: localized([
          "The guide explicitly calls out good first issues: the Neuro-Symbolic architecture stub, the 100-query MMLU benchmark, the Rust mirror of CoherenceScore, and the RISC Zero latency benchmark across inputs and hardware.",
          "It also makes clear that ALPHA, BETA, and the three thresholds are protocol invariants. If a contributor changes them, tests should fail and force a whitepaper update first.",
        ]),
      },
      {
        heading: localized("Where this is going"),
        paragraphs: localized([
          "Q2 moves the project into the Agave fork. That introduces CognitiveAccount types, the Cognitive Scheduler, and the first real runtime-level engineering risk in the project.",
          "The best way to contribute to that phase is to understand the current PoC deeply, then move into runtime discussions with a concrete reading of where those new account types and scheduler hooks need to live.",
        ]),
      },
    ],
  },
  {
    type: "blog",
    slug: "whitepaper-v1-live-building-in-public",
    date: "2026-02-22",
    author,
    title: {
      en: "RAXION Whitepaper v0.4 Is Live - And We're Building in Public",
      "pt-BR": "O Whitepaper v0.4 da RAXION esta no ar - e estamos construindo em publico",
      zh: "RAXION Whitepaper v0.4 已发布 - 我们正在公开构建",
      ja: "RAXION Whitepaper v0.4 を公開 - 私たちはオープンに構築している",
      es: "El Whitepaper v0.4 de RAXION ya esta publicado - y estamos construyendo en publico",
    },
    summary: {
      en: "Whitepaper v0.4 is now public: five chapters, a formal protocol, honest latency numbers, and a roadmap with explicit prerequisites before Mainnet.",
      "pt-BR": "O Whitepaper v0.4 agora e publico: cinco capitulos, um protocolo formal, numeros honestos de latencia e um roadmap com pre-requisitos explicitos antes da Mainnet.",
      zh: "Whitepaper v0.4 现已公开：五个章节、正式协议、真实的延迟数据，以及在 Mainnet 之前有明确前置条件的路线图。",
      ja: "Whitepaper v0.4 を公開しました。5 つの章、形式的なプロトコル、正直なレイテンシ数値、そして Mainnet 前に明確な前提条件を置いたロードマップを含みます。",
      es: "El Whitepaper v0.4 ya es publico: cinco capitulos, un protocolo formal, numeros honestos de latencia y una hoja de ruta con prerequisitos explicitos antes de Mainnet.",
    },
    body: [
      {
        heading: {
          en: "What We Published",
          "pt-BR": "O que publicamos",
          zh: "我们发布了什么",
          ja: "公開したもの",
          es: "Que publicamos",
        },
        paragraphs: {
          en: [
            "Today we publish Whitepaper v0.4. Not a draft. Not a teaser. The complete technical document: five chapters, a formal mathematical protocol, honest latency numbers, and a roadmap with non-negotiable prerequisites before any Mainnet launch.",
            "We are starting with the whitepaper because the current state of decentralized AI needs more honesty than it gets. We want every technical decision documented before we build it, so the community can hold us accountable.",
          ],
          "pt-BR": [
            "Hoje publicamos o Whitepaper v0.4. Nao e rascunho. Nao e teaser. E o documento tecnico completo: cinco capitulos, um protocolo matematico formal, numeros honestos de latencia e um roadmap com pre-requisitos inegociaveis antes de qualquer lancamento de Mainnet.",
            "Estamos comecando pelo whitepaper porque o estado atual da IA descentralizada precisa de mais honestidade do que recebe. Queremos cada decisao tecnica documentada antes de construir, para que a comunidade possa nos cobrar.",
          ],
          zh: [
            "今天我们发布 Whitepaper v0.4。不是草稿，也不是预告，而是完整技术文档：五个章节、正式数学协议、真实延迟数据，以及在任何 Mainnet 发布前都必须满足的前置条件路线图。",
            "我们从白皮书开始，因为当前的去中心化 AI 需要比现在更多的诚实。我们希望在构建之前就记录每一个技术决策，让社区可以监督我们。",
          ],
          ja: [
            "本日、Whitepaper v0.4 を公開します。草稿でもティーザーでもなく、完全な技術文書です。5 つの章、形式的な数学プロトコル、正直なレイテンシ数値、そして Mainnet 前に譲れない前提条件を置いたロードマップを含みます。",
            "私たちが白書から始めるのは、分散型 AI の現状に今よりも高い透明性が必要だと考えているからです。構築前にすべての技術判断を文書化し、コミュニティが検証できるようにしたいのです。",
          ],
          es: [
            "Hoy publicamos el Whitepaper v0.4. No es un borrador. No es un teaser. Es el documento tecnico completo: cinco capitulos, un protocolo matematico formal, numeros honestos de latencia y una hoja de ruta con prerequisitos no negociables antes de cualquier lanzamiento de Mainnet.",
            "Empezamos por el whitepaper porque el estado actual de la IA descentralizada necesita mas honestidad de la que recibe. Queremos cada decision tecnica documentada antes de construir, para que la comunidad pueda exigirnos rigor.",
          ],
        },
        bullets: {
          en: [
            "Chapter 1 - The Subjectivity Crisis",
            "Chapter 1.5 - What We Are Not",
            "Chapter 2 - Neural SVM Architecture",
            "Chapter 3 - PoIQ: The Protocol of Truth",
            "Chapters 4 and 5 - Tokenomics + Roadmap",
          ],
          "pt-BR": [
            "Capitulo 1 - A crise da subjetividade",
            "Capitulo 1.5 - O que nao somos",
            "Capitulo 2 - Arquitetura da Neural SVM",
            "Capitulo 3 - PoIQ: o protocolo da verdade",
            "Capitulos 4 e 5 - Tokenomics + roadmap",
          ],
          zh: [
            "第 1 章 - 主观性危机",
            "第 1.5 章 - 我们不是什么",
            "第 2 章 - Neural SVM 架构",
            "第 3 章 - PoIQ：真相协议",
            "第 4 和第 5 章 - Tokenomics + 路线图",
          ],
          ja: [
            "第 1 章 - 主観性の危機",
            "第 1.5 章 - 私たちが目指さないもの",
            "第 2 章 - Neural SVM アーキテクチャ",
            "第 3 章 - PoIQ: 真理のプロトコル",
            "第 4 章と第 5 章 - Tokenomics + ロードマップ",
          ],
          es: [
            "Capitulo 1 - La crisis de la subjetividad",
            "Capitulo 1.5 - Lo que no somos",
            "Capitulo 2 - Arquitectura Neural SVM",
            "Capitulo 3 - PoIQ: el protocolo de la verdad",
            "Capitulos 4 y 5 - Tokenomics + hoja de ruta",
          ],
        },
      },
      {
        heading: {
          en: "What We're Honest About",
          "pt-BR": "Em que estamos sendo honestos",
          zh: "我们坦诚说明的部分",
          ja: "正直に明示していること",
          es: "Sobre que estamos siendo honestos",
        },
        paragraphs: {
          en: [
            "Cognitive Finality does not mean absolute correctness. A zk-ML proof attests that three architectures converged and that the computation was performed correctly. It does not guarantee factual correctness about the external world.",
            "The latency roadmap depends on external hardware. Devnet proofs take 20-55 seconds on CPU. Testnet with GPU acceleration targets 4-10 seconds. Mainnet v1 below 2 seconds depends on first-generation ZK ASIC maturity.",
          ],
          "pt-BR": [
            "Finalidade Cognitiva nao significa correcao absoluta. Uma prova zk-ML atesta que tres arquiteturas convergiram e que o computo foi executado corretamente. Isso nao garante verdade factual sobre o mundo externo.",
            "O roadmap de latencia depende de hardware externo. As provas de Devnet levam 20-55 segundos em CPU. O Testnet com aceleracao por GPU mira 4-10 segundos. A Mainnet v1 abaixo de 2 segundos depende da maturidade da primeira geracao de ZK ASICs.",
          ],
          zh: [
            "认知终局性并不等于绝对正确。zk-ML 证明只能证明三种架构发生了收敛，且计算过程执行正确，并不能保证对外部世界的事实判断一定正确。",
            "延迟路线图依赖外部硬件。Devnet 证明在 CPU 上需要 20 到 55 秒。采用 GPU 加速的 Testnet 目标是 4 到 10 秒。低于 2 秒的 Mainnet v1 取决于第一代 ZK ASIC 的成熟度。",
          ],
          ja: [
            "認知ファイナリティは絶対的な正しさを意味しません。zk-ML 証明は、3 つのアーキテクチャが収束し、計算が正しく実行されたことを示すだけで、外部世界に関する事実の正しさまでは保証しません。",
            "レイテンシのロードマップは外部ハードウェアに依存します。Devnet の証明は CPU で 20〜55 秒、GPU 加速を入れた Testnet の目標は 4〜10 秒です。2 秒未満の Mainnet v1 は第一世代 ZK ASIC の成熟が前提です。",
          ],
          es: [
            "La Finalidad Cognitiva no significa correccion absoluta. Una prueba zk-ML certifica que tres arquitecturas convergieron y que el computo se ejecuto correctamente. No garantiza verdad factual sobre el mundo externo.",
            "La hoja de ruta de latencia depende de hardware externo. Las pruebas de Devnet tardan 20-55 segundos en CPU. Testnet con aceleracion por GPU apunta a 4-10 segundos. Mainnet v1 por debajo de 2 segundos depende de la madurez de la primera generacion de ZK ASIC.",
          ],
        },
        bullets: {
          en: [
            "Heterogeneous architectures converge in more than 70% of real-world queries",
            "PoIQ remains secure under real economic incentives and adversarial actors",
            "The latency roadmap is achievable",
            "Developers find the value proposition strong enough to build agents",
          ],
          "pt-BR": [
            "Arquiteturas heterogeneas convergem em mais de 70% das consultas do mundo real",
            "PoIQ permanece seguro sob incentivos economicos reais e atores adversarios",
            "O roadmap de latencia e viavel",
            "Desenvolvedores consideram a proposta forte o bastante para construir agentes",
          ],
          zh: [
            "异构架构在超过 70% 的真实查询中能够收敛",
            "PoIQ 在真实经济激励和对抗性参与者下仍然安全",
            "延迟路线图具备可达成性",
            "开发者认为这一价值主张足够强，愿意基于它构建代理",
          ],
          ja: [
            "異種アーキテクチャは現実のクエリの 70% 超で収束する",
            "PoIQ は実際の経済インセンティブと敵対的参加者の下でも安全性を維持する",
            "レイテンシのロードマップは到達可能である",
            "開発者がエージェントを構築するだけの価値提案がある",
          ],
          es: [
            "Las arquitecturas heterogeneas convergen en mas del 70% de las consultas del mundo real",
            "PoIQ sigue siendo seguro bajo incentivos economicos reales y actores adversarios",
            "La hoja de ruta de latencia es alcanzable",
            "Los desarrolladores consideran que la propuesta de valor es suficientemente fuerte para construir agentes",
          ],
        },
      },
      {
        heading: {
          en: "What Happens Next",
          "pt-BR": "O que acontece agora",
          zh: "接下来会发生什么",
          ja: "次に何が起こるか",
          es: "Que pasa despues",
        },
        paragraphs: {
          en: [
            "We are in Phase 0 - Genesis. Q1 2026 includes Whitepaper v0.4, the Python PoC, a RISC Zero proof-of-execution scaffold, and a repository with contributor-ready issues.",
            "Q2 2026 is Devnet: the Agave fork, PoIQ v0.1 on-chain via Anchor, the Cognitive Scheduler, and the Agent SDK in Rust.",
          ],
          "pt-BR": [
            "Estamos na Fase 0 - Genese. O Q1 de 2026 inclui o Whitepaper v0.4, o PoC em Python, um esqueleto de proof-of-execution com RISC Zero e um repositorio com issues prontas para contribuidores.",
            "O Q2 de 2026 e Devnet: o fork de Agave, o PoIQ v0.1 on-chain via Anchor, o Cognitive Scheduler e o Agent SDK em Rust.",
          ],
          zh: [
            "我们目前处于阶段 0 - 创世。2026 年第一季度包括 Whitepaper v0.4、Python PoC、RISC Zero proof-of-execution 脚手架，以及一个已经整理好贡献入口的仓库。",
            "2026 年第二季度是 Devnet：Agave 分叉、通过 Anchor 上链的 PoIQ v0.1、Cognitive Scheduler，以及 Rust 版 Agent SDK。",
          ],
          ja: [
            "現在はフェーズ 0 - Genesis です。2026 年第 1 四半期には Whitepaper v0.4、Python PoC、RISC Zero の proof-of-execution スキャフォールド、そしてコントリビュータ向け課題を整理したリポジトリが含まれます。",
            "2026 年第 2 四半期は Devnet です。Agave フォーク、Anchor 経由でオンチェーン化する PoIQ v0.1、Cognitive Scheduler、そして Rust の Agent SDK が入ります。",
          ],
          es: [
            "Estamos en Fase 0 - Genesis. El Q1 de 2026 incluye el Whitepaper v0.4, el PoC en Python, una base de proof-of-execution con RISC Zero y un repositorio con issues listos para contribuidores.",
            "El Q2 de 2026 es Devnet: el fork de Agave, PoIQ v0.1 on-chain via Anchor, el Cognitive Scheduler y el Agent SDK en Rust.",
          ],
        },
      },
      {
        heading: {
          en: "Read It",
          "pt-BR": "Leia agora",
          zh: "立即阅读",
          ja: "読む",
          es: "Leer ahora",
        },
        paragraphs: {
          en: [
            "The full whitepaper is live at github.com/rodrigooler/raxion/blob/main/WHITEPAPER.md.",
            "If you find a flaw in the math, open an issue. If you disagree with a design decision, open an issue. The document is meant to be contested.",
          ],
          "pt-BR": [
            "O whitepaper completo esta publicado em github.com/rodrigooler/raxion/blob/main/WHITEPAPER.md.",
            "Se voce encontrar uma falha na matematica, abra uma issue. Se discordar de uma decisao de design, abra uma issue. O documento existe para ser contestado.",
          ],
          zh: [
            "完整白皮书已发布在 github.com/rodrigooler/raxion/blob/main/WHITEPAPER.md。",
            "如果你发现数学上的漏洞，请开 issue；如果你不同意某个设计决策，也请开 issue。这个文档本来就应该接受质疑。",
          ],
          ja: [
            "完全版ホワイトペーパーは github.com/rodrigooler/raxion/blob/main/WHITEPAPER.md で公開中です。",
            "数式に欠陥を見つけたら issue を開いてください。設計判断に異論があっても issue を開いてください。この文書は検証と反論を前提にしています。",
          ],
          es: [
            "El whitepaper completo ya esta publicado en github.com/rodrigooler/raxion/blob/main/WHITEPAPER.md.",
            "Si encuentras una falla en la matematica, abre un issue. Si no estas de acuerdo con una decision de diseno, abre un issue. Este documento existe para ser discutido.",
          ],
        },
      },
    ],
  },
  {
    type: "blog",
    slug: "why-raxion-exists",
    date: "2026-02-20",
    author,
    title: {
      en: "Why RAXION exists",
      "pt-BR": "Por que a RAXION existe",
      zh: "RAXION 为何存在",
      ja: "RAXION が存在する理由",
      es: "Por que existe RAXION",
    },
    summary: {
      en: "A technical overview of the protocol thesis, the build rationale, and the validation path behind Proof of Inference Quality.",
      "pt-BR": "Uma visao tecnica da tese do protocolo, da logica de construcao e do caminho de validacao por tras do Proof of Inference Quality.",
      zh: "关于协议主张、构建原因以及 Proof of Inference Quality 验证路径的技术概览。",
      ja: "Proof of Inference Quality の背景にあるプロトコル仮説、実装理由、検証経路の技術概要。",
      es: "Una vision tecnica de la tesis del protocolo, la logica de construccion y la ruta de validacion detras de Proof of Inference Quality.",
    },
    body: [
      {
        heading: { en: "The problem", "pt-BR": "O problema", zh: "问题", ja: "問題", es: "El problema" },
        paragraphs: {
          en: [
            "Most decentralized AI systems still rely on humans to decide which model is good. That means the trust bottleneck never disappeared; it was just tokenized.",
            "RAXION exists to replace that subjective layer with objective, verifiable convergence across complementary inference systems.",
          ],
          "pt-BR": [
            "A maioria dos sistemas de IA descentralizada ainda depende de humanos para decidir qual modelo e bom. Isso significa que o gargalo de confianca nunca desapareceu; ele so foi tokenizado.",
            "A RAXION existe para substituir essa camada subjetiva por convergencia objetiva e verificavel entre sistemas de inferencia complementares.",
          ],
          zh: [
            "大多数去中心化 AI 系统仍然依赖人类来判断哪个模型更好。这意味着信任瓶颈并没有消失，只是被代币化了。",
            "RAXION 的目标是用互补推理系统之间可验证的客观收敛，取代这层主观判断。",
          ],
          ja: [
            "多くの分散型 AI システムは、どのモデルが優れているかを人間に判断させています。つまり信頼のボトルネックは消えておらず、トークン化されただけです。",
            "RAXION は、その主観レイヤーを、補完的な推論システム間の客観的かつ検証可能な収束で置き換えるために存在します。",
          ],
          es: [
            "La mayoria de los sistemas de IA descentralizada todavia dependen de humanos para decidir que modelo es mejor. Eso significa que el cuello de botella de confianza nunca desaparecio; solo se tokenizo.",
            "RAXION existe para reemplazar esa capa subjetiva por convergencia objetiva y verificable entre sistemas de inferencia complementarios.",
          ],
        },
      },
      {
        heading: { en: "How it is built", "pt-BR": "Como foi construida", zh: "如何构建", ja: "どのように構築されているか", es: "Como esta construida" },
        paragraphs: {
          en: [
            "The protocol combines three independent architecture families, a statistical coherence layer, stochastic challenges, and cryptographic proof systems. The website now mirrors that structure with a modular content system.",
            "In the whitepaper, this architecture is formalized as the Neural Sovereign Virtual Machine: a Solana-based sovereign rollup with a cognitive scheduler, Native Memory Accounts, Cross-Validation Neural, and native zk-ML verification in the runtime itself.",
          ],
          "pt-BR": [
            "O protocolo combina tres familias independentes de arquitetura, uma camada estatistica de coerencia, desafios estocasticos e sistemas criptograficos de prova. O site agora espelha essa estrutura com um sistema modular de conteudo.",
            "No whitepaper, essa arquitetura e formalizada como a Neural Sovereign Virtual Machine: um rollup soberano sobre Solana com scheduler cognitivo, Native Memory Accounts, Cross-Validation Neural e verificacao zk-ML nativa no proprio runtime.",
          ],
          zh: [
            "协议结合了三种独立架构、一层统计一致性、随机挑战以及密码学证明系统。网站现在也用模块化内容系统映射这一结构。",
            "在白皮书中，这套架构被正式定义为 Neural Sovereign Virtual Machine：一个基于 Solana 的主权 rollup，把认知调度器、Native Memory Accounts、Cross-Validation Neural 和原生 zk-ML 验证纳入运行时。",
          ],
          ja: [
            "このプロトコルは 3 つの独立したアーキテクチャ、統計的一貫性レイヤー、確率的チャレンジ、暗号学的証明システムを組み合わせています。サイトも同様にモジュール化されたコンテンツ構成でこれを反映します。",
            "ホワイトペーパーでは、この構成は Neural Sovereign Virtual Machine として定式化されています。Solana ベースの主権ロールアップに、認知スケジューラ、Native Memory Accounts、Cross-Validation Neural、ネイティブ zk-ML 検証を組み込む設計です。",
          ],
          es: [
            "El protocolo combina tres familias de arquitectura independientes, una capa estadistica de coherencia, desafios estocasticos y sistemas criptograficos de prueba. El sitio ahora refleja esa estructura con un sistema modular de contenido.",
            "En el whitepaper, esta arquitectura se formaliza como la Neural Sovereign Virtual Machine: un rollup soberano sobre Solana con scheduler cognitivo, Native Memory Accounts, Cross-Validation Neural y verificacion zk-ML nativa en el runtime.",
          ],
        },
      },
      {
        heading: localized("The protocol thesis"),
        paragraphs: localized([
          "The whitepaper makes one claim that drives the entire project: decentralized intelligence should not be a market of human opinions. RAXION exists to replace social consensus with mathematical consensus.",
          "That is why the protocol is centered on Proof of Inference Quality instead of validators scoring outputs subjectively. If humans still decide which machine output is valid, the oracle problem has only been repackaged.",
          "PoIQ is designed as a stacked guarantee: statistical convergence, deterministic on-chain challenges, and slashing for chronic divergence all reinforce the same trust boundary.",
        ]),
        bullets: localized([
          "Layer 1: statistical convergence",
          "Layer 2: on-chain stochastic verification",
          "Layer 3: slashing for chronic divergence",
        ]),
      },
      {
        heading: localized("Cognitive Finality"),
        paragraphs: localized([
          "The whitepaper's central concept is Cognitive Finality: once a reasoning result has been mathematically proven, it should be treated as immutable in the same way a chain treats a finalized transfer.",
          "This is not optimistic finality. There is no contestation window where truth depends on someone paying attention later. The proof is valid at generation time or it fails immediately.",
          "The whitepaper is explicit about the boundary: Cognitive Finality does not mean absolute truth about the external world. It means the declared computation and the protocol's quality checks passed under verifiable rules.",
        ]),
      },
      {
        heading: localized("Native Memory and state discipline"),
        paragraphs: localized([
          "A major reason RAXION exists is that most AI-on-chain designs either centralize memory or explode state. The whitepaper rejects both outcomes by splitting memory into hot and cold layers.",
          "Native Memory Accounts keep compact hot state on-chain: Merkle roots, reliability signals, compressed retrieval state, and recent proof references. Full context stays off-chain in cold storage, anchored by hashes.",
          "That lets agents stay stateful and sovereign without turning the chain into an unbounded memory dump.",
        ]),
      },
      {
        heading: localized("Why the token model matters"),
        paragraphs: localized([
          "The whitepaper also makes it clear that $RAX is not decorative. It is cognitive fuel: stake allocates parallel cognition threads, gas is burned according to proof complexity, and reward flow is tied to verified inference quality.",
          "That matters because the economics are downstream of the protocol thesis. The token is supposed to amplify verified reasoning quality, not replace it with another layer of social signaling.",
        ]),
      },
      {
        heading: { en: "What comes next", "pt-BR": "O que vem a seguir", zh: "接下来是什么", ja: "次に来るもの", es: "Que sigue" },
        paragraphs: {
          en: [
            "This blog is where protocol notes, benchmarks, diagrams, tests, and architecture updates will live. Announcements cover immediate milestones; blog posts hold the deeper reasoning.",
          ],
          "pt-BR": [
            "Este blog sera o lugar para notas de protocolo, benchmarks, diagramas, testes e atualizacoes de arquitetura. Os anuncios cobrem marcos imediatos; os posts guardam o raciocinio mais profundo.",
          ],
          zh: [
            "这个博客将承载协议说明、基准测试、图表、测试和架构更新。公告覆盖即时里程碑；博客文章承载更深层的推理。",
          ],
          ja: [
            "このブログは、プロトコルノート、ベンチマーク、図表、テスト、アーキテクチャ更新の置き場になります。アナウンスは直近のマイルストーン、ブログ記事はより深い思考を担います。",
          ],
          es: [
            "Este blog sera el lugar para notas del protocolo, benchmarks, graficos, tests y actualizaciones de arquitectura. Los anuncios cubren hitos inmediatos; los posts guardan el razonamiento mas profundo.",
          ],
        },
      },
    ],
  },
]);

export const latestAnnouncement = announcementPosts[0];
export const allPosts: Post[] = sortPostsByDateDesc([...announcementPosts, ...blogPosts]);

export function findAnnouncement(slug: string): Post | undefined {
  return announcementPosts.find((post) => post.slug === slug);
}

export function findBlogPost(slug: string): Post | undefined {
  return blogPosts.find((post) => post.slug === slug);
}
