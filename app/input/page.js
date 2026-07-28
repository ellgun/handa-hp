"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Icon from "../Icon";

const COLOR_OPTIONS = [
  { value: "빨강", label: "빨강(Red) — 강렬하고 활기찬 모던 분위기" },
  { value: "검정", label: "검정(Black) — 고급스럽고 세련된 다이닝" },
  { value: "노랑", label: "노랑(Yellow) — 밝고 긍정적인 패스트 점심" },
  { value: "보라", label: "보라(Purple) — 신비롭고 우아한 노을 표현" },
  { value: "주황", label: "주황(Orange) — 따뜻하고 친근한 이미지" },
  { value: "초록", label: "초록(Green) — 자연 친화적이고 편안한 이미지" },
  { value: "파랑", label: "파랑(Blue) — 신뢰감 있고 전문적인 인상 표현" },
  { value: "하양", label: "하양(White) — 깔끔하고 미니멀한 순수함 표현" },
];

const MOOD_OPTIONS = [
  "전문적이고 신뢰할 수 있는 느낌",
  "따뜻하고 친근한 느낌",
  "고급스럽고 프리미엄적인 느낌",
  "편안하고 여유로운 느낌",
  "건강하고 깨끗한 느낌",
];

const REQUIRED_FIELDS = [
  "region_industry",
  "contact",
  "main_product_copy",
  "strengths",
  "color_theme",
  "mood",
  "extra_requests",
  "email",
];

const INITIAL_FORM = {
  region_industry: "",
  contact: "",
  sns_url: "",
  business_number: "",
  main_product_copy: "",
  strengths: "",
  benchmark_url: "",
  color_theme: "",
  mood: "",
  extra_requests: "",
  email: "",
};

const DRAFT_STORAGE_KEY = "handa_input_draft";
const PENDING_INPUT_KEY = "handa_pending_input";

export default function InputPage() {
  const router = useRouter();
  const [form, setForm] = useState(INITIAL_FORM);
  const [photos, setPhotos] = useState([]);
  const [errors, setErrors] = useState({});

  // 필수 입력값 누락 흐름: 새로고침 후에도 입력값 유지 (TEST_CHECKLIST.md)
  useEffect(() => {
    const saved = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setForm((prev) => ({ ...prev, ...parsed.form }));
        setPhotos(parsed.photos || []);
      } catch {
        // 손상된 임시 저장값은 무시한다
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify({ form, photos }));
  }, [form, photos]);

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handlePhotoChange(e) {
    const files = Array.from(e.target.files || []).slice(0, 3);
    setPhotos(files.map((f) => f.name));
  }

  function validate() {
    const next = {};
    for (const field of REQUIRED_FIELDS) {
      if (!form[field] || !String(form[field]).trim()) {
        next[field] = "필수 입력 항목입니다.";
      }
    }
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      next.email = "올바른 이메일 형식이 아닙니다.";
    }
    return next;
  }

  function handleSubmit(e) {
    e.preventDefault();
    const validationErrors = validate();
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    const payload = { ...form, image_names: photos };
    localStorage.setItem(PENDING_INPUT_KEY, JSON.stringify(payload));
    localStorage.removeItem(DRAFT_STORAGE_KEY);
    router.push("/loading");
  }

  return (
    <section className="page input-page">
      <div className="step-progress">
        <div className="step-progress-label">
          <span>1단계 / 3단계</span>
          <span>매장 프로필</span>
        </div>
        <div className="step-progress-track">
          <div className="step-progress-fill" style={{ width: "33%" }} />
        </div>
      </div>

      <h1>매장에 대해 알려주세요</h1>
      <p className="dummy-note" style={{ marginBottom: 24 }}>
        기본적인 정보를 입력하면 고객이 사장님의 가게를 쉽게 찾는 데 도움이 됩니다.
      </p>

      <form onSubmit={handleSubmit} noValidate>
        <label>
          지역/업종/분야(세분화) <span className="required-mark">*</span>
          <input
            value={form.region_industry}
            onChange={(e) => update("region_industry", e.target.value)}
            placeholder="예: 서울 / 카페 / 디저트카페"
          />
          {errors.region_industry && <span className="field-error">{errors.region_industry}</span>}
        </label>

        <label>
          연락처 <span className="required-mark">*</span>
          <input
            value={form.contact}
            onChange={(e) => update("contact", e.target.value)}
            placeholder="예: 010-1234-5678"
          />
          {errors.contact && <span className="field-error">{errors.contact}</span>}
        </label>

        <label>
          SNS 주소 (선택)
          <input value={form.sns_url} onChange={(e) => update("sns_url", e.target.value)} />
        </label>

        <label>
          사업자등록번호 (선택)
          <input
            value={form.business_number}
            onChange={(e) => update("business_number", e.target.value)}
            maxLength={100}
          />
        </label>

        <label>
          강조 제품 및 메인 문구 <span className="required-mark">*</span>
          <textarea
            value={form.main_product_copy}
            onChange={(e) => update("main_product_copy", e.target.value)}
            maxLength={200}
          />
          {errors.main_product_copy && <span className="field-error">{errors.main_product_copy}</span>}
        </label>

        <label>
          회사/매장 장점 <span className="required-mark">*</span>
          <textarea value={form.strengths} onChange={(e) => update("strengths", e.target.value)} />
          {errors.strengths && <span className="field-error">{errors.strengths}</span>}
        </label>

        <label>
          벤치마킹 사이트 (선택)
          <input value={form.benchmark_url} onChange={(e) => update("benchmark_url", e.target.value)} />
        </label>

        <fieldset>
          <legend>색상 조합 <span className="required-mark">*</span></legend>
          {COLOR_OPTIONS.map((opt) => (
            <label key={opt.value} className="radio-option">
              <input
                type="radio"
                name="color_theme"
                value={opt.value}
                checked={form.color_theme === opt.value}
                onChange={(e) => update("color_theme", e.target.value)}
              />
              {opt.label}
            </label>
          ))}
          {errors.color_theme && <span className="field-error">{errors.color_theme}</span>}
        </fieldset>

        <fieldset>
          <legend>홈페이지 분위기 <span className="required-mark">*</span></legend>
          {MOOD_OPTIONS.map((opt) => (
            <label key={opt} className="radio-option">
              <input
                type="radio"
                name="mood"
                value={opt}
                checked={form.mood === opt}
                onChange={(e) => update("mood", e.target.value)}
              />
              {opt}
            </label>
          ))}
          {errors.mood && <span className="field-error">{errors.mood}</span>}
        </fieldset>

        <label>
          추가 요구사항 <span className="required-mark">*</span>
          <textarea value={form.extra_requests} onChange={(e) => update("extra_requests", e.target.value)} />
          {errors.extra_requests && <span className="field-error">{errors.extra_requests}</span>}
        </label>

        <label>
          이메일 주소 (시안 수신용) <span className="required-mark">*</span>
          <input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} />
          {errors.email && <span className="field-error">{errors.email}</span>}
        </label>

        <label>매장 사진 업로드 (1~3장, 선택)</label>
        <label className="photo-upload-box">
          <input type="file" accept="image/*" multiple onChange={handlePhotoChange} />
          <span className="photo-upload-icon">
            <Icon name="add_a_photo" />
          </span>
          <span>사진을 추가하려면 탭하세요</span>
        </label>
        {photos.length > 0 && (
          <ul className="photo-preview">
            {photos.map((name) => (
              <li key={name}>{name}</li>
            ))}
          </ul>
        )}

        <button type="submit" className="cta submit-fixed">
          AI 시안 만들기
        </button>
      </form>
    </section>
  );
}
