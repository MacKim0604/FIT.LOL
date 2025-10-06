# 스케줄러 운영 가이드 (v1.0.3)

## 반복 작업 (CRON)
- `CRON_LATEST_EVERY`: 활성 멤버 최신 N경기 수집 (기본: 매시간)
- `CRON_RANK_DAILY`: 랭크/리그 정보 갱신 (기본: 매일 03:00)
- `CRON_WEEKLY_REPORT`: 주간 리포트 생성 (기본: 월요일 04:00)

## 활성 멤버 선정
- 기본: `users.isActive = true`
- 선택: 최근 로그인/최근 경기 존재자만

## 동시성/락
- PUUID 단위 락(동일 유저 중복 실행 방지)
- 글로벌 동시성은 `BULLMQ_CONCURRENCY`로 제한

## 실패/재시도
- 429/503: 지수 백오프 재시도
- 연속 실패 임계치 도달 시 알림(Slack/Sentry)

## 유지보수
- 오래된 완료 Job 삭제(`removeOnComplete`)
- 실패 Job 보관 개수 제한(`removeOnFail`)
- 큐/워커 업그레이드 시 drain 후 배포 롤링

## 운영 체크리스트
- 큐 길이/처리율/실패율 모니터링
- 레이트리밋 여유 확인(피크 시간대)
- DB write 부하/락 지표 확인
