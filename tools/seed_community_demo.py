# -*- coding: utf-8 -*-
"""커뮤니티 FE 실연동 검증용 데모 데이터 시드.

signup→login→게시글 3건 생성 (한글은 셸 인코딩 함정 회피를 위해 Python 직접 전송).
BE 재시작(ddl-auto=create) 후 재실행하면 됨.
"""
import json
import urllib.request

BASE = "http://localhost:8081"


def call(method, path, body=None, token=None):
    req = urllib.request.Request(BASE + path, method=method)
    req.add_header("Content-Type", "application/json")
    if token:
        req.add_header("Authorization", "Bearer " + token)
    data = json.dumps(body, ensure_ascii=False).encode("utf-8") if body else None
    try:
        with urllib.request.urlopen(req, data=data) as res:
            return res.status, json.loads(res.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode("utf-8") or "{}")


def main():
    email, pw, nick = "demo@daengion.com", "Demo1234!", "데모견주"
    status, res = call("POST", "/api/auth/signup",
                       {"email": email, "password": pw, "nickname": nick})
    print("signup:", status, res.get("message"))

    status, res = call("POST", "/api/auth/login", {"email": email, "password": pw})
    assert status == 200, res
    token = res["data"]  # 로그인 응답 data = AT 문자열 그 자체
    print("login: 200, token ok")

    posts = [
        {"categoryId": 1, "subTag": "사료", "title": "6개월 푸들 사료 추천 부탁드려요",
         "content": "입이 짧은 편인데 기호성 좋은 사료 있을까요? 알러지는 없습니다."},
        {"categoryId": 3, "subTag": None, "title": "부산 시민공원 산책 코스 후기",
         "content": "그늘 많고 잔디 구역이 넓어서 여름 저녁 산책으로 좋아요. 주차는 남문 쪽 추천."},
        {"categoryId": 4, "subTag": None, "title": "우리집 댕댕이 첫 미용 기념",
         "content": "곰돌이컷 했는데 너무 귀여워서 자랑합니다 🐶"},
    ]
    for p in posts:
        status, res = call("POST", "/api/posts", p, token)
        print("create:", status, res.get("data"))

    status, res = call("GET", "/api/posts?page=0")
    items = res["data"]["content"]
    print(f"list: {status}, {len(items)} posts")
    for it in items:
        print("  -", it["postId"], it["category"], it["title"], "by", it["author"])


if __name__ == "__main__":
    main()
