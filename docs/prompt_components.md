# Prompts for testing the A2UI components

Type each prompt into a **new chat** of dots-in-chat. "Expect" is the component or skill the reply
should use, and what to check on screen. Token counts are input tokens of that run
(`gemini-3.5-flash-lite`, 2026-11-18, after the skills were split into `ui-forms`, `ui-blocks` and
`ui-display`); they vary a little between runs.

## A. Prompts already run in the browser audit

| # | Prompt | Expect | Input tokens |
|---|---|---|---|
| 1 | `hello` | Plain text, no skill, no tool call | ~1.3k |
| 2 | `Plan a 3-day weekend trip for me: I need to pick a destination, dates, budget and a travel style.` | `ui-forms`: form with text field, date, number or radio choices, and a submit button. Fill it in and press the button: the agent answers with an itinerary card (~17.7k) | ~8.5k |
| 3 | `If I invest 10000 per month in a SIP at 12% return, what will it grow to? Let me play with the numbers.` | `ui-blocks`: GrowthCalculator. Dragging a slider recomputes in the browser with no new request | ~15.7k |
| 4 | `Split my 80000 salary into needs, wants and savings.` | `ui-blocks`: BudgetSplit (draggable ring) with Suggestions under it | ~23.5k (before the skill split) |
| 5 | `Help me understand the quadratic y = x^2 - 5x + 6 with a graph I can tweak.` | `ui-blocks`: QuadraticExplorer. Roots 3 and 2, vertex (2.5, -0.25), discriminant 1 | ~20.8k (before the split) |
| 6 | `Rank these for me, I want to drag them into order: gym, reading, side project, sleep, cooking.` | `ui-blocks`: RankList. Sometimes falls through the model chain and prints JSON as text: retry once | ~23.1k (before the split) |
| 7 | `Show my monthly spending as a chart I can switch between bar, line and pie: rent 30000, food 12000, travel 6000, fun 8000.` | `ui-blocks`: ChartSwitcher with consistent colours (before the split it drew a plain Vega bar chart) | ~16.4k |
| 8 | `Show a card with a Terms button that opens a pop-up dialog containing two lines of sample terms, plus a video player for https://www.w3schools.com/html/mov_bbb.mp4 and an audio player for https://www.w3schools.com/html/horse.mp3` | `ui-display`: Card, Modal (opens a dialog), Video, AudioPlayer | ~30.5k (before the split) |

## B. New prompts for the components not yet tested live (max 10)

| # | Prompt | Expect |
|---|---|---|
| 9 | `I want to order 2 packs of Amul milk (59 each) and a loaf of bread (45). Deliver to my home, pay with UPI.` | `ui-blocks`: OrderReview with a hold-to-pay button (hold 1.5 s; a single tap must not pay) |
| 10 | `Remind me to call the bank tomorrow at 5pm.` | `ui-blocks`: ReminderPicker |
| 11 | `Draft a message to Priya asking if she can move our meeting to Friday, and let me approve it before sending.` | `ui-blocks`: MessageApproval with an undo window before sending |
| 12 | `Write an email to my landlord about the broken heater, I want to review the draft before it goes.` | `ui-blocks`: DraftDiff |
| 13 | `Follow up with Priya, Rahul and Ananya about last week's launch. Show me each message so I can remove people before sending.` | `ui-blocks`: BatchSend with a removable row per person |
| 14 | `Which kind of chart should I use for my expenses? Show me the options.` | `ui-blocks`: ChartGallery (a menu of chart types) |
| 15 | `Show a 4-day weather forecast for Mumbai as a card with a table and a tab for each day.` | `ui-display`: Card, Tabs, Markdown table (and the weather tool) |
| 16 | `Make me a loan EMI calculator where I can drag the amount, rate and years and see the monthly payment change.` | `ui-display`: one VegaChart whose inputs are its params; dragging redraws it in the browser |
| 17 | `Create a sign-up form with name, email (must be valid), age, and a checkbox to accept the terms.` | `ui-forms`: input checks (`?required`, `?email`); submit with a bad email and see the error text |
| 18 | `Plan my reading list: I'd like to pick genres, how many books, and a start date.` | `ui-forms`: multiple-choice chips, number or slider, date picker |

Prompts 9–18 are the ones to run next; 9 and 10 reach the most sensitive blocks (payment and reminders).

## C. After a reply

- **Click a button or suggestion:** the next message in the chat starts with the click's action and
  the agent answers it without showing the same form again.
- **Update in place:** after the SIP card, type `make it 20 years`. The earlier card updates and the
  new reply is short text.
- **Reload:** refresh the page. Earlier cards come back with their last state.
- **Token cost:** open the "Metrics" link under a reply to read its input and output tokens.
