"""
Mock AI module: Auto control fan and light based on thresholds.
Will be replaced by decision tree model from AI team member.
"""

TEMP_THRESHOLD_ON = 30.0   # °C - turn fan ON above this
TEMP_THRESHOLD_OFF = 27.0  # °C - turn fan OFF below this
LIGHT_THRESHOLD_ON = 300   # lux - turn light ON below this
LIGHT_THRESHOLD_OFF = 500  # lux - turn light OFF above this


def decide_fan(temperature: float, current_fan_state: bool) -> dict:
    if temperature >= TEMP_THRESHOLD_ON:
        action = True
    elif temperature <= TEMP_THRESHOLD_OFF:
        action = False
    else:
        action = current_fan_state  # hysteresis: keep current state

    return {
        "action": "ON" if action else "OFF",
        "changed": action != current_fan_state,
        "reason": f"Temperature {temperature}°C (threshold ON={TEMP_THRESHOLD_ON}, OFF={TEMP_THRESHOLD_OFF})"
    }


def decide_light(light_level: float, current_light_state: bool) -> dict:
    if light_level <= LIGHT_THRESHOLD_ON:
        action = True
    elif light_level >= LIGHT_THRESHOLD_OFF:
        action = False
    else:
        action = current_light_state  # hysteresis

    return {
        "action": "ON" if action else "OFF",
        "changed": action != current_light_state,
        "reason": f"Light level {light_level} lux (threshold ON<={LIGHT_THRESHOLD_ON}, OFF>={LIGHT_THRESHOLD_OFF})"
    }


def process(sensor_data: dict, device_states: dict) -> dict:
    temperature = sensor_data.get("temperature", 25.0)
    light_level = sensor_data.get("light", 400)
    fan_state = device_states.get("fan", False)
    light_state = device_states.get("light", False)

    fan_result = decide_fan(temperature, fan_state)
    light_result = decide_light(light_level, light_state)

    return {
        "fan": fan_result,
        "light": light_result
    }
