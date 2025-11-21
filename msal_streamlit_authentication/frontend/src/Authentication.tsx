import React, { useCallback, useEffect, useState } from "react"
import {
    withStreamlitConnection,
    Streamlit,
    ComponentProps,
} from "streamlit-component-lib"
import { useMsalInstance } from "./auth/msal-auth";

const Authentication = ({ args }: ComponentProps) => {
    const msalInstance = useMsalInstance(args["auth"], args["cache"])
    const loginRequest = args["login_request"] ?? undefined
    const logoutRequest = args["logout_request"] ?? undefined
    const loginButtonText = args["login_button_text"] ?? ""
    const logoutButtonText = args["logout_button_text"] ?? ""
    const buttonClass = args["class_name"] ?? ""
    const buttonId = args["html_id"] ?? ""

    const [loginToken, setLoginToken] = useState(null)

    // derive authentication state from the current msal instance (recomputed each render)
    const isAuthenticated = msalInstance.getAllAccounts().length > 0

    useEffect(() => {
        // If there is an account available, try to acquire a token silently.
        // If silent acquisition fails (interaction required), fall back to a popup acquire.
        let mounted = true
        const accounts = msalInstance.getAllAccounts()
        if (accounts.length > 0) {
            const account = accounts[0]
            msalInstance.acquireTokenSilent({
                ...loginRequest,
                account,
            }).then(function (response) {
                if (!mounted) return
                // @ts-ignore
                setLoginToken(response)
            }).catch(async function (error) {
                // fallback to popup if silent token acquisition failed
                console.warn("acquireTokenSilent failed, falling back to acquireTokenPopup:", error)
                try {
                    const resp = await msalInstance.acquireTokenPopup({
                        ...loginRequest,
                        account,
                    })
                    if (!mounted) return
                    // @ts-ignore
                    setLoginToken(resp)
                } catch (err) {
                    console.error("acquireTokenPopup also failed:", err)
                    if (!mounted) return
                    setLoginToken(null)
                }
            })
        } else {
            setLoginToken(null)
        }

        return () => {
            mounted = false
        }
    }, [msalInstance, loginRequest])

    // Send token (or null) to Streamlit each time it changes and update the frame height.
    useEffect(() => {
        Streamlit.setComponentValue(loginToken)
        Streamlit.setFrameHeight()
    }, [loginToken])

    // Signal component is ready once on mount so Streamlit doesn't wait forever.
    useEffect(() => {
        Streamlit.setComponentReady()
    }, [])

    const loginPopup = useCallback(() => {
        msalInstance.loginPopup(loginRequest).then(function (response) {
            // @ts-ignore
            setLoginToken(response)
        }).catch(console.error)
    }, [msalInstance, loginRequest])

    const logoutPopup = useCallback(() => {
        // @ts-ignore
        msalInstance.logoutPopup(logoutRequest).then(function () {
            setLoginToken(null)
        }).catch(console.error)
    }, [msalInstance, logoutRequest])

    return (
        <div className="card">
            <button onClick={isAuthenticated ? logoutPopup : loginPopup} className={buttonClass} id={buttonId}>
                {isAuthenticated ? logoutButtonText : loginButtonText}
            </button>
        </div>
    )
}

export default withStreamlitConnection(Authentication)
