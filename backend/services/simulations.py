import math

from flask import jsonify


def _to_positive_float(value, name):
    try:
        parsed = float(value)
    except (TypeError, ValueError):
        return None, jsonify({"error": f"{name} must be a number."}), 400

    if parsed <= 0:
        return None, jsonify({"error": f"{name} must be greater than 0."}), 400

    return parsed, None, None


def simulate_ohms_law(voltage, resistance):
    voltage, error_response, status = _to_positive_float(voltage, "Voltage")
    if error_response:
        return error_response, status

    resistance, error_response, status = _to_positive_float(resistance, "Resistance")
    if error_response:
        return error_response, status

    current = voltage / resistance
    return jsonify(
        {
            "experiment": "ohms_law",
            "inputs": {"voltage": voltage, "resistance": resistance},
            "results": {"current": round(current, 4)},
            "units": {"voltage": "V", "resistance": "ohm", "current": "A"},
        }
    )


def simulate_projectile_motion(angle_degrees, initial_velocity):
    angle_degrees, error_response, status = _to_positive_float(angle_degrees, "Angle")
    if error_response:
        return error_response, status

    initial_velocity, error_response, status = _to_positive_float(
        initial_velocity, "Initial velocity"
    )
    if error_response:
        return error_response, status

    gravity = 9.81
    angle_radians = math.radians(angle_degrees)
    flight_time = (2 * initial_velocity * math.sin(angle_radians)) / gravity
    max_height = (initial_velocity**2 * math.sin(angle_radians) ** 2) / (2 * gravity)
    horizontal_range = (initial_velocity**2 * math.sin(2 * angle_radians)) / gravity

    points = []
    steps = 20
    for step in range(steps + 1):
        time = (flight_time / steps) * step
        x_position = initial_velocity * math.cos(angle_radians) * time
        y_position = (initial_velocity * math.sin(angle_radians) * time) - (
            0.5 * gravity * time**2
        )
        points.append({"x": round(x_position, 3), "y": round(max(y_position, 0), 3)})

    return jsonify(
        {
            "experiment": "projectile_motion",
            "inputs": {"angle": angle_degrees, "velocity": initial_velocity},
            "results": {
                "flight_time": round(flight_time, 3),
                "max_height": round(max_height, 3),
                "range": round(horizontal_range, 3),
                "trajectory": points,
            },
            "units": {
                "angle": "degrees",
                "velocity": "m/s",
                "flight_time": "s",
                "max_height": "m",
                "range": "m",
            },
        }
    )


def simulate_hookes_law(force, spring_constant):
    force, error_response, status = _to_positive_float(force, "Force")
    if error_response:
        return error_response, status

    spring_constant, error_response, status = _to_positive_float(
        spring_constant, "Spring constant"
    )
    if error_response:
        return error_response, status

    extension = force / spring_constant
    graph_points = [
        {"force": round(sample_force, 3), "extension": round(sample_force / spring_constant, 3)}
        for sample_force in [0, force * 0.25, force * 0.5, force * 0.75, force]
    ]

    return jsonify(
        {
            "experiment": "hookes_law",
            "inputs": {"force": force, "spring_constant": spring_constant},
            "results": {"extension": round(extension, 4), "graph": graph_points},
            "units": {"force": "N", "spring_constant": "N/m", "extension": "m"},
        }
    )
