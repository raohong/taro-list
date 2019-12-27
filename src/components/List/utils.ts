export const normalizeStyleValue = (value: any) => {
  return typeof value === 'number' && value
    ? `${value}px`
    : String(value || '');
};

export const normalizeStyle = (style: Record<string, any> | undefined) => {
  const normalizedProps = [
    'width',
    'height',
    'left',
    'top',
    'right',
    'bottom',
    'minWidth',
    'minHeight',
    'maxWidth',
    'maxHeight'
  ];

  return typeof style === 'object'
    ? Object.keys(style).reduce((styles, prop) => {
        styles[prop] = normalizedProps.includes(prop)
          ? normalizeStyleValue(style[prop])
          : styles[prop];

        return styles;
      }, {} as Record<string, string>)
    : {};
};

export type Vector = [number, number];

export const addV = <T extends Vector>(v1: T, v2: T): Vector =>
  <T>v1.map((item, index) => item + v2[index]);

export const subV = <T extends Vector>(v1: T, v2: T): Vector =>
  <T>v1.map((item, index) => item - v2[index]);

export const getTouches = (touches: any[]): Vector => [
  touches[0].clientX,
  touches[0].clientY
];

export const easing = (value: number) => {
  return value / (1 + Math.abs(value) * 0.006);
};
