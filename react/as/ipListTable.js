import { useEffect, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';
import { Table } from 'signlw';
import { produce } from 'immer';
import { Resizable } from 'react-resizable';
import NoData from '@/components/Atoms/NoData';
import { intlObj } from '@/utils/commonUtils';
import message from '@/language/message';

/**
 * IP List 전용 테이블 (확장/펼치기 없음)
 *
 * @param {Object} props
 * @param {string|number|Function} props.rowKey
 * @param {Array} props.columns
 * @param {Array} props.data
 * @param {Object|false} [props.pagination=false]
 * @param {React.ReactNode} [props.paginationExtraContent]
 * @param {boolean} [props.placeholderBorder=true]
 * @param {string|number} [props.height]
 * @param {Function} [props.onChange=() => {}]
 * @param {string} [props.className]
 */
const IpListTable = ({
  rowKey,
  columns = [],
  data = [],
  pagination = false, // ✅ IP 리스트는 보통 짧으니 기본 OFF
  paginationExtraContent,
  placeholderBorder = true,
  height,
  onChange = () => {},
  className,
  ...props
}) => {
  const tableRef = useRef(null);

  const [tableColumns, setTableColumns] = useState([]);
  const [tableWidth, setTableWidth] = useState(0);
  const [isInitWidth, setIsInitWidth] = useState(false);

  // 윈도우 resize 감지 → tableWidth 재계산
  useEffect(() => {
    if (!tableRef.current) return;

    const observer = new ResizeObserver(() => {
      const table = tableRef.current.querySelector('.signlw3-table');
      if (!table) return;
      const style = getComputedStyle(table);
      const paddingLeft = parseFloat(style.paddingLeft || 0);
      const paddingRight = parseFloat(style.paddingRight || 0);
      setTableWidth(table.offsetWidth - paddingLeft - paddingRight);
    });

    observer.observe(tableRef.current);
    return () => observer.disconnect();
  }, []);

  // "17%" 같은 width -> px 변환
  const extractIntegerPercentage = (str) => {
    if (typeof str !== 'string') return null;
    const numberStr = str.replace(/[^\d.]/g, '');
    const number = parseFloat(numberStr);
    if (isNaN(number) || !Number.isInteger(number)) return null;
    return number;
  };

  const calcColumnWidth = (cols) => {
    return produce(cols, (draft) => {
      let leftPercentage = 100;
      const noPercentageIdx = [];

      draft.forEach((col, idx) => {
        const p = extractIntegerPercentage(col?.width);
        if (p === null) {
          noPercentageIdx.push(idx);
        } else {
          col.width = (p / 100) * tableWidth;
          leftPercentage -= p;
        }
      });

      // width 없는 컬럼은 남은 퍼센트 균등 분배
      if (noPercentageIdx.length > 0) {
        noPercentageIdx.forEach((idx) => {
          draft[idx].width = (leftPercentage / noPercentageIdx.length / 100) * tableWidth;
        });
      }
    });
  };

  // columns width 초기 세팅
  useEffect(() => {
    if (!isInitWidth && tableWidth) {
      setIsInitWidth(true);
      setTableColumns(calcColumnWidth(columns));
    }
  }, [tableWidth, isInitWidth, columns]);

  // window size 변경 시 width 재계산
  useEffect(() => {
    if (isInitWidth && tableWidth) {
      setTableColumns(calcColumnWidth(columns));
    }
  }, [tableWidth, isInitWidth, columns]);

  // column resize 핸들링 (현재 컬럼과 다음 컬럼의 합을 고정)
  const handleResize =
    (index) =>
    (_, { size }) => {
      setTableColumns((prev) =>
        produce(prev, (draft) => {
          const current = draft[index];
          const next = draft[index + 1];
          if (!current || !next) return;

          const total = current.width + next.width;
          const newCurrent = size.width;
          const newNext = total - newCurrent;

          if (newCurrent < 60 || newNext < 60) return;

          draft[index].width = newCurrent;
          draft[index + 1].width = newNext;
        }),
      );
    };

  const ResizableTitle = (props) => {
    const { onResize, width, resizable, ...restProps } = props;
    if (!width) return <th {...restProps} />;

    return (
      <Resizable
        width={width}
        height={0}
        handle={
          resizable ? (
            <ResizeHandle
              onClick={(e) => {
                e.stopPropagation();
              }}
            />
          ) : (
            <></>
          )
        }
        onResize={onResize}
        draggableOpts={{ enableUserSelectHack: false, grid: [5, 1] }}
      >
        <th {...restProps} />
      </Resizable>
    );
  };

  const mergedColumns = useMemo(() => {
    return produce(columns, (draft) => {
      draft.forEach((col, idx) => {
        col.width = tableColumns[idx]?.width;
        col.onHeaderCell = (c) => ({
          width: c.width,
          onResize: handleResize(idx),
          resizable: c.resize && idx !== columns.length - 1,
        });
      });
    });
  }, [columns, tableColumns]);

  return (
    <Layout ref={tableRef}>
      <StyledTable
        className={className}
        height={height}
        rowKey={rowKey}
        columns={mergedColumns}
        dataSource={data}
        components={{ header: { cell: ResizableTitle } }}
        tableLayout="fixed"
        pagination={
          pagination === false
            ? false
            : {
                showTotal:
                  paginationExtraContent === undefined
                    ? undefined
                    : () => paginationExtraContent,
                ...pagination,
              }
        }
        locale={{
          emptyText: (
            <NoData
              title={'No Data'}
              desc={intlObj.get(message['store.noData'])}
              height={300}
            />
          ),
        }}
        placeholderBorder={placeholderBorder}
        onChange={onChange}
        {...props}
      />
    </Layout>
  );
};

const Layout = styled.div`
  .${({ theme }) => theme.namespace} & {
    .signlw3-pagination {
      position: relative;
      margin: 20px 0 0 0;
      .signlw3-pagination-total-text {
        position: absolute;
        left: 0;
        margin: 0;
      }
    }
  }
`;

const ResizeHandle = styled.span`
  .${({ theme }) => theme.namespace} & {
    position: absolute;
    right: 0;
    top: 50%;
    height: 9px;
    cursor: col-resize;
    width: 12px;
    border-right: 1px solid #aaaaaa;
    transform: translate3d(0, -50%, 0);
  }
`;

const StyledTable = styled(Table)`
  .${({ theme }) => theme.namespace} & {
    &.signlw3-table-wrapper {
      .signlw3-table {
        max-height: ${(props) => (props.height ? `${props.height}px` : 'auto')};
        height: ${(props) => (props.height ? `${props.height}px` : 'auto')};
        overflow: auto;

        .signlw3-table-thead .signlw3-table-cell {
          text-align: center;
          position: relative;
          font-size: 14px;
          font-weight: 400;
          color: #555555;
          padding: 12px 10px;
          background-color: #f2f3fe;
          border-top: 1px solid #9799b2;
          border-bottom: 1px solid #b0b1b5;
        }

        .signlw3-table-tbody {
          background-color: #ffffff;

          .signlw3-table-row .signlw3-table-cell {
            height: 50px;
            font-size: 13px;
            font-weight: 300;
            color: #333333;
            padding: 6px 10px;
            border-bottom: 1px solid #dddddd;
            background-color: #ffffff;
          }

          .signlw3-table-placeholder .signlw3-table-cell {
            border-bottom: ${(props) =>
              props.placeholderBorder === false
                ? 'none'
                : '1px solid #b0b1b5'};
          }
        }
      }
    }
  }
`;

export default IpListTable;