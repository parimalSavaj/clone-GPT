import { onBoard } from '@/features/auth/actions/onboard';
import { auth } from '@clerk/nextjs/server'
import React from 'react'

/**
 * Authenticated app layout — protects routes and syncs user to DB.
 */
const RootGroupLayout = async ({ children }: { children: React.ReactNode }) => {
    await auth.protect();
    await onBoard();

    return (
        <>
            {children}
        </>
    )
}

export default RootGroupLayout
