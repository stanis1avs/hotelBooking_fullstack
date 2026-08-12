import {
  AfterViewInit, ChangeDetectionStrategy, Component, DestroyRef,
  ElementRef, Input, OnChanges, ViewChild, inject,
} from '@angular/core';

/**
 * Спарклайн за период: сглаженная линия, градиентная заливка и
 * подсвеченная последняя точка. Рисуется на canvas — плитке нужна
 * лёгкая подложка, а не полноценный график с осями.
 *
 * Цвет берётся из CSS-переменной, поэтому при смене темы холст
 * перерисовывается по событию от matchMedia и по ResizeObserver.
 */
@Component({
  selector: 'app-sparkline',
  template: '<canvas #canvas></canvas>',
  styles: [`
    :host { display: block; position: relative; }
    canvas { width: 100%; height: 100%; display: block; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Sparkline implements AfterViewInit, OnChanges {
  @Input({ required: true }) data: number[] = [];
  /** Имя CSS-переменной, например --mat-sys-primary */
  @Input() colorVar = '--mat-sys-primary';

  @ViewChild('canvas') canvasRef?: ElementRef<HTMLCanvasElement>;

  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly destroyRef = inject(DestroyRef);
  private observer?: ResizeObserver;

  ngAfterViewInit(): void {
    this.paint();

    this.observer = new ResizeObserver(() => this.paint());
    this.observer.observe(this.host.nativeElement);

    const media = matchMedia('(prefers-color-scheme: dark)');
    const onScheme = () => this.paint();
    media.addEventListener('change', onScheme);

    this.destroyRef.onDestroy(() => {
      this.observer?.disconnect();
      media.removeEventListener('change', onScheme);
    });
  }

  ngOnChanges(): void {
    if (this.canvasRef) this.paint();
  }

  private cssColor(): string {
    const value = getComputedStyle(this.host.nativeElement).getPropertyValue(this.colorVar).trim();
    return value || '#1b6a61';
  }

  private paint(): void {
    const canvas = this.canvasRef?.nativeElement;
    if (!canvas) return;

    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (!w || !h) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, h);

    const data = this.data?.length ? this.data : [0, 0];
    const min = Math.min(...data);
    const max = Math.max(...data);
    const span = max - min || 1;
    const pad = 5;
    const x = (i: number) => (i / Math.max(1, data.length - 1)) * w;
    const y = (v: number) => h - pad - ((v - min) / span) * (h - pad * 2);
    const color = this.cssColor();

    // Сглаживание по средним точкам: резкие пики читаются как шум
    const trace = () => {
      ctx.beginPath();
      ctx.moveTo(x(0), y(data[0]));
      for (let i = 1; i < data.length; i++) {
        const cx = (x(i - 1) + x(i)) / 2;
        ctx.quadraticCurveTo(cx, y(data[i - 1]), x(i), y(data[i]));
      }
    };

    const gradient = ctx.createLinearGradient(0, 0, 0, h);
    gradient.addColorStop(0, this.withAlpha(color, 0.22));
    gradient.addColorStop(1, this.withAlpha(color, 0));
    trace();
    ctx.lineTo(x(data.length - 1), h);
    ctx.lineTo(0, h);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    trace();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.6;
    ctx.lineJoin = 'round';
    ctx.globalAlpha = 0.85;
    ctx.stroke();
    ctx.globalAlpha = 1;

    const lx = x(data.length - 1) - 2.5;
    const ly = y(data[data.length - 1]);
    ctx.beginPath();
    ctx.arc(lx, ly, 4.5, 0, Math.PI * 2);
    ctx.fillStyle = getComputedStyle(this.host.nativeElement).getPropertyValue('--mat-sys-surface').trim() || '#fff';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(lx, ly, 2.6, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  }

  /** Токены заданы в hex, поэтому альфа добавляется восьмизначной записью. */
  private withAlpha(color: string, alpha: number): string {
    if (color.startsWith('#') && (color.length === 7 || color.length === 4)) {
      const hex = color.length === 4
        ? `#${color[1]}${color[1]}${color[2]}${color[2]}${color[3]}${color[3]}`
        : color;
      return hex + Math.round(alpha * 255).toString(16).padStart(2, '0');
    }
    return color;
  }
}
