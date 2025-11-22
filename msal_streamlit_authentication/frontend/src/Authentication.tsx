import React, { useCallback, useEffect, useState } from "react"
import {
    withStreamlitConnection,
    Streamlit,
    ComponentProps,
} from "streamlit-component-lib"
import { useMsalInstance } from "./auth/msal-auth";

const Authentication = ({ args }: ComponentProps) => {
    // const msalInstance = useMsalInstance(args["auth"], args["cache"])
    const [msalInstance, setMsalInstance] = useState<any>(null);

    const loginRequest = args["login_request"] ?? undefined
    const logoutRequest = args["logout_request"] ?? undefined
    const loginButtonText = args["login_button_text"] ?? ""
    const logoutButtonText = args["logout_button_text"] ?? ""
    const buttonClass = args["class_name"] ?? ""
    const buttonId = args["html_id"] ?? ""
    const [loginToken, setLoginToken] = useState(null)

    useEffect(() => {
        useMsalInstance(args["auth"], args["cache"]).then(instance => {
            setMsalInstance(instance);
        });
    }, []);


    const isAuthenticated = useCallback(() => {
        if (!msalInstance) {
            return false;
        }
        return msalInstance.getAllAccounts().length > 0
    }, [msalInstance])

    useEffect(() => {
        if (!msalInstance) {
            return;
        }
        if (msalInstance.getAllAccounts().length > 0) {
            msalInstance.acquireTokenSilent({
                ...loginRequest,
                account: msalInstance.getAllAccounts()[0]
            // @ts-ignore
            }).then(function (response) {
                // @ts-ignore
                setLoginToken(response)
            }).catch(console.warn)
        } else {
            setLoginToken(null)
        }
    }, [msalInstance])

    useEffect(() => {
        Streamlit.setComponentValue(loginToken)
        Streamlit.setFrameHeight()
        Streamlit.setComponentReady()
    }, [loginToken])

    const loginPopup = useCallback(() => {
        if (!msalInstance) {
            return;
        }
        // @ts-ignore
        msalInstance.loginPopup(loginRequest).then(function (response) {
            // @ts-ignore
            setLoginToken(response)
        }).catch(console.error)
    }, [msalInstance])

    const logoutPopup = useCallback(() => {
        if (!msalInstance) {
            return;
        }
        // @ts-ignore
        msalInstance.logoutPopup(logoutRequest).then(function (response) {
            setLoginToken(null)
        }).catch(console.error)
    }, [msalInstance])

    return (
        <button onClick={isAuthenticated() ? logoutPopup : loginPopup} className={buttonClass} id={buttonId}>
            {isAuthenticated() ? logoutButtonText : loginButtonText}
        </button>
    )

}

export default withStreamlitConnection(Authentication)
