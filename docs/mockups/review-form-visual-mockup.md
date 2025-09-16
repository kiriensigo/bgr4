# レビューフォーム - ビジュアルモックアップ

## 🎨 デザインスペック

### カラーパレット
```css
:root {
  /* Primary Colors */
  --primary-50: #eff6ff;
  --primary-500: #3b82f6;
  --primary-600: #2563eb;
  --primary-700: #1d4ed8;

  /* Success Colors */
  --success-50: #f0fdf4;
  --success-500: #22c55e;
  --success-600: #16a34a;

  /* Warning Colors */
  --warning-50: #fffbeb;
  --warning-500: #f59e0b;
  --warning-600: #d97706;

  /* Neutral Colors */
  --gray-50: #f8fafc;
  --gray-100: #f1f5f9;
  --gray-200: #e2e8f0;
  --gray-300: #cbd5e1;
  --gray-400: #94a3b8;
  --gray-500: #64748b;
  --gray-600: #475569;
  --gray-700: #334155;
  --gray-800: #1e293b;
  --gray-900: #0f172a;
}
```

### タイポグラフィ
```css
.text-h1 { font-size: 2rem; font-weight: 700; line-height: 1.2; }
.text-h2 { font-size: 1.5rem; font-weight: 600; line-height: 1.3; }
.text-body { font-size: 1rem; font-weight: 400; line-height: 1.5; }
.text-caption { font-size: 0.875rem; font-weight: 500; line-height: 1.4; }
.text-small { font-size: 0.75rem; font-weight: 400; line-height: 1.5; }
```

## 📱 モバイル版ビジュアルデザイン

```css
/* Mobile Layout (320px - 767px) */
.review-form-mobile {
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  min-height: 100vh;
}

/* Header */
.header {
  background: white;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  padding: 16px;
  border-bottom: 1px solid #e2e8f0;
}

/* Game Info Card */
.game-info {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin: 16px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.05);
  border: 1px solid #e2e8f0;
}

/* Rating Sliders Section */
.rating-section {
  background: white;
  border-radius: 12px;
  padding: 24px 20px;
  margin: 16px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.05);
}

.slider-container {
  margin-bottom: 32px;
}

.slider-label {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
  font-weight: 600;
  color: #334155;
}

.slider-track {
  height: 8px;
  background: #e2e8f0;
  border-radius: 4px;
  position: relative;
}

.slider-thumb {
  width: 24px;
  height: 24px;
  background: #3b82f6;
  border-radius: 50%;
  border: 3px solid white;
  box-shadow: 0 2px 6px rgba(59, 130, 246, 0.3);
  cursor: pointer;
  transition: all 0.2s ease;
}

.slider-thumb:hover {
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
}

/* Button Groups */
.button-group {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin: 16px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.05);
}

.button-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-top: 16px;
}

.choice-button {
  padding: 12px 16px;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  background: white;
  color: #64748b;
  font-weight: 500;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.choice-button:hover {
  border-color: #3b82f6;
  color: #3b82f6;
  background: #eff6ff;
}

.choice-button.selected {
  border-color: #3b82f6;
  background: #3b82f6;
  color: white;
  box-shadow: 0 2px 4px rgba(59, 130, 246, 0.3);
}

/* Comment Section */
.comment-section {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin: 16px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.05);
}

.comment-textarea {
  width: 100%;
  min-height: 120px;
  padding: 16px;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-size: 16px;
  line-height: 1.5;
  resize: vertical;
  transition: border-color 0.2s ease;
}

.comment-textarea:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.character-count {
  text-align: right;
  margin-top: 8px;
  font-size: 14px;
  color: #64748b;
}

/* Submit Button */
.submit-section {
  padding: 20px 16px 32px;
}

.submit-button {
  width: 100%;
  padding: 16px;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 18px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.submit-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
}

.submit-button:disabled {
  background: #94a3b8;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}
```

## 💻 デスクトップ版ビジュアルデザイン

```css
/* Desktop Layout (1024px+) */
.review-form-desktop {
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  min-height: 100vh;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 32px;
}

.review-grid {
  display: grid;
  grid-template-columns: 300px 1fr 320px;
  gap: 32px;
  margin-top: 32px;
}

/* Game Info Sidebar */
.game-sidebar {
  background: white;
  border-radius: 16px;
  padding: 24px;
  height: fit-content;
  position: sticky;
  top: 32px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.06);
}

.game-image {
  width: 100%;
  aspect-ratio: 1;
  border-radius: 12px;
  object-fit: cover;
  margin-bottom: 20px;
}

/* Main Content */
.review-content {
  background: white;
  border-radius: 16px;
  padding: 32px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.06);
}

.rating-grid {
  display: grid;
  gap: 24px;
  margin-bottom: 32px;
}

.slider-desktop {
  display: flex;
  align-items: center;
  gap: 20px;
}

.slider-label-desktop {
  min-width: 140px;
  font-weight: 600;
  color: #334155;
}

.slider-container-desktop {
  flex: 1;
  position: relative;
}

.slider-value {
  min-width: 60px;
  text-align: center;
  font-weight: 700;
  color: #3b82f6;
  font-size: 18px;
}

/* Selection Sidebar */
.selection-sidebar {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.selection-card {
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.06);
}

.tag-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 16px;
}

.tag-button {
  padding: 8px 16px;
  border: 2px solid #e2e8f0;
  border-radius: 20px;
  background: white;
  color: #64748b;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.tag-button:hover {
  border-color: #3b82f6;
  color: #3b82f6;
  background: #eff6ff;
}

.tag-button.selected {
  border-color: #3b82f6;
  background: #3b82f6;
  color: white;
}
```

## 🎯 インタラクションアニメーション

```css
/* Smooth Transitions */
* {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Hover Effects */
.interactive:hover {
  transform: translateY(-1px);
}

/* Focus States */
.focusable:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

/* Loading Animation */
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.loading {
  animation: pulse 2s infinite;
}

/* Success Animation */
@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.slide-up {
  animation: slideUp 0.3s ease-out;
}

/* Bounce Animation for Submit */
@keyframes bounce {
  0%, 20%, 50%, 80%, 100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-4px);
  }
  60% {
    transform: translateY(-2px);
  }
}

.submit-button:active {
  animation: bounce 0.3s;
}
```

## 🌙 ダークモード対応

```css
@media (prefers-color-scheme: dark) {
  :root {
    --bg-primary: #0f172a;
    --bg-secondary: #1e293b;
    --text-primary: #f8fafc;
    --text-secondary: #cbd5e1;
    --border-color: #334155;
  }

  .review-form-mobile,
  .review-form-desktop {
    background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  }

  .game-info,
  .rating-section,
  .button-group,
  .comment-section {
    background: var(--bg-secondary);
    border-color: var(--border-color);
    color: var(--text-primary);
  }

  .choice-button {
    background: var(--bg-secondary);
    border-color: var(--border-color);
    color: var(--text-secondary);
  }

  .choice-button:hover {
    background: rgba(59, 130, 246, 0.1);
  }
}
```

## 📏 コンポーネント仕様

### RatingSlider Component
```typescript
interface RatingSliderProps {
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (value: number) => void;
  icon?: React.ReactNode;
  color?: 'primary' | 'success' | 'warning';
}
```

### ButtonGroup Component
```typescript
interface ButtonGroupProps {
  title: string;
  options: Array<{
    id: string;
    label: string;
    icon?: React.ReactNode;
  }>;
  selected: string[];
  onChange: (selected: string[]) => void;
  multiple?: boolean;
  columns?: number;
}
```

### CommentInput Component
```typescript
interface CommentInputProps {
  value: string;
  onChange: (value: string) => void;
  maxLength: number;
  placeholder: string;
  rows?: number;
}
```

---

**作成日**: 2025-08-22  
**関連ドキュメント**: review-form-wireframes.md, 004_review_system_mockup.md