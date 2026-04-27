import os

from flask import Flask, send_from_directory
from flask_cors import CORS

from routes.explain import explain_bp
from routes.simulations import simulations_bp


def create_app() -> Flask:
    app = Flask(__name__, static_folder="../frontend", static_url_path="")
    CORS(app)

    app.register_blueprint(simulations_bp)
    app.register_blueprint(explain_bp)

    @app.get("/")
    def serve_index():
        return send_from_directory(app.static_folder, "index.html")

    @app.get("/health")
    def healthcheck():
        return {"status": "ok", "openai_configured": bool(os.getenv("OPENAI_API_KEY"))}

    return app


app = create_app()


if __name__ == "__main__":
    app.run(debug=True)
