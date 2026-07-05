# Stamp Page Feature Design

## Overview
This feature introduces a "Stamp Page" where event participants can collect digital stamps from various stores during the event. Staff at the stores will input a store-specific code into the participant's device to award a stamp. 

## Requirements
- **Navbar Integration:** Add a "Stamp" button next to the "Account" button in the global navigation.
- **Event Period Toggle:** The Stamp button should only be visible when the environment variable `NEXT_PUBLIC_SHOW_STAMP_MENU` is set to `true`.
- **Dedicated Stamp Page:** Create a new page at `/stamp`.
- **UI/UX (Centralized Input):** 
  - A prominent input box at the top of the `/stamp` page for entering a stamp code.
  - A visual grid/list displaying all available stores.
  - A checkbox or circle indicator next to each store showing its stamp status (Empty vs. Checked ✅).
- **Rules:** A participant can only collect a maximum of 1 stamp per store. Duplicate entries for the same store should be rejected.
- **Mock Data Implementation:** Before integrating the real backend API, implement the UI with mock data (mock stores and logic to check codes locally).

## Architecture & Data Flow
1. **Header Component (`apps/web/components/layout/Header.tsx`):**
   - Read `NEXT_PUBLIC_SHOW_STAMP_MENU`.
   - If true, render the "Stamp" navigation link pointing to `/stamp`.
2. **Mock Data (`apps/web/lib/mock-stamps.ts`):**
   - Define a list of stores (e.g., `id`, `name`, `code`).
   - Define a structure for the user's collected stamps.
3. **Stamp Page (`apps/web/app/stamp/page.tsx`):**
   - **State:** `collectedStamps` (list of store IDs the user has collected), `inputCode` (the code being typed).
   - **Action (Submit Code):** Find the store matching `inputCode`. If found and not already in `collectedStamps`, add it. If already collected, show an error ("Already collected"). If not found, show an error ("Invalid code").
   - **Render:** Iterate through all mock stores, display them, and highlight the ones that exist in `collectedStamps`.

## Future Backend Alignment
The mock logic is designed to easily swap to API calls:
- `GET /stampstore` will fetch the store list and the user's collected stamps.
- `POST /stampstore/createstamp` with `{ code }` will validate the code and award the stamp on the server.
