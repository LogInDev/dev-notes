import styled, { css } from 'styled-components';
import { toPx } from '@/utils/styleUtils';

/**
 * 분할 레이아웃 컴포넌트
 * @param {Object} props - 컴포넌트 props
 * @param {boolean} [props.flex=false] - Flexbox 사용 여부
 * @param {string} [props.flexWrap] - flex-wrap 속성
 * @param {string} [props.flexFlow] - flex-flow 속성
 * @param {string} [props.justifyContent] - justify-content 속성
 * @param {string} [props.alignItems] - align-items 속성
 * @param {number|string} [props.gap] - gap 속성
 * @param {boolean} [props.border=false] - 테두리 표시 여부
 * @param {number|string} [props.borderRadius] - 테두리 반경
 * @param {string} [props.borderColor] - 테두리 색상
 * @param {number|string} [props.mt] - 상단 마진
 * @param {number|string} [props.mr] - 우측 마진
 * @param {number|string} [props.mb] - 하단 마진
 * @param {number|string} [props.ml] - 좌측 마진
 * @param {number|string} [props.pt] - 상단 패딩
 * @param {number|string} [props.pr] - 우측 패딩
 * @param {number|string} [props.pb] - 하단 패딩
 * @param {number|string} [props.pl] - 좌측 패딩
 * @param {number|string} [props.width] - 너비
 * @param {number|string} [props.minWidth] - 최소 너비
 * @param {number|string} [props.maxWidth] - 최대 너비
 * @param {number|string} [props.height] - 높이
 * @param {number|string} [props.minHeight] - 최소 높이
 * @param {number|string} [props.maxHeight] - 최대 높이
 * @param {React.ReactNode} [props.children] - 자식 요소
 * @param {Object} [props.style] - 인라인 스타일
 */
const Division = ({
  flex,
  flexWrap,
  flexFlow,
  justifyContent,
  alignItems,
  gap,
  border,
  borderRadius,
  borderColor,
  mt,
  mr,
  mb,
  ml,
  pt,
  pr,
  pb,
  pl,
  width,
  minWidth,
  maxWidth,
  height,
  minHeight,
  maxHeight,
  children,
  style,
  ...props
}) => {
  return (
    <DivisionLayout
      flex={flex}
      flexWrap={flexWrap}
      flexFlow={flexFlow}
      justifyContent={justifyContent}
      alignItems={alignItems}
      gap={gap}
      border={border}
      borderRadius={borderRadius}
      borderColor={borderColor}
      mt={mt}
      mr={mr}
      mb={mb}
      ml={ml}
      pt={pt}
      pr={pr}
      pb={pb}
      pl={pl}
      width={width}
      minWidth={minWidth}
      maxWidth={maxWidth}
      height={height}
      minHeight={minHeight}
      maxHeight={maxHeight}
      style={style}
      {...props}
    >
      {children}
    </DivisionLayout>
  );
};

export default Division;

/**
 * 분할 레이아웃 제목 컴포넌트
 * @param {Object} props - 컴포넌트 props
 * @param {React.ReactNode} [props.children] - 제목 내용
 */
Division.Title = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: #333333;
`;

/**
 * 분할 레이아웃 부제목 컴포넌트
 * @param {Object} props - 컴포넌트 props
 * @param {React.ReactNode} [props.children] - 부제목 내용
 */
Division.SubTitle = styled.div`
  font-size: 14px;
  font-weight: 400;
  color: #333333;
`;

const flexStyle = css`
  display: flex;
  flex-wrap: ${(props) => props.flexWrap || ''};
  flex-flow: ${(props) => props.flexFlow || ''};
  justify-content: ${(props) => props.justifyContent || ''};
  align-items: ${(props) => props.alignItems || ''};
  gap: ${(props) => toPx(props.gap)};
`;

const borderStyle = css`
  border: 1px solid;
  border-radius: ${(props) => toPx(props.borderRadius)};
  border-color: ${(props) => props.borderColor || ''};
`;

const DivisionLayout = styled.div`
  .${({ theme }) => theme.namespace} & {
    position: relative;
    ${(props) => props.flex === true && flexStyle}
    ${(props) => props.border === true && borderStyle}
    margin-top: ${(props) => toPx(props.mt)};
    margin-right: ${(props) => toPx(props.mr)};
    margin-bottom: ${(props) => toPx(props.mb)};
    margin-left: ${(props) => toPx(props.ml)};
    padding-top: ${(props) => toPx(props.pt)};
    padding-right: ${(props) => toPx(props.pr)};
    padding-bottom: ${(props) => toPx(props.pb)};
    padding-left: ${(props) => toPx(props.pl)};
    width: ${(props) => toPx(props.width)};
    min-width: ${(props) => toPx(props.minWidth)};
    max-width: ${(props) => toPx(props.maxWidth)};
    height: ${(props) => toPx(props.height)};
    min-height: ${(props) => toPx(props.minHeight)};
    max-height: ${(props) => toPx(props.maxHeight)};
  }
`;
