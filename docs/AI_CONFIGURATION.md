# AI Configuration & Logic

## 1. The Persona
Configured in **Module 7**, the persona defines the name and tone (Friendly, Professional, Urgent). This is prepended to the System Instruction.

## 2. Dynamic System Prompt
Located in `services/geminiService.ts`, the `constructSystemPrompt` function is the heart of the system. It assembles:

*   **Inventory**: `JSON.stringify(courses)`
*   **Pricing**: Logic to select the correct price based on the user's detected country.
*   **Constraints**:
    *   *Geography*: Only sell to active Countries (M8).
    *   *Qualification*: Only sell to allowed Professions (M4).
*   **Knowledge**:
    *   FAQs (M6).
    *   Payment Links (M3) (Only exposed in "Closing" stage).

## 3. The Extraction Engine (`extractData`)

SalesFlow uses a **Secondary AI Call** pattern for precision data entry.

**Trigger:**
When the Pipeline (M5) indicates the current stage has a `requiredInput` (linked to M9):

**Process:**
1.  The user sends a message.
2.  The system sees a requirement (e.g., `email`).
3.  A specialized prompt is sent to Gemini:
    ```text
    TASK: Extract data based on definition.
    LABEL: "Email Address"
    DESC: "Must be valid format"
    INPUT: "My mail is john@doe.com"
    OUTPUT: ?
    ```
4.  If Gemini returns a value (not NULL), the system updates the `Deal.capturedData` state.
5.  Only then does the system generate the conversational response.

## 4. Pipeline Progression
The AI is instructed to:
1.  Check if the current stage requirements are met.
2.  If met, logically move the conversation to the next stage's script.
3.  If not met (e.g., user didn't provide email), stay in the current stage and politely re-ask.
