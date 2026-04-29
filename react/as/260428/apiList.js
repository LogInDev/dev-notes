render: (text) => {
  if (!text || (Array.isArray(text) && text.length === 0)) {
    return <DetailLine>-</DetailLine>;
  }

  if (Array.isArray(text)) {
    const visibleItems = text.slice(0, 2);
    const hasMore = text.length > 2;

    return (
      <Tooltip
        placement="bottom"
        title={
          <>
            {text.map((item, index) => (
              <div key={`detail-tooltip-${index}`}>{item || '-'}</div>
            ))}
          </>
        }
      >
        <div>
          {visibleItems.map((item, index) => {
            const isLastVisible = index === visibleItems.length - 1;

            return (
              <DetailLine key={`detail-content-${index}`}>
                <DetailText>{item || '-'}</DetailText>
                {isLastVisible && hasMore && <DetailText>...</DetailText>}
              </DetailLine>
            );
          })}
        </div>
      </Tooltip>
    );
  }

  return <DetailLine>{text || '-'}</DetailLine>;
};
const DetailText = styled.span`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const DetailLine = styled.div`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;