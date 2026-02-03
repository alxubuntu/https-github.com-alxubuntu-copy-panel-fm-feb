# User Manual

## 🟢 1. Setting Up Your Offer

### Step 1: Define Markets (Module 8)
Go to **System > Countries**.
*   Add the countries you want to sell to.
*   Set the Currency and Flag.
*   *Note:* The AI will refuse to sell to countries marked as "Inactive".

### Step 2: Create Inventory (Module 1)
Go to **Catalog > Courses**.
*   Create a course. The `SKU` is critical—it links prices and rules.
*   Add at least 3 benefits and a description > 50 chars.

### Step 3: Set Pricing (Module 2)
Go to **Catalog > Pricing**.
*   The matrix shows **Courses (Rows)** vs **Countries (Columns)**.
*   Click a cell to set the price.
*   You can set a "Promo Price" with date ranges. The AI will automatically check today's date against this range to offer the discount.

## 🔵 2. Configuring the Agent

### Step 4: Define the Pipeline (Module 5)
Go to **Agent > Flow**.
*   Create Stages (e.g., "Introduction", "Qualifying", "Closing").
*   **Script Template**: What the AI should say. Use `{customer_name}` placeholders.
*   **Required Input**: Link a stage to a property (see below).

### Step 5: Data Requirements (Module 9)
Go to **System > User Fields**.
*   Define what data you want to collect (e.g., "Email", "Job Title").
*   **Description**: This is an instruction for the AI. Example: *"Must be a corporate email address"*.

## 🔴 3. Simulating & Training

### Sandbox
Go to **Agent > Simulator**.
*   Chat with your configured bot.
*   Open the **"System Log"** panel on the right to see:
    *   Intention detection.
    *   Data extraction events.
    *   Pipeline transitions.

## 🟣 4. Daily Operations

### Kanban (Module 12)
Go to **Sales > Deals**.
*   Drag cards to move leads between stages manually.
*   **Trigger Bot**: When dropping a card, choose "Trigger Bot" to have the AI send the script for the new stage immediately to the chat.

### Leads (Module 10)
Go to **Sales > Chats**.
*   Review full conversation history.
*   See the side panel for all structured data captured by the AI.
