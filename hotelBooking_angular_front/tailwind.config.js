/**
 * Шкала текста берётся из токенов M3, которые генерирует mat.theme().
 *
 * До этого утилиты Tailwind жили в собственной шкале: заголовок страницы
 * задавался классом text-2xl, а заголовок внутри mat-card — стилями Material,
 * и вертикальный ритм плавал от страницы к странице. Теперь text-sm в разметке
 * и body-medium внутри компонента Material — это один и тот же размер.
 *
 * Шаг lg/xl не имеет точного соответствия в M3 (18 и 20 px против 16 и 22),
 * поэтому они отображены на ближайшие ступени заголовков — так текст
 * попадает в шкалу, а не оказывается между её ступенями.
 *
 * @type {import('tailwindcss').Config}
 */
const scale = (token) => [
  `var(--mat-sys-${token}-size)`,
  {
    lineHeight: `var(--mat-sys-${token}-line-height)`,
    letterSpacing: `var(--mat-sys-${token}-tracking)`,
  },
];

module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      fontSize: {
        xs: scale('label-small'),
        sm: scale('body-medium'),
        base: scale('body-large'),
        lg: scale('title-medium'),
        xl: scale('title-large'),
        '2xl': scale('headline-small'),
        '3xl': scale('headline-medium'),
      },
    },
  },
  plugins: [],
}
