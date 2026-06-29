# RAXION Yellowpaper: Formal Specification

**Version 0.1 — June 2026**

*Companion document to RAXION Whitepaper v0.5. All narrative motivation is in the whitepaper; this document contains only formal definitions, theorems, proofs, algorithms, and security analysis.*

---

## 1. Notation and Preliminaries

### 1.1 Symbol Table

| Symbol | Domain | Description |
|--------|--------|-------------|
| A = {a_1, ..., a_n} | set | Set of Smart Agents in the network |
| T = {Transformer, SSM, NeuroSymbolic} | set | Set of architecture types, \|T\| = 3 |
| Q | space | Query space (natural language + structured inputs) |
| O | space | Output space (natural language + structured outputs) |
| E: O -> R^d | function | Embedding function mapping outputs to d-dimensional vectors (d = 1536 default) |
| O_T, O_S, O_N | O | Outputs from Transformer, SSM, and Neuro-Symbolic architectures respectively |
| sim(O_i, O_j) | [0, 1] | Cosine similarity between embedded outputs |
| CS_semantic | [0, 1] | Semantic Convergence Score |
| CC | [0, 1] | Causal Coherence Score |
| CS | [0, 1] | Final CoherenceScore |
| RS_i | [0, 1] | Reliability Score of agent i |
| s_i | N | Stake of agent i in RAX (lamports) |
| lambda | (0, 1) | EMA smoothing factor for RS, lambda = 0.1 |
| alpha, beta | (0, 1) | CoherenceScore weights, alpha = 0.4, beta = 0.6, alpha + beta = 1 |
| w_p, w_a, w_e | (0, 1) | CC component weights, w_p = 0.3, w_a = 0.5, w_e = 0.2, sum = 1 |
| H(x) | {0,1}^256 | SHA-256 hash function |
| pi_exec | proof | RISC Zero execution proof |
| pi_quality | proof | Jolt quality proof (CoherenceScore computation) |
| pi_poiq | proof | Aggregated PoIQ proof |
| theta_R | R | Rejection threshold = 0.30 |
| theta_S | R | Standard threshold = 0.60 |
| theta_H | R | High coherence threshold = 0.85 |
| T_base | N | Minimum stake for 1 thread = 1,000 RAX |
| k_scale | N | Thread scaling factor = 8 |

### 1.2 System Model

The RAXION network is a tuple (A, T, Q, CS, V, S) where:
- A is the set of registered agents
- T is the set of architecture types
- Q is the query space
- CS: O^3 -> [0,1] is the CoherenceScore function
- V is the stochastic verification protocol
- S is the slashing protocol

### 1.3 Axioms

**Axiom 1 (Architecture Independence):** The three architecture types T, S, N process queries using structurally different computational primitives. Transformer uses self-attention over token sequences; SSM uses linear recurrence with selective state updates; Neuro-Symbolic uses logical inference over extracted propositions.

**Axiom 2 (Embedding Faithfulness):** The embedding function E preserves semantic similarity. For outputs O_i, O_j that are semantically equivalent, sim(E(O_i), E(O_j)) approaches 1. For semantically unrelated outputs, sim approaches 0.

**Axiom 3 (Hash Uniformity):** SHA-256 produces output that is computationally indistinguishable from a uniform random function over {0,1}^256.

---

## 2. Formal Problem Statement

### 2.1 The Oracle Problem for Collective Intelligence

**Definition 1 (Oracle Problem).** Let A = {a_1, a_2, ..., a_n} be a set of intelligent agents in a distributed system S. Let Q in Q be a query and O_i = a_i(Q) the output of agent i. Let q: O^n -> R be a quality function. The Oracle Problem states:

    There exists no function q that is simultaneously:
    (i)   Computable by any node in S without external information
    (ii)  Resistant to Sybil manipulation (q(O_1,...,O_n) cannot be
          dominated by any agent controlling k < n/3 identities)
    (iii) Non-subjective (q does not depend on individual preferences
          of evaluators)

*Reference: Whitepaper Section 0.1, Definition 1.*

**Theorem 1 (Impossibility of Stake-Weighted Quality Voting).** Any quality assessment mechanism that relies on stake-weighted human voting inherits the Oracle Problem and is vulnerable to rational collusion.

*Proof sketch.* By Arrow's Impossibility Theorem [44], no voting mechanism over three or more alternatives can simultaneously satisfy unrestricted domain, Pareto efficiency, independence of irrelevant alternatives, and non-dictatorship. Stake-weighted voting adds a fifth requirement (Sybil resistance via capital), but this conflicts with non-dictatorship: a sufficiently capitalized agent can dictate outcomes. Furthermore, rational validators in a repeated game converge on copying the majority (herding [30]) rather than independent evaluation, as the expected reward for deviating from consensus is negative regardless of correctness. QED.

**Corollary 1.** The Oracle Problem cannot be solved by improving the voting mechanism. It can only be solved by eliminating the human evaluator from the quality assessment loop entirely.

---

## 3. Semantic Convergence Theory

### 3.1 Pairwise Semantic Similarity

**Definition 2 (Cosine Similarity).** For outputs O_i, O_j with embeddings E(O_i), E(O_j) in R^d:

    sim(O_i, O_j) = cos(E(O_i), E(O_j))
                   = (E(O_i) . E(O_j)) / (||E(O_i)|| * ||E(O_j)||)

where . denotes the dot product and ||.|| the Euclidean norm. By the Cauchy-Schwarz inequality, sim(O_i, O_j) in [-1, 1]. Since RAXION uses normalized embeddings (||E(O)|| = 1 for all O), the range reduces to [-1, 1], and for semantically meaningful text embeddings the practical range is [0, 1].

*Reference: Whitepaper Section 3.2.1, Definition 1.*

### 3.2 Semantic Convergence Score

**Definition 3 (Semantic Convergence Score).** For three architecture outputs O_T, O_S, O_N:

    CS_semantic(O_T, O_S, O_N) = (sim(O_T, O_S) * sim(O_T, O_N) * sim(O_S, O_N))^(1/3)

This is the geometric mean of all three pairwise cosine similarities.

*Reference: Whitepaper Section 3.2.1, Definition 2.*

**Theorem 2 (Geometric Mean Outlier Penalty).** For any triple (x, y, z) in [0,1]^3 where one value is significantly lower than the others, the geometric mean G = (xyz)^(1/3) is strictly less than the arithmetic mean A = (x+y+z)/3.

*Proof.* By the AM-GM inequality, for non-negative reals:

    (x + y + z) / 3 >= (x * y * z)^(1/3)

with equality if and only if x = y = z. When one value (say z) is small while x, y are large:

    Let x = y = 0.9, z = 0.1
    A = (0.9 + 0.9 + 0.1) / 3 = 0.633
    G = (0.9 * 0.9 * 0.1)^(1/3) = (0.081)^(1/3) = 0.433

The geometric mean drops 31.6% more than the arithmetic mean. In general, the ratio G/A decreases as variance increases, making the geometric mean more sensitive to outlier-low values. This property is desirable because a single architecture producing divergent output (low pairwise similarity) should penalize the overall convergence score more than a simple average would. QED.

**Lemma 1 (CS_semantic bounds).** CS_semantic in [0, 1] when all pairwise similarities are in [0, 1].

*Proof.* If sim(O_i, O_j) in [0, 1] for all pairs, then the product sim(O_T,O_S) * sim(O_T,O_N) * sim(O_S,O_N) in [0, 1], and the cube root of a value in [0, 1] is also in [0, 1]. QED.

### 3.3 Causal Coherence Score

**Definition 4 (Causal Coherence Score).** Given outputs O_T, O_S, O_N, extract:
- P_T, P_S, P_N: premise sets from each output
- C_T, C_S, C_N: conclusion sets from each output

Then:

    CC(O_T, O_S, O_N) = 0.3 * consistency(P_T U P_S U P_N)
                       + 0.5 * agreement(C_T, C_S, C_N)
                       + 0.2 * entailment_rate(P, C)

where:
- consistency(P) = 1 - (number of contradictory premise pairs) / (total premise pairs)
- agreement(C_T, C_S, C_N) = |C_T ∩ C_S ∩ C_N| / |C_T U C_S U C_N|
- entailment_rate(P, C) = fraction of conclusions logically derivable from the union of premises

*Reference: Whitepaper Section 3.2.1, Definition 3.*

**Lemma 2 (CC bounds).** CC in [0, 1].

*Proof.* Each component (consistency, agreement, entailment_rate) is a ratio bounded by [0, 1]. The weights (0.3, 0.5, 0.2) sum to 1.0. A convex combination of values in [0, 1] with non-negative weights summing to 1 is itself in [0, 1]. QED.

### 3.4 Final CoherenceScore

**Definition 5 (CoherenceScore).** The final CoherenceScore is:

    CoherenceScore(O_T, O_S, O_N) = alpha * CS_semantic + beta * CC
                                   = 0.4 * CS_semantic + 0.6 * CC

*Reference: Whitepaper Section 3.2.1, Definition 4.*

**Theorem 3 (CoherenceScore bounds).** CoherenceScore in [0, 1].

*Proof.* By Lemma 1, CS_semantic in [0, 1]. By Lemma 2, CC in [0, 1]. Since alpha = 0.4, beta = 0.6, and alpha + beta = 1.0, the CoherenceScore is a convex combination of two values in [0, 1], which is itself in [0, 1]. QED.

### 3.5 Convergence Categories

    CS < 0.30                -> REJECTED (category = 0)
    0.30 <= CS < 0.60        -> LOW_CONFIDENCE (category = 1)
    0.60 <= CS < 0.85        -> STANDARD (category = 2)
    CS >= 0.85               -> HIGH_COHERENCE (category = 3)

*Reference: Whitepaper Section 3.2.2.*

### 3.6 Degraded Mode

When only 2 of 3 architectures are available (say O_i, O_j):

    CS_semantic_degraded(O_i, O_j) = sim(O_i, O_j)
    CoherenceScore_degraded = 0.4 * CS_semantic_degraded + 0.6 * CC_pairwise

The maximum CoherenceScore in Degraded Mode is capped at 0.80 (HIGH_COHERENCE is unreachable). Premium rewards are disabled. Slashing remains active.

When fewer than 2 architectures are available: Emergency Halt. No inferences processed. Slashing suspended.

*Reference: Whitepaper Section 2.2.3.*

---

## 4. Architecture Diversity Guarantee

### 4.1 Failure Sets

**Definition 6 (Architecture Failure Set).** For architecture type A in {T, S, N} and a query distribution D, the failure set F_A is:

    F_A = { q in D : A(q) produces incorrect or low-quality output }

### 4.2 Structural Independence of Failure Modes

**Theorem 4 (Failure Decorrelation).** Under Axiom 1 (Architecture Independence), for query q drawn from a diverse distribution D:

    P(q in F_T ∩ F_S ∩ F_N) << P(q in F_T) * P(q in F_S) * P(q in F_N)

That is, simultaneous failure across all three architectures is rarer than the product of individual failure probabilities.

*Proof sketch.* Each architecture type has characteristic failure modes arising from its computational structure:

    Transformer (F_T): frequency bias, plausibility hallucination,
                       attention saturation on long contexts
    SSM (F_S):         recency bias, local-consistency traps,
                       difficulty with long-range dependencies in non-sequential domains
    Neuro-Symbolic (F_N): formalization incompleteness, brittleness on
                          ambiguous inputs, coverage gaps in rule base

These failure modes are structurally determined by the architecture, not by training data or random initialization. A query that causes a Transformer to hallucinate (attention over-indexes on frequent token patterns) is unlikely to cause an SSM to fail in the same way (SSM fails on different structural properties of the input). The failure sets F_T, F_S, F_N are therefore not independent (which would give equality) but negatively correlated for structurally diverse architectures, giving the strict inequality.

```
FAILURE MODE COMPLEMENTARITY

  Transformer failures           SSM failures          Neuro-Symbolic failures
  ┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
  │ Frequency bias  │      │ Recency bias    │      │ Formalization   │
  │ Plausibility    │      │ Local-consist.  │      │   incompleteness│
  │ Attention sat.  │      │ Long-range deps │      │ Ambiguity       │
  └────────┬────────┘      └────────┬────────┘      └────────┬────────┘
           │                        │                         │
           └────────────┬───────────┘                         │
                        │                                     │
              Correlated failure requires a query that is     │
              SIMULTANEOUSLY:                                 │
              - high-frequency pattern (T fails)              │
              - AND recency-exploitable (S fails)             │
              - AND formally ambiguous (N fails)              │
                        │                                     │
                        └─────────────┬───────────────────────┘
                                      │
                              P(F_T ∩ F_S ∩ F_N)
                              is small for diverse D
```

**Corollary 2.** A low CoherenceScore (CS < theta_R = 0.30) reliably indicates that at least one architecture detected a problem, even if the other two did not. The geometric mean ensures that divergence from even one architecture pulls CS_semantic down significantly (Theorem 2). QED.

### 4.3 Domains Where the Guarantee Is Weaker

The diversity guarantee weakens when queries fall in domains where all three architectures share a blind spot: purely subjective aesthetic judgments, questions requiring information not available to any architecture, or novel problem types not represented in any training distribution. The CoherenceScore may report high convergence on a factually incorrect answer when all three architectures share the same misconception.

Cognitive Finality (Section 8) explicitly acknowledges this limitation.

---

## 5. Stochastic Verification Protocol

### 5.1 Challenge Seed Derivation

**Definition 7 (Challenge Seed).** For an inference with ID inf_id processed by agent with stake seed stake_seed at blockchain slot with hash slot_hash:

    challenge_seed = H(slot_hash || inf_id || stake_seed)

where || denotes concatenation and H is SHA-256.

    should_challenge = (challenge_seed mod 1000) < challenge_rate

with challenge_rate = 15 (1.5%) for established agents and 50 (5.0%) for agents in warmup period (first 518,400 slots, approximately 72 hours).

*Reference: Whitepaper Section 3.3.1.*

**Theorem 5 (Challenge Uniformity).** Under Axiom 3 (Hash Uniformity), the challenge decision is uniformly distributed: P(should_challenge) = challenge_rate / 1000.

*Proof.* SHA-256 output is computationally indistinguishable from uniform random over {0,1}^256. The modular reduction (challenge_seed mod 1000) maps a 256-bit value to [0, 999]. Since 2^256 >> 1000 and 2^256 mod 1000 is negligible relative to 2^256, the distribution over [0, 999] is statistically indistinguishable from uniform. Therefore P((challenge_seed mod 1000) < r) = r/1000 for any rate r. QED.

**Corollary 3 (Deterministic Reproducibility).** Any node with access to (slot_hash, inf_id, stake_seed) can independently verify the challenge decision. No external oracle is required.

### 5.2 Challenge Categories

Six categories, each testing a distinct dimension of formal reasoning:

    MATH_FORMAL (0)      — mathematical proof/refutation
    CODE_EXECUTION (1)   — code output prediction with fixed input
    LOGIC_SAT (2)        — propositional logic satisfiability
    FACTUAL_ONCHAIN (3)  — fact verifiable from on-chain state
    CRYPTO_VERIFY (4)    — signature/hash verification
    NUMERICAL_APPROX (5) — numerical result within tolerance

**Definition 8 (Category Selection).** Category is determined independently from the challenge decision:

    category_seed = H(challenge_seed || "category")
    category = category_seed mod 6

**Theorem (Category Independence).** The category selection is independent of the challenge decision.

*Proof sketch.* The category seed is derived by hashing the challenge seed with a domain separator ("category"). By the random oracle model, H(x || "category") is independent of H(x) mod 1000, since the hash function behaves as an independent random function on distinct inputs. QED.

Categories 0-4 form the **Immutable Core**: their verification algorithms are protocol-embedded and ungovernable. A cartel must produce genuinely correct formal reasoning to pass these challenges.

### 5.3 Reliability Score

**Definition 9 (Reliability Score).** The Reliability Score is an exponential moving average of challenge outcomes:

    RS_new = (1 - lambda) * RS_old + lambda * result

where lambda = 0.1 and result in {0, 1} (0 = failure, 1 = pass).

Initial RS for new agents: RS_0 = 0.50 (neutral).

*Reference: Whitepaper Section 3.3.3.*

**Theorem 6 (RS Convergence).** After k consecutive identical outcomes with value v in {0, 1}:

    RS_k = (1 - lambda)^k * RS_0 + lambda * v * sum_{i=0}^{k-1} (1 - lambda)^i
         = 0.9^k * RS_0 + v * (1 - 0.9^k)

*Proof.* By induction on k.

Base case (k=1): RS_1 = 0.9 * RS_0 + 0.1 * v = 0.9^1 * RS_0 + v * (1 - 0.9^1). Holds.

Inductive step: Assume RS_k = 0.9^k * RS_0 + v * (1 - 0.9^k). Then:
    RS_{k+1} = 0.9 * RS_k + 0.1 * v
             = 0.9 * (0.9^k * RS_0 + v * (1 - 0.9^k)) + 0.1 * v
             = 0.9^{k+1} * RS_0 + 0.9 * v * (1 - 0.9^k) + 0.1 * v
             = 0.9^{k+1} * RS_0 + v * (0.9 - 0.9^{k+1} + 0.1)
             = 0.9^{k+1} * RS_0 + v * (1 - 0.9^{k+1})
QED.

**Corollary 4 (RS Convergence Values).**
- k consecutive passes (v=1): RS_k -> 1.0 as k -> infinity
- k consecutive failures (v=0): RS_k = 0.9^k * RS_0 -> 0 as k -> infinity
- Starting from RS_0 = 0.50 with all failures: RS_10 = 0.9^10 * 0.50 = 0.174
- Starting from RS_0 = 0.80 with all failures: RS_10 = 0.9^10 * 0.80 = 0.279

### 5.4 RS Threshold Effects

    RS < 0.50 -> Probation: challenge rate increases to 5% (warmup rate)
    RS > 0.70 -> Premium: reward_multiplier = 1.0 + (RS - 0.70) * 2.0
    RS < 0.40 for 72h continuous -> Trigger 3 (chronic slashing)

### 5.5 Bootstrap Protocol

New agents enter with RS_0 = 0.50 and warmup challenge rate of 5% for 518,400 slots (~72h). During warmup, the standard RS update formula applies. After warmup, challenge rate drops to 1.5% and RS evolution is governed solely by challenge outcomes.

---

## 6. Economic Security: Slashing Protocol

### 6.1 Trigger 1: Immediate Rejection

**Definition 10 (Immediate Slash).** When CoherenceScore < theta_R = 0.30:

    slash_immediate(a_i) = stake(a_i) * 0.01 * max(0, 1 - CoherenceScore / 0.30)

*Implementation note:* Computed using integer arithmetic in basis points to avoid floating-point truncation to zero:

    factor_micros = round((0.30 - CS) / 0.30 * 1_000_000)
    slash = stake * 100 * factor_micros / 10_000 / 1_000_000

where 100 basis points = 1%. This ensures non-zero slashing for any CS < 0.30.

*Reference: Whitepaper Section 3.4.1.*

**Properties of Trigger 1:**
- At CS = 0.0 (complete garbage): slash = stake * 0.01 * 1.0 = 1% of stake
- At CS = 0.15 (half of threshold): slash = stake * 0.01 * 0.5 = 0.5% of stake
- At CS = 0.29 (just below threshold): slash = stake * 0.01 * 0.033 = 0.033% of stake
- At CS = 0.30 (at threshold): slash = 0 (no immediate slash)

### 6.2 Trigger 2: Challenge Failure

**Definition 11 (Challenge Slash).** When an agent fails a stochastic verification challenge:

    slash_challenge(a_i) = stake(a_i) * 0.02 * chronic_multiplier(a_i)

where the chronic multiplier amplifies repeated failures:

    chronic_multiplier = 1.0 + max(0, consecutive_failures - 2) * 0.5

Expressed in integer arithmetic (milli-units, 1000 = 1.0x):

    chronic_multiplier_milli = min(5000, 1000 + max(0, failures - 2) * 500)

Clamped to [1.0x, 5.0x] range.

*Reference: Whitepaper Section 3.4.1.*

**Chronic multiplier progression:**

    consecutive_failures:  0    1    2    3    4    5    6    7    8+
    multiplier:          1.0  1.0  1.0  1.5  2.0  2.5  3.0  3.5  ...5.0 (cap)
    effective slash:     2%   2%   2%   3%   4%   5%   6%   7%   ...10%

### 6.3 Trigger 3: Chronic Divergence

    slash_chronic = stake(a_i) * 0.05

Activated when RS < 0.40 continuously for 72 hours (518,400 slots).

### 6.4 Terminal Slash

    slash_terminal = stake(a_i) * 0.15

Activated on extreme cases. Agent is removed from the network for 30 days.

### 6.5 Slashed Stake Distribution

    40% -> Redistributed to high-RS agents (RS > 0.70)
    30% -> Burned (permanent supply reduction)
    20% -> Protocol Insurance Fund
    10% -> Challenger reward (if applicable)

### 6.6 Anti-Griefing Protections

**Theorem 7 (Network Liveness Under Slashing).** The slashing protocol preserves network liveness through three caps:

**Cap 1 (Network-wide):** Maximum 0.1% of total staked RAX can be slashed per hour. If the cap is reached, additional slashing is queued.

**Cap 2 (Anomaly Pause):** If >20% of active agents are simultaneously rejected (CS < 0.30), slashing is paused and the event is flagged for investigation. This prevents a systematic attack (e.g., a malicious query designed to cause all architectures to fail) from cascading into mass slashing.

**Cap 3 (Per-agent):** Terminal slash (15%) is the maximum single-event slash. An agent cannot lose more than 15% of its stake in a single slashing event.

*Proof sketch.* Cap 1 bounds the total economic damage per unit time, ensuring that even under a sustained attack the network retains at least (1 - 0.001)^24 = 97.6% of stake per day. Cap 2 distinguishes between agent-quality failures (expected) and systemic failures (anomalous), preventing an attacker from weaponizing the slashing mechanism. Cap 3 limits individual exposure, keeping the incentive to participate positive for honest agents even after an isolated failure. Together, these caps ensure that the expected value of honest participation remains positive under all attack scenarios bounded by the threat model (Section 11). QED.

---

## 7. Game Theory

### 7.1 Agent Strategy Space

A rational agent chooses a strategy (q, e) where:
- q in [0, 1]: true inference quality produced
- e in [0, 1]: computational effort invested

Under honest behavior, q correlates with e. Under gaming, q can be decoupled from e (producing surface-plausible but low-quality outputs with minimal effort).

### 7.2 Payoff Analysis

Let:
    R_base     = base inference reward (RAX)
    g          = gas cost per inference (RAX)
    s          = agent stake (RAX)
    p_c        = challenge probability = 0.015
    p_fail(q)  = probability of failing a challenge given quality q
    f          = slash_challenge = s * 0.02 (first failure)

**Honest strategy** (q ~ 1.0, RS converges to ~0.85):

    E[payoff_honest] = R_base * reward_multiplier(0.85) - g
                     = R_base * (1.0 + (0.85 - 0.70) * 2.0) - g
                     = R_base * 1.30 - g

**Gaming strategy** (q ~ 0.62, barely above rejection threshold):

    E[payoff_gaming] = R_base * 1.0 - g - p_c * p_fail * f * chronic_multiplier_avg

**Theorem 8 (Honest Dominance).** The honest strategy strictly dominates the gaming strategy in expected value.

*Proof.* The honest-dominates condition requires:

    R_base * 1.30 - g > R_base * 1.0 - g - p_c * p_fail * f * cm

Simplifying (g cancels):

    0.30 * R_base > -p_c * p_fail * f * cm

The left side (0.30 * R_base) is strictly positive. The right side (-p_c * p_fail * f * cm) is strictly negative (all terms are positive, the product is negated). Therefore the inequality always holds, regardless of parameter values.

The honest strategy provides a 30% premium on base reward AND avoids slashing costs. Both effects are additive in favor of honest behavior. QED.

### 7.3 Collusion Analysis

**Single-agent gaming:** RS degradation under p_fail = 0.80:

    RS after k challenge failures: RS_k = 0.9^k * RS_0
    k = 10: RS_10 ~ 0.30 (chronic slashing triggered)
    k = 15: RS_15 ~ 0.19 (terminal slashing + 30-day removal)

At 1.5% challenge rate, 10 failures occur in approximately 10 / 0.015 ~ 667 inferences. A gaming agent is expelled within ~750 inferences.

**Two-agent cartel (T + S collude, N independent):**
The colluding T and S can boost sim(O_T, O_S) to ~1.0 by coordinating outputs. However, CS_semantic = (sim(T,S) * sim(T,N) * sim(S,N))^(1/3). If N diverges (sim(T,N) and sim(S,N) are low), CS_semantic drops. Two-agent collusion cannot control the third architecture's output. The cartel cannot reliably achieve HIGH_COHERENCE without N independently reaching similar conclusions.

**Three-agent cartel (T + S + N all collude):**
Full control of all three outputs. Can produce arbitrary CS_semantic ~ 1.0. However, stochastic verification challenges test formal correctness (MATH_FORMAL, CODE_EXECUTION, LOGIC_SAT, CRYPTO_VERIFY). These are Immutable Core categories: their verification is algorithmic, not subjective.

A cartel that consistently passes Immutable Core challenges must produce genuinely correct formal reasoning. A cartel that cannot: its RS degrades collectively until slashing terminates all participants.

**Equilibrium summary:**

    Honest, high quality (RS -> 0.85+)   : sustainable, maximum payoff
    Honest, minimum viable (RS ~ 0.60)   : sustainable, suboptimal
    Single-agent gaming                   : unsustainable, RS degrades to slash
    Two-agent cartel                      : unstable, cannot capture premium
    Three-agent full cartel               : collapses to honest (challenges enforce)

---

## 8. Cognitive Finality

### 8.1 Formal Definition

**Definition 12 (Cognitive Finality).** An inference achieves Cognitive Finality when:

    CF = VERIFY(pi_exec_T) = ACCEPT
       AND VERIFY(pi_exec_S) = ACCEPT
       AND VERIFY(pi_exec_N) = ACCEPT
       AND VERIFY(pi_quality) = ACCEPT
       AND CoherenceScore >= theta_S

where pi_exec_* are RISC Zero execution proofs (one per architecture) and pi_quality is the Jolt quality proof of the CoherenceScore computation.

*Reference: Whitepaper Section 3.5.1.*

**Theorem 9 (Immediacy of Cognitive Finality).** Cognitive Finality requires no contestation window.

*Proof sketch.* Each component of CF is deterministically verifiable:
1. pi_exec_* are zero-knowledge proofs; verification is O(log n) and deterministic
2. pi_quality is a Jolt proof; verification is O(log n) and deterministic
3. CoherenceScore >= theta_S is a scalar comparison

None of these checks require future information, human judgment, or temporal observation. The validity of CF at time t is identical to its validity at time t + delta for any delta > 0. Therefore no contestation window adds information that would change the verification outcome. QED.

### 8.2 What Cognitive Finality Does and Does Not Guarantee

**Guarantees:**
- The three architectures executed the declared code on the declared input (pi_exec)
- The CoherenceScore was computed correctly from the actual outputs (pi_quality)
- The architectures converged above the threshold (CS >= theta_S)

**Does NOT guarantee:**
- Factual correctness of the output (all three architectures can be wrong on the same question)
- Completeness (the answer may be partial)
- Optimality (better answers may exist)

### 8.3 Latency Analysis

Critical path for end-to-end Cognitive Finality:

```
LATENCY BUDGET (CRITICAL PATH)

  Step                              Devnet     Testnet    Mainnet v1
  ──────────────────────────────────────────────────────────────────
  ML inference (3 arch, parallel)   1-3s       0.5-1.5s   0.5-1.5s
  Execution proofs (3x, parallel)   15-40s     3-8s       1-2s
  Quality proof (Jolt)              5-15s      1-3s       0.3-0.5s
  STARK->Groth16 compression        N/A       1-2s       0.3-0.5s
  Nova IVC fold (4->1)              N/A       0.5-1s     <0.1s
  On-chain verify + state write     0.4s      0.4s       0.4s
  ──────────────────────────────────────────────────────────────────
  TOTAL (critical path)             21-58s     6-16s      2.7-5.1s
```

The critical bottleneck transitions from proof generation (Devnet/Testnet) to ML inference (Mainnet v1, where ZK ASICs make proofs near-instant).

---

## 9. Proof Composition

### 9.1 Heterogeneous Proof System

RAXION uses two distinct ZK systems:
- **RISC Zero** (STARKs): general-purpose execution proofs (pi_exec)
- **Jolt** (SNARKs via lookups): quality proofs for matrix operations (pi_quality)

These produce proofs of different types that must be composed into a single verifiable aggregate.

### 9.2 Composition Protocol

```
PROOF AGGREGATION PIPELINE

  pi_exec_T (STARK)    pi_exec_S (STARK)    pi_exec_N (STARK)    pi_quality (Jolt/SNARK)
       │                    │                     │                      │
       ▼                    ▼                     ▼                      │
  ┌─────────────────────────────────────────────────────┐                │
  │     Step 1: STARK-to-SNARK Compression              │                │
  │     Groth16 wrapper around STARK verifier            │                │
  │     Output: 3 SNARK proofs (~200 bytes each)        │                │
  └──────────────────────┬──────────────────────────────┘                │
                         │                                               │
                         ▼                                               ▼
  ┌──────────────────────────────────────────────────────────────────────┐
  │     Step 2: Nova IVC Folding                                        │
  │     Fold 4 SNARK proofs into 1 aggregate proof                      │
  │     Uses Nova's folding scheme (~10K multiplication gates)          │
  │     Output: pi_poiq (single proof, ~300 bytes)                      │
  └──────────────────────┬──────────────────────────────────────────────┘
                         │
                         ▼
  ┌──────────────────────────────────────────────────────────────────────┐
  │     Step 3: On-Chain Verification                                   │
  │     Solana program verifies pi_poiq in a single transaction         │
  │     Verification cost: ~200K compute units                          │
  └─────────────────────────────────────────────────────────────────────┘
```

**Step 1: STARK-to-SNARK Compression.** A STARK proof cannot be directly embedded in a SNARK circuit. The translation protocol wraps the STARK verifier inside a Groth16 circuit. This compresses each ~100KB STARK proof into a ~200-byte SNARK proof, at the cost of a trusted setup (Groth16 requires it) and 1-2 seconds of computation.

**Step 2: Nova IVC Folding.** Nova [37] folds multiple SNARK instances into a single running instance via an Incrementally Verifiable Computation scheme. The fold operation for 4 proofs requires approximately 10,000 multiplication gates and completes in under 100ms.

**Step 3: On-Chain Verification.** The final pi_poiq is a single Groth16 proof verifiable in approximately 200K Solana compute units (well within the per-instruction limit).

### 9.3 Batch Aggregation (Mainnet v2)

For high throughput, multiple pi_poiq proofs from different inferences can be batch-aggregated using recursive Plonky2 [38] composition, amortizing verification cost across N inferences:

    amortized_verify_cost = base_verify_cost / N + marginal_fold_cost

At N = 100 inferences per batch: amortized cost per inference drops by approximately 50x.

---

## 10. Tokenomics Formalization

### 10.1 Supply

    Total supply: 1,000,000,000 RAX (fixed, no mint authority after genesis)

Distribution:
    Community and ecosystem:  40%  (400,000,000 RAX)
    Team and founders:        20%  (200,000,000 RAX, 4-year vest with 1-year cliff)
    Treasury:                 15%  (150,000,000 RAX)
    Investors:                15%  (150,000,000 RAX, 2-year vest with 6-month cliff)
    Protocol Insurance Fund:  10%  (100,000,000 RAX)

### 10.2 Emission Schedule

    E(y) = 75,000,000 * 0.75^(y-1)    for y in {1, 2, ..., 8}

    Year 1 (2027):  75,000,000 RAX
    Year 2:         56,250,000 RAX
    Year 3:         42,187,500 RAX
    Year 4:         31,640,625 RAX
    Year 5:         23,730,469 RAX
    Year 6:         17,797,852 RAX
    Year 7:         13,348,389 RAX
    Year 8:         10,011,292 RAX
    ────────────────────────────────
    Total emitted:  269,966,127 RAX (67.5% of community allocation)

Remaining community allocation (130,033,873 RAX) reserved for post-year-8 governance decisions.

### 10.3 Cognition Thread Allocation

**Definition 13 (Maximum Threads).** An agent with stake s gets:

    max_threads(s) = floor(log_2(s / T_base) * k_scale) + 1

where T_base = 1,000 RAX and k_scale = 8.

**Proof of logarithmic scaling:**
- At s = 1,000 RAX: max_threads = floor(log_2(1) * 8) + 1 = floor(0) + 1 = 1
- At s = 10,000 RAX: max_threads = floor(log_2(10) * 8) + 1 = floor(26.6) + 1 = 27
- At s = 100,000 RAX: max_threads = floor(log_2(100) * 8) + 1 = floor(53.2) + 1 = 54
- At s = 1,000,000 RAX: max_threads = floor(log_2(1000) * 8) + 1 = floor(79.7) + 1 = 80

The logarithmic function ensures diminishing returns on stake: doubling stake from 1K to 2K adds 8 threads, while doubling from 500K to 1M adds only 8 threads. This prevents whales from capturing proportionally more compute than their stake justifies.

### 10.4 Burn Equilibrium

Each inference burns a gas fee g in RAX. Equilibrium occurs when emission rate equals burn rate:

    E(y) / seconds_per_year = inferences_per_second * g

For year 1: 75,000,000 / 31,536,000 = 2.378 RAX/second emitted.

At g = 0.50 RAX per inference:

    breakeven = 2.378 / 0.50 = 4.76 inferences/second

The whitepaper rounds this to approximately 4.7 inferences/second.

### 10.5 Cognitive Royalty

When agent B uses knowledge from agent A's memory:

    royalty_A = gas_total(inference_B) * cross_agent_usage_fraction * 0.10

This creates a long-term incentive for agents to build high-quality, reusable knowledge bases.

---

## 11. Threat Model

### 11.1 Architecture Collusion (Cognitive Sybil Attack)

**Attack:** An adversary registers as Compute Operator for all three architecture types and coordinates outputs.

**Detection:** The Cognitive Scheduler enforces diversity quotas: minimum 3 operators per architecture type, maximum 25% single-operator share. A single entity controlling all three types for a query requires controlling >= 75% of compute across three separate architecture pools, each with independent stake requirements (50,000 RAX minimum per operator).

**Detection probability:** Assuming the adversary controls fraction f of each architecture pool, the probability of being selected for all three slots in a single inference is f^3. At f = 0.25 (maximum allowed): P = 0.016. With stochastic verification at 1.5%, the probability of a colluded inference being challenged is 0.016 * 0.015 = 0.00024 per inference, or approximately 1 in 4,200 inferences.

**Mitigation:** Even at 1-in-4,200, the RS degradation from failed challenges (when the cartel produces incorrect formal answers) accumulates: after ~31,500 inferences, the expected number of detected failures (7.5) is sufficient to trigger chronic slashing.

### 11.2 Governance Capture

**Attack:** Accumulate governance tokens to modify protocol parameters favorably.

**Mitigation:** Four ungovernable categories (Immutable Core): MATH_FORMAL, LOGIC_SAT, CODE_EXECUTION, CRYPTO_VERIFY. These cannot be modified by governance vote. Their verification algorithms are embedded in the protocol binary.

Additional safeguards: 30-day time-lock on parameter changes, maximum 10% parameter adjustment per governance cycle, automatic rollback if network health metrics degrade >15% after a change, and veto power for the Protocol Insurance Fund multisig (first 2 years only).

### 11.3 Compute Centralization

**Attack:** Gradually acquire compute operator positions across geographies.

**Detection:** Geographic concentration cap: maximum 40% per region per architecture type. Stake distribution monitoring on-chain.

**Mitigation:** Excess capacity beyond the 40% cap is penalized in reward weight. Organic growth of operators in diverse regions is incentivized through geographic diversity bonuses.

### 11.4 Training Data Poisoning

**Attack:** Poison training data for one or more architecture types to cause systematic failures.

**Detection:** Architecture Diversity Guarantee (Theorem 4): poisoning a Transformer's training data does not affect the SSM or Neuro-Symbolic failure sets. CoherenceScore drops when the poisoned architecture diverges.

**Mitigation:** Compute Operators must declare model versions. Sudden RS degradation across multiple agents using the same operator triggers an automated investigation flag.

### 11.5 Stake Grinding

**Attack:** Manipulate the challenge seed to avoid being challenged.

**Detection:** challenge_seed = H(slot_hash || inf_id || stake_seed). The slot_hash is determined by the Solana validator and is not controllable by the agent. The inf_id is assigned by the Cognitive Scheduler. The stake_seed is derived from the agent's stake PDA (on-chain, deterministic).

**Mitigation:** None of the three seed components is controllable by the agent at inference submission time. The agent cannot predict which slot_hash will be active when their inference is processed. Grinding would require controlling the Solana validator for the target slot, which is outside the RAXION threat model (inherits Solana's PoS security).

### 11.6 Adversarial Queries

**Attack:** Craft queries specifically designed to cause all three architectures to converge on an incorrect answer.

**Detection:** CoherenceScore may be high (architectures agree) but the answer may be factually wrong. This is the honest limitation acknowledged in Section 8.2.

**Mitigation:** Stochastic verification challenges test formal reasoning independently of the query. An adversarial query that causes consensus on a wrong answer will be caught when a MATH_FORMAL or LOGIC_SAT challenge reveals the logical error in the reasoning chain.

### 11.7 Threat Summary

| Threat | Detection Mechanism | Severity | Residual Risk |
|--------|---------------------|----------|---------------|
| Architecture Collusion | Diversity quotas + RS degradation | High | Low (requires 75%+ compute control) |
| Governance Capture | Immutable Core + time-locks | Medium | Low (core is ungovernable) |
| Compute Centralization | Geographic caps + stake monitoring | Medium | Medium (regulatory arbitrage possible) |
| Training Data Poisoning | Architecture diversity + RS monitoring | Medium | Low (cross-architecture detection) |
| Stake Grinding | Uncontrollable slot_hash | Low | Negligible (Solana PoS security) |
| Adversarial Queries | Stochastic formal verification | Medium | Medium (novel attack classes possible) |

---

## Appendix A: Algorithm Specifications

### A.1 CoherenceScore Calculation

```
ALGORITHM CoherenceScore(O_T, O_S, O_N)
  INPUT:  Three architecture outputs O_T, O_S, O_N
  OUTPUT: score in [0, 1], category in {0, 1, 2, 3}

  1. e_T = embed(O_T)  // d-dimensional embedding
  2. e_S = embed(O_S)
  3. e_N = embed(O_N)

  4. sim_TS = dot(e_T, e_S) / (norm(e_T) * norm(e_S))
  5. sim_TN = dot(e_T, e_N) / (norm(e_T) * norm(e_N))
  6. sim_SN = dot(e_S, e_N) / (norm(e_S) * norm(e_N))

  7. CS_semantic = (sim_TS * sim_TN * sim_SN) ^ (1/3)

  8. P = extract_premises(O_T) U extract_premises(O_S) U extract_premises(O_N)
  9. C_T = extract_conclusions(O_T)
  10. C_S = extract_conclusions(O_S)
  11. C_N = extract_conclusions(O_N)

  12. consistency = 1 - count_contradictions(P) / count_pairs(P)
  13. agreement = |C_T ∩ C_S ∩ C_N| / |C_T U C_S U C_N|
  14. entailment = count_entailed(P, C_T U C_S U C_N) / |C_T U C_S U C_N|

  15. CC = 0.3 * consistency + 0.5 * agreement + 0.2 * entailment

  16. score = 0.4 * CS_semantic + 0.6 * CC

  17. IF score < 0.30 THEN category = 0 (REJECTED)
  18. ELIF score < 0.60 THEN category = 1 (LOW_CONFIDENCE)
  19. ELIF score < 0.85 THEN category = 2 (STANDARD)
  20. ELSE category = 3 (HIGH_COHERENCE)

  21. RETURN (score, category)
```

### A.2 Challenge Generation

```
ALGORITHM ShouldChallenge(slot_hash, inf_id, stake_seed, is_warmup)
  INPUT:  32-byte slot_hash, u64 inf_id, u64 stake_seed, bool is_warmup
  OUTPUT: (challenged: bool, category: u8)

  1. seed_input = slot_hash || inf_id.to_le_bytes() || stake_seed.to_le_bytes()
  2. challenge_seed = SHA256(seed_input)
  3. seed_value = u64_from_le_bytes(challenge_seed[0..8])

  4. rate = IF is_warmup THEN 50 ELSE 15
  5. challenged = (seed_value MOD 1000) < rate

  6. IF challenged THEN
  7.   cat_input = challenge_seed || "category"
  8.   cat_hash = SHA256(cat_input)
  9.   category = u8_from(cat_hash[0]) MOD 6
  10. ELSE
  11.   category = 0xFF  // not applicable
  12. END IF

  13. RETURN (challenged, category)
```

### A.3 Slashing Computation

```
ALGORITHM ComputeSlash(trigger, stake, coherence_score, consecutive_failures)
  INPUT:  trigger in {1, 2, 3, 4}, stake in u64, CS in f32, failures in u16
  OUTPUT: slash_amount in u64

  1. CASE trigger OF
  2.   1 (IMMEDIATE):
  3.     IF CS >= 0.30 THEN RETURN 0
  4.     factor = (0.30 - CS) / 0.30
  5.     factor_micros = round(factor * 1_000_000)
  6.     slash = stake * 100 * factor_micros / 10_000 / 1_000_000
  7.     RETURN min(slash, stake * 150 / 10_000)  // cap at 1.5%

  8.   2 (CHALLENGE):
  9.     cm = min(5000, 1000 + max(0, failures - 2) * 500)
  10.    slash = stake * 200 * cm / 10_000 / 1_000
  11.    RETURN min(slash, stake * 1000 / 10_000)  // cap at 10%

  12.  3 (CHRONIC):
  13.    RETURN stake * 500 / 10_000  // 5%

  14.  4 (TERMINAL):
  15.    RETURN stake * 1500 / 10_000  // 15%
  16. END CASE
```

### A.4 Reliability Score Update

```
ALGORITHM UpdateRS(rs_old, challenge_passed)
  INPUT:  rs_old in [0, 1], challenge_passed in {true, false}
  OUTPUT: rs_new in [0, 1]

  1. result = IF challenge_passed THEN 1.0 ELSE 0.0
  2. rs_new = 0.9 * rs_old + 0.1 * result
  3. RETURN rs_new
```

### A.5 Proof Aggregation

```
ALGORITHM AggregateProofs(pi_exec_T, pi_exec_S, pi_exec_N, pi_quality)
  INPUT:  3 STARK proofs, 1 SNARK proof
  OUTPUT: pi_poiq (single aggregated proof)

  // Step 1: STARK-to-SNARK compression
  1. snark_T = Groth16Wrap(pi_exec_T)
  2. snark_S = Groth16Wrap(pi_exec_S)
  3. snark_N = Groth16Wrap(pi_exec_N)

  // Step 2: Nova IVC folding
  4. acc = NovaFold.init(snark_T)
  5. acc = NovaFold.fold(acc, snark_S)
  6. acc = NovaFold.fold(acc, snark_N)
  7. acc = NovaFold.fold(acc, pi_quality)

  // Step 3: Final extraction
  8. pi_poiq = NovaFold.extract(acc)

  9. RETURN pi_poiq  // ~300 bytes, verifiable in ~200K compute units
```

---

## References

[17] Vaswani et al. "Attention Is All You Need." NeurIPS 2017.
[18] Gu & Dao. "Mamba: Linear-Time Sequence Modeling with Selective State Spaces." arXiv:2312.00752, 2023.
[19] Garcez & Lamb. "Neurosymbolic AI: The 3rd Wave." AI Review 56, 2023.
[24] Ben-Sasson et al. "STARKs: Scalable, Transparent, Post-Quantum Computational Integrity." 2018.
[25] Groth. "On the Size of Pairing-Based Non-Interactive Arguments." EUROCRYPT 2016.
[27] Shannon. "A Mathematical Theory of Communication." Bell System Technical Journal, 1948.
[30] Scharfstein & Stein. "Herd Behavior and Investment." AER 80(3), 1990.
[37] Kothapalli, Setty & Tzialla. "Nova: Recursive Zero-Knowledge Arguments from Folding Schemes." CRYPTO 2022.
[38] Polygon Zero. "Plonky2: Fast Recursive Arguments with PLONK and FRI." 2022.
[43] Chandra & Toueg. "Unreliable Failure Detectors for Reliable Distributed Systems." JACM 43(2), 1996.
[44] Arrow. "Social Choice and Individual Values." 1951.

---

*RAXION Yellowpaper v0.1 — June 2026*
*Document License: CC BY 4.0*
*Code License: BUSL 1.1 -> MIT on 02/20/2030*
