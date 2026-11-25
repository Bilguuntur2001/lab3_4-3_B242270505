/**
 * Лаб 3 — SLO-г k6 threshold болгосон тест (README-ийн SLO хүснэгттэй ИЖИЛ тоонууд)
 *
 * Ажиллуулах (эхлээд: node server.js):
 *   k6 run slo-test.js 2>&1 | tee results/pass.txt                    # 20 VU, 1 мин
 *   k6 run -e DURATION=2m slo-test.js 2>&1 | tee results/chaos.txt    # chaos: 2 мин
 */
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 20,
  duration: __ENV.DURATION || '1m',
  thresholds: {
    // Performance SLO: /cart/add — localhost-д p95 ~1-5ms → регресс барих 20ms, p99 < 50ms
    'http_req_duration{name:cart}': ['p(95)<20', 'p(99)<50'],
    // Reliability SLO: /pay — 5% алдаа суулгасан, 8% нь санамсаргүй хэлбэлзлийн нөөцтэй
    'http_req_failed{name:pay}': ['rate<0.08'],
    // Availability SLO: бүх хүсэлтийн амжилтын хувь ≥ 90%
    'checks': ['rate>0.90'],
    // Нэмэлт (4 дэх) сценарио: /report — дээд хүлээлт 400ms + 50ms нөөц
    'http_req_duration{name:report}': ['p(95)<450'],
  },
};

export default function () {
  const base = 'http://localhost:3000';
  // name tag-аар endpoint бүрийн хэмжүүрийг тусад нь ялгана
  const c = http.post(`${base}/cart/add`, null, { tags: { name: 'cart' } });
  const r = http.get(`${base}/report`, { tags: { name: 'report' } });
  const p = http.post(`${base}/pay`, null, { tags: { name: 'pay' } });
  check(c, { 'cart 200': (x) => x.status === 200 });
  check(r, { 'report 200': (x) => x.status === 200 });
  check(p, { 'pay 200': (x) => x.status === 200 });
  sleep(1);
}
