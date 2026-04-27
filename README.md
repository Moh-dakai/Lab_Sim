# AI Lab Simulator

AI Lab Simulator is a hackathon-ready MVP for running simple virtual physics experiments and generating AI explanations of the results.

## Project Structure

```text
backend/
frontend/
```

## Features

- Experiment selection for Ohm's Law, Projectile Motion, and Hooke's Law
- Flask API endpoints for each simulation
- AI explanation endpoint with OpenAI integration
- Difficulty levels for explanations
- Lightweight frontend dashboard with charts and loading states

## Run Locally

1. Create and activate a Python virtual environment.
2. Install dependencies:

```bash
pip install -r backend/requirements.txt
```

3. Set your OpenAI API key if you want live AI explanations:

```bash
set OPENAI_API_KEY=your_key_here
```

4. Start the Flask app:

```bash
python -m backend.app
```

5. Open `http://127.0.0.1:5000`

If `OPENAI_API_KEY` is not set, the app still works and returns a built-in fallback explanation so the MVP remains demoable.
