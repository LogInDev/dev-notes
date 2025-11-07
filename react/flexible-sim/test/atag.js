<ReactMarkdown
  children={content}
  remarkPlugins={[remarkGfm]}
  rehypePlugins={[rehypeRaw]}
  linkTarget="_blank"
  linkRel="noopener noreferrer"
/>

<ReactMarkdown
  children={content}
  remarkPlugins={[remarkGfm]}
  rehypePlugins={[rehypeRaw]}
  components={{
    a({ node, href, children, ...props }) {
      const isInternal = href && /^\/(?!\/)/.test(href); // "/path" 형태
      if (isInternal) {
        return <a href={href} {...props}>{children}</a>;
      }
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          {...props}
        >
          {children}
        </a>
      );
    },
  }}
/>

components={{
  a({ node, href, children, ...props }) {
    const onClick = (e) => {
      // 상위 preventDefault를 피하려면 여기서 전파 중단
      e.stopPropagation();
    };
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={onClick}
        {...props}
      >
        {children}
      </a>
    );
  },
}}

<ReactMarkdown
  source={content}
  renderers={{
    link: (props) => (
      <a href={props.href} target="_blank" rel="noopener noreferrer">
        {props.children}
      </a>
    ),
  }}
/>
