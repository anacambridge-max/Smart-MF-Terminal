# Smart MF Terminal

Professional Indian mutual-fund opportunity terminal.

## Data integrity

The production market API fails closed: it does not substitute simulated market values when validated NSE or Yahoo history is unavailable. Mutual-fund NAV and historical NAV returns are fetched from MFAPI and surfaced with their NAV date/source.

## Decision flow

NSE live indices → 1Y technical history → correction/trend/reason scoring → opportunity/risk score → BUY / BUY ON DIP / SIP / WATCH / AVOID → recommended mutual-fund mapping.

The terminal displays the 3:00 PM IST equity mutual-fund NAV decision cutoff; liquid/overnight schemes follow their applicable cut-off rules.

## Deployment

Live deployment trigger refreshed on 13 August 2026.

Research and decision support only; not financial advice.
