# System Architecture

## Overview

SalesFlow IA follows a **Client-Side Monolithic State** architecture suitable for high-interactivity dashboards. It relies on React Context for state management, **Supabase (PostgreSQL)** for persistence, and direct API calls to Google Gemini for intelligence.

## 1. Data Model (`types.ts`)

The domain model is relational, linked primarily by `SKU` (Product ID) and `Deal ID` (Session ID).

*   **Global Store (`AppState`)**: Holds arrays of `Course`, `Pricing`, `Deal`, `PipelineStage`, etc.
*   **Database**: Supabase PostgreSQL.
*   **Deal Entity**: Represents a customer session.
    *   `chatHistory`: JSONB column in `deals` table.
    *   `capturedData`: JSONB column in `deals` table.

## 2. State Management (`store.tsx`)

A single `StoreProvider` wraps the application.
*   **Initialization**: `useEffect` fetches all tables from Supabase on app mount in parallel.
*   **Sync Strategy**: 
    1.  **Optimistic UI**: State updates immediately in React Context via `setState`.
    2.  **Background Sync**: The `updateState` function triggers an asynchronous `upsert` (Insert or Update) to the corresponding Supabase table using the `supabase-js` client.

## 3. AI Service Layer (`services/geminiService.ts`)

The application calls the Gemini API directly from the browser.

### The "Context Injection" Pattern
The AI is stateless. Every message sent to the API includes a dynamically generated **System Instruction** built from the current `AppState` (which is hydrated from the Database).

## 4. Security Note

*   **API Keys**: 
    *   Gemini Key: `process.env.API_KEY`
    *   Supabase URL/Key: `services/supabaseClient.ts` (Should be env vars in production).
*   **RLS**: Row Level Security policies are configured in Supabase to control access.
