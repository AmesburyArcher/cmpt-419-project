NFL Market vs. Model: An Educational Sports Betting Analyzer (Front-End + Client-Side AI)

Track: Mix of 5.0.1 (Tools & Interfaces for Human/Data-Centered AI) + 5.0.2 (ML with Data Exploration)

Student: Max Corazza

Stack: Vite + React, TypeScript, TailwindCSS, ShadCN, TensorFlow.js (client-side), Web Workers (potentially)

1) Motivation & Problem

Sports betting markets encode collective beliefs about NFL game outcomes, but those beliefs aren’t directly legible to learners: Are market probabilities calibrated? What happens to bankroll risk under simple strategies? Do transparent features (rest days, rolling form, spreads) add signal?
This project delivers an interactive web app that makes these questions explorable through human-centered visualizations and a tiny, explainable, on-device model.

2) Objectives (What the tool will enable)

Convert odds to probabilities and remove the bookmaker’s “vig” for fair comparisons.

Train a tiny client-side model (logistic regression or 1-hidden-layer MLP via TF.js) to predict home win probability from selected features.

Compare market vs. model vs. blends using calibration (reliability curves), Brier score, expected value (EV), and risk (bankroll simulation with flat/kelly).

Explore CLV (closing line value) and line movement to understand market dynamics.

Human-in-the-loop feature selection: a Feature Panel lets users toggle features and instantly see how performance and risk change.

3) Relevance to Course Themes

Human-centered AI: interactive dashboards surface calibration, uncertainty, and risk rather than opaque “picks.”

Data-centric AI: emphasizes data quality, de-vigging, slice analysis, and calibration over complex models.

Responsible framing: educational, transparent math, clear limits and disclaimers.

4) Data & Assumptions

User-supplied CSV of NFL games (or included synthetic demo CSV).

Minimal schema per row: season, week, date, home_team, away_team, scores, moneylines (open/close), spread/total (optional), rest days, rolling form (prev 5), divisional/Thursday/international flags, travel miles, home_win.

The app computes implied probabilities, de-vig normalization, EV, calibration buckets, bankroll paths, CLV.

5) Methods (Lightweight & Browser-Friendly)

Implied probability (moneyline → decimal → p):
if ml>0: dec=1+ml/100; else dec=1+100/|ml|; p_raw=1/dec.
De-vig (2-way): p1 = p1_raw / (p1_raw + p2_raw); p2 = 1−p1.

Model: logistic regression (TF.js) as default; optional tiny MLP. Time-aware split (train on early weeks, validate on later).

Calibration: 10 equal-width probability bins; Reliability curve; Brier score mean((p−y)^2).

EV: EV = p_fair * (decimal−1) − (1−p_fair) for each option; compare market vs. model vs. blend p* = α·p_model + (1−α)·p_market.

Bankroll simulation: flat unit vs. fractional Kelly f* = (b·p − (1−p))/b, b=decimal−1; visualize equity & drawdown.

CLV: compare personal odds vs. closing odds; show CLV distribution and correlation with realized profit.

6) Feature Panel (Human-in-the-Loop Controls)

Toggles: spread, total, home/away indicator, divisional flag, Thursday/intl game, travel miles.

Parameters: rolling window size (3/5/10), rest-day bucketing, model choice (logistic vs. tiny MLP), blend α slider.

Instant feedback: retrain on the fly in a Web Worker; update calibration, Brier, EV table, bankroll curve live.

7) Deliverables

Working SPA (GitHub repo).

Demo with included synthetic CSV (≤ 25k rows stays responsive).

Short readme/report: screenshots + interpretations (what calibration/CLV revealed, limitations).

(Optional) Export: one-pager PDF with current slice (calibration, EV, bankroll).

8) Evaluation & Success Criteria

Loads CSV, infers schema, handles missingness gracefully.

Trains client-side model; renders reliability curve + Brier score.

Shows EV table, bankroll equity/drawdown, and CLV distribution.

Feature toggles visibly change calibration/EV/risk, demonstrating data-centric thinking.

App remains smooth (no main-thread jank) via Workers and sampling.