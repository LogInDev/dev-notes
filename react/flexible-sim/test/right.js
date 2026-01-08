/* 공통 베이스: 처음엔 절대 안 보이게 */
.termcopylayer {
  position: fixed;
  bottom: 100px;
  right: -34%;
  width: calc(100% - 50px);
  text-align: center;
  z-index: 9999;
  opacity: 0;
  visibility: hidden;
  /* opacity만 트랜지션: 레이아웃 흔들림 방지 */
  transition: opacity .25s ease, visibility 0s linear .25s;
}

/* 보여줄 때만 활성화 */
.termcopylayer--show {
  opacity: 1;
  visibility: visible;
  transition: opacity .25s ease;
}

/* 필요한 경우 타입별 후킹을 위해 클래스만 분리 */
.termcopylayer3 {}
.termcopylayer4 {}
.termcopymsg { /* 내부 텍스트 스타일 */ }

{this.props.isAiPopup ? (
  <div className="termcopylayer termcopylayer4" ref="termcopylayer4">
    <span className="termcopymsg">{this.language.copied}</span>
  </div>
) : (
  <div className="termcopylayer termcopylayer3" ref="termcopylayer3">
    <span className="termcopymsg">{this.language.copied}</span>
  </div>
)}


onMouseDownTerm(e) {
  // 우클릭 판정
  const rightclick = (e.which ? e.which === 3 : e.button === 2);
  if (!rightclick) return;

  e.preventDefault();
  e.stopPropagation();

  const copytext = (this.props.message.content || '').trim();

  // 복사 (팝업이면 popupDocument 사용)
  const doc = this.props.popupDocument || document;

  if (this.is_ie() && window.clipboardData) {
    window.clipboardData.setData('Text', copytext);
  } else {
    const textarea = doc.createElement('textarea');
    textarea.value = copytext;
    // 화면에 보이지 않게
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    doc.body.appendChild(textarea);
    textarea.select();

    try {
      doc.execCommand('copy');
    } catch (_) {
      // execCommand 미지원 환경 대비(필요 시 대안)
    }
    doc.body.removeChild(textarea);
  }

  // 토스트 표시 (팝업/본창 분기)
  const toastEl = this.props.popupDocument
    ? this.refs.termcopylayer4
    : this.refs.termcopylayer3;

  if (!toastEl) return;

  // 먼저 show 제거 후 다음 프레임에 추가(초기 진입 플래시 방지)
  toastEl.classList.remove('termcopylayer--show');
  // 강제 리플로우 or 다음 프레임
  (this.props.popupDocument ? this.props.popupDocument : window).requestAnimationFrame(() => {
    toastEl.classList.add('termcopylayer--show');
    // 1초 후 숨김(원복)
    setTimeout(() => {
      toastEl.classList.remove('termcopylayer--show');
    }, 1000);
  });
}
