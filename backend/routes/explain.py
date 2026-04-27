from flask import Blueprint, request

from services.ai_explainer import generate_explanation

explain_bp = Blueprint("explain", __name__)


@explain_bp.post("/explain")
def explain_result():
    payload = request.get_json(silent=True) or {}
    return generate_explanation(payload)
