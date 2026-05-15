# 電池合規管理系統

合規管理平台，供研發、採購、QA 三個團隊追蹤手機電池料件對各國法規的合規狀態。

## Language

**Compliance Record（合規紀錄）**:
A single verdict of whether one Component satisfies one Regulation.
_Avoid_: compliance result, compliance status (use as field name only), compliance entry

**AI-Suggested Record（AI 建議紀錄）**:
A Compliance Record produced by AI analysis that has not yet been confirmed by a human; it does not count as an official verdict until a human approves it.
_Avoid_: AI compliance, auto-compliance, AI result

**Component（料件）**:
A physical battery part managed by the system (e.g., cell, BMS, connector).
_Avoid_: part, item, product

**Regulation（法規）**:
A named compliance standard with a region and lifecycle (issued, effective, expiry dates).
_Avoid_: rule, standard, requirement

**Regulation Document（法規文件）**:
A PDF uploaded and attached to a Regulation, parsed into Chunks for RAG search.
_Avoid_: file, attachment, document (alone)

**Compliance Status（合規狀態）**:
The current verdict of a Compliance Record: PASS, FAIL, PENDING, AI_PENDING, NOT_APPLICABLE, or EXPIRED. PENDING = not yet assessed; AI_PENDING = AI suggested a verdict, awaiting human confirmation.
_Avoid_: compliance result, verdict (use only informally)

**Indexing（向量化）**:
The process of parsing a Regulation Document into Chunks and generating embeddings for each, enabling vector search. A document is not searchable until it is indexed.
_Avoid_: vectorizing (use only in UI labels), embedding (use as the artifact, not the process)

## Relationships

- A **Component** has zero or more **Compliance Records**, one per **Regulation**
- A **Compliance Record** belongs to exactly one **Component** and exactly one **Regulation**
- A **Regulation** has one or more **Regulation Documents**
- An **AI-Suggested Record** is a **Compliance Record** with `isAiSuggested = true` and an unconfirmed status

## Flagged ambiguities

- "AI 合規分析結果" was ambiguous between an intermediate suggestion and a committed record — resolved: AI-Suggested Records are not official until human-confirmed.
