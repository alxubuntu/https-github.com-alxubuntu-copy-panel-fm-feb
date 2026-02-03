# SalesFlow IA - Autonomous Sales Agent Platform

**SalesFlow IA** is a mission-control dashboard for configuring, training, and monitoring autonomous AI sales agents. Built with React 19 and Google Gemini 2.5/3.0, it allows businesses to define complex sales logic, pricing matrices, and conversation pipelines that the AI executes in real-time.

## 🚀 Quick Start

1.  **Environment Setup**: Ensure `process.env.API_KEY` is configured with a valid Google Gemini API Key.
2.  **Install Dependencies**: The project uses ES Modules via CDN (esm.sh) in `index.html`, so no `npm install` is required for the runtime, but a local server is needed.
3.  **Run**: Serve the root directory.
    ```bash
    npx serve .
    ```

## 🧠 Core Capabilities

*   **Context-Aware Intelligence**: The agent reconstructs its "brain" on every turn, injecting current inventory, pricing rules, and conversation history.
*   **Structured Data Extraction**: Automatically parses unstructured chat text into structured JSON data (e.g., extracting emails, professions, budget) based on admin-defined schemas.
*   **Kanban Operations**: A Trello-like board to visualize deal stages and trigger AI automated follow-ups.
*   **Logic Gates**: 
    *   *Module 4*: Restrict sales based on user profession.
    *   *Module 8*: Restrict sales by country/market.

## 📂 Module Breakdown

The application is structured into **12 Functional Modules**:

| ID | Module Name | Description |
|:---|:---|:---|
| **M1** | **Courses** | Product inventory management (SKU, Benefits, Modality). |
| **M2** | **Pricing** | Multi-currency pricing matrix with promo date logic. |
| **M3** | **Payment Links** | Payment URL repository mapped by Country + SKU. |
| **M4** | **Professions** | Rule engine for lead qualification (Allowed/Denied professions). |
| **M5** | **Pipeline** | Conversation flow definition with script templates. |
| **M6** | **FAQs** | Knowledge base for handling out-of-scope questions. |
| **M7** | **Configuration** | AI Persona settings (Name, Tone, Model Version). |
| **M8** | **Countries** | Market definitions (Flags, Currencies, Phone Prefixes). |
| **M9** | **Contact Properties** | Schema definition for data collection (Validation rules). |
| **M10** | **Leads** | Explorer for chat history and extracted data. |
| **M11** | **Data Cards** | CRUD interface for lead information. |
| **M12** | **Deals Kanban** | Drag-and-drop pipeline management with bot triggers. |

## 🛠 Tech Stack

*   **Frontend**: React 19, TypeScript
*   **Styling**: Tailwind CSS
*   **Icons**: Lucide React
*   **AI Engine**: Google GenAI SDK (`@google/genai`)
*   **State**: React Context API (Monolithic Store)
