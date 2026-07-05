### Task 3: Add Stamp Menu to Navbar
**Files:**
- Modify: `apps/web/components/layout/Header.tsx`

- [ ] **Step 1: Add environment variable logic and nav button**
Add `process.env.NEXT_PUBLIC_SHOW_STAMP_MENU` check in `Header.tsx` and the Stamp button before or after the Account button.

```tsx
// Inside Header.tsx (around line 15), add:
const showStampMenu = process.env.NEXT_PUBLIC_SHOW_STAMP_MENU === 'true';

// Add isStampActive near line 58
const isStampActive = pathname === "/stamp";

// Add the Stamp button block next to Account button block (around line 150)
{showStampMenu && (
  <button
    onClick={() => {
      if (activeModal) closeModals();
      router.push("/stamp");
    }}
    className={`${baseNavLinkClass} ${isStampActive ? activeNavClass : inactiveNavClass} ${isStampActive ? activeUnderlineClass : ""}`}
  >
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-80 group-hover:cursor-pointer hover:opacity-100">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
      <polyline points="14 2 14 8 20 8"></polyline>
      <path d="M16 13H8"></path>
      <path d="M16 17H8"></path>
      <path d="M10 9H8"></path>
    </svg>
    <span className="hidden sm:inline">Stamp</span>
  </button>
)}
```
