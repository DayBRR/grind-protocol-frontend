import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DailyRingComponent } from './daily-ring.component';

describe('DailyRingComponent', () => {
  let fixture: ComponentFixture<DailyRingComponent>;
  const circumference = 2 * Math.PI * 40;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [DailyRingComponent] });
    fixture = TestBed.createComponent(DailyRingComponent);
  });

  function render(completed: number, total = 3): SVGCircleElement {
    fixture.componentRef.setInput('completed', completed);
    fixture.componentRef.setInput('total', total);
    fixture.detectChanges();
    return fixture.nativeElement.querySelector('.ring-progress');
  }

  for (const [completed, fraction] of [[0, 0], [1, 1 / 3], [2, 2 / 3], [3, 1], [4, 1], [5, 1]]) {
    it(`renders ${completed}/3 at ${fraction * 100}% on a fresh component`, () => {
      const circle = render(completed);
      expect(Number(circle.getAttribute('stroke-dashoffset'))).toBeCloseTo(circumference * (1 - fraction), 6);
      expect(getComputedStyle(circle).visibility).toBe(completed > 0 ? 'visible' : 'hidden');
      expect(fixture.nativeElement.querySelector('.ring-number').textContent).toBe(`${completed}/3`);
    });
  }

  it('updates on the same instance through 0/3–4/3 and back to zero', () => {
    for (const [completed, fraction] of [[0, 0], [1, 1 / 3], [2, 2 / 3], [3, 1], [4, 1], [0, 0]]) {
      const circle = render(completed);
      expect(Number(circle.getAttribute('stroke-dashoffset'))).toBeCloseTo(circumference * (1 - fraction), 6);
      expect(getComputedStyle(circle).visibility).toBe(completed > 0 ? 'visible' : 'hidden');
    }
  });

  it('updates when only the target changes', () => {
    render(3);
    const circle = render(3, 6);
    expect(Number(circle.getAttribute('stroke-dashoffset'))).toBeCloseTo(circumference / 2, 6);
    expect(fixture.nativeElement.querySelector('.ring-number').textContent).toBe('3/6');
  });

  for (const [completed, total] of [[-1, 3], [1, 0], [1, -3], [NaN, 3], [Infinity, 3], [1, NaN], [1, Infinity]]) {
    it(`keeps the progress hidden and geometry finite for ${completed}/${total}`, () => {
      const circle = render(completed, total);
      expect(Number(circle.getAttribute('stroke-dashoffset'))).toBeCloseTo(circumference, 6);
      expect(getComputedStyle(circle).visibility).toBe('hidden');
    });
  }
});
