# -*- coding: utf-8 -*-
"""
견종 데이터셋 EDA
=================
대상:
  - ai/data/dogs.csv (DogTime 392견종 × 37평가)
  - ai/data/Dog Breads Around The World.csv (159견종 × 15컬럼)

목적: dog_breeds 시드 + 위험도 룰베이스 입력을 위한 데이터 파악 & 정제 체크리스트 도출
실행: python ai/notebooks/eda_breeds.py
출력: 콘솔 인사이트 + ai/notebooks/charts/*.png
"""
import os
import re
import pandas as pd
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib import font_manager

# 한글 폰트
FONT = "C:/Windows/Fonts/malgun.ttf"
font_manager.fontManager.addfont(FONT)
plt.rcParams["font.family"] = "Malgun Gothic"
plt.rcParams["axes.unicode_minus"] = False

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DATA = os.path.join(ROOT, "ai", "data")
CHARTS = os.path.join(ROOT, "ai", "notebooks", "charts")
os.makedirs(CHARTS, exist_ok=True)


def line(t=""):
    print(t)


def header(t):
    print("\n" + "=" * 60)
    print(t)
    print("=" * 60)


# ============================================================
# 로드
# ============================================================
dogs = pd.read_csv(os.path.join(DATA, "dogs.csv"))
world = pd.read_csv(os.path.join(DATA, "Dog Breads Around The World.csv"))

dogs = dogs.rename(columns={"Unnamed: 0": "Breed"})

header("1. 기본 구조")
line(f"dogs.csv  : {dogs.shape[0]}행 x {dogs.shape[1]}열")
line(f"world.csv : {world.shape[0]}행 x {world.shape[1]}열")

# ============================================================
# 2. 결측치 (전부 NULL인 컬럼 = 무의미)
# ============================================================
header("2. dogs.csv 결측치 점검")
null_cols = dogs.columns[dogs.isnull().all()].tolist()
line(f"전부 NULL인 컬럼 ({len(null_cols)}개, 무시 권장): {null_cols}")
partial = dogs.isnull().sum()
partial = partial[(partial > 0) & (partial < len(dogs))]
line(f"부분 결측 컬럼: {dict(partial)}")
line(f"world.csv 결측치 총합: {int(world.isnull().sum().sum())} (0이면 깨끗)")

# ============================================================
# 3. 핵심 컬럼: 더위/추위 내성 분포 (dogs.csv)
# ============================================================
header("3. 더위/추위 내성 분포 (dogs.csv) - 룰베이스 직결")
line("Tolerates Hot Weather (heat_tolerance 후보):")
line(dogs["Tolerates Hot Weather"].value_counts().sort_index().to_string())
line("\nTolerates Cold Weather (cold_tolerance 후보):")
line(dogs["Tolerates Cold Weather"].value_counts().sort_index().to_string())

fig, axes = plt.subplots(1, 2, figsize=(10, 4))
dogs["Tolerates Hot Weather"].value_counts().sort_index().plot(
    kind="bar", ax=axes[0], color="#ea580c")
axes[0].set_title("더위 내성 분포 (1=약 ~ 5=강)")
axes[0].set_xlabel("Tolerates Hot Weather")
dogs["Tolerates Cold Weather"].value_counts().sort_index().plot(
    kind="bar", ax=axes[1], color="#2563eb")
axes[1].set_title("추위 내성 분포 (1=약 ~ 5=강)")
axes[1].set_xlabel("Tolerates Cold Weather")
plt.tight_layout()
plt.savefig(os.path.join(CHARTS, "tolerance_dist.png"), dpi=120)
plt.close()

# 더위에 약한 견종 (1~2) 일부
weak_heat = dogs[dogs["Tolerates Hot Weather"] <= 2]["Breed"].head(15).tolist()
line(f"\n더위 취약(≤2) 견종 예시: {weak_heat}")

# ============================================================
# 4. 크기/체중 분포 (world.csv)
# ============================================================
header("4. 크기/체중 분포 (world.csv)")
line("Size 분포 (※ 7종으로 지저분 → 정제 필요):")
line(world["Size"].value_counts().to_string())


def parse_weight(x):
    """'25', '4-6', '20 to 30' 등에서 숫자 추출 → 평균"""
    nums = [float(n) for n in re.findall(r"[\d.]+", str(x))]
    return sum(nums) / len(nums) if nums else None


world["weight_kg"] = world["Average Weight (kg)"].map(parse_weight)
n_bad = world["weight_kg"].isnull().sum()
line(f"\nAverage Weight (kg) → 숫자 변환 (파싱 실패 {n_bad}건):")
line(world["weight_kg"].describe().to_string())

fig, axes = plt.subplots(1, 2, figsize=(10, 4))
world["Size"].value_counts().plot(kind="bar", ax=axes[0], color="#059669")
axes[0].set_title("크기 분포 (world.csv) - 7종, 정제 필요")
world["weight_kg"].dropna().plot(kind="hist", bins=20, ax=axes[1], color="#7c3aed")
axes[1].set_title("평균 체중(kg) 분포")
axes[1].set_xlabel("kg")
plt.tight_layout()
plt.savefig(os.path.join(CHARTS, "size_weight_dist.png"), dpi=120)
plt.close()

# ============================================================
# 5. 두 CSV 견종명 교집합/차집합
# ============================================================
header("5. 두 데이터셋 견종명 매칭")


def norm(s):
    return re.sub(r"[^a-z]", "", str(s).lower())


dogs_set = set(dogs["Breed"].map(norm))
world_set = set(world["Name"].map(norm))
inter = dogs_set & world_set
line(f"dogs 고유: {len(dogs_set)}종")
line(f"world 고유: {len(world_set)}종")
line(f"교집합(이름 일치): {len(inter)}종")
line(f"world에만: {len(world_set - dogs_set)}종")
line(f"dogs에만: {len(dogs_set - world_set)}종")

# ============================================================
# 6. 단두종(brachycephalic) 후보 자동 추출
# ============================================================
header("6. 단두종 후보 자동 추출 (is_brachycephalic)")
BRACHY_KEYWORDS = [
    "bulldog", "pug", "shihtzu", "shih tzu", "pekingese", "boston",
    "boxer", "frenchbulldog", "mastiff", "cavalier", "lhasa", "chow",
    "brussels", "griffon", "affenpinscher", "japanesechin", "bordeaux",
    "pekinese", "bullmastiff", "cavachon",
]


def is_brachy(name):
    n = norm(name)
    return any(k.replace(" ", "") in n for k in BRACHY_KEYWORDS)


world_brachy = world[world["Name"].map(is_brachy)]["Name"].tolist()
dogs_brachy = dogs[dogs["Breed"].map(is_brachy)]["Breed"].tolist()
line(f"world.csv 단두종 후보 ({len(world_brachy)}): {world_brachy}")
line(f"dogs.csv  단두종 후보 ({len(dogs_brachy)}): {dogs_brachy[:20]}")
line("⚠️ 키워드 기반 1차 추출 → 수동 검수 필요")

# ============================================================
# 7. 정제 체크리스트
# ============================================================
header("7. 정제 체크리스트 (가공 단계용)")
checklist = [
    "견종명 한글 매핑 (둘 다 영문만)",
    "is_brachycephalic 수동 검수 (위 후보 + 누락분)",
    f"dogs.csv 전부-NULL 컬럼 {len(null_cols)}개 제거",
    "dogs.csv Weight 텍스트('50 to 75 pounds') → 숫자 + kg 변환",
    "dogs.csv Size(1~5) → 소형/중형/대형 매핑",
    "world.csv Size(Small/Medium/Large) → 소형/중형/대형 매핑",
    "coat_type(장모/단모) 직접 컬럼 없음 → Shedding/Grooming 기반 추정 or 수동",
    "두 CSV 병합 기준 결정 (heat/cold 내성은 dogs.csv에만 있음)",
]
for i, c in enumerate(checklist, 1):
    line(f"  [{i}] {c}")

header("완료")
line(f"차트 저장: {CHARTS}")
line("  - tolerance_dist.png (더위/추위 내성)")
line("  - size_weight_dist.png (크기/체중)")
