from flask import Blueprint, request

from services.simulations import (
    simulate_hookes_law,
    simulate_ohms_law,
    simulate_projectile_motion,
)

simulations_bp = Blueprint("simulations", __name__)


@simulations_bp.post("/simulate/ohms")
def simulate_ohms():
    payload = request.get_json(silent=True) or {}
    voltage = payload.get("voltage")
    resistance = payload.get("resistance")
    return simulate_ohms_law(voltage=voltage, resistance=resistance)


@simulations_bp.post("/simulate/projectile")
def simulate_projectile():
    payload = request.get_json(silent=True) or {}
    angle = payload.get("angle")
    velocity = payload.get("velocity")
    return simulate_projectile_motion(angle_degrees=angle, initial_velocity=velocity)


@simulations_bp.post("/simulate/hooke")
def simulate_hooke():
    payload = request.get_json(silent=True) or {}
    force = payload.get("force")
    spring_constant = payload.get("spring_constant", 10)
    return simulate_hookes_law(force=force, spring_constant=spring_constant)
