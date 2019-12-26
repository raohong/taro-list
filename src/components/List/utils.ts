export const normalizeStyleValue = (value: any) => {
  return typeof value === 'number' && value
    ? `${value}px`
    : String(value || '');
};

export const normalizeStyle = (style: Record<string, any> | undefined) => {
  const normalizedProps = ['width', 'height', 'left', 'top', 'right', 'bottom'];

  return typeof style === 'object'
    ? Object.keys(style).reduce((styles, prop) => {
        styles[prop] = normalizedProps.includes(prop)
          ? normalizeStyleValue(style[prop])
          : styles[prop];

        console.log(styles, style);

        return styles;
      }, {} as Record<string, string>)
    : {};
};
