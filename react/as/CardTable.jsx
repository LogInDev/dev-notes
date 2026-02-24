import { useMemo, Fragment } from 'react';
import styled, { css } from 'styled-components';
import { Spin } from 'signlw';
import Card from './card';
import Pagination from '../Pagination';

/**
 * 카드 형태 테이블 컴포넌트
 * @param {Object} props - 컴포넌트 props
 * @param {boolean} [props.loading=false] - 로딩 상태
 * @param {Array} [props.data=[]] - 표시할 데이터 배열
 * @param {string|number} [props.expandedCardKey] - 확장된 카드의 키
 * @param {number} [props.page=1] - 현재 페이지 번호
 * @param {number} [props.pageSize=9] - 페이지당 항목 수
 * @param {Function} [props.onPageChange=() => {}] - 페이지 변경 핸들러
 * @param {React.ReactNode} [props.paginationExtraContent] - 페이지네이션 왼쪽 영역에 추가될 내용
 * @param {React.ReactNode} [props.emptyText] - 데이터가 없을 때 표시할 텍스트
 */
const CardTable = ({
  loading = false,
  data = [],
  expandedCardKey,
  page = 1,
  pageSize = 9,
  onPageChange = () => {},
  paginationExtraContent,
  emptyText,
}) => {
  const pagingList = useMemo(
    () => data.slice((page - 1) * pageSize, page * pageSize),
    [data, page, pageSize],
  );

  // list 값을 3개씩 나누어 저장
  const chunkedList = useMemo(() => {
    const result = [];
    for (let i = 0; i < pagingList.length; i += 3) {
      const chunk = pagingList.slice(i, i + 3);
      result.push(chunk);
    }
    return result;
  }, [pagingList]);

  return (
    <Spin spinning={loading}>
      {data.length === 0 && emptyText
        ? emptyText
        : chunkedList.map((chunk, chunkIndex) => {
            const expanded = chunk.find(
              (item) =>
                item?.key !== undefined && item?.key === expandedCardKey,
            );
            return (
              <Fragment key={chunkIndex.toString()}>
                <CardListLayout>
                  {chunk.map((value) => (
                    <CardApiWrapper
                      key={value.key}
                      isActive={expandedCardKey === value.key}
                    >
                      <Card
                        category={value?.category}
                        title={value?.title}
                        subTitle={value?.subTitle}
                        description={value?.description}
                        subNorYn={value?.subNorYn}
                        vwCnt={value?.vwCnt}
                        subCount={value?.subCount}
                        extra={value?.extra}
                        onClick={() => value?.onClick(value.key)}
                        style={value?.style}
                      />
                    </CardApiWrapper>
                  ))}
                </CardListLayout>
                {expanded && (
                  <CenteredTableContainer>
                    {expanded.expandedArea}
                  </CenteredTableContainer>
                )}
              </Fragment>
            );
          })}
      <Pagination
        current={page}
        total={data.length}
        pageSize={pageSize}
        onChange={onPageChange}
        showAllItems={true}
        paginationExtraContent={paginationExtraContent}
      />
    </Spin>
  );
};

export default CardTable;

const CardListLayout = styled.div`
  .${({ theme }) => theme.namespace} & {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-start;
    gap: 12px;
    align-items: center;
    margin-bottom: 10px;
  }
`;

const CardApiWrapper = styled.div`
  .${({ theme }) => theme.namespace} & {
    width: calc(33.3% - 8px);
    position: relative;
    border-radius: 16px;
    box-sizing: border-box;
    cursor: pointer;
    z-index: 1;
    border: 1px solid #e0e0e0;

    ${(props) =>
      props.isActive
        ? css`
            background: #f2f3fe;
            border: 1px solid #5630f0;

            &::before {
              content: '';
              display: inline-block;
              position: absolute;
              width: 100%;
              height: 100%;
              left: 50%;
              bottom: 0;
              border-radius: 16px;
              z-index: -1;
              transform: translate(-50%, 0);
              box-shadow:
                0px 9px 20px rgba(86, 48, 240, 0.2),
                0 0px 12px rgba(86, 48, 240, 0.01);
            }
          `
        : ''}

    &:hover {
      background: #f2f3fe;
      border: 1px solid #5630f0;

      &::before {
        content: '';
        display: inline-block;
        position: absolute;
        width: 100%;
        height: 100%;
        left: 50%;
        bottom: 0;
        border-radius: 16px;
        z-index: -1;
        transform: translate(-50%, 0);
        box-shadow:
          0px 9px 20px rgba(86, 48, 240, 0.2),
          0 0px 12px rgba(86, 48, 240, 0.01);
      }
    }
  }
`;

const CenteredTableContainer = styled.div`
  .${({ theme }) => theme.namespace} & {
    margin: 20px 0;
    padding: 15px;
    border-radius: 16px;
    border: 1px solid #5630f0;
  }
`;
