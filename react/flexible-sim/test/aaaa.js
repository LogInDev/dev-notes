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