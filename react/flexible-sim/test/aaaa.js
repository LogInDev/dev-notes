import React from "react";

// URL이 http/https로 시작하는지 확인
const isValidHttpUrl = (url) => {
  if (!url) return false;
  return /^https?:\/\//i.test(url);
};

// react-markdown v4 Custom Link Renderer
const LinkRenderer = (props) => {
  const { href, children } = props;

  // http/https 링크만 a 태그로 렌더링
  if (isValidHttpUrl(href)) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => {
          e.stopPropagation();
          console.log("링크 클릭됨:", href);
          // 네가 원하는 함수 호출 가능
          // this.props.handleLinkClick(href);
        }}
      >
        {children}
      </a>
    );
  }

  // http가 아니면 a 태그 생성하지 않음 → 텍스트로 표시
  return <span>{children}</span>;
};
<ReactMarkdown
  source={markdownText}
  plugins={[remarkGfm]}
  renderers={{
    link: LinkRenderer
  }}
/>




/* 마크다운 뷰어 기본 스타일 */
.markdown-body {
  font-size: 13px;
  line-height: 1.6;
  color: #222;
}

/* 표 전체 스타일 */
.markdown-body table {
  border-collapse: collapse;
  width: 100%;
  margin: 16px 0;
  border: 1px solid #d0d7de;      /* 외곽선 */
}

/* 헤더/셀 공통 스타일 */
.markdown-body th,
.markdown-body td {
  border: 1px solid #d0d7de;      /* 셀 테두리 */
  padding: 8px 12px;
  text-align: left;
  vertical-align: middle;
  white-space: nowrap;
}

/* 헤더만 배경색 */
.markdown-body thead tr {
  background-color: #f6f8fa;
  font-weight: 600;
}

/* 짝수 행 줄무늬(선택) */
.markdown-body tbody tr:nth-child(even) {
  background-color: #fafbfc;
}