if (!text || (Array.isArray(text) && text.length === 0)) {
  return <DetailDiv>-</DetailDiv>;
}

if (Array.isArray(text)) {
  const tooltipContent = (
    <>
      {text.map((item, index) => (
        <span key={`tooltip-${index}`}>
          {item}
          <br />
        </span>
      ))}
    </>
  );

  const visibleItems = text.slice(0, 2);
  const hasMore = text.length > 2;

  return (
    <Tooltip title={tooltipContent} placement="bottom">
      <>
        {visibleItems.map((item, index) => (
          <DetailDiv key={`detail-content-${index}`}>
            {item || '-'}
          </DetailDiv>
        ))}

        {hasMore && <DetailDiv>...</DetailDiv>}
      </>
    </Tooltip>
  );
}

return <DetailDiv>{text}</DetailDiv>;