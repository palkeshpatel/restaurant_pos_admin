# Fixing Duplicate API Calls - All Admin Pages

Applying the same fix pattern to all Admin list pages to prevent duplicate API calls.

## Pattern Applied:

1. Add `useRef` to imports
2. Add `isMountedRef` and `fetchInProgressRef`
3. Add cleanup useEffect
4. Move fetch function before useEffect
5. Add guards in fetch function
6. Update useEffect with guards

## Files Updated:

- ✅ Employees.jsx
- ✅ Roles.jsx
- ✅ Permissions.jsx
- ✅ DiscountReasons.jsx
- 🔄 Floors.jsx (in progress)
- 🔄 Tables.jsx (in progress)
- 🔄 Menus.jsx (in progress)
- 🔄 MenuCategories.jsx
- 🔄 MenuItems.jsx
- 🔄 ModifierGroups.jsx
- 🔄 Modifiers.jsx
- 🔄 DecisionGroups.jsx
- 🔄 Decisions.jsx
- 🔄 TaxRates.jsx
- 🔄 Printers.jsx
