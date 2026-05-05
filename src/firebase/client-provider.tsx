'use client';

import React, { useMemo, type ReactNode, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { FirebaseProvider, useFirebase } from '@/firebase/provider';
import { initializeFirebase } from '@/firebase';
import { initiateAnonymousSignIn } from './non-blocking-login';
import { onAuthStateChanged } from 'firebase/auth';

function AnonymousSignInHandler() {
  const pathname = usePathname();
  // This hook can only be used within the FirebaseProvider
  const { isUserLoading, auth } = useFirebase();

  const isAdminRoute = pathname.startsWith('/admin');
  const isLoginRoute = pathname === '/login';

  useEffect(() => {
    if (isAdminRoute || isLoginRoute) {
      return;
    }

    // Don't do anything until auth is ready and the initial user check from the provider is complete.
    if (!auth || isUserLoading) {
      return;
    }

    // Using onAuthStateChanged is the most reliable way to act after the auth state
    // (including any pending redirects) has been fully resolved.
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      // If, after all checks, there is still no authenticated user,
      // then we can safely initiate an anonymous sign-in.
      if (!firebaseUser) {
        initiateAnonymousSignIn(auth);
      }
    });

    // Cleanup the subscription when the component unmounts or dependencies change.
    return () => unsubscribe();
  }, [auth, isUserLoading, isAdminRoute, isLoginRoute]);


  return null; // This component does not render anything
}


interface FirebaseClientProviderProps {
  children: ReactNode;
}

export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  const firebaseServices = useMemo(() => {
    // Initialize Firebase on the client side, once per component mount.
    return initializeFirebase();
  }, []); // Empty dependency array ensures this runs only once on mount

  return (
    <FirebaseProvider
      firebaseApp={firebaseServices.firebaseApp}
      auth={firebaseServices.auth}
      firestore={firebaseServices.firestore}
    >
      <AnonymousSignInHandler />
      {children}
    </FirebaseProvider>
  );
}
