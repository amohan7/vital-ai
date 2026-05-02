# iOS Shortcut Setup Guide
## Connecting Apple Watch → vital.ai

This guide walks you through building the iOS Shortcut that reads
health data from your Apple Watch and sends it to your vital.ai backend.

---

## Before you start

- Your vital.ai app must be deployed to Vercel
- Note your Vercel URL: `https://your-app.vercel.app`
- Open the **Shortcuts** app on your iPhone

---

## Phase 1 — Create the shortcut

1. Tap **+** in the top right of the Shortcuts app
2. Tap the title at the top and rename it to **vital.ai**
3. Tap **Add Action** to begin adding steps

---

## Phase 2 — Fetch health data (one action per metric)

For each metric below, add a **"Find Health Samples"** action.
Search for it by name in the action search bar.

Configure each one as follows, then save the result to a named variable
using **"Add to Variable"** or **"Set Variable"**.

| Metric | Health Sample Type | Variable name |
|---|---|---|
| VO2 Max | `VO2 Max` | `vo2_max` |
| Steps | `Steps` | `steps` |
| Active Calories | `Active Energy Burned` | `active_calories` |
| Resting HR | `Resting Heart Rate` | `resting_hr` |
| Average HR | `Heart Rate` | `avg_hr` |
| HRV | `Heart Rate Variability` | `hrv` |
| Blood Oxygen | `Blood Oxygen` | `blood_oxygen` |
| Respiratory Rate | `Respiratory Rate` | `respiratory_rate` |
| Sleep | `Sleep Analysis` | `sleep_hours` |

**Settings for each "Find Health Samples" action:**
- Sort by: **Start Date, Latest First**
- Limit: **7** (this gets 7 days of data)

### Workout data (slightly different)

Add a **"Find Workouts"** action (not "Find Health Samples"):
- Sort by: **Start Date, Latest First**
- Limit: **7**

Then add **"Get Details of Workouts"** and extract:
- Workout Activity Type → variable `workout_type`
- Duration → variable `workout_duration`
- Active Energy Burned → variable `workout_calories`

---

## Phase 3 — Format the day label

1. Add a **"Format Date"** action
2. Set date to: **Current Date**
3. Set format to: **Custom**
4. Enter format string: `EEEE` (outputs "Monday", "Tuesday", etc.)
5. Save result to variable: `day_label`

---

## Phase 4 — Build the JSON payload

Add a **"Dictionary"** action and add these key-value pairs.
For each key, set the value to the matching variable from Phase 2.

```
vo2_max           → Variable: vo2_max
steps             → Variable: steps
active_calories   → Variable: active_calories
resting_hr        → Variable: resting_hr
avg_hr            → Variable: avg_hr
hrv               → Variable: hrv
blood_oxygen      → Variable: blood_oxygen
respiratory_rate  → Variable: respiratory_rate
workout_type      → Variable: workout_type
workout_duration  → Variable: workout_duration
workout_calories  → Variable: workout_calories
sleep_hours       → Variable: sleep_hours
day_label         → Variable: day_label
```

No names, no timestamps, no location — this payload is PII-free.

---

## Phase 5 — Send to vital.ai

Add a **"Get Contents of URL"** action and configure it:

```
URL:             https://your-app.vercel.app/analyze
Method:          POST
Request Body:    JSON
Body content:    → select the Dictionary from Phase 4
```

Under **Headers**, add:
```
Content-Type    application/json
```

---

## Phase 6 — Show the response

1. Add a **"Get Dictionary Value"** action
   - Key: `analysis`
   - Dictionary: the result from Phase 5
2. Add a **"Show Result"** or **"Show Alert"** action
   - Message: the Dictionary Value from the step above

---

## Phase 7 — Set up automatic triggers

Go to the **Automation** tab → tap **+** → **Personal Automation**

Choose one of these triggers:

| Trigger | Best for |
|---|---|
| Time of Day — 8:00 AM daily | Morning weekly summary |
| App → Workout app closes | Automatic post-workout report |
| Alarm is dismissed | Sleep report on wake-up |

**Important:** After setting the trigger, toggle off
**"Ask Before Running"** so it fires silently without a confirmation tap.

---

## Phase 8 — First run checklist

- [ ] Run the shortcut manually first (tap the play button)
- [ ] iOS will ask permission to access each health data type — approve all
- [ ] Confirm you see a Gemini analysis appear on screen
- [ ] Then enable your automation trigger

---

## Troubleshooting

**"No data" for a metric**
Some metrics like HRV and VO2 Max only update every few days.
The backend handles missing values gracefully with N/A.

**Blood Oxygen not available**
Requires Apple Watch Series 6 or later with Blood Oxygen app enabled
(Settings → Health → Blood Oxygen).

**Shortcut asks for confirmation every time**
Toggle off "Ask Before Running" in the automation settings.

**Analysis not appearing**
Check your Vercel deployment is live by visiting
`https://your-app.vercel.app/health` — it should return `{"status":"ok"}`.
