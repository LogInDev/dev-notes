transformDataToMarkdown = (rich) => {
  const allAggregatedChunks = [];
  const masterDedup = new Set();

  const normalize = (s) => {
    if (!s) return '';
    let str = String(s).trim();
    if (!str) return '';
    if (str.includes('해당 답변은 AI가 생성한 답변으로, 정확하지 않을 수 있습니다')) return '';
    return str;
  };

  const dedent = (s) => {
    const lines = s.replace(/\r/g, '').split('\n');
    const indents = lines
      .filter(l => l.trim().length)
      .map(l => l.match(/^\s*/)[0].length);
    const min = indents.length ? Math.min(...indents) : 0;
    return lines.map(l => l.slice(min)).join('\n').trim();
  };

  // 📌 숫자 리스트 + 하위 불릿 정리용
  const normalizeNumberedSections = (text) => {
    const lines = text.split('\n');
    const result = [];

    let inNumberSection = false;

    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];

      // 완전 빈 줄이면 섹션 종료
      if (/^\s*$/.test(line)) {
        inNumberSection = false;
        result.push(line);
        continue;
      }

      // "1. 내용" / "2. 내용" → 숫자 섹션 시작
      if (/^\s*\d+\.\s+/.test(line)) {
        inNumberSection = true;
        result.push(line);
        continue;
      }

      // 숫자 섹션 안에서 나오는 "- 내용" 은 "   - 내용" 으로 들여쓰기해서
      // 숫자 li 안에 들어가는 ul 로 인식되게 함
      if (inNumberSection && /^\s*-\s+/.test(line)) {
        line = '   ' + line.trim(); // 앞에 스페이스 3칸
        result.push(line);
        continue;
      }

      // 그 외는 그대로
      result.push(line);
    }

    return result.join('\n');
  };

  // 📌 "1.내용" → "1. 내용" / "-내용" → "- 내용"으로 교정
  const fixListSpacing = (text) => {
    let out = text;

    // "1.내용" → "1. 내용"
    out = out.replace(/(^|\n)(\d+)\.(\S)/g, '$1$2. $3');

    // "-내용" → "- 내용", "*내용" → "* 내용", "+내용" → "+ 내용"
    out = out.replace(/(^|\n)([-*+])(\S)/g, '$1$2 $3');

    return out;
  };

  // 📌 테이블 내부의 구분선처럼 생긴 행이 GFM 구분선으로 오인되는 것 방지
  // 예: "|--------|----------------------|" 같은 행을 내용으로 살리고 싶을 때
  const fixTableDividerRows = (text) => {
    return text.replace(/^\|[-\s]+\|\s*[-\s]+\|$/gm, (line) => {
      // "|------|------|" 형태를 각 셀을 `코드`로 감싼 내용 행으로 변경
      const cells = line.split('|').slice(1, -1);
      const converted = cells
        .map(c => {
          const trimmed = c.trim();
          if (!trimmed) return ' ';
          return ' `' + trimmed + '` ';
        })
        .join('|');
      return '|' + converted + '|';
    });
  };

  // ===========================
  // 1) rich → 순수 텍스트 추출
  // ===========================
  rich.forEach((content) => {
    let { body } = content;
    const chunks = [];

    body.row.forEach((row) => {
      (row.column || []).forEach(col => {
        if (col && col.type === 'label' && col.control && Array.isArray(col.control.text)) {
          const t = col.control.text[0];
          const n = normalize(t);
          if (n && !masterDedup.has(n)) {
            masterDedup.add(n);
            chunks.push(n);
          }
        }
      });
    });

    allAggregatedChunks.push(...chunks);
  });

  // ===========================
  // 2) 기본 정리 (공백 등)
  // ===========================
  let output = dedent(allAggregatedChunks.join('\n\n'))
    .replace(/\u00A0|\u3000/g, ' ')  // 특수 공백 → 일반 공백
    .replace(/\t/g, '  ')           // 탭 → 공백 2칸
    .replace(/\s+$/gm, '');         // 각 줄 끝쪽 불필요한 공백 제거

  // ===========================
  // 3) 리스트 문법 교정
  // ===========================
  output = fixListSpacing(output);          // "1.내용" / "-내용" 교정
  output = normalizeNumberedSections(output); // 숫자 섹션 안의 "-" 를 들여쓰기해서 하위 ul 처리

  // ===========================
  // 4) 테이블 구분선 문제 방지
  // ===========================
  output = fixTableDividerRows(output);

  return output.trim();
};