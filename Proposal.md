# Technical Proposal: Privacy-First Local Financial AI Agent

### 1. Problem & User
* **User Persona:** Privacy-focused individuals who want deep visibility into their personal finances without exposing sensitive financial records to external networks or corporations.
* **Supported Workflow:** Users manually log transactions (merchant name, amount, date) into a secure local dashboard. In future iterations, this workflow will scale to parse local bank statements directly. The application provides an interactive chat interface to safely run complex queries and uncover spending patterns over time.
* **Core Pain Point Removed:** Eliminates the uncomfortable reliance on third-party cloud apps, data aggregation platforms, or public cloud LLMs that scrape, store, or train on personal financial datasets. 

### 2. Why Generative AI
* **The Dynamic Data Challenge:** Transaction descriptions and merchant names are erratic and highly inconsistent (e.g., `"SQ *COFFEE SHOP LLC"` vs `"TST* COFFEE S_ANTONIO"`). Hardcoded rules, regular expressions, or static Excel formulas require endless upkeep to trap these edge cases.
* **Unstructured Intelligence:** A local LLM natively provides fuzzy semantic reasoning capable of effortlessly clustering varied merchant descriptors into unified categories. Additionally, it translates conversational human questions into specific structured lookups and analytical data parameters.

### 3. Agentic Functions
* **Retrieval-Augmented Generation (RAG):** Performs secure local vector searches across historical transaction datasets to surface relevant financial context for user queries.
* **Memory:** Implements conversational state storage entirely in a local context buffer so the user can ask intuitive follow-up questions (e.g., *"How much did I spend there?"* followed by *"Is that more than last month?"*).

### 4. Data
* **Data Sources (POC):** Relying entirely on manual user inputs mapping exact merchant identities, cost figures, and transaction timestamps.
* **Data Sources (Production):** Upgrading to native, client-side extraction pipelines that parse standard banking PDFs and CSV statements locally on the host machine.
* **Data Ingestion Pipeline:** All data is strictly processed client-side. Financial records populate a local transactional database and are passed to a local embedding model to populate a sandboxed vector database. No external APIs or cloud synchronization mechanisms are present.

### 5. Stack & Deployment Target
The application is structured to execute seamlessly as a sandboxed local environment on consumer machine architecture:

| Layer | Selected Technology | Operational Profile |
| :--- | :--- | :--- |
| **Frontend** | React 19 + Vite 6 + TypeScript + Tailwind CSS | Fast, strongly-typed user interface executing locally. |
| **Backend** | FastAPI (Python 3.12) | Local server managing model orchestration and tool calls. |
| **Database** | PostgreSQL 16 | Relational storage for permanent transaction history. |
| **Vector DB** | Qdrant | Fast local vector index running alongside storage. |
| **LLM** | Ollama (`gemma4:e2b`) | Lightweight, local inference engine optimizing performance. |
| **Embeddings**| Ollama (`embeddinggemma4`) | Local mathematical representation of financial rows. |

### 6. Evaluation Plan
* **Ground-Truth Verification:** Accuracy testing will rely on a small, deterministic evaluation dataset of manual entries pre-labeled with correct merchant categories and totals.
* **Human-in-the-Loop Triage:** Evaluates agent accuracy by matching LLM-generated summaries and metrics directly against classic SQL aggregations of the local PostgreSQL data to verify math precision.
* **Performance Benchmark Metrics:** Latency and memory consumption profiling will be continuously monitored to ensure comfortable execution metrics on standard consumer laptop hardware.

### 7. Risks & Guardrails
* **Financial Hallucinations:** Large language models are prone to hallucinating numerical values or fabricating fake transaction visits. **Guardrail:** The system systemically isolates the LLM from executing raw math. The LLM's role is strictly restricted to defining filter parameters (e.g., dates, merchant classes) passed to structured python math tools, which output deterministic financial balances.
* **Local Hardware Bottlenecks:** Heavy models can choke local processing units, leading to high response latency and friction. **Guardrail:** Utilizing highly compressed, hyper-efficient quantized models via Ollama to maximize tokens-per-second on non-workstation chips.
* **Malicious Injections:** Guarding local file directories against prompt manipulation threats trying to invoke unauthorized local terminal execution or read sensitive system paths. **Guardrail:** Enforcing rigorous structural output schemas (JSON enforcement) and sandboxing local tool permissions to prevent arbitrary system commands.
