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

const STEP_LABELS = ["기본 정보", "매장 자랑거리", "디자인 스타일"];

const REQUIRED_FIELDS_BY_STEP = {
  1: ["store_name", "region_industry", "email"],
  2: ["main_product_copy", "strengths"],
  3: ["color_theme", "mood"],
};

const INITIAL_FORM = {
  store_name: "",
  region_industry: "",
  email: "",
  main_product_copy: "",
  strengths: "",
  color_theme: "",
  mood: "",
};

const DRAFT_STORAGE_KEY = "handa_input_draft";
const PENDING_INPUT_KEY = "handa_pending_input";

export default function InputPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(INITIAL_FORM);
  const [photos, setPhotos] = useState([]); // [{ name, url }]
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [photoError, setPhotoError] = useState("");
  const [errors, setErrors] = useState({});

  // 필수 입력값 누락 흐름: 새로고침 후에도 입력값·단계 유지 (TEST_CHECKLIST.md)
  useEffect(() => {
    const saved = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setForm((prev) => ({ ...prev, ...parsed.form }));
        setPhotos(parsed.photos || []);
        setStep(parsed.step || 1);
      } catch {
        // 손상된 임시 저장값은 무시한다
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify({ form, photos, step }));
  }, [form, photos, step]);

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  // 선택 즉시 Supabase Storage로 업로드해서 실제 URL을 받아온다 (API_CONTRACT.md API 5).
  async function handlePhotoChange(e) {
    const files = Array.from(e.target.files || []).slice(0, 3);
    e.target.value = "";
    if (files.length === 0) return;

    setPhotoError("");
    setUploadingPhotos(true);
    try {
      const formData = new FormData();
      files.forEach((file) => formData.append("photos", file));

      const res = await fetch("/api/upload-photos", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "사진 업로드에 실패했습니다.");
      }
      setPhotos(files.map((file, i) => ({ name: file.name, url: data.urls[i] })));
    } catch (err) {
      setPhotoError(err.message);
    } finally {
      setUploadingPhotos(false);
    }
  }

  function validateStep(targetStep) {
    const next = {};
    for (const field of REQUIRED_FIELDS_BY_STEP[targetStep]) {
      if (!form[field] || !String(form[field]).trim()) {
        next[field] = "필수 입력 항목입니다.";
      }
    }
    if (targetStep === 1 && form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      next.email = "올바른 이메일 형식이 아닙니다.";
    }
    return next;
  }

  function goNext() {
    const validationErrors = validateStep(step);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;
    setStep((s) => Math.min(s + 1, 3));
  }

  function goBack() {
    setErrors({});
    setStep((s) => Math.max(s - 1, 1));
  }

  function handleSubmit(e) {
    e.preventDefault();
    const validationErrors = validateStep(3);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    const payload = { ...form, image_urls: photos.map((p) => p.url) };
    localStorage.setItem(PENDING_INPUT_KEY, JSON.stringify(payload));
    localStorage.removeItem(DRAFT_STORAGE_KEY);
    router.push("/loading");
  }

  return (
    <section className="page input-page">
      <div className="step-progress">
        <div className="step-progress-label">
          <span>정보 입력 {step}/3</span>
          <span>{STEP_LABELS[step - 1]}</span>
        </div>
        <div className="step-progress-track">
          <div className="step-progress-fill" style={{ width: `${(step / 3) * 100}%` }} />
        </div>
      </div>

      <h1>매장에 대해 알려주세요</h1>
      <p className="dummy-note" style={{ marginBottom: 24 }}>
        기본적인 정보를 입력하면 고객이 사장님의 가게를 쉽게 찾는 데 도움이 됩니다.
      </p>

      <form onSubmit={handleSubmit} noValidate>
        {step === 1 && (
          <>
            <label>
              업체명 <span className="required-mark">*</span>
              <input
                value={form.store_name}
                onChange={(e) => update("store_name", e.target.value)}
                placeholder="예: 모던바이츠"
              />
              {errors.store_name && <span className="field-error">{errors.store_name}</span>}
            </label>

            <label>
              지역/업종 <span className="required-mark">*</span>
              <input
                value={form.region_industry}
                onChange={(e) => update("region_industry", e.target.value)}
                placeholder="예: 서울 / 카페"
              />
              {errors.region_industry && <span className="field-error">{errors.region_industry}</span>}
            </label>

            <label>
              이메일 주소 (시안 수신용) <span className="required-mark">*</span>
              <input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} />
              {errors.email && <span className="field-error">{errors.email}</span>}
            </label>

            <button type="button" className="cta submit-fixed" onClick={goNext}>
              다음
            </button>
          </>
        )}

        {step === 2 && (
          <>
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

            <label>매장 사진 업로드 (1~3장, 선택)</label>
            <label className="photo-upload-box">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handlePhotoChange}
                disabled={uploadingPhotos}
              />
              <span className="photo-upload-icon">
                <Icon name="add_a_photo" />
              </span>
              <span>{uploadingPhotos ? "업로드 중..." : "사진을 추가하려면 탭하세요"}</span>
            </label>
            {photoError && <span className="field-error">{photoError}</span>}
            {photos.length > 0 && (
              <ul className="photo-preview">
                {photos.map((p) => (
                  <li key={p.url}>
                    <img src={p.url} alt={p.name} className="photo-thumb" />
                    {p.name}
                  </li>
                ))}
              </ul>
            )}

            <div className="step-nav-row">
              <button type="button" className="btn-secondary" onClick={goBack}>
                이전
              </button>
              <button type="button" className="cta submit-fixed" onClick={goNext}>
                다음
              </button>
            </div>
          </>
        )}

        {step === 3 && (
          <>
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

            <div className="step-nav-row">
              <button type="button" className="btn-secondary" onClick={goBack}>
                이전
              </button>
              <button type="submit" className="cta submit-fixed">
                AI 시안 만들기
              </button>
            </div>
          </>
        )}
      </form>
    </section>
  );
}
