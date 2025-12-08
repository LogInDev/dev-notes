isHttpLink = (url) => {
  if (!url) return false;
  return /^https?:\/\//i.test(url);
};

renderLink = (props) => {
  const { href, children } = props;

  // http/https 아니면 a 태그 만들지 말고 그냥 텍스트로
  if (!this.isHttpLink(href)) {
    return <span>{children}</span>;
  }

  // http/https인 경우: 새 탭으로 열기
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
    </a>
  );
};
renderLinkReference = (props) => {
  const { href, children } = props;

  // reference 형식인데 href가 있고, 그게 http/https면 링크로 인정
  if (this.isHttpLink(href)) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
      >
        {children}
      </a>
    );
  }

  // 그 외 (href 없거나, http/https가 아님) → a 태그 만들지 않음
  return <span>{children}</span>;
};
<ReactMarkdown
  source={markdownText}
  plugins={[remarkGfm]}
  renderers={{
    link: this.renderLink,
    linkReference: this.renderLinkReference,
  }}
/>

