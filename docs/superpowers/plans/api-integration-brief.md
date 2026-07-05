### Task 1 & 2: API Integration for Stamp Page

**Files:**
- Create: `apps/web/lib/stamp-api.ts`
- Modify: `apps/web/app/stamp/page.tsx`

**Instructions:**
1. Create `stamp-api.ts`. It should export two functions:
   - `fetchStampStores(): Promise<{ name: string, count: number }[]>` (Calls `GET /stampstore` with auth token, using `apiBase` and `getAuthToken` like `user-api.ts`. It should handle 401s similarly).
   - `redeemStampCode(code: string): Promise<{ success: boolean, message: string }>` (Calls `POST /stampstore/createstamp` with `{ code }`).

2. Modify `apps/web/app/stamp/page.tsx`:
   - Remove `mockStores`.
   - Use `useEffect` to call `fetchStampStores` and set the state.
   - Show a loading state while fetching.
   - For `handleRedeem`, call `redeemStampCode(code)`. If successful, show success message and refresh the store list (by calling `fetchStampStores` again). If error, show the error message.
   - The store grid should render based on the `name` and `count` (where `count === 1` means `isCollected = true`).

3. Commit your changes.
4. Report completion to `docs/superpowers/plans/api-integration-report.md`.
