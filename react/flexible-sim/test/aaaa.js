// 숫자 리스트 / 불릿 리스트 구분해서 그려주는 list 렌더러
ListRenderer = (props) => {
  const { ordered, children } = props;
  const Tag = ordered ? 'ol' : 'ul';

  return (
    <Tag className={ordered ? 'md-ol' : 'md-ul'}>
      {children}
    </Tag>
  );
};

const fixListSpacing = (text) => {
  let out = text;

  // 1.내용 → 1. 내용
  out = out.replace(/(^|\n)(\d+)\.(\S)/g, '$1$2. $3');

  // -내용 / *내용 / +내용 → "- 내용" 스타일로
  out = out.replace(/(^|\n)([-*+])(\S)/g, '$1$2 $3');

  // 문장 바로 다음 줄에 오는 번호 목록 앞에 빈 줄 하나 추가
  // "문장\n1. ..." → "문장\n\n1. ..."
  out = out.replace(/([^\n])\n(\d+\.\s+)/g, '$1\n\n$2');

  return out;
};

// li는 그대로
ListItemRenderer = (props) => {
  return <li>{props.children}</li>;
};

<ReactMarkdown
  source={markdownText}
  plugins={[remarkGfm]}
  renderers={{
    list: this.ListRenderer,
    listItem: this.ListItemRenderer,
    link: this.renderLink,              // 네가 이미 만든 커스텀 링크 렌더러
    linkReference: this.renderLinkReference,
  }}
/>