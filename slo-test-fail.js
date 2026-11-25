/**
 * Лаб 3 — Алхам 6: Threshold-ыг ЗОРИУД эвдсэн хувилбар
 *
 * slo-test.js-тэй ижил, ганц ялгаа: /report-ын threshold p(95)<100.
 * Сервер /report-д 200-400ms хүлээдэг тул энэ нь ямар ч машин дээр FAIL болно.
 *
 *   k6 run slo-test-fail.js 2>&1 | tee results/fail.txt; echo "exit=$?"
 *   → k6 exit code 99 (threshold зөрчигдсөн) — CI энэ кодоор build-ийг зогсооно.
 */
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 20,
  duration: '1m',
  thresholds: {
    'http_req_duration{name:cart}': ['p(95)<20', 'p(99)<50'],
    'http_req_failed{name:pay}': ['rate<0.08'],
    'checks': ['rate>0.90'],
    // ЗОРИУД эвдсэн: /report 200ms-ээс хурдан хэзээ ч хариулдаггүй → FAIL
    'http_req_duration{name:report}': ['p(95)<100'],
  },
};

export default function () {
  const base = 'http://localhost:3000';
  const c = http.post(`${base}/cart/add`, null, { tags: { name: 'cart' } });
  const r = http.get(`${base}/report`, { tags: { name: 'report' } });
  const p = http.post(`${base}/pay`, null, { tags: { name: 'pay' } });
  check(c, { 'cart 200': (x) => x.status === 200 });
  check(r, { 'report 200': (x) => x.status === 200 });
  check(p, { 'pay 200': (x) => x.status === 200 });
  sleep(1);
}
