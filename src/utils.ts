export function boolean_transform<T>({value}: {value: 'true' | 'false' | T}): boolean | T {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return value;
}
