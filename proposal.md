NFL Market vs. Model: A Sports Betting Analyzer (Front-End + Client-Side AI)

Track: Mix of 5.0.1 + 5.0.2 

Group Members: Max Corazza

Stack: Vite + React, TypeScript, TailwindCSS, ShadCN, TensorFlow.js (client-side), Potential integration with an LLM for more detailed analysis of client-side ML model.

1) Motivation 

I've always been really into sports, especially the NFL and since I am a front-end developer I figured this would be the perfect idea for a project as it mixes in my passion for sports, as well as being able to use my front-end experience to build a nice webapp.
Sports betting has recently gotten extremely popular and sports itself has been evolving in recent years to be very analytical, with plenty of data available. Given this, I'd really want to see how a relatively simple machine learning model can predict NFL match wins.
The goal is to provide an analysis to help someone make an informed decision with the help of ML and LLMs (LLM time dependent).

2) Objectives 

Convert odds to probabilities.

Train a tiny client-side model (logistic regression most likely via TF.js) to predict home win probability from selected features.

Compare market vs. model vs. blends using calibration (reliability curves), Brier score, expected value (EV), and risk (bankroll simulation with flat/kelly).

Human-in-the-loop feature selection: a Feature Panel lets users toggle features and instantly see how performance and risk change. Would also like to provide a feature that allows users to input past games and see what the model predicts and how it compares to actual result so they
can see how the model performs in order to keep users fully aware of risks.

3) Relevance to Course Themes

Human-centered AI: interactive dashboards surface calibration, uncertainty, and risk for predictions. Allow viewing of past results to understand model performance. Remaining fully transparent on the algorithms used to determine predictions and provide disclaimers.

Data-centric AI: emphasizes data quality, and calibration over complex models.

4) Data & Assumptions

User-supplied CSV of NFL games. Time-dependent may provide a pre-set set of data available through api.

Schema per row: season, week, date, home_team, away_team, scores, moneylines (open/close), spread/total (optional), rest days, rolling form (prev 5), divisional/Thursday/international flags, travel miles, home_win, etc...

The app computes implied probabilities, de-vig normalization (removing the bookies guaranteed profit over long run), EV, potentially more depending on time.

5) Methods (browser-friendly)

Implied probabilities & de-vig.

Model: logistic regression TF.js; features include spread/total, rolling form (last 3/5/10), rest days, divisional/Thursday/international flags, travel miles, home/away indicator.

Calibration: 10 probability bins; reliability curve + Brier.

EV & bankroll.

CLV: compare user odds vs. closing odds; show distribution and correlation with realized outcomes.

6) Feature Panel

Toggles: spread, total, home/away indicator, divisional flag, Thursday/intl game, travel miles.

Parameters: rolling window size (3/5/10), rest-day bucketing, model choice (time dependent).

Feedback: provide analysis from model and potential conversation with llm to provide deeper analysis or summary of data provided.

7) Deliverables

Working SPA (GitHub repo).

Demo with included CSV 

Short readme/report: screenshots + interpretations (what calibration/CLV revealed, limitations).

8) Evaluation & Success Criteria

Loads CSV, infers schema, handles missingness gracefully.

Trains client-side model.

Shows EV table, bankroll equity/drawdown, and CLV distribution.

Feature toggles visibly change calibration/EV/risk, demonstrating data-centric thinking.

