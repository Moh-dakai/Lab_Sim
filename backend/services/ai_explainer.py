import json
import os

from flask import jsonify

try:
    from openai import OpenAI
except ImportError:  # pragma: no cover - handled at runtime
    OpenAI = None


def _build_prompt(payload):
    experiment = payload.get("experiment", "unknown experiment")
    difficulty = payload.get("difficulty", "beginner")
    user_inputs = payload.get("inputs", {})
    computed_results = payload.get("results", {})

    return f"""
You are a helpful physics tutor for a student using an AI lab simulator.
Explain the experiment result in a {difficulty} difficulty level.

Experiment: {experiment}
User inputs: {user_inputs}
Computed results: {computed_results}

Respond in JSON with exactly these keys:
- explanation
- why_it_happened
- real_world_example

Keep the explanation accurate, clear, and concise.
""".strip()


def _fallback_explanation(payload):
    experiment = payload.get("experiment", "experiment")
    difficulty = payload.get("difficulty", "beginner")
    results = payload.get("results", {})

    experiment_summaries = {
        "ohms_law": f"The current is {results.get('current', 'the calculated value')} because current equals voltage divided by resistance.",
        "projectile_motion": f"The projectile follows a curved path because horizontal motion and vertical motion happen at the same time under gravity. Its range is {results.get('range', 'the calculated value')} m.",
        "hookes_law": f"The spring extension is {results.get('extension', 'the calculated value')} because extension grows in direct proportion to force when the spring behaves elastically.",
    }

    return {
        "source": "fallback",
        "explanation": experiment_summaries.get(
            experiment,
            f"This {experiment} result was calculated from the input values using the standard physics formula for the experiment."
        ),
        "why_it_happened": "The output changes because the physics relationship links the input quantities directly. When one input changes, the result changes according to that formula.",
        "real_world_example": "A similar relationship appears in classroom lab equipment, engineering measurements, and everyday devices that rely on predictable physical behavior.",
        "difficulty": difficulty,
    }


def generate_explanation(payload):
    if not isinstance(payload, dict):
        return jsonify({"error": "Request body must be a JSON object."}), 400

    if not os.getenv("OPENAI_API_KEY") or OpenAI is None:
        return jsonify(_fallback_explanation(payload))

    try:
        client = OpenAI()
        response = client.responses.create(
            model=os.getenv("OPENAI_MODEL", "gpt-4.1-mini"),
            input=[
                {
                    "role": "user",
                    "content": _build_prompt(payload),
                }
            ],
        )
        text_output = response.output_text

        try:
            parsed_output = json.loads(text_output)
            parsed_output["source"] = "openai"
            return jsonify(parsed_output)
        except json.JSONDecodeError:
            return jsonify(
                {
                    "source": "openai",
                    "explanation": text_output,
                    "why_it_happened": "",
                    "real_world_example": "",
                }
            )
    except Exception as exc:  # pragma: no cover - network/runtime dependent
        fallback = _fallback_explanation(payload)
        fallback["error"] = str(exc)
        return jsonify(fallback)
