"use client"

import Script from "next/script"
import { useEffect, useState } from "react"

const STORAGE_KEY = "rxp-cookie-consent"
const PIXEL_ID = "988616127374453"
const PRIVACY_URL = "https://raadgiverxperten.dk/privacy-policy/"

type Consent = "accepted" | "declined"

function readConsent(): Consent | null {
  try {
    const v = window.localStorage.getItem(STORAGE_KEY)
    return v === "accepted" || v === "declined" ? v : null
  } catch {
    return null
  }
}

function saveConsent(v: Consent) {
  try {
    window.localStorage.setItem(STORAGE_KEY, v)
  } catch {}
}

// Fjerner Metas cookies, hvis man trækker samtykket tilbage
function clearMetaCookies() {
  const host = window.location.hostname
  const domains = [host, `.${host}`, `.${host.split(".").slice(-2).join(".")}`]
  for (const name of ["_fbp", "_fbc"]) {
    document.cookie = `${name}=; Max-Age=0; path=/`
    for (const d of domains) document.cookie = `${name}=; Max-Age=0; path=/; domain=${d}`
  }
}

export function openCookieSettings() {
  window.dispatchEvent(new Event("open-cookie-settings"))
}

export default function CookieConsent() {
  const [ready, setReady] = useState(false)
  const [consent, setConsent] = useState<Consent | null>(null)
  const [open, setOpen] = useState(false)
  const [details, setDetails] = useState(false)

  useEffect(() => {
    const saved = readConsent()
    setConsent(saved)
    setOpen(saved === null)
    setReady(true)
    const reopen = () => setOpen(true)
    window.addEventListener("open-cookie-settings", reopen)
    return () => window.removeEventListener("open-cookie-settings", reopen)
  }, [])

  function choose(v: Consent) {
    const hadAccepted = consent === "accepted"
    saveConsent(v)
    setConsent(v)
    setOpen(false)
    if (v === "declined" && hadAccepted) {
      clearMetaCookies()
      // Pixel-scriptet er allerede indlæst – en genindlæsning stopper det helt
      window.location.reload()
    }
  }

  if (!ready) return null

  return (
    <>
      {consent === "accepted" && (
        <Script id="meta-pixel" strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${PIXEL_ID}');
            fbq('track', 'PageView');
          `}
        </Script>
      )}

      {open && (
        <div
          role="dialog"
          aria-label="Cookies"
          className="fixed inset-x-0 bottom-0 z-[100] mx-auto max-w-[480px] px-3 pb-[max(12px,env(safe-area-inset-bottom))]"
        >
          <div className="max-h-[85dvh] overflow-y-auto rounded-[18px] bg-white p-5 text-[#253457] shadow-[0_8px_40px_rgba(37,52,87,0.28)] ring-1 ring-[#253457]/10">
            <p className="m-0 text-[17px] font-extrabold tracking-[-0.01em]">Cookies</p>
            <p className="mb-0 mt-2 text-[15px] leading-[1.45]">
              Vi bruger marketingcookies fra Meta (Facebook og Instagram) til at måle, hvilke af vores annoncer der virker. Det kræver dit samtykke. Siden virker lige godt, hvis du siger nej.
            </p>
            <button
              type="button"
              onClick={() => setDetails((d) => !d)}
              aria-expanded={details}
              className="mt-1 min-h-[44px] text-[15px] font-bold underline underline-offset-2"
            >
              {details ? "Skjul detaljer" : "Vis detaljer"}
            </button>
            {details && (
              <ul className="m-0 mb-1 list-none space-y-2 p-0 text-[14px] leading-[1.45]">
                <li>
                  <b>Hvem:</b> Meta Platforms Ireland Ltd. får data fra din browser, når du bruger siden.
                </li>
                <li>
                  <b>Hvad:</b> Sidevisninger, at du starter tjekket, at du booker eller sender en henvendelse, samt din IP-adresse og browseroplysninger. Dine svar og kontaktoplysninger sendes ikke til Meta.
                </li>
                <li>
                  <b>Hvorfor:</b> At måle og forbedre vores annoncer og vise dem til relevante personer.
                </li>
                <li>
                  <b>Hvor længe:</b> Cookien (_fbp) gemmes i op til 90 dage.
                </li>
                <li>
                  <b>Tilbagekald:</b> Du kan til enhver tid ændre dit valg via "Cookie-indstillinger" nederst på forsiden.
                </li>
                <li>
                  <a
                    href={PRIVACY_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold underline underline-offset-2"
                  >
                    Læs vores privatlivspolitik
                  </a>
                </li>
              </ul>
            )}
            <div className="mt-4 flex gap-2.5">
              <button
                type="button"
                onClick={() => choose("declined")}
                className="h-12 flex-1 rounded-[12px] border-2 border-[#253457] bg-white text-[16px] font-bold text-[#253457]"
              >
                Kun nødvendige
              </button>
              <button
                type="button"
                onClick={() => choose("accepted")}
                className="h-12 flex-1 rounded-[12px] border-2 border-[#253457] bg-[#253457] text-[16px] font-bold text-white"
              >
                Acceptér alle
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
