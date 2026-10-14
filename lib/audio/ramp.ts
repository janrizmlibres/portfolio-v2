/**
 * A discrete fade (the sound toggle, a hidden tab, a stem joining) as a native ramp from wherever the param is now.
 * A ramp starts from the param's previous automation event, so one issued long after that event jumps: the toggle's
 * 1 s fade became a cut. Pinning the current value first fixes it. `cancelAndHoldAtTime` keeps a running curve's
 * value; Firefox lacks it, so there the scheduled values are cancelled and the value pinned.
 */
export function rampTo(param: AudioParam, value: number, secs: number, now: number) {
  if (param.cancelAndHoldAtTime) param.cancelAndHoldAtTime(now);
  else param.cancelScheduledValues(now);
  param.setValueAtTime(param.value, now);
  param.linearRampToValueAtTime(value, now + secs);
}
