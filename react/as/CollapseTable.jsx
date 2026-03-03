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
 * @property {string|number} props.rowKey - 각 행의 고유 키
 * @property {Array} [props.columns=[]] - 테이블 컬럼 정의 배열
 * @property {Array} [props.data=[]] - 표시할 데이터 배열
 * @property {Object} [props.pagination={}] - 페이징 설정 객체
 * @property {React.ReactNode} [props.paginationExtraContent] - 페이지네이션 왼쪽 영역에 추가될 내용
 * @property {boolean} [props.placeholderBorder=true] - placeholder 테두리 표시 여부
 * @property {string|number} [props.height] - 테이블 높이
 * @property {Function} [props.onChange=() => {}] - HDS Table onChange 이벤트 핸들러
 * @property {string} [props.className] - 추가 CSS 클래스 이름
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

  // expandable 인 경우 헤더에서 아이콘이 차지하는 영역 제거
  if (props.className?.includes('signlw3-table-row-expand-icon-cell')) {
    return <></>;
  }

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
    /* transform: translate3d(50%, 0, 0); */
    /* 
  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 50%;
    background-color: #aaaaaa;
    width: 1px;
    height: 100%;
    transform: translate3d(-50%, 0, 0);
  } */
  }
`;

const ExpandedRow = ({ expanded, children }) => {
  const elementRef = useRef(null);
  const [height, setHeight] = useState(0);

  const getTotalHeight = (element) => {
    if (!element) return 0;
    const style = getComputedStyle(element);
    const marginTop = parseFloat(style.marginTop || 0);
    const marginBottom = parseFloat(style.marginBottom || 0);

    return element.offsetHeight + marginTop + marginBottom;
  };

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const resizeObs = new ResizeObserver(() => {
      const tH = getTotalHeight(element);
      setHeight(tH);
    });
    resizeObs.observe(element);
    return () => resizeObs.disconnect();
  }, []);

  return (
    <StyledExpandedRow
      height={height}
      className={`${expanded ? 'expanded' : 'not-expanded'}`}
    >
      <div
        ref={elementRef}
        style={{
          overflow: 'hidden',
          // padding: '15px',
          // borderBottom: '1px solid #E1E1E6',
        }}
      >
        {children}
      </div>
    </StyledExpandedRow>
  );
};

/**
 * 확장형 테이블 컴포넌트
 * @param {MergedProps} props - 컴포넌트 props
 * @param {string|number} props.rowKey - 각 행의 고유 키
 * @param {Array} [props.columns=[]] - 테이블 컬럼 정의 배열
 * @param {Array} [props.data=[]] - 표시할 데이터 배열
 * @param {Object} [props.pagination={}] - 페이징 설정 객체
 * @param {React.ReactNode} [props.paginationExtraContent] - 페이지네이션 왼쪽 영역에 추가될 내용
 * @param {boolean} [props.placeholderBorder=true] - placeholder 테두리 표시 여부
 * @param {string|number} [props.height] - 테이블 높이
 * @param {Function} [props.onChange=() => {}] - HDS Table onChange 이벤트 핸들러
 * @param {string} [props.className] - 추가 CSS 클래스 이름
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
      const style = getComputedStyle(table);
      const paddingLeft = parseFloat(style.paddingLeft);
      const paddingRight = parseFloat(style.paddingRight);
      const tableWidth = table.offsetWidth - paddingLeft - paddingRight;
      setTableWidth(tableWidth);
    });
    observer.observe(tableRef.current);
    return () => observer.disconnect();
  }, []);

  // columns width 값 게산 (% 로 들어오는 값들을 px 단위로 변환)
  const calcColumnWidth = (columns) => {
    const nextData = produce(columns, (draft) => {
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
      if (draft[0]) draft[0].width = draft[0].width - 48;
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
  }, [tableRef.current, tableWidth, columns]);

  // 추후 window size 가 변경 될 때 columns width 재계산
  useEffect(() => {
    if (isInitWidth) {
      const nextData = calcColumnWidth(columns);
      setTableColumns(nextData);
    }
  }, [tableWidth]);

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
        // expandable 인 경우 헤더에서 아이콘이 차지하는 영역 제거된 만큼 첫번 째 행이 차지
        if (props?.expandable !== false && index === 0) column.colSpan = 2;
        // columns 가 업데이트 되더라도 width는 기존 값 유지
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
  }, [columns, props?.expandable, tableColumns]);

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
        rowClassName={(record, index) =>
          record.expandable !== false ? 'expandable-row' : 'not-expandable-row'
        }
        columns={mergedColumns}
        dataSource={data}
        components={{ header: { cell: ResizableTitle } }}
        expandable={{
          expandRowByClick: true,
          expandedRowRender: (record, _, __, expanded) => (
            <ExpandedRow expanded={expanded}>{record.expandedArea}</ExpandedRow>
          ),
          rowExpandable: (record) => record.expandable !== false,
          expandedRowClassName: () => `expanded-row-wrap`,
        }}
        tableLayout={'fixed'}
        pagination={
          pagination === false
            ? false
            : {
                showTotal:
                  paginationExtraContent === undefined
                    ? undefined
                    : () => {
                        return paginationExtraContent;
                      },
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
      .signlw3-pagination-prev {
        margin: 0 8px 0 4px;
        background-size: 20%;
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='5.292' height='9.335' viewBox='0 0 5.292 9.335'%3E%3Cg id='그룹_5189' data-name='그룹 5189' transform='translate(-11.875 -8.116)'%3E%3Cpath id='패스_5685' data-name='패스 5685' d='M11.783,9,8,12.784l3.783,3.784' transform='translate(4.5)' fill='none' stroke='%23777' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.25'/%3E%3C/g%3E%3C/svg%3E%0A");
      }
      .signlw3-pagination-prev10 {
        background-size: 40%;
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10.599' height='9.335' viewBox='0 0 10.599 9.335'%3E%3Cg id='그룹_5189' data-name='그룹 5189' transform='translate(0.625 0.884)'%3E%3Cpath id='패스_5685' data-name='패스 5685' d='M11.784,9,8,12.784l3.784,3.784' transform='translate(-2.694 -9)' fill='none' stroke='%23777' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.25'/%3E%3Cpath id='패스_5686' data-name='패스 5686' d='M16.784,9,13,12.784l3.784,3.784' transform='translate(-13 -9)' fill='none' stroke='%23777' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.25'/%3E%3C/g%3E%3C/svg%3E%0A");
      }
      .signlw3-pagination-next {
        margin: 0 4px 0 8px;
        background-size: 20%;
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='5.293' height='9.335' viewBox='0 0 5.293 9.335'%3E%3Cg id='그룹_5189' data-name='그룹 5189' transform='translate(-11.615 -8.116)'%3E%3Cpath id='패스_5685' data-name='패스 5685' d='M8,9l3.784,3.784L8,16.567' transform='translate(4.499)' fill='none' stroke='%23777' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.25'/%3E%3C/g%3E%3C/svg%3E%0A");
      }
      .signlw3-pagination-next10 {
        background-size: 40%;
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10.599' height='9.335' viewBox='0 0 10.599 9.335'%3E%3Cg id='그룹_5189' data-name='그룹 5189' transform='translate(-8.116 -8.116)'%3E%3Cpath id='패스_5685' data-name='패스 5685' d='M8,9l3.784,3.784L8,16.567' transform='translate(1)' fill='none' stroke='%23777' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.25'/%3E%3Cpath id='패스_5686' data-name='패스 5686' d='M13,9l3.784,3.784L13,16.567' transform='translate(1.306)' fill='none' stroke='%23777' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.25'/%3E%3C/g%3E%3C/svg%3E%0A");
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

const StyledExpandedRow = styled.div`
  .${({ theme }) => theme.namespace} & {
    overflow: hidden;
    transition: height 0.3s ease-out;
    background-color: rgba(233, 242, 253, 0.3);

    &.expanded {
      height: ${(props) => props?.height || 0}px;
    }
    &.not-expanded {
      height: 0;
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
            scroll-margin-top: 64px;
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

            // filter css
            .signlw3-table-filter-column {
              .signlw3-dropdown-btn {
                display: block;
                position: unset;
                transform: translateY(-5%);
              }
            }
            // sorters css
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

              .signlw3-table-column-sorter {
                margin-left: 0;
                margin-top: -4.4px;
                display: block;
                transform: unset;
                position: static;
                width: unset;
                height: unset;

                &-up {
                  color: #777777;
                  &.active {
                    color: #000000;
                  }
                }
                &-down {
                  color: #777777;
                  &.active {
                    color: #000000;
                  }
                }
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

            &.expandable-row {
              cursor: pointer;
              .signlw3-table-row-expand-icon {
                transition: transform 0.3s ease;
              }
              .signlw3-table-row-expand-icon-expanded {
                transform: rotate(-180deg);
              }
            }

            &.not-expandable-row {
              .signlw3-table-row-expand-icon-cell {
                display: none;
              }
            }
          }
          .expanded-row-wrap {
            display: table-row !important;
            .signlw3-table-cell {
              background-color: #ffffff;
              padding: 0;
              border: none;
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
