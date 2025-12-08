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