# API / Service Reference

Since SalesFlow IA is currently client-side, this reference documents the internal Service Layer (`services/geminiService.ts`) and State Actions.

## Gemini Service (`services/geminiService.ts`)

### `constructSystemPrompt(state: AppState): string`
Generates the master prompt for the AI agent.
*   **Input**: The entire global application state.
*   **Output**: A formatted string containing rules, inventory, and logic instructions.

### `sendMessageToGemini(message, history, state): Promise<string>`
The primary conversational loop.
*   **message**: User's latest input.
*   **history**: Array of previous turn objects `{ role, parts: [{text}] }`.
*   **state**: Current AppState for context generation.
*   **Returns**: The AI's text response.

### `extractData(userMessage, property: ContactProperty): Promise<string | null>`
A specialized, low-temperature AI call to parse specific data points.
*   **userMessage**: The raw text to analyze.
*   **property**: The schema definition (Label, Type, Description) from Module 9.
*   **Returns**: The extracted value string or `null` if not found.

## Store Actions (`store.tsx`)

### `updateState(key: keyof AppState, value: any): void`
The universal mutator for the global store.
*   **Usage Example**:
    ```typescript
    updateState('courses', newCourseList);
    updateState('activeSandboxDealId', 'deal_123');
    ```

## Data Types (`types.ts`)

### `Deal`
The core transactional entity.
```typescript
interface Deal {
  id: string;
  customerName: string;
  stageId: string;       // Current position in Pipeline (M5)
  value: number;         // Potential revenue
  currency: string;      // ISO code
  chatHistory: ChatMessage[];
  capturedData: Record<string, any>; // Extracted M9 data
}
```
