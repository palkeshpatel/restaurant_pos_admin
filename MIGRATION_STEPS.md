# Next.js Migration Steps - Tracking Document

## Project: Restaurant POS Admin Panel

## Migration: React (Vite) → Next.js 14+ (App Router)

---

## ✅ Step 1: Install Next.js Dependencies

- [ ] Install Next.js, React, React-DOM
- [ ] Install Next.js compatible Material-UI packages
- [ ] Update package.json scripts
- [ ] Remove Vite dependencies

## ✅ Step 2: Create Next.js Configuration

- [ ] Create `next.config.js`
- [ ] Create `middleware.js` for route protection
- [ ] Update environment variables setup

## ✅ Step 3: Create App Router Structure

- [ ] Create `app/` directory
- [ ] Create root `app/layout.jsx` (replaces main.jsx)
- [ ] Create `app/page.jsx` (home redirect)
- [ ] Create route groups: `(admin)` and `(super-admin)`

## ✅ Step 4: Convert Authentication

- [ ] Update `contexts/AuthContext.jsx` for Next.js
- [ ] Convert `PrivateRoute` → Middleware
- [ ] Convert `SuperAdminRoute` → Middleware logic

## ✅ Step 5: Convert Pages to Next.js Pages

- [ ] Convert `Login.jsx` → `app/login/page.jsx`
- [ ] Convert `Dashboard.jsx` → `app/(admin)/dashboard/page.jsx`
- [ ] Convert Super Admin pages → `app/(super-admin)/*/page.jsx`
- [ ] Convert Admin pages → `app/(admin)/*/page.jsx`

## ✅ Step 6: Convert Layout Component

- [ ] Update `components/Layout.jsx` for Next.js
- [ ] Create `app/(admin)/layout.jsx` (uses Layout component)
- [ ] Create `app/(super-admin)/layout.jsx`

## ✅ Step 7: Update API Service

- [ ] Update `services/api.js` for Next.js environment variables
- [ ] Update axios baseURL configuration
- [ ] Handle client-side vs server-side API calls

## ✅ Step 8: Update Components

- [ ] Mark all components as Client Components (`'use client'`)
- [ ] Update imports (remove React Router)
- [ ] Update navigation (use Next.js router)

## ✅ Step 9: Update Material-UI Setup

- [ ] Configure Material-UI for Next.js App Router
- [ ] Update theme provider location
- [ ] Ensure CSS-in-JS works correctly

## ✅ Step 10: Cleanup & Testing

- [ ] Remove old Vite files (vite.config.js, index.html)
- [ ] Remove React Router dependencies
- [ ] Test all routes
- [ ] Test authentication flow
- [ ] Fix any compatibility issues

---

## 📝 Notes

- All pages need `'use client'` directive (they use hooks/state)
- Layout components can be Server Components
- Middleware handles route protection
- API service works on client-side only

---

## 🔄 Current Step: Step 8 - Update Components & Cleanup

### ✅ Completed:

- Step 1: Updated package.json with Next.js dependencies
- Step 2: Created next.config.js and middleware.js
- Step 3: Created app directory structure
- Step 4: Updated AuthContext (works with Next.js)
- Step 5: Converted all pages to Next.js pages
- Step 6: Updated Layout component for Next.js
- Step 7: Updated API service for Next.js

### 🔄 In Progress:

- Step 8: Update remaining components that use React Router
- Step 9: Configure Material-UI for Next.js App Router
- Step 10: Cleanup old files and test
