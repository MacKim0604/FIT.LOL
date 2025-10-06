아래 단계대로 진행하시면 Docker로 Redis를 깔끔하게 설치·운영하실 수 있습니다. (예시는 Linux 서버 기준)

# 1) 가장 빠른 단일 인스턴스 실행

```bash
# 이미지 받기 (가벼운 Alpine 권장)
docker pull redis:7-alpine

# 실행: AOF 영속화 + 비밀번호 설정
docker run -d \
  --name redis \
  -p 6379:6379 \
  -v redis-data:/data \
  redis:7-alpine \
  redis-server --appendonly yes --requirepass "강한비밀번호"
```

확인:

```bash
docker exec -it redis redis-cli -a "강한비밀번호" PING
# -> PONG
```

# 2) 설정파일(redis.conf)로 운영하고 싶을 때

1. 현재 디렉터리에 `redis.conf` 생성(필요 옵션 예시):

```conf
# redis.conf
protected-mode yes
port 6379
# 영속화: RDB + AOF 혼합(권장)
save 900 1
save 300 10
save 60 10000
appendonly yes
appendfsync everysec
# 보안
requirepass 강한비밀번호
```

2. 컨테이너 실행:

```bash
docker run -d \
  --name redis \
  -p 6379:6379 \
  -v $(pwd)/redis.conf:/etc/redis/redis.conf:ro \
  -v redis-data:/data \
  redis:7-alpine \
  redis-server /etc/redis/redis.conf
```

# 3) docker-compose로 관리(권장)

`docker-compose.yml`:

```yaml
services:
  redis:
    image: redis:7-alpine
    container_name: redis
    ports:
      - "6379:6379"
    command: >
      redis-server
      --appendonly yes
      --appendfsync everysec
      --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis-data:/data
    restart: unless-stopped

volumes:
  redis-data:
```

실행:

```bash
export REDIS_PASSWORD="강한비밀번호"
docker compose up -d
```

# 4) 기본 운영 명령

```bash
# 로그 보기
docker logs -f redis

# 접속(클라이언트)
docker exec -it redis redis-cli -a "강한비밀번호"

# 통계 확인
docker exec -it redis redis-cli -a "강한비밀번호" INFO
```

# 5) 백업 & 복구

* 볼륨 스냅샷:

```bash
# 볼륨을 임시 컨테이너로 tar 백업
docker run --rm -v redis-data:/data -v $(pwd):/backup alpine \
  sh -c 'cd /data && tar czf /backup/redis-data-backup.tgz .'
```

* 복구는 반대로 tar를 `/data`에 풀어주시면 됩니다.

# 6) 보안 체크리스트

* **반드시 비밀번호 설정(requirepass)** 하십시오.
* 외부 노출이 필요 없으면 `-p 6379:6379`를 제거하고 내부 네트워크만 사용하십시오.
* 필요 시 방화벽(ufw/iptables)로 6379 포트 제한을 권장드립니다.

# 7) 성능 팁

* 영속화 지연을 최소화하려면 `appendfsync everysec` 권장(기본값).
  데이터 유실 위험을 더 줄이려면 `always`, 성능을 더 높이려면 `no`도 가능하나 트레이드오프가 있습니다.
* 컨테이너에 메모리 제한을 과도하게 걸지 마시고, `maxmemory`(redis.conf)와 `maxmemory-policy`를 용도에 맞게 설정하십시오(예: 캐시 서비스는 `allkeys-lru`).

# 8) GUI로 모니터링(선택)

```bash
docker run -d --name redisinsight -p 8001:8001 \
  --restart unless-stopped redislabs/redisinsight:latest
```

브라우저에서 `http://서버IP:8001` 접속 → Redis 호스트/비번 등록.

---

필요하시면 Sentinel(고가용성)이나 Cluster(샤딩) 구성용 `docker-compose` 템플릿도 바로 드리겠습니다. 어떤 형태(HA/샤딩/단일)로 운영 예정이신지 알려주시면, 용도에 맞춰 최적 설정으로 드리겠습니다.
