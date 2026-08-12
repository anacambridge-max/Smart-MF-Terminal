# Smart MF Terminal

Professional Indian mutual-fund opportunity terminal.

## Data integrity

The production market API is designed to fail closed: it does not substitute simulated market values when validated NSE or Yahoo history is unavailable. Mutual-fund NAV and historical NAV returns are fetched from MFAPI and surfaced with the NAV date/source.

## Decision flow

NSE live indices → 1Y technical history → correction/trend/reason scoring → opportunity/risk score → BUY / BUY ON DIP / SIP / WATCH / AVOID → recommended mutual fund mapping.

Equity mutual-fund NAV timing is shown as a 3:00 PM IST decision cutoff in the UI; liquid/overnight schemes follow their applicable cut-off rules.

Research/decision support only; not financial advice.
