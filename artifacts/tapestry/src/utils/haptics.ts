export function triggerHaptic(type: 'light' | 'medium' | 'heavy' | 'selection' = 'light') {
  if (!('vibrate' in navigator)) return;
  
  const patterns: Record<string, number | number[]> = {
    light: 10,
    medium: 20,
    heavy: 30,
    selection: [10, 10],
  };
  
  try {
    navigator.vibrate(patterns[type]);
  } catch (e) {
  }
}

export function hapticFeedback() {
  triggerHaptic('light');
}

export function hapticSuccess() {
  triggerHaptic('medium');
}

export function hapticError() {
  triggerHaptic('heavy');
}
