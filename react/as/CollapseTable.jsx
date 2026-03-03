import { useEffect, useRef, useState, useMemo } from 'react';
import styled from 'styled-components';
import { Table } from 'signlw';
import { produce } from 'immer';
import { Resizable } from 'react-resizable';
import { intlObj } from '@/utils/commonUtils';
import message from '@/language/message';
import NoData from '@/components/Atoms/NoData';

/**
 * @typedef {React.ComponentProps<typeof Table> HdsTableProps} HdsTableProps
 */

/**
 * @typedef {Object} CollapseTableProps
 * @property {string|number|Function} props.rowKey - 각 행의 고유 키
 * @property {Array} [props.columns=[]] - 테이블 컬럼 정의 배열
 * @property {Array} [props.data=[]] - 표시할 데이터 배열
 * @property {Object|false} [props.pagination={}] - 페이징 설정 객체 (false면 pagination off)
 * @property {React.ReactNode} [props.paginationExtraContent] - 페이지네이션 왼쪽 영역에 추가될 내용
 * @property {boolean} [props.placeholderBorder=true] - placeholder 테두리 표시 여부
 * @property {string|number} [props.height] - 테이블 높이
 * @property {Function} [props.onChange=() => {}] - Table onChange 이벤트 핸들러
 * @property {string} [props.className] - 추가 CSS 클래스 이름
 * @property {boolean} [props.expandable=false] - [CHANGED] 펼치기 기능 사용 여부 (기본 false)
 */
/**
 * @typedef {CollapseTableProps & Omit<HdsTableProps, keyof CollapseTableProps>} MergedProps
 */

// 퍼센트 문자열에서 숫자만 추출
const extractIntegerPercentage = (str) => {
  if (typeof str !== 'string') return null;

  const numberStr = str.replace(/[^\d.]/g, '');
  const number = parseFloat(numberStr);

  if (isNaN(number) || !Number.isInteger(number)) {
    return null;
  }

  return number;
};

const ResizableTitle = (props) => {
  const { onResize, width, resizable, ...restProps } = props;

  // [CHANGED] expand icon cell 예외처리 삭제 (expandable을 기본 OFF로 바꿨기 때문)
  if (!width) {
    return <th {...restProps} />;
  }

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

/**
 * 확장형(기본은 일반) 테이블 컴포넌트
 * @param {MergedProps} props
 */
const CollapseTable = ({
  rowKey,
  columns = [],
  data = [],
  pagination = {},
  paginationExtraContent,
  placeholderBorder = true,
  height,
  onChange = () => {},
  className,
  expandable = false, // [CHANGED] 기본값 false
  ...props
}) => {
  const tableRef = useRef(null);

  const [tableColumns, setTableColumns] = useState([]);
  const [tableWidth, setTableWidth] = useState(0);
  const [isInitWidth, setIsInitWidth] = useState(false);
  const [existFilteredData, setExistFilteredData] = useState(undefined);

  const classNames = useMemo(() => {
    const list = className ? [className] : [];
    if (existFilteredData === false) {
      list.push('filtered-empty');
    } else {
      const targetIndex = list.indexOf('filtered-empty');
      if (targetIndex > -1) {
        list.splice(targetIndex, 1);
      }
    }
    return list.join(' ');
  }, [className, existFilteredData]);

  // 윈도우 resize 감지
  useEffect(() => {
    if (!tableRef.current) return;

    const observer = new ResizeObserver(() => {
      const table = tableRef.current.querySelector('.signlw3-table');
      if (!table) return;

      const style = getComputedStyle(table);
      const paddingLeft = parseFloat(style.paddingLeft);
      const paddingRight = parseFloat(style.paddingRight);
      const w = table.offsetWidth - paddingLeft - paddingRight;
      setTableWidth(w);
    });

    observer.observe(tableRef.current);
    return () => observer.disconnect();
  }, []);

  // columns width 계산 (% -> px)
  const calcColumnWidth = (cols) => {
    const nextData = produce(cols, (draft) => {
      let leftPercentage = 100;
      let noPercentageIndexs = [];
      let columnIndex = 0;

      for (const column of draft) {
        const width = column?.width;
        const percentage = extractIntegerPercentage(width);
        if (percentage === null) {
          noPercentageIndexs.push(columnIndex);
        } else {
          column.width = (percentage / 100) * tableWidth;
          leftPercentage -= percentage;
        }
        columnIndex += 1;
      }

      for (const index of noPercentageIndexs) {
        draft[index].width =
          (leftPercentage / noPercentageIndexs.length / 100) * tableWidth;
      }

      // [CHANGED] expandable 아이콘 영역(48px) 보정 삭제
      // if (draft[0]) draft[0].width = draft[0].width - 48;
    });
    return nextData;
  };

  // columns width 초기 세팅
  useEffect(() => {
    if (!isInitWidth) {
      if (tableRef.current && tableWidth) {
        const nextData = calcColumnWidth(columns);
        setIsInitWidth(true);
        setTableColumns(nextData);
      }
    }
  }, [tableWidth, columns, isInitWidth]);

  // window size 변경 시 columns width 재계산
  useEffect(() => {
    if (isInitWidth) {
      const nextData = calcColumnWidth(columns);
      setTableColumns(nextData);
    }
  }, [tableWidth, isInitWidth, columns]);

  // column resize 시 핸들링
  const handleResize =
    (index) =>
    (e, { size }) => {
      setTableColumns((prevCols) =>
        produce(prevCols, (draft) => {
          const current = draft[index];
          const next = draft[index + 1];
          if (!next) return;

          const totalWidth = current.width + next.width;
          const newCurrentWidth = size.width;
          const newNextWidth = totalWidth - newCurrentWidth;
          if (newCurrentWidth < 50 || newNextWidth < 50) return;

          draft[index].width = newCurrentWidth;
          draft[index + 1].width = newNextWidth;
        }),
      );
    };

  // resize 핸들러가 붙은 columns
  const mergedColumns = useMemo(() => {
    const nextData = produce(columns, (draft) => {
      draft.forEach((column, index) => {
        // [CHANGED] expandable 보정(colSpan) 삭제
        column.width = tableColumns[index]?.width;
        column.onHeaderCell = (col) => {
          return {
            width: col.width,
            onResize: handleResize(index),
            resizable: col.resize && index !== columns.length - 1,
          };
        };
      });
    });
    return nextData;
  }, [columns, tableColumns]);

  // onChange 이벤트 핸들링
  const handleOnChange = (pagination, filters, sorter, extra) => {
    if (extra?.action === 'filter') {
      setExistFilteredData(extra?.currentDataSource?.length !== 0);
    }
    onChange(pagination, filters, sorter, extra);
  };

  return (
    <CollapseTableLayout ref={tableRef}>
      <StyledTable
        className={classNames}
        height={height}
        rowKey={rowKey}
        columns={mergedColumns}
        dataSource={data}
        components={{ header: { cell: ResizableTitle } }}
        // [CHANGED] 펼치기 기능 기본 OFF
        expandable={
          expandable
            ? {
                expandRowByClick: true,
                expandedRowRender: (record) => record.expandedArea,
                rowExpandable: (record) => record.expandable !== false,
                expandedRowClassName: () => `expanded-row-wrap`,
              }
            : undefined
        }
        tableLayout={'fixed'}
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
        onChange={(pagination, filters, sorter, extra) =>
          handleOnChange(pagination, filters, sorter, extra)
        }
        {...props}
      />
    </CollapseTableLayout>
  );
};

const CollapseTableLayout = styled.div`
  .${({ theme }) => theme.namespace} & {
    .signlw3-pagination {
      position: relative;
      margin: 20px 0 0 0;
      .signlw3-pagination-total-text {
        position: absolute;
        left: 0;
        margin: 0;
      }
      .signlw3-pagination-prev,
      .signlw3-pagination-prev10,
      .signlw3-pagination-next,
      .signlw3-pagination-next10 {
        border-radius: 8px;
        border: 1px solid #e0e0e0;
        background: #ffffff;
        background-repeat: no-repeat;
        background-position: center;
        width: 30px;
        height: 30px;

        &:hover {
          .signlw3-pagination-item-link {
            border: none;
          }
        }
        .anticon {
          display: none;
        }
      }
      .signlw3-pagination-item {
        font-size: 14px;
        font-weight: 300;
        color: #555555;
        border-radius: 8px;
        min-width: 30px;
        height: 30px;
        &:hover,
        &-active {
          border: 1px solid #5630f0;
          background: rgba(233, 242, 253, 0.3);
          color: #5630f0;
        }
        a {
          font-size: 14px;
          line-height: 28px;
          padding: 0 6px;
        }
      }
    }

    .in-popup.signlw3-table-wrapper {
      .signlw3-table {
        padding: 0 20px;
        margin-right: 1px;
        margin-top: 10px;
      }
      .signlw3-pagination {
        margin: 20px;
      }
      &.filtered-empty,
      .signlw3-table-empty {
        margin-bottom: 70px;
      }
    }
  }
`;

const StyledTable = styled(Table)`
  .${({ theme }) => theme.namespace} & {
    &.signlw3-table-wrapper {
      .signlw3-table {
        max-height: ${(props) => (props.height ? `${props.height}px` : 'auto')};
        height: ${(props) => (props.height ? `${props.height}px` : 'auto')};
        overflow: auto;
        scrollbar-color: unset;

        .signlw3-table-body {
          overflow-x: hidden;
          &::-webkit-scrollbar {
            width: 6px;
          }
          &::-webkit-scrollbar-thumb {
            background-color: #cccccc;
            border-radius: 10px;
          }
          &::-webkit-scrollbar-track {
            background: #ffffff;
          }
          &::-webkit-scrollbar-button {
            display: none;
          }
        }

        .signlw3-table-thead {
          .signlw3-table-cell {
            text-align: center;
            position: relative;
            font-size: 14px;
            font-weight: 400;
            color: #555555;
            padding: 12px 10px;
            background-color: #f2f3fe;
            border-top: 1px solid #9799b2;
            border-bottom: 1px solid #b0b1b5;

            &.signlw3-table-cell-scrollbar {
              box-shadow: none;
            }

            .signlw3-table-column-sorters {
              display: flex;
              align-items: center;
              justify-content: space-between;
              min-width: 0;
              padding: 0;

              .signlw3-table-column-title {
                flex: 1;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
              }
            }
          }
          tr > {
            th {
              &:not(:first-child):before {
                display: none;
              }
            }
          }
        }

        .signlw3-table-tbody {
          background-color: #ffffff;

          .signlw3-table-row {
            &:last-child {
              .signlw3-table-cell {
                border-bottom: 1px solid #b0b1b5;
              }
            }

            .signlw3-table-cell {
              height: 50px;
              font-size: 13px;
              font-weight: 300;
              color: #333333;
              padding: 6px 10px;
              border-bottom: 1px solid #dddddd;
              background-color: #ffffff;
              &-row-hover {
                background-color: #ffffff;
                &::before {
                  display: none;
                }
              }
            }
          }

          .signlw3-table-placeholder {
            .signlw3-table-cell {
              border-bottom: ${(props) =>
                props.placeholderBorder === false
                  ? 'none'
                  : '1px solid #b0b1b5'};
            }
          }
        }
      }
    }
  }
`;

export default CollapseTable;