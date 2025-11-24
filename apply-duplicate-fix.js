// This is a reference script showing the pattern to apply
// The actual fixes are being applied via search_replace

/*
Pattern to apply to all Admin pages:

1. Change import:
   import { useState, useEffect } from 'react'
   TO:
   import { useState, useEffect, useRef } from 'react'

2. After error state, add:
   const isMountedRef = useRef(true)
   const fetchInProgressRef = useRef(false)

3. Add cleanup useEffect:
   useEffect(() => {
     isMountedRef.current = true
     return () => {
       isMountedRef.current = false
     }
   }, [])

4. Move fetch function before useEffect and add guards:
   const fetchX = async () => {
     if (fetchInProgressRef.current) {
       return
     }
     fetchInProgressRef.current = true
     setLoading(true)
     try {
       // ... existing code ...
       if (isMountedRef.current) {
         // set state
       }
     } catch (error) {
       // ... error handling ...
     } finally {
       fetchInProgressRef.current = false
       if (isMountedRef.current) {
         setLoading(false)
       }
     }
   }

5. Update useEffect:
   useEffect(() => {
     if (isMountedRef.current && !fetchInProgressRef.current) {
       fetchX()
     }
     // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [page, rowsPerPage])
*/

